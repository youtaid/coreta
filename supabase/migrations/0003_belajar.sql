-- Migrasi 0003: data belajar (Fase 32).
-- Tabel: assignments, attempts, ink_sessions, hints_shown, hint_reports, mastery, daily_activity,
-- weekly_reports; bucket Storage privat "ink" beserta kebijakannya. Semua tabel memakai RLS.
-- Migrasi lama (0001, 0002) tidak diubah.
--
-- Prinsip akses (melanjutkan 0001):
--   * anon tidak punya akses apa pun.
--   * Klien (siswa, orang tua, admin) hanya MEMBACA tabel-tabel ini. Tidak ada hak INSERT, UPDATE,
--     atau DELETE untuk anon dan authenticated di tabel mana pun pada migrasi ini.
--   * Semua penulisan berjalan di server dengan service_role:
--       - attempts, hints_shown      -> POST /api/attempts (Fase 38): skor dihitung server, tidak
--                                        pernah dikirim klien.
--       - ink_sessions               -> POST /api/ink/complete (Fase 39), setelah baris attempts ada.
--       - hint_reports               -> POST /api/hint-reports dan resolve admin (Fase 44).
--       - assignments, mastery, daily_activity, weekly_reports -> worker (Fase 42, 51).
--   * Siswa membaca data miliknya; orang tua membaca data anak yang terhubung lewat guardianships;
--     admin membaca semuanya.
--   * Pengecualian penulisan dari klien: siswa boleh MENGUNGGAH berkas coretan ke folder miliknya
--     sendiri di bucket "ink" (tidak bisa mengubah atau menghapusnya).
--
-- Integritas yang dijaga database (bukan hanya kode server):
--   * Kunci asing komposit (…, student_id) memastikan percobaan, coretan, petunjuk, dan laporan
--     selalu milik siswa yang sama dengan penugasannya. Server yang keliru pun tidak bisa
--     menempelkan data siswa A ke penugasan siswa B.
--   * attempts.id berasal dari klien (kunci antrean offline). Kunci utama membuat pengiriman ulang
--     tidak pernah menggandakan baris; server memakai INSERT … ON CONFLICT (id) DO NOTHING.

-- ---------------------------------------------------------------------------------------------
-- Fungsi bantu
-- ---------------------------------------------------------------------------------------------
-- students.id milik pengguna yang sedang masuk; null bila ia bukan siswa.
create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.students s where s.profile_id = auth.uid();
$$;

-- Boleh membaca folder Storage "{student_id}/…"? Pemilik folder, orang tuanya, atau admin.
-- Menerima teks (nama folder apa adanya) agar nama yang bukan UUID tidak memicu galat cast.
create or replace function public.can_read_student_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1
      from public.students s
      where s.id::text = folder
        and (
          s.profile_id = auth.uid()
          or exists (
            select 1 from public.guardianships g
            where g.student_id = s.id and g.parent_id = auth.uid()
          )
        )
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

revoke all on function public.current_student_id() from public, anon;
revoke all on function public.can_read_student_folder(text) from public, anon;
grant execute on function public.current_student_id() to authenticated;
grant execute on function public.can_read_student_folder(text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default public.uuid_generate_v7(),
  student_id uuid not null references public.students (id) on delete cascade,
  worksheet_id uuid not null references public.worksheets (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Satu penugasan per worksheet per siswa: worker yang mengulang tidak menggandakan penugasan.
  unique (student_id, worksheet_id),
  -- Sasaran kunci asing komposit dari attempts.
  unique (id, student_id),
  check (completed_at is null or completed_at >= assigned_at)
);
create index assignments_worksheet_id_idx on public.assignments (worksheet_id);

create table public.attempts (
  -- Dibuat klien (UUID v7) saat siswa menekan Kirim, sama dengan kunci outbox di perangkat.
  id uuid primary key,
  student_id uuid not null,
  item_id uuid not null references public.items (id) on delete restrict,
  assignment_id uuid not null,
  try_no smallint not null default 1 check (try_no between 1 and 20),
  answer jsonb not null,
  score numeric(5, 4) not null check (score between 0 and 1),
  -- Waktu kirim menurut perangkat (bisa jauh lebih awal bila offline) dan waktu diterima server.
  submitted_at timestamptz not null,
  received_at timestamptz not null default now(),
  duration_ms integer not null check (duration_ms >= 0),
  foreign key (assignment_id, student_id)
    references public.assignments (id, student_id) on delete cascade,
  -- Satu baris per percobaan ke-n untuk butir yang sama dalam satu penugasan.
  unique (assignment_id, item_id, try_no),
  -- Sasaran kunci asing komposit dari ink_sessions, hints_shown, hint_reports.
  unique (id, student_id),
  unique (id, student_id, item_id),
  -- Jam perangkat yang maju tidak bisa dipakai menggeser aktivitas ke hari mendatang.
  check (submitted_at <= received_at + interval '5 minutes')
);
create index attempts_student_submitted_idx on public.attempts (student_id, submitted_at);
create index attempts_item_id_idx on public.attempts (item_id);

create table public.ink_sessions (
  id uuid primary key default public.uuid_generate_v7(),
  attempt_id uuid not null unique,
  student_id uuid not null,
  item_id uuid not null,
  -- Nama objek di dalam bucket "ink" (tanpa awalan bucket).
  storage_path text not null,
  snapshot_path text,
  stroke_count integer not null default 0 check (stroke_count >= 0),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  format_version smallint not null default 1 check (format_version >= 1),
  created_at timestamptz not null default now(),
  -- Coretan selalu milik siswa dan butir yang sama dengan percobaannya.
  foreign key (attempt_id, student_id, item_id)
    references public.attempts (id, student_id, item_id) on delete cascade,
  unique (id, student_id),
  -- Jalur mengikuti aturan Storage: {student_id}/{attempt_id}.json.gz dan .png.
  check (storage_path = student_id::text || '/' || attempt_id::text || '.json.gz'),
  check (snapshot_path is null or snapshot_path = student_id::text || '/' || attempt_id::text || '.png')
);
create index ink_sessions_student_id_idx on public.ink_sessions (student_id);

create table public.hints_shown (
  id uuid primary key default public.uuid_generate_v7(),
  attempt_id uuid not null,
  student_id uuid not null,
  source text not null check (source in ('distractor', 'ai_ink')),
  text text not null check (btrim(text) <> ''),
  -- Kunci asing ke ai_decisions ditambahkan di migrasi 0004, saat tabel itu dibuat.
  ai_decision_id uuid,
  shown_at timestamptz not null default now(),
  foreign key (attempt_id, student_id)
    references public.attempts (id, student_id) on delete cascade,
  -- Aturan 3: setiap petunjuk AI bisa ditelusuri ke catatan keputusannya.
  check (source <> 'ai_ink' or ai_decision_id is not null),
  -- Server yang mengulang permintaan tidak menggandakan petunjuk yang sama.
  unique (attempt_id, source, text)
);
create index hints_shown_student_id_idx on public.hints_shown (student_id);

create table public.hint_reports (
  id uuid primary key default public.uuid_generate_v7(),
  attempt_id uuid not null,
  student_id uuid not null,
  reason text not null check (btrim(reason) <> '' and char_length(reason) <= 1000),
  status text not null default 'open'
    check (status in ('open', 'valid', 'revised', 'item_flagged')),
  -- Diisi trigger: created_at = waktu server, due_at = created_at + 24 jam. Tidak bisa diubah.
  created_at timestamptz not null default now(),
  due_at timestamptz not null default now() + interval '24 hours',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  resolution text,
  foreign key (attempt_id, student_id)
    references public.attempts (id, student_id) on delete cascade,
  -- Laporan yang sudah ditinjau selalu punya waktu tinjau; laporan terbuka belum.
  check ((status = 'open') = (reviewed_at is null))
);
create index hint_reports_student_id_idx on public.hint_reports (student_id);
create index hint_reports_open_due_idx on public.hint_reports (due_at) where status = 'open';
-- Satu laporan terbuka per percobaan: menekan tombol berkali-kali tidak memenuhi antrean admin.
create unique index hint_reports_one_open_per_attempt on public.hint_reports (attempt_id)
  where status = 'open';

create table public.mastery (
  student_id uuid not null references public.students (id) on delete cascade,
  competency_id uuid not null references public.competencies (id) on delete restrict,
  -- Tingkat tertinggi yang sudah terbuka (tingkat selalu terbuka berurutan: dasar, mahir, ujian).
  tier text not null default 'dasar' check (tier in ('dasar', 'mahir', 'ujian')),
  score numeric(5, 4) not null default 0 check (score between 0 and 1),
  n_attempts integer not null default 0 check (n_attempts >= 0),
  mastered_at timestamptz,
  revoked_at timestamptz,
  review_step smallint not null default 0 check (review_step >= 0),
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, competency_id),
  -- Sesuai MasteryState di packages/scoring: ulang berjarak hanya terjadwal saat tuntas,
  -- dan tuntas hanya bisa dicapai di tingkat ujian.
  check ((mastered_at is null) = (next_review_at is null)),
  check (mastered_at is null or tier = 'ujian')
);
create index mastery_competency_id_idx on public.mastery (competency_id);

create table public.daily_activity (
  student_id uuid not null references public.students (id) on delete cascade,
  -- Tanggal kalender Asia/Jakarta, dihitung worker dari attempts.submitted_at.
  date date not null,
  items_done integer not null default 0 check (items_done >= 0),
  minutes integer not null default 0 check (minutes between 0 and 1440),
  target_met boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_id, date)
);

create table public.weekly_reports (
  id uuid primary key default public.uuid_generate_v7(),
  student_id uuid not null references public.students (id) on delete cascade,
  -- Minggu dimulai hari Senin.
  week_start date not null check (extract(isodow from week_start) = 1),
  metrics jsonb not null default '{}' check (jsonb_typeof(metrics) = 'object'),
  narrative text,
  sample_ink_id uuid,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (student_id, week_start),
  -- Contoh coretan harus milik siswa yang sama. Bila coretannya dihapus, hanya contohnya hilang.
  foreign key (sample_ink_id, student_id)
    references public.ink_sessions (id, student_id) on delete set null (sample_ink_id),
  check ((status = 'published') = (published_at is not null)),
  check (status <> 'published' or btrim(coalesce(narrative, '')) <> '')
);
create index weekly_reports_sample_ink_id_idx on public.weekly_reports (sample_ink_id);

-- ---------------------------------------------------------------------------------------------
-- Trigger: batas waktu tinjauan laporan petunjuk
-- ---------------------------------------------------------------------------------------------
create or replace function public.hint_reports_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.due_at := new.created_at + interval '24 hours';
  else
    -- Batas 24 jam tidak bisa dimundurkan atau dimajukan setelah laporan dibuat.
    new.created_at := old.created_at;
    new.due_at := old.due_at;
  end if;
  return new;
end;
$$;

create trigger hint_reports_stamp
  before insert or update on public.hint_reports
  for each row execute function public.hint_reports_stamp();

-- ---------------------------------------------------------------------------------------------
-- RLS dan hak akses tabel
-- ---------------------------------------------------------------------------------------------
alter table public.assignments enable row level security;
alter table public.attempts enable row level security;
alter table public.ink_sessions enable row level security;
alter table public.hints_shown enable row level security;
alter table public.hint_reports enable row level security;
alter table public.mastery enable row level security;
alter table public.daily_activity enable row level security;
alter table public.weekly_reports enable row level security;

-- Mulai dari nol, lalu beri hak baca saja. service_role tetap memegang hak bawaannya.
revoke all on
  public.assignments, public.attempts, public.ink_sessions, public.hints_shown,
  public.hint_reports, public.mastery, public.daily_activity, public.weekly_reports
  from anon, authenticated;

grant select on
  public.assignments, public.attempts, public.ink_sessions, public.hints_shown,
  public.hint_reports, public.mastery, public.daily_activity, public.weekly_reports
  to authenticated;

-- Data belajar: siswa pemilik, orang tua yang terhubung, admin.
create policy assignments_select on public.assignments
  for select to authenticated
  using (
    student_id = public.current_student_id()
    or public.is_guardian_of(student_id)
    or public.auth_role() = 'admin'
  );

create policy attempts_select on public.attempts
  for select to authenticated
  using (
    student_id = public.current_student_id()
    or public.is_guardian_of(student_id)
    or public.auth_role() = 'admin'
  );

create policy ink_sessions_select on public.ink_sessions
  for select to authenticated
  using (
    student_id = public.current_student_id()
    or public.is_guardian_of(student_id)
    or public.auth_role() = 'admin'
  );

create policy hints_shown_select on public.hints_shown
  for select to authenticated
  using (
    student_id = public.current_student_id()
    or public.is_guardian_of(student_id)
    or public.auth_role() = 'admin'
  );

create policy mastery_select on public.mastery
  for select to authenticated
  using (
    student_id = public.current_student_id()
    or public.is_guardian_of(student_id)
    or public.auth_role() = 'admin'
  );

create policy daily_activity_select on public.daily_activity
  for select to authenticated
  using (
    student_id = public.current_student_id()
    or public.is_guardian_of(student_id)
    or public.auth_role() = 'admin'
  );

-- Laporan petunjuk adalah urusan siswa pelapor dan admin peninjau; layar orang tua tidak
-- memakainya.
create policy hint_reports_select on public.hint_reports
  for select to authenticated
  using (student_id = public.current_student_id() or public.auth_role() = 'admin');

-- Laporan mingguan ditulis untuk orang tua: orang tua hanya melihat yang sudah terbit,
-- admin melihat draf untuk ditinjau. Siswa tidak membacanya lewat klien.
create policy weekly_reports_select on public.weekly_reports
  for select to authenticated
  using (
    (status = 'published' and public.is_guardian_of(student_id))
    or public.auth_role() = 'admin'
  );

-- Tidak ada kebijakan INSERT, UPDATE, atau DELETE: untuk klien, semua penulisan ditolak.

-- ---------------------------------------------------------------------------------------------
-- Storage: bucket privat "ink"
-- ---------------------------------------------------------------------------------------------
-- Objek: {student_id}/{attempt_id}.json.gz (vektor Coreta Ink v1) dan {student_id}/{attempt_id}.png
-- (gambar kecil, lebar maksimal 1024 px). Berkas hanya dibuka lewat URL bertanda tangan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ink', 'ink', false, 5242880, array['application/gzip', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Siswa hanya mengunggah ke folder miliknya sendiri, satu tingkat, dengan nama {uuid}.json.gz
-- atau {uuid}.png. Tidak ada kebijakan UPDATE atau DELETE: berkas coretan tidak bisa ditimpa atau
-- dihapus dari klien (unggahan ulang dari antrean offline yang mendapat "sudah ada" = berhasil).
create policy ink_insert_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ink'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = public.current_student_id()::text
    and storage.filename(name)
      ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(json\.gz|png)$'
  );

-- Baca (termasuk membuat URL bertanda tangan): pemilik folder, orang tuanya, atau admin.
create policy ink_select_readable_folder on storage.objects
  for select to authenticated
  using (
    bucket_id = 'ink'
    and public.can_read_student_folder((storage.foldername(name))[1])
  );
