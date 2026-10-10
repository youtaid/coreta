-- Tes pgTAP untuk migrasi 0003 (data belajar): siswa hanya membaca datanya dan tidak bisa menulis
-- mastery, daily_activity, maupun skor; orang tua hanya membaca data anaknya; siswa hanya mengunggah
-- coretan ke folder miliknya; percobaan dengan id yang sama tidak pernah menjadi dua baris.
-- Jalankan dengan: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
select plan(123);

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
-- Pengguna: admin, orang tua 1 (anak: siswa A), orang tua 2 (anak: siswa B), siswa A, siswa B
-- ---------------------------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.id', '{"role":"admin"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.id', '{"role":"student"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.id', '{"role":"student"}', '{}', now(), now());

-- Siswa A = ...5a, siswa B = ...5b (students.id, juga nama folder Storage).
insert into public.students (id, profile_id) values
  ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-00000000005b', '00000000-0000-0000-0000-0000000000c2');
insert into public.guardianships (parent_id, student_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005a'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000005b');

create or replace function pg_temp.login_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  set local role authenticated;
end;
$$;

-- Jumlah baris yang benar-benar terkena UPDATE/DELETE (kebijakan yang menolak = 0 baris).
create or replace function pg_temp.rows_affected(statement text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Konten minimal (ditulis sebagai superuser, seperti server dengan service_role)
-- ---------------------------------------------------------------------------------------------
insert into public.stages (id, number, name) values ('10000000-0000-0000-0000-000000000001', 3, 'Persamaan Kuadrat');
insert into public.competencies (id, code, stage_id, domain, name) values
  ('20000000-0000-0000-0000-000000000001', 'M3.1', '10000000-0000-0000-0000-000000000001', 'Aljabar', 'Menentukan akar'),
  ('20000000-0000-0000-0000-000000000002', 'M3.2', '10000000-0000-0000-0000-000000000001', 'Aljabar', 'Diskriminan');
insert into public.items (id, code, competency_id, tier, answer_type, stem, options, answer_key, explanation, layout_mode, difficulty, status)
values
  ('50000000-0000-0000-0000-000000000001', 'MAT-01', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{"text":"1"}',
   '[{"id":"a","label":"A","text":"2"},{"id":"b","label":"B","text":"3"}]', '["a"]', '{"text":"P"}', 'standar', 0.3, 'published'),
  ('50000000-0000-0000-0000-000000000002', 'MAT-02', '20000000-0000-0000-0000-000000000002', 'dasar', 'isian', '{"text":"2"}',
   '[]', '["6"]', '{"text":"P"}', 'standar', 0.5, 'published');
insert into public.worksheets (id, title, stage_id, release_at, status) values
  ('60000000-0000-0000-0000-000000000001', 'Minggu 1', '10000000-0000-0000-0000-000000000001', now() - interval '1 day', 'published');

-- ---------------------------------------------------------------------------------------------
-- Data belajar siswa A dan siswa B
-- ---------------------------------------------------------------------------------------------
insert into public.assignments (id, student_id, worksheet_id) values
  ('70000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000005a', '60000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000005b', '60000000-0000-0000-0000-000000000001');

insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms) values
  ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', '{"choice":"b"}', 0, now() - interval '1 hour', 40000),
  ('80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-00000000000a', '{"text":"6"}', 1, now() - interval '50 minutes', 60000),
  ('80000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005b', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000b', '{"choice":"a"}', 1, now() - interval '2 hours', 30000);

insert into public.ink_sessions (id, attempt_id, student_id, item_id, storage_path, snapshot_path, stroke_count) values
  ('90000000-0000-0000-0000-0000000000a1', '80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a1.json.gz', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a1.png', 12),
  ('90000000-0000-0000-0000-0000000000b1', '80000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005b', '50000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-00000000005b/80000000-0000-0000-0000-0000000000b1.json.gz', null, 7);

insert into public.hints_shown (attempt_id, student_id, source, text) values
  ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', 'distractor', 'Cek tanda saat memindahkan suku.'),
  ('80000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005b', 'distractor', 'Petunjuk untuk B.');

insert into public.hint_reports (id, attempt_id, student_id, reason) values
  ('a0000000-0000-0000-0000-0000000000a1', '80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', 'Petunjuknya membingungkan.'),
  ('a0000000-0000-0000-0000-0000000000b1', '80000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005b', 'Petunjuk B salah.');

insert into public.mastery (student_id, competency_id, tier, score, n_attempts) values
  ('00000000-0000-0000-0000-00000000005a', '20000000-0000-0000-0000-000000000001', 'mahir', 0.72, 6),
  ('00000000-0000-0000-0000-00000000005b', '20000000-0000-0000-0000-000000000001', 'dasar', 0.4, 3);

insert into public.daily_activity (student_id, date, items_done, minutes, target_met) values
  ('00000000-0000-0000-0000-00000000005a', current_date, 6, 25, true),
  ('00000000-0000-0000-0000-00000000005b', current_date, 2, 9, false);

-- Laporan mingguan: siswa A punya satu terbit dan satu draf; siswa B satu terbit.
insert into public.weekly_reports (id, student_id, week_start, narrative, sample_ink_id, status, published_at) values
  ('b0000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', date '2026-09-28', 'Raka konsisten minggu ini.', '90000000-0000-0000-0000-0000000000a1', 'published', now()),
  ('b0000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', date '2026-10-05', null, null, 'draft', null),
  ('b0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005b', date '2026-09-28', 'Laporan B.', null, 'published', now());

-- Berkas coretan yang sudah ada di Storage, plus bucket lain untuk tes salah-bucket.
insert into storage.buckets (id, name, public) values ('media', 'media', false) on conflict (id) do nothing;
insert into storage.objects (bucket_id, name) values
  ('ink', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a1.json.gz'),
  ('ink', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a1.png'),
  ('ink', '00000000-0000-0000-0000-00000000005b/80000000-0000-0000-0000-0000000000b1.json.gz'),
  ('media', 'bukan-uuid/gambar.png');

-- ---------------------------------------------------------------------------------------------
-- Skema: RLS di semua tabel (aturan 4) dan klien tidak punya hak tulis sama sekali
-- ---------------------------------------------------------------------------------------------
select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.assignments'::regclass, 'public.attempts'::regclass, 'public.ink_sessions'::regclass,
                 'public.hints_shown'::regclass, 'public.hint_reports'::regclass, 'public.mastery'::regclass,
                 'public.daily_activity'::regclass, 'public.weekly_reports'::regclass)),
  'RLS aktif di semua tabel data belajar'
);
select is_empty($$
  select table_name, grantee, privilege_type from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('assignments', 'attempts', 'ink_sessions', 'hints_shown', 'hint_reports',
                       'mastery', 'daily_activity', 'weekly_reports')
    and grantee in ('anon', 'authenticated')
    and privilege_type <> 'SELECT'
$$, 'NEGATIF: anon dan authenticated tidak punya hak INSERT/UPDATE/DELETE/TRUNCATE di tabel data belajar');
select is_empty($$
  select table_name from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('assignments', 'attempts', 'ink_sessions', 'hints_shown', 'hint_reports',
                       'mastery', 'daily_activity', 'weekly_reports')
    and grantee = 'anon'
$$, 'NEGATIF: anon tidak punya hak apa pun di tabel data belajar');
select is(
  (select row(public, file_size_limit, allowed_mime_types)::text from storage.buckets where id = 'ink'),
  row(false, 5242880::bigint, array['application/gzip', 'image/png'])::text,
  'bucket ink privat, maksimal 5 MB, hanya application/gzip dan image/png'
);

-- ---------------------------------------------------------------------------------------------
-- Anon
-- ---------------------------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.attempts', '42501', null, 'NEGATIF: anon ditolak membaca attempts');
select throws_ok('select * from public.mastery', '42501', null, 'NEGATIF: anon ditolak membaca mastery');
select is_empty($$select 1 from storage.objects where bucket_id = 'ink'$$, 'NEGATIF: anon tidak melihat berkas coretan');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Siswa A: membaca datanya sendiri saja
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000c1');

select is(public.current_student_id(), '00000000-0000-0000-0000-00000000005a'::uuid, 'current_student_id() siswa A');
select results_eq('select id from public.assignments', $$values ('70000000-0000-0000-0000-00000000000a'::uuid)$$, 'siswa A membaca penugasannya');
select results_eq('select id from public.attempts order by id',
  $$values ('80000000-0000-0000-0000-0000000000a1'::uuid), ('80000000-0000-0000-0000-0000000000a2'::uuid)$$, 'siswa A membaca percobaannya');
select results_eq('select id from public.ink_sessions', $$values ('90000000-0000-0000-0000-0000000000a1'::uuid)$$, 'siswa A membaca sesi coretannya');
select results_eq('select text from public.hints_shown', $$values ('Cek tanda saat memindahkan suku.'::text)$$, 'siswa A membaca petunjuk yang diterimanya');
select results_eq('select id from public.hint_reports', $$values ('a0000000-0000-0000-0000-0000000000a1'::uuid)$$, 'siswa A membaca laporannya');
select results_eq('select score from public.mastery', $$values (0.72::numeric)$$, 'siswa A membaca penguasaannya');
select results_eq('select items_done from public.daily_activity', $$values (6)$$, 'siswa A membaca aktivitas hariannya');

select is_empty($$select 1 from public.assignments where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: siswa A tidak membaca penugasan siswa B');
select is_empty($$select 1 from public.attempts where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: siswa A tidak membaca percobaan siswa B');
select is_empty($$select 1 from public.ink_sessions where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: siswa A tidak membaca coretan siswa B');
select is_empty($$select 1 from public.hints_shown where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: siswa A tidak membaca petunjuk siswa B');
select is_empty($$select 1 from public.hint_reports where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: siswa A tidak membaca laporan siswa B');
select is_empty($$select 1 from public.mastery where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: siswa A tidak membaca penguasaan siswa B');
select is_empty($$select 1 from public.daily_activity where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: siswa A tidak membaca aktivitas siswa B');
select is_empty('select 1 from public.weekly_reports', 'siswa tidak membaca laporan mingguan (ditulis untuk orang tua)');

-- Siswa tidak bisa menulis mastery dan daily_activity (DoD), maupun skor dan data lain.
select throws_ok($$insert into public.mastery (student_id, competency_id, score) values ('00000000-0000-0000-0000-00000000005a', '20000000-0000-0000-0000-000000000002', 1)$$,
  '42501', null, 'NEGATIF: siswa tidak bisa menambah mastery');
select throws_ok($$update public.mastery set score = 1$$, '42501', null, 'NEGATIF: siswa tidak bisa mengubah mastery');
select throws_ok($$delete from public.mastery$$, '42501', null, 'NEGATIF: siswa tidak bisa menghapus mastery');
select throws_ok($$insert into public.daily_activity (student_id, date, items_done, target_met) values ('00000000-0000-0000-0000-00000000005a', current_date - 1, 99, true)$$,
  '42501', null, 'NEGATIF: siswa tidak bisa menambah daily_activity');
select throws_ok($$update public.daily_activity set target_met = true$$, '42501', null, 'NEGATIF: siswa tidak bisa mengubah daily_activity');
select throws_ok($$delete from public.daily_activity$$, '42501', null, 'NEGATIF: siswa tidak bisa menghapus daily_activity');
select throws_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', '{}', 1, now(), 1)$$,
  '42501', null, 'NEGATIF: siswa tidak bisa menulis attempts sendiri (skor hanya dari server)');
select throws_ok($$update public.attempts set score = 1$$, '42501', null, 'NEGATIF: siswa tidak bisa menaikkan skor');
select throws_ok($$insert into public.hint_reports (attempt_id, student_id, reason) values ('80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', 'x')$$,
  '42501', null, 'NEGATIF: siswa tidak menulis hint_reports langsung (lewat /api/hint-reports)');
select throws_ok($$update public.hint_reports set status = 'valid'$$, '42501', null, 'NEGATIF: siswa tidak bisa menutup laporannya sendiri');
select throws_ok($$insert into public.ink_sessions (attempt_id, student_id, item_id, storage_path)
  values ('80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a2.json.gz')$$,
  '42501', null, 'NEGATIF: siswa tidak menulis ink_sessions langsung (lewat /api/ink/complete)');
select throws_ok($$insert into public.hints_shown (attempt_id, student_id, source, text) values ('80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', 'distractor', 'x')$$,
  '42501', null, 'NEGATIF: siswa tidak bisa menambah hints_shown');
select throws_ok($$insert into public.assignments (student_id, worksheet_id) values ('00000000-0000-0000-0000-00000000005a', '60000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'NEGATIF: siswa tidak bisa menambah assignments');
select throws_ok($$update public.assignments set completed_at = now()$$, '42501', null, 'NEGATIF: siswa tidak bisa menandai penugasan selesai');
select throws_ok($$insert into public.weekly_reports (student_id, week_start) values ('00000000-0000-0000-0000-00000000005a', date '2026-10-12')$$,
  '42501', null, 'NEGATIF: siswa tidak bisa menulis laporan mingguan');

-- Storage: unggah hanya ke folder sendiri.
select lives_ok($$insert into storage.objects (bucket_id, name) values ('ink', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a2.json.gz')$$,
  'siswa A mengunggah .json.gz ke foldernya');
select lives_ok($$insert into storage.objects (bucket_id, name) values ('ink', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a2.png')$$,
  'siswa A mengunggah .png ke foldernya');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('ink', '00000000-0000-0000-0000-00000000005b/80000000-0000-0000-0000-0000000000a2.json.gz')$$,
  '42501', null, 'NEGATIF: siswa A tidak bisa mengunggah ke folder siswa B');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('ink', '80000000-0000-0000-0000-0000000000a2.json.gz')$$,
  '42501', null, 'NEGATIF: siswa tidak bisa mengunggah ke akar bucket');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('ink', '00000000-0000-0000-0000-00000000005a/x/80000000-0000-0000-0000-0000000000a2.png')$$,
  '42501', null, 'NEGATIF: siswa tidak bisa membuat subfolder');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('ink', '00000000-0000-0000-0000-00000000005a/skrip.exe')$$,
  '42501', null, 'NEGATIF: nama berkas harus {uuid}.json.gz atau {uuid}.png');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('ink', '00000000-0000-0000-0000-00000000005a/../00000000-0000-0000-0000-00000000005b/80000000-0000-0000-0000-0000000000a2.png')$$,
  '42501', null, 'NEGATIF: jalur dengan .. ditolak');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('media', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a2.png')$$,
  '42501', null, 'NEGATIF: siswa tidak bisa mengunggah ke bucket lain');

select results_eq($$select name from storage.objects where bucket_id = 'ink' order by name$$,
  $$values ('00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a1.json.gz'::text),
           ('00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a1.png'),
           ('00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a2.json.gz'),
           ('00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a2.png')$$,
  'siswa A hanya melihat berkas di foldernya');
select is_empty($$select 1 from storage.objects where bucket_id = 'media'$$, 'NEGATIF: siswa A tidak melihat bucket lain');
select is(pg_temp.rows_affected($$update storage.objects set name = '00000000-0000-0000-0000-00000000005b/80000000-0000-0000-0000-0000000000a1.png' where name like '00000000-0000-0000-0000-00000000005a/%'$$),
  0::bigint, 'NEGATIF: siswa tidak bisa memindah atau menimpa berkas coretan');
-- Supabase Storage menolak DELETE langsung di storage.objects (trigger protect_delete); lewat
-- Storage API, penghapusan mengikuti RLS, dan bucket ink tidak punya kebijakan DELETE.
select throws_ok($$delete from storage.objects where bucket_id = 'ink'$$,
  null, null, 'NEGATIF: siswa tidak bisa menghapus berkas coretan');

-- ---------------------------------------------------------------------------------------------
-- Siswa B: hanya datanya
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000c2');
select results_eq('select id from public.attempts', $$values ('80000000-0000-0000-0000-0000000000b1'::uuid)$$, 'siswa B hanya membaca percobaannya');
select results_eq('select score from public.mastery', $$values (0.4::numeric)$$, 'siswa B hanya membaca penguasaannya');
select results_eq($$select name from storage.objects where bucket_id = 'ink'$$,
  $$values ('00000000-0000-0000-0000-00000000005b/80000000-0000-0000-0000-0000000000b1.json.gz'::text)$$,
  'NEGATIF: siswa B tidak melihat berkas siswa A');

-- ---------------------------------------------------------------------------------------------
-- Orang tua 1: hanya data siswa A
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000b1');

select is(public.current_student_id(), null::uuid, 'orang tua bukan siswa: current_student_id() kosong');
select results_eq('select id from public.assignments', $$values ('70000000-0000-0000-0000-00000000000a'::uuid)$$, 'orang tua 1 membaca penugasan anaknya');
select results_eq('select count(*)::int from public.attempts', $$values (2)$$, 'orang tua 1 membaca percobaan anaknya');
select results_eq('select id from public.ink_sessions', $$values ('90000000-0000-0000-0000-0000000000a1'::uuid)$$, 'orang tua 1 membaca sesi coretan anaknya');
select results_eq('select count(*)::int from public.hints_shown', $$values (1)$$, 'orang tua 1 membaca petunjuk yang diterima anaknya');
select results_eq('select score from public.mastery', $$values (0.72::numeric)$$, 'orang tua 1 membaca penguasaan anaknya');
select results_eq('select items_done from public.daily_activity', $$values (6)$$, 'orang tua 1 membaca aktivitas harian anaknya');
select results_eq('select id from public.weekly_reports', $$values ('b0000000-0000-0000-0000-0000000000a1'::uuid)$$, 'orang tua 1 membaca laporan mingguan anaknya yang terbit');

select is_empty($$select 1 from public.weekly_reports where status = 'draft'$$, 'NEGATIF: orang tua tidak membaca draf laporan mingguan');
select is_empty($$select 1 from public.attempts where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: orang tua 1 tidak membaca percobaan siswa B');
select is_empty($$select 1 from public.mastery where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: orang tua 1 tidak membaca penguasaan siswa B');
select is_empty($$select 1 from public.daily_activity where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: orang tua 1 tidak membaca aktivitas siswa B');
select is_empty($$select 1 from public.ink_sessions where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: orang tua 1 tidak membaca coretan siswa B');
select is_empty($$select 1 from public.weekly_reports where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: orang tua 1 tidak membaca laporan siswa B');
select is_empty($$select 1 from public.assignments where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'NEGATIF: orang tua 1 tidak membaca penugasan siswa B');
select is_empty('select 1 from public.hint_reports', 'orang tua tidak membaca laporan petunjuk (urusan siswa dan admin)');

select results_eq($$select count(*)::int from storage.objects where bucket_id = 'ink'$$, $$values (4)$$, 'orang tua 1 melihat berkas coretan anaknya');
select is_empty($$select 1 from storage.objects where bucket_id = 'ink' and name like '00000000-0000-0000-0000-00000000005b/%'$$,
  'NEGATIF: orang tua 1 tidak melihat berkas coretan siswa B');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('ink', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a3.png')$$,
  '42501', null, 'NEGATIF: orang tua tidak bisa mengunggah ke folder anaknya');
select throws_ok($$update public.mastery set score = 1$$, '42501', null, 'NEGATIF: orang tua tidak bisa mengubah mastery anaknya');
select throws_ok($$insert into public.daily_activity (student_id, date) values ('00000000-0000-0000-0000-00000000005a', current_date - 2)$$,
  '42501', null, 'NEGATIF: orang tua tidak bisa menulis daily_activity');
select throws_ok($$update public.weekly_reports set status = 'published'$$, '42501', null, 'NEGATIF: orang tua tidak bisa menerbitkan laporan');

-- ---------------------------------------------------------------------------------------------
-- Orang tua 2: hanya data siswa B
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000b2');
select results_eq('select id from public.attempts', $$values ('80000000-0000-0000-0000-0000000000b1'::uuid)$$, 'orang tua 2 hanya membaca percobaan siswa B');
select results_eq('select id from public.weekly_reports', $$values ('b0000000-0000-0000-0000-0000000000b1'::uuid)$$, 'orang tua 2 hanya membaca laporan siswa B');
select is_empty($$select 1 from storage.objects where bucket_id = 'ink' and name like '00000000-0000-0000-0000-00000000005a/%'$$,
  'NEGATIF: orang tua 2 tidak melihat berkas coretan siswa A');

-- ---------------------------------------------------------------------------------------------
-- Admin: membaca semuanya, tetap tidak menulis lewat klien
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000a1');
select results_eq('select count(*)::int from public.attempts', $$values (3)$$, 'admin membaca semua percobaan');
select results_eq('select count(*)::int from public.hint_reports', $$values (2)$$, 'admin membaca semua laporan petunjuk');
select results_eq('select count(*)::int from public.weekly_reports', $$values (3)$$, 'admin membaca laporan mingguan termasuk draf');
select results_eq('select count(*)::int from public.mastery', $$values (2)$$, 'admin membaca semua penguasaan');
select results_eq($$select count(*)::int from storage.objects where bucket_id = 'ink'$$, $$values (5)$$, 'admin melihat semua berkas coretan');
select throws_ok($$update public.hint_reports set status = 'valid', reviewed_at = now()$$, '42501', null,
  'NEGATIF: admin menutup laporan lewat server (dicatat audit_log), bukan langsung dari klien');
select throws_ok($$update public.mastery set score = 1$$, '42501', null, 'NEGATIF: admin tidak menulis mastery dari klien');

-- ---------------------------------------------------------------------------------------------
-- Pengguna tanpa profil (token sah, data tidak ada): tidak melihat apa pun
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-00000000ffff');
select is_empty('select 1 from public.attempts', 'NEGATIF: pengguna tak dikenal tidak membaca percobaan');
select is_empty('select 1 from public.mastery', 'NEGATIF: pengguna tak dikenal tidak membaca penguasaan');
select is_empty($$select 1 from storage.objects where bucket_id = 'ink'$$, 'NEGATIF: pengguna tak dikenal tidak melihat berkas coretan');

-- ---------------------------------------------------------------------------------------------
-- Worker dan server (service_role): menulis seperti seharusnya
-- ---------------------------------------------------------------------------------------------
reset role;
set local role service_role;
select lives_ok($$insert into public.mastery (student_id, competency_id, score, n_attempts) values ('00000000-0000-0000-0000-00000000005a', '20000000-0000-0000-0000-000000000002', 0.5, 4)$$,
  'service_role (worker) menambah mastery');
select lives_ok($$insert into public.daily_activity (student_id, date, items_done) values ('00000000-0000-0000-0000-00000000005a', current_date - 1, 3)
  on conflict (student_id, date) do update set items_done = excluded.items_done$$,
  'service_role (worker) menulis daily_activity secara idempoten');
select lives_ok($$update public.hint_reports set status = 'valid', reviewed_by = '00000000-0000-0000-0000-0000000000a1', reviewed_at = now(), resolution = 'Petunjuk direvisi.'
  where id = 'a0000000-0000-0000-0000-0000000000b1'$$, 'service_role (server admin) menutup laporan petunjuk');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Idempoten: percobaan dengan id yang sama dua kali tetap satu baris (DoD)
-- ---------------------------------------------------------------------------------------------
select throws_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', '{"choice":"a"}', 1, now(), 1)$$,
  '23505', null, 'NEGATIF: id percobaan yang sama ditolak kunci utama');
select lives_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', '{"choice":"a"}', 1, now(), 1)
  on conflict (id) do nothing$$, 'kirim ulang dengan ON CONFLICT (id) DO NOTHING tidak galat');
select results_eq($$select count(*)::int, min(score) from public.attempts where id = '80000000-0000-0000-0000-0000000000a1'$$,
  $$values (1, 0::numeric)$$, 'tetap satu baris dan skor awal tidak tertimpa');
select throws_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', '{}', 1, now(), 1)$$,
  '23505', null, 'NEGATIF: percobaan ke-1 yang sama untuk butir dan penugasan yang sama ditolak');

-- ---------------------------------------------------------------------------------------------
-- Integritas kepemilikan dan nilai (dijaga database, bukan hanya server)
-- ---------------------------------------------------------------------------------------------
select throws_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-00000000000b', '{}', 1, now(), 1)$$,
  '23503', null, 'NEGATIF: percobaan siswa A tidak bisa ditempel ke penugasan siswa B');
select throws_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', '{}', 1.5, now(), 1)$$,
  '23514', null, 'NEGATIF: skor di luar 0-1 ditolak');
select throws_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, try_no, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', 2, '{}', 1, now() + interval '1 day', 1)$$,
  '23514', null, 'NEGATIF: waktu kirim di masa depan ditolak');
select lives_ok($$insert into public.attempts (id, student_id, item_id, assignment_id, try_no, answer, score, submitted_at, duration_ms)
  values ('80000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', 2, '{}', 1, now() - interval '3 days', 1)$$,
  'percobaan offline yang dikirim terlambat (waktu kirim lampau) diterima');

select throws_ok($$insert into public.ink_sessions (attempt_id, student_id, item_id, storage_path)
  values ('80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000005b/80000000-0000-0000-0000-0000000000a2.json.gz')$$,
  '23514', null, 'NEGATIF: storage_path coretan harus di folder siswa pemilik');
select throws_ok($$insert into public.ink_sessions (attempt_id, student_id, item_id, storage_path)
  values ('80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a2.json.gz')$$,
  '23503', null, 'NEGATIF: coretan harus untuk butir yang sama dengan percobaannya');
insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms)
values ('80000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000005b', '50000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-00000000000b', '{"text":"5"}', 0, now(), 1);
select throws_ok($$insert into public.ink_sessions (attempt_id, student_id, item_id, storage_path)
  values ('80000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000b2.json.gz')$$,
  '23503', null, 'NEGATIF: coretan siswa A tidak bisa ditempel ke percobaan siswa B');
select throws_ok($$insert into public.ink_sessions (attempt_id, student_id, item_id, storage_path)
  values ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000005a/80000000-0000-0000-0000-0000000000a1.json.gz')$$,
  '23505', null, 'NEGATIF: satu sesi coretan per percobaan');

select throws_ok($$insert into public.hints_shown (attempt_id, student_id, source, text) values ('80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', 'ai_ink', 'Petunjuk AI')$$,
  '23514', null, 'NEGATIF: petunjuk AI tanpa ai_decision_id ditolak (aturan 3)');
select throws_ok($$insert into public.hints_shown (attempt_id, student_id, source, text) values ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', 'distractor', 'Cek tanda saat memindahkan suku.')$$,
  '23505', null, 'NEGATIF: petunjuk yang sama untuk percobaan yang sama tidak tergandakan');

-- Batas 24 jam laporan petunjuk dihitung database dan tidak bisa digeser.
insert into public.hint_reports (id, attempt_id, student_id, reason, created_at, due_at)
values ('a0000000-0000-0000-0000-0000000000a2', '80000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000005a', 'Laporan kedua.', now() - interval '10 days', now() + interval '30 days');
select is((select due_at - created_at from public.hint_reports where id = 'a0000000-0000-0000-0000-0000000000a2'),
  interval '24 hours', 'due_at = dibuat + 24 jam, walau pengirim mencoba mengisinya sendiri');
select is((select created_at from public.hint_reports where id = 'a0000000-0000-0000-0000-0000000000a2'),
  now(), 'created_at diisi waktu server');
update public.hint_reports set due_at = now() + interval '30 days' where id = 'a0000000-0000-0000-0000-0000000000a2';
select is((select due_at - created_at from public.hint_reports where id = 'a0000000-0000-0000-0000-0000000000a2'),
  interval '24 hours', 'NEGATIF: due_at tidak bisa diubah setelah dibuat');
select throws_ok($$insert into public.hint_reports (attempt_id, student_id, reason) values ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', 'Lagi.')$$,
  '23505', null, 'NEGATIF: hanya satu laporan terbuka per percobaan');
select throws_ok($$update public.hint_reports set status = 'valid' where id = 'a0000000-0000-0000-0000-0000000000a1'$$,
  '23514', null, 'NEGATIF: laporan ditutup tanpa reviewed_at ditolak');

select throws_ok($$update public.mastery set mastered_at = now(), next_review_at = now() + interval '3 days'
  where student_id = '00000000-0000-0000-0000-00000000005b'$$,
  '23514', null, 'NEGATIF: tuntas hanya di tingkat ujian');
select throws_ok($$update public.mastery set tier = 'ujian', mastered_at = now()
  where student_id = '00000000-0000-0000-0000-00000000005b'$$,
  '23514', null, 'NEGATIF: tuntas tanpa jadwal ulang berjarak ditolak');
select lives_ok($$update public.mastery set tier = 'ujian', score = 0.85, mastered_at = now(), next_review_at = now() + interval '3 days'
  where student_id = '00000000-0000-0000-0000-00000000005b'$$, 'tuntas di tingkat ujian dengan jadwal ulang diterima');
select throws_ok($$insert into public.mastery (student_id, competency_id) values ('00000000-0000-0000-0000-00000000005a', '20000000-0000-0000-0000-000000000001')$$,
  '23505', null, 'NEGATIF: satu baris penguasaan per siswa per kompetensi');
select throws_ok($$insert into public.daily_activity (student_id, date) values ('00000000-0000-0000-0000-00000000005a', current_date)$$,
  '23505', null, 'NEGATIF: satu baris aktivitas per siswa per hari');
select throws_ok($$insert into public.daily_activity (student_id, date, minutes) values ('00000000-0000-0000-0000-00000000005a', current_date - 5, 1441)$$,
  '23514', null, 'NEGATIF: menit per hari maksimal 1440');

select throws_ok($$insert into public.weekly_reports (student_id, week_start) values ('00000000-0000-0000-0000-00000000005a', date '2026-10-07')$$,
  '23514', null, 'NEGATIF: week_start harus hari Senin');
select throws_ok($$insert into public.weekly_reports (student_id, week_start, status, published_at) values ('00000000-0000-0000-0000-00000000005a', date '2026-10-12', 'published', now())$$,
  '23514', null, 'NEGATIF: laporan terbit wajib punya narasi');
select throws_ok($$insert into public.weekly_reports (student_id, week_start, sample_ink_id) values ('00000000-0000-0000-0000-00000000005a', date '2026-10-12', '90000000-0000-0000-0000-0000000000b1')$$,
  '23503', null, 'NEGATIF: contoh coretan harus milik siswa yang sama');
select throws_ok($$insert into public.weekly_reports (student_id, week_start) values ('00000000-0000-0000-0000-00000000005a', date '2026-09-28')$$,
  '23505', null, 'NEGATIF: satu laporan per siswa per minggu');

-- Menghapus sesi coretan hanya mengosongkan contoh di laporan, laporannya tetap.
delete from public.ink_sessions where id = '90000000-0000-0000-0000-0000000000a1';
select results_eq($$select student_id, sample_ink_id from public.weekly_reports where id = 'b0000000-0000-0000-0000-0000000000a1'$$,
  $$values ('00000000-0000-0000-0000-00000000005a'::uuid, null::uuid)$$,
  'hapus coretan: sample_ink_id menjadi null, student_id dan laporan tetap');

-- Menghapus akun siswa (hak hapus data) membawa seluruh data belajarnya.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000c2';
select is_empty($$
  select 1 from public.attempts where student_id = '00000000-0000-0000-0000-00000000005b'
  union all select 1 from public.mastery where student_id = '00000000-0000-0000-0000-00000000005b'
  union all select 1 from public.daily_activity where student_id = '00000000-0000-0000-0000-00000000005b'
  union all select 1 from public.weekly_reports where student_id = '00000000-0000-0000-0000-00000000005b'
  union all select 1 from public.assignments where student_id = '00000000-0000-0000-0000-00000000005b'
  union all select 1 from public.ink_sessions where student_id = '00000000-0000-0000-0000-00000000005b'
  union all select 1 from public.hint_reports where student_id = '00000000-0000-0000-0000-00000000005b'
$$, 'hapus akun siswa B: semua data belajarnya ikut terhapus');

-- Tidak ada kebijakan DELETE (atau ALL) untuk bucket ink: Storage API menghormati kebijakan ini,
-- jadi tes langsung ke storage.objects di atas saja tidak cukup (protect_delete menolak semuanya).
select is_empty($$
  select policyname from pg_policies
  where schemaname = 'storage' and tablename = 'objects' and cmd in ('DELETE', 'ALL', 'UPDATE')
    and (coalesce(qual, '') ilike '%ink%' or coalesce(with_check, '') ilike '%ink%')
$$, 'NEGATIF: tidak ada kebijakan UPDATE/DELETE untuk berkas coretan di bucket ink');

select * from finish();
rollback;
