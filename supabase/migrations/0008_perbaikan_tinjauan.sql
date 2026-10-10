-- Migrasi 0008: perbaikan hasil tinjauan menyeluruh Fase 30-36 sebelum disetujui.
-- Migrasi lama tidak diubah (aturan 5); setiap perbaikan di sini menggantikan atau menambah
-- objek dari 0001-0007.

-- ---------------------------------------------------------------------------------------------
-- 1. Anak tidak boleh tertinggal tanpa wali.
--
-- guardianships.parent_id ON DELETE CASCADE (0001): menghapus akun orang tua menghapus hubungan
-- wali dan persetujuannya, tetapi akun dan data anak tetap ada, masih bisa masuk dengan kode +
-- PIN, dan tidak bisa dilihat atau dihapus siapa pun dari aplikasi. Data anak tanpa dasar
-- persetujuan (UU PDP).
--
-- Pemeriksaan ditunda sampai COMMIT (constraint trigger DEFERRABLE INITIALLY DEFERRED): dalam satu
-- transaksi yang menghapus anak dan orang tuanya sekaligus (alur hapus data Fase 65), urutan
-- penghapusan tidak penting. Yang ditolak hanya hasil akhir "siswa masih ada tanpa wali".
-- ---------------------------------------------------------------------------------------------
create or replace function public.guardianships_keep_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.students where id = old.student_id)
     and not exists (select 1 from public.guardianships where student_id = old.student_id)
  then
    raise exception 'siswa % tidak boleh ditinggal tanpa wali: hapus akun siswa lebih dulu', old.student_id
      using errcode = '23503';
  end if;
  return null;
end;
$$;

revoke all on function public.guardianships_keep_student() from public, anon, authenticated;

create constraint trigger guardianships_keep_student
  after delete on public.guardianships
  deferrable initially deferred
  for each row execute function public.guardianships_keep_student();

-- ---------------------------------------------------------------------------------------------
-- 2. register_student: baris persetujuan dikunci (FOR SHARE) saat diperiksa, sehingga pencabutan
--    persetujuan yang berjalan bersamaan menunggu, dan siswa tidak bisa dibuat tepat setelah
--    persetujuan dicabut. Isi lainnya sama dengan 0007.
-- ---------------------------------------------------------------------------------------------
create or replace function public.register_student(
  target_parent uuid,
  student_profile uuid,
  code text,
  student_grade smallint,
  student_goal text,
  student_daily_target smallint,
  required_consent_version text
)
returns public.students
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved public.students;
  consent public.consents;
begin
  if not exists (select 1 from public.profiles where id = target_parent and role = 'parent') then
    raise exception 'akun siswa hanya bisa dibuat oleh orang tua' using errcode = '22023';
  end if;

  select * into consent from public.consents
  where parent_id = target_parent and type = 'data_anak'
  for share;
  if not found or not consent.granted or consent.version <> required_consent_version then
    raise exception 'orang tua belum menyetujui pemrosesan data anak (versi %)', required_consent_version
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where id = student_profile and role = 'student') then
    raise exception 'profil siswa tidak ditemukan' using errcode = '22023';
  end if;

  insert into public.students (profile_id, grade, goal, daily_target, login_code)
  values (student_profile, student_grade, student_goal, student_daily_target, code)
  returning * into saved;

  insert into public.guardianships (parent_id, student_id, consent_at, consent_version)
  values (target_parent, saved.id, now(), required_consent_version);

  insert into public.audit_log (actor_id, action, target, details)
  values (
    target_parent,
    'student.created',
    'students:' || saved.id,
    jsonb_build_object('consent_version', required_consent_version, 'login', 'kode_pin')
  );

  return saved;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 3. stimuli_public hanya mengirim kunci isi yang diizinkan (sama seperti items_public menyaring
--    stem). Catatan penyusun, pembahasan, atau kunci yang tidak sengaja disimpan di body stimulus
--    tidak sampai ke siswa. Kolom dan hak akses tetap sama dengan 0002/0005.
-- ---------------------------------------------------------------------------------------------
create or replace view public.stimuli_public
with (security_barrier = true)
as
select
  s.id,
  s.kind,
  jsonb_strip_nulls(
    jsonb_build_object(
      'title', s.body -> 'title',
      'subtitle', s.body -> 'subtitle',
      'source', s.body -> 'source',
      'text', s.body -> 'text',
      'headers', s.body -> 'headers',
      'rows', s.body -> 'rows',
      'footnote', s.body -> 'footnote',
      'media_ids', s.body -> 'media_ids'
    )
  ) as body
from public.stimuli s
where exists (
  select 1 from public.items i where i.stimulus_id = s.id and i.status = 'published'
);

-- ---------------------------------------------------------------------------------------------
-- 4. Cek lingkaran prasyarat diserialkan: dua transaksi yang bersamaan menambah A→B dan B→A tidak
--    lagi saling tidak melihat dan sama-sama lolos. Isi pemeriksaan sama dengan 0002.
-- ---------------------------------------------------------------------------------------------
create or replace function public.competency_prereqs_no_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('public.competency_prereqs'));
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

-- ---------------------------------------------------------------------------------------------
-- 5. Mencabut semua sesi seorang pengguna (dipakai saat orang tua mengganti PIN anak: orang yang
--    tahu PIN lama tidak tetap masuk). Menghapus auth.sessions ikut menghapus refresh token-nya;
--    token akses yang sudah terbit habis sendiri (jwt_expiry). Hanya service_role.
-- ---------------------------------------------------------------------------------------------
create or replace function public.revoke_user_sessions(target_user uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from auth.sessions where user_id = target_user;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
