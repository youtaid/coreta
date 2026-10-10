-- Tes pgTAP untuk migrasi 0001 (akun dan keluarga): RLS, termasuk tes negatif.
-- Jalankan dengan: supabase test db
--
-- Tokoh:
--   admin  : Admin
--   p1, p2 : orang tua; p1 menjaga siswa a, p2 menjaga siswa b
--   a, b   : siswa

begin;
create extension if not exists pgtap with schema extensions;
select plan(64);

-- Mulai dari basis data kosong: data seed pengembangan (supabase/seed.sql) dihapus di dalam
-- transaksi tes ini dan kembali lagi lewat rollback di akhir berkas.
delete from auth.users;
delete from public.worksheet_items;
delete from public.worksheets;
delete from public.items;
delete from public.stimuli;
delete from public.media_assets;
delete from public.competency_prereqs;
delete from public.competencies;
delete from public.stages;

-- ---------------------------------------------------------------------------------------------
-- Data uji. Dibuat sebagai superuser, lalu setiap tes berpindah ke peran authenticated.
-- ---------------------------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.id',
     '{"role":"admin"}', '{"full_name":"Admin"}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.id',
     '{}', '{"full_name":"  Orang Tua Satu  "}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2@test.id',
     '{}', '{"full_name":"Orang Tua Dua"}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.id',
     '{"role":"student"}', '{"full_name":"Siswa A"}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.id',
     '{"role":"student"}', '{"full_name":"Siswa B"}', now(), now());

insert into public.students (id, profile_id, grade, goal, daily_target)
values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', 11, 'utbk', 6),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c2', 12, 'tka', 8);

insert into public.guardianships (parent_id, student_id, consent_version)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1', 'v1'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d2', 'v1');

insert into public.consents (parent_id, type, granted, version)
values
  ('00000000-0000-0000-0000-0000000000b1', 'data_anak', true, 'v1'),
  ('00000000-0000-0000-0000-0000000000b2', 'data_anak', true, 'v1');

-- Masuk sebagai pengguna tertentu. Dipanggil sebelum setiap kelompok tes.
create or replace function pg_temp.login_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  set local role authenticated;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Semua tabel memakai RLS (aturan 4)
-- ---------------------------------------------------------------------------------------------
select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.profiles'::regclass, 'public.students'::regclass,
                 'public.guardianships'::regclass, 'public.consents'::regclass)),
  'RLS aktif di profiles, students, guardianships, dan consents'
);

-- ---------------------------------------------------------------------------------------------
-- UUID v7
-- ---------------------------------------------------------------------------------------------
select is(substring(public.uuid_generate_v7()::text from 15 for 1), '7', 'uuid_generate_v7 menghasilkan versi 7');
select ok(substring(public.uuid_generate_v7()::text from 20 for 1) in ('8', '9', 'a', 'b'), 'uuid_generate_v7 memakai varian RFC 4122');
select ok(
  (with ids as (select public.uuid_generate_v7() as first_id, pg_sleep(0.005), public.uuid_generate_v7() as second_id)
   select substring(first_id::text from 1 for 13) <= substring(second_id::text from 1 for 13) from ids),
  'uuid_generate_v7 terurut menurut waktu'
);

-- ---------------------------------------------------------------------------------------------
-- Trigger pembuat profil
-- ---------------------------------------------------------------------------------------------
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), 'admin', 'peran dari app_metadata: admin');
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'), 'student', 'peran dari app_metadata: siswa');
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 'parent', 'tanpa peran, pendaftar menjadi orang tua');
select is((select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 'Orang Tua Satu', 'nama dibaca dari user_metadata dan dirapikan');

-- Serangan: pendaftar menulis peran admin di user_metadata (yang ia kendalikan sendiri).
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jahat@test.id',
        '{}', '{"role":"admin","full_name":"Penyusup"}', now(), now());
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'), 'parent',
  'NEGATIF: role di user_metadata diabaikan, pendaftar tetap orang tua');

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ngawur@test.id',
        '{"role":"superuser"}', '{}', now(), now());
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000e2'), 'parent',
  'NEGATIF: peran yang tidak dikenal di app_metadata menjadi orang tua');

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tanpanama@test.id',
        null, '{"full_name":"   "}', now(), now());
select is((select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000e3'), null, 'nama kosong disimpan sebagai null');
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000e3'), 'parent', 'app_metadata null tetap menjadi orang tua');

-- ---------------------------------------------------------------------------------------------
-- anon tidak bisa apa-apa
-- ---------------------------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.profiles', '42501', null, 'NEGATIF: anon tidak bisa membaca profiles');
select throws_ok('select * from public.students', '42501', null, 'NEGATIF: anon tidak bisa membaca students');
select throws_ok('select * from public.guardianships', '42501', null, 'NEGATIF: anon tidak bisa membaca guardianships');
select throws_ok('select * from public.consents', '42501', null, 'NEGATIF: anon tidak bisa membaca consents');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Siswa A
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000c1');

select results_eq('select id from public.profiles', $$values ('00000000-0000-0000-0000-0000000000c1'::uuid)$$,
  'siswa A hanya membaca profilnya sendiri');
select results_eq('select id from public.students', $$values ('00000000-0000-0000-0000-0000000000d1'::uuid)$$,
  'siswa A hanya membaca data siswa miliknya');
select is_empty($$select 1 from public.students where id = '00000000-0000-0000-0000-0000000000d2'$$,
  'NEGATIF: siswa A tidak bisa membaca siswa B');
select is_empty($$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000c2'$$,
  'NEGATIF: siswa A tidak bisa membaca profil siswa B');
select is_empty($$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'$$,
  'NEGATIF: siswa A tidak bisa membaca profil orang tuanya');
select is_empty('select 1 from public.guardianships', 'NEGATIF: siswa tidak membaca guardianships');
select is_empty('select 1 from public.consents', 'NEGATIF: siswa tidak membaca consents');
select lives_ok($$update public.students set daily_target = 50 where id = '00000000-0000-0000-0000-0000000000d1'$$,
  'update siswa ke targetnya sendiri tidak melempar galat');
select throws_ok($$insert into public.students (profile_id) values ('00000000-0000-0000-0000-0000000000c1')$$, '42501', null,
  'NEGATIF: siswa tidak bisa membuat baris students');
select throws_ok($$insert into public.guardianships (parent_id, student_id) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1')$$, '42501', null,
  'NEGATIF: siswa tidak bisa membuat hubungan wali');
select throws_ok($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000c1'$$, '42501', null,
  'NEGATIF: siswa tidak bisa menaikkan perannya menjadi admin');
select lives_ok($$update public.profiles set full_name = 'Siswa A Baru' where id = '00000000-0000-0000-0000-0000000000c1'$$,
  'siswa boleh mengubah nama sendiri');
select throws_ok($$insert into public.consents (parent_id, type, granted) values ('00000000-0000-0000-0000-0000000000c1', 'riset', true)$$, '42501', null,
  'NEGATIF: siswa tidak bisa memberi persetujuan');
reset role;
select is((select daily_target::int from public.students where id = '00000000-0000-0000-0000-0000000000d1'), 6,
  'NEGATIF: siswa tidak mengubah targetnya sendiri (0 baris)');

-- ---------------------------------------------------------------------------------------------
-- Orang tua 1 (menjaga siswa A)
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000b1');

select results_eq('select id from public.students', $$values ('00000000-0000-0000-0000-0000000000d1'::uuid)$$,
  'orang tua 1 hanya membaca anak yang terhubung');
select is_empty($$select 1 from public.students where id = '00000000-0000-0000-0000-0000000000d2'$$,
  'NEGATIF: orang tua 1 tidak bisa membaca anak orang tua 2');
select results_eq('select id from public.profiles order by id',
  $$values ('00000000-0000-0000-0000-0000000000b1'::uuid), ('00000000-0000-0000-0000-0000000000c1'::uuid)$$,
  'orang tua 1 membaca profil sendiri dan profil anaknya, tidak yang lain');
select is_empty($$select 1 from public.profiles where id in ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1')$$,
  'NEGATIF: orang tua 1 tidak membaca profil orang tua 2, siswa B, atau admin');
select results_eq('select student_id from public.guardianships', $$values ('00000000-0000-0000-0000-0000000000d1'::uuid)$$,
  'orang tua 1 hanya membaca hubungan wali miliknya');
select results_eq('select parent_id from public.consents', $$values ('00000000-0000-0000-0000-0000000000b1'::uuid)$$,
  'orang tua 1 hanya membaca persetujuan miliknya');

select lives_ok($$update public.students set daily_target = 10 where id = '00000000-0000-0000-0000-0000000000d1'$$,
  'orang tua 1 boleh mengubah target anaknya');
select is((select daily_target::int from public.students where id = '00000000-0000-0000-0000-0000000000d1'), 10, 'target anak berubah');
select lives_ok($$update public.students set daily_target = 1 where id = '00000000-0000-0000-0000-0000000000d2'$$,
  'update ke anak orang lain tidak melempar galat');
reset role;
select is((select daily_target::int from public.students where id = '00000000-0000-0000-0000-0000000000d2'), 8,
  'NEGATIF: update ke anak orang tua 2 tidak mengubah apa pun (0 baris)');

select pg_temp.login_as('00000000-0000-0000-0000-0000000000b1');
select throws_ok($$update public.students set profile_id = '00000000-0000-0000-0000-0000000000c2' where id = '00000000-0000-0000-0000-0000000000d1'$$, '42501', null,
  'NEGATIF: orang tua tidak bisa memindahkan profil siswa');
select throws_ok($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'NEGATIF: orang tua tidak bisa menaikkan perannya menjadi admin');
select lives_ok($$update public.profiles set full_name = 'Nama Baru' where id = '00000000-0000-0000-0000-0000000000b1'$$,
  'orang tua boleh mengubah nama sendiri');
reset role;
select is((select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 'Orang Tua Dua', 'profil orang tua lain tidak berubah');

select pg_temp.login_as('00000000-0000-0000-0000-0000000000b1');
select lives_ok($$update public.profiles set full_name = 'Diretas' where id = '00000000-0000-0000-0000-0000000000b2'$$,
  'update profil orang lain tidak melempar galat');
reset role;
select is((select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 'Orang Tua Dua',
  'NEGATIF: orang tua 1 tidak mengubah profil orang tua 2 (0 baris)');

-- Persetujuan. Sejak migrasi 0006 klien hanya MEMBACA consents; memberi dan mencabut persetujuan
-- berjalan lewat POST /api/consent (service_role) yang mengisi versi teks dan mencatat audit_log.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000b1');
select throws_ok($$insert into public.consents (parent_id, type, granted, version) values ('00000000-0000-0000-0000-0000000000b1', 'riset', true, 'v1')$$, '42501', null,
  'NEGATIF: orang tua tidak menulis persetujuannya langsung dari klien (harus lewat /api/consent)');
select throws_ok($$insert into public.consents (parent_id, type, granted) values ('00000000-0000-0000-0000-0000000000b2', 'riset', true)$$, '42501', null,
  'NEGATIF: orang tua 1 tidak bisa memberi persetujuan atas nama orang tua 2');
select throws_ok($$insert into public.consents (parent_id, type, granted, granted_at) values ('00000000-0000-0000-0000-0000000000b1', 'riset', true, '2000-01-01')$$, '42501', null,
  'NEGATIF: granted_at tidak bisa diisi dari klien');
select throws_ok($$update public.consents set granted = false where parent_id = '00000000-0000-0000-0000-0000000000b1' and type = 'data_anak'$$, '42501', null,
  'NEGATIF: orang tua tidak mencabut persetujuan langsung dari klien (harus lewat /api/consent)');
select throws_ok($$delete from public.consents where parent_id = '00000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'NEGATIF: persetujuan tidak bisa dihapus dari klien (hanya dicabut)');
select throws_ok($$insert into public.guardianships (parent_id, student_id) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d2')$$, '42501', null,
  'NEGATIF: orang tua tidak bisa menghubungkan dirinya ke anak orang lain');
reset role;
-- Jalur server: waktu tetap dicap trigger walaupun pengirim mengisi waktu lama.
insert into public.consents (parent_id, type, granted, version, granted_at)
values ('00000000-0000-0000-0000-0000000000b1', 'riset', true, 'v1', '2000-01-01');
select ok(
  (select granted_at > now() - interval '1 minute' from public.consents
   where parent_id = '00000000-0000-0000-0000-0000000000b1' and type = 'riset'),
  'granted_at diisi server saat persetujuan dicatat'
);

-- ---------------------------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000a1');

select cmp_ok((select count(*)::int from public.profiles), '>=', 5, 'admin membaca semua profil');
select cmp_ok((select count(*)::int from public.students), '=', 2, 'admin membaca semua siswa');
select cmp_ok((select count(*)::int from public.guardianships), '=', 2, 'admin membaca semua hubungan wali');
select cmp_ok((select count(*)::int from public.consents), '>=', 2, 'admin membaca semua persetujuan');
select throws_ok($$update public.profiles set role = 'student' where id = '00000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'NEGATIF: admin tidak mengubah peran lewat klien (harus lewat server dan tercatat)');
select throws_ok($$insert into public.guardianships (parent_id, student_id) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d2')$$, '42501', null,
  'NEGATIF: admin tidak menulis guardianships lewat klien');
select throws_ok($$delete from public.students where id = '00000000-0000-0000-0000-0000000000d1'$$, '42501', null,
  'NEGATIF: admin tidak menghapus siswa lewat klien');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Pengguna tanpa profil (token lama atau kacau) tidak melihat apa pun
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-00000000ffff');
select is_empty('select 1 from public.profiles', 'NEGATIF: pengguna tanpa profil tidak membaca profiles');
select is_empty('select 1 from public.students', 'NEGATIF: pengguna tanpa profil tidak membaca students');
reset role;

-- Cascade: menghapus pengguna Auth menghapus profil, siswa, dan hubungan wali.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000c2';
select is((select count(*)::int from public.students where id = '00000000-0000-0000-0000-0000000000d2'), 0,
  'menghapus pengguna Auth menghapus baris students-nya');
select is((select count(*)::int from public.guardianships where student_id = '00000000-0000-0000-0000-0000000000d2'), 0,
  'dan hubungan walinya');

select * from finish();
rollback;
