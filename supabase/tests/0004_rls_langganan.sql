-- Tes pgTAP untuk migrasi 0004 (langganan, layanan, audit): payment_events hanya untuk server,
-- audit_log hanya bisa ditambah, orang tua hanya membaca langganan dan fakturnya, plans terbaca
-- publik, dan tidak ada tabel di skema public tanpa RLS.
-- Jalankan dengan: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
select plan(106);

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
-- Pengguna: admin, orang tua 1 (anak: siswa A), orang tua 2, siswa A
-- ---------------------------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.id', '{"role":"admin"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2@test.id', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.id', '{"role":"student"}', '{}', now(), now());

insert into public.students (id, profile_id) values ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000c1');
insert into public.guardianships (parent_id, student_id) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005a');

create or replace function pg_temp.login_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  set local role authenticated;
end;
$$;

create or replace function pg_temp.rows_affected(statement text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Data (ditulis sebagai superuser, seperti server dengan service_role)
-- ---------------------------------------------------------------------------------------------
insert into public.subscriptions (id, parent_id, plan_id, status, current_period_end) values
  ('c0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'semester', 'active', now() + interval '170 days'),
  ('c0000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2', 'monthly', 'trialing', now() + interval '7 days');

insert into public.invoices (id, subscription_id, parent_id, number, amount, status, provider_id, paid_at) values
  ('d0000000-0000-0000-0000-0000000000b1', 'c0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'INV-2026-000001', 149000, 'paid', 'mock_inv_1', now() - interval '10 days'),
  ('d0000000-0000-0000-0000-0000000000b2', 'c0000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2', 'INV-2026-000002', 29900, 'pending', 'mock_inv_2', null);

insert into public.payment_events (provider, provider_event_id, payload) values
  ('mock', 'evt_1', '{"invoice":"mock_inv_1","status":"paid","card_last4":"4242"}');

insert into public.conversations (id, owner_id, audience) values
  ('e0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'parent'),
  ('e0000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', 'student');
insert into public.messages (conversation_id, owner_id, sender, body, tool_calls) values
  ('e0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'user', 'Kapan tagihan berikutnya?', '[]'),
  ('e0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'agent_l1', 'Tagihan berikutnya 3 Apr 2027.', '[{"tool":"get_subscription","result":{"internal":"rahasia"}}]'),
  ('e0000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', 'user', 'Pena tidak muncul.', '[]');

insert into public.crm_events (subject_id, signal, action) values
  ('00000000-0000-0000-0000-0000000000b1', 'renewal_near', 'notify_parent');

insert into public.notifications (id, recipient_id, kind, title) values
  ('f0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'report_ready', 'Laporan minggu ini siap'),
  ('f0000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2', 'trial_ending', 'Uji coba berakhir 3 hari lagi'),
  ('f0000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', 'reminder', 'Waktunya latihan');

insert into public.ai_decisions (id, component, subject_id, model, prompt_version, output, tokens_in, tokens_out, cost) values
  ('a1000000-0000-0000-0000-000000000001', 'ink.analyze', '00000000-0000-0000-0000-0000000000c1', 'model-x', 'hint-v1', '{"hint":"Cek tanda."}', 900, 40, 12.5);

insert into public.audit_log (actor_id, action, target, details) values
  ('00000000-0000-0000-0000-0000000000a1', 'hint_report.resolve', 'hint_reports/a0', '{"status":"valid"}');

-- Konten dan percobaan minimal untuk menguji kunci asing hints_shown.ai_decision_id.
insert into public.stages (id, number, name) values ('10000000-0000-0000-0000-000000000001', 3, 'Persamaan Kuadrat');
insert into public.competencies (id, code, stage_id, domain, name) values
  ('20000000-0000-0000-0000-000000000001', 'M3.1', '10000000-0000-0000-0000-000000000001', 'Aljabar', 'Menentukan akar');
insert into public.items (id, code, competency_id, tier, answer_type, stem, answer_key, explanation, layout_mode, difficulty, status)
values ('50000000-0000-0000-0000-000000000001', 'MAT-01', '20000000-0000-0000-0000-000000000001', 'dasar', 'isian', '{"text":"1"}', '["6"]', '{"text":"P"}', 'standar', 0.3, 'published');
insert into public.worksheets (id, title, stage_id, release_at, status) values
  ('60000000-0000-0000-0000-000000000001', 'Minggu 1', '10000000-0000-0000-0000-000000000001', now() - interval '1 day', 'published');
insert into public.assignments (id, student_id, worksheet_id) values
  ('70000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000005a', '60000000-0000-0000-0000-000000000001');
insert into public.attempts (id, student_id, item_id, assignment_id, answer, score, submitted_at, duration_ms) values
  ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', '{"text":"5"}', 0, now(), 1000);

-- ---------------------------------------------------------------------------------------------
-- Skema
-- ---------------------------------------------------------------------------------------------
select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.plans'::regclass, 'public.subscriptions'::regclass, 'public.invoices'::regclass,
                 'public.payment_events'::regclass, 'public.conversations'::regclass, 'public.messages'::regclass,
                 'public.crm_events'::regclass, 'public.notifications'::regclass, 'public.ai_decisions'::regclass,
                 'public.audit_log'::regclass)),
  'RLS aktif di semua tabel langganan, layanan, dan audit'
);
select is_empty($$
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
$$, 'NEGATIF: tidak ada tabel di skema public tanpa RLS (aturan 4)');
select is_empty($$
  select table_name, grantee, privilege_type from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('plans', 'subscriptions', 'invoices', 'payment_events', 'conversations', 'messages',
                       'crm_events', 'notifications', 'ai_decisions', 'audit_log')
    and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'
$$, 'NEGATIF: anon dan authenticated tidak punya hak tulis tingkat tabel');
select is((
  select string_agg(format('%s.%s:%s', table_name, column_name, privilege_type), ',')
  from information_schema.column_privileges
  where table_schema = 'public'
    and table_name in ('plans', 'subscriptions', 'invoices', 'payment_events', 'conversations', 'messages',
                       'crm_events', 'notifications', 'ai_decisions', 'audit_log')
    and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'
), 'notifications.read_at:UPDATE', 'satu-satunya hak tulis klien: UPDATE notifications.read_at');
select is_empty($$
  select privilege_type from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'payment_events' and grantee in ('anon', 'authenticated')
$$, 'NEGATIF: payment_events tidak punya hak apa pun untuk klien');
select is_empty($$
  select privilege_type from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'audit_log' and grantee = 'service_role'
    and privilege_type in ('UPDATE', 'DELETE', 'TRUNCATE')
$$, 'NEGATIF: service_role tidak punya hak UPDATE/DELETE/TRUNCATE di audit_log');
select results_eq('select id, name, price, strike_price, months from public.plans order by sort_order',
  $$values ('monthly'::text, 'Bulanan'::text, 29900, null::integer, 1::smallint),
           ('semester', 'Semester', 149000, 179400, 6::smallint),
           ('annual', 'Tahunan', 249000, 358800, 12::smallint)$$,
  'harga dan harga coret paket tersimpan di tabel plans');

-- ---------------------------------------------------------------------------------------------
-- Anon
-- ---------------------------------------------------------------------------------------------
set local role anon;
select results_eq('select count(*)::int from public.plans', $$values (3)$$, 'anon membaca plans untuk halaman /harga');
select throws_ok($$update public.plans set price = 1000$$, '42501', null, 'NEGATIF: anon tidak bisa mengubah harga');
select throws_ok('select * from public.subscriptions', '42501', null, 'NEGATIF: anon ditolak membaca subscriptions');
select throws_ok('select * from public.payment_events', '42501', null, 'NEGATIF: anon ditolak membaca payment_events');
select throws_ok('select * from public.audit_log', '42501', null, 'NEGATIF: anon ditolak membaca audit_log');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Orang tua 1
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000b1');

select results_eq('select count(*)::int from public.plans', $$values (3)$$, 'orang tua membaca plans');
select results_eq('select id from public.subscriptions', $$values ('c0000000-0000-0000-0000-0000000000b1'::uuid)$$, 'orang tua 1 membaca langganannya');
select results_eq('select number from public.invoices', $$values ('INV-2026-000001'::text)$$, 'orang tua 1 membaca fakturnya');
select is_empty($$select 1 from public.subscriptions where parent_id = '00000000-0000-0000-0000-0000000000b2'$$, 'NEGATIF: orang tua 1 tidak membaca langganan orang tua 2');
select is_empty($$select 1 from public.invoices where parent_id = '00000000-0000-0000-0000-0000000000b2'$$, 'NEGATIF: orang tua 1 tidak membaca faktur orang tua 2');

select throws_ok('select * from public.payment_events', '42501', null, 'NEGATIF: orang tua ditolak membaca payment_events');
select throws_ok($$insert into public.subscriptions (parent_id, plan_id, status, current_period_end) values ('00000000-0000-0000-0000-0000000000b1', 'annual', 'active', now() + interval '1 year')$$,
  '42501', null, 'NEGATIF: orang tua tidak bisa membuat langganan aktif sendiri');
select throws_ok($$update public.subscriptions set current_period_end = now() + interval '10 years'$$, '42501', null, 'NEGATIF: orang tua tidak bisa memperpanjang langganan sendiri');
select throws_ok($$update public.subscriptions set status = 'active', plan_id = 'annual'$$, '42501', null, 'NEGATIF: orang tua tidak bisa mengganti paket langsung');
select throws_ok($$insert into public.invoices (subscription_id, parent_id, number, amount, status, paid_at) values ('c0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'INV-X', 1, 'paid', now())$$,
  '42501', null, 'NEGATIF: orang tua tidak bisa membuat faktur lunas');
select throws_ok($$update public.invoices set status = 'paid', paid_at = now()$$, '42501', null, 'NEGATIF: orang tua tidak bisa menandai faktur lunas');
select throws_ok($$update public.plans set price = 1$$, '42501', null, 'NEGATIF: orang tua tidak bisa mengubah harga');
select throws_ok($$insert into public.payment_events (provider, provider_event_id, payload) values ('mock', 'palsu', '{}')$$,
  '42501', null, 'NEGATIF: orang tua tidak bisa memalsukan peristiwa pembayaran');

-- Percakapan: miliknya saja; tool_calls tidak terbaca.
select results_eq('select id from public.conversations', $$values ('e0000000-0000-0000-0000-0000000000b1'::uuid)$$, 'orang tua 1 membaca percakapannya');
select results_eq('select body from public.messages order by created_at, body',
  $$values ('Kapan tagihan berikutnya?'::text), ('Tagihan berikutnya 3 Apr 2027.')$$, 'orang tua 1 membaca pesan percakapannya');
select is_empty($$select 1 from public.conversations where owner_id = '00000000-0000-0000-0000-0000000000c1'$$, 'NEGATIF: orang tua tidak membaca percakapan bantuan anaknya');
select is_empty($$select 1 from public.messages where owner_id = '00000000-0000-0000-0000-0000000000c1'$$, 'NEGATIF: orang tua tidak membaca pesan anaknya');
select throws_ok('select tool_calls from public.messages', '42501', null, 'NEGATIF: tool_calls (jejak alat AI) tidak terbaca klien');
select throws_ok('select * from public.messages', '42501', null, 'NEGATIF: select * ditolak karena memuat tool_calls');
select throws_ok($$insert into public.messages (conversation_id, owner_id, sender, body) values ('e0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'agent_l2', 'Dana dikembalikan.')$$,
  '42501', null, 'NEGATIF: klien tidak bisa menulis pesan atas nama agen');
select throws_ok($$update public.conversations set level = 2$$, '42501', null, 'NEGATIF: klien tidak bisa menaikkan level percakapan sendiri');

-- Notifikasi: miliknya; hanya read_at yang bisa diubah, dan waktunya dicatat server.
select results_eq('select id from public.notifications', $$values ('f0000000-0000-0000-0000-0000000000b1'::uuid)$$, 'orang tua 1 hanya membaca notifikasinya');
select is(pg_temp.rows_affected($$update public.notifications set read_at = '2020-01-01' where id = 'f0000000-0000-0000-0000-0000000000b1'$$),
  1::bigint, 'orang tua 1 menandai notifikasinya sudah dibaca');
select is((select read_at from public.notifications where id = 'f0000000-0000-0000-0000-0000000000b1'), now(),
  'read_at diisi waktu server, bukan tanggal kiriman klien');
select is(pg_temp.rows_affected($$update public.notifications set read_at = now() where id = 'f0000000-0000-0000-0000-0000000000b2'$$),
  0::bigint, 'NEGATIF: orang tua 1 tidak bisa menandai notifikasi orang lain');
select throws_ok($$update public.notifications set title = 'Diubah'$$, '42501', null, 'NEGATIF: klien tidak bisa mengubah isi notifikasi');
select throws_ok($$insert into public.notifications (recipient_id, kind, title) values ('00000000-0000-0000-0000-0000000000b2', 'x', 'Spam')$$,
  '42501', null, 'NEGATIF: klien tidak bisa mengirim notifikasi');
select throws_ok($$delete from public.notifications$$, '42501', null, 'NEGATIF: klien tidak bisa menghapus notifikasi');

-- Data internal tidak terbaca.
select is_empty('select 1 from public.crm_events', 'NEGATIF: orang tua tidak membaca crm_events (termasuk tentang dirinya)');
select is_empty('select 1 from public.ai_decisions', 'NEGATIF: orang tua tidak membaca ai_decisions');
select is_empty('select 1 from public.audit_log', 'NEGATIF: orang tua tidak membaca audit_log');
select throws_ok($$insert into public.audit_log (actor_id, action, target) values ('00000000-0000-0000-0000-0000000000b1', 'palsu', 'x')$$,
  '42501', null, 'NEGATIF: klien tidak bisa menulis audit_log');
select throws_ok($$insert into public.ai_decisions (component, output) values ('palsu', '{}')$$,
  '42501', null, 'NEGATIF: klien tidak bisa menulis ai_decisions');
select throws_ok($$insert into public.crm_events (subject_id, signal, action) values ('00000000-0000-0000-0000-0000000000b1', 'x', 'y')$$,
  '42501', null, 'NEGATIF: klien tidak bisa menulis crm_events');

-- ---------------------------------------------------------------------------------------------
-- Orang tua 2
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000b2');
select results_eq('select id from public.subscriptions', $$values ('c0000000-0000-0000-0000-0000000000b2'::uuid)$$, 'orang tua 2 hanya membaca langganannya');
select results_eq('select number from public.invoices', $$values ('INV-2026-000002'::text)$$, 'orang tua 2 hanya membaca fakturnya');
select is_empty('select 1 from public.conversations', 'NEGATIF: orang tua 2 tidak membaca percakapan orang lain');

-- ---------------------------------------------------------------------------------------------
-- Siswa A
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000c1');
select is_empty('select 1 from public.subscriptions', 'NEGATIF: siswa tidak membaca langganan orang tuanya');
select is_empty('select 1 from public.invoices', 'NEGATIF: siswa tidak membaca faktur');
select results_eq('select id from public.conversations', $$values ('e0000000-0000-0000-0000-0000000000c1'::uuid)$$, 'siswa membaca percakapan bantuannya');
select results_eq('select id from public.notifications', $$values ('f0000000-0000-0000-0000-0000000000c1'::uuid)$$, 'siswa membaca notifikasinya');
select is_empty('select 1 from public.ai_decisions', 'NEGATIF: siswa tidak membaca keputusan AI tentang dirinya lewat klien');
select results_eq('select count(*)::int from public.plans', $$values (3)$$, 'siswa membaca plans');

-- ---------------------------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000000a1');
select results_eq('select count(*)::int from public.subscriptions', $$values (2)$$, 'admin membaca semua langganan');
select results_eq('select count(*)::int from public.invoices', $$values (2)$$, 'admin membaca semua faktur');
select results_eq('select count(*)::int from public.conversations', $$values (2)$$, 'admin membaca semua percakapan');
select results_eq('select count(*)::int from public.messages', $$values (3)$$, 'admin membaca semua pesan');
select results_eq('select count(*)::int from public.crm_events', $$values (1)$$, 'admin membaca crm_events');
select results_eq('select cost from public.ai_decisions', $$values (12.5::numeric)$$, 'admin membaca ai_decisions (biaya AI)');
select results_eq('select action from public.audit_log', $$values ('hint_report.resolve'::text)$$, 'admin membaca audit_log');
select throws_ok('select * from public.payment_events', '42501', null, 'NEGATIF: admin pun tidak membaca payment_events lewat klien');
select throws_ok('select tool_calls from public.messages', '42501', null, 'NEGATIF: admin membaca tool_calls lewat server, bukan klien');
select throws_ok($$update public.subscriptions set status = 'active'$$, '42501', null, 'NEGATIF: admin mengubah langganan lewat server (tercatat audit)');
select throws_ok($$update public.audit_log set action = 'dihapus'$$, '42501', null, 'NEGATIF: admin tidak bisa mengubah audit_log');
select throws_ok($$delete from public.audit_log$$, '42501', null, 'NEGATIF: admin tidak bisa menghapus audit_log');
select throws_ok($$update public.plans set price = 1$$, '42501', null, 'NEGATIF: harga diubah lewat server/SQL, bukan klien');
select is_empty('select 1 from public.notifications', 'admin tidak membaca notifikasi milik orang lain');

-- ---------------------------------------------------------------------------------------------
-- Server dan worker (service_role)
-- ---------------------------------------------------------------------------------------------
reset role;
set local role service_role;
select lives_ok($$insert into public.audit_log (actor_id, action, target) values ('00000000-0000-0000-0000-0000000000a1', 'subscription.extend', 'subscriptions/c0')$$,
  'service_role menambah audit_log');
select throws_ok($$update public.audit_log set action = 'diubah'$$, '42501', null, 'NEGATIF: service_role tidak bisa mengubah audit_log');
select throws_ok($$delete from public.audit_log$$, '42501', null, 'NEGATIF: service_role tidak bisa menghapus audit_log');
select throws_ok($$truncate public.audit_log$$, '42501', null, 'NEGATIF: service_role tidak bisa mengosongkan audit_log');
select lives_ok($$insert into public.payment_events (provider, provider_event_id, payload) values ('mock', 'evt_2', '{"status":"paid"}')$$,
  'service_role (webhook) menyimpan peristiwa pembayaran');
select lives_ok($$insert into public.payment_events (provider, provider_event_id, payload) values ('mock', 'evt_2', '{"status":"paid"}') on conflict (provider, provider_event_id) do nothing$$,
  'webhook yang sama dikirim ulang tidak galat dengan ON CONFLICT DO NOTHING');
select results_eq($$select count(*)::int from public.payment_events where provider_event_id = 'evt_2'$$, $$values (1)$$,
  'peristiwa webhook yang sama tetap satu baris (diproses sekali)');
select throws_ok($$insert into public.payment_events (provider, provider_event_id, payload) values ('mock', 'evt_2', '{}')$$,
  '23505', null, 'NEGATIF: provider_event_id yang sama ditolak kunci unik');
select lives_ok($$update public.invoices set status = 'paid', paid_at = now() where id = 'd0000000-0000-0000-0000-0000000000b2'$$,
  'service_role menandai faktur lunas setelah webhook');
select lives_ok($$insert into public.notifications (recipient_id, kind, title) values ('00000000-0000-0000-0000-0000000000b1', 'payment_received', 'Pembayaran diterima')$$,
  'service_role (worker) mengirim notifikasi');
reset role;

-- ---------------------------------------------------------------------------------------------
-- audit_log hanya bisa ditambah, bahkan oleh superuser (trigger)
-- ---------------------------------------------------------------------------------------------
select throws_ok($$update public.audit_log set action = 'diubah'$$, '42501', null, 'NEGATIF: superuser pun tidak bisa mengubah audit_log');
select throws_ok($$delete from public.audit_log$$, '42501', null, 'NEGATIF: superuser pun tidak bisa menghapus audit_log');
select throws_ok($$truncate public.audit_log$$, '42501', null, 'NEGATIF: superuser pun tidak bisa mengosongkan audit_log');
insert into public.audit_log (actor_id, action, target, at) values (null, 'system.backdate', 'x', now() - interval '1 year');
select is((select at from public.audit_log where action = 'system.backdate'), now(), 'NEGATIF: waktu audit tidak bisa dimundurkan');
select results_eq('select count(*)::int from public.audit_log', $$values (3)$$, 'semua catatan audit tetap ada');

-- ---------------------------------------------------------------------------------------------
-- Integritas langganan dan faktur
-- ---------------------------------------------------------------------------------------------
select throws_ok($$insert into public.subscriptions (parent_id, plan_id, status, current_period_end) values ('00000000-0000-0000-0000-0000000000b1', 'monthly', 'trialing', now() + interval '7 days')$$,
  '23505', null, 'NEGATIF: satu langganan hidup per orang tua (checkout ganda ditolak)');
select lives_ok($$insert into public.subscriptions (parent_id, plan_id, status, current_period_end) values ('00000000-0000-0000-0000-0000000000b1', 'monthly', 'canceled', now() - interval '30 days')$$,
  'riwayat langganan yang sudah dibatalkan boleh ada di samping yang aktif');
select throws_ok($$update public.subscriptions set status = 'paused' where id = 'c0000000-0000-0000-0000-0000000000b1'$$,
  '23514', null, 'NEGATIF: langganan dijeda wajib punya paused_until');
select lives_ok($$update public.subscriptions set status = 'paused', paused_until = now() + interval '14 days' where id = 'c0000000-0000-0000-0000-0000000000b1'$$,
  'jeda dengan tanggal lanjut diterima');
select throws_ok($$insert into public.subscriptions (parent_id, plan_id, status, current_period_end) values ('00000000-0000-0000-0000-0000000000b2', 'lifetime', 'canceled', now())$$,
  '23503', null, 'NEGATIF: paket harus ada di tabel plans');
select throws_ok($$insert into public.invoices (subscription_id, parent_id, number, amount) values ('c0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', 'INV-2026-000009', 1000)$$,
  '23503', null, 'NEGATIF: faktur tidak bisa ditagihkan ke orang tua lain');
select throws_ok($$insert into public.invoices (subscription_id, parent_id, number, amount, status) values ('c0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'INV-2026-000010', 1000, 'paid')$$,
  '23514', null, 'NEGATIF: faktur lunas wajib punya paid_at');
select throws_ok($$update public.invoices set status = 'refunded' where id = 'd0000000-0000-0000-0000-0000000000b1'$$,
  '23514', null, 'NEGATIF: pengembalian dana wajib punya refunded_at');
select throws_ok($$insert into public.invoices (subscription_id, parent_id, number, amount) values ('c0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'INV-2026-000011', 0)$$,
  '23514', null, 'NEGATIF: nominal faktur harus lebih dari nol');
select throws_ok($$insert into public.invoices (subscription_id, parent_id, number, amount, provider_id) values ('c0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'INV-2026-000012', 1000, 'mock_inv_1')$$,
  '23505', null, 'NEGATIF: id tagihan penyedia tidak boleh dipakai dua faktur');
select throws_ok($$update public.invoices set pdf_path = 'lain/faktur.pdf' where id = 'd0000000-0000-0000-0000-0000000000b1'$$,
  '23514', null, 'NEGATIF: pdf_path harus {subscription_id}/{invoice_id}.pdf');
select throws_ok($$update public.plans set strike_price = 100 where id = 'semester'$$,
  '23514', null, 'NEGATIF: harga coret harus di atas harga');

-- Layanan dan AI.
select throws_ok($$insert into public.messages (conversation_id, owner_id, sender, body) values ('e0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1', 'user', 'x')$$,
  '23503', null, 'NEGATIF: pesan harus milik pemilik percakapan yang sama');
select throws_ok($$insert into public.ai_decisions (component, model, output) values ('ink.analyze', 'model-x', '{}')$$,
  '23514', null, 'NEGATIF: keputusan dengan model AI wajib mencatat versi prompt');
select lives_ok($$insert into public.ai_decisions (component, rule_or_signal, output) values ('hint.fallback', 'distractor_rule', '{}')$$,
  'keputusan tanpa AI (fallback aturan) boleh tanpa model');
-- Kunci asing ini ditunda sampai COMMIT; tes memeriksanya segera dengan SET CONSTRAINTS.
set constraints hints_shown_ai_decision_id_fkey immediate;
select throws_ok($$insert into public.hints_shown (attempt_id, student_id, source, text, ai_decision_id) values ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', 'ai_ink', 'Petunjuk', 'a1000000-0000-0000-0000-0000000000ff')$$,
  '23503', null, 'NEGATIF: petunjuk AI harus menunjuk ai_decisions yang ada');
select lives_ok($$insert into public.hints_shown (attempt_id, student_id, source, text, ai_decision_id) values ('80000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000005a', 'ai_ink', 'Cek tanda.', 'a1000000-0000-0000-0000-000000000001')$$,
  'petunjuk AI yang menunjuk keputusannya diterima');
select throws_ok($$delete from public.ai_decisions where id = 'a1000000-0000-0000-0000-000000000001'$$,
  '23503', null, 'NEGATIF: keputusan AI yang masih dirujuk petunjuk tidak bisa dihapus sendirian');
set constraints hints_shown_ai_decision_id_fkey deferred;

-- Penghapusan akun.
select throws_ok($$delete from auth.users where id = '00000000-0000-0000-0000-0000000000b1'$$,
  '23503', null, 'NEGATIF: akun orang tua dengan riwayat langganan tidak terhapus diam-diam (ditangani Fase 65)');
delete from auth.users where id = '00000000-0000-0000-0000-0000000000c1';
select is_empty($$
  select 1 from public.ai_decisions where subject_id = '00000000-0000-0000-0000-0000000000c1'
  union all select 1 from public.conversations where owner_id = '00000000-0000-0000-0000-0000000000c1'
  union all select 1 from public.notifications where recipient_id = '00000000-0000-0000-0000-0000000000c1'
  union all select 1 from public.hints_shown where student_id = '00000000-0000-0000-0000-00000000005a'
$$, 'hapus akun siswa: keputusan AI, percakapan, notifikasi, dan petunjuknya ikut terhapus');
select lives_ok('set constraints all immediate', 'hapus akun siswa lolos pemeriksaan kunci asing saat commit');
select results_eq('select count(*)::int from public.audit_log', $$values (3)$$, 'catatan audit tetap ada setelah akun dihapus');

select * from finish();
rollback;
