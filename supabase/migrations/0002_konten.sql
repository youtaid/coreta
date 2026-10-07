-- Migrasi 0002: kurikulum dan konten (Fase 31).
-- Tabel: stages, competencies, competency_prereqs, items, stimuli, media_assets, worksheets,
-- worksheet_items; view: items_public, stimuli_public, media_assets_public. Semuanya memakai RLS.
-- Migrasi lama (0001) tidak diubah.
--
-- Aturan 1: kunci jawaban dan petunjuk tidak pernah sampai ke browser sebelum jawaban dikumpulkan.
-- Cara menegakkannya di sini, berlapis:
--   1. items, stimuli, dan media_assets TIDAK diberi hak apa pun untuk anon dan authenticated.
--      Query langsung ke tabel itu dari klien ditolak ("permission denied"), bukan sekadar kosong.
--      Admin dan server membacanya lewat service_role, yang dicatat di audit_log (migrasi 0004).
--   2. Siswa membaca butir lewat view items_public: hanya butir berstatus published, hanya kolom
--      yang aman, dan isi stem dan options disaring ke kunci yang diperbolehkan, sehingga bidang
--      yang terselip (misalnya "correct": true di sebuah opsi) tidak bisa bocor.
--   3. View memakai security_barrier supaya fungsi buatan pengguna di klausa WHERE tidak bisa
--      mengintip baris yang belum disaring.
--
-- Konvensi jsonb: items.stem boleh memuat "media_ids" (daftar id media_assets), begitu pula
-- stimuli.body. View media_assets_public memakainya untuk hanya menampilkan media dari butir terbit.

-- ---------------------------------------------------------------------------------------------
-- Kurikulum
-- ---------------------------------------------------------------------------------------------
create table public.stages (
  id uuid primary key default public.uuid_generate_v7(),
  number smallint not null unique check (number between 0 and 8),
  name text not null check (btrim(name) <> ''),
  goal_scope text not null default 'all' check (goal_scope in ('all', 'tka', 'utbk'))
);

create table public.competencies (
  id uuid primary key default public.uuid_generate_v7(),
  code text not null unique check (btrim(code) <> ''),
  stage_id uuid not null references public.stages (id) on delete restrict,
  domain text not null check (btrim(domain) <> ''),
  name text not null check (btrim(name) <> ''),
  exam_tags text[] not null default '{}'
);
create index competencies_stage_id_idx on public.competencies (stage_id);

create table public.competency_prereqs (
  competency_id uuid not null references public.competencies (id) on delete cascade,
  prereq_id uuid not null references public.competencies (id) on delete cascade,
  primary key (competency_id, prereq_id),
  check (competency_id <> prereq_id)
);
create index competency_prereqs_prereq_id_idx on public.competency_prereqs (prereq_id);

-- Prasyarat membentuk graf tanpa lingkaran: kompetensi tidak boleh (langsung atau tidak) menjadi
-- prasyarat bagi dirinya sendiri, sebab jalur belajar tidak akan pernah terbuka.
create or replace function public.competency_prereqs_no_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    with recursive upstream(id) as (
      select new.prereq_id
      union
      select p.prereq_id
      from public.competency_prereqs p
      join upstream u on p.competency_id = u.id
    )
    select 1 from upstream where id = new.competency_id
  ) then
    raise exception 'Prasyarat membentuk lingkaran: % tidak boleh bergantung pada dirinya sendiri', new.competency_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger competency_prereqs_no_cycle
  before insert or update on public.competency_prereqs
  for each row execute function public.competency_prereqs_no_cycle();

-- ---------------------------------------------------------------------------------------------
-- Konten
-- ---------------------------------------------------------------------------------------------
create table public.stimuli (
  id uuid primary key default public.uuid_generate_v7(),
  kind text not null check (kind in ('reading', 'table', 'media_set')),
  body jsonb not null
);

create table public.media_assets (
  id uuid primary key default public.uuid_generate_v7(),
  kind text not null check (kind in ('diagram', 'image', 'table', 'audio', 'video')),
  storage_path text not null check (btrim(storage_path) <> ''),
  -- Setiap media wajib punya teks alternatif, dijaga juga di database.
  alt_text text not null check (btrim(alt_text) <> ''),
  caption_path text,
  transcript text,
  pasteable boolean not null default false,
  width integer check (width > 0),
  height integer check (height > 0),
  duration_s numeric check (duration_s >= 0),
  -- Audio wajib punya transkrip.
  check (kind <> 'audio' or btrim(coalesce(transcript, '')) <> '')
);

create table public.items (
  id uuid primary key default public.uuid_generate_v7(),
  code text not null unique check (code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
  competency_id uuid not null references public.competencies (id) on delete restrict,
  tier text not null check (tier in ('dasar', 'mahir', 'ujian')),
  answer_type text not null check (answer_type in ('pg', 'pgk', 'bs', 'isian')),
  stem jsonb not null,
  options jsonb not null default '[]',
  answer_key jsonb not null check (jsonb_typeof(answer_key) = 'array'),
  equivalents jsonb not null default '[]',
  tolerance numeric check (tolerance >= 0),
  distractor_hints jsonb not null default '{}',
  explanation jsonb not null default '{}',
  layout_mode text not null check (layout_mode in ('standar', 'media', 'bacaan')),
  stimulus_id uuid references public.stimuli (id) on delete restrict,
  difficulty numeric not null check (difficulty between 0 and 1),
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'retired')),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  -- Butir terbit harus punya kunci dan pembahasan. Pemeriksaan lengkapnya ada di packages/content;
  -- ini jaring pengaman terakhir kalau ada yang menulis langsung ke tabel.
  check (
    status <> 'published'
    or (
      jsonb_array_length(answer_key) > 0
      and btrim(coalesce(explanation ->> 'text', '')) <> ''
    )
  )
);
create index items_competency_id_idx on public.items (competency_id);
create index items_status_idx on public.items (status);
create index items_stimulus_id_idx on public.items (stimulus_id);

create table public.worksheets (
  id uuid primary key default public.uuid_generate_v7(),
  title text not null check (btrim(title) <> ''),
  stage_id uuid not null references public.stages (id) on delete restrict,
  release_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'published'))
);
create index worksheets_stage_id_idx on public.worksheets (stage_id);

create table public.worksheet_items (
  worksheet_id uuid not null references public.worksheets (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete restrict,
  position smallint not null check (position >= 1),
  slot text not null check (slot in ('baru', 'adaptif', 'ulang')),
  primary key (worksheet_id, position),
  -- Tidak ada butir yang sama dua kali dalam satu worksheet.
  unique (worksheet_id, item_id)
);
create index worksheet_items_item_id_idx on public.worksheet_items (item_id);

-- ---------------------------------------------------------------------------------------------
-- View untuk siswa
-- ---------------------------------------------------------------------------------------------
-- Hanya butir terbit, hanya kolom yang aman. stem dan options disaring ke kunci yang diizinkan.
create view public.items_public
with (security_barrier = true)
as
select
  i.id,
  i.code,
  i.competency_id,
  i.tier,
  i.answer_type,
  jsonb_strip_nulls(
    jsonb_build_object(
      'text', i.stem -> 'text',
      'formula', i.stem -> 'formula',
      'media_ids', i.stem -> 'media_ids'
    )
  ) as stem,
  case
    when jsonb_typeof(i.options) = 'array' then coalesce(
      (
        select jsonb_agg(
          jsonb_strip_nulls(
            jsonb_build_object('id', o.value -> 'id', 'label', o.value -> 'label', 'text', o.value -> 'text')
          )
          order by o.ordinality
        )
        from jsonb_array_elements(i.options) with ordinality as o (value, ordinality)
      ),
      '[]'::jsonb
    )
    else '[]'::jsonb
  end as options,
  i.layout_mode,
  i.stimulus_id,
  i.difficulty,
  i.version
from public.items i
where i.status = 'published';

-- Stimulus hanya terlihat bila dipakai butir terbit.
create view public.stimuli_public
with (security_barrier = true)
as
select s.id, s.kind, s.body
from public.stimuli s
where exists (
  select 1 from public.items i where i.stimulus_id = s.id and i.status = 'published'
);

-- Media hanya terlihat bila dirujuk butir terbit, langsung atau lewat stimulusnya.
create view public.media_assets_public
with (security_barrier = true)
as
select
  m.id, m.kind, m.storage_path, m.alt_text, m.caption_path, m.transcript,
  m.pasteable, m.width, m.height, m.duration_s
from public.media_assets m
where exists (
  select 1
  from public.items i
  left join public.stimuli s on s.id = i.stimulus_id
  where i.status = 'published'
    and (
      coalesce(i.stem -> 'media_ids', '[]'::jsonb) ? m.id::text
      or coalesce(s.body -> 'media_ids', '[]'::jsonb) ? m.id::text
    )
);

-- ---------------------------------------------------------------------------------------------
-- RLS dan hak akses
-- ---------------------------------------------------------------------------------------------
alter table public.stages enable row level security;
alter table public.competencies enable row level security;
alter table public.competency_prereqs enable row level security;
alter table public.items enable row level security;
alter table public.stimuli enable row level security;
alter table public.media_assets enable row level security;
alter table public.worksheets enable row level security;
alter table public.worksheet_items enable row level security;

-- Mulai dari nol. Supabase memberi anon dan authenticated hak penuh pada tabel baru di public.
revoke all on
  public.stages, public.competencies, public.competency_prereqs,
  public.items, public.stimuli, public.media_assets,
  public.worksheets, public.worksheet_items,
  public.items_public, public.stimuli_public, public.media_assets_public
  from anon, authenticated;

-- Kurikulum dan worksheet yang sudah dirilis: dibaca pengguna yang masuk. Tidak ada tulis dari klien.
grant select on
  public.stages, public.competencies, public.competency_prereqs,
  public.worksheets, public.worksheet_items
  to authenticated;

create policy stages_select on public.stages
  for select to authenticated using (true);
create policy competencies_select on public.competencies
  for select to authenticated using (true);
create policy competency_prereqs_select on public.competency_prereqs
  for select to authenticated using (true);

create policy worksheets_select_released on public.worksheets
  for select to authenticated
  using (status = 'published' and release_at <= now());

create policy worksheet_items_select_released on public.worksheet_items
  for select to authenticated
  using (
    exists (
      select 1 from public.worksheets w
      where w.id = worksheet_id and w.status = 'published' and w.release_at <= now()
    )
  );

-- items, stimuli, media_assets: RLS aktif tanpa kebijakan dan tanpa hak tabel. Hanya service_role.

-- View untuk siswa dan orang tua yang sudah masuk (bukan anon).
grant select on public.items_public, public.stimuli_public, public.media_assets_public
  to authenticated;
