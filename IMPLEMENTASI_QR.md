# Implementasi QR Token untuk Absensi Siswa

## Ringkasan Perubahan

Fitur ini menambahkan kemampuan untuk menghasilkan QR token secara otomatis setiap kali siswa melakukan absensi. QR token ini kemudian dapat digunakan untuk mengklaim konsumsi.

## Cara Kerja

### 1. Alur Proses (Flow)

```
Siswa Submit Absen
    ↓
Update tabel `absen` (stats = true)
    ↓
Cek apakah siswa sudah ada di tabel `QR`
    ↓
    ├─ Belum ada → Insert baru (auto-generate UUID)
    └─ Sudah ada → Gunakan qr_token yang ada
    ↓
Generate QR Code visual di browser
    ↓
Tampilkan QR kepada siswa
```

### 2. Generate Token

Token QR di-generate **setiap kali siswa klik submit** dengan mekanisme:

- **Jika pertama kali**: Sistem akan insert record baru ke tabel `QR` dengan kolom `qr_token` yang auto-generated menggunakan `gen_random_uuid()` dari PostgreSQL.
- **Jika sudah pernah absen**: Sistem akan menggunakan `qr_token` yang sama dari database (tidak membuat baru).

Ini memastikan:
- Setiap siswa punya token unik
- Token konsisten (sama setiap kali absen ulang)
- Token aman karena menggunakan UUID v4

### 3. Struktur Database

Tabel `QR`:
```sql
CREATE TABLE public."QR" (
  id text not null,                    -- ID siswa (dari tabel absen)
  nama text null,                      -- Nama siswa
  qr_token text DEFAULT gen_random_uuid()::text UNIQUE,  -- Auto-generate UUID
  claimed boolean DEFAULT false,       -- Status klaim konsumsi
  claimed_at text null,                -- Waktu klaim
  constraint qr_pkey primary key (id)
);
```

### 4. Library yang Digunakan

- **qrcodejs** (CDN): Library JavaScript untuk generate QR code visual di browser
- **Supabase JS Client**: Untuk interaksi dengan database

## File yang Dimodifikasi

### 1. `index.html`
- Menambahkan script `qrcodejs` dari CDN
- Menambahkan section `#qr-section` untuk menampilkan QR code

### 2. `js/student.js`
- Menambahkan logic untuk insert/update tabel `QR` setelah absen
- Mengambil `qr_token` dari database
- Menampilkan QR code menggunakan library `qrcodejs`
- Reset QR code saat tombol "Tambah Lagi" diklik

### 3. `css/style.css`
- Menambahkan styling untuk container QR code
- Utility classes untuk layout (text-center, mx-auto, dll)

## Cara Menggunakan

### Setup Awal (Jika Belum)

1. Pastikan tabel `QR` sudah dibuat di Supabase:
   ```bash
   # Jalankan SQL di Supabase SQL Editor
   # Lihat file setup_qr_table.sql untuk script lengkap
   ```

2. Pastikan RLS policies sudah diset (jika perlu):
   ```sql
   ALTER TABLE public."QR" ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Allow public select"
   ON public."QR" FOR SELECT TO anon USING (true);
   
   CREATE POLICY "Allow public insert"
   ON public."QR" FOR INSERT TO anon WITH CHECK (true);
   ```

### Penggunaan Normal

1. Buka halaman `index.html` (halaman absensi siswa)
2. Pilih kelas dan nama siswa
3. Klik "Simpan Absensi"
4. QR code akan muncul otomatis
5. Siswa menunjukkan QR ke petugas untuk klaim konsumsi

## Keamanan

- Token menggunakan UUID v4 yang sulit ditebak
- Token hanya bisa di-claim sekali (kolom `claimed`)
- Fungsi `claim_konsumsi` di database mencegah race condition

## Troubleshooting

### QR tidak muncul
- Cek console browser untuk error
- Pastikan library `qrcodejs` ter-load (cek Network tab)
- Pastikan koneksi internet aktif (untuk load CDN)

### Error "table QR does not exist"
- Buat tabel `QR` di Supabase menggunakan script `setup_qr_table.sql`
- Refresh halaman setelah membuat tabel

### Token tidak unique
- Pastikan kolom `qr_token` memiliki constraint `UNIQUE`
- Pastikan fungsi `gen_random_uuid()` tersedia (PostgreSQL extension `pgcrypto`)

## Testing

1. **Test Generate Token:**
   - Absen sebagai siswa A
   - Verifikasi QR muncul
   - Catat token dari QR (gunakan scanner)
   
2. **Test Konsistensi:**
   - Reset absen siswa A di database (`stats = false`)
   - Absen lagi sebagai siswa A
   - Verifikasi token QR sama dengan sebelumnya

3. **Test Klaim:**
   - Scan QR menggunakan `scan.html`
   - Verifikasi status `claimed` berubah jadi `true`
   - Coba scan lagi, harus muncul error "sudah diambil"

## Catatan Penting

- QR token di-generate di server (database), bukan di client
- Browser hanya menerima token string dan convert jadi gambar QR
- Token bersifat permanen untuk setiap siswa (tidak berubah)
- Yang berubah adalah status `claimed`, bukan tokennya
