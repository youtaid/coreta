-- Migrasi 0007: akun siswa dibuat orang tua, masuk dengan kode + PIN (Fase 36).
-- Migrasi lama tidak diubah (aturan 5).
--
-- Cara kerja:
--   * Server membuat pengguna Auth siswa dengan service_role (peran 'student' di app_metadata),
--     lalu memanggil register_student() yang menulis students, guardianships, dan audit_log dalam
--     satu transaksi. Siswa hanya dibuat bila orang tuanya sudah menyetujui teks persetujuan versi
--     yang berlaku (consents, migrasi 0006).
--   * Siswa masuk dengan kode masuk (students.login_code, 8 karakter tanpa huruf/angka yang mirip)
--     dan PIN 6 angka. Kata sandi Auth siswa diturunkan server dari PIN dengan kunci rahasia,
--     sehingga mencoba PIN langsung ke Supabase Auth (kunci anon publik) tidak berguna.
--   * Percobaan PIN yang salah dibatasi per kode di login_throttle (hanya server).

-- ---------------------------------------------------------------------------------------------
-- Perbaikan trigger peran dari 0001 (ditemukan di Fase 36).
--
-- handle_new_user membaca peran dari raw_app_meta_data saat baris auth.users DIBUAT. Supabase
-- Auth (admin.createUser) membuat barisnya dulu lalu mengisi app_metadata dengan UPDATE, sehingga
-- akun siswa dan admin yang dibuat server berakhir dengan profil orang tua. Trigger ini menyamakan
-- profiles.role dengan app_metadata.role setiap kali peran di app_metadata berubah. Aman karena
-- app_metadata hanya bisa diubah server (service_role); user_metadata tetap diabaikan. Peran di
-- JWT (dipakai proxy.ts) juga berasal dari app_metadata, jadi keduanya selalu sama.
-- ---------------------------------------------------------------------------------------------
create or replace function public.sync_profile_role()
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
  update public.profiles set role = assigned_role
  where id = new.id and role is distinct from assigned_role;
  return new;
end;
$$;

revoke all on function public.sync_profile_role() from public, anon, authenticated;

create trigger on_auth_user_role_changed
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data ->> 'role' is distinct from new.raw_app_meta_data ->> 'role')
  execute function public.sync_profile_role();

-- ---------------------------------------------------------------------------------------------
-- Kode masuk siswa
-- ---------------------------------------------------------------------------------------------
alter table public.students
  add column login_code text unique
    constraint students_login_code_format check (login_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$');

-- ---------------------------------------------------------------------------------------------
-- Pembatas percobaan masuk (kunci mis. 'kode:K7QM3XPA'). Tidak bisa diakses klien sama sekali.
-- ---------------------------------------------------------------------------------------------
create table public.login_throttle (
  key text primary key check (length(key) between 1 and 200),
  failures smallint not null default 0 check (failures >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.login_throttle enable row level security;
revoke all on public.login_throttle from anon, authenticated;
grant select, insert, update, delete on public.login_throttle to service_role;

-- Waktu buka kunci bila kunci ini sedang terkunci, selain itu null.
create or replace function public.login_locked_until(throttle_key text)
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select locked_until from public.login_throttle
  where key = throttle_key and locked_until > now();
$$;

-- Catat satu percobaan gagal. Setelah max_failures kegagalan dalam window_seconds, kunci selama
-- lock_seconds. Mengembalikan waktu buka kunci bila kini terkunci, selain itu null.
create or replace function public.note_login_failure(
  throttle_key text,
  max_failures integer,
  window_seconds integer,
  lock_seconds integer
)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entry public.login_throttle;
begin
  insert into public.login_throttle as t (key, failures, window_started_at)
  values (throttle_key, 1, now())
  on conflict (key) do update set
    failures = case
      when t.window_started_at < now() - make_interval(secs => window_seconds) then 1
      else t.failures + 1
    end,
    window_started_at = case
      when t.window_started_at < now() - make_interval(secs => window_seconds) then now()
      else t.window_started_at
    end
  returning * into entry;

  if entry.failures >= max_failures then
    update public.login_throttle
    set locked_until = now() + make_interval(secs => lock_seconds), failures = 0,
        window_started_at = now()
    where key = throttle_key
    returning * into entry;
  end if;

  return case when entry.locked_until > now() then entry.locked_until end;
end;
$$;

create or replace function public.clear_login_failures(throttle_key text)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.login_throttle where key = throttle_key;
$$;

-- ---------------------------------------------------------------------------------------------
-- Pendaftaran siswa oleh orang tua (setelah pengguna Auth siswa dibuat server).
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
begin
  if not exists (select 1 from public.profiles where id = target_parent and role = 'parent') then
    raise exception 'akun siswa hanya bisa dibuat oleh orang tua' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.consents
    where parent_id = target_parent and type = 'data_anak' and granted
      and version = required_consent_version
  ) then
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

revoke all on function public.login_locked_until(text) from public, anon, authenticated;
revoke all on function public.note_login_failure(text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.clear_login_failures(text) from public, anon, authenticated;
revoke all on function public.register_student(uuid, uuid, text, smallint, text, smallint, text)
  from public, anon, authenticated;
grant execute on function public.login_locked_until(text) to service_role;
grant execute on function public.note_login_failure(text, integer, integer, integer) to service_role;
grant execute on function public.clear_login_failures(text) to service_role;
grant execute on function public.register_student(uuid, uuid, text, smallint, text, smallint, text)
  to service_role;
