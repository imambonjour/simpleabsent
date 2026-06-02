# Sistem QR Konsumsi — Acara Perpisahan Kelulusan

## Ringkasan Proyek

Sistem web untuk distribusi konsumsi acara perpisahan berbasis QR code. Hanya siswa yang terdaftar bisa mengakses QR mereka, dengan validasi menggunakan **ID Siswa + Nama**.

---

## Alur Sistem

```
[PANITIA — sekali setup]
Upload CSV: id,nama
        ↓
Tersimpan ke Supabase

[SISWA — sebelum/saat acara]
Buka website → input ID Siswa + Nama
        ↓
✅ Data cocok → tampil QR unik
❌ Tidak cocok → "Data tidak ditemukan"
        ↓
Simpan / tunjukkan ke panitia

[PANITIA DI PINTU]
Scan QR siswa → sistem catat → konsumsi diberikan
✅ Valid → marked as claimed
❌ Sudah scan → ditolak
```

---

## Halaman yang Dibutuhkan

| Halaman | Pengguna | Fungsi |
|---|---|---|
| `/admin` | Ketua panitia | Upload CSV, lihat dashboard |
| `/` | Siswa | Login ID Siswa + Nama, tampil QR |
| `/scan` | Panitia di pintu | Kamera scan QR, catat realtime |

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | HTML + CSS + JavaScript (vanilla) |
| Database | Supabase (PostgreSQL) |
| Realtime sync | Supabase Realtime |
| QR Generator | qrcode.js |
| QR Scanner | html5-qrcode |
| Hosting | Supabase / Netlify (gratis) |

---

## Struktur Database (Supabase)

```sql
table: siswa
  - id          text (primary key, contoh: 121_01)
  - nama        text
  - qr_token    uuid (unique, auto-generate)
  - claimed     boolean (default: false)
  - claimed_at  timestamptz
  - created_at  timestamptz
```

---

## Format CSV yang Disiapkan Panitia

```
id,nama
121_01,Addienza Shafa Ningtyas
121_02,A. Falah
121_03,Alvan Aulia Ramadhan
```

---

## Fitur Sistem

### Admin Panel
- Upload CSV siswa (sekali import, langsung masuk database)
- Dashboard realtime: total siswa, sudah ambil, belum ambil
- Progress bar distribusi konsumsi
- Tabel daftar siswa + status

### Halaman Siswa
- Login dengan ID Siswa + Nama
- Tampil QR unik setelah validasi berhasil
- Tidak perlu registrasi, tidak perlu password

### Halaman Scan (Panitia)
- Scan kamera langsung dari HP
- Validasi realtime ke Supabase
- Feedback visual: ✅ berhasil / ⚠️ sudah diambil / ❌ tidak valid
- Input manual ID sebagai backup

---

## Keamanan

- ID Siswa bersifat unik
- Satu ID Siswa hanya punya satu QR
- QR token acak — tidak bisa ditebak
- Sekali scan langsung dikunci (`claimed: true`) — tidak bisa double-claim
- Multi-HP panitia bisa scan bersamaan tanpa tabrakan data (Supabase handles concurrency)

---

## Estimasi Harga Jasa

| Komponen | Estimasi |
|---|---|
| Upah kerja (±16 jam × Rp 35.000) | Rp 560.000 |
| Fitur admin + tiket + scan + DB setup | Rp 305.000 |
| Diskon sesama pelajar (20%) | − Rp 173.000 |
| **Total wajar** | **± Rp 690.000** |
| Harga ke teman / kas kelas | **± Rp 345.000** |

> Nilai portofolio jauh lebih besar — sistem QR untuk 500+ orang adalah proyek nyata yang layak masuk CV.

---

## Checklist Sebelum Coding

### Panitia (kamu siapkan):
- [ ] Rapikan data siswa: Nama, Kelas, No. Absen, NISN
- [ ] Export ke format CSV

### Sistem (akan dibangun):
- [ ] Setup project Supabase + struktur tabel
- [ ] Halaman admin: upload CSV + dashboard
- [ ] Halaman siswa: login NISN → tampil QR
- [ ] Halaman scan: kamera HP + validasi realtime
- [ ] Deploy ke hosting gratis

---

## Langkah Selanjutnya

1. **Siapkan data CSV** siswa kelas 12
2. **Buat akun Supabase** di [supabase.com](https://supabase.com) (gratis)
3. **Mulai coding** — semua halaman bisa dibangun dalam 1 file HTML per halaman
