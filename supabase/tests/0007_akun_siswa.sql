-- Tes pgTAP untuk migrasi 0007: kode masuk siswa, pembatas percobaan, dan register_student.
-- Jalankan dengan: supabase test db
--
-- Tokoh:
--   pa, pb : orang tua A dan B (keduanya sudah menyetujui versi v-uji)
--   pc     : orang tua C (belum menyetujui)
--   sa, sx : profil siswa (sa untuk anak A, sx cadangan)

begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

delete from auth.users;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000007a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pa@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pb@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pc@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa@siswa.coreta.invalid', '{"role":"student"}', '{"full_name":"Anak A"}', now(), now()),
  ('00000000-0000-0000-0000-0000000007d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sx@siswa.coreta.invalid', '{"role":"student"}', '{"full_name":"Anak X"}', now(), now());

insert into public.consents (parent_id, type, granted, version)
values
  ('00000000-0000-0000-0000-0000000007a1', 'data_anak', true, 'v-uji'),
  ('00000000-0000-0000-0000-0000000007b1', 'data_anak', true, 'v-uji'),
  ('00000000-0000-0000-0000-0000000007c1', 'data_anak', false, 'v-uji');

create or replace function pg_temp.login_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  set local role authenticated;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Hak akses: semua fungsi dan tabel baru hanya untuk server
-- ---------------------------------------------------------------------------------------------
select ok((select relrowsecurity from pg_class where oid = 'public.login_throttle'::regclass), 'RLS aktif di login_throttle');
select ok(
  not has_table_privilege('authenticated', 'public.login_throttle', 'SELECT')
  and not has_table_privilege('anon', 'public.login_throttle', 'SELECT'),
  'NEGATIF: klien tidak bisa membaca login_throttle'
);
select ok(
  not has_function_privilege('authenticated', 'public.register_student(uuid, uuid, text, smallint, text, smallint, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.note_login_failure(text, integer, integer, integer)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.clear_login_failures(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.login_locked_until(text)', 'EXECUTE'),
  'NEGATIF: klien tidak bisa memanggil register_student dan fungsi pembatas'
);
select is_empty($$
  select r.role, f.sig
  from unnest(array['anon', 'authenticated']) as r(role)
  cross join unnest(array[
    'public.register_student(uuid, uuid, text, smallint, text, smallint, text)',
    'public.note_login_failure(text, integer, integer, integer)',
    'public.clear_login_failures(text)',
    'public.login_locked_until(text)',
    'public.sync_profile_role()'
  ]) as f(sig)
  where has_function_privilege(r.role, f.sig, 'EXECUTE')
$$, 'NEGATIF: anon dan authenticated tidak bisa memanggil satu pun fungsi server 0007');
select ok(not has_column_privilege('authenticated', 'public.students', 'login_code', 'UPDATE'),
  'NEGATIF: klien tidak bisa mengubah kode masuk');

-- ---------------------------------------------------------------------------------------------
-- register_student
-- ---------------------------------------------------------------------------------------------
set local role service_role;
select lives_ok($$select public.register_student('00000000-0000-0000-0000-0000000007a1', '00000000-0000-0000-0000-0000000007a2', 'RAKA4826', 11::smallint, 'utbk', 8::smallint, 'v-uji')$$,
  'orang tua yang sudah menyetujui bisa mendaftarkan anak');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000007c1', '00000000-0000-0000-0000-0000000007d2', 'CCCC2345', 11::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '22023', null, 'NEGATIF: orang tua yang menolak persetujuan tidak bisa membuat akun anak');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007d2', 'BBBB2345', 11::smallint, 'tka', 6::smallint, 'v-lama')$$,
  '22023', null, 'NEGATIF: persetujuan versi lain tidak cukup');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000007a2', '00000000-0000-0000-0000-0000000007d2', 'DDDD2345', 11::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '22023', null, 'NEGATIF: siswa tidak bisa mendaftarkan siswa lain');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007c1', 'EEEE2345', 11::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '22023', null, 'NEGATIF: profil orang tua tidak bisa dijadikan siswa');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007d2', 'RAKA4826', 11::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '23505', null, 'NEGATIF: kode masuk tidak boleh kembar');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007d2', 'raka-482', 11::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '23514', null, 'NEGATIF: bentuk kode masuk diperiksa basis data');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007a2', 'FFFF2345', 11::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '23505', null, 'NEGATIF: profil siswa yang sudah terdaftar tidak bisa didaftarkan orang tua lain');
reset role;

select is((select count(*)::int from public.students where profile_id = '00000000-0000-0000-0000-0000000007d2'), 0,
  'percobaan yang gagal tidak meninggalkan baris students');
select results_eq(
  $$select s.goal, s.daily_target::int, s.grade::int, g.consent_version
    from public.students s join public.guardianships g on g.student_id = s.id
    where s.login_code = 'RAKA4826'$$,
  $$values ('utbk'::text, 8, 11, 'v-uji'::text)$$,
  'target ujian, target harian, kelas, dan versi persetujuan tersimpan'
);
select is((select count(*)::int from public.audit_log where action = 'student.created'), 1,
  'pembuatan akun siswa tercatat di audit_log');

-- ---------------------------------------------------------------------------------------------
-- RLS: orang tua A vs B (DoD Fase 36)
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000007a1');
select results_eq('select login_code from public.students', $$values ('RAKA4826'::text)$$,
  'orang tua A membaca anaknya beserta kode masuknya');
select lives_ok($$update public.students set daily_target = 12, goal = 'both' where login_code = 'RAKA4826'$$,
  'orang tua A boleh mengubah target anaknya');
select throws_ok($$update public.students set login_code = 'ZZZZ2345' where login_code = 'RAKA4826'$$, '42501', null,
  'NEGATIF: orang tua tidak mengubah kode masuk langsung (hanya lewat server)');
reset role;

select pg_temp.login_as('00000000-0000-0000-0000-0000000007b1');
select is_empty('select 1 from public.students', 'NEGATIF: orang tua B tidak melihat anak orang tua A');
select is_empty($$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000007a2'$$,
  'NEGATIF: orang tua B tidak melihat profil anak orang tua A');
select lives_ok($$update public.students set daily_target = 1 where login_code = 'RAKA4826'$$,
  'update orang tua B ke anak A tidak melempar galat');
reset role;
select results_eq($$select daily_target::int, goal from public.students where login_code = 'RAKA4826'$$,
  $$values (12, 'both'::text)$$, 'NEGATIF: orang tua B tidak mengubah anak A (0 baris)');

select pg_temp.login_as('00000000-0000-0000-0000-0000000007a2');
select results_eq('select login_code from public.students', $$values ('RAKA4826'::text)$$,
  'siswa membaca kode masuknya sendiri');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Pembatas percobaan
-- ---------------------------------------------------------------------------------------------
set local role service_role;
select is(public.note_login_failure('kode:RAKA4826', 3, 900, 900), null, 'gagal ke-1: belum terkunci');
select is(public.note_login_failure('kode:RAKA4826', 3, 900, 900), null, 'gagal ke-2: belum terkunci');
select ok(public.note_login_failure('kode:RAKA4826', 3, 900, 900) > now(), 'gagal ke-3: terkunci');
select ok(public.login_locked_until('kode:RAKA4826') > now() + interval '14 minutes', 'terkunci sekitar 15 menit');
select is(public.login_locked_until('kode:LAIN2345'), null, 'kode lain tidak ikut terkunci');
select lives_ok($$select public.clear_login_failures('kode:RAKA4826')$$, 'berhasil masuk menghapus catatan gagal');
select is(public.login_locked_until('kode:RAKA4826'), null, 'setelah dihapus tidak terkunci');
reset role;

-- Kegagalan lama di luar jendela waktu tidak dihitung.
insert into public.login_throttle (key, failures, window_started_at) values ('kode:LAMA2345', 2, now() - interval '1 hour');
set local role service_role;
select is(public.note_login_failure('kode:LAMA2345', 3, 900, 900), null,
  'kegagalan di luar jendela 15 menit mulai dihitung dari 1 lagi');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Peran mengikuti app_metadata yang diisi server setelah baris dibuat (cara kerja admin.createUser)
-- ---------------------------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000007e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'baru@siswa.coreta.invalid',
        '{"provider":"email","providers":["email"]}', '{}', now(), now());
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000007e1'), 'parent', 'saat dibuat tanpa peran: orang tua');
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"student"}' where id = '00000000-0000-0000-0000-0000000007e1';
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000007e1'), 'student',
  'peran yang diisi server sesudahnya (seperti admin.createUser) masuk ke profil');
update auth.users set raw_user_meta_data = '{"role":"admin"}' where id = '00000000-0000-0000-0000-0000000007e1';
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000007e1'), 'student',
  'NEGATIF: peran di user_metadata tetap diabaikan');
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"superuser"}' where id = '00000000-0000-0000-0000-0000000007e1';
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000007e1'), 'parent',
  'NEGATIF: peran yang tidak dikenal menjadi orang tua');
select ok(not has_function_privilege('authenticated', 'public.sync_profile_role()', 'EXECUTE'),
  'NEGATIF: klien tidak bisa memanggil sync_profile_role');

select * from finish();
rollback;
