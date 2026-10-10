-- Migrasi 0004: langganan, layanan, dan audit (Fase 33).
-- Tabel: plans, subscriptions, invoices, payment_events, conversations, messages, crm_events,
-- notifications, ai_decisions, audit_log. Semua tabel memakai RLS. Migrasi lama tidak diubah.
--
-- Prinsip akses (melanjutkan 0001-0003):
--   * plans dibaca siapa saja (halaman /harga publik). Harga dan harga coret disimpan di sini,
--     bukan di kode; mengubah harga cukup mengubah baris tabel.
--   * Klien hanya MEMBACA. Semua penulisan lewat server/worker dengan service_role:
--       - subscriptions, invoices, payment_events -> checkout, webhook, dan pekerjaan penagihan
--         (Fase 54-57); uang tidak pernah berpindah karena permintaan langsung dari klien.
--       - conversations, messages                -> /api/support/chat (Fase 58-60).
--       - crm_events, notifications              -> worker crm.scan dan pekerjaan lain (Fase 61).
--       - ai_decisions                           -> packages/ai (aturan 3).
--       - audit_log                              -> setiap tindakan admin dan server yang penting.
--   * Satu-satunya tulis dari klien: penerima menandai notifikasinya sudah dibaca (kolom read_at).
--   * payment_events tidak bisa diakses klien sama sekali, termasuk admin (isi webhook mentah).
--   * audit_log hanya bisa DITAMBAH. Mengubah, menghapus, atau mengosongkannya ditolak trigger
--     untuk semua peran, termasuk service_role.

-- ---------------------------------------------------------------------------------------------
-- Langganan dan pembayaran
-- ---------------------------------------------------------------------------------------------
create table public.plans (
  id text primary key check (id in ('monthly', 'semester', 'annual')),
  name text not null check (btrim(name) <> ''),
  -- Rupiah utuh.
  price integer not null check (price > 0),
  strike_price integer check (strike_price is null or strike_price > price),
  months smallint not null check (months between 1 and 24),
  sort_order smallint not null default 0
);

create table public.subscriptions (
  id uuid primary key default public.uuid_generate_v7(),
  -- Data keuangan tidak ikut terhapus diam-diam saat akun dihapus; Fase 65 menanganinya eksplisit.
  parent_id uuid not null references public.profiles (id) on delete restrict,
  plan_id text not null references public.plans (id) on delete restrict,
  status text not null
    check (status in ('trialing', 'active', 'paused', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz not null,
  renewal_method text not null default 'invoice' check (renewal_method in ('auto', 'invoice')),
  paused_until timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Sasaran kunci asing komposit dari invoices.
  unique (id, parent_id),
  -- Langganan yang dijeda selalu punya tanggal lanjut; yang tidak dijeda tidak.
  check ((status = 'paused') = (paused_until is not null))
);
-- Paling banyak satu langganan hidup per orang tua: checkout ganda tidak membuat dua tagihan.
create unique index subscriptions_one_live_per_parent on public.subscriptions (parent_id)
  where status in ('trialing', 'active', 'paused', 'past_due');
create index subscriptions_plan_id_idx on public.subscriptions (plan_id);

create table public.invoices (
  id uuid primary key default public.uuid_generate_v7(),
  subscription_id uuid not null,
  parent_id uuid not null,
  -- Nomor faktur yang dilihat orang tua, misalnya "INV-2026-000123".
  number text not null unique check (btrim(number) <> ''),
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  -- Id tagihan di penyedia pembayaran (Order Hero, Midtrans, atau mock).
  provider_id text unique,
  paid_at timestamptz,
  refunded_at timestamptz,
  -- Nama objek di bucket "invoices": {subscription_id}/{invoice_id}.pdf (bucket dibuat di Fase 56).
  pdf_path text,
  created_at timestamptz not null default now(),
  foreign key (subscription_id, parent_id)
    references public.subscriptions (id, parent_id) on delete restrict,
  check ((status in ('paid', 'refunded')) = (paid_at is not null)),
  check ((status = 'refunded') = (refunded_at is not null)),
  check (pdf_path is null or pdf_path = subscription_id::text || '/' || id::text || '.pdf')
);
create index invoices_subscription_id_idx on public.invoices (subscription_id);
create index invoices_parent_id_idx on public.invoices (parent_id);

create table public.payment_events (
  id uuid primary key default public.uuid_generate_v7(),
  provider text not null check (provider in ('mock', 'orderhero', 'midtrans')),
  provider_event_id text not null check (btrim(provider_event_id) <> ''),
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  -- Webhook yang sama dikirim dua kali tetap satu baris, sehingga diproses sekali (Fase 54).
  unique (provider, provider_event_id)
);
create index payment_events_unprocessed_idx on public.payment_events (received_at)
  where processed_at is null;

-- ---------------------------------------------------------------------------------------------
-- Layanan pelanggan, CRM, notifikasi
-- ---------------------------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default public.uuid_generate_v7(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  audience text not null check (audience in ('student', 'parent')),
  level smallint not null default 1 check (level in (1, 2)),
  label text,
  status text not null default 'open' check (status in ('open', 'escalated', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Sasaran kunci asing komposit dari messages.
  unique (id, owner_id)
);
create index conversations_owner_id_idx on public.conversations (owner_id);

create table public.messages (
  id uuid primary key default public.uuid_generate_v7(),
  conversation_id uuid not null,
  owner_id uuid not null,
  sender text not null check (sender in ('user', 'agent_l1', 'agent_l2')),
  body text not null check (btrim(body) <> ''),
  -- Jejak pemanggilan alat AI (data akun, keputusan pengembalian dana). Tidak dibuka ke klien.
  tool_calls jsonb not null default '[]' check (jsonb_typeof(tool_calls) = 'array'),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, owner_id)
    references public.conversations (id, owner_id) on delete cascade
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

create table public.crm_events (
  id uuid primary key default public.uuid_generate_v7(),
  subject_id uuid not null references public.profiles (id) on delete cascade,
  signal text not null check (btrim(signal) <> ''),
  action text not null check (btrim(action) <> ''),
  fired_at timestamptz not null default now(),
  outcome text
);
create index crm_events_subject_fired_idx on public.crm_events (subject_id, fired_at);

create table public.notifications (
  id uuid primary key default public.uuid_generate_v7(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (btrim(kind) <> ''),
  title text not null check (btrim(title) <> ''),
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_unread_idx on public.notifications (recipient_id, created_at)
  where read_at is null;

-- ---------------------------------------------------------------------------------------------
-- Catatan keputusan AI dan audit
-- ---------------------------------------------------------------------------------------------
create table public.ai_decisions (
  id uuid primary key default public.uuid_generate_v7(),
  component text not null check (btrim(component) <> ''),
  -- Profil yang menjadi subjek keputusan. Ikut terhapus bersama akunnya (data anak).
  subject_id uuid references public.profiles (id) on delete cascade,
  input_ref text,
  rule_or_signal text,
  -- Null bila keputusan diambil aturan tanpa AI (fallback, aturan 3).
  model text,
  prompt_version text,
  output jsonb not null default '{}',
  tokens_in integer not null default 0 check (tokens_in >= 0),
  tokens_out integer not null default 0 check (tokens_out >= 0),
  -- Biaya dalam rupiah (pecahan diperbolehkan), untuk pagar biaya per siswa.
  cost numeric(12, 4) not null default 0 check (cost >= 0),
  latency_ms integer check (latency_ms >= 0),
  created_at timestamptz not null default now(),
  check (model is null or btrim(coalesce(prompt_version, '')) <> '')
);
create index ai_decisions_subject_created_idx on public.ai_decisions (subject_id, created_at);
create index ai_decisions_created_idx on public.ai_decisions (created_at);

-- Kunci asing yang ditunda di 0003: setiap petunjuk AI menunjuk catatan keputusannya.
-- DEFERRABLE INITIALLY DEFERRED: diperiksa saat COMMIT. Menghapus akun siswa menghapus
-- keputusan AI (lewat profiles) dan petunjuknya (lewat students → assignments → attempts) dalam
-- cascade yang berbeda; pemeriksaan langsung akan menolak penghapusan itu di tengah jalan.
-- Keputusan yang masih dirujuk petunjuk tetap tidak bisa dihapus sendirian (ditolak saat COMMIT).
alter table public.hints_shown
  add constraint hints_shown_ai_decision_id_fkey
  foreign key (ai_decision_id) references public.ai_decisions (id)
  deferrable initially deferred;
create index hints_shown_ai_decision_id_idx on public.hints_shown (ai_decision_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  -- Sengaja tanpa kunci asing: catatan audit tetap ada setelah akun pelakunya dihapus, dan
  -- kunci asing ON DELETE SET NULL akan membutuhkan UPDATE yang dilarang di tabel ini.
  actor_id uuid,
  action text not null check (btrim(action) <> ''),
  target text not null check (btrim(target) <> ''),
  details jsonb not null default '{}',
  at timestamptz not null default now()
);
create index audit_log_at_idx on public.audit_log (at);
create index audit_log_actor_at_idx on public.audit_log (actor_id, at);

-- ---------------------------------------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------------------------------------
-- audit_log hanya bisa ditambah. Waktu dicatat server, tidak bisa dimundurkan pengirim.
create or replace function public.audit_log_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.at := now();
  return new;
end;
$$;

create or replace function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log hanya bisa ditambah; % ditolak', tg_op
    using errcode = '42501';
end;
$$;

create trigger audit_log_stamp
  before insert on public.audit_log
  for each row execute function public.audit_log_stamp();

create trigger audit_log_no_update_delete
  before update or delete on public.audit_log
  for each row execute function public.audit_log_append_only();

create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function public.audit_log_append_only();

-- Waktu baca notifikasi dicatat server saat pertama kali ditandai, tidak bisa diisi bebas.
create or replace function public.notifications_stamp_read()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.read_at is not null and old.read_at is null then
    new.read_at := now();
  elsif new.read_at is not null then
    new.read_at := old.read_at;
  end if;
  return new;
end;
$$;

create trigger notifications_stamp_read
  before update of read_at on public.notifications
  for each row execute function public.notifications_stamp_read();

revoke all on function public.audit_log_stamp() from public, anon, authenticated;
revoke all on function public.audit_log_append_only() from public, anon, authenticated;
revoke all on function public.notifications_stamp_read() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Data paket (harga di tabel, bukan di kode). Harga semester dan tahunan masih sementara
-- (lihat TIP 9a Fase 6); ubah barisnya, bukan migrasi ini.
-- ---------------------------------------------------------------------------------------------
insert into public.plans (id, name, price, strike_price, months, sort_order) values
  ('monthly', 'Bulanan', 29900, null, 1, 1),
  ('semester', 'Semester', 149000, 179400, 6, 2),
  ('annual', 'Tahunan', 249000, 358800, 12, 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------------------------
-- RLS dan hak akses
-- ---------------------------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_events enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.crm_events enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_decisions enable row level security;
alter table public.audit_log enable row level security;

-- Mulai dari nol untuk klien.
revoke all on
  public.plans, public.subscriptions, public.invoices, public.payment_events,
  public.conversations, public.messages, public.crm_events, public.notifications,
  public.ai_decisions, public.audit_log
  from anon, authenticated;

-- audit_log: bahkan server hanya boleh menambah dan membaca.
revoke update, delete, truncate on public.audit_log from service_role;

grant select on public.plans to anon, authenticated;
grant select on
  public.subscriptions, public.invoices, public.conversations, public.crm_events,
  public.notifications, public.ai_decisions, public.audit_log
  to authenticated;
-- messages: semua kolom kecuali tool_calls.
grant select (id, conversation_id, owner_id, sender, body, created_at) on public.messages
  to authenticated;
-- Satu-satunya penulisan klien: menandai notifikasi sudah dibaca.
grant update (read_at) on public.notifications to authenticated;
-- payment_events: tanpa hak apa pun untuk anon dan authenticated.

-- plans ------------------------------------------------------------------------------------------
create policy plans_select_public on public.plans
  for select to anon, authenticated using (true);

-- subscriptions dan invoices: orang tua pemilik dan admin -----------------------------------------
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (parent_id = auth.uid() or public.auth_role() = 'admin');

create policy invoices_select on public.invoices
  for select to authenticated
  using (parent_id = auth.uid() or public.auth_role() = 'admin');

-- conversations dan messages: pemilik percakapan dan admin ----------------------------------------
create policy conversations_select on public.conversations
  for select to authenticated
  using (owner_id = auth.uid() or public.auth_role() = 'admin');

create policy messages_select on public.messages
  for select to authenticated
  using (owner_id = auth.uid() or public.auth_role() = 'admin');

-- notifications: hanya penerima -------------------------------------------------------------------
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid());

create policy notifications_mark_read_own on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Data internal: hanya admin yang membaca lewat klien ----------------------------------------------
create policy crm_events_select_admin on public.crm_events
  for select to authenticated
  using (public.auth_role() = 'admin');

create policy ai_decisions_select_admin on public.ai_decisions
  for select to authenticated
  using (public.auth_role() = 'admin');

create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using (public.auth_role() = 'admin');

-- payment_events: RLS aktif tanpa kebijakan dan tanpa hak tabel. Hanya service_role.
