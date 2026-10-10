-- Tes pgTAP untuk migrasi 0006: versi persetujuan wajib, dan persetujuan hanya ditulis server.
-- Jalankan dengan: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

delete from auth.users;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.id',
     '{}', '{"full_name":"Orang Tua Satu"}', now(), now()),
  ('00000000-0000-0000-0000-0000000006b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2@test.id',
     '{}', '{"full_name":"Orang Tua Dua"}', now(), now());

create or replace function pg_temp.login_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  set local role authenticated;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Skema
-- ---------------------------------------------------------------------------------------------
select col_not_null('public', 'consents', 'version', 'consents.version wajib diisi');
select col_hasnt_default('public', 'consents', 'version', 'consents.version tanpa nilai bawaan: server selalu mengirim versinya');
select ok(
  not has_table_privilege('authenticated', 'public.consents', 'INSERT')
  and not has_any_column_privilege('authenticated', 'public.consents', 'INSERT'),
  'NEGATIF: authenticated tidak punya hak INSERT di consents, termasuk per kolom'
);
select ok(
  not has_table_privilege('authenticated', 'public.consents', 'UPDATE')
  and not has_any_column_privilege('authenticated', 'public.consents', 'UPDATE'),
  'NEGATIF: authenticated tidak punya hak UPDATE di consents, termasuk per kolom'
);
select policies_are('public', 'consents', array['consents_select'],
  'consents hanya punya kebijakan baca; kebijakan tulis klien dari 0001 sudah dihapus');

-- ---------------------------------------------------------------------------------------------
-- Jalur server (service_role), dipakai POST /api/consent
-- ---------------------------------------------------------------------------------------------
set local role service_role;
select lives_ok($$insert into public.consents (parent_id, type, granted, version) values ('00000000-0000-0000-0000-0000000006b1', 'data_anak', true, 'persetujuan-v1-2026-10')$$,
  'server mencatat persetujuan beserta versinya');
select throws_ok($$insert into public.consents (parent_id, type, granted) values ('00000000-0000-0000-0000-0000000006b2', 'data_anak', true)$$, '23502', null,
  'NEGATIF: persetujuan tanpa versi ditolak');
select throws_ok($$insert into public.consents (parent_id, type, granted, version) values ('00000000-0000-0000-0000-0000000006b2', 'data_anak', true, '  ')$$, '23514', null,
  'NEGATIF: versi kosong ditolak');
select lives_ok($$insert into public.consents (parent_id, type, granted, version) values ('00000000-0000-0000-0000-0000000006b1', 'data_anak', false, 'persetujuan-v2-2027-01')
  on conflict (parent_id, type) do update set granted = excluded.granted, version = excluded.version$$,
  'server mencatat ulang keputusan dengan versi baru (upsert)');
reset role;
select is((select version from public.consents where parent_id = '00000000-0000-0000-0000-0000000006b1' and type = 'data_anak'),
  'persetujuan-v2-2027-01', 'versi terakhir tersimpan');
select is((select granted from public.consents where parent_id = '00000000-0000-0000-0000-0000000006b1' and type = 'data_anak'),
  false, 'keputusan terakhir (tolak) tersimpan');

-- ---------------------------------------------------------------------------------------------
-- Klien: hanya membaca miliknya sendiri
-- ---------------------------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000006b1');
select results_eq('select version from public.consents', $$values ('persetujuan-v2-2027-01'::text)$$,
  'orang tua membaca versi persetujuannya sendiri');
select throws_ok($$insert into public.consents (parent_id, type, granted, version) values ('00000000-0000-0000-0000-0000000006b1', 'riset', true, 'persetujuan-v1-2026-10')$$, '42501', null,
  'NEGATIF: orang tua tidak bisa mencatat persetujuan langsung dari klien');
select throws_ok($$update public.consents set version = 'versi-palsu'$$, '42501', null,
  'NEGATIF: orang tua tidak bisa mengganti versi persetujuan');
select throws_ok($$update public.consents set granted = true$$, '42501', null,
  'NEGATIF: orang tua tidak bisa membalik keputusan langsung dari klien');
reset role;

select pg_temp.login_as('00000000-0000-0000-0000-0000000006b2');
select is_empty('select 1 from public.consents', 'NEGATIF: orang tua 2 tidak membaca persetujuan orang tua 1');
reset role;

-- ---------------------------------------------------------------------------------------------
-- record_consent: consents + audit_log dalam satu transaksi, hanya untuk service_role
-- ---------------------------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's1@test.id',
        '{"role":"student"}', '{}', now(), now());

select ok(
  not has_function_privilege('authenticated', 'public.record_consent(uuid, text, boolean, text, uuid, text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.record_consent(uuid, text, boolean, text, uuid, text)', 'EXECUTE'),
  'NEGATIF: anon dan authenticated tidak bisa memanggil record_consent'
);

select pg_temp.login_as('00000000-0000-0000-0000-0000000006b2');
select throws_ok($$select public.record_consent('00000000-0000-0000-0000-0000000006b2', 'data_anak', true, 'v1', null, 'klien')$$, '42501', null,
  'NEGATIF: orang tua tidak bisa memanggil record_consent dari klien');
reset role;

set local role service_role;
select lives_ok($$select public.record_consent('00000000-0000-0000-0000-0000000006b2', 'data_anak', true, 'persetujuan-v1-2026-10', '00000000-0000-0000-0000-0000000006b2', 'daftar')$$,
  'service_role mencatat persetujuan lewat record_consent');
select throws_ok($$select public.record_consent('00000000-0000-0000-0000-0000000006c1', 'data_anak', true, 'persetujuan-v1-2026-10', null, 'token')$$, '22023', null,
  'NEGATIF: persetujuan tidak bisa dicatat untuk akun siswa');
select throws_ok($$select public.record_consent('00000000-0000-0000-0000-0000000006b2', 'data_anak', true, '', null, 'token')$$, '23514', null,
  'NEGATIF: record_consent menolak versi kosong');
reset role;

select is((select version || ':' || granted from public.consents where parent_id = '00000000-0000-0000-0000-0000000006b2' and type = 'data_anak'),
  'persetujuan-v1-2026-10:true', 'record_consent menyimpan keputusan dan versinya');
select results_eq(
  $$select action, details ->> 'version', details ->> 'source' from public.audit_log
    where target = 'consents:00000000-0000-0000-0000-0000000006b2:data_anak'$$,
  $$values ('consent.granted'::text, 'persetujuan-v1-2026-10'::text, 'daftar'::text)$$,
  'setiap persetujuan tercatat di audit_log beserta versi dan sumbernya; percobaan yang gagal tidak meninggalkan jejak'
);
select is((select count(*)::int from public.consents where parent_id = '00000000-0000-0000-0000-0000000006c1'), 0,
  'NEGATIF: tidak ada baris persetujuan untuk akun siswa');

select * from finish();
rollback;
