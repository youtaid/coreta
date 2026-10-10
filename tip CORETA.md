# TIP — Technical Implementation Plan: Coreta (Web)

> Dokumen ini adalah rencana kerja teknis untuk membangun **Coreta** sebagai aplikasi web (PWA). Disusun dari PRD Coreta (tab PRD dan tab Spesifikasi teknis) mengikuti template TIP. Bagian mobile/Expo pada template diabaikan karena kita mulai dari web.
>
> Versi pustaka dicek di npm pada 5 Okt 2026. Kunci versi di `package.json` saat Fase 0 dan catat penyimpangan di bagian 9a.

---

## 0. Starter Template (Fase Awal)

Tidak ada repo starter yang perlu di-clone. Kita membuat proyek baru dengan `create-next-app` di Fase 0, lalu menyusunnya menjadi monorepo di Fase 1.

### Fase 0 — Buat Proyek Next.js & Verifikasi

- **Scope**: buat folder proyek, scaffold Next.js, jalankan di browser
- **Langkah**:
  1. Pastikan Node.js 22 LTS atau lebih baru dan pnpm sudah terpasang (`node -v`, `pnpm -v`)
  2. `mkdir coreta && cd coreta && git init`
  3. `pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --no-src-dir --use-pnpm --import-alias "@/*"`
  4. `pnpm --filter web dev` (atau `cd apps/web && pnpm dev`)
- **Definition of Done**: `http://localhost:3000` menampilkan halaman bawaan Next.js tanpa galat di terminal maupun konsol browser
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

(Fase 0 diulang di bagian 6 bersama fase-fase lainnya.)

---

## 1. Project Overview

**Nama app**: Coreta

**Platform**: web responsif yang diutamakan untuk tablet (iPad + Apple Pencil di Safari, Samsung Galaxy Tab + S Pen di Chrome), dipasang sebagai PWA. Ponsel hanya untuk laporan, langganan, dan bantuan.

**Apa itu Coreta**: tempat siswa SMA di Jakarta mengerjakan worksheet matematika TKA/UTBK dengan mencoret langsung di layar. Jawaban dikoreksi otomatis oleh sistem; AI hanya membaca coretan untuk memberi petunjuk, tidak pernah menentukan nilai. Orang tua (pembeli) menerima laporan mingguan dan mengelola langganan di dalam aplikasi.

**Tiga peran pengguna**
- **Siswa**: mengerjakan worksheet, melihat jalur belajar, hasil, dan progres
- **Orang tua**: membeli langganan, membaca laporan mingguan, mengelola akun anak, bertanya ke asisten layanan
- **Admin**: mengelola antrean tinjauan petunjuk (maks 1×24 jam), konten, rilis worksheet, dan memantau agen AI

**Tujuan MVP (pilot)**
1. Siswa membuka worksheet, mengerjakan 8 soal dengan ruang coret, dalam satu layar tanpa scroll halaman
2. Jawaban dinilai server saat itu juga; petunjuk pengecoh langsung tampil; petunjuk dari coretan menyusul
3. Jalur belajar Matematika (Tahap 0–8) dengan model penguasaan berbasis aturan
4. Laporan mingguan untuk orang tua, di dalam aplikasi
5. Langganan: uji coba gratis 7 hari, lalu Rp29.900 per bulan (paket semester dan tahunan dengan harga coret)
6. Admin: antrean tinjauan, editor butir soal, rilis worksheet

**Di luar MVP**: aplikasi mobile native, guru/tutor sebagai pengguna, kalibrasi IRT (menunggu 300 percobaan per butir), video produksi (MP4 720p cukup dulu).

**Tech stack ringkas**: Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, Supabase (Postgres, Auth, Storage, Realtime, pgmq, pg_cron), worker Node terpisah untuk pekerjaan AI, dijalankan di VPS dengan Docker.

**AI untuk development**: Claude (mis. Claude Code) sebagai agent utama. Template prompt di bagian 8 berlaku juga untuk ChatGPT, Gemini, atau Copilot.

### Aturan yang tidak boleh dilanggar (tempel ke setiap prompt jika relevan)

1. Kunci jawaban dan petunjuk **tidak pernah dikirim ke browser** sebelum jawaban dikumpulkan; siswa membaca butir lewat view `items_public`.
2. Penilaian hanya di `packages/scoring` (fungsi murni). Tidak boleh diduplikasi di komponen.
3. **AI tidak pernah menentukan nilai.** Setiap panggilan AI lewat `packages/ai`, keluaran JSON divalidasi Zod, dicatat di `ai_decisions`, dan punya cadangan tanpa AI.
4. Setiap tabel wajib RLS aktif dan punya tes RLS positif dan negatif.
5. Migrasi lama tidak pernah diubah; perubahan skema = berkas migrasi baru.
6. `attempt_id` dibuat di klien (UUID v7); pengiriman ulang tidak boleh menggandakan data.
7. Kunci `service_role` hanya di server dan worker, tidak pernah di variabel `NEXT_PUBLIC_*`.
8. PG kompleks: skor = pilihan benar yang dicentang ÷ jumlah kunci; pilihan salah tidak mengurangi; **mencentang semua pilihan = skor 0**.
9. Halaman ruang kerja tidak boleh scroll; hanya panel bacaan yang boleh scroll di dalam dirinya.
10. Teks antarmuka berbahasa Indonesia; nama kode, tabel, kolom berbahasa Inggris.

---

## 2. Tech Stack & Dependencies

Versi di bawah adalah versi stabil terbaru pada 5 Okt 2026 (dicek lewat `npm view <paket> version`). Pasang dengan `pnpm add <paket>` lalu biarkan lockfile mengunci versinya.

### Inti
- **Node.js 22 LTS** — runtime Next.js, worker, dan alat build
- **pnpm** (12.x) + **Turborepo** (2.11) — monorepo, cache build, tugas paralel
- **Next.js 16.3** (App Router) dan **React 19.3** — satu proyek untuk siswa, orang tua, admin, dan API
- **TypeScript** strict — satu bahasa dari tablet sampai worker. Catatan: TypeScript 7.x masih baru; jika ada plugin yang belum cocok, pakai seri 5 dan catat di 9a.
- **Zod 4.6** — validasi di setiap batas API dan keluaran AI

### Tampilan
- **Tailwind CSS 4.3** — token desain lewat `@theme` di CSS
- **shadcn/ui** (CLI `shadcn` 4.x) + **lucide-react** — komponen yang kodenya dimiliki sendiri, mudah diubah agent
- **KaTeX 0.19** — render rumus tanpa gambar

### Tinta dan offline
- **perfect-freehand 1.2** — garis pena halus dengan tekanan; digambar di **Canvas 2D** dengan **Pointer Events**
- **fflate 0.8** — kompresi gzip berkas coretan di browser dan server
- **Dexie 4.4** — IndexedDB untuk antrean offline dan cache soal
- **Serwist** (`@serwist/next` 9.5) — service worker/PWA
- **Zustand 5** — state ruang kerja (soal aktif, jawaban, status kirim) yang ringan

### Data dan backend
- **Supabase** (cloud, region Singapura) — Postgres, Auth, Storage, Realtime
- **@supabase/supabase-js 2.117** dan **@supabase/ssr 0.12** — klien browser dan server
- **Supabase CLI** — database lokal (Docker), migrasi, tes pgTAP
- **pgmq** dan **pg_cron** — antrean dan jadwal di dalam Postgres
- **uuid 14** — UUID v7 (urut waktu) untuk ID buatan klien
- **tsx 4** dan **pino 10** — menjalankan dan mencatat log worker

### AI
- **AI SDK** (`ai` 7.x) dengan penyedia `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic` — satu antarmuka untuk beberapa model, dibungkus `packages/ai` agar penyedia mudah diganti. Model awal diputuskan lewat set evaluasi (kandidat: Gemini 3.5 Flash-Lite, GPT-5.6 Luna, Claude Haiku 4.5).

### Pembayaran, notifikasi, pemantauan
- **Penyedia pembayaran**: Order Hero atau Midtrans (keputusan terbuka). Semua akses dibungkus antarmuka `PaymentProvider`.
- **@react-pdf/renderer 4.9** — faktur PDF (dibuat worker)
- **web-push 3.6** — Web Push; **Resend 6** — email transaksional
- **@sentry/nextjs 11** — galat web dan worker; **posthog-js 1.4xx** — analitik dan feature flag

### Pengujian dan kualitas
- **Vitest 5** + **@testing-library/react 16** — tes unit dan komponen
- **Playwright 1.63** — tes end-to-end (Chromium dan WebKit)
- **pgTAP** (lewat Supabase CLI) — tes RLS
- **ESLint 10** dan **Prettier 3.9** — lint dan format

### Hosting
- **VPS milik sendiri** — Docker Compose menjalankan `web` (Next.js) dan `worker`, **Caddy** sebagai reverse proxy + HTTPS otomatis
- **Supabase cloud** untuk database produksi (v1)
- Spesifikasi VPS belum diketahui; tentukan di Fase 45

---

## 3. Struktur Folder Project

```
coreta/
├─ apps/
│  ├─ web/                          # Next.js: semua halaman + API
│  │  ├─ app/
│  │  │  ├─ (publik)/               # /, /harga, /masuk, /daftar, /persetujuan/[token]
│  │  │  ├─ (siswa)/belajar/        # jalur, worksheet, kerjakan, hasil, progres, bantuan
│  │  │  ├─ (ortu)/ortu/            # laporan, langganan, faktur, anak, bantuan
│  │  │  ├─ (admin)/admin/          # antrean, agen, konten, rilis, pengguna, pekerjaan-gagal
│  │  │  ├─ api/                    # attempts, ink, handwriting, hint-reports, support, billing, webhooks, consent
│  │  │  ├─ layout.tsx, globals.css, manifest.ts
│  │  ├─ components/
│  │  │  ├─ ui/                     # komponen dasar (shadcn): Button, Card, Dialog, ...
│  │  │  ├─ domain/                 # komponen Coreta: PathNode, WorksheetCard, StatCard, ...
│  │  │  └─ workspace/              # ruang kerja: QuestionPanel, InkCanvas, AnswerPanel, MediaPanel, ...
│  │  ├─ lib/
│  │  │  ├─ supabase/               # client.ts (browser), server.ts, admin.ts (service role, server saja)
│  │  │  ├─ offline/                # dexie db, antrean keluar, sinkronisasi
│  │  │  ├─ billing/                # PaymentProvider + adapter
│  │  │  ├─ mock/                   # data tiruan untuk fase UI-only (dihapus setelah terhubung)
│  │  │  └─ env.ts                  # validasi variabel lingkungan dengan Zod
│  │  ├─ proxy.ts                   # sesi + penjaga peran (Next.js 16: pengganti middleware.ts)
│  │  ├─ sw.ts                      # service worker (Serwist)
│  │  └─ public/                    # ikon PWA, font, gambar statis
│  └─ worker/                       # proses Node terpisah untuk pekerjaan latar belakang
│     └─ src/
│        ├─ index.ts                # pengambil pesan pgmq + penjadwal
│        └─ jobs/                   # mastery.update, ink.analyze, report.generate, ...
├─ packages/
│  ├─ scoring/                      # fungsi murni: skor tiap tipe soal, penguasaan, komposisi worksheet
│  ├─ ink/                          # mesin tinta + format Coreta Ink v1 (tanpa React)
│  ├─ ai/                           # adapter model, skema Zod, prompts/ (berversi), evals/
│  ├─ db/                           # tipe hasil generate dari skema Supabase
│  └─ content/                      # validator butir soal + alat impor
├─ supabase/
│  ├─ migrations/                   # berkas SQL berurutan (tidak pernah diubah setelah dijalankan)
│  ├─ tests/                        # tes pgTAP (RLS)
│  ├─ seed.sql                      # 3 keluarga + 40 butir contoh
│  └─ config.toml
├─ e2e/                             # tes Playwright
├─ docs/
│  ├─ AGENTS.md                     # konvensi, perintah, larangan untuk agent
│  └─ adr/                          # catatan keputusan arsitektur (1 halaman tiap keputusan)
├─ deploy/                          # Dockerfile web & worker, docker-compose.yml, Caddyfile
├─ .github/workflows/ci.yml
├─ pnpm-workspace.yaml, turbo.json, package.json, tsconfig.base.json
└─ .env.example
```

**Catatan penyederhanaan**: spesifikasi menyebut `packages/ui`. Untuk MVP komponen UI cukup di `apps/web/components` agar lebih sederhana; pindahkan ke paket sendiri hanya jika ada aplikasi kedua yang memakainya (catat di 9a).

---

## 4. Data Model & Storage

### Keputusan storage

- **Supabase (Postgres)** adalah satu-satunya sumber kebenaran: butuh auth, relasi orang tua–anak, sinkron antar perangkat, dan Realtime untuk petunjuk.
- **IndexedDB (Dexie)** hanya untuk sementara di perangkat: draf goresan, antrean jawaban yang belum terkirim, dan cache 10 soal berikutnya. Bukan sumber kebenaran.
- **Supabase Storage** (bucket privat) untuk berkas coretan, PNG, dan media soal; diakses lewat URL bertanda tangan berumur pendek.
- AsyncStorage tidak dipakai (itu untuk aplikasi mobile).

### Cara data diakses

- Bacaan sederhana: browser memanggil Supabase langsung, dilindungi RLS.
- Apa pun yang menilai, memanggil AI, atau menyentuh uang: lewat route handler di server (`app/api/*`), memakai Zod.
- Tabel yang hanya boleh ditulis worker (mis. `mastery`, `daily_activity`): tidak ada kebijakan tulis untuk pengguna biasa.

### Model data (field kunci)

Setiap tabel wajib RLS. Tipe `uuid` memakai UUID v7.

**Akun dan keluarga**
```
profiles        id (= auth.users.id), role (parent|student|admin), full_name, created_at
students        id, profile_id, grade, goal (tka|utbk|both), daily_target, device_note
guardianships   parent_id, student_id, consent_at, consent_version
consents        parent_id, type (data_anak|riset), granted, granted_at
```

**Kurikulum dan konten**
```
stages              id, number (0-8), name, goal_scope (all|tka|utbk)
competencies        id, code, stage_id, domain, name, exam_tags
competency_prereqs  competency_id, prereq_id
items               id, code, competency_id, tier (dasar|mahir|ujian),
                    answer_type (pg|pgk|bs|isian), stem jsonb, options jsonb,
                    answer_key jsonb, equivalents, tolerance, distractor_hints jsonb,
                    explanation jsonb, layout_mode, stimulus_id, difficulty,
                    status (draft|review|published|retired), version
stimuli             id, kind (reading|table|media_set), body jsonb
media_assets        id, kind, storage_path, alt_text, caption_path, transcript,
                    pasteable, width, height, duration_s
worksheets          id, title, stage_id, release_at, status
worksheet_items     worksheet_id, item_id, position, slot (baru|adaptif|ulang)
view items_public   butir terbit TANPA answer_key, equivalents, tolerance, distractor_hints, explanation
```

**Belajar**
```
assignments     id, student_id, worksheet_id, assigned_at, completed_at
attempts        id (dari klien), student_id, item_id, assignment_id, try_no,
                answer jsonb, score (0-1), submitted_at, duration_ms
ink_sessions    id, attempt_id, student_id, item_id, storage_path, snapshot_path,
                stroke_count, duration_ms, format_version
hints_shown     attempt_id, source (distractor|ai_ink), text, ai_decision_id
hint_reports    id, attempt_id, reason, status (open|valid|revised|item_flagged),
                due_at (= dibuat + 24 jam), reviewed_by, resolution
mastery         student_id, competency_id, tier, score, n_attempts, mastered_at, next_review_at
daily_activity  student_id, date, items_done, minutes, target_met
weekly_reports  id, student_id, week_start, metrics jsonb, narrative, sample_ink_id,
                status (draft|published)
```

**Langganan**
```
plans           id (monthly|semester|annual), price, strike_price, months
subscriptions   id, parent_id, plan_id, status, current_period_end,
                renewal_method (auto|invoice), paused_until, cancel_at_period_end
invoices        id, subscription_id, amount, status, provider_id, paid_at, pdf_path
payment_events  provider_event_id (unik), payload, received_at, processed_at
```
Catatan: spesifikasi lama menulis `xendit_id`; kita memakai `provider_id` dan `provider_event_id` karena penyedia pembayaran belum final.

**Layanan dan AI**
```
conversations   id, owner_id, audience (student|parent), level (1|2), label, status
messages        conversation_id, sender (user|agent_l1|agent_l2), body, tool_calls jsonb
crm_events      id, subject_id, signal, action, fired_at, outcome
notifications   id, recipient_id, kind, title, body, read_at
ai_decisions    id, component, subject_id, input_ref, rule_or_signal, model, prompt_version,
                output jsonb, tokens_in, tokens_out, cost, latency_ms, created_at
audit_log       actor_id, action, target, at   (hanya tambah)
```

### Aturan akses (RLS) singkat
- Siswa: hanya data miliknya; tidak bisa membaca `answer_key`.
- Orang tua: hanya data anak yang terhubung lewat `guardianships`.
- Admin: baca/tulis sesuai tabel; semua tindakan dicatat di `audit_log`.
- `plans`: baca publik.

### Penyimpanan berkas (Storage)
- `ink/{student_id}/{attempt_id}.json.gz` — vektor coretan (format Coreta Ink v1)
- `ink/{student_id}/{attempt_id}.png` — gambar kecil, lebar maksimal 1024 px
- `media/{item_or_stimulus_id}/...` — gambar, audio, video soal
- `invoices/{subscription_id}/{invoice_id}.pdf` — faktur

### Penyimpanan di perangkat (Dexie)
- `outbox` — jawaban + berkas coretan yang menunggu dikirim (kunci: `attempt_id`)
- `inkDrafts` — goresan yang sedang dikerjakan
- `itemCache` dan `mediaCache` — soal dan media untuk 10 soal berikutnya

### Variabel lingkungan (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server dan worker saja
STUDENT_PIN_PEPPER=               # server saja, min 16 karakter; kata sandi siswa dari PIN (Fase 36)
AUTH_GOOGLE_ENABLED=false         # tampilkan tombol Google (Fase 35)
AI_PROVIDER=                      # google | openai | anthropic
AI_MODEL_HINT=
AI_MODEL_HANDWRITING=
AI_MODEL_REPORT=
AI_MODEL_SUPPORT=
AI_API_KEY_GOOGLE=
AI_API_KEY_OPENAI=
AI_API_KEY_ANTHROPIC=
AI_COST_CAP_PER_STUDENT_IDR=8000
PAYMENT_PROVIDER=                 # mock | orderhero | midtrans
PAYMENT_API_KEY=
PAYMENT_WEBHOOK_SECRET=
RESEND_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## 5. Screen & Navigasi Map

Navigasi dibagi per peran. Siswa dan orang tua masuk ke beranda masing-masing setelah login; admin ke `/admin/antrean`.

### Publik

**`/` — Halaman jual**
- Komponen: hero, 3 manfaat, cuplikan ruang coret, cara kerja, FAQ, CTA
- Dari: iklan, tautan langsung
- Ke: `/harga`, `/daftar`, `/masuk`

**`/harga` — Harga**
- Komponen: PriceCard ×3 (bulanan, semester, tahunan; harga coret), info uji coba 7 hari, ringkas kebijakan pengembalian dana
- Dari: `/`, `/ortu/langganan`
- Ke: `/daftar`, checkout penyedia pembayaran

**`/masuk` — Masuk**
- Komponen: form email + kata sandi, tombol Google (orang tua), masuk siswa (kode + PIN)
- Dari: semua halaman publik
- Ke: `/belajar` (siswa), `/ortu/laporan` (orang tua), `/admin/antrean` (admin)

**`/daftar` — Daftar orang tua**
- Komponen: form akun, pilih target siswa (TKA/UTBK), teks persetujuan data anak
- Dari: `/`, `/harga`
- Ke: `/ortu/anak` (buat akun siswa)

**`/persetujuan/[token]` — Persetujuan orang tua**
- Komponen: teks persetujuan berversi, tombol setuju/tolak
- Dari: tautan email/pesan
- Ke: `/ortu/anak`

### Siswa

**`/belajar` — Jalur belajar (beranda siswa)**
- Komponen: peta Tahap 0–8, PathNode (terkunci/aktif/tuntas), target harian, tombol "Lanjut belajar"
- Dari: login siswa, bottom nav
- Ke: `/belajar/worksheet`, `/belajar/progres`

**`/belajar/worksheet` — Daftar worksheet**
- Komponen: WorksheetCard (minggu ini, ulang berjarak, selesai), filter tahap
- Dari: `/belajar`
- Ke: `/belajar/kerjakan/[assignmentId]`, `/belajar/hasil/[assignmentId]`

**`/belajar/kerjakan/[assignmentId]` — Ruang kerja**
- Komponen: QuestionPanel (teks + rumus), MediaPanel (gambar/tabel/audio/video/bacaan, jendela melayang), InkCanvas, toolbar (pena, penghapus, undo, tempel), AnswerPanel (PG, PG kompleks, B/S, isian), bar status offline, tombol Kirim, tombol Laporkan petunjuk
- Dari: `/belajar/worksheet`, `/belajar` (lanjut)
- Ke: `/belajar/hasil/[assignmentId]` setelah soal terakhir; keluar kembali ke `/belajar/worksheet`

**`/belajar/hasil/[assignmentId]` — Hasil worksheet**
- Komponen: ringkasan skor, daftar soal (benar/sebagian/salah), pembahasan per soal, petunjuk yang diterima
- Dari: ruang kerja, `/belajar/worksheet`
- Ke: `/belajar/progres`, `/belajar`

**`/belajar/progres` — Progres**
- Komponen: bar kemajuan per kompetensi dengan garis ambang 80%, kalender aktivitas harian, status tuntas
- Dari: `/belajar`, hasil
- Ke: `/belajar/worksheet`

**`/bantuan` — Bantuan (siswa)**
- Komponen: ChatPanel asisten layanan, FAQ perangkat
- Dari: menu bawah
- Ke: kembali ke halaman sebelumnya

### Orang tua

**`/ortu/laporan` — Daftar laporan (beranda orang tua)**
- Komponen: kartu laporan terbaru, tren mingguan, status langganan ringkas
- Dari: login orang tua, nav
- Ke: `/ortu/laporan/[week]`, `/ortu/langganan`

**`/ortu/laporan/[week]` — Laporan mingguan**
- Komponen: StatCard (hari belajar, soal, waktu), kemajuan per kompetensi, "Yang perlu perhatian", contoh coretan anak, rencana 2 minggu
- Dari: `/ortu/laporan`, notifikasi
- Ke: `/ortu/bantuan` (tanya tentang laporan), `/ortu/langganan`

**`/ortu/langganan` — Langganan**
- Komponen: status (Uji coba/Aktif/Dijeda/Menunggak/Dibatalkan/Berakhir), paket dan harga coret, tombol ganti paket, jeda, batal, metode bayar
- Dari: `/ortu/laporan`, `/harga`
- Ke: checkout penyedia pembayaran, `/ortu/faktur`

**`/ortu/faktur` — Faktur**
- Komponen: daftar faktur, status bayar, unduh PDF
- Dari: `/ortu/langganan`
- Ke: `/ortu/langganan`

**`/ortu/anak` — Profil anak**
- Komponen: daftar anak, buat akun siswa (email atau kode masuk + PIN), target harian, unduh/hapus data
- Dari: `/daftar`, nav
- Ke: `/ortu/laporan`

**`/ortu/bantuan` — Bantuan (orang tua)**
- Komponen: ChatPanel (asisten tingkat 1, eskalasi ke tingkat 2), riwayat
- Dari: nav, laporan, langganan
- Ke: halaman asal

### Admin

**`/admin/antrean` — Antrean tinjauan (beranda admin)**
- Komponen: daftar laporan petunjuk dengan hitung mundur batas 24 jam, filter status, panel tinjau
- Dari: login admin
- Ke: `/admin/konten/butir/[id]`

**`/admin/agen` — Log agen AI**
- Komponen: daftar percakapan, label keluhan, panggilan alat, biaya AI harian
- Dari: nav admin
- Ke: detail percakapan

**`/admin/konten` — Daftar butir soal**
- Komponen: tabel butir (kode, kompetensi, tingkat, status), filter, tombol impor, kesehatan butir (terlalu mudah/sulit/sering dilaporkan)
- Dari: nav admin
- Ke: `/admin/konten/butir/[id]`

**`/admin/konten/butir/[id]` — Editor butir**
- Komponen: form butir, editor petunjuk per pengecoh, pratinjau 3 ukuran (tablet mendatar, tegak, ponsel), validator, tombol terbitkan
- Dari: `/admin/konten`, `/admin/antrean`
- Ke: `/admin/konten`

**`/admin/rilis` — Rilis worksheet**
- Komponen: daftar worksheet mingguan, status draf/terbit, tombol terbitkan
- Dari: nav admin
- Ke: —

**`/admin/pengguna` — Pengguna**
- Komponen: pencarian pengguna, status langganan, tindakan (perpanjang akses, nonaktifkan)
- Dari: nav admin
- Ke: —

**`/admin/pekerjaan-gagal` — Pekerjaan gagal**
- Komponen: daftar pekerjaan di antrean gagal, tombol coba ulang
- Dari: nav admin
- Ke: —

---

## 6. Implementation Phases

Total **71 fase** dalam 8 milestone. Setiap fase dirancang untuk **satu sesi prompting (~30 menit prompting + testing)**, hanya berisi **satu jenis pekerjaan** (setup, UI, logika, atau koneksi data) dan bisa diuji sendiri.

**Cara memakai:**
- Kerjakan berurutan dari Fase 0. Jangan loncat, karena fase berikutnya bergantung pada fase sebelumnya.
- Satu fase = satu sesi prompting = satu commit (atau satu PR kecil). Setelah Definition of Done terpenuhi, ubah status menjadi Selesai dan isi tracker di bagian 9c.
- Fase bertanda **Gerbang persetujuan** menyentuh uang, data anak, RLS, atau auth. Hasilnya harus dibaca dan disetujui Youta sebelum di-merge, walaupun semua tes hijau.
- Jika sebuah fase ternyata tidak muat dalam 30 menit, **pecah dua** (jangan dipaksakan) dan catat di bagian 9a.

**Peta milestone:**

- Milestone 1 — Fondasi proyek: Fase 0–4
- Milestone 2 — UI dengan data tiruan: Fase 5–19
- Milestone 3 — Logika inti (tanpa database): Fase 20–29
- Milestone 4 — Database & autentikasi: Fase 30–37
- Milestone 5 — Alur siswa end-to-end: Fase 38–45
- Milestone 6 — AI: Fase 46–52
- Milestone 7 — Langganan & layanan pelanggan: Fase 53–61
- Milestone 8 — Admin, keamanan, rilis & polish: Fase 62–70

---

### Milestone 1 — Fondasi proyek

_Hanya setup. Belum ada fitur. Tujuannya: repo rapi, bisa dijalankan, ada CI, dan Supabase lokal hidup._

#### Fase 0 — Buat Proyek Next.js & Verifikasi

- **Scope**:
  - Buat folder `coreta`, `git init`, dan scaffold Next.js di `apps/web` dengan `create-next-app`
  - Jalankan di browser dan pastikan build sukses
- **Estimasi waktu**: ~15 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/**` (hasil generator)
  - `.gitignore`
- **Definition of Done**:
  - `http://localhost:3000` menampilkan halaman bawaan Next.js
  - `pnpm --filter web build` sukses
  - Tidak ada galat di terminal maupun konsol browser
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 1 — Monorepo & Struktur Folder

- **Scope**:
  - Buat `pnpm-workspace.yaml`, `turbo.json`, `package.json` root (skrip: dev, build, lint, typecheck, test), `tsconfig.base.json`
  - Buat paket kosong `packages/scoring`, `ink`, `ai`, `db`, `content` (masing-masing `package.json` bernama `@coreta/<nama>`, `tsconfig.json`, `src/index.ts`)
  - Buat `apps/worker` berisi `src/index.ts` yang hanya mencetak log
  - Tulis `docs/AGENTS.md` (salin 'Aturan yang tidak boleh dilanggar' dari bagian 1) dan `docs/adr/ADR-001-monorepo.md`
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `package.json`
  - `tsconfig.base.json`
  - `packages/*/package.json`
  - `packages/*/src/index.ts`
  - `apps/worker/src/index.ts`
  - `docs/AGENTS.md`
  - `docs/adr/ADR-001-monorepo.md`
- **Definition of Done**:
  - `pnpm install` dan `pnpm turbo build` sukses
  - `apps/web` bisa `import` dari `@coreta/scoring` (fungsi placeholder)
  - `pnpm --filter worker dev` mencetak 'worker start'
  - TypeScript strict aktif di semua paket
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 2 — Lint, Format, Tes Dasar & CI

- **Scope**:
  - Pasang ESLint, Prettier, Vitest; atur konfigurasi bersama
  - Tulis satu tes pemanasan di `packages/scoring`
  - Buat GitHub Actions: install, lint, typecheck, test pada setiap PR
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `eslint.config.mjs`
  - `.prettierrc`
  - `vitest.workspace.ts`
  - `packages/scoring/src/smoke.test.ts`
  - `.github/workflows/ci.yml`
- **Definition of Done**:
  - `pnpm lint`, `pnpm typecheck`, `pnpm test` lulus di lokal
  - PR percobaan menampilkan CI hijau di GitHub
- **Status**: [ ] Belum | [x] Sedang | [ ] Selesai

#### Fase 3 — Supabase Lokal & Klien

- **Scope**:
  - `supabase init` dan `supabase start` (butuh Docker); catat URL dan kunci lokal
  - Buat `.env.example` dan `lib/env.ts` (validasi Zod untuk variabel lingkungan)
  - Buat tiga klien: browser (`client.ts`), server (`server.ts`, `@supabase/ssr`), admin/service role (`admin.ts`, hanya server)
  - Tambah endpoint `GET /api/health` yang mengecek koneksi Supabase
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/config.toml`
  - `.env.example`
  - `apps/web/lib/env.ts`
  - `apps/web/lib/supabase/client.ts`
  - `apps/web/lib/supabase/server.ts`
  - `apps/web/lib/supabase/admin.ts`
  - `apps/web/app/api/health/route.ts`
- **Definition of Done**:
  - `supabase status` menampilkan semua layanan berjalan
  - `GET /api/health` mengembalikan `{ ok: true, supabase: 'up' }`
  - `admin.ts` tidak pernah diimpor dari komponen klien (diperiksa dengan `import 'server-only'`)
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 4 — Tema & Token Desain

- **Scope**:
  - Definisikan token di `globals.css` memakai `@theme` Tailwind: primer `#2D55D8`, latar `#F3F5F9`, teks `#16213A`, border `#DCE2EB`, sukses `#17784C`, perhatian `#B4530F` (turunan dari mockup)
  - Pasang font Plus Jakarta Sans (UI) dan Kalam (tulisan tangan, untuk contoh coretan)
  - Siapkan mode terang dan gelap; jalankan `shadcn init`
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/globals.css`
  - `apps/web/app/layout.tsx`
  - `apps/web/components.json`
  - `apps/web/lib/utils.ts`
- **Definition of Done**:
  - Halaman contoh menampilkan palet, tipografi, dan tombol pengganti tema terang/gelap
  - Rasio kontras teks utama ≥ 4,5:1 di kedua tema
  - Ukuran target sentuh minimal 44 px tersedia sebagai token
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

> **Titik berhenti — Milestone 1**: repo berjalan, CI hijau, tema siap. Boleh lanjut ke UI.

---

### Milestone 2 — UI dengan data tiruan

_Semua layar dibangun lebih dulu dengan data tiruan di `lib/mock`. Belum ada Supabase, belum ada logika. Tujuannya: Youta bisa menilai tampilan dan alur sebelum backend dibangun. Rujukan visual: file mockup `coreta-mockup.html`._

#### Fase 5 — Komponen Dasar UI

- **Scope**:
  - Tambah komponen shadcn: Button, Card, Badge, Input, Tabs, Progress, Dialog, Toast, Tooltip, Skeleton
  - Buat halaman galeri `/dev/komponen` (hanya aktif di mode dev)
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/components/ui/*`
  - `apps/web/app/dev/komponen/page.tsx`
- **Definition of Done**:
  - Semua komponen tampil di galeri pada tema terang dan gelap
  - Button tingginya ≥ 44 px; fokus papan ketik terlihat jelas
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 6 — Komponen Domain (Tanpa Logika)

- **Scope**:
  - Buat: PathNode, StatCard, KompetensiBar (bar dengan garis ambang 80%), WorksheetCard, SubscriptionBadge (6 status), PriceCard (harga coret), EmptyState, PageHeader
  - Buat data tiruan awal di `lib/mock`
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/components/domain/*`
  - `apps/web/lib/mock/*.ts`
- **Definition of Done**:
  - Semua komponen tampil di galeri dengan data tiruan
  - Komponen hanya menerima props; tidak memanggil API
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 7 — Layout & Navigasi per Peran

- **Scope**:
  - Buat route group `(publik)`, `(siswa)`, `(ortu)`, `(admin)`
  - Buat AppShell: navigasi bawah untuk siswa (Jalur, Worksheet, Progres, Bantuan), navigasi untuk orang tua (Laporan, Langganan, Anak, Bantuan), sidebar untuk admin
  - Buat halaman placeholder (judul saja) untuk setiap rute di bagian 5
  - Pilih peran lewat `?peran=` hanya di mode dev (belum ada login)
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(siswa)/layout.tsx`
  - `apps/web/app/(ortu)/layout.tsx`
  - `apps/web/app/(admin)/layout.tsx`
  - `apps/web/components/domain/app-shell.tsx`
  - `apps/web/components/domain/screen-placeholder.tsx`
  - `apps/web/lib/navigation.ts` dan `navigation.test.ts`
  - `apps/web/app/(publik)/layout.tsx`
  - `apps/web/app/**/page.tsx` (placeholder)
- **Definition of Done**:
  - Semua rute pada bagian 5 terbuka dari navigasi tanpa 404
  - Tampilan rapi di tablet mendatar, tablet tegak, dan ponsel
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 8 — UI Jalur Belajar

- **Scope**:
  - Layar `/belajar`: peta Tahap 0–8 (daftar vertikal di ponsel, grid di tablet), PathNode berstatus terkunci/aktif/tuntas, kartu target harian, tombol 'Lanjut belajar'
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(siswa)/belajar/page.tsx`
  - `apps/web/components/domain/PathMap.tsx`
  - `apps/web/lib/mock/path.ts`
- **Definition of Done**:
  - Peta menampilkan 9 tahap dengan tiga status berbeda
  - Tombol 'Lanjut belajar' menuju `/belajar/worksheet`
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 9 — UI Daftar Worksheet & Hasil

- **Scope**:
  - Layar `/belajar/worksheet`: daftar WorksheetCard (minggu ini, ulang berjarak, selesai)
  - Layar `/belajar/hasil/[assignmentId]`: ringkasan skor, daftar soal (benar/sebagian/salah), pembahasan yang bisa dilipat
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(siswa)/belajar/worksheet/page.tsx`
  - `apps/web/app/(siswa)/belajar/hasil/[assignmentId]/page.tsx`
  - `apps/web/lib/mock/worksheets.ts`
- **Definition of Done**:
  - Kedua layar tampil dengan data tiruan dan bisa saling dinavigasi
  - Pembahasan terlipat secara bawaan dan terbuka saat diketuk
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 10 — UI Ruang Kerja: Tata Letak Satu Layar

- **Scope**:
  - Layar `/belajar/kerjakan/[assignmentId]` dengan tinggi `100dvh`, `overflow: hidden`
  - Tiga mode tata letak: standar, media, bacaan; pilih lewat data tiruan soal
  - Area coret masih berupa kotak berpetak (belum ada tinta); bar atas (kemajuan soal), bar bawah (Kirim, Laporkan petunjuk)
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(siswa)/belajar/kerjakan/[assignmentId]/page.tsx`
  - `apps/web/components/workspace/WorkspaceLayout.tsx`
  - `apps/web/components/workspace/QuestionPanel.tsx`
- **Definition of Done**:
  - Di 1180×820 (mendatar), 820×1180 (tegak), dan 390×844 (ponsel) halaman tidak bisa di-scroll
  - Tiga mode tampil benar dengan 3 soal tiruan (pendek, bermedia, bacaan panjang)
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 11 — UI Panel Jawaban

- **Scope**:
  - Buat AnswerPanel untuk empat tipe: pilihan ganda, PG kompleks (kotak centang), benar-salah (per baris), isian singkat
  - Isian: kotak jawaban besar, tombol 'Baca jawaban', kartu konfirmasi 'Benar ini maksudmu?' (data tiruan)
  - Hanya tampilan dan state lokal; belum ada penilaian
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/components/workspace/AnswerPanel.tsx`
  - `apps/web/components/workspace/answer/*.tsx`
- **Definition of Done**:
  - Keempat tipe tampil dan bisa dipilih/diisi
  - Target sentuh ≥ 44 px, bisa dipakai dengan jari di tablet
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 12 — UI Panel Media

- **Scope**:
  - Buat MediaPanel untuk gambar (bisa diperbesar), tabel, audio (pemutar + transkrip), video MP4 (pemutar + takarir)
  - Rumus memakai KaTeX
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/components/workspace/MediaPanel.tsx`
  - `apps/web/components/workspace/media/*.tsx`
  - `apps/web/lib/mock/media.ts`
- **Definition of Done**:
  - Keempat jenis media tampil dalam ruang kerja tanpa membuat halaman scroll
  - Setiap media punya teks alternatif; audio punya transkrip
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 13 — UI Bacaan Panjang & Jendela Melayang

- **Scope**:
  - Buat panel bacaan (satu-satunya area yang boleh scroll, di dalam dirinya sendiri)
  - Buat FloatingWindow: bisa digeser dan diperkecil, dipakai saat media tidak muat
  - Implementasikan aturan tidak muat dari PRD: mode berganti otomatis (standar → media → bacaan)
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/components/workspace/ReadingPanel.tsx`
  - `apps/web/components/workspace/FloatingWindow.tsx`
- **Definition of Done**:
  - Soal dengan bacaan 600 kata tampil tanpa scroll halaman
  - Jendela melayang bisa digeser dengan pena dan jari, dan tidak keluar layar
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 14 — UI Progres Siswa & Bantuan

- **Scope**:
  - Layar `/belajar/progres`: KompetensiBar per kompetensi dengan garis ambang 80%, kalender aktivitas harian
  - Layar `/bantuan` (siswa) dan `/ortu/bantuan`: ChatPanel (gelembung pesan, kolom ketik, tombol 'Hubungi asisten') dengan balasan tiruan
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(siswa)/belajar/progres/page.tsx`
  - `apps/web/app/(siswa)/bantuan/page.tsx`
  - `apps/web/app/(ortu)/ortu/bantuan/page.tsx`
  - `apps/web/components/domain/ChatPanel.tsx`
- **Definition of Done**:
  - Progres dan chat tampil dengan data tiruan
  - Chat menyimpan pesan di state lokal dan menampilkan balasan tiruan
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 15 — UI Orang Tua: Laporan & Profil Anak

- **Scope**:
  - Layar `/ortu/laporan` (kartu laporan terbaru) dan `/ortu/laporan/[week]` (StatCard, kemajuan, 'Yang perlu perhatian', contoh coretan, rencana 2 minggu)
  - Layar `/ortu/anak`: daftar anak, form buat akun siswa (belum berfungsi), tombol unduh/hapus data (belum berfungsi)
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(ortu)/ortu/laporan/page.tsx`
  - `apps/web/app/(ortu)/ortu/laporan/[week]/page.tsx`
  - `apps/web/app/(ortu)/ortu/anak/page.tsx`
  - `apps/web/lib/mock/report.ts`
- **Definition of Done**:
  - Laporan mingguan tampil sesuai mockup
  - Semua teks berbahasa Indonesia dan angka berasal dari data tiruan
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 16 — UI Orang Tua: Langganan, Harga & Faktur

- **Scope**:
  - Layar `/ortu/langganan`: status, paket, tombol ganti paket, jeda, batal (semua tombol belum berfungsi)
  - Layar `/ortu/faktur`: daftar faktur dan tombol unduh
  - Layar `/harga`: tiga PriceCard dengan harga coret (bulanan Rp29.900; semester Rp149.000, coret Rp179.400; tahunan Rp249.000, coret Rp358.800) dan info uji coba 7 hari
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(ortu)/ortu/langganan/page.tsx`
  - `apps/web/app/(ortu)/ortu/faktur/page.tsx`
  - `apps/web/app/(publik)/harga/page.tsx`
- **Definition of Done**:
  - Keenam status langganan bisa dilihat lewat data tiruan
  - Harga coret hanya tampil untuk paket yang punya harga coret
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 17 — UI Admin: Antrean & Pekerjaan Gagal

- **Scope**:
  - Layar `/admin/antrean`: daftar laporan petunjuk dengan hitung mundur batas 24 jam (merah bila < 4 jam), filter status, panel tinjau
  - Layar `/admin/pekerjaan-gagal` dan `/admin/agen` (daftar saja)
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(admin)/admin/antrean/page.tsx`
  - `apps/web/app/(admin)/admin/pekerjaan-gagal/page.tsx`
  - `apps/web/app/(admin)/admin/agen/page.tsx`
  - `apps/web/components/domain/SlaCountdown.tsx`
- **Definition of Done**:
  - Hitung mundur berjalan dan berubah merah di bawah 4 jam
  - Panel tinjau terbuka dari baris antrean
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 18 — UI Admin: Konten, Editor Butir & Rilis

- **Scope**:
  - Layar `/admin/konten` (tabel butir + filter), `/admin/konten/butir/[id]` (form butir, editor petunjuk per pengecoh, pratinjau 3 ukuran memakai komponen ruang kerja), `/admin/rilis`, `/admin/pengguna`
  - Belum menyimpan apa pun
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(admin)/admin/konten/page.tsx`
  - `apps/web/app/(admin)/admin/konten/butir/[id]/page.tsx`
  - `apps/web/app/(admin)/admin/rilis/page.tsx`
  - `apps/web/app/(admin)/admin/pengguna/page.tsx`
- **Definition of Done**:
  - Pratinjau butir bisa berpindah antara tablet mendatar, tegak, dan ponsel
  - Form butir menampilkan semua bidang dari model data `items`
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 19 — UI Halaman Publik

- **Scope**:
  - Layar `/` (halaman jual), `/masuk`, `/daftar`, `/persetujuan/[token]`
  - Form belum terhubung ke Auth
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(publik)/page.tsx`
  - `apps/web/app/(publik)/masuk/page.tsx`
  - `apps/web/app/(publik)/daftar/page.tsx`
  - `apps/web/app/(publik)/persetujuan/[token]/page.tsx`
- **Definition of Done**:
  - Halaman jual memuat hero, manfaat, cara kerja, FAQ, dan tautan ke `/harga` dan `/daftar`
  - Semua form punya validasi tampilan (kolom wajib) tanpa memanggil server
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

> **Titik berhenti — Milestone 2**: semua layar bisa diklik dari awal sampai akhir dengan data tiruan. Youta menyetujui tampilan.

---

### Milestone 3 — Logika inti (tanpa database)

_Paket-paket murni yang bisa diuji tanpa Supabase: penilaian, penguasaan, mesin tinta, validator konten. Setiap fase memakai tes sebagai bukti selesai._

#### Fase 20 — Penilaian: Pilihan Ganda & Benar-Salah

- **Scope**:
  - Di `packages/scoring`: definisikan tipe `Item`, `Answer`, `ScoreResult`
  - Fungsi murni `scoreItem` untuk PG (1 jika sama kunci, selain itu 0) dan benar-salah (jumlah baris benar ÷ jumlah baris)
  - Kembalikan daftar petunjuk pengecoh untuk pilihan atau baris yang salah
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/scoring/src/types.ts`
  - `packages/scoring/src/pg.ts`
  - `packages/scoring/src/bs.ts`
  - `packages/scoring/src/index.ts`
  - `packages/scoring/src/*.test.ts`
- **Definition of Done**:
  - Tes: PG benar = 1, salah = 0; B/S 3 dari 4 baris benar = 0,75
  - Petunjuk yang dikembalikan sesuai pilihan salah
  - Fungsi tidak memakai jaringan, waktu, atau acak
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 21 — Penilaian: PG Kompleks

- **Scope**:
  - Skor = jumlah pilihan benar yang dicentang ÷ jumlah kunci; pilihan salah tidak mengurangi
  - Aturan pengaman diperiksa **sebelum** menghitung: jika semua pilihan dicentang, skor 0 dan petunjuk 'Mencentang semua pilihan dihitung salah. Pilih hanya pernyataan yang kamu yakini benar.'
  - Tambah petunjuk 'masih ada yang belum dipilih' bila skor < 1 dan petunjuk per pilihan salah yang dicentang
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/scoring/src/pgk.ts`
  - `packages/scoring/src/pgk.test.ts`
- **Definition of Done**:
  - Tes: 2 dari 3 kunci dicentang tanpa pilihan salah = 0,67
  - Tes: 2 kunci + 1 salah dicentang = 0,67 (salah tidak mengurangi)
  - Tes: semua pilihan dicentang = 0 dan petunjuk pengaman muncul
  - Tes: tidak ada yang dicentang = 0
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 22 — Penilaian: Isian & Normalisasi

- **Scope**:
  - Fungsi `normalizeAnswer`: hapus spasi, satuan terdaftar, pemisah ribuan; koma desimal menjadi titik; terima pecahan (`3/4`), persen (`75%`), kata 'ribu' dan 'juta'
  - Bandingkan sebagai angka dengan `tolerance` milik butir (bawaan 0); skor 1 atau 0
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/scoring/src/isian.ts`
  - `packages/scoring/src/isian.test.ts`
- **Definition of Done**:
  - Minimal 20 kasus tes, misalnya `60.000`, `60000`, `60 ribu`, `Rp60.000` semuanya cocok dengan kunci 60000
  - `0,75`, `3/4`, dan `75%` cocok dengan kunci 0,75
  - Jawaban kosong dan teks non-angka menghasilkan 0 tanpa galat
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 23 — Model Penguasaan v1

- **Scope**:
  - Skor tingkat = rata-rata 10 percobaan terakhir pada tingkat itu; hanya percobaan **pertama** tiap butir yang dihitung
  - Tingkat berikutnya terbuka jika skor ≥ 70% dengan minimal 5 percobaan; tuntas jika skor tingkat ujian ≥ 80% dengan minimal 8 percobaan
  - Status tuntas dicabut jika skor ulangan < 60%; ulang berjarak 3, 7, 14, 30 hari (maju bila benar, kembali ke 3 hari bila salah)
  - Fungsi menerima `now` sebagai parameter agar mudah dites
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/scoring/src/mastery.ts`
  - `packages/scoring/src/mastery.test.ts`
- **Definition of Done**:
  - Tes: percobaan ulang pada butir yang sama tidak menaikkan skor
  - Tes: pembukaan tingkat dan status tuntas tepat di ambang (70%/5, 80%/8)
  - Tes: jadwal ulang berjarak maju dan mundur sesuai aturan
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 24 — Komposisi Worksheet Mingguan

- **Scope**:
  - Fungsi `composeWorksheet`: 8 soal = 4 baru dari kompetensi aktif + 2 adaptif dari kompetensi dengan skor terendah + 2 ulang berjarak yang jatuh tempo
  - Jika satu kategori kosong, slotnya diisi soal baru; tidak ada butir yang sama dalam satu worksheet
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/scoring/src/compose.ts`
  - `packages/scoring/src/compose.test.ts`
- **Definition of Done**:
  - Tes: komposisi normal 4/2/2
  - Tes: tanpa soal ulang jatuh tempo menghasilkan 6 soal baru + 2 adaptif
  - Hasil selalu 8 soal berbeda
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 25 — Mesin Tinta Dasar

- **Scope**:
  - Di `packages/ink`: kelas `InkEngine` (tanpa React) yang terpasang pada `<canvas>`, memakai Pointer Events dan `perfect-freehand`
  - Alat: pena (dengan tekanan), penghapus, undo/redo, bersihkan; penolakan telapak tangan (abaikan `pointerType: touch` saat pena aktif)
  - Buat pembungkus React `InkCanvas` dan pasang di area coret ruang kerja
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/ink/src/engine.ts`
  - `packages/ink/src/tools.ts`
  - `apps/web/components/workspace/InkCanvas.tsx`
- **Definition of Done**:
  - Di tablet atau emulasi, goresan tampil halus dan mengikuti tekanan
  - Undo/redo dan penghapus bekerja
  - Tes unit untuk logika undo/redo dan penolakan telapak tangan
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 26 — Format Coreta Ink v1

- **Scope**:
  - Definisikan tipe: `{ v:1, canvas:{w,h}, strokes:[{id, tool, pts:[[x,y,tekanan,ms]]}], events:[...penghapusan], layers:[{media_id,...}] }`
  - `serialize` menghasilkan JSON lalu gzip (`fflate`); `deserialize` mendukung semua versi lama; penghapusan dicatat sebagai peristiwa, bukan membuang goresan
  - `renderPng` membuat gambar kecil, lebar maksimal 1024 px
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/ink/src/format.ts`
  - `packages/ink/src/png.ts`
  - `packages/ink/src/format.test.ts`
- **Definition of Done**:
  - Tes bolak-balik: serialize lalu deserialize menghasilkan data yang sama
  - Tes: penghapusan tersimpan sebagai peristiwa
  - PNG hasil render tidak lebih lebar dari 1024 px
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 27 — Lapisan Tempel (Paste-to-Ink)

- **Scope**:
  - Media yang bertanda `pasteable` bisa ditempel ke area coret sebagai lapisan yang bisa digeser dan diubah ukurannya
  - Lapisan dirujuk lewat `media_id` dan tidak ikut tersimpan sebagai gambar di berkas coretan
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/ink/src/layers.ts`
  - `apps/web/components/workspace/PasteLayer.tsx`
- **Definition of Done**:
  - Gambar tabel bisa ditempel, digeser, dan diubah ukurannya dengan pena
  - Berkas coretan hasil `serialize` memuat `media_id`, bukan piksel gambar
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 28 — State Ruang Kerja

- **Scope**:
  - Buat store Zustand: soal aktif, jawaban, status kirim (draf → mengirim → dinilai), navigasi 8 soal, penghitung waktu
  - Hubungkan ke API tiruan di `lib/mock/api.ts` yang memanggil `packages/scoring` (hanya sementara; kunci jawaban tiruan ada di klien dan akan dihapus di Fase 38)
  - Tampilkan nilai dan petunjuk pengecoh setelah kirim
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/components/workspace/store.ts`
  - `apps/web/lib/mock/api.ts`
  - `apps/web/components/workspace/WorkspaceLayout.tsx`
- **Definition of Done**:
  - Siswa bisa mengerjakan 8 soal tiruan dari awal sampai halaman hasil
  - Setiap tipe soal menampilkan nilai dan petunjuk yang benar
  - Pindah soal tidak menghapus coretan soal sebelumnya selama sesi
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 29 — Validator Konten

- **Scope**:
  - Di `packages/content`: skema Zod untuk `Item` sesuai model data
  - Aturan validasi: ada kunci jawaban, ada petunjuk untuk setiap pengecoh, ada pembahasan, semua media punya teks alternatif, `layout_mode` valid
  - Fungsi `validateItem` mengembalikan daftar galat yang mudah dibaca; `importItems` membaca JSON
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/content/src/schema.ts`
  - `packages/content/src/validate.ts`
  - `packages/content/src/import.ts`
  - `packages/content/src/*.test.ts`
- **Definition of Done**:
  - Butir tanpa teks alternatif ditolak dengan pesan jelas
  - Butir PG tanpa petunjuk pengecoh ditolak
  - Cakupan baris paket ≥ 90%
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

> **Titik berhenti — Milestone 3**: `packages/scoring` dan `packages/ink` punya cakupan baris ≥ 90%; ruang kerja bisa dipakai penuh dengan API tiruan.

---

### Milestone 4 — Database & autentikasi

_Skema Supabase, RLS, akun, dan menghubungkan layar jalur/worksheet ke data nyata. Setiap migrasi berisi tabel **dan** tes RLS-nya._

#### Fase 30 — Migrasi 1: Akun & Keluarga

- **Scope**:
  - Migrasi `0001`: `profiles`, `students`, `guardianships`, `consents`; trigger yang membuat `profiles` saat pengguna Auth dibuat; RLS
  - Tes pgTAP: siswa hanya membaca datanya; orang tua hanya anak yang terhubung; admin sesuai peran
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/migrations/0001_akun_keluarga.sql`
  - `supabase/tests/0001_rls_akun.sql`
- **Definition of Done**:
  - `supabase db reset` berjalan dari nol tanpa galat
  - `supabase test db` lulus, termasuk tes negatif (siswa A tidak bisa membaca siswa B)
- **Gerbang persetujuan**: Youta menyetujui migrasi yang menyentuh RLS dan data anak
- **Status**: [ ] Belum | [x] Sedang | [ ] Selesai (menunggu persetujuan Youta)

#### Fase 31 — Migrasi 2: Kurikulum & Konten

- **Scope**:
  - Migrasi `0002`: `stages`, `competencies`, `competency_prereqs`, `items`, `stimuli`, `media_assets`, `worksheets`, `worksheet_items`, view `items_public`; RLS
  - Tes: siswa tidak bisa membaca `answer_key`, `equivalents`, `tolerance`, `distractor_hints`, `explanation` dari tabel maupun view; hanya butir berstatus `published` yang terbaca
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/migrations/0002_konten.sql`
  - `supabase/tests/0002_rls_konten.sql`
- **Definition of Done**:
  - Query siswa ke `items` langsung ditolak; query ke `items_public` tidak memuat kolom kunci
  - Semua tes RLS lulus
- **Gerbang persetujuan**: Youta menyetujui migrasi RLS
- **Status**: [ ] Belum | [x] Sedang | [ ] Selesai (menunggu persetujuan Youta)

#### Fase 32 — Migrasi 3: Data Belajar

- **Scope**:
  - Migrasi `0003`: `assignments`, `attempts`, `ink_sessions`, `hints_shown`, `hint_reports`, `mastery`, `daily_activity`, `weekly_reports`; bucket Storage privat `ink` beserta kebijakannya; RLS
  - Tes: siswa tidak bisa menulis `mastery` atau `daily_activity`; orang tua hanya membaca data anaknya; siswa hanya mengunggah ke folder miliknya
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/migrations/0003_belajar.sql`
  - `supabase/tests/0003_rls_belajar.sql`
- **Definition of Done**:
  - Semua tes pgTAP lulus
  - Percobaan dengan `id` yang sama dua kali tidak membuat baris ganda (kunci utama)
- **Gerbang persetujuan**: Youta menyetujui migrasi RLS dan data anak
- **Status**: [ ] Belum | [x] Sedang | [ ] Selesai (menunggu persetujuan Youta)

#### Fase 33 — Migrasi 4: Langganan, Layanan & Audit

- **Scope**:
  - Migrasi `0004`: `plans`, `subscriptions`, `invoices`, `payment_events`, `conversations`, `messages`, `crm_events`, `notifications`, `ai_decisions`, `audit_log`; RLS
  - Isi tabel `plans` (harga dan harga coret disimpan di tabel, bukan di kode)
  - Tambah pemeriksaan CI: tabel di skema `public` tanpa RLS membuat build gagal
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/migrations/0004_langganan_layanan.sql`
  - `supabase/tests/0004_rls_langganan.sql`
  - `.github/workflows/ci.yml` (tambah cek RLS)
- **Definition of Done**:
  - `payment_events` hanya bisa diakses server
  - `audit_log` hanya bisa ditambah, tidak bisa diubah atau dihapus
  - CI gagal jika ada tabel baru tanpa RLS
- **Gerbang persetujuan**: Youta menyetujui migrasi yang menyentuh uang dan RLS
- **Status**: [ ] Belum | [x] Sedang | [ ] Selesai (menunggu persetujuan Youta)

#### Fase 34 — Seed Data & Tipe TypeScript

- **Scope**:
  - `seed.sql`: Tahap 0–8 dan kompetensi inti, 3 keluarga contoh (orang tua + siswa), 40 butir contoh (8 dari mockup, sisanya dibuat agent konten dan ditandai `draft` sampai ditinjau manusia)
  - Jalankan `supabase gen types typescript` ke `packages/db`; tambah skrip impor butir yang memakai validator dari `packages/content`
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/seed.sql`
  - `packages/db/src/types.ts`
  - `packages/content/scripts/import-seed.ts`
- **Definition of Done**:
  - `supabase db reset` memuat seed tanpa galat
  - Semua butir seed lolos `validateItem`
  - `apps/web` mengimpor tipe dari `@coreta/db` tanpa galat TypeScript
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

#### Fase 35 — Autentikasi Orang Tua & Penjaga Peran

- **Scope**:
  - Hubungkan `/daftar` dan `/masuk` ke Supabase Auth (email + kata sandi, Google)
  - `middleware.ts` (di Next.js 16 bernama `proxy.ts`): menyegarkan sesi dan mengalihkan berdasarkan peran (siswa → `/belajar`, orang tua → `/ortu/laporan`, admin → `/admin/antrean`)
  - `POST /api/consent` mencatat versi teks dan waktu persetujuan; `/persetujuan/[token]` terhubung
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/proxy.ts` (Next.js 16 mengganti nama `middleware.ts`) + `apps/web/lib/supabase/proxy.ts`, `apps/web/lib/auth/*`
  - `apps/web/app/(publik)/masuk/page.tsx`
  - `apps/web/app/(publik)/daftar/page.tsx`
  - `apps/web/app/api/consent/route.ts`
  - `apps/web/app/(publik)/persetujuan/[token]/page.tsx`, `apps/web/app/auth/callback/route.ts`, `apps/web/app/auth/keluar/route.ts`
  - `supabase/migrations/0006_persetujuan_versi.sql` + `supabase/tests/0006_persetujuan_versi.sql`
- **Definition of Done**:
  - Orang tua bisa daftar, masuk, dan keluar
  - Pengguna tanpa peran yang sesuai tidak bisa membuka rute peran lain (dites)
  - Persetujuan tercatat di `consents` beserta versinya
- **Gerbang persetujuan**: Youta menyetujui perubahan auth dan data anak
- **Status**: [ ] Belum | [x] Sedang | [ ] Selesai (menunggu persetujuan Youta)

#### Fase 36 — Akun Siswa dari Orang Tua

- **Scope**:
  - Hubungkan `/ortu/anak`: orang tua membuat akun siswa (email atau kode masuk + PIN) lewat server action yang memakai service role
  - Siswa masuk dengan akun itu dan mendarat di `/belajar`; target harian dan target ujian (TKA/UTBK) tersimpan
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(ortu)/ortu/anak/page.tsx`
  - `apps/web/app/(ortu)/ortu/anak/actions.ts`
  - `apps/web/app/(publik)/masuk/siswa/page.tsx` (+ `actions.ts`, `student-login-form.tsx`; juga dipakai tab Siswa di `/masuk`)
  - `apps/web/app/(ortu)/ortu/anak/child-forms.tsx`, `apps/web/lib/auth/student-server.ts`, `apps/web/lib/auth/student-schemas.ts`, `packages/db/src/student-login.ts`
  - `supabase/migrations/0007_akun_siswa.sql` + `supabase/tests/0007_akun_siswa.sql`; seed siswa dengan kode + PIN
- **Definition of Done**:
  - Siswa seed dan siswa baru bisa masuk dengan kode + PIN
  - Tes: orang tua A tidak bisa melihat atau mengubah anak orang tua B
  - Akun siswa tidak punya login sosial
- **Status**: [ ] Belum | [x] Sedang | [ ] Selesai (menunggu persetujuan Youta: menyentuh auth, data anak, dan RLS, serta memperbaiki trigger 0001)

#### Fase 37 — Jalur & Worksheet dari Database

- **Scope**:
  - Hubungkan `/belajar`, `/belajar/worksheet`, dan pemuatan soal ruang kerja ke Supabase (butir dibaca lewat `items_public`)
  - Hapus data tiruan untuk layar-layar ini
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(siswa)/belajar/page.tsx`
  - `apps/web/app/(siswa)/belajar/worksheet/page.tsx`
  - `apps/web/app/(siswa)/belajar/kerjakan/[assignmentId]/page.tsx`
  - `apps/web/lib/queries/*.ts` (`mappers.ts` murni + `student.ts` server)
  - `apps/web/app/(workspace)/belajar/kerjakan/[assignmentId]/actions.ts` (penilaian di server) + `workspace-screen.tsx`, `apps/web/lib/grading.ts`, `apps/web/lib/ids.ts`
  - `packages/content/seed/learning.json` + `packages/content/src/seed-learning.ts` (worksheet, penugasan, penguasaan, aktivitas contoh)
- **Definition of Done**:
  - Login sebagai siswa seed menampilkan jalur dan worksheet dari database
  - Ruang kerja memuat soal asli; respons ke browser tidak memuat kunci jawaban (diperiksa di tab Network)
- **Status**: [ ] Belum | [ ] Sedang | [x] Selesai

> **Titik berhenti — Milestone 4**: login nyata untuk orang tua dan siswa; siswa seed bisa melihat jalur dan worksheet dari database; semua tes RLS lulus.

---

### Milestone 5 — Alur siswa end-to-end

_Siswa mengerjakan, server menilai, coretan tersimpan, offline aman, penguasaan terhitung, admin menerima laporan petunjuk. Belum ada AI dan belum ada pembayaran. Fase terakhir milestone ini menaikkan aplikasi ke VPS supaya pilot punya alamat nyata._

#### Fase 38 — API Kirim Jawaban

- **Scope**:
  - `POST /api/attempts`: validasi Zod, cek siswa dan kepemilikan penugasan, baca kunci dengan service role, nilai lewat `packages/scoring`, simpan `attempts`, balas `{score, hints[], explanation_available}`
  - Idempoten per `attempt_id` (kirim dua kali menghasilkan satu baris dan respons sama); batas 60 permintaan per menit per pengguna
  - Hapus API tiruan dan kunci jawaban tiruan di klien
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/api/attempts/route.ts`
  - `apps/web/lib/rate-limit.ts`
  - `apps/web/components/workspace/store.ts`
  - `apps/web/lib/mock/api.ts` (hapus)
- **Definition of Done**:
  - Tes integrasi: kirim dua kali dengan `attempt_id` sama = satu baris
  - Tes: PG kompleks dengan semua pilihan dicentang = skor 0
  - Tes: siswa tidak bisa mengirim untuk penugasan milik siswa lain
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 39 — Unggah Coretan

- **Scope**:
  - `POST /api/ink/upload-url`: dua URL bertanda tangan (json.gz dan png) berlaku 10 menit; `POST /api/ink/complete`: membuat baris `ink_sessions`
  - Ruang kerja saat Kirim: serialize coretan + PNG, unggah, lalu panggil `/api/attempts`
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/api/ink/upload-url/route.ts`
  - `apps/web/app/api/ink/complete/route.ts`
  - `apps/web/components/workspace/submit.ts`
- **Definition of Done**:
  - Setelah kirim, berkas `.json.gz` dan `.png` ada di Storage pada jalur `ink/{student_id}/{attempt_id}.*`
  - Berkas tidak bisa dibuka tanpa URL bertanda tangan
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 40 — Offline: Antrean Keluar

- **Scope**:
  - Dexie: tabel `outbox`, `inkDrafts`, `itemCache`, `mediaCache`
  - Saat worksheet dibuka, simpan 10 soal berikutnya beserta media; setiap goresan disimpan ke IndexedDB
  - Kirim ulang dengan jeda bertahap sampai server sukses; saat offline tampil 'Tersimpan, dinilai saat online' dan siswa boleh lanjut
  - Banner status: 'Tersimpan di perangkat · 3 jawaban menunggu dikirim'
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/lib/offline/db.ts`
  - `apps/web/lib/offline/outbox.ts`
  - `apps/web/components/workspace/OfflineBanner.tsx`
- **Definition of Done**:
  - Matikan jaringan, kerjakan 3 soal, nyalakan lagi: 3 percobaan tersimpan, tanpa ganda
  - Tidak ada penilaian di perangkat (kunci jawaban tidak pernah ada di browser)
  - Tes unit untuk logika antrean dan jeda bertahap
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 41 — PWA (Service Worker & Manifest)

- **Scope**:
  - Pasang Serwist; `manifest.ts` (nama, ikon, `display: standalone`); cache aset statis; halaman cadangan offline
  - Perintah pasang ke layar utama di tablet
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/sw.ts`
  - `apps/web/app/manifest.ts`
  - `apps/web/public/icons/*`
  - `apps/web/next.config.ts`
- **Definition of Done**:
  - Aplikasi bisa dipasang dari Chrome (Galaxy Tab) dan 'Tambahkan ke Layar Utama' (iPad)
  - Ruang kerja yang sudah pernah dimuat bisa dibuka tanpa internet
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 42 — Worker & Pekerjaan mastery.update

- **Scope**:
  - Migrasi `0008`: aktifkan `pgmq`, buat antrean `mastery`, `ink`, dan antrean gagal (nomor 0005 dipakai perbaikan hak service_role di Fase 34, 0006 versi persetujuan di Fase 35, 0007 akun siswa di Fase 36)
  - `apps/worker`: baca antrean, coba ulang 3 kali dengan jeda bertahap lalu pindahkan ke antrean gagal, log `pino`
  - Pekerjaan `mastery.update` memakai `packages/scoring` dan memperbarui `mastery` dan `daily_activity`; `/api/attempts` memasukkan pesan ke antrean
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/migrations/0008_pgmq.sql`
  - `apps/worker/src/index.ts`
  - `apps/worker/src/queue.ts`
  - `apps/worker/src/jobs/mastery-update.ts`
- **Definition of Done**:
  - Setelah satu percobaan masuk, `mastery` berubah dalam beberapa detik
  - Menjalankan pekerjaan dua kali tidak menggandakan data (idempoten)
  - Pekerjaan yang sengaja dibuat gagal 3 kali masuk antrean gagal
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 43 — Hasil, Progres & Pembahasan dari Database

- **Scope**:
  - Hubungkan `/belajar/hasil/[assignmentId]` dan `/belajar/progres` ke data nyata (`attempts`, `hints_shown`, `mastery`, `daily_activity`)
  - `POST /api/attempts/[id]/explanation` mencatat bahwa pembahasan dibuka; pembahasan baru dikirim setelah jawaban dikumpulkan
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(siswa)/belajar/hasil/[assignmentId]/page.tsx`
  - `apps/web/app/(siswa)/belajar/progres/page.tsx`
  - `apps/web/app/api/attempts/[id]/explanation/route.ts`
- **Definition of Done**:
  - Siswa seed melihat hasil dan progres sesuai percobaan yang baru dikerjakan
  - Pembahasan tidak bisa dibaca sebelum jawaban dikumpulkan
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 44 — Laporan Petunjuk & Antrean Admin

- **Scope**:
  - Tombol 'Laporkan petunjuk' di ruang kerja → `POST /api/hint-reports` (`due_at` = dibuat + 24 jam)
  - Hubungkan `/admin/antrean`; `POST /api/admin/hint-reports/[id]/resolve` (hanya admin)
  - Pekerjaan `review.sla_watch` tiap jam: tandai yang sisa < 4 jam dan buat notifikasi admin
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/api/hint-reports/route.ts`
  - `apps/web/app/api/admin/hint-reports/[id]/resolve/route.ts`
  - `apps/web/app/(admin)/admin/antrean/page.tsx`
  - `apps/worker/src/jobs/review-sla-watch.ts`
- **Definition of Done**:
  - Siswa melapor, laporan muncul di antrean admin dengan hitung mundur nyata
  - Admin menyelesaikan laporan dan tindakan tercatat di `audit_log`
  - Siswa tidak bisa memanggil endpoint admin (dites)
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 45 — Deploy ke VPS (Docker, Caddy)

- **Scope**:
  - Tentukan dulu spesifikasi VPS; buat `Dockerfile` untuk `web` (output standalone) dan `worker`, `docker-compose.yml`, `Caddyfile` (HTTPS otomatis)
  - Buat proyek Supabase produksi (Singapura) dan jalankan migrasi; isi variabel lingkungan produksi; endpoint health; firewall dasar dan backup berkas konfigurasi
  - Deploy percobaan dengan data seed lebih dulu; data siswa pilot baru dimasukkan setelah Youta menyetujui
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `deploy/Dockerfile.web`
  - `deploy/Dockerfile.worker`
  - `deploy/docker-compose.yml`
  - `deploy/Caddyfile`
  - `deploy/README.md`
- **Definition of Done**:
  - Domain produksi menampilkan aplikasi lewat HTTPS dari VPS
  - Worker berjalan dan mengambil pesan antrean dari Supabase produksi
  - Rollback dilatih: kembali ke gambar Docker versi sebelumnya
  - Pendaftaran dan login berjalan di domain produksi, sehingga pilot tertutup bisa dimulai
- **Gerbang persetujuan**: Membuka akses ke siswa pilot memerlukan persetujuan manual Youta
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

> **Titik berhenti — Milestone 5**: **pilot tertutup bisa dimulai** (tanpa AI dan tanpa pembayaran). Pilot gratis, jadi pembayaran boleh menyusul.

---

### Milestone 6 — AI

_Semua panggilan AI lewat satu pintu (`packages/ai`). AI hanya memberi petunjuk, membaca tulisan, dan menulis laporan; AI tidak pernah menentukan nilai._

#### Fase 46 — Adapter AI, Prompt Berversi & Pagar Biaya

- **Scope**:
  - `packages/ai`: fungsi `generateStructured({component, promptVersion, input, schema})` memakai AI SDK; model dibaca dari variabel lingkungan
  - Prompt disimpan sebagai berkas berversi di `packages/ai/prompts/`; keluaran divalidasi Zod
  - Catat tiap panggilan di `ai_decisions` (token, biaya, latensi); cadangan tanpa AI jika gagal atau tidak valid
  - Pagar biaya Rp8.000 per siswa per bulan (uji coba maksimal 20 analisis coretan)
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/ai/src/generate.ts`
  - `packages/ai/src/providers.ts`
  - `packages/ai/src/cost.ts`
  - `packages/ai/prompts/*.md`
  - `packages/ai/src/*.test.ts`
- **Definition of Done**:
  - Tes dengan penyedia tiruan: keluaran tidak valid memicu cadangan
  - Panggilan tercatat di `ai_decisions` dengan `prompt_version`
  - Siswa yang melewati pagar biaya tidak lagi memicu analisis coretan sampai bulan berikutnya
- **Gerbang persetujuan**: Youta membaca dan menyetujui prompt yang teksnya dibaca siswa atau orang tua
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 47 — Set Evaluasi AI

- **Scope**:
  - `packages/ai/evals`: kerangka set evaluasi (200 coretan berlabel miskonsepsi, 50 percakapan layanan, 30 laporan); mulai dengan 10 contoh yang dibuat manual
  - Skrip `pnpm eval` menghitung akurasi miskonsepsi, kebocoran jawaban, dan perbandingan antar model (Gemini 3.5 Flash-Lite, GPT-5.6 Luna, Claude Haiku 4.5)
  - CI menjalankan evaluasi hanya jika berkas di `packages/ai/prompts` berubah
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/ai/evals/*`
  - `packages/ai/scripts/eval.ts`
  - `.github/workflows/ci.yml`
- **Definition of Done**:
  - `pnpm eval` berjalan pada 10 contoh dan mencetak tabel hasil per model
  - Ambang lulus terdefinisi: akurasi miskonsepsi ≥ 80%, nol kebocoran jawaban
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 48 — Petunjuk dari Coretan (ink.analyze)

- **Scope**:
  - Pekerjaan `ink.analyze`: kirim PNG coretan, teks soal, kunci, pembahasan, pilihan siswa, petunjuk pengecoh; keluaran `{misconception_code, hint, confidence}`
  - Pagar: petunjuk maksimal 2 kalimat, tidak membocorkan jawaban akhir, `confidence` < 0,6 tidak ditampilkan
  - Simpan ke `hints_shown` (source `ai_ink`) dan kirim ke tablet lewat Realtime; `/api/ink/complete` memasukkan pesan ke antrean
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/worker/src/jobs/ink-analyze.ts`
  - `packages/ai/prompts/ink-hint.md`
  - `apps/web/components/workspace/HintToast.tsx`
- **Definition of Done**:
  - Setelah jawaban salah dengan coretan, petunjuk tambahan muncul ≤ 8 detik tanpa memuat ulang halaman
  - Jika AI gagal, siswa tetap melihat petunjuk pengecoh
  - Tidak ada petunjuk yang memuat jawaban akhir (dites dengan set evaluasi)
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 49 — Pembaca Tulisan Isian

- **Scope**:
  - `POST /api/handwriting/read`: masukan PNG kotak jawaban, keluaran `{text, value, confidence}`; batas 10 permintaan per menit
  - Hubungkan tombol 'Baca jawaban' dan kartu konfirmasi; hanya jawaban yang dikonfirmasi siswa yang dikirim ke `/api/attempts`; cadangan: siswa mengetik angka
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/api/handwriting/read/route.ts`
  - `packages/ai/prompts/handwriting.md`
  - `apps/web/components/workspace/answer/IsianInput.tsx`
- **Definition of Done**:
  - Tulisan angka di kotak jawaban terbaca dan ditampilkan untuk dikonfirmasi
  - AI tidak pernah mengirim jawaban sendiri; selalu lewat tombol 'Ya, kirim'
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 50 — Susun & Terbitkan Worksheet Otomatis

- **Scope**:
  - Pekerjaan `worksheet.compose` (Minggu 21.00 WIB) memakai `composeWorksheet`; `worksheet.release` (Senin 05.00 WIB) menerbitkan dan membuat notifikasi
  - Jadwal dengan `pg_cron` memasukkan pesan ke antrean
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `supabase/migrations/0009_cron_worksheet.sql`
  - `apps/worker/src/jobs/worksheet-compose.ts`
  - `apps/worker/src/jobs/worksheet-release.ts`
- **Definition of Done**:
  - Uji coba satu siswa seed: worksheet 8 soal tersusun (4/2/2) dan terbit
  - Menjalankan dua kali tidak membuat worksheet ganda
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 51 — Laporan Mingguan: Metrik & Penulis

- **Scope**:
  - Query SQL metrik: hari belajar, soal, waktu, kemajuan per kompetensi, miskonsepsi terbanyak
  - `report.generate` (Minggu 18.00): penulis AI `{headline, attention, plan[], encouragement}`; pengecek otomatis bahwa setiap angka di teks ada di `metrics`; cadangan laporan templat
  - `report.publish` (Minggu 19.00): terbitkan yang lolos cek; 5% laporan diambil untuk ditinjau admin
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/worker/src/jobs/report-generate.ts`
  - `apps/worker/src/jobs/report-publish.ts`
  - `packages/ai/prompts/weekly-report.md`
  - `supabase/migrations/0007_cron_report.sql`
- **Definition of Done**:
  - Laporan untuk siswa seed terbit dengan narasi yang semua angkanya ada di metrik
  - Laporan yang gagal cek memakai templat tanpa narasi
- **Gerbang persetujuan**: Youta menyetujui prompt laporan (dibaca orang tua)
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 52 — Laporan Orang Tua dari Database & Notifikasi

- **Scope**:
  - Hubungkan `/ortu/laporan` dan `/ortu/laporan/[week]` ke `weekly_reports`; contoh coretan lewat URL bertanda tangan dari `sample_ink_id`
  - Notifikasi di aplikasi: tabel `notifications` + Realtime + ikon lonceng
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(ortu)/ortu/laporan/page.tsx`
  - `apps/web/app/(ortu)/ortu/laporan/[week]/page.tsx`
  - `apps/web/components/domain/NotificationBell.tsx`
- **Definition of Done**:
  - Orang tua seed membaca laporan nyata beserta contoh coretan anak
  - Notifikasi baru muncul tanpa memuat ulang halaman
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

> **Titik berhenti — Milestone 6**: pilot dengan petunjuk dari coretan dan laporan mingguan. Evaluasi AI lulus ambang.

---

### Milestone 7 — Langganan & layanan pelanggan

_Uang dan layanan pelanggan. Semua perubahan alur pembayaran melewati persetujuan Youta. Karena pilot gratis, milestone ini boleh dikerjakan setelah pilot berjalan, tetapi harus selesai sebelum peluncuran berbayar._

#### Fase 53 — Logika Langganan (Mesin Status)

- **Scope**:
  - Fungsi murni untuk enam status: Uji coba, Aktif, Dijeda, Menunggak, Dibatalkan, Berakhir
  - Aturan: uji coba 7 hari tanpa data bayar; ganti paket berlaku di periode berikutnya; jeda 1–4 minggu maksimal 2 kali setahun; batal = `cancel_at_period_end`; masa tenggang 3 hari lalu Berakhir
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/lib/billing/state.ts`
  - `apps/web/lib/billing/state.test.ts`
- **Definition of Done**:
  - Tes tabel transisi: semua perpindahan yang sah lolos, yang tidak sah ditolak
  - Tes: jeda memundurkan akhir periode sepanjang jeda
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 54 — Antarmuka Pembayaran, Checkout & Webhook

- **Scope**:
  - Antarmuka `PaymentProvider` (`createInvoice`, `verifyAndParseWebhook`, `refund`) dan adapter tiruan `mock`
  - `POST /api/billing/checkout` (masukan `{plan_id, method}`, keluaran URL bayar); `POST /api/webhooks/[provider]`: verifikasi, simpan ke `payment_events` (kunci unik), proses idempoten, ubah `invoices` dan `subscriptions` lewat mesin status
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/lib/billing/provider.ts`
  - `apps/web/lib/billing/providers/mock.ts`
  - `apps/web/app/api/billing/checkout/route.ts`
  - `apps/web/app/api/webhooks/[provider]/route.ts`
- **Definition of Done**:
  - Tes: peristiwa webhook yang sama dikirim dua kali diproses sekali
  - Tes: tanda tangan webhook salah ditolak
  - Dengan adapter tiruan, alur bayar → langganan Aktif berjalan
- **Gerbang persetujuan**: Youta menyetujui alur pembayaran
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 55 — Adapter Penyedia Nyata & Rekonsiliasi

- **Scope**:
  - Syarat awal: keputusan Order Hero atau Midtrans sudah diambil (lihat Analisis biaya di PRD)
  - Buat adapter penyedia terpilih dalam mode tes (QRIS, virtual account, e-wallet; langganan berulang bila penyedia mendukung)
  - Pekerjaan rekonsiliasi harian: bandingkan status tagihan di penyedia dan database; selisih tampil di dasbor admin
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/lib/billing/providers/<penyedia>.ts`
  - `apps/worker/src/jobs/billing-reconcile.ts`
- **Definition of Done**:
  - Pembayaran di sandbox membuat langganan Aktif
  - Selisih buatan (status berbeda) muncul di dasbor admin
- **Gerbang persetujuan**: Youta menyetujui alur pembayaran dan memakai kunci tes
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 56 — Pekerjaan Penagihan & Faktur PDF

- **Scope**:
  - `billing.renewal_invoice` (08.00): tagihan H-7 untuk metode tagihan (VA, QRIS), pengingat H-3 dan H-1 lewat notifikasi dan email
  - `billing.grace_check` (00.10): Menunggak lewat 3 hari menjadi Berakhir
  - Faktur PDF dibuat worker (`@react-pdf/renderer`) dan disimpan di Storage
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/worker/src/jobs/billing-renewal-invoice.ts`
  - `apps/worker/src/jobs/billing-grace-check.ts`
  - `apps/worker/src/jobs/invoice-pdf.ts`
- **Definition of Done**:
  - Langganan seed yang akan berakhir 7 hari lagi mendapat tagihan baru
  - Langganan Menunggak 3 hari berubah menjadi Berakhir
  - PDF faktur terbuka dan benar isinya
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 57 — Halaman Langganan & Faktur Terhubung

- **Scope**:
  - Hubungkan `/ortu/langganan`, `/ortu/faktur`, dan `/harga` ke data nyata (harga dan harga coret dari tabel `plans`)
  - `POST /api/billing/pause` dan `/cancel`; ganti paket; uji coba 7 hari tanpa meminta data pembayaran
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(ortu)/ortu/langganan/page.tsx`
  - `apps/web/app/(ortu)/ortu/faktur/page.tsx`
  - `apps/web/app/api/billing/pause/route.ts`
  - `apps/web/app/api/billing/cancel/route.ts`
- **Definition of Done**:
  - Orang tua seed bisa jeda, batal, dan ganti paket sesuai aturan mesin status
  - Mengubah harga di tabel `plans` langsung terlihat di `/harga` tanpa mengubah kode
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 58 — Asisten Layanan Tingkat 1: Chat & Alat Baca

- **Scope**:
  - `POST /api/support/chat` dengan respons streaming (SSE); simpan `conversations` dan `messages`
  - Alat baca: `get_subscription`, `list_invoices`, `get_weekly_report`, `explain_report`; setiap alat memeriksa di server bahwa data milik penanya
  - Asisten memperkenalkan diri sebagai asisten otomatis; hubungkan `ChatPanel`
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/api/support/chat/route.ts`
  - `packages/ai/prompts/support-l1.md`
  - `packages/ai/src/tools/read.ts`
  - `apps/web/components/domain/ChatPanel.tsx`
- **Definition of Done**:
  - Orang tua bisa bertanya status langganan dan isi laporan dan mendapat jawaban
  - Tes: alat tidak bisa membaca data akun lain, meski diminta lewat pesan
  - Isi chat diperlakukan sebagai data (uji injeksi prompt sederhana lulus)
- **Gerbang persetujuan**: Youta menyetujui prompt layanan
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 59 — Asisten Tingkat 1: Alat Tindakan & Eskalasi

- **Scope**:
  - Alat: `resend_invoice`, `pause_subscription`, `update_notification_prefs`, `device_troubleshoot`, `escalate_to_l2`
  - Tindakan yang mengubah uang atau akses butuh konfirmasi tombol dari orang tua di chat
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/ai/src/tools/actions.ts`
  - `apps/web/components/domain/ConfirmActionCard.tsx`
- **Definition of Done**:
  - Orang tua bisa meminta kirim ulang faktur dan jeda langganan lewat chat dengan konfirmasi tombol
  - `escalate_to_l2` membuat percakapan tingkat 2 dengan ringkasan
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 60 — AI Agent Tingkat 2 & Pengembalian Dana

- **Scope**:
  - Alat tingkat 2: `extend_access` (maksimal 7 hari), `cancel_subscription`, `refund_per_policy(invoice_id, rule_code)` sesuai aturan R1–R6 di tab Kebijakan pengembalian dana, `notify_admin`
  - Besaran dana dihitung server, bukan AI; konfirmasi tombol orang tua sebelum uang dipindah
  - Laporan harian untuk admin pukul 08.00; kasus keselamatan anak selalu diteruskan ke admin
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `packages/ai/prompts/support-l2.md`
  - `packages/ai/src/tools/l2.ts`
  - `apps/worker/src/jobs/support-daily-report.ts`
- **Definition of Done**:
  - Pengembalian dana yang sah (aturan R1) berjalan dengan nominal dari server
  - Permintaan di luar kebijakan masuk antrean admin, tidak diproses AI
  - Semua tindakan tercatat di `ai_decisions` dan `audit_log`
- **Gerbang persetujuan**: Youta menyetujui alur pengembalian dana dan prompt
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 61 — CRM: Pemindaian Sinyal, Notifikasi & Web Push

- **Scope**:
  - `crm.scan` harian 18.30: 3 hari tidak belajar, skor turun, uji coba belum aktif, pembayaran gagal, perpanjangan dekat → catat `crm_events` + notifikasi
  - Web Push (VAPID, `web-push`) dan email transaksional (Resend); orang tua bisa mengatur preferensi notifikasi
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/worker/src/jobs/crm-scan.ts`
  - `apps/web/lib/push.ts`
  - `apps/web/app/api/push/subscribe/route.ts`
  - `apps/web/sw.ts`
- **Definition of Done**:
  - Siswa seed yang 3 hari tidak belajar memicu pengingat
  - Notifikasi Web Push tiba di tablet yang sudah memasang PWA
  - Orang tua bisa mematikan jenis notifikasi tertentu
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

> **Titik berhenti — Milestone 7**: orang tua bisa berlangganan di mode tes dan asisten layanan menjawab; siap untuk uji coba berbayar.

---

### Milestone 8 — Admin, keamanan, rilis & polish

_Menyelesaikan alat admin, mengunci keamanan dan privasi anak, menguji end-to-end, lalu memolesnya. Aplikasi sudah berjalan di VPS sejak Milestone 5; setiap fase di sini ikut di-deploy._

#### Fase 62 — Admin: Editor Butir & Penerbitan

- **Scope**:
  - Hubungkan `/admin/konten` dan editor butir ke database: buat, ubah, impor JSON; validator `packages/content` dijalankan sebelum menyimpan
  - Status `draft → review → published`; butir yang gagal validasi tidak bisa terbit; pratinjau 3 ukuran
  - Pekerjaan `content.item_health` (Senin 06.00): tandai butir terlalu mudah (> 95% benar), terlalu sulit (< 20%), atau sering dilaporkan
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(admin)/admin/konten/**`
  - `apps/web/app/api/admin/items/route.ts`
  - `apps/worker/src/jobs/content-item-health.ts`
- **Definition of Done**:
  - Admin membuat butir, pratinjau, dan menerbitkannya; butir muncul di `items_public`
  - Butir yang gagal validasi menampilkan daftar galat dan tidak bisa diterbitkan
- **Gerbang persetujuan**: Butir diterbitkan hanya setelah ditinjau manusia (penyusun konten atau admin)
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 63 — Admin: Rilis, Pengguna, Pekerjaan Gagal & Log Agen

- **Scope**:
  - Hubungkan `/admin/rilis`, `/admin/pengguna`, `/admin/pekerjaan-gagal` (coba ulang), `/admin/agen` (percakapan, label keluhan, biaya AI harian dari `ai_decisions`)
  - Pelabel keluhan: setelah percakapan selesai, label dari daftar tetap `{label, sentiment, needs_admin}`
  - Setiap tindakan admin dicatat di `audit_log`
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(admin)/admin/**`
  - `packages/ai/prompts/complaint-label.md`
  - `apps/worker/src/jobs/complaint-label.ts`
- **Definition of Done**:
  - Admin bisa mencoba ulang pekerjaan gagal dan melihat biaya AI per hari
  - Setiap tindakan admin tampak di `audit_log`
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 64 — Keamanan Aplikasi

- **Scope**:
  - Header keamanan (CSP, HSTS, X-Frame-Options), proteksi CSRF untuk route handler yang mengubah data
  - Batas laju seragam (60 permintaan/menit biasa, 10/menit endpoint AI); MFA wajib untuk akun admin
  - Pemindaian dependensi otomatis di CI
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/next.config.ts`
  - `apps/web/proxy.ts` (Next.js 16; dulu `middleware.ts`)
  - `apps/web/lib/rate-limit.ts`
  - `.github/workflows/ci.yml`
- **Definition of Done**:
  - Pemeriksa header (mis. securityheaders) memberi nilai baik
  - Akun admin tidak bisa masuk tanpa MFA
  - Permintaan mutasi tanpa token CSRF ditolak
- **Gerbang persetujuan**: Youta menyetujui perubahan auth
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 65 — Privasi Data Anak

- **Scope**:
  - Orang tua bisa mengunduh data anak dan meminta penghapusan dari `/ortu/anak` (selesai dalam 30 hari)
  - Pekerjaan `data.retention` (tanggal 1 tiap bulan): hapus coretan mentah yang melewati masa simpan (usulan 24 bulan) kecuali ada izin riset
  - Teks persetujuan dan kebijakan privasi berversi; analitik memakai ID tersamar
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/app/(ortu)/ortu/anak/actions.ts`
  - `apps/worker/src/jobs/data-retention.ts`
  - `apps/web/app/(publik)/privasi/page.tsx`
- **Definition of Done**:
  - Unduhan data anak berisi jawaban, aktivitas, dan laporan
  - Penghapusan data menghapus coretan di Storage dan baris terkait
  - Pekerjaan retensi dites dengan data berumur buatan
- **Gerbang persetujuan**: Youta menyetujui; teks privasi ditinjau konsultan hukum sebelum peluncuran
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 66 — E2E: Alur Siswa & Offline

- **Scope**:
  - Playwright (Chromium dan WebKit): login siswa, kerjakan 8 soal dengan simulasi Pointer Events, lihat hasil
  - Tes offline: matikan jaringan, kerjakan 3 soal, nyalakan lagi, 3 percobaan tersimpan tanpa ganda
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `e2e/siswa.spec.ts`
  - `e2e/offline.spec.ts`
  - `e2e/helpers/pen.ts`
  - `playwright.config.ts`
- **Definition of Done**:
  - Kedua tes lulus di ukuran tablet mendatar dan tegak
  - Tes berjalan di CI terhadap URL pratinjau atau lokal
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 67 — E2E: Orang Tua, Admin & Visual

- **Scope**:
  - Orang tua daftar → bayar di mode tes → baca laporan; siswa melapor petunjuk → admin menyelesaikan
  - Tangkapan layar visual tiga mode ruang kerja di tiga ukuran, tema terang dan gelap
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `e2e/ortu.spec.ts`
  - `e2e/admin.spec.ts`
  - `e2e/visual.spec.ts`
- **Definition of Done**:
  - Alur utama lulus di tablet mendatar, tablet tegak, dan ponsel
  - Selisih piksel visual di bawah ambang
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 68 — Pemantauan & Analitik

- **Scope**:
  - Sentry untuk web dan worker; PostHog (peristiwa inti: worksheet dimulai, jawaban dikirim, laporan dibaca, langganan dimulai) dan feature flag
  - Pemantau uptime dan log terstruktur; panel biaya AI harian
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/sentry.*.config.ts`
  - `apps/web/lib/analytics.ts`
  - `apps/worker/src/sentry.ts`
- **Definition of Done**:
  - Galat buatan di web dan worker muncul di Sentry
  - Peristiwa inti muncul di PostHog dengan ID tersamar
  - Alarm uptime menyala saat layanan dimatikan
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 69 — Polish: Aksesibilitas, Status Kosong & Teks

- **Scope**:
  - Audit aksesibilitas: target sentuh ≥ 44 px, kontras ≥ 4,5:1, teks alternatif, navigasi papan ketik untuk halaman orang tua dan admin
  - Lengkapi status kosong, memuat, dan galat di semua layar; rapikan teks Indonesia
  - Tangani temuan prioritas High dari bagian 9b
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `apps/web/components/**`
  - `apps/web/app/**`
- **Definition of Done**:
  - Pemeriksa aksesibilitas otomatis (mis. axe) tanpa pelanggaran serius pada halaman utama
  - Setiap layar punya tampilan kosong dan galat yang jelas
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

#### Fase 70 — Polish: Uji Perangkat Nyata & Performa

- **Scope**:
  - Isi daftar periksa di iPad + Apple Pencil (Safari) dan Galaxy Tab + S Pen (Chrome): latensi tinta, penolakan telapak tangan, media, offline
  - Ukur: goresan ≤ 16 ms per frame, soal pertama siap ditulisi ≤ 2 detik di 4G, kirim jawaban ≤ 1 detik (p95)
  - Perbaiki yang meleset dari target; catat sisanya di 9b
- **Estimasi waktu**: ~30 menit prompting + testing
- **File yang dibuat/dimodifikasi**:
  - `docs/uji-perangkat.md`
  - `packages/ink/src/**`
  - `apps/web/components/workspace/**`
- **Definition of Done**:
  - Daftar periksa perangkat terisi untuk kedua perangkat acuan
  - Target performa tercapai atau penyimpangannya dicatat dengan alasan
- **Gerbang persetujuan**: Youta menyetujui rilis pilot
- **Status**: [x] Belum | [ ] Sedang | [ ] Selesai

> **Titik berhenti — Milestone 8**: siap rilis ke produksi dan pilot nyata. Rilis memerlukan persetujuan manual Youta.

---

## 7. Reusable Components

Komponen di bawah dipakai di lebih dari satu layar. Semuanya dibuat **sebelum** layar utama (Fase 5–6), hanya menerima props, dan tidak memanggil API.

**Komponen dasar (`components/ui`, dari shadcn/ui)** — dibuat di Fase 5
- `Button`, `Card`, `Badge`, `Input`, `Tabs`, `Progress`, `Dialog`, `Toast`, `Tooltip`, `Skeleton`
- Aturan: tinggi tombol ≥ 44 px; fokus papan ketik terlihat; mendukung tema terang dan gelap

**Komponen domain (`components/domain`)** — dibuat di Fase 6 dan 6
- `PathNode` — satu simpul tahap pada jalur (terkunci / aktif / tuntas). Dipakai di `/belajar`, `/belajar/progres`
- `StatCard` — angka besar + label + perubahan. Dipakai di dasbor siswa, laporan orang tua, admin
- `KompetensiBar` — bar penguasaan dengan garis ambang 80%. Dipakai di progres siswa dan laporan orang tua
- `WorksheetCard` — kartu worksheet (judul, jumlah soal, status, tombol). Dipakai di `/belajar/worksheet` dan `/belajar`
- `SubscriptionBadge` — enam status langganan. Dipakai di langganan, admin pengguna, layar bantuan
- `PriceCard` — kartu paket dengan harga coret. Dipakai di `/harga` dan `/ortu/langganan`
- `EmptyState` — ilustrasi kecil + teks + tombol. Dipakai di hampir semua daftar
- `PageHeader` — judul halaman + aksi. Dipakai di semua halaman
- `AppShell` — kerangka navigasi per peran (Fase 7)
- `ChatPanel` — gelembung pesan + kolom ketik. Dipakai di bantuan siswa, bantuan orang tua (Fase 14, dihubungkan di Fase 58)
- `SlaCountdown` — hitung mundur 24 jam (merah < 4 jam). Dipakai di antrean admin

**Komponen ruang kerja (`components/workspace`)** — dibuat di Fase 10–13
- `WorkspaceLayout` — tiga mode (standar, media, bacaan) tanpa scroll halaman
- `QuestionPanel`, `AnswerPanel` (empat tipe jawaban), `MediaPanel`, `ReadingPanel`, `FloatingWindow`
- `InkCanvas` — kanvas tinta (membungkus `packages/ink`); `PasteLayer` — lapisan tempel
- `HintToast` — petunjuk dari AI; `OfflineBanner` — status penyimpanan lokal

**Aturan komponen:**
- Satu komponen satu berkas; nama `PascalCase`; props bertipe TypeScript tanpa `any`
- Teks antarmuka berbahasa Indonesia; nama kode berbahasa Inggris
- Setiap komponen baru ditampilkan di galeri `/dev/komponen` agar mudah dicek visual

---

## 8. Chunking Guide — Cara Pakai TIP Saat Prompting

Bagian ini menjelaskan cara memakai TIP sebagai konteks saat prompting AI untuk coding. Prinsipnya: **satu fase per sesi, konteks secukupnya, hasil diuji sebelum lanjut**.

### Aturan emas
1. Mulai sesi baru (percakapan baru) untuk setiap fase. Konteks pendek membuat AI lebih akurat.
2. Selalu tempel konteks minimum: **bagian 1** (Overview, terutama "Aturan yang tidak boleh dilanggar"), **bagian data model yang relevan**, dan **fase yang sedang dikerjakan**. Jangan menempel seluruh TIP.
3. Minta AI mengerjakan **fase ini saja**. Kalau AI mulai membuat file di luar daftar, hentikan dan ingatkan.
4. Jalankan tes dan Definition of Done sebelum commit. Jangan lanjut kalau ada yang merah.
5. Untuk fase uang, data anak, RLS, atau auth: minta AI menjelaskan rencananya dulu, lalu **Youta membaca hasilnya** sebelum di-merge.
6. Setiap selesai fase: ubah status, isi tracker (9c), dan catat keputusan atau temuan (9a/9b).

### Template Prompt Chunking (gunakan tiap kali mulai fase baru)

```
Aku sedang mengerjakan Coreta, aplikasi web (PWA) latihan matematika TKA/UTBK untuk
siswa SMA Jakarta yang mengerjakan di tablet dengan stylus. Stack: Next.js 16 (App
Router) + TypeScript strict + Tailwind 4 + shadcn/ui + Supabase, monorepo pnpm +
Turborepo. Ini TIP-nya sebagai konteks:

[tempel: bagian 1 (Overview + Aturan yang tidak boleh dilanggar)]
[tempel: bagian Data Model yang relevan dengan fase ini]
[tempel: entri fase yang sedang dikerjakan]

Sekarang aku mau mengerjakan Fase [N] — [nama fase].

Scope fase ini:
- [poin 1]
- [poin 2]

File yang perlu dibuat/dimodifikasi:
- [file 1]
- [file 2]

Definition of Done:
- [kondisi 1]
- [kondisi 2]

Aturan:
- Kerjakan fase ini saja. Jangan mengerjakan fase lain dan jangan menambah fitur.
- Jangan mengirim kunci jawaban ke browser dan jangan menaruh logika penilaian di
  luar packages/scoring.
- Teks antarmuka berbahasa Indonesia, nama kode dan komentar berbahasa Inggris.
- Jika ada yang kurang jelas, tanyakan dulu sebelum menulis kode.
- Setelah selesai, tulis cara mengetesnya langkah demi langkah.
```

### Contoh pengisian (Fase 21 — Penilaian: PG Kompleks)

```
Aku sedang mengerjakan Coreta ... (sama seperti template di atas)

Sekarang aku mau mengerjakan Fase 21 — Penilaian: PG Kompleks.

Scope fase ini:
- Skor = jumlah pilihan benar yang dicentang ÷ jumlah kunci; pilihan salah tidak mengurangi
- Aturan pengaman diperiksa **sebelum** menghitung: jika semua pilihan dicentang, skor 0 dan petunjuk 'Mencentang semua pilihan dihitung salah. Pilih hanya pernyataan yang kamu yakini benar.'
- Tambah petunjuk 'masih ada yang belum dipilih' bila skor < 1 dan petunjuk per pilihan salah yang dicentang

File yang perlu dibuat/dimodifikasi:
- `packages/scoring/src/pgk.ts`
- `packages/scoring/src/pgk.test.ts`

Definition of Done:
- Tes: 2 dari 3 kunci dicentang tanpa pilihan salah = 0,67
- Tes: 2 kunci + 1 salah dicentang = 0,67 (salah tidak mengurangi)
- Tes: semua pilihan dicentang = 0 dan petunjuk pengaman muncul
- Tes: tidak ada yang dicentang = 0

Tolong generate kode untuk fase ini saja. Jangan kerjakan fase lain dulu.
```

### Template Prompt Debugging

```
Aku sedang mengerjakan Coreta (Next.js 16 + Supabase) di Fase [N] — [nama fase].

Ini error yang muncul:
[paste error message lengkap, termasuk stack trace]

Ini langkah untuk memunculkannya:
[1. ... 2. ... 3. ...]

Ini kode yang berhubungan:
[paste kode relevan, jangan seluruh proyek]

Ini konteks dari TIP:
[paste bagian TIP yang relevan: data model / screen map / fase ini / aturan bagian 1]

Tolong jelaskan penyebab error ini dan buatkan plan fix-nya dulu sebelum langsung
generate kode. Ubah sesedikit mungkin file, dan jangan mengubah hal di luar fase ini.
```

### Template Prompt Tinjauan (khusus fase bergerbang persetujuan)

```
Ini hasil Fase [N] — [nama fase], yang menyentuh [uang / data anak / RLS / auth].

Tolong tinjau diff berikut sebagai reviewer keamanan:
[paste diff atau berkas]

Periksa: (1) apakah ada tabel tanpa RLS, (2) apakah ada jalur yang membuat siswa atau
orang tua bisa membaca data orang lain, (3) apakah kunci jawaban atau service_role bisa
sampai ke browser, (4) apakah ada operasi yang tidak idempoten. Jawab dengan daftar
temuan dan tingkat keparahan. Jangan menulis ulang kode dulu.
```

> 💡 Tips: Template di atas berlaku untuk AI apa pun — Claude, ChatGPT, Gemini, atau Copilot. Untuk agen yang membaca repo langsung (mis. Claude Code), cukup minta ia membaca `docs/AGENTS.md` dan `tip.md` lalu sebut nomor fasenya.

---

## 9. Development Notes & Findings Log

Bagian ini diisi selama pengembangan. Catat setiap keputusan penting atau temuan, supaya TIP tetap jujur terhadap kenyataan di kode.

### 9a. Keputusan Teknis

Keputusan yang sudah diambil sebelum coding dimulai (menyimpang atau melengkapi PRD/spesifikasi teknis):

| Fase | Keputusan | Alasan |
|------|-----------|--------|
| 0 | Fase 0 memakai `create-next-app` di `apps/web`, bukan clone starter template | Tidak ada starter; monorepo dibuat di Fase 1 |
| 0 | Gunakan pnpm 11.9.0 untuk scaffold awal; tunda pnpm 12.x | Corepack 0.34.2 bawaan Node 24 mencari `bin/pnpm.cjs`, sedangkan pnpm 12.9.1 menyediakan `bin/pnpm.mjs`; pnpm 11.9.0 berhasil install, lint, dev, dan build |
| 1 | `packages/ui` dilebur menjadi `apps/web/components` | Satu aplikasi web saja; paket UI terpisah belum diperlukan |
| 1 | Package internal mengekspor source TypeScript dan memakai dependency `workspace:*` | Next.js 16 App Router dengan Turbopack mentranspilasi package workspace secara otomatis; dependency graph tetap eksplisit untuk Turbo |
| 1 | pnpm 11.9.0 juga dipasang sebagai dev dependency root | Turborepo perlu menemukan executable `pnpm` di PATH, sedangkan mesin pengembangan hanya menyediakan pnpm melalui Corepack |
| 2 | Pertahankan ESLint 9.39.5 dan pindahkan konfigurasi bersama ke root | Versi ini berasal dari scaffold Next.js 16.3.8 yang sudah berjalan; aturan Next dibatasi ke `apps/web`, sedangkan aturan TypeScript berlaku di seluruh workspace |
| 2 | Pasangkan Vitest 5.0.3 dengan Vite 8.1.5 | Vite 8.2+ meminta `lightningcss ^1.33.0` yang belum tersedia di registry; Vite 8.1.5 memakai seri 1.32 dan berhasil diinstal serta menjalankan tes |
| 45 | Next.js dan worker berjalan di VPS (Docker Compose + Caddy); database tetap di Supabase cloud | Spesifikasi awal menyebut Vercel/Railway; VPS yang sudah dimiliki lebih hemat. **Spesifikasi VPS belum dicek** |
| 54 | Penyedia pembayaran dipasang di balik antarmuka `PaymentProvider` (Order Hero atau Midtrans) | Fitur Order Hero (webhook, langganan berulang, pengembalian dana) belum terverifikasi; ada lima pertanyaan untuk hello@orderhero.id |
| 53–57 | Langganan dan pembayaran dikerjakan setelah pilot gratis berjalan | Pilot tidak memungut bayaran; mengurangi risiko di awal |
| 46 | Pilot dimulai tanpa AI | Penilaian dan petunjuk pengecoh sudah berjalan tanpa AI; AI menyusul sebagai tambahan |
| semua | Penilaian hanya di server (`packages/scoring`), kunci jawaban tidak pernah ke browser | Aturan tak boleh dilanggar nomor 1 dan 2 |

(Tambahkan baris baru di bawah ini selama pengembangan.)

| Fase | Keputusan | Alasan |
|------|-----------|--------|
| 3 | Port Supabase lokal Coreta di 15420–15429 (API 15421, DB 15422, Studio 15423, Mailpit 15424); inspector edge runtime 8183 | Proyek Supabase lokal lain (`xabi`) memakai port bawaan 54321–54329, jadi Coreta memakai rentang sendiri. Awalnya 54420–54429, tetapi Windows (Hyper-V) mencadangkan 54326–54425 secara dinamis sehingga port itu gagal di-bind (Fase 30, 7 Okt 2026). Port di bawah 49152 tidak ikut dicadangkan |
| 3 | `[analytics]` lokal dimatikan | Kontainer `vector` crash-loop di Docker Desktop Windows (butuh daemon di `tcp://localhost:2375`); hanya memengaruhi Logs Explorer di Studio lokal |
| 3 | `.env.example` di root; Next.js membaca `apps/web/.env.local` (diisi dari `supabase status -o env`) | Next.js hanya memuat berkas env dari folder aplikasinya; worker nanti memakai `apps/worker/.env` |
| 3 | Nama variabel tetap `NEXT_PUBLIC_SUPABASE_ANON_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` (kunci JWT legacy), belum memakai kunci `sb_publishable_`/`sb_secret_` | Mengikuti daftar variabel di bagian 4; migrasi ke kunci baru bisa diputuskan sebelum deploy (Fase 45) |
| 3 | Validasi env bersifat malas (`getPublicEnv()`/`getServerEnv()`), bukan saat impor | `next build` dan CI tidak gagal ketika variabel belum diisi; galat muncul saat klien pertama kali dibuat |
| 3 | `GET /api/health` memanggil `auth.admin.listUsers` lewat klien admin dengan batas waktu 3 detik; gagal = HTTP 503 `{ ok: false, supabase: 'down' }` | Belum ada tabel aplikasi; panggilan ini melewati gateway, Auth, dan Postgres sekaligus |
| 4 | `shadcn init -d` memakai gaya bawaan CLI 4.x: `base-nova` (Base UI, `@base-ui/react`), bukan Radix | Bawaan resmi shadcn CLI saat ini; komponen tetap kode milik sendiri di `components/ui` |
| 4 | Penggabung kelas memakai paket `cn` (pengganti `clsx` + `tailwind-merge` dari shadcn) lewat `createCn` di `lib/utils.ts` yang mengenal token `touch`; ESLint melarang `import "cn"` langsung | Tanpa ekstensi, `cn("size-8", "size-touch")` menyisakan keduanya. **Setelah `shadcn add` di Fase 5, ganti impor `cn` di komponen baru ke `@/lib/utils`** (lint akan gagal bila lupa) |
| 4 | Pengganti tema dibuat sendiri (`lib/theme.ts` + skrip inline di `<head>`), tidak memakai `next-themes` | `next-themes` 0.4.6 terakhir rilis Mar 2025 dan memicu peringatan `<script>` di React 19; versi sendiri ±40 baris, tanpa kedipan tema, mengikuti OS bila belum ada pilihan |
| 4 | Token warna ditulis hex di `:root`/`.dark` (bukan oklch bawaan shadcn); palet gelap dirancang sendiri (latar `#0D1424`, primer `#8DA8FF`, sukses `#4CC38A`, perhatian `#F2A65A`) | Hex mudah dicocokkan dengan mockup dan dibaca tes kontras; mockup hanya memberi warna mode terang |
| 4 | Token tambahan: `success`, `warning`, `ink` (warna coretan), `font-hand` (Kalam), `--spacing-touch` = 44 px | Dibutuhkan status penilaian, contoh coretan, dan target sentuh tablet |
| 4 | Tes kontras `apps/web/lib/theme-contrast.test.ts` (WCAG AA 4,5:1 untuk 23 pasangan teks, 3:1 untuk batas input, di kedua tema); Vitest kini juga mencakup `apps/web/**/*.test.ts` dan skrip tes tiap paket memfilter foldernya sendiri | DoD kontras dijaga otomatis setiap kali palet diubah |
| 4 | Halaman contoh di `/tema`; beranda `/` diganti placeholder Coreta (halaman publik dibangun di Fase 19) | Halaman bawaan Next.js memakai font dan warna yang sudah dihapus |
| 5 | Toast memakai komponen `toast` Base UI dari registry `base-nova` (bukan `sonner`); `Toaster` dan `TooltipProvider` dipasang di root layout, toast dipanggil lewat `toast.add({ title, description, type })` | Tanpa dependensi tambahan dan tanpa `next-themes` (wrapper `sonner` shadcn bergantung padanya) |
| 5 | Ukuran Button dirombak: semua ukuran ≥ 44 px (`sm`/bawaan = `h-touch`, `lg` = 48 px, `icon`/`icon-sm` = 44×44, `icon-lg` = 48×48); ukuran `xs` dan `icon-xs` dihapus; teks bawaan 16 px | Aturan target sentuh tablet; tidak ada komponen yang memakai `xs` |
| 5 | Cincin fokus memakai warna `ring` penuh (bawaan shadcn 50%); Button menambah `ring-offset-2` | Cincin 50% nyaris tak terlihat di latar terang dan menyatu dengan tombol primer |
| 5 | Penyesuaian lain atas kode shadcn: Input `h-touch` dan teks 16 px di semua lebar (Safari iOS memperbesar input < 16 px); TabsTrigger `min-h-touch` dan teks tab tidak aktif `muted-foreground` (kontras ≥ 4,5:1); Progress 8 px; latar Dialog `black/40`; Badge varian `success` dan `warning`; ikon toast diberi warna token; label `Close` → `Tutup` | Target sentuh, kontras, dan teks antarmuka berbahasa Indonesia |
| 5 | `/dev/komponen` memanggil `notFound()` di luar mode development (build produksi menjawab 404) dan diberi `robots: noindex` | Galeri hanya alat pengembang |
| 6 | `KompetensiBar` diberi nama kode `CompetencyBar` (`components/domain/competency-bar.tsx`) | Aturan 10: nama kode berbahasa Inggris; galeri menulis keduanya agar mudah dicari |
| 6 | Tipe props domain (`Stage`, `WorksheetSummary`, `CompetencyMastery`, `StatSummary`, `Plan`, `SubscriptionStatus`) dan `MASTERY_THRESHOLD = 0.8` ada di `lib/domain.ts`, bukan di `lib/mock` | `lib/mock` akan dihapus setelah data terhubung; komponen dan kueri Supabase nanti memetakan ke tipe yang sama |
| 6 | Enam status langganan dipetakan ke kode `trialing`, `active`, `paused`, `past_due`, `canceled`, `expired` (label: Uji coba, Aktif, Dijeda, Menunggak, Dibatalkan, Berakhir) | Nilai kolom `subscriptions.status` yang diusulkan untuk Fase 33 |
| 6 | Harga tiruan semester Rp149.000 (coret Rp179.400) dan tahunan Rp249.000 (coret Rp358.800; diselaraskan dengan Fase 16, sebelumnya Rp269.000) | Harga coret = 6× dan 12× harga bulanan; **harga paket semester/tahunan belum diputuskan** |
| 6 | `lib/format.ts`: `formatRupiah` (gaya "Rp29.900", tanpa spasi) dan `formatPercent`, dengan tes | Dipakai PriceCard, StatCard, CompetencyBar, dan layar berikutnya |
| 6 | ESLint melarang `components/**` mengimpor `@/lib/mock`, `@/lib/supabase/*`, dan `next/headers` | Menjaga DoD "komponen hanya menerima props"; data dimuat di halaman |
| 6 | Tombol berbasis tautan memakai `<Button nativeButton={false} render={<Link href=… />}>` | Pola Base UI untuk merender `<a>` dengan gaya Button |
| 7 | Satu `AppShell` klien membaca pathname untuk status navigasi aktif; layout route group tetap berupa pembungkus server tipis. Pemilih peran dev mengarahkan `/?peran=` ke beranda peran, sedangkan produksi mengabaikannya | Navigasi aktif perlu mengikuti perpindahan App Router tanpa menduplikasi shell per peran; pemilih peran hanya alat pratinjau sebelum autentikasi tersedia |
| 7 | Berkas komponen bernama `app-shell.tsx` (bukan `AppShell.tsx`), plus `screen-placeholder.tsx` dan `lib/navigation.ts` (`navigationByRole`, `screenRouteSamples`) | Kebab-case konsisten dengan komponen lain; satu sumber navigasi untuk shell dan tes |
| 11 | `AnswerPanel` menjadi batas Client Component dengan state lokal per tipe; PG/PG kompleks/benar-salah memakai input native, sedangkan isian memakai pembacaan tiruan dan kartu konfirmasi tanpa penilaian | Menjaga kontrol dapat diakses dengan papan ketik dan sentuhan, mencegah state UI bocor ke halaman, serta mempertahankan aturan bahwa penilaian hanya ada di `packages/scoring` |
| 1–2 | Versi yang menyimpang dari bagian 2: TypeScript 5.9.3 (bukan 7.x, sesuai catatan bagian 2), React 19.2.8 (bukan 19.3), ESLint 9.39.5 (bukan 10) | Mengikuti scaffold Next.js 16.3.8 yang sudah berjalan dan paket yang tersedia di registry; belum ada plugin yang memerlukan versi lebih baru |
| 2 | CI menjalankan `pnpm build` setelah `pnpm test`; build diuji tanpa `.env.local` | Aturan `server-only` (DoD Fase 3) hanya tertangkap saat `next build`; validasi env bersifat malas sehingga build tidak butuh variabel |
| 2 | `.gitattributes` (`* text=auto eol=lf`) | Windows `core.autocrlf=true` menghasilkan CRLF yang membuat `prettier --check` gagal; repo dan CI memakai LF |
| 2 | `app/layout.tsx` memakai tipe `{ children: ReactNode }`, bukan `LayoutProps<"/">` | `LayoutProps` dibuat Next.js ke `.next/types` saat dev/build, sehingga `tsc --noEmit` gagal pada checkout baru (penyebab CI PR #1 merah). Diperbaiki di commit Fase 7 |
| 8 | Komponen peta disimpan sebagai `components/domain/path-map.tsx` (komponen `PathMap`), bukan `PathMap.tsx` seperti daftar berkas fase | Seluruh `components/domain` memakai nama berkas kebab-case sejak Fase 6 |
| 8 | `lib/mock/path.ts` tidak menyalin data: memakai ulang `stages`/`worksheets` (`mock/learning.ts`) dan `DAILY_GOAL`/`dailyActivity` (`mock/progress.ts`); "hari ini" tiruan = `2026-10-07`, hari terakhir yang punya data | Jalur belajar, kalender progres, dan `weeklyStats` menunjukkan angka yang sama (hari ini 6/6 soal, 2 hari beruntun) |
| 8 | Logika murni di `lib/learning-path.ts` dengan tes: `findCurrentStage` (tahap aktif, jika tidak ada tahap pertama yang belum tuntas), `countMastered`, `dailyTargetProgress` (dibatasi 0–1, aman terhadap angka negatif/target 0), `goalStreak` (hari ini yang belum selesai tidak memutus rangkaian kemarin) | Bisa diuji tanpa browser; kelak dipakai ulang saat data dari database (Fase 37/43) |
| 8 | Peta: `<ol>` daftar vertikal dengan garis penghubung di ponsel (hijau di antara tahap tuntas, abu-abu menuju tahap terkunci), grid 3×3 berbingkai kartu mulai `md`; tahap aktif `aria-current="step"`; tahap terbuka menautkan ke `/belajar/worksheet?tahap=N`, tahap terkunci bukan tautan | Sesuai scope "daftar vertikal di ponsel, grid di tablet"; parameter `tahap` disiapkan untuk filter tahap di Fase 9 |
| 8 | Komponen baru `DailyTargetCard` (target harian: angka x/target, bar progres, teks sisa soal, rangkaian hari) dan ditampilkan bersama `PathMap` di `/dev/komponen` | Aturan komponen §7: setiap komponen baru tampil di galeri |
| 8 | Tombol "Lanjut belajar" adalah `<Link>` biasa bergaya `buttonVariants({ size: "lg" })`, bukan `<Button nativeButton={false} render={<Link/>}>` | Pola Base UI itu menambahkan `role="button"` pada `<a>`, sehingga pembaca layar mengumumkan tautan navigasi sebagai tombol (lihat 9b) |
| 8 | Cabang kerja menggabungkan `feat/fase-10-ruang-kerja-layout` lebih dulu dan memakai Fase 7 versi cabang itu; Fase 7 paralel dari cabang `ccr-e3fb7679-1uu9fb` dibuang. Yang dipertahankan: `README.md` terformat dan `typecheck` web = `next typegen && tsc --noEmit` | Fase 10–31 sudah dibangun di atas Fase 7 versi itu; Fase 8 harus cocok dengan `AppShell` dan `navigation.ts` yang sama |
| 9 | Layar `/belajar/worksheet` dan `/belajar/hasil/[assignmentId]` sudah dibangun di cabang `feat/fase-10-ruang-kerja-layout` (grup Minggu ini/Ulang berjarak/Selesai, ringkasan skor, `ResultQuestion` dengan `<details>`); Fase 9 memverifikasi DoD dan menutup celah di bawah, bukan menulis ulang | Kode dan tesnya sudah sesuai scope; tracker belum diisi |
| 9 | Filter tahap di `/belajar/worksheet?tahap=N` (peta layar §5 "filter tahap"; tautan peta Fase 8): chip "Semua tahap" + tahap yang punya worksheet + tahap terpilih, `aria-current="page"`; nilai selain 0–8 diabaikan; tahap tanpa worksheet menampilkan `EmptyState` dengan tautan "Lihat semua worksheet". Halaman jadi dinamis (`ƒ`) karena membaca `searchParams` | Tanpa filter, tautan `?tahap=` dari peta tahap tidak berpengaruh dan Tahap 0 tidak punya tujuan yang jelas |
| 9 | `WorksheetSummary` mendapat field wajib `stageNumber` (diisi di `mock/learning.ts`); helper `parseStageFilter`, `stageFilterOptions`, `filterByStage`, `stageFilterHref` di `lib/mock/worksheets.ts` bersama helper yang sudah ada | Memfilter dari angka lebih aman daripada mengurai teks `stageName`; pindahkan helper ke `lib/` saat data dari database (Fase 37) |
| 9 | Aksi di `WorksheetCard` (dengan `aria-label` "Mulai: <judul>"), `EmptyState`, dan header halaman hasil kini `<Link className={buttonVariants()}>` | Menuntaskan temuan `role="button"` Fase 8 untuk layar Fase 9; label membedakan banyak tombol "Mulai"/"Lihat hasil" di satu halaman |
| 9 | Poin di lencana hasil memakai `formatNumber` (`lib/format.ts`, `id-ID`): "0,5/1", bukan "0.5/1"; judul keadaan kosong memakai spasi tak-putus di "Tahap N" | Gaya angka Indonesia; mencegah "0" tertinggal sendiri di baris baru pada ponsel |
| 32 | Prinsip 0001 diteruskan: klien (siswa, orang tua, admin) hanya punya hak SELECT di 8 tabel data belajar; semua penulisan lewat server/worker dengan `service_role` (attempts dan hints_shown oleh `/api/attempts`, ink_sessions oleh `/api/ink/complete`, hint_reports oleh `/api/hint-reports`, assignments/mastery/daily_activity/weekly_reports oleh worker). Satu-satunya tulis dari klien: siswa mengunggah berkas ke folder Storage miliknya | Skor tidak boleh berasal dari klien; spesifikasi Fase 38–44 memang menaruh semua penulisan di route handler dan worker |
| 32 | Kunci asing komposit `(…, student_id)`: attempts → assignments, ink_sessions/hints_shown/hint_reports → attempts, weekly_reports.sample_ink_id → ink_sessions; ink_sessions juga mengunci `item_id` ke butir percobaannya | Database sendiri menolak data siswa A yang ditempel ke penugasan, percobaan, atau coretan siswa B, walau server keliru |
| 32 | `attempts.id` dari klien tanpa default (kunci outbox Fase 40); tambahan `received_at` (waktu server) dan cek `submitted_at <= received_at + 5 menit`; `unique (assignment_id, item_id, try_no)`; `score numeric(5,4)` 0–1 | Kirim ulang = satu baris lewat `ON CONFLICT (id) DO NOTHING`; percobaan offline yang terlambat tetap diterima, jam perangkat yang maju ditolak |
| 32 | `mastery`: kunci `(student_id, competency_id)`; `tier` = tingkat tertinggi yang terbuka; kolom tambahan `revoked_at`, `review_step`, `updated_at` agar `MasteryState` di `packages/scoring` tersimpan utuh; cek `mastered_at` ⇔ `next_review_at` dan tuntas hanya di tingkat `ujian` | Mengikuti model penguasaan v1 (Fase 23); worker tidak bisa menyimpan state yang mustahil |
| 32 | `hint_reports`: `created_at` dan `due_at` (= +24 jam) diisi trigger dan tidak bisa diubah; satu laporan terbuka per percobaan (indeks unik parsial); `status = 'open'` ⇔ `reviewed_at` kosong; dibaca siswa pelapor dan admin saja | Hitung mundur SLA tidak bisa digeser; tombol "Laporkan" yang ditekan berkali-kali tidak memenuhi antrean |
| 32 | `hints_shown`: kolom tambahan `id`, `student_id`, `shown_at`; petunjuk `ai_ink` wajib punya `ai_decision_id`; kunci asingnya ke `ai_decisions` ditambahkan di 0004 | Aturan 3 (setiap keputusan AI tercatat); tabel `ai_decisions` baru ada di Fase 33 |
| 32 | `weekly_reports`: `week_start` wajib Senin, satu laporan per siswa per minggu, terbit wajib punya narasi dan `published_at`; orang tua hanya membaca yang `published`, admin membaca draf, siswa tidak membacanya lewat klien | Laporan ditulis untuk orang tua dan ditinjau dulu sebelum terbit |
| 32 | Bucket `ink` dibuat di migrasi (bukan `config.toml`): privat, maksimal 5 MB, MIME `application/gzip` dan `image/png`. Kebijakan: siswa INSERT hanya `{student_id}/{uuid}.json.gz\|png` di foldernya (tanpa subfolder); SELECT oleh pemilik, orang tuanya, atau admin lewat `can_read_student_folder(text)`; tanpa UPDATE/DELETE | Berlaku sama di lokal dan cloud; berkas coretan tidak bisa ditimpa atau dihapus dari klien |
| 32 | Fungsi bantu `current_student_id()` dan `can_read_student_folder(text)`: `security definer`, `search_path = ''`, tidak bisa dipanggil anon. Yang kedua menerima teks agar nama folder bukan UUID tidak memicu galat cast | Pola yang sama dengan `is_guardian_of` di 0001 |
| 32 | Verifikasi memakai harness lokal: PostgreSQL 16 + pgTAP 1.3.2 + tiruan minimal Supabase (peran `anon`/`authenticated`/`service_role`, hak default di `public`, `auth.users`, `auth.uid()`, `storage.buckets`/`storage.objects` ber-RLS, `storage.foldername`). Migrasi 0001–0003 dijalankan dari nol lalu `pg_prove` atas `supabase/tests` | Sandbox sesi ini tidak bisa menarik image Docker Supabase (CDN registry diblokir proxy, Docker Hub 429); lihat 9b |
| 33 | Klien hanya membaca: `plans` untuk siapa saja (termasuk anon, untuk `/harga`); `subscriptions`/`invoices` untuk orang tua pemilik dan admin; `conversations`/`messages` untuk pemilik dan admin; `notifications` untuk penerima; `crm_events`/`ai_decisions`/`audit_log` untuk admin saja. Satu-satunya tulis dari klien: `UPDATE notifications.read_at` oleh penerima (waktunya diisi trigger) | Uang, akses, dan isi chat agen hanya berubah lewat server (checkout, webhook, pekerjaan penagihan, `/api/support/chat`) yang tercatat di `audit_log` |
| 33 | `payment_events`: RLS aktif tanpa kebijakan dan tanpa hak tabel untuk anon/authenticated, termasuk admin; unik `(provider, provider_event_id)` untuk webhook idempoten | DoD "hanya bisa diakses server"; isi webhook mentah bisa memuat data pembayaran |
| 33 | `audit_log` hanya bisa ditambah: trigger menolak UPDATE, DELETE, dan TRUNCATE untuk semua peran (termasuk service_role dan superuser), hak UPDATE/DELETE/TRUNCATE dicabut dari service_role, `at` diisi trigger (tidak bisa dimundurkan); `actor_id` sengaja tanpa kunci asing; kolom tambahan `id` (identity) dan `details jsonb` | DoD "hanya bisa ditambah"; kunci asing ON DELETE SET NULL akan membutuhkan UPDATE yang dilarang, dan catatan audit harus bertahan setelah akun pelaku dihapus |
| 33 | `messages.tool_calls` tidak dibuka ke klien (hak SELECT per kolom); admin membaca jejak alat lewat server untuk `/admin/agen` | Jejak alat AI bisa memuat data akun dan keputusan pengembalian dana |
| 33 | `plans` diisi di migrasi: Bulanan Rp29.900; Semester Rp149.000 (coret Rp179.400); Tahunan Rp249.000 (coret Rp358.800), sama dengan `lib/mock/billing.ts` dan scope Fase 16; kolom tambahan `name` dan `sort_order`; cek harga coret > harga | Harga di tabel, bukan di kode. **Harga semester/tahunan masih sementara** (9a Fase 6): ubah barisnya, bukan migrasinya |
| 33 | `subscriptions`: satu langganan hidup per orang tua (indeks unik parsial untuk trialing/active/paused/past_due); `paused` ⇔ `paused_until`; `parent_id` dan `invoices.subscription_id` memakai ON DELETE RESTRICT. `invoices`: kolom tambahan `parent_id` (kunci asing komposit ke langganan), `number` unik, `refunded_at`; `paid_at` wajib untuk paid/refunded; `pdf_path` = `{subscription_id}/{invoice_id}.pdf` | Checkout ganda tidak membuat dua langganan; faktur tidak bisa ditagihkan ke orang tua lain; data keuangan tidak terhapus diam-diam bersama akun |
| 33 | `ai_decisions.subject_id` → `profiles` ON DELETE CASCADE; `model` terisi wajib disertai `prompt_version` (keputusan fallback tanpa AI boleh tanpa model). Kunci asing `hints_shown.ai_decision_id` → `ai_decisions` dibuat `DEFERRABLE INITIALLY DEFERRED` | Tes menemukan bahwa pemeriksaan langsung menggagalkan penghapusan akun siswa: cascade lewat profil menghapus keputusan AI sebelum cascade lewat penugasan menghapus petunjuknya. Diperiksa saat COMMIT, keduanya terhapus bersama; keputusan yang masih dirujuk tetap tidak bisa dihapus sendirian |
| 33 | Cek CI RLS statis di `packages/db/src/rls-check.ts`: memutar ulang semua migrasi (urut nama berkas) dan melaporkan tabel `public` yang berakhir tanpa RLS (menangani nama berkutip, tanpa skema, `if not exists`, `unlogged`, `drop`, `rename`, `disable`; mengabaikan tabel temporer, skema lain, komentar, string, dan isi fungsi). Langkah CI `pnpm --filter @coreta/db check:rls` sebelum `pnpm test`; `packages/db/turbo.json` menambah `$TURBO_ROOT$/supabase/migrations/**` ke inputs tes agar cache Turborepo tidak menyembunyikan migrasi baru | Tidak butuh Docker/Supabase di CI. Pemeriksaan di database nyata ada di pgTAP 0004 (tidak ada tabel `public` tanpa RLS) |
| 34 | Verifikasi database kini memakai Supabase CLI sungguhan di sandbox: Docker Hub bisa dipakai (`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`; registry ECR/GHCR tetap diblokir proxy). `supabase db reset` (Postgres 17.6) + `supabase test db` menggantikan harness Postgres 16 dari Fase 32–33 | Alat yang diminta DoD Fase 30–34; harness tiruan terbukti menyembunyikan dua perbedaan perilaku (lihat baris berikut) |
| 34 | Migrasi baru `0005_hak_service_role.sql`: SELECT/INSERT/UPDATE/DELETE untuk `service_role` di semua tabel 0001–0004, SELECT di view, dan hanya SELECT/INSERT di `audit_log`; tes `0005_hak_service_role.sql` memeriksa katalog sehingga tabel `public` baru tanpa hak `service_role` membuat tes gagal. Migrasi pgmq Fase 42 bergeser ke `0006_pgmq.sql` | Supabase tidak lagi memberi hak bawaan pada tabel baru (`auto_expose_new_tables` tidak aktif); `service_role` melewati RLS tetapi tetap butuh GRANT. Tanpa ini server tidak bisa membaca kunci jawaban atau menulis percobaan, pembayaran, dan audit. Aturan 5: perbaikan lewat migrasi baru, bukan mengubah 0001–0004 |
| 34 | Tes 0003: penghapusan langsung di `storage.objects` kini diharapkan DITOLAK (trigger `storage.protect_delete` Supabase), bukan "0 baris". Tes 0001–0004 mengosongkan data seed di awal transaksinya (dikembalikan oleh rollback) | Perilaku Storage asli; `supabase test db` berjalan di database yang sudah berisi seed |
| 34 | Sumber seed berupa JSON di `packages/content/seed/` (`curriculum.json`, `stimuli.json`, `items.json`, `families.json`); `pnpm --filter @coreta/content seed:sql` (skrip `scripts/import-seed.ts`, logika `src/seed-sql.ts`) memvalidasi semuanya (butir lewat `importItems`/`validateItem`, struktur lain lewat Zod, kode kompetensi, stimulus, siklus prasyarat, email/id kembar) lalu menulis `supabase/seed.sql`. Tes memastikan `seed.sql` yang di-commit sama dengan hasil generate (`packages/content/turbo.json` memasukkan `supabase/seed.sql` ke inputs tes) | Satu sumber kebenaran yang tervalidasi; `seed.sql` tidak bisa menyimpang diam-diam |
| 34 | Id baris seed deterministik `md5('coreta-seed:<jenis>:<kunci>')::uuid` (tahap, kompetensi, butir, stimulus, media); akun contoh memakai UUID tetap `5eed0000-0000-4000-8000-0000000000NN` | Fase berikutnya dan tes bisa merujuk baris seed secara stabil. Bukan UUID v7: ini data uji, bukan data aplikasi |
| 34 | Kurikulum seed: 9 tahap (nama dari layar jalur belajar; Tahap 8 `goal_scope = utbk`), 34 kompetensi `M<tahap>.<n>` (M3.1–M3.4 dari data tiruan), 34 prasyarat tanpa lingkaran, `exam_tags` per kompetensi | **Usulan, perlu ditinjau Youta**: TIP belum punya daftar kompetensi resmi |
| 34 | 40 butir: 8 butir mockup ruang kerja (`MAT-SMA-*-01..08`) berstatus `published`, 32 butir baru (`09..40`, mencakup Tahap 0–8, empat tipe jawaban, tiga tingkat, tata letak standar) berstatus `draft`. Delapan butir mockup disalin dari `lib/mock/workspace.ts` + `lib/mock/api.ts` dengan id opsi `a..e`/`r1..r4`, pembahasan baru, dan perbaikan petunjuk yang keliru: soal 5 (pernyataan AB = BA), soal 7 (pengecoh A, C, D), soal 8 (pengecoh A, C), soal 2 (B, C), soal 3 (B, D, E) | TIP: butir agent konten ditandai draft sampai ditinjau manusia. Butir mockup akan dilihat siswa, jadi petunjuknya harus benar |
| 34 | Tes konten menilai setiap butir seed lewat `@coreta/scoring`: jawaban sesuai kunci = skor 1, setiap pengecoh PG = skor 0 dan memunculkan petunjuknya, setiap jawaban setara isian = skor 1 | Lebih kuat dari `validateItem` saja: kunci, opsi, dan petunjuk terbukti konsisten dengan mesin penilai |
| 34 | Akun contoh (lokal saja): 1 admin, 3 keluarga (orang tua + siswa: Rina/Raka Wijaya, Budi/Sekar Santoso, Maya Putri/Dimas Putra), kata sandi bersama `coreta-lokal-123`; baris `auth.users` + `auth.identities`, profil dari trigger 0001, `students`, `guardianships` (versi persetujuan `persetujuan-v1-2026-10`), `consents` | Login email + kata sandi dengan GoTrue asli berhasil untuk admin, orang tua, dan siswa; kata sandi salah ditolak. Siswa masuk dengan kode + PIN baru ada di Fase 36 |
| 34 | `packages/db/src/types.ts` dihasilkan Supabase CLI 2.106 (`postgres-meta` v0.96.6) dari skema lokal; skrip `pnpm --filter @coreta/db gen:types` (`supabase gen types typescript --local --schema public` + Prettier). `@coreta/db` mengekspor `Database`, `Json`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`; ketiga klien Supabase di `apps/web/lib/supabase` bertipe `Database`; tes tingkat tipe (`database-types.test.ts`) menjaga `items_public` tanpa `answer_key`/`explanation`/`distractor_hints` | DoD "apps/web mengimpor tipe dari @coreta/db"; aturan 1 ikut dijaga compiler |
| 35 | Penjaga peran di `apps/web/proxy.ts` (Next.js 16 mengganti nama `middleware.ts`; berjalan di runtime Node.js). `lib/supabase/proxy.ts` menyegarkan cookie sesi lalu `getClaims()` (memverifikasi JWT, bukan `getSession`); peran dari `app_metadata.role` dengan aturan yang sama dengan trigger 0001 (tanpa peran = orang tua). Keputusan murni di `lib/auth/roles.ts`: `/belajar` dan `/bantuan` → siswa, `/ortu` → orang tua, `/admin` → admin; belum masuk → `/masuk?next=…`; peran lain → halaman awal perannya; sudah masuk di `/masuk`/`/daftar` → halaman awal; `/api` dan `/auth` hanya menyegarkan sesi. Tanpa konfigurasi Supabase, rute peran tertutup (gagal tertutup) | Nama berkas mengikuti Next.js terpasang (dokumen `proxy.md`). Peran di JWT cukup untuk pengalihan; data tetap dijaga RLS dan setiap route handler memeriksa sendiri |
| 35 | Migrasi `0006_persetujuan_versi.sql`: `consents.version` wajib (baris lama ditandai `tidak-tercatat`, cek tidak kosong); hak INSERT/UPDATE klien dan kebijakan `consents_insert_own`/`consents_update_own` dari 0001 dicabut; fungsi `record_consent()` (hanya `service_role`) menulis `consents` (upsert, `granted_at` tetap dicap trigger) dan `audit_log` (`consent.granted`/`consent.declined`, versi, sumber) dalam satu transaksi dan menolak akun bukan orang tua (`22023`). Tes 0001: dua asersi "orang tua boleh memberi/mencabut dari klien" menjadi NEGATIF; tes baru `0006_persetujuan_versi.sql` (24 asersi) | **Mengubah keputusan Fase 30** (orang tua menulis persetujuan langsung dari klien), perlu persetujuan Youta. Versi harus dari server, bukan isian klien, dan setiap perubahan persetujuan harus punya jejak audit. `consents` menyimpan keputusan terakhir per jenis; riwayatnya di `audit_log` |
| 35 | `POST /api/consent` `{ token?, type = data_anak \| riset, granted }`: tanpa token memakai sesi dan hanya peran orang tua; dengan token memakai orang tua di dalam token (tanpa perlu masuk). Origin harus sama dengan Host/X-Forwarded-Host (CSRF); galat basis data tidak dikirim ke klien; `Cache-Control: no-store` | Halaman `/persetujuan/[token]` dibuka dari email/pesan (peta layar 5) |
| 35 | Token tautan persetujuan tanpa tabel: `base64url(JSON {id orang tua, versi, kedaluwarsa 7 hari}).HMAC-SHA256`, kunci diturunkan HKDF dari `SUPABASE_SERVICE_ROLE_KEY` dengan label `consent-token:v1`, dibandingkan `timingSafeEqual`; token ditolak bila versi teks sudah berganti | Tanpa migrasi dan variabel lingkungan baru. Memutar kunci service role membatalkan semua tautan yang beredar |
| 35 | Teks persetujuan berversi di `lib/consent.ts` (`CONSENT_VERSION = persetujuan-v1-2026-10`, sama dengan seed, dijaga tes); teks yang sama tampil di `/daftar` dan `/persetujuan/[token]`. Setiap kali orang tua masuk (kata sandi, Google, tautan email), yang belum menyetujui versi berlaku diarahkan ke `/persetujuan/[token]` | Mengubah teks wajib menaikkan versi agar orang tua diminta menyetujui ulang |
| 35 | `/daftar` dan `/masuk` = halaman server tipis + formulir klien `useActionState` + server action. Skema Zod bersama klien/server (`lib/auth/schemas.ts`); kata sandi minimal 8 (`minimum_password_length` 6 → 8); nama, WhatsApp, dan target ujian (TKA/UTBK/keduanya) di `user_metadata` (tidak pernah untuk peran). Bagian "Profil Awal Siswa" (nama + kelas) diganti "Target Ujian Anak": akun anak dibuat di `/ortu/anak` (Fase 36) sesuai peta layar 5. Bila konfirmasi email aktif, email terdaftar dijawab sama seperti pendaftaran baru (tidak bisa ditebak). `/masuk`: satu pesan untuk email/kata sandi salah; `next` hanya jalur internal yang boleh dibuka peran itu (`landingAfterSignIn`); tab siswa sementara memakai email + kata sandi | Server memvalidasi ulang semua isian; tidak ada open redirect |
| 35 | Google (PKCE) lewat server action `signInWithOAuth` → `/auth/callback` (juga menerima `token_hash` tautan email). Tombol hanya muncul bila `AUTH_GOOGLE_ENABLED=true`; `[auth.external.google]` di `config.toml` mati secara bawaan, `additional_redirect_urls` = `/auth/callback` di 127.0.0.1:3000 dan localhost:3000. Keluar: `POST /auth/keluar` (303 ke `/masuk?keluar=1`), tombol Keluar di header siswa/orang tua dan sidebar admin | Tanpa kredensial Google, tombol mati lebih baik daripada mengarah ke galat. Keluar lewat POST agar tidak bisa dipicu tautan |
| 36 | Akun siswa hanya dengan **kode masuk + PIN** (pilihan "email" dari mockup tidak dibuat): pengguna Auth siswa memakai email buatan `siswa.<id>@siswa.coreta.invalid` (domain `.invalid` tidak bisa menerima email, jadi tidak bisa ditautkan ke Google), tanpa email asli anak | Minim data pribadi anak (UU PDP); DoD hanya meminta kode + PIN dan "tanpa login sosial". **Perlu konfirmasi Youta** karena peta layar menyebut "email atau kode masuk + PIN" |
| 36 | Kode masuk 8 karakter dari 31 huruf/angka (tanpa I, L, O, 0, 1), dibuat server secara acak, unik di `students.login_code` (cek bentuk di basis data), tampil sebagai `K7QM-3XPA`; diketik tanpa peduli huruf besar/kecil, spasi, atau tanda hubung. PIN 6 angka pilihan orang tua; PIN semua sama atau berurutan ditolak. Mockup lama (`RAKA-4821`, PIN 4 angka) diganti | Kode berawalan nama + 4 angka dan PIN 4 angka terlalu mudah ditebak (10⁴ × 10⁴); kode acak 31⁸ ≈ 8,5 × 10¹¹ dan PIN 10⁶ |
| 36 | Kata sandi Auth siswa = `pin1.` + HMAC-SHA256(`STUDENT_PIN_PEPPER`, `<id pengguna>:<PIN>`), dihitung di server (`packages/db/src/student-login.ts`, dipakai web dan generator seed). Variabel baru `STUDENT_PIN_PEPPER` (server saja, ≥ 16 karakter, dibaca terpisah dari `getServerEnv` agar fitur lain tetap jalan); lokal = `student_pin_pepper` di `families.json` | Kunci anon Supabase bersifat publik: tanpa pepper, siapa pun bisa mencoba sejuta PIN langsung ke Supabase Auth dan melewati pembatas aplikasi (diuji: PIN mentah ke GoTrue ditolak). Memutar pepper membatalkan semua PIN siswa |
| 36 | Migrasi `0007_akun_siswa.sql`: `students.login_code`; tabel `login_throttle` (RLS, tanpa akses klien) + `note_login_failure`/`login_locked_until`/`clear_login_failures`; `register_student()` (hanya service_role) menulis students + guardianships (versi persetujuan) + audit_log dalam satu transaksi dan menolak bila orang tua bukan orang tua, belum menyetujui versi berlaku, atau profilnya bukan siswa. Tes `0007_akun_siswa.sql` (36 asersi) | Pembuatan akun anak memeriksa persetujuan di basis data, bukan hanya di UI (temuan 9b Fase 35) |
| 36 | **Perbaikan trigger peran 0001** di 0007: `on_auth_user_role_changed` menyamakan `profiles.role` dengan `app_metadata.role` setiap kali peran di `app_metadata` berubah (user_metadata tetap diabaikan, peran tak dikenal = orang tua) | Supabase Auth `admin.createUser` membuat baris dulu lalu mengisi app_metadata dengan UPDATE, sehingga trigger INSERT 0001 memberi peran orang tua ke siswa/admin buatan server (seed lolos karena menulis SQL langsung). Peran di JWT dan di profil kini selalu sama |
| 36 | Masuk siswa (`/masuk/siswa` dan tab Siswa di `/masuk`): server mencari kode (service_role), menurunkan kata sandi, lalu `signInWithPassword` dengan klien cookie. Pesan sama untuk kode tak dikenal dan PIN salah. Penguncian: 5 PIN salah per kode dalam 15 menit → kode terkunci 15 menit (PIN benar pun ditolak); batas kasar 30 gagal per IP. Orang tua mengganti PIN membuka kunci. `/auth/callback` menolak dan mengakhiri sesi siswa (Google/tautan email) | Anak tidak perlu email; tebakan PIN dibatasi di server |
| 36 | `/ortu/anak` membaca anak dengan sesi orang tua (RLS). Buat akun dan ganti PIN lewat service_role di server action, dengan id orang tua SELALU dari sesi; ganti PIN memeriksa hubungan wali secara eksplisit. Ubah target harian/ujian memakai sesi orang tua sehingga RLS `students_update_guardian` memutuskan (anak orang lain = 0 baris = "Anak tidak ditemukan"). Kode masuk tampil setelah dibuat dan di kartu anak. Formulir dari `components/domain/create-student-form.tsx` (mockup) dipindah ke `app/(ortu)/ortu/anak/child-forms.tsx` dan berkas lamanya dihapus | Orang tua A tidak bisa melihat atau mengubah anak orang tua B, baik lewat RLS maupun lewat jalur service_role |
| 36 | Siswa seed kini masuk dengan kode + PIN (Raka `RAKA-4826`/`482913`, Sekar `SEKR-3957`/`573804`, Dimas `DMAS-7264`/`260795`), email Auth-nya `siswa.<id>@siswa.coreta.invalid`; masuk siswa dengan email + `coreta-lokal-123` (9a Fase 34) tidak berlaku lagi | DoD "siswa seed bisa masuk dengan kode + PIN" |
| 37 | Data siswa dibaca dengan **sesi siswa** (bukan service role) di `lib/queries/student.ts`, sehingga RLS yang menentukan: penugasan, penguasaan, dan aktivitas milik sendiri; soal hanya lewat `items_public`, `stimuli_public`, `media_assets_public`. Pemetaan baris → tipe tampilan dipisah ke `lib/queries/mappers.ts` (fungsi murni, dites tanpa basis data; field tambahan di baris tidak pernah ikut ke soal) | Aturan 1 dijaga oleh view dan oleh pemetaan; penugasan siswa lain atau worksheet yang belum terbit = 404 |
| 37 | Peta tahap: tahap tuntas bila semua kompetensinya punya `mastered_at`; tahap pertama yang belum tuntas aktif; sisanya terkunci; progres = kompetensi tuntas / jumlah kompetensi. Tahap ber-`goal_scope` lain disembunyikan (siswa TKA tidak melihat Tahap 8 khusus UTBK). Target harian = `students.daily_target`, hari ini = tanggal Asia/Jakarta dari `daily_activity` | Mengikuti aturan "tahap berikutnya terbuka setelah semua kompetensi tahap aktif tuntas" |
| 37 | Status worksheet diturunkan dari data: selesai = `assignments.completed_at`; sedang dikerjakan = ada percobaan; ulang berjarak = semua butirnya slot `ulang`; selain itu baru. Skor selesai = rata-rata percobaan pertama per butir; perkiraan waktu = 3 menit per soal | Tidak perlu kolom status baru; `completed_at` dan attempts diisi Fase 38 |
| 37 | **Penilaian ruang kerja pindah ke server**: server action `gradeWorksheet` (hanya peran siswa) membaca butir worksheet dengan sesi siswa (penugasan sendiri saja), membaca kunci dengan service role, lalu menilai dengan `@coreta/scoring`; ke browser hanya kembali skor dan petunjuk pengecoh. Belum menyimpan percobaan (Fase 38). Store ruang kerja kini menerima penilai lewat `initialize(id, soal, penilai)`; kunci tiruan (`lib/mock/api.ts`) hanya dipakai galeri dev dan tes, tidak lagi ikut ke halaman ruang kerja | Soal asli tanpa kunci tidak bisa dinilai di browser; aturan 1 dan 2 tetap terpenuhi |
| 37 | Seed baru `learning.json`: 2 worksheet terbit (8 butir mockup "Worksheet Minggu Ini" Tahap 3; "Ulang: Bilangan & Matriks" Tahap 1), 5 penugasan, penguasaan (Raka: Tahap 0–2 tuntas + M3.1–M3.2 → Tahap 3 aktif 40%; Sekar: Tahap 0–4 tuntas; Dimas: M0.1), aktivitas harian relatif terhadap hari reset (zona Asia/Jakarta). Validasi: worksheet hanya berisi butir published, worksheet/siswa/kompetensi harus ada, kompetensi tidak dicatat ganda | DoD "siswa seed melihat jalur dan worksheet dari database" |
| 37 | Id dari browser divalidasi dengan `uuidLike` (`lib/ids.ts`, bentuk 8-4-4-4-12), bukan `z.uuid()` yang memeriksa bit versi RFC dan menolak id seed md5 | Ditemukan e2e: penilaian penugasan seed gagal karena id md5 |

### 9b. Temuan & Isu

Catat bug, blocker, atau hal yang perlu dievaluasi. Jangan langsung dieksekusi — putuskan di akhir fase apakah masuk backlog atau diabaikan.

| Fase | Temuan | Prioritas (High/Med/Low) | Status |
|------|--------|--------------------------|--------|
| — | — | — | — |
| 4 | Ukuran tombol bawaan shadcn (`h-8` = 32 px, `icon` = 32 px) di bawah target sentuh 44 px; halaman contoh menimpanya dengan `h-touch`/`size-touch` | Med | Selesai di Fase 5 |
| 3 | Supabase lokal mengikat semua layanan ke `0.0.0.0` dan Studio tanpa autentikasi (peringatan CLI) — terjangkau dari jaringan yang sama | Low | Terbuka |
| 3 | Supabase CLI terpasang v2.106.0, tersedia v2.119.0 | Low | Terbuka |
| 2 | Workflow CI sudah dibuat dan seluruh langkah hijau lokal, tetapi belum diverifikasi pada PR karena remote GitHub privat belum terautentikasi di sesi ini | Med | Terbuka |
| 2 | PR #1 (cabang backup) merah di langkah Typecheck: `Cannot find name 'LayoutProps'` pada checkout baru. Sudah diperbaiki (lihat 9a); perlu CI hijau di GitHub untuk menutup Fase 2 | Med | Menunggu CI |
| 7 | `/` menjadi dinamis (`ƒ`) karena membaca `searchParams` untuk `?peran=`, termasuk di produksi; beranda publik (Fase 19) kehilangan render statis. Pindahkan pengalihan dev ke `proxy.ts` atau buat khusus dev | Med | Terbuka |
| 7 | Ruang kerja `/belajar/kerjakan/[id]` berada di layout siswa (header sticky + navigasi bawah fixed), bertentangan dengan aturan 9 (satu layar tanpa scroll). Dipindahkan ke route group `(workspace)` tanpa shell di Fase 10 | Med | Selesai di Fase 10 |
| 7 | Rute siswa, orang tua, dan admin belum dijaga peran (baru Fase 35); jangan deploy ke luar sebelum Fase 35 | Med | Selesai di Fase 35 (`proxy.ts`; menunggu persetujuan Youta) |
| 3 | `GET /api/health` publik dan tiap panggilan memakai `auth.admin.listUsers` dengan service role tanpa pembatasan laju; batasi atau ringankan sebelum Fase 45 | Low | Terbuka |
| 4 | `/tema` aktif di produksi (tidak di-gate seperti `/dev/komponen`) | Low | Terbuka |
| 1 | `scoringPlaceholder()` masih dipakai sebagai `data-scoring-status` di beranda publik; hapus di Fase 19/20 | Low | Terbuka |
| 1 | `@types/node` `^20` padahal `engines` meminta Node ≥ 22 | Low | Terbuka |
| 6 | Commit `0008782` memuat Fase 3–6 sekaligus (aturan: satu fase satu commit) | Low | Dicatat |
| 8 | Pola `<Button nativeButton={false} render={<Link href=… />}>` (keputusan Fase 6) merender `<a role="button">`; pembaca layar mengumumkan tautan navigasi sebagai tombol. Dipakai di banyak layar (mis. EmptyState, `/belajar/progres`). Fase 8 sudah memakai `<Link className={buttonVariants()}>` | Med | Sebagian: sudah diganti di `/belajar`, `WorksheetCard`, `EmptyState`, dan `/belajar/hasil` (Fase 8–9); layar lain menunggu fase perapian |
| 32 | Migrasi 0001–0003 dan 253 tes pgTAP baru diverifikasi di harness Postgres 16 dengan tiruan skema Supabase, belum dengan `supabase db reset && supabase test db` sungguhan (Postgres 17, layanan Storage asli). Jalankan keduanya di mesin lokal sebelum menyetujui Fase 30–32 | High | Selesai di Fase 34: `supabase db reset && supabase test db` (Postgres 17) lulus setelah perbaikan hak service_role (0005); CI masih hanya cek RLS statis |
| 32 | Menghapus akun siswa menghapus seluruh baris data belajarnya (cascade, dites), tetapi berkas di bucket `ink/{student_id}/` tidak ikut terhapus oleh database | Med | Terbuka (Fase 65: hapus objek Storage saat hapus data anak) |
| 32 | `ink_sessions` mewajibkan baris `attempts` sudah ada. Fase 39: panggil `/api/ink/complete` setelah `/api/attempts` (atau buat keduanya dalam satu transaksi server). Unggahan ulang dari antrean offline yang mendapat "sudah ada" harus dianggap berhasil (tidak ada upsert) | Med | Catatan untuk Fase 39–40 |
| 32 | `hints_shown.ai_decision_id` belum punya kunci asing karena `ai_decisions` dibuat di 0004 | Low | Selesai di Fase 33 (kunci asing deferred, lihat 9a) |
| 33 | Seperti Fase 32: migrasi 0001–0004 dan 359 tes pgTAP baru diverifikasi di harness Postgres 16, belum dengan `supabase db reset && supabase test db`. CI juga belum menjalankan pgTAP (hanya cek RLS statis); pertimbangkan job CI dengan Supabase CLI | High | Selesai di Fase 34: `supabase db reset && supabase test db` (Postgres 17) lulus setelah perbaikan hak service_role (0005); CI masih hanya cek RLS statis |
| 33 | Akun orang tua yang punya riwayat langganan tidak bisa dihapus (ON DELETE RESTRICT, dites). Fase 65 harus memutuskan: anonimkan atau simpan data keuangan sesuai kewajiban arsip, lalu hapus akun | Med | Terbuka (Fase 65) |
| 33 | `invoices.pdf_path` sudah divalidasi, tetapi bucket privat `invoices` beserta kebijakannya belum dibuat | Low | Terbuka (Fase 56) |
| 33 | Aturan "jeda maksimal 2 kali setahun" belum punya kolom penghitung di `subscriptions` | Low | Terbuka (Fase 53/57: hitung dari `audit_log` atau tambah kolom) |
| 34 | Harness Postgres 16 Fase 32–33 meniru hak bawaan lama dan tidak punya `storage.protect_delete`, sehingga menyembunyikan bug hak `service_role`. Sudah diperbaiki (0005) dan diverifikasi di Supabase asli | High | Selesai |
| 34 | Daftar 34 kompetensi, `exam_tags`, dan prasyarat seed adalah usulan agent; 32 butir draf perlu ditinjau manusia sebelum diterbitkan | Med | Terbuka (tinjauan Youta / Fase 62) |
| 34 | Pembungkus npm `supabase` 2.106 (`node_modules/.bin/supabase`) mengirim `gen types` ke jalur platform dan meminta token, walau `--local`; biner Go (`supabase-go`) atau CLI terpasang biasa berjalan normal | Low | Terbuka (pakai CLI global; perbarui CLI) |
| 34 | Media seed (`media-parabola-01`) tercatat di `media_assets`, tetapi berkasnya belum diunggah; skema konten punya `caption` teks sedangkan tabel punya `caption_path` (keterangan teks tidak tersimpan) | Low | Terbuka (Fase 62: unggah media dan putuskan kolom keterangan) |
| 34 | `seed.sql` memuat kata sandi contoh yang diketahui umum; hanya untuk `supabase db reset` lokal, jangan pernah dijalankan pada proyek cloud/produksi | Med | Catatan untuk Fase 45 |
| 35 | Uji e2e menemukan bug: cek CSRF `/api/consent` membandingkan Origin dengan `request.url`, padahal di `next start` isinya `localhost:3000`; semua permintaan sah dari `127.0.0.1:3000` ditolak 403, dan skenario "siswa ditolak 403" lulus karena alasan yang salah. Diperbaiki (bandingkan dengan Host/X-Forwarded-Host) + tes regresi; skenario e2e kini juga memeriksa isi pesan galat | High | Selesai |
| 35 | Relasi PostgREST `students` → `profiles` ambigu (lewat `profile_id` dan lewat `guardianships`) membuat `/persetujuan/[token]` galat 500; diperbaiki dengan `profiles!students_profile_id_fkey` | Med | Selesai |
| 35 | Orang tua yang MENOLAK persetujuan tetap bisa membuka `/ortu/*` (hanya diarahkan ke halaman persetujuan setiap kali masuk). Pembuatan akun anak di Fase 36 wajib memeriksa `hasCurrentConsent` di server sebelum membuat siswa | High | Selesai di Fase 36 (cek di server action dan di `register_student`; `/ortu/anak` menampilkan peringatan dan menonaktifkan formulir) |
| 35 | Google dan `/auth/callback` (kode PKCE dan `token_hash` email) belum diuji ujung-ke-ujung: butuh client id/secret Google dan email konfirmasi (lokal `enable_confirmations = false`). Jalur sesudahnya (`destinationAfterSignIn`) sudah teruji lewat masuk dengan kata sandi | Med | Terbuka (sebelum Fase 45) |
| 35 | Halaman `/belajar`, `/ortu/*`, `/admin/*` masih menampilkan data tiruan yang sama untuk semua akun; penjaga peran hanya membatasi siapa yang bisa membukanya | Med | Terbuka (Fase 36–37) |
| 35 | Pemilih peran dev (`?peran=`) kini dialihkan ke `/masuk` bila belum masuk dengan peran itu; pratinjau peran memakai akun seed (`coreta-lokal-123`) | Low | Catatan |
| 35 | WhatsApp dan target ujian orang tua ada di `user_metadata`, yang bisa diubah pengguna sendiri (`updateUser`). Bila server memakainya (Fase 36 target anak, Fase 61 CRM), salin ke tabel saat dibuat | Low | Terbuka (Fase 36/61) |
| 35 | Tautan persetujuan bisa dipakai siapa pun yang memegangnya selama 7 hari (seperti tautan verifikasi email); pengiriman tautan lewat email/WhatsApp belum ada. Reset kata sandi mandiri juga belum ada ("Lupa sandi?" meminta menghubungi admin) | Low | Terbuka (Fase 61 / backlog) |
| 36 | Trigger `handle_new_user` (0001) memberi peran orang tua ke akun siswa/admin yang dibuat lewat `admin.createUser`, karena peran diisi sesudah INSERT. Ditemukan saat e2e; diperbaiki di 0007 (trigger sinkron peran) dan dites | High | Selesai |
| 36 | Setelah server menolak isian (mis. PIN lemah), React 19 mengosongkan formulir: nama anak hilang, dan kode masuk anak hilang setelah PIN salah. Diperbaiki: isian bukan rahasia dikirim balik dan formulir dipasang ulang; PIN tidak pernah dikirim balik | Med | Selesai |
| 36 | Batas per IP membaca `x-real-ip`/`x-forwarded-for`, yang bisa dipalsukan bila proxy di depan aplikasi tidak menimpanya. Batas per kode tetap berlaku | Med | Terbuka (Fase 45/64: proxy VPS menimpa header) |
| 36 | `STUDENT_PIN_PEPPER` wajib diisi di produksi dengan nilai berbeda dari lokal; memutarnya membatalkan semua PIN siswa (orang tua harus mengganti PIN) | Med | Catatan untuk Fase 45 |
| 36 | Belum ada "ganti kode masuk" (hanya ganti PIN), dan `login_throttle` menyimpan baris untuk kode tak dikenal tanpa pembersihan berkala | Low | Terbuka (backlog / pekerjaan worker) |
| 36 | Pilihan masuk siswa dengan email tidak dibuat (lihat 9a); bila Youta menginginkannya, perlu jalur kata sandi biasa dan penolakan login sosial yang sama | Low | Menunggu keputusan Youta |
| 37 | Lencana skor ruang kerja menampilkan `Math.round(overallScore)%` padahal skor bernilai 0–1 (selalu "0%" atau "1%"; ambang warna 70 juga salah). Diperbaiki menjadi persen dan dites | Med | Selesai |
| 37 | Penilaian penugasan seed gagal karena `z.uuid()` menolak id md5 (ditemukan e2e). Diperbaiki dengan `uuidLike` | Med | Selesai |
| 37 | Penilaian belum disimpan: memuat ulang ruang kerja lalu mengirim lagi memberi umpan balik baru tanpa batas percobaan; halaman hasil `/belajar/hasil/[id]` masih data tiruan, jadi "Lihat Hasil" untuk penugasan asli kembali ke daftar worksheet, dan dialog kirim menyebut "pembahasan akan dibuka" padahal pembahasan belum tampil | Med | Terbuka (Fase 38: simpan attempts, try_no, `completed_at`, halaman hasil) |
| 37 | Berkas media seed belum diunggah ke Storage, jadi soal bermedia menampilkan ilustrasi cadangan; URL bertanda tangan untuk media privat belum ada | Low | Terbuka (Fase 62 / unggah media) |
| 37 | Penugasan demo ruang kerja (`demo-assignment`, `demo-bacaan-panjang`, `demo-tempel`) tidak lagi terbuka lewat rute (404); hanya dipakai tes dan galeri `/dev/komponen`. `screenRouteSamples` masih memuat id demo itu | Low | Catatan (perbarui contoh rute saat skrip tangkapan layar dipakai lagi) |
| 37 | `/belajar/progres` masih memakai data tiruan (di luar cakupan Fase 37) | Low | Terbuka |

**Pertanyaan terbuka sebelum fase terkait:**
- Sebelum Fase 45 (deploy): spesifikasi VPS (CPU, RAM, disk) dan tagihan bulanan
- Sebelum Fase 55 (penyedia nyata): jawaban Order Hero atau keputusan memakai Midtrans
- Sebelum Fase 65 (privasi): masa simpan coretan mentah (usulan 24 bulan) dan tinjauan konsultan hukum
- Sebelum Fase 48 (petunjuk AI): model yang dipakai, diputuskan dari hasil `pnpm eval` di Fase 47
- Sebelum membuka pilot (Fase 45): persetujuan orang tua (Fase 35) sudah aktif; unduh/hapus data otomatis baru ada di Fase 65, jadi selama pilot ditangani manual oleh admin

### 9c. Progress Tracker

| Fase | Status | Estimasi Waktu | Tanggal Selesai | Catatan |
|------|--------|----------------|-----------------|---------|
| Fase 0 — Buat Proyek Next.js & Verifikasi | Selesai | ~15 menit | 2026-10-05 | Next.js 16.3.8; install, lint, build, dan GET `/` (200) sukses |
| Fase 1 — Monorepo & Struktur Folder | Selesai | ~30 menit | 2026-10-05 | 7 workspace strict; install, typecheck, lint, Turbo build, dan worker dev sukses |
| Fase 2 — Lint, Format, Tes Dasar & CI | Sedang | ~30 menit | — | Implementasi lokal hijau; PR #1 sempat merah karena `LayoutProps` (sudah diperbaiki), langkah `pnpm build` dan `.gitattributes` ditambahkan; menunggu CI hijau di GitHub |
| Fase 3 — Supabase Lokal & Klien | Selesai | ~30 menit | 2026-10-05 | Supabase lokal (port 544xx) berjalan; `/api/health` 200 `{ ok: true, supabase: 'up' }` dan 503 saat Auth dijeda; impor `admin.ts` dari komponen klien membuat build gagal (`server-only`); lint, typecheck, test, format hijau |
| Fase 4 — Tema & Token Desain | Selesai | ~30 menit | 2026-10-05 | `/tema` menampilkan palet, tipografi (Plus Jakarta Sans, Kalam), tombol, dan target sentuh 44 px; tombol tema 44×44 berfungsi dan tersimpan; kontras 50/50 tes lulus; konsol browser bersih (Playwright, Chromium); build, lint, typecheck, format hijau |
| Fase 5 — Komponen Dasar UI | Selesai | ~30 menit | 2026-10-05 | 10 komponen (Button, Card, Badge, Input, Tabs, Progress, Dialog, Toast, Tooltip, Skeleton) tampil di `/dev/komponen` pada kedua tema; 31 elemen interaktif galeri ≥ 44 px; fokus Tab terlihat; dialog, toast, tooltip diuji di Chromium tanpa galat konsol; produksi `/dev/komponen` = 404 |
| Fase 6 — Komponen Domain (Tanpa Logika) | Selesai | ~30 menit | 2026-10-05 | 8 komponen (PageHeader, PathNode, StatCard, CompetencyBar, WorksheetCard, SubscriptionBadge, PriceCard, EmptyState) tampil di `/dev/komponen#domain` dengan data `lib/mock` pada kedua tema; tautan/tombol ≥ 44 px; konsol bersih; tidak ada akses data di `components/domain` (dijaga ESLint); 60 tes web lulus; build hijau |
| Fase 7 — Layout & Navigasi per Peran | Selesai | ~30 menit | 2026-10-06 | 4 route group dan 24 layar placeholder tersedia; siswa/orang tua memakai bottom nav, admin memakai sidebar adaptif; `?peran=` aktif hanya saat dev; seluruh rute HTTP 200, 64 tes web dan build hijau; visual diverifikasi pada ponsel 375 px, tablet tegak 768 px, dan tablet mendatar 1180 px |
| Fase 8 — UI Jalur Belajar | Selesai | ~30 menit | 2026-10-09 | `/belajar`: kartu "Sedang dipelajari" (Tahap 3, 40%, worksheet berikutnya), kartu target harian (6/6, 2 hari beruntun), peta 9 tahap (3 tuntas, 1 aktif, 5 terkunci) vertikal bergaris di ponsel dan grid 3×3 di tablet; "Lanjut belajar" → `/belajar/worksheet` (diklik di Chromium pada 1024×768, 768×1024, 390×844); tanpa scroll horizontal, semua target ≥ 44 px, konsol bersih di tema terang dan gelap; 27 tes baru (logika jalur, PathMap, DailyTargetCard, halaman); format, lint, typecheck, 598 tes, build hijau |
| Fase 9 — UI Daftar Worksheet & Hasil | Selesai | ~30 menit | 2026-10-10 | Layar dari cabang Fase 10 diverifikasi dan dilengkapi: filter `?tahap=N` (peta Fase 8 → Tahap 3 = 2 kartu; Tahap 0 = keadaan kosong), alur daftar → hasil → buka pembahasan → kembali diuji klik di Chromium; 8 pembahasan terlipat bawaan dan terbuka saat diketuk; hasil tak dikenal = 404; tanpa scroll horizontal, target ≥ 44 px pada 1024×768, 768×1024, 390×844 di tema terang/gelap; aksi kartu/hasil kini tautan (bukan `role="button"`), poin "0,5/1"; 27 tes baru; format, lint, typecheck, 625 tes, build hijau |
| Fase 10 — UI Ruang Kerja: Tata Letak Satu Layar | Selesai | ~30 menit | 2026-10-07 | Rute `/belajar/kerjakan/[assignmentId]` memakai route group `(workspace)` tanpa shell; tinggi 100dvh dan overflow hidden di 1180×820, 820×1180, dan 390×844 tanpa scroll; 3 mode tata letak (standar, media, bacaan) tampil interaktif; panel bacaan satu-satunya scroll internal; 88 tes unit, typecheck, lint, dan build hijau |
| Fase 11 — UI Panel Jawaban | Selesai | ~30 menit | 2026-10-07 | Empat tipe jawaban tersedia dengan state lokal dan target sentuh 44 px; galeri dev merender seluruh tipe; 80 tes web, lint, typecheck, dan build hijau. Otomasi screenshot lokal gagal di lingkungan browser, sehingga pemeriksaan visual manual tetap disarankan |
| Fase 12 — UI Panel Media | Selesai | ~30 menit | 2026-10-07 | MediaPanel mendukung gambar/diagram (zoom + lightbox), tabel terstruktur KaTeX 0.19, audio dengan transkrip lipat, video dengan takarir terintegrasi; 187 tes hijau, lint dan build sukses. |
| Fase 13 — UI Bacaan Panjang & Jendela Melayang | — | ~30 menit | — | — |
| Fase 14 — UI Progres Siswa & Bantuan | — | ~30 menit | — | — |
| Fase 15 — UI Orang Tua: Laporan & Profil Anak | — | ~30 menit | — | — |
| Fase 16 — UI Orang Tua: Langganan, Harga & Faktur | — | ~30 menit | — | — |
| Fase 17 — UI Admin: Antrean & Pekerjaan Gagal | — | ~30 menit | — | — |
| Fase 18 — UI Admin: Konten, Editor Butir & Rilis | — | ~30 menit | — | — |
| Fase 19 — UI Halaman Publik | Selesai | ~30 menit | 2026-10-07 | Halaman jual lengkap (hero, manfaat, cara kerja, stimulus media highlight, FAQ accordion, CTA harga & daftar), halaman masuk (tab peran ortu/siswa), pendaftaran akun + profil anak dengan banner trial, dan persetujuan orang tua (UU PDP/COPPA) dengan konfirmasi tolak/setuju; validasi form sisi klien; 225 tes hijau, build dan lint sukses. |
| Fase 20 — Penilaian: Pilihan Ganda & Benar-Salah | Selesai | ~30 menit | 2026-10-07 | Tipe Item, Answer, ScoreResult di `@coreta/scoring`; fungsi murni `scorePg`, `scoreBs`, `scoreItem` dengan pengembalian petunjuk pengecoh; fungsi tanpa efek samping (clock/net/random); tes unit lulus |
| Fase 21 — Penilaian: PG Kompleks | Selesai | ~30 menit | 2026-10-07 | Fungsi murni `scorePgk` dengan rasio benar/kunci, pilihan salah tidak mengurangi; aturan pengaman centang semua menghasilkan skor 0 dan petunjuk peringatan; tes unit lengkap lulus |
| Fase 22 — Penilaian: Isian & Normalisasi | Selesai | ~30 menit | 2026-10-07 | Fungsi `normalizeAnswer` dan `scoreIsian` menangani pemisah ribuan, desimal koma/titik, pecahan, persen, kata ribu/juta, satuan terdaftar, dan toleransi numerik; 98 kasus tes lulus |
| Fase 23 — Model Penguasaan v1 | Selesai | ~30 menit | 2026-10-07 | `computeMastery`, `applyReview`, `isReviewDue`; hanya percobaan pertama tiap butir yang dihitung; ambang unlock 70%/5 dan tuntas 80%/8; pencabutan <60%; jadwal ulang berjarak 3, 7, 14, 30 hari; tes unit lulus |
| Fase 24 — Komposisi Worksheet Mingguan | Selesai | ~30 menit | 2026-10-07 | Fungsi `composeWorksheet` menyusun 8 soal unik: 4 baru + 2 adaptif (skor terlemah) + 2 ulang berjarak jatuh tempo; slot kosong dialihkan ke soal baru; deduplikasi penuh; tes unit lulus |
| Fase 25 — Mesin Tinta Dasar | Selesai | ~30 menit | 2026-10-07 | Kelas InkEngine pada canvas murni menggunakan Pointer Events dan perfect-freehand; pena sensitif tekanan, penghapus, undo/redo, penolakan telapak tangan (PalmGuard); pembungkus React InkCanvas; tes unit lengkap lulus |
| Fase 26 — Format Coreta Ink v1 | Selesai | ~30 menit | 2026-10-07 | Tipe CoretaInkDocumentV1; serialize gzip (fflate) dan deserialize mendukung format lama; penghapusan tersimpan sebagai event; renderPng murni menghasilkan PNG preview dengan lebar maks 1024 px; tes unit lengkap lulus |
| Fase 27 — Lapisan Tempel (Paste-to-Ink) | — | ~30 menit | — | — |
| Fase 28 — State Ruang Kerja | Selesai | ~30 menit | 2026-10-07 | Store Zustand (apps/web/lib/workspace-store.ts); navigasi 8 soal; dukungan 4 tipe jawaban (PG, PGK, BS, Isian); retensi coretan digital antar soal; timer pengerjaan; integrasi penilaian mock @coreta/scoring dengan petunjuk pengecoh; tes unit 22 files / 252 tests lulus |
| Fase 29 — Validator Konten | — | ~30 menit | — | — |
| Fase 30 — Migrasi 1: Akun & Keluarga | Sedang | ~30 menit | — | Menunggu persetujuan Youta. 2026-10-10: `supabase db reset` + `supabase test db` (Postgres 17) lulus, termasuk dengan data seed; hak `service_role` ditambahkan di 0005 (Fase 34) |
| Fase 31 — Migrasi 2: Kurikulum & Konten | Sedang | ~30 menit | — | Menunggu persetujuan Youta. 2026-10-10: `supabase db reset` + `supabase test db` (Postgres 17) lulus, termasuk dengan data seed; hak `service_role` ditambahkan di 0005 (Fase 34) |
| Fase 32 — Migrasi 3: Data Belajar | Sedang | ~30 menit | — | Menunggu persetujuan Youta. `0003_belajar.sql` (8 tabel, bucket privat `ink`, 2 fungsi bantu, 1 trigger) dan `0003_rls_belajar.sql` (122 asersi): siswa tidak bisa menulis `mastery`/`daily_activity`/skor, orang tua hanya membaca data anaknya (draf laporan tidak), siswa hanya mengunggah ke foldernya, id percobaan ganda = satu baris. Semua 253 tes 0001–0003 lulus di harness Postgres 16; 3 uji mutasi (siswa boleh tulis mastery, cek folder unggahan dihapus, orang tua baca draf) masing-masing tertangkap tes. Fase 34: lulus di `supabase test db` (Postgres 17) setelah hak `service_role` (0005) dan penyesuaian tes Storage |
| Fase 33 — Migrasi 4: Langganan, Layanan & Audit | Sedang | ~30 menit | — | Menunggu persetujuan Youta. `0004_langganan_layanan.sql` (10 tabel, data `plans`, 3 trigger, kunci asing `hints_shown.ai_decision_id`) dan `0004_rls_langganan.sql` (106 asersi): `payment_events` tertutup untuk semua klien termasuk admin, `audit_log` hanya bisa ditambah bahkan oleh service_role dan superuser, webhook ganda = satu baris, orang tua hanya membaca langganan dan fakturnya, `tool_calls` tidak terbaca klien, tidak ada tabel `public` tanpa RLS. Semua 359 tes 0001–0004 lulus di harness Postgres 16; 3 uji mutasi (admin baca payment_events, trigger append-only dihapus, tool_calls dibuka) masing-masing tertangkap. Cek CI RLS statis (22 tes) terbukti menggagalkan migrasi uji berisi tabel tanpa RLS. Format, lint, typecheck, tes (647), build hijau. Fase 34: lulus di `supabase test db` (Postgres 17) setelah hak `service_role` (0005) |
| Fase 34 — Seed Data & Tipe TypeScript | Selesai | ~30 menit | 2026-10-10 | `supabase db reset` (Supabase CLI 2.106, Postgres 17) memuat seed tanpa galat: 9 tahap, 34 kompetensi, 34 prasyarat, 40 butir (8 terbit, 32 draf), 1 stimulus, 1 media, 7 akun (1 admin, 3 orang tua, 3 siswa) yang bisa login lewat GoTrue asli; siswa seed melihat 8 butir lewat `items_public` dan ditolak membaca `items`. Semua 40 butir lolos `validateItem` dan uji silang `@coreta/scoring`. `types.ts` dari `supabase gen types`; `apps/web` memakai `Database` di ketiga klien Supabase tanpa galat TypeScript. Ditemukan dan diperbaiki: hak `service_role` (migrasi 0005). `supabase test db`: 5 berkas, 365 asersi lulus dengan seed termuat. Format, lint, typecheck, cek RLS, 773 tes, build hijau |
| Fase 35 — Autentikasi Orang Tua & Penjaga Peran | Sedang | ~30 menit | — | Menunggu persetujuan Youta. `proxy.ts` + `/masuk`, `/daftar`, `/persetujuan/[token]`, `POST /api/consent`, `/auth/callback`, `/auth/keluar`; migrasi `0006_persetujuan_versi.sql` (versi wajib, tulis persetujuan hanya lewat server, `record_consent` + audit). E2E Chromium di `next start` + Supabase lokal asli: 36/36 skenario lulus (orang tua daftar → `/ortu/anak` dengan persetujuan + versi + audit, keluar, masuk kembali ke `next`; siswa, orang tua, admin, dan tamu ditolak dari rute peran lain; kata sandi salah; open redirect; token palsu; orang tua tanpa persetujuan → setujui/tolak lewat token). `supabase test db`: 6 berkas, 389 asersi lulus; 2 uji mutasi (hak tulis klien dikembalikan, peran salah diizinkan) tertangkap. Format, lint, typecheck, cek RLS, 822 tes, build hijau. Google belum diuji (lihat 9b) |
| Fase 36 — Akun Siswa dari Orang Tua | Sedang | ~30 menit | — | Menunggu persetujuan Youta. `/ortu/anak` membuat akun siswa (kode masuk acak + PIN 6 angka) lewat service_role, mengubah target harian/ujian lewat RLS, dan mengganti PIN; `/masuk/siswa` + tab Siswa memakai kode + PIN dengan penguncian. Migrasi `0007_akun_siswa.sql` (kode masuk, `login_throttle`, `register_student`, perbaikan trigger peran 0001). E2E Chromium di `next start` + Supabase lokal asli: 27/27 skenario lulus (3 siswa seed dan siswa baru masuk dengan kode + PIN; PIN mentah ke Supabase Auth ditolak; orang tua 2 tidak melihat dan gagal mengubah target/PIN anak orang tua 1 walau memalsukan id; penguncian 5 kali; orang tua tanpa persetujuan ditolak server), e2e Fase 35 tetap 36/36. `supabase test db`: 7 berkas, 425 asersi. 2 uji mutasi tertangkap (cek persetujuan di `register_student` oleh pgTAP; cek hubungan wali saat ganti PIN oleh e2e dan tes unit). Format, lint, typecheck, cek RLS, 859 tes, build hijau |
| Fase 37 — Jalur & Worksheet dari Database | Selesai | ~30 menit | 2026-10-10 | `/belajar`, `/belajar/worksheet`, dan ruang kerja membaca Supabase dengan sesi siswa (RLS); soal lewat `items_public`; data tiruan tidak lagi dipakai ketiga layar ini. Penilaian pindah ke server action (`@coreta/scoring`, kunci hanya di server). Seed baru: 2 worksheet, 5 penugasan, penguasaan, aktivitas. E2E Chromium di `next start` + Supabase lokal asli: 16/16 lulus (jalur Raka 3/9 tahap + Tahap 3 40% + target 6/6 + 4 hari beruntun; Sekar 5/9; Dimas TKA 0/8 tanpa Tahap 8; daftar + filter tahap; ruang kerja memuat 8 soal asli; 34 respons halaman tanpa kunci/petunjuk/pembahasan; kirim → dinilai server, respons hanya skor + petunjuk; penugasan siswa lain dan id tiruan = 404), e2e Fase 35 (36/36) dan 36 (27/27) tetap lulus. Ditemukan dan diperbaiki: lencana skor salah skala, `z.uuid()` menolak id seed. Uji mutasi (opsi mentah ikut ke soal) tertangkap. `supabase test db` 425 asersi. Format, lint, typecheck, cek RLS, 890 tes, build hijau |
| Fase 38 — API Kirim Jawaban | — | ~30 menit | — | — |
| Fase 39 — Unggah Coretan | — | ~30 menit | — | — |
| Fase 40 — Offline: Antrean Keluar | — | ~30 menit | — | — |
| Fase 41 — PWA (Service Worker & Manifest) | — | ~30 menit | — | — |
| Fase 42 — Worker & Pekerjaan mastery.update | — | ~30 menit | — | — |
| Fase 43 — Hasil, Progres & Pembahasan dari Database | — | ~30 menit | — | — |
| Fase 44 — Laporan Petunjuk & Antrean Admin | — | ~30 menit | — | — |
| Fase 45 — Deploy ke VPS (Docker, Caddy) | — | ~30 menit | — | — |
| Fase 46 — Adapter AI, Prompt Berversi & Pagar Biaya | — | ~30 menit | — | — |
| Fase 47 — Set Evaluasi AI | — | ~30 menit | — | — |
| Fase 48 — Petunjuk dari Coretan (ink.analyze) | — | ~30 menit | — | — |
| Fase 49 — Pembaca Tulisan Isian | — | ~30 menit | — | — |
| Fase 50 — Susun & Terbitkan Worksheet Otomatis | — | ~30 menit | — | — |
| Fase 51 — Laporan Mingguan: Metrik & Penulis | — | ~30 menit | — | — |
| Fase 52 — Laporan Orang Tua dari Database & Notifikasi | — | ~30 menit | — | — |
| Fase 53 — Logika Langganan (Mesin Status) | — | ~30 menit | — | — |
| Fase 54 — Antarmuka Pembayaran, Checkout & Webhook | — | ~30 menit | — | — |
| Fase 55 — Adapter Penyedia Nyata & Rekonsiliasi | — | ~30 menit | — | — |
| Fase 56 — Pekerjaan Penagihan & Faktur PDF | — | ~30 menit | — | — |
| Fase 57 — Halaman Langganan & Faktur Terhubung | — | ~30 menit | — | — |
| Fase 58 — Asisten Layanan Tingkat 1: Chat & Alat Baca | — | ~30 menit | — | — |
| Fase 59 — Asisten Tingkat 1: Alat Tindakan & Eskalasi | — | ~30 menit | — | — |
| Fase 60 — AI Agent Tingkat 2 & Pengembalian Dana | — | ~30 menit | — | — |
| Fase 61 — CRM: Pemindaian Sinyal, Notifikasi & Web Push | — | ~30 menit | — | — |
| Fase 62 — Admin: Editor Butir & Penerbitan | — | ~30 menit | — | — |
| Fase 63 — Admin: Rilis, Pengguna, Pekerjaan Gagal & Log Agen | — | ~30 menit | — | — |
| Fase 64 — Keamanan Aplikasi | — | ~30 menit | — | — |
| Fase 65 — Privasi Data Anak | — | ~30 menit | — | — |
| Fase 66 — E2E: Alur Siswa & Offline | — | ~30 menit | — | — |
| Fase 67 — E2E: Orang Tua, Admin & Visual | — | ~30 menit | — | — |
| Fase 68 — Pemantauan & Analitik | — | ~30 menit | — | — |
| Fase 69 — Polish: Aksesibilitas, Status Kosong & Teks | — | ~30 menit | — | — |
| Fase 70 — Polish: Uji Perangkat Nyata & Performa | — | ~30 menit | — | — |

Total estimasi: ~35 jam kerja prompting + testing (di luar waktu tinjau dan pilot).
