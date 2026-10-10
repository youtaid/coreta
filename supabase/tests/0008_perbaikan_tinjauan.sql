-- Tes pgTAP untuk migrasi 0008 (perbaikan hasil tinjauan Fase 30-36).
-- Jalankan dengan: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

delete from auth.users;
delete from public.worksheet_items;
delete from public.worksheets;
delete from public.items;
delete from public.stimuli;
delete from public.media_assets;
delete from public.competency_prereqs;
delete from public.competencies;
delete from public.stages;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pa@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pb@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000008a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa@siswa.coreta.invalid', '{"role":"student"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000008c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sc@siswa.coreta.invalid', '{"role":"student"}', '{}', now(), now());

insert into public.students (id, profile_id, grade, goal, daily_target)
values
  ('00000000-0000-0000-0000-0000000008d1', '00000000-0000-0000-0000-0000000008a2', 11, 'utbk', 6),
  ('00000000-0000-0000-0000-0000000008d2', '00000000-0000-0000-0000-0000000008c2', 10, 'tka', 6);
insert into public.guardianships (parent_id, student_id, consent_version)
values
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008d1', 'v1'),
  ('00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008d2', 'v1'),
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008d2', 'v1');

create or replace function pg_temp.login_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  set local role authenticated;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 1. Anak tidak tertinggal tanpa wali (diperiksa saat commit; di tes dipaksa dengan SET CONSTRAINTS)
-- ---------------------------------------------------------------------------------------------
savepoint sebelum_hapus;
delete from auth.users where id = '00000000-0000-0000-0000-0000000008a1';
select throws_ok('set constraints public.guardianships_keep_student immediate', '23503', null,
  'NEGATIF: menghapus orang tua satu-satunya meninggalkan anak tanpa wali -> ditolak');
rollback to savepoint sebelum_hapus;

savepoint hapus_anak_dulu;
delete from auth.users where id = '00000000-0000-0000-0000-0000000008a2';
delete from auth.users where id = '00000000-0000-0000-0000-0000000008a1';
select lives_ok('set constraints public.guardianships_keep_student immediate',
  'menghapus anak lalu orang tuanya (alur hapus data) diizinkan');
select is((select count(*)::int from public.students where id = '00000000-0000-0000-0000-0000000008d2'), 1,
  'anak yang masih punya wali lain tetap ada');
rollback to savepoint hapus_anak_dulu;

savepoint wali_lain;
delete from public.guardianships
where parent_id = '00000000-0000-0000-0000-0000000008a1' and student_id = '00000000-0000-0000-0000-0000000008d2';
select lives_ok('set constraints public.guardianships_keep_student immediate',
  'melepas satu wali diizinkan bila anak masih punya wali lain');
rollback to savepoint wali_lain;

savepoint sekaligus;
delete from auth.users where id in ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008a2', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008c2');
select lives_ok('set constraints public.guardianships_keep_student immediate',
  'menghapus semua akun keluarga dalam satu perintah diizinkan');
rollback to savepoint sekaligus;

-- ---------------------------------------------------------------------------------------------
-- 2. register_student mengunci baris persetujuan
-- ---------------------------------------------------------------------------------------------
select ok(
  (select prosrc ilike '%for share%' from pg_proc where oid = 'public.register_student(uuid, uuid, text, smallint, text, smallint, text)'::regprocedure),
  'register_student membaca persetujuan dengan FOR SHARE'
);
insert into public.consents (parent_id, type, granted, version) values ('00000000-0000-0000-0000-0000000008b1', 'data_anak', false, 'v-uji');
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000008e2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'se@siswa.coreta.invalid', '{"role":"student"}', '{}', now(), now());
set local role service_role;
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008e2', 'EEEE2345', 10::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '22023', null, 'NEGATIF: persetujuan yang ditolak tetap menolak pendaftaran siswa');
select throws_ok($$select public.register_student('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008e2', 'EEEE2345', 10::smallint, 'tka', 6::smallint, 'v-uji')$$,
  '22023', null, 'NEGATIF: orang tua tanpa baris persetujuan tidak bisa mendaftarkan siswa');
reset role;
insert into public.consents (parent_id, type, granted, version) values ('00000000-0000-0000-0000-0000000008a1', 'data_anak', true, 'v-uji');
set local role service_role;
select lives_ok($$select public.register_student('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008e2', 'EEEE2345', 10::smallint, 'tka', 6::smallint, 'v-uji')$$,
  'orang tua yang sudah menyetujui tetap bisa mendaftarkan siswa');
reset role;

-- ---------------------------------------------------------------------------------------------
-- 3. stimuli_public menyaring isi body
-- ---------------------------------------------------------------------------------------------
insert into public.stages (id, number, name) values ('00000000-0000-0000-0000-0000000008f0', 0, 'Tahap Uji');
insert into public.competencies (id, code, stage_id, domain, name)
values
  ('00000000-0000-0000-0000-0000000008f1', 'M0.1', '00000000-0000-0000-0000-0000000008f0', 'aljabar', 'Kompetensi A'),
  ('00000000-0000-0000-0000-0000000008f2', 'M0.2', '00000000-0000-0000-0000-0000000008f0', 'aljabar', 'Kompetensi B');
insert into public.stimuli (id, kind, body)
values ('00000000-0000-0000-0000-0000000008f3', 'reading',
        '{"title":"Bacaan","text":"Isi bacaan","pembahasan":"RAHASIA-PEMBAHASAN","answer":"RAHASIA-KUNCI"}');
insert into public.items (id, code, competency_id, tier, answer_type, stem, options, answer_key, explanation, layout_mode, stimulus_id, difficulty, status)
values ('00000000-0000-0000-0000-0000000008f4', 'UJI-STIM-01', '00000000-0000-0000-0000-0000000008f1', 'dasar', 'isian',
        '{"text":"Soal"}', '[]', '["1"]', '{"text":"Pembahasan"}', 'bacaan', '00000000-0000-0000-0000-0000000008f3', 0.5, 'published');

select pg_temp.login_as('00000000-0000-0000-0000-0000000008a2');
select is((select body ->> 'text' from public.stimuli_public where id = '00000000-0000-0000-0000-0000000008f3'), 'Isi bacaan',
  'siswa tetap membaca teks bacaan');
select ok(
  (select body::text not like '%RAHASIA%' from public.stimuli_public where id = '00000000-0000-0000-0000-0000000008f3'),
  'NEGATIF: kunci lain di body stimulus (pembahasan, jawaban) tidak terkirim'
);
reset role;
select ok((select coalesce('security_barrier=true' = any(reloptions), false) from pg_class where oid = 'public.stimuli_public'::regclass),
  'stimuli_public tetap security_barrier');

-- ---------------------------------------------------------------------------------------------
-- 4. Cek lingkaran prasyarat tetap bekerja (dan kini memakai kunci advisory)
-- ---------------------------------------------------------------------------------------------
insert into public.competency_prereqs (competency_id, prereq_id)
values ('00000000-0000-0000-0000-0000000008f2', '00000000-0000-0000-0000-0000000008f1');
select throws_ok($$insert into public.competency_prereqs (competency_id, prereq_id) values ('00000000-0000-0000-0000-0000000008f1', '00000000-0000-0000-0000-0000000008f2')$$,
  '23514', null, 'NEGATIF: lingkaran prasyarat tetap ditolak');

-- ---------------------------------------------------------------------------------------------
-- 5. revoke_user_sessions
-- ---------------------------------------------------------------------------------------------
insert into auth.sessions (id, user_id, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000008aa', '00000000-0000-0000-0000-0000000008a2', now(), now()),
  ('00000000-0000-0000-0000-0000000008ab', '00000000-0000-0000-0000-0000000008a2', now(), now()),
  ('00000000-0000-0000-0000-0000000008ac', '00000000-0000-0000-0000-0000000008c2', now(), now());
select ok(
  not has_function_privilege('authenticated', 'public.revoke_user_sessions(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.revoke_user_sessions(uuid)', 'EXECUTE'),
  'NEGATIF: klien tidak bisa mencabut sesi'
);
set local role service_role;
select is(public.revoke_user_sessions('00000000-0000-0000-0000-0000000008a2'), 2, 'service_role mencabut semua sesi siswa');
reset role;
select is((select count(*)::int from auth.sessions where user_id = '00000000-0000-0000-0000-0000000008c2'), 1,
  'sesi pengguna lain tidak tersentuh');

select * from finish();
rollback;
