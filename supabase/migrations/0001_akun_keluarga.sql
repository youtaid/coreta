-- Migrasi 0001: akun dan keluarga (Fase 30).
-- Tabel: profiles, students, guardianships, consents. Semuanya memakai RLS.
-- Migrasi lama tidak pernah diubah; perubahan skema berikutnya = berkas baru.
--
-- Prinsip akses:
--   * anon tidak punya akses apa pun.
--   * Siswa membaca data miliknya saja.
--   * Orang tua membaca dan mengelola data anak yang terhubung lewat guardianships.
--   * Admin hanya MEMBACA lewat klien. Semua penulisan oleh admin dan semua pembuatan akun siswa,
--     hubungan orang tua-anak, dan peran berjalan lewat server dengan kunci service_role
--     (yang melewati RLS), dan dicatat di audit_log pada migrasi 0004.

-- ---------------------------------------------------------------------------------------------
-- UUID v7 (aturan: tipe uuid memakai UUID v7). Postgres 17 belum punya uuidv7() bawaan.
-- 48 bit pertama adalah waktu dalam milidetik, sehingga id terurut menurut waktu.
-- ---------------------------------------------------------------------------------------------
create or replace function public.uuid_generate_v7()
returns uuid
language sql
volatile
parallel safe
as $$
  select encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
          from 1 for 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::uuid;
$$;

-- ---------------------------------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('parent', 'student', 'admin')),
  full_name text,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default public.uuid_generate_v7(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  grade smallint check (grade between 1 and 12),
  goal text not null default 'both' check (goal in ('tka', 'utbk', 'both')),
  daily_target smallint not null default 6 check (daily_target between 1 and 50),
  device_note text,
  created_at timestamptz not null default now()
);

create table public.guardianships (
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  consent_at timestamptz,
  consent_version text,
  primary key (parent_id, student_id)
);
create index guardianships_student_id_idx on public.guardianships (student_id);

create table public.consents (
  parent_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('data_anak', 'riset')),
  granted boolean not null,
  granted_at timestamptz not null default now(),
  primary key (parent_id, type)
);

-- ---------------------------------------------------------------------------------------------
-- Fungsi bantu untuk kebijakan. SECURITY DEFINER agar pembacaan profiles/guardianships di dalam
-- kebijakan tidak memicu RLS lagi (menghindari rekursi tak berujung). Semuanya hanya membaca.
-- ---------------------------------------------------------------------------------------------
create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Apakah pengguna yang sedang masuk adalah orang tua dari siswa ini?
create or replace function public.is_guardian_of(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.guardianships g
    where g.student_id = target_student and g.parent_id = auth.uid()
  );
$$;

-- Apakah profil ini milik anak dari pengguna yang sedang masuk?
create or replace function public.is_guardian_of_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.students s
    join public.guardianships g on g.student_id = s.id
    where s.profile_id = target_profile and g.parent_id = auth.uid()
  );
$$;

-- Fungsi ini boleh dipanggil dari klien (dipakai kebijakan), tetapi tidak oleh anon.
revoke all on function public.auth_role() from public, anon;
revoke all on function public.is_guardian_of(uuid) from public, anon;
revoke all on function public.is_guardian_of_profile(uuid) from public, anon;
grant execute on function public.auth_role() to authenticated;
grant execute on function public.is_guardian_of(uuid) to authenticated;
grant execute on function public.is_guardian_of_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Profil dibuat otomatis saat pengguna Auth dibuat.
--
-- Peran dibaca dari raw_app_meta_data, yang hanya bisa diisi server dengan service_role.
-- raw_user_meta_data dikirim sendiri oleh pendaftar lewat signUp, jadi TIDAK dipercaya untuk
-- peran: kalau tidak, siapa pun bisa mendaftar sebagai admin. Tanpa peran, pendaftar umum
-- menjadi orang tua.
-- ---------------------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_role text := coalesce(new.raw_app_meta_data ->> 'role', 'parent');
begin
  if assigned_role not in ('parent', 'student', 'admin') then
    assigned_role := 'parent';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    assigned_role,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Waktu persetujuan dicatat server, tidak bisa dimundurkan dari klien.
create or replace function public.stamp_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.granted_at := now();
  return new;
end;
$$;

create trigger consents_stamp
  before insert or update on public.consents
  for each row execute function public.stamp_consent();

-- ---------------------------------------------------------------------------------------------
-- RLS dan hak akses
-- ---------------------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.guardianships enable row level security;
alter table public.consents enable row level security;

-- Mulai dari nol: tidak ada hak untuk anon dan authenticated, lalu beri sedikit demi sedikit.
revoke all on public.profiles, public.students, public.guardianships, public.consents
  from anon, authenticated;

grant select on public.profiles, public.students, public.guardianships, public.consents
  to authenticated;
-- Hanya kolom ini yang bisa diubah dari klien. Peran tidak pernah bisa diubah dari klien.
grant update (full_name) on public.profiles to authenticated;
grant update (grade, goal, daily_target, device_note) on public.students to authenticated;
grant insert (parent_id, type, granted) on public.consents to authenticated;
grant update (granted) on public.consents to authenticated;

-- profiles --------------------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_guardian_of_profile(id)
    or public.auth_role() = 'admin'
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- students --------------------------------------------------------------------------------------
create policy students_select on public.students
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_guardian_of(id)
    or public.auth_role() = 'admin'
  );

-- Hanya orang tua yang terhubung yang mengatur target dan tujuan anak.
create policy students_update_guardian on public.students
  for update to authenticated
  using (public.is_guardian_of(id))
  with check (public.is_guardian_of(id));

-- guardianships ---------------------------------------------------------------------------------
create policy guardianships_select on public.guardianships
  for select to authenticated
  using (parent_id = auth.uid() or public.auth_role() = 'admin');

-- consents --------------------------------------------------------------------------------------
create policy consents_select on public.consents
  for select to authenticated
  using (parent_id = auth.uid() or public.auth_role() = 'admin');

create policy consents_insert_own on public.consents
  for insert to authenticated
  with check (parent_id = auth.uid() and public.auth_role() = 'parent');

create policy consents_update_own on public.consents
  for update to authenticated
  using (parent_id = auth.uid() and public.auth_role() = 'parent')
  with check (parent_id = auth.uid() and public.auth_role() = 'parent');

-- Tidak ada kebijakan insert, update (kecuali di atas), atau delete lainnya: untuk klien, itu
-- berarti ditolak. Penghapusan data berjalan lewat server (cascade dari auth.users).
