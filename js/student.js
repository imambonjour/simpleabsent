/**
 * Simple Absent Page Logic
 * ========================
 * Fetches roster from Supabase `QR` table.
 * The `QR` table has columns: id (text), nama (text), qr_token (text), stats (bool), claimed (bool).
 * Class selector filters the name dropdown by parsing the class prefix from the student `id` (e.g. `1201_36` -> class `1201`).
 * On submit, updates `stats` from false → true for the selected student. Generates a random UUID if `qr_token` is null.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const absentForm     = document.getElementById('absent-form');
  const inputClass     = document.getElementById('input-class');
  const inputName      = document.getElementById('input-name');
  const formError      = document.getElementById('absent-error');
  const btnSubmit      = document.getElementById('btn-submit-absent');
  const setupNotice    = document.getElementById('setup-notice');
  const successSection = document.getElementById('success-section');
  const successDetail  = document.getElementById('success-detail');
  const btnAddAnother  = document.getElementById('btn-add-another');

  // QR result elements
  const qrSection      = document.getElementById('qr-section');
  const qrCode         = document.getElementById('qr-code');
  const qrName         = document.getElementById('qr-name');
  const qrClass        = document.getElementById('qr-class');
  const btnBack        = document.getElementById('btn-back');

  /** @type {Map<string, Array<{id: string, name: string, class: string, stats: boolean, qr_token: string}>>} */
  const rosterByClass = new Map();

  showSetupNoticeIfNeeded();
  loadRoster();

  // ── Class selector change ──────────────────────────────────────────────────
  inputClass.addEventListener('change', () => {
    populateNameOptions(inputClass.value);
  });

  // ── Form submit ────────────────────────────────────────────────────────────
  absentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const studentClass = inputClass.value;
    const studentId    = inputName.value;
    const student      = getRosterEntry(studentClass, studentId);

    if (!studentClass) {
      showError('Silakan pilih kelas.');
      inputClass.focus();
      return;
    }

    if (!studentId || !student) {
      showError('Silakan pilih nama dari kelas yang sesuai.');
      inputName.focus();
      return;
    }

    // Jika sudah absen, langsung tampilkan QR code mereka
    if (student.stats === true) {
      showQRCode(student);
      showToast('Menampilkan kembali QR Code Anda', 'info');
      return;
    }

    setLoading(true);
    hideError();

    try {
      const db = getDB();
      if (!db) throw new Error('Supabase belum dikonfigurasi.');

      // Buat token baru jika belum ada di database
      let token = student.qr_token;
      if (!token) {
        token = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
      }

      // Update stats ke true, dan simpan token baru jika sebelumnya null
      const { error } = await db
        .from('QR')
        .update({ stats: true, qr_token: token })
        .eq('id', student.id);

      if (error) throw error;

      // Update data lokal
      student.stats = true;
      student.qr_token = token;

      showQRCode(student);
      showToast('Absensi berhasil disimpan!', 'success');
      absentForm.reset();
      resetNameSelector();
    } catch (err) {
      console.error('[student] submit error:', err);
      showError(getSubmitErrorMessage(err));
      showToast('Gagal menyimpan absensi', 'error');
    } finally {
      setLoading(false);
    }
  });

  btnAddAnother.addEventListener('click', () => {
    successSection.classList.add('hidden');
    inputClass.focus();
  });

  btnBack.addEventListener('click', () => {
    qrSection.classList.add('hidden');
    absentForm.closest('.card').classList.remove('hidden');
    absentForm.reset();
    resetNameSelector();
    inputClass.focus();
  });

  // ── Generate and display QR code ───────────────────────────────────────────
  function showQRCode(student) {
    if (!window.QRCode) {
      showError('Library QR Code gagal dimuat. Periksa koneksi internet lalu refresh halaman.');
      showToast('Library QR Code gagal dimuat', 'error');
      return;
    }

    qrCode.innerHTML = '';

    // Gunakan qr_token sebagai isi QR code
    new window.QRCode(qrCode, {
      text: student.qr_token,
      width: 200,
      height: 200,
      colorDark: '#3A2A1F',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H,
    });

    qrName.textContent = student.name;
    qrClass.textContent = `Kelas: ${student.class} | ID: ${student.id}`;

    // Sembunyikan form card, tampilkan QR card
    absentForm.closest('.card').classList.add('hidden');
    qrSection.classList.remove('hidden');
  }

  // ── Roster loading from Supabase ───────────────────────────────────────────
  async function loadRoster() {
    const db = getDB();
    if (!db) {
      showError('Supabase belum dikonfigurasi. Pastikan js/env.js sudah dihasilkan.');
      return;
    }

    try {
      // Fetch data dari tabel `QR`
      const { data, error } = await db
        .from('QR')
        .select('id, nama, qr_token, stats')
        .order('nama');

      if (error) throw error;
      if (!data || data.length === 0) {
        showError('Daftar siswa kosong. Upload data ke tabel QR di Supabase terlebih dahulu.');
        return;
      }

      data.forEach(row => {
        // Format ID: 1201_01 -> classCode = 1201
        const idStr = String(row.id);
        const classCode = idStr.split('_')[0];
        if (!classCode) return;

        if (!rosterByClass.has(classCode)) {
          rosterByClass.set(classCode, []);
        }
        rosterByClass.get(classCode).push({
          id: row.id,
          name: row.nama,
          class: classCode,
          stats: row.stats || false,
          qr_token: row.qr_token,
        });
      });

      showToast('Daftar nama berhasil dimuat', 'info');
    } catch (err) {
      console.error('[student] roster load error:', err);
      showError('Gagal memuat daftar nama dari Supabase.');
    }
  }

  // ── Name dropdown helpers ──────────────────────────────────────────────────
  function populateNameOptions(classCode) {
    const entries = rosterByClass.get(classCode) || [];
    inputName.innerHTML = '<option value="">Pilih nama</option>';
    inputName.disabled  = true;

    if (entries.length === 0) {
      inputName.innerHTML = '<option value="">Tidak ada nama untuk kelas ini</option>';
      return;
    }

    entries.forEach(entry => {
      const option       = document.createElement('option');
      option.value       = entry.id;
      option.textContent = entry.name;
      // Berikan tanda centang jika sudah absen
      if (entry.stats === true) {
        option.textContent += ' ✓ (sudah absen)';
        option.style.color = '#3B6D11';
      }
      inputName.appendChild(option);
    });

    inputName.disabled = false;
  }

  function resetNameSelector() {
    inputName.innerHTML = '<option value="">Pilih kelas dulu</option>';
    inputName.disabled  = true;
  }

  function getRosterEntry(classCode, studentId) {
    const entries = rosterByClass.get(classCode) || [];
    return entries.find(e => String(e.id) === String(studentId)) || null;
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  function showSetupNoticeIfNeeded() {
    const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
    setupNotice.classList.toggle('hidden', isConfigured);
  }

  // Helper error message
  function getSubmitErrorMessage(err) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return 'Supabase belum diset. Isi .env, jalankan node scripts/generate-env.mjs, lalu buka ulang halaman.';
    }
    if (err && /relation .*QR.* does not exist/i.test(err.message || '')) {
      return 'Tabel QR belum dibuat di Supabase.';
    }
    return 'Terjadi kesalahan saat menyimpan. Periksa koneksi dan setup Supabase.';
  }

  function showError(message) {
    formError.textContent = message;
    formError.classList.add('active');
  }

  function hideError() {
    formError.textContent = '';
    formError.classList.remove('active');
  }

  function setLoading(isLoading) {
    btnSubmit.classList.toggle('btn--loading', isLoading);
    btnSubmit.disabled = isLoading;
  }

  // Helper UUID v4 generator
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
});
