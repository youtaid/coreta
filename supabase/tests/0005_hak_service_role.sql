-- Tes pgTAP untuk migrasi 0005: server dan worker (service_role) punya hak tabel yang dibutuhkan
-- di SEMUA tabel public, kecuali audit_log yang hanya bisa ditambah. Tes ini membaca katalog,
-- sehingga tabel baru yang lupa diberi hak service_role membuat tes gagal.
-- Jalankan dengan: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select is_empty($$
  select c.relname, p.privilege
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p(privilege)
  where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname <> 'audit_log'
    and not has_table_privilege('service_role', c.oid, p.privilege)
$$, 'service_role punya SELECT/INSERT/UPDATE/DELETE di setiap tabel public (kecuali audit_log)');

select is_empty($$
  select c.relname
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v'
    and not has_table_privilege('service_role', c.oid, 'SELECT')
$$, 'service_role bisa membaca setiap view public');

select ok(
  has_table_privilege('service_role', 'public.audit_log', 'SELECT')
  and has_table_privilege('service_role', 'public.audit_log', 'INSERT'),
  'service_role bisa membaca dan menambah audit_log'
);
select ok(
  not has_table_privilege('service_role', 'public.audit_log', 'UPDATE')
  and not has_table_privilege('service_role', 'public.audit_log', 'DELETE')
  and not has_table_privilege('service_role', 'public.audit_log', 'TRUNCATE'),
  'NEGATIF: service_role tidak bisa mengubah, menghapus, atau mengosongkan audit_log'
);

-- Jalur nyata server: membaca kunci jawaban dan menulis audit sebagai service_role.
set local role service_role;
select lives_ok('select answer_key, distractor_hints, explanation from public.items limit 1',
  'service_role (server penilai) membaca kunci jawaban dari items');
select lives_ok($$insert into public.audit_log (action, target) values ('uji.hak', 'service_role')$$,
  'service_role menambah audit_log');
reset role;

select * from finish();
rollback;
