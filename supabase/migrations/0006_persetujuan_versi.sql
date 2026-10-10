-- Migrasi 0006: versi teks persetujuan dan penulisan persetujuan hanya lewat server (Fase 35).
-- Migrasi lama tidak diubah (aturan 5); berkas ini mengubah consents dari 0001.
--
-- 1. consents.version: versi teks persetujuan yang disetujui atau ditolak orang tua. Wajib diisi,
--    agar setiap baris bisa dicocokkan dengan teks yang benar-benar dibaca orang tua.
-- 2. Klien tidak lagi menulis consents langsung. Persetujuan dicatat oleh POST /api/consent dengan
--    service_role: versi diambil dari server (bukan dari isian klien) dan setiap perubahan
--    dicatat di audit_log beserta versinya. consents hanya menyimpan keputusan terakhir per jenis;
--    riwayatnya ada di audit_log. Klien tetap boleh MEMBACA persetujuannya (kebijakan 0001).

-- Baris lama (hanya ada di basis data lokal) diberi penanda bahwa versinya tidak tercatat.
alter table public.consents add column version text;
update public.consents set version = 'tidak-tercatat' where version is null;
alter table public.consents
  alter column version set not null,
  add constraint consents_version_not_blank check (btrim(version) <> '');

-- Mencabut hak tabel juga mencabut hak per kolom (insert (parent_id, type, granted) dan
-- update (granted)) yang diberikan di 0001.
revoke insert, update on public.consents from authenticated;
drop policy consents_insert_own on public.consents;
drop policy consents_update_own on public.consents;

-- ---------------------------------------------------------------------------------------------
-- Satu-satunya jalur penulisan persetujuan. Baris consents dan catatan audit_log ditulis dalam
-- satu transaksi, jadi tidak ada persetujuan tanpa jejak audit (atau sebaliknya). Hanya
-- service_role yang boleh memanggilnya (POST /api/consent dan pendaftaran di server).
-- ---------------------------------------------------------------------------------------------
create or replace function public.record_consent(
  target_parent uuid,
  consent_type text,
  is_granted boolean,
  text_version text,
  actor uuid,
  source text
)
returns public.consents
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved public.consents;
begin
  if not exists (select 1 from public.profiles where id = target_parent and role = 'parent') then
    raise exception 'persetujuan hanya bisa dicatat untuk akun orang tua' using errcode = '22023';
  end if;

  insert into public.consents (parent_id, type, granted, version)
  values (target_parent, consent_type, is_granted, text_version)
  on conflict (parent_id, type)
    do update set granted = excluded.granted, version = excluded.version
  returning * into saved;

  insert into public.audit_log (actor_id, action, target, details)
  values (
    actor,
    case when is_granted then 'consent.granted' else 'consent.declined' end,
    'consents:' || target_parent || ':' || consent_type,
    jsonb_build_object('version', text_version, 'source', source)
  );

  return saved;
end;
$$;

revoke all on function public.record_consent(uuid, text, boolean, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_consent(uuid, text, boolean, text, uuid, text)
  to service_role;
