# THINK.md — Analisis & Review PLAN.md

> Dokumen ini berisi hasil pemikiran, review kritis, dan strategi implementasi sebelum mulai coding.
> Ditulis oleh AI assistant setelah membaca PLAN.md secara menyeluruh.

> Status saat ini: implementasi sudah berubah dari rencana awal `Nama + NISN` menjadi `ID Siswa + Nama`. Schema aktif mengikuti `guide_supabase.md`: tabel `siswa` berisi `id`, `nama`, `qr_token`, `claimed`, `claimed_at`, dan `created_at`.

---

## 1. Pemahaman Proyek

### Inti Masalah
Acara perpisahan kelulusan membutuhkan sistem distribusi konsumsi yang:
- **Adil** — setiap siswa hanya dapat 1x konsumsi
- **Cepat** — scanning QR di pintu harus instan, tidak boleh antri lama
- **Anti-kecurangan** — QR tidak bisa diduplikasi/ditebak, double-claim ditolak

### 3 Aktor Utama
| Aktor | Kebutuhan | Halaman |
|---|---|---|
| **Ketua Panitia** | Upload data siswa, monitor distribusi | `/admin` |
| **Siswa** | Ambil QR code pribadi | `/` (landing) |
| **Panitia Pintu** | Scan QR, validasi, catat klaim | `/scan` |

### Alur Data
```
CSV `id,nama` → Supabase → QR token di-generate per siswa
Siswa login (ID Siswa+Nama) → dapat QR
Panitia scan QR → validasi token → mark claimed → done
```

---

## 2. Review Kritis — Apa yang Sudah Bagus

✅ **Arsitektur sederhana & tepat** — Vanilla HTML/CSS/JS tanpa framework berlebihan. Untuk proyek skala ini (500+ siswa), ini keputusan yang benar. Tidak perlu React/Vue.

✅ **Supabase sebagai backend** — Gratis, ada Realtime, ada PostgreSQL, ada Row Level Security. Pilihan solid.

✅ **QR token acak** — Bukan NISN yang di-encode ke QR (itu bahaya), tapi token random. Keputusan keamanan yang benar.

✅ **Login tanpa password** — Nama + NISN sebagai autentikasi ringan. Cukup untuk konteks acara satu kali.

✅ **Backup input manual** — Kalau kamera gagal, panitia bisa ketik token/NISN manual. Ini penting untuk plan B.

---

## 3. Review Kritis — Yang Perlu Diperhatikan

### ⚠️ 3.1 Validasi Login Siswa: Case Sensitivity & Typo
**Masalah**: Login pakai "Nama" itu riskan. Siswa bisa ketik "andi setiawan" vs "Andi Setiawan" vs "ANDI SETIAWAN".

**Solusi**: 
- Normalisasi nama: `LOWER(TRIM(nama))` saat menyimpan dan saat query
- Atau lebih aman: login hanya pakai **NISN saja** (karena NISN sudah unique), dengan nama sebagai konfirmasi tampilan setelah validasi
- **Keputusan**: Tetap pakai Nama + NISN sesuai PLAN, tapi implementasi pakai case-insensitive matching

### ⚠️ 3.2 Format NISN di CSV
**Masalah**: NISN biasanya 10 digit angka, tapi kalau di Excel/CSV bisa kehilangan leading zero (misal: `0123456789` jadi `123456789`).

**Solusi**: 
- Simpan NISN sebagai TEXT, bukan INTEGER
- Validasi format saat upload CSV
- ✅ PLAN sudah benar menandai `nisn text` — good

### ⚠️ 3.3 QR Token Generation
**Masalah**: Kapan token di-generate? PLAN bilang "auto-generate" tapi tidak jelas kapan.

**Keputusan**: Generate `qr_token` saat CSV di-upload. Gunakan `crypto.randomUUID()` di client atau `gen_random_uuid()` di Supabase. Token format: UUID v4 (contoh: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### ⚠️ 3.4 Keamanan Admin Panel
**Masalah**: PLAN tidak menyebutkan autentikasi untuk `/admin`. Siapa saja bisa akses dan upload CSV?

**Solusi**: 
- Minimal: password sederhana di-hardcode (untuk konteks acara satu kali, ini cukup)
- Lebih baik: Supabase Auth dengan email panitia
- **Keputusan**: Implementasi password gate sederhana di halaman admin. Simpan password di environment variable atau config Supabase.

### ⚠️ 3.5 Concurrency pada Scan
**Masalah**: Multi-HP scan bersamaan. Bagaimana kalau 2 panitia scan QR yang sama dalam waktu yang hampir bersamaan?

**Solusi**: 
- Gunakan Supabase RPC/function dengan `UPDATE ... WHERE claimed = false RETURNING *`
- Ini atomic di PostgreSQL — yang pertama berhasil, yang kedua gagal
- Jangan pakai pattern: read → check → update (race condition!)

### ⚠️ 3.6 Offline Resilience
**Masalah**: Bagaimana kalau WiFi acara putus saat scanning?

**Catatan**: Ini di luar scope PLAN, tapi perlu diperhatikan. Minimal:
- Tampilkan pesan error yang jelas kalau koneksi putus
- QR yang sudah tampil di HP siswa tetap bisa ditampilkan (sudah di-render)

---

## 4. Keputusan Arsitektur

### 4.1 Struktur File
```
Perpisahan12/
├── index.html          # Halaman siswa (login + QR)
├── admin.html          # Halaman admin (upload CSV + dashboard)
├── scan.html           # Halaman scan (kamera + validasi)
├── css/
│   └── style.css       # Global styles, design system
├── js/
│   ├── supabase-config.js   # Supabase client init
│   ├── student.js           # Logic halaman siswa
│   ├── admin.js             # Logic halaman admin
│   └── scanner.js           # Logic halaman scan
├── .agent/
│   ├── PLAN.md
│   └── THINK.md (this file)
└── README.md
```

### 4.2 Supabase Setup
```sql
-- Tabel utama
CREATE TABLE siswa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    kelas TEXT NOT NULL,
    no_absen INTEGER NOT NULL,
    nisn TEXT UNIQUE NOT NULL,
    qr_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX idx_siswa_nisn ON siswa(nisn);
CREATE INDEX idx_siswa_qr_token ON siswa(qr_token);
CREATE INDEX idx_siswa_claimed ON siswa(claimed);

-- RPC untuk atomic claim (anti race-condition)
CREATE OR REPLACE FUNCTION claim_konsumsi(token UUID)
RETURNS TABLE(success BOOLEAN, nama TEXT, kelas TEXT, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_siswa RECORD;
BEGIN
    UPDATE siswa
    SET claimed = TRUE, claimed_at = NOW()
    WHERE qr_token = token AND claimed = FALSE
    RETURNING siswa.nama, siswa.kelas INTO v_siswa;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_siswa.nama, v_siswa.kelas, 'Konsumsi berhasil dicatat'::TEXT;
    ELSE
        -- Cek apakah token ada tapi sudah claimed
        IF EXISTS (SELECT 1 FROM siswa WHERE siswa.qr_token = token) THEN
            RETURN QUERY SELECT FALSE, ''::TEXT, ''::TEXT, 'Konsumsi sudah diambil sebelumnya!'::TEXT;
        ELSE
            RETURN QUERY SELECT FALSE, ''::TEXT, ''::TEXT, 'QR Code tidak valid!'::TEXT;
        END IF;
    END IF;
END;
$$;
```

### 4.3 Library CDN
```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- QR Code Generator -->
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>

<!-- QR Scanner (untuk halaman scan) -->
<script src="https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
```

### 4.4 Design Direction
- **Theme**: Modern, clean, dark mode dengan aksen warna graduation (deep purple/indigo + gold)
- **Typography**: Google Fonts — Inter atau Outfit
- **Vibe**: Premium tapi tetap friendly, bukan corporate
- **Mobile-first**: Semua halaman harus work di HP (terutama `/scan` yang pasti dipakai di HP)
- **Animasi**: Subtle — fade in, slide up, pulse pada QR saat pertama muncul
- **Feedback visual**: 
  - ✅ Hijau (success) dengan animasi checkmark
  - ⚠️ Kuning/orange (sudah claimed) dengan shake animation
  - ❌ Merah (invalid) dengan jiggle

---

## 5. Urutan Implementasi

### Phase 1: Foundation
1. `css/style.css` — Design system lengkap (variabel, typography, layout, komponen)
2. `js/supabase-config.js` — Inisialisasi Supabase client

### Phase 2: Halaman Siswa (`index.html` + `js/student.js`)
- Form login (Nama + NISN)
- Validasi ke Supabase
- Generate & tampilkan QR code
- Error handling (data tidak ditemukan)

### Phase 3: Halaman Admin (`admin.html` + `js/admin.js`)
- Password gate (sederhana)
- Upload CSV + parsing
- Bulk insert ke Supabase
- Dashboard realtime (total, claimed, unclaimed)
- Tabel data siswa dengan status

### Phase 4: Halaman Scan (`scan.html` + `js/scanner.js`)
- Inisialisasi kamera
- Scan QR → extract token
- Validasi via Supabase RPC (atomic)
- Feedback visual (success/duplicate/invalid)
- Input manual sebagai fallback
- Realtime counter update

### Phase 5: Polish
- Responsive testing
- Loading states
- Error boundaries
- Animasi & micro-interactions

---

## 6. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| WiFi acara mati | Scan berhenti total | Backup hotspot HP, pre-load halaman scan |
| CSV format salah | Data tidak masuk | Validasi format + preview sebelum import |
| Siswa share QR ke teman | Konsumsi diambil orang lain | Edukasi, dan sifat claimed=true mencegah double |
| Kamera HP low-end blur | QR sulit di-scan | Input manual token sebagai backup |
| Supabase rate limit | Request ditolak | Free tier cukup untuk 500 user, bukan masalah |

---

## 7. Catatan untuk Implementasi

- **JANGAN hardcode Supabase credentials di source code publik** — gunakan file config terpisah yang bisa diubah
- **CSV parsing** — gunakan PapaParse (library) atau manual split (lebih ringan). Keputusan: manual split karena format CSV sederhana
- **QR content** — Yang di-encode ke QR adalah `qr_token` saja (UUID), bukan URL. Panitia scan → app extract token → validasi ke Supabase
- Atau lebih baik: encode URL lengkap `https://domain.com/scan?token=UUID` agar kalau di-scan pakai scanner biasa pun redirect ke halaman validasi
- **Keputusan**: Encode token saja. Halaman scan sudah dedicated, tidak perlu URL.

---

## 8. Pertanyaan Terbuka (Perlu Input User)

1. **Supabase credentials** — Sudah punya akun Supabase? Perlu URL dan anon key untuk koneksi.
2. **Jumlah siswa** — Berapa total siswa yang akan didata? (Berpengaruh ke strategi batch insert)
3. **Domain hosting** — Akan di-host di mana? Netlify/Vercel/GitHub Pages?
4. **Admin password** — Mau pakai password apa untuk akses admin panel?
5. **Apakah perlu fitur export data** — Misal export daftar siswa yang sudah/belum ambil konsumsi ke CSV?

---

> **Kesimpulan**: PLAN.md sudah solid dan well-thought. Beberapa gap kecil (admin auth, race condition, case sensitivity) sudah di-cover di dokumen ini. Siap untuk implementasi.
