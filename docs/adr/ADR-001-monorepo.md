# ADR-001: Struktur Monorepo

- **Status**: Diterima
- **Tanggal**: 2026-10-05

## Konteks

Coreta terdiri dari aplikasi web, worker latar belakang, dan beberapa domain yang harus berbagi tipe serta logika tanpa menduplikasi implementasi. Proyek juga memerlukan perintah build dan pemeriksaan tipe yang konsisten dari root repository.

## Keputusan

Gunakan pnpm workspace dan Turborepo dengan pembagian berikut:

- `apps/web` untuk aplikasi Next.js dan route handler.
- `apps/worker` untuk pekerjaan latar belakang berbasis Node.js.
- `packages/scoring`, `packages/ink`, `packages/ai`, `packages/db`, dan `packages/content` untuk logika domain yang dapat digunakan ulang.

Package internal menggunakan namespace `@coreta/*`, mengekspor source TypeScript, dan dibangun dengan konfigurasi strict bersama dari `tsconfig.base.json`. Dependency antar-workspace wajib dideklarasikan dengan `workspace:*`. Turborepo menjalankan task berdasarkan dependency graph dan menyimpan cache output build.

Komponen UI tetap berada di `apps/web/components`; package UI terpisah baru dibuat jika aplikasi kedua benar-benar membutuhkannya.

## Konsekuensi

- Batas domain dan kepemilikan kode terlihat jelas.
- Aplikasi web dan worker dapat memakai implementasi yang sama tanpa copy-paste.
- Setiap package harus mendeklarasikan dependency internal secara eksplisit.
- Perubahan konfigurasi build bersama dapat berdampak pada seluruh workspace dan harus diverifikasi dari root.
