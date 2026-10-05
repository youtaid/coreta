# Coreta Agent Rules

Aturan berikut wajib dipatuhi di seluruh implementasi Coreta:

1. Kunci jawaban dan petunjuk tidak pernah dikirim ke browser sebelum jawaban dikumpulkan; siswa membaca butir lewat view `items_public`.
2. Penilaian hanya di `packages/scoring` sebagai fungsi murni. Logika penilaian tidak boleh diduplikasi di komponen.
3. AI tidak pernah menentukan nilai. Setiap panggilan AI lewat `packages/ai`, keluarannya divalidasi dengan Zod, dicatat di `ai_decisions`, dan memiliki fallback tanpa AI.
4. Setiap tabel wajib mengaktifkan RLS dan memiliki tes RLS positif serta negatif.
5. Migrasi lama tidak pernah diubah; setiap perubahan skema dibuat sebagai berkas migrasi baru.
6. `attempt_id` dibuat di klien menggunakan UUID v7; pengiriman ulang tidak boleh menggandakan data.
7. Kunci `service_role` hanya tersedia di server dan worker, tidak pernah dalam variabel `NEXT_PUBLIC_*`.
8. Untuk PG kompleks, skor adalah jumlah pilihan benar yang dicentang dibagi jumlah kunci; pilihan salah tidak mengurangi skor; mencentang semua pilihan menghasilkan skor 0.
9. Halaman ruang kerja tidak boleh scroll; hanya panel bacaan yang boleh scroll di dalam dirinya.
10. Teks antarmuka menggunakan bahasa Indonesia; nama kode, tabel, dan kolom menggunakan bahasa Inggris.
