-- Migrasi 0005: hak tabel untuk service_role (perbaikan atas 0001-0004, ditemukan di Fase 34).
--
-- Supabase tidak lagi memberi hak bawaan pada tabel baru di skema public (config.toml:
-- auto_expose_new_tables tidak diaktifkan, sama dengan bawaan cloud). service_role melewati RLS,
-- tetapi tetap membutuhkan GRANT biasa. Migrasi 0001-0004 hanya memberi hak baca untuk
-- authenticated, sehingga server dan worker (yang memakai service_role) belum bisa membaca kunci
-- jawaban, menyimpan percobaan, memproses webhook, atau menulis audit.
--
-- Aturan untuk migrasi berikutnya: setiap tabel baru di public memberi service_role haknya secara
-- eksplisit. Tes supabase/tests/0005_hak_service_role.sql memeriksa semua tabel public secara
-- otomatis, jadi tabel yang terlupa membuat tes gagal.

-- Akun dan keluarga (0001).
grant select, insert, update, delete on
  public.profiles, public.students, public.guardianships, public.consents
  to service_role;

-- Kurikulum dan konten (0002). Server membaca kunci jawaban di sini untuk menilai.
grant select, insert, update, delete on
  public.stages, public.competencies, public.competency_prereqs,
  public.items, public.stimuli, public.media_assets,
  public.worksheets, public.worksheet_items
  to service_role;
grant select on public.items_public, public.stimuli_public, public.media_assets_public
  to service_role;

-- Data belajar (0003).
grant select, insert, update, delete on
  public.assignments, public.attempts, public.ink_sessions, public.hints_shown,
  public.hint_reports, public.mastery, public.daily_activity, public.weekly_reports
  to service_role;

-- Langganan dan layanan (0004).
grant select, insert, update, delete on
  public.plans, public.subscriptions, public.invoices, public.payment_events,
  public.conversations, public.messages, public.crm_events, public.notifications,
  public.ai_decisions
  to service_role;

-- audit_log hanya bisa ditambah dan dibaca, juga oleh server (lihat 0004).
grant select, insert on public.audit_log to service_role;
