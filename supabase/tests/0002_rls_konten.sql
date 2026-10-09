-- Tes pgTAP untuk migrasi 0002 (kurikulum dan konten): kunci jawaban tidak bocor, hanya butir terbit
-- terbaca, kurikulum dan worksheet yang dirilis terbaca, penulisan hanya lewat server.
-- Jalankan dengan: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
select plan(67);

-- ---------------------------------------------------------------------------------------------
-- Pengguna: siswa, orang tua, admin (profil dibuat trigger dari migrasi 0001)
-- ---------------------------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.id', '{"role":"admin"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.id', '{"role":"student"}', '{}', now(), now());

create or replace function pg_temp.login_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  set local role authenticated;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Data konten (ditulis sebagai superuser, seperti yang dilakukan server dengan service_role)
-- ---------------------------------------------------------------------------------------------
insert into public.stages (id, number, name) values
  ('10000000-0000-0000-0000-000000000001', 3, 'Persamaan Kuadrat'),
  ('10000000-0000-0000-0000-000000000002', 4, 'Barisan dan Deret');

insert into public.competencies (id, code, stage_id, domain, name, exam_tags) values
  ('20000000-0000-0000-0000-000000000001', 'M3.1', '10000000-0000-0000-0000-000000000001', 'Aljabar', 'Menentukan akar', '{tka,utbk}'),
  ('20000000-0000-0000-0000-000000000002', 'M3.2', '10000000-0000-0000-0000-000000000001', 'Aljabar', 'Diskriminan', '{utbk}'),
  ('20000000-0000-0000-0000-000000000003', 'M3.3', '10000000-0000-0000-0000-000000000001', 'Aljabar', 'Jumlah dan hasil kali akar', '{}');

insert into public.competency_prereqs (competency_id, prereq_id) values
  ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002');

insert into public.media_assets (id, kind, storage_path, alt_text, pasteable) values
  ('30000000-0000-0000-0000-000000000001', 'diagram', 'media/item-pub/parabola.svg', 'Parabola membuka ke atas.', true),
  ('30000000-0000-0000-0000-000000000002', 'image', 'media/item-draft/rahasia.png', 'Gambar butir yang belum terbit.', false),
  ('30000000-0000-0000-0000-000000000003', 'image', 'media/stimulus/peta.png', 'Peta lokasi.', false),
  ('30000000-0000-0000-0000-000000000004', 'image', 'media/tidak-dipakai/x.png', 'Tidak dipakai butir mana pun.', false);

insert into public.stimuli (id, kind, body) values
  ('40000000-0000-0000-0000-000000000001', 'reading', '{"text":"Bacaan untuk butir terbit.","media_ids":["30000000-0000-0000-0000-000000000003"]}'),
  ('40000000-0000-0000-0000-000000000002', 'reading', '{"text":"Bacaan untuk butir draf."}');

-- Butir terbit (dengan media dan stimulus), butir draf, ditinjau, dan dipensiunkan.
insert into public.items (id, code, competency_id, tier, answer_type, stem, options, answer_key, equivalents, tolerance,
                          distractor_hints, explanation, layout_mode, stimulus_id, difficulty, status)
values
  ('50000000-0000-0000-0000-000000000001', 'MAT-PUB-01', '20000000-0000-0000-0000-000000000001', 'mahir', 'pg',
   '{"text":"Soal terbit","formula":"x^2=4","media_ids":["30000000-0000-0000-0000-000000000001"],"rahasia":"JANGAN BOCOR"}',
   '[{"id":"a","label":"A","text":"2","correct":true,"hint":"BOCOR"},{"id":"b","label":"B","text":"3","rahasia":"x"}]',
   '["a"]', '["dua"]', 0.5, '{"b":"Petunjuk untuk B"}', '{"text":"Pembahasan rahasia"}',
   'bacaan', '40000000-0000-0000-0000-000000000001', 0.4, 'published'),
  ('50000000-0000-0000-0000-000000000002', 'MAT-DRF-02', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg',
   '{"text":"Soal draf","media_ids":["30000000-0000-0000-0000-000000000002"]}',
   '[{"id":"a","label":"A","text":"1"},{"id":"b","label":"B","text":"2"}]',
   '["a"]', '[]', null, '{}', '{}', 'media', '40000000-0000-0000-0000-000000000002', 0.2, 'draft'),
  ('50000000-0000-0000-0000-000000000003', 'MAT-REV-03', '20000000-0000-0000-0000-000000000002', 'dasar', 'pg',
   '{"text":"Soal ditinjau"}', '[{"id":"a","label":"A","text":"1"},{"id":"b","label":"B","text":"2"}]',
   '["a"]', '[]', null, '{}', '{}', 'standar', null, 0.3, 'review'),
  ('50000000-0000-0000-0000-000000000004', 'MAT-OLD-04', '20000000-0000-0000-0000-000000000002', 'dasar', 'isian',
   '{"text":"Soal pensiun"}', '[]', '["6"]', '[]', 0, '{}', '{"text":"Pembahasan lama"}', 'standar', null, 0.1, 'retired'),
  ('50000000-0000-0000-0000-000000000005', 'MAT-PUB-05', '20000000-0000-0000-0000-000000000002', 'ujian', 'isian',
   '{"text":"Soal isian terbit"}', '[]', '["12"]', '["12,0"]', 0, '{}', '{"text":"Pembahasan isian"}', 'standar', null, 0.8, 'published');

-- Worksheet: satu dirilis, satu draf, satu terbit tetapi jadwalnya masih di masa depan.
insert into public.worksheets (id, title, stage_id, release_at, status) values
  ('60000000-0000-0000-0000-000000000001', 'Rilis lalu', '10000000-0000-0000-0000-000000000001', now() - interval '1 day', 'published'),
  ('60000000-0000-0000-0000-000000000002', 'Masih draf', '10000000-0000-0000-0000-000000000001', now() - interval '1 day', 'draft'),
  ('60000000-0000-0000-0000-000000000003', 'Terbit nanti', '10000000-0000-0000-0000-000000000001', now() + interval '3 days', 'published');
insert into public.worksheet_items (worksheet_id, item_id, position, slot) values
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, 'baru'),
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', 2, 'adaptif'),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 1, 'baru'),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 1, 'baru');

-- ---------------------------------------------------------------------------------------------
-- Semua tabel memakai RLS (aturan 4)
-- ---------------------------------------------------------------------------------------------
select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.stages'::regclass, 'public.competencies'::regclass, 'public.competency_prereqs'::regclass,
                 'public.items'::regclass, 'public.stimuli'::regclass, 'public.media_assets'::regclass,
                 'public.worksheets'::regclass, 'public.worksheet_items'::regclass)),
  'RLS aktif di semua tabel kurikulum dan konten'
);

-- ---------------------------------------------------------------------------------------------
-- Siswa: tidak bisa membaca items sama sekali
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000c1');

select throws_ok('select * from public.items', '42501', null, 'NEGATIF: siswa ditolak membaca tabel items');
select throws_ok('select id from public.items', '42501', null, 'NEGATIF: siswa ditolak membaca kolom id items');
select throws_ok('select answer_key from public.items', '42501', null, 'NEGATIF: siswa tidak bisa membaca answer_key dari tabel');
select throws_ok('select equivalents from public.items', '42501', null, 'NEGATIF: siswa tidak bisa membaca equivalents dari tabel');
select throws_ok('select tolerance from public.items', '42501', null, 'NEGATIF: siswa tidak bisa membaca tolerance dari tabel');
select throws_ok('select distractor_hints from public.items', '42501', null, 'NEGATIF: siswa tidak bisa membaca distractor_hints dari tabel');
select throws_ok('select explanation from public.items', '42501', null, 'NEGATIF: siswa tidak bisa membaca explanation dari tabel');
select throws_ok('select * from public.stimuli', '42501', null, 'NEGATIF: siswa ditolak membaca tabel stimuli');
select throws_ok('select * from public.media_assets', '42501', null, 'NEGATIF: siswa ditolak membaca tabel media_assets');

-- Kolom kunci tidak ada di view.
select throws_ok('select answer_key from public.items_public', '42703', null, 'NEGATIF: items_public tidak punya answer_key');
select throws_ok('select equivalents from public.items_public', '42703', null, 'NEGATIF: items_public tidak punya equivalents');
select throws_ok('select tolerance from public.items_public', '42703', null, 'NEGATIF: items_public tidak punya tolerance');
select throws_ok('select distractor_hints from public.items_public', '42703', null, 'NEGATIF: items_public tidak punya distractor_hints');
select throws_ok('select explanation from public.items_public', '42703', null, 'NEGATIF: items_public tidak punya explanation');
select throws_ok('select status from public.items_public', '42703', null, 'items_public tidak membuka kolom status');

select columns_are('public', 'items_public',
  array['id', 'code', 'competency_id', 'tier', 'answer_type', 'stem', 'options', 'layout_mode', 'stimulus_id', 'difficulty', 'version'],
  'items_public memuat tepat kolom yang aman');

-- Hanya butir terbit.
select results_eq('select code from public.items_public order by code',
  $$values ('MAT-PUB-01'::text), ('MAT-PUB-05')$$,
  'items_public hanya memuat butir berstatus published');
select is_empty($$select 1 from public.items_public where code in ('MAT-DRF-02', 'MAT-REV-03', 'MAT-OLD-04')$$,
  'NEGATIF: butir draf, ditinjau, dan dipensiunkan tidak terbaca');

-- Isi stem dan options disaring ke kunci yang diizinkan.
select is((select stem from public.items_public where code = 'MAT-PUB-01'),
  '{"text":"Soal terbit","formula":"x^2=4","media_ids":["30000000-0000-0000-0000-000000000001"]}'::jsonb,
  'NEGATIF: bidang tambahan di stem ("rahasia") tidak ikut keluar');
select is((select options from public.items_public where code = 'MAT-PUB-01'),
  '[{"id":"a","label":"A","text":"2"},{"id":"b","label":"B","text":"3"}]'::jsonb,
  'NEGATIF: bidang tambahan di options ("correct", "hint", "rahasia") tidak ikut keluar');
select ok(
  not exists (
    select 1 from public.items_public
    where stem::text ilike '%rahasia%' or stem::text ilike '%bocor%' or options::text ilike '%bocor%'
       or options::text ilike '%correct%' or options::text ilike '%hint%'
  ),
  'tidak ada jejak kunci atau petunjuk di seluruh baris items_public'
);
select is((select options from public.items_public where code = 'MAT-PUB-05'), '[]'::jsonb, 'butir isian punya options kosong');

-- Stimulus dan media.
select results_eq('select id from public.stimuli_public',
  $$values ('40000000-0000-0000-0000-000000000001'::uuid)$$,
  'stimuli_public hanya memuat stimulus dari butir terbit');
select results_eq('select id from public.media_assets_public order by id',
  $$values ('30000000-0000-0000-0000-000000000001'::uuid), ('30000000-0000-0000-0000-000000000003'::uuid)$$,
  'media_assets_public memuat media butir terbit dan media stimulusnya');
select is_empty($$select 1 from public.media_assets_public where id in ('30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004')$$,
  'NEGATIF: media butir draf dan media yang tidak dipakai tidak terbaca');

-- Penulisan.
select throws_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, layout_mode, difficulty)
  values ('MAT-HAX-09', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{}', '[]', 'standar', 0.1)$$, '42501', null,
  'NEGATIF: siswa tidak bisa menulis items');
select throws_ok($$update public.items set status = 'published'$$, '42501', null, 'NEGATIF: siswa tidak bisa mengubah items');
select throws_ok($$delete from public.items$$, '42501', null, 'NEGATIF: siswa tidak bisa menghapus items');
select throws_ok($$insert into public.stages (number, name) values (5, 'Palsu')$$, '42501', null, 'NEGATIF: siswa tidak bisa menulis stages');
select throws_ok($$update public.competencies set name = 'x'$$, '42501', null, 'NEGATIF: siswa tidak bisa mengubah competencies');
select throws_ok($$insert into public.worksheets (title, stage_id, release_at) values ('x', '10000000-0000-0000-0000-000000000001', now())$$, '42501', null,
  'NEGATIF: siswa tidak bisa membuat worksheet');
select throws_ok($$delete from public.worksheet_items$$, '42501', null, 'NEGATIF: siswa tidak bisa menghapus worksheet_items');

-- Kurikulum terbuka untuk dibaca.
select is((select count(*)::int from public.stages), 2, 'siswa membaca stages');
select is((select count(*)::int from public.competencies), 3, 'siswa membaca competencies');
select is((select count(*)::int from public.competency_prereqs), 2, 'siswa membaca competency_prereqs');

-- Worksheet: hanya yang terbit dan sudah waktunya.
select results_eq('select title from public.worksheets', $$values ('Rilis lalu'::text)$$,
  'siswa hanya membaca worksheet yang terbit dan sudah dirilis');
select is_empty($$select 1 from public.worksheets where title in ('Masih draf', 'Terbit nanti')$$,
  'NEGATIF: worksheet draf dan yang jadwalnya di masa depan tersembunyi');
select results_eq('select position::int from public.worksheet_items order by position', $$values (1), (2)$$,
  'siswa membaca butir worksheet yang dirilis');
select is_empty($$select 1 from public.worksheet_items where worksheet_id in ('60000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003')$$,
  'NEGATIF: isi worksheet draf atau yang belum waktunya tersembunyi');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Orang tua, admin, dan anon
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000b1');
select throws_ok('select answer_key from public.items', '42501', null, 'NEGATIF: orang tua tidak bisa membaca answer_key dari tabel');
select throws_ok('select explanation from public.items', '42501', null, 'NEGATIF: orang tua tidak bisa membaca explanation dari tabel');
select is((select count(*)::int from public.items_public), 2, 'orang tua membaca items_public (butir terbit saja)');
reset role;

select pg_temp.login_as('00000000-0000-0000-0000-0000000000a1');
select throws_ok('select * from public.items', '42501', null,
  'NEGATIF: admin pun ditolak membaca items lewat klien (harus lewat server dengan service_role)');
select throws_ok($$update public.items set status = 'retired'$$, '42501', null, 'NEGATIF: admin tidak menulis items lewat klien');
select is((select count(*)::int from public.items_public), 2, 'admin membaca items_public seperti pengguna lain');
reset role;

set local role anon;
select throws_ok('select * from public.items_public', '42501', null, 'NEGATIF: anon tidak bisa membaca items_public');
select throws_ok('select * from public.stages', '42501', null, 'NEGATIF: anon tidak bisa membaca stages');
select throws_ok('select * from public.worksheets', '42501', null, 'NEGATIF: anon tidak bisa membaca worksheets');
select throws_ok('select * from public.items', '42501', null, 'NEGATIF: anon tidak bisa membaca items');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Pembatas di database (dites sebagai superuser, seperti penulisan dari server)
-- ---------------------------------------------------------------------------------------------
select throws_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, explanation, layout_mode, difficulty, status)
  values ('MAT-BAD-10', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{}', '[]', '{"text":"ada"}', 'standar', 0.1, 'published')$$,
  '23514', null, 'butir terbit tanpa kunci ditolak database');
select throws_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, explanation, layout_mode, difficulty, status)
  values ('MAT-BAD-11', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{}', '["a"]', '{"text":"  "}', 'standar', 0.1, 'published')$$,
  '23514', null, 'butir terbit tanpa pembahasan ditolak database');
select lives_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, layout_mode, difficulty)
  values ('MAT-OK-12', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{}', '[]', 'standar', 0.1)$$,
  'butir draf boleh belum lengkap');
select throws_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, layout_mode, difficulty)
  values ('MAT-BAD-13', '20000000-0000-0000-0000-000000000001', 'pemula', 'pg', '{}', '[]', 'standar', 0.1)$$,
  '23514', null, 'tingkat yang tidak dikenal ditolak');
select throws_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, layout_mode, difficulty)
  values ('mat bad 14', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{}', '[]', 'standar', 0.1)$$,
  '23514', null, 'kode butir yang formatnya salah ditolak');
select throws_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, layout_mode, difficulty)
  values ('MAT-PUB-01', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{}', '[]', 'standar', 0.1)$$,
  '23505', null, 'kode butir kembar ditolak');
select throws_ok($$insert into public.items (code, competency_id, tier, answer_type, stem, answer_key, layout_mode, difficulty)
  values ('MAT-BAD-15', '20000000-0000-0000-0000-000000000001', 'dasar', 'pg', '{}', '{"a":1}', 'standar', 0.1)$$,
  '23514', null, 'answer_key yang bukan daftar ditolak');
select throws_ok($$insert into public.media_assets (kind, storage_path, alt_text) values ('image', 'media/x.png', '   ')$$,
  '23514', null, 'media tanpa teks alternatif ditolak database');
select throws_ok($$insert into public.media_assets (kind, storage_path, alt_text) values ('audio', 'media/x.mp3', 'Rekaman')$$,
  '23514', null, 'audio tanpa transkrip ditolak database');
select lives_ok($$insert into public.media_assets (kind, storage_path, alt_text, transcript) values ('audio', 'media/x.mp3', 'Rekaman', 'Halo.')$$,
  'audio dengan transkrip diterima');
select throws_ok($$insert into public.worksheet_items (worksheet_id, item_id, position, slot)
  values ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 3, 'ulang')$$,
  '23505', null, 'butir yang sama dua kali dalam satu worksheet ditolak');
select throws_ok($$insert into public.worksheet_items (worksheet_id, item_id, position, slot)
  values ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 2, 'ulang')$$,
  '23505', null, 'dua butir di posisi yang sama ditolak');
select throws_ok($$insert into public.worksheet_items (worksheet_id, item_id, position, slot)
  values ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 3, 'lain')$$,
  '23514', null, 'slot yang tidak dikenal ditolak');
select throws_ok($$delete from public.items where id = '50000000-0000-0000-0000-000000000001'$$, '23503', null,
  'butir yang dipakai worksheet tidak bisa dihapus');

-- Prasyarat tanpa lingkaran.
select throws_ok($$insert into public.competency_prereqs (competency_id, prereq_id)
  values ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001')$$, '23514', null,
  'kompetensi tidak bisa menjadi prasyarat dirinya sendiri');
select throws_ok($$insert into public.competency_prereqs (competency_id, prereq_id)
  values ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003')$$, '23514', null,
  'prasyarat yang membentuk lingkaran tidak langsung (M3.1 ← M3.3 ← M3.2 ← M3.1) ditolak');
select lives_ok($$insert into public.competency_prereqs (competency_id, prereq_id)
  values ('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001')$$,
  'prasyarat tambahan yang tidak membentuk lingkaran diterima');

select * from finish();
rollback;
