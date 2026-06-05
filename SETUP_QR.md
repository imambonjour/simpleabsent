# Setup Supabase untuk Tabel QR

Panduan ini menjelaskan cara setup database Supabase untuk halaman **scan** dan **admin** menggunakan tabel `QR`.

## Langkah 1: Buat Tabel QR di Supabase

1. Buka dashboard Supabase project kamu
2. Masuk ke menu **SQL Editor** (di sidebar kiri)
3. Klik **New Query**
4. Copy-paste seluruh isi file `setup_qr_table.sql` dari repository ini
5. Klik tombol **Run** di pojok kanan bawah

Script SQL akan membuat:
- Tabel `public."QR"` dengan kolom: `id`, `nama`, `qr_token`, `claimed`, `claimed_at`
- Index untuk performa query yang lebih cepat
- Fungsi RPC `claim_konsumsi()` untuk proses claim yang aman (atomic)

## Langkah 2: Ambil API Credentials

1. Di dashboard Supabase, klik **Settings** (ikon gerigi di kiri bawah)
2. Pilih sub-menu **API**
3. Copy nilai berikut:
   - **Project URL** (contoh: `https://xyzabc.supabase.co`)
   - **`anon` / `public` key** (string panjang)

## Langkah 3: Konfigurasi Environment

1. Copy file `.env.example` menjadi `.env` (jika belum ada):
   ```bash
   cp .env.example .env
   ```

2. Edit file `.env` dan isi dengan credentials dari Langkah 2:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ADMIN_PASSWORD=ganti-dengan-password-admin
   ```

3. Generate konfigurasi browser:
   ```bash
   node scripts/generate-env.mjs
   ```

   Perintah ini akan membuat file `js/env.js` yang berisi konfigurasi untuk aplikasi frontend.

## Langkah 4: Upload Data Siswa

1. Buka halaman `admin.html` di browser
2. Masukkan password admin yang sudah diset di `.env`
3. Drag-and-drop file CSV dengan format:
   ```csv
   id,nama
   1201_01,Ahmad Fauzi
   1201_02,Budi Santoso
   ```
4. Preview data akan muncul, klik **Import ke Database**
5. Setiap baris akan otomatis mendapat `qr_token` UUID unik

## Langkah 5: Gunakan Scanner

1. Buka halaman `scan.html` di browser (gunakan HTTPS atau localhost)
2. Klik **Mulai Scan** dan izinkan akses kamera
3. Arahkan kamera ke QR code siswa (berisi `qr_token`)
4. Atau gunakan **Input Manual** jika kamera tidak bisa scan

## Struktur Tabel QR

```sql
CREATE TABLE public."QR" (
  id text not null,              -- ID Siswa (contoh: 1201_01)
  nama text null,                -- Nama lengkap siswa
  qr_token text null,            -- UUID unik untuk QR code (auto-generated)
  claimed boolean null,          -- Status: false = belum, true = sudah ambil
  claimed_at text null,          -- Timestamp saat claim (ISO string)
  constraint qr_pkey primary key (id)
);
```

## Troubleshooting

### Error: "Koneksi Supabase gagal"
- Pastikan file `js/env.js` sudah ter-generate
- Cek apakah `.env` sudah diisi dengan benar
- Pastikan koneksi internet aktif

### Error: "Tabel QR tidak ditemukan"
- Jalankan ulang script SQL di Supabase SQL Editor
- Pastikan tidak ada typo pada nama tabel (`QR` dengan huruf besar)

### Kamera tidak mau aktif
- Halaman harus dibuka via HTTPS atau `http://localhost`
- Browser modern memblokir kamera di HTTP biasa
- Di Android, gunakan port forwarding USB atau deploy ke HTTPS

### QR Code tidak terbaca
- Pastikan pencahayaan cukup
- Coba input manual token/ID siswa
- Bersihkan lensa kamera

## Keamanan (Opsional)

Untuk produksi, disarankan mengaktifkan **Row Level Security (RLS)**:

1. Di Supabase, buka **Database** → **Tables** → pilih `QR`
2. Aktifkan toggle **RLS**
3. Tambahkan policies berikut di SQL Editor:

```sql
ALTER TABLE public."QR" ENABLE ROW LEVEL SECURITY;

-- Izinkan semua orang membaca data (untuk menampilkan QR)
CREATE POLICY "Allow public select"
ON public."QR"
FOR SELECT
TO anon
USING (true);

-- Izinkan insert (admin upload CSV)
CREATE POLICY "Allow public insert"
ON public."QR"
FOR INSERT
TO anon
WITH CHECK (true);

-- Izinkan update (scanner mark as claimed)
CREATE POLICY "Allow public update"
ON public."QR"
FOR UPDATE
TO anon
USING (true);
```

## Catatan Penting

- File `.env` dan `js/env.js` **tidak boleh** di-commit ke Git (sudah ada di `.gitignore`)
- Password admin hanya proteksi frontend ringan (bukan security kuat)
- Untuk event satu hari, setup ini sudah cukup aman
- Anon key Supabase memang public by design (keamanan ada di RLS policies)
