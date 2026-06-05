/**
 * Simple Absent Page Logic
 * ========================
 * Fetches roster from Supabase `absen` table.
 * The `absen` table has columns: id (int8), class (int8), name (text), stats (bool).
 * Class selector filters the name dropdown by the `class` column.
 * On submit, updates `stats` from false → true for the selected student.
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
  const qrSection      = document.getElementById('qr-section');
  const qrcodeContainer = document.getElementById('qrcode');

  /** @type {Map<string, Array<{id: number, name: string, class: number, stats: boolean}>>} */
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

    if (student.stats === true) {
      showError('Nama ini sudah absen sebelumnya!');
      showToast('Sudah absen sebelumnya', 'warning');
      return;
    }

    setLoading(true);
    hideError();

    try {
      const db = getDB();
      if (!db) throw new Error('Supabase belum dikonfigurasi.');

      // Update stats from false → true
      const { error: updateError } = await db
        .from('absen')
        .update({ stats: true })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Insert or update QR table with new token
      // First, check if student already exists in QR table
      const { data: qrData, error: qrCheckError } = await db
        .from('QR')
        .select('qr_token')
        .eq('id', student.id)
        .single();

      let qrToken;
      
      if (qrCheckError || !qrData) {
        // Student not in QR table yet, insert new record
        const { data: insertData, error: insertError } = await db
          .from('QR')
          .insert([
            { 
              id: student.id, 
              nama: student.name 
            }
          ])
          .select('qr_token')
          .single();

        if (insertError) throw insertError;
        qrToken = insertData.qr_token;
      } else {
        // Student already in QR table, use existing token
        qrToken = qrData.qr_token;
      }

      // Update local cache
      student.stats = true;

      showSuccess(student, qrToken);
      showToast('Absensi tersimpan', 'success');
      absentForm.reset();
      resetNameSelector();
      inputClass.focus();
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
    qrSection.classList.add('hidden');
    qrcodeContainer.innerHTML = ''; // Clear QR code when starting over
    inputClass.focus();
  });

  // ── Roster loading from Supabase ───────────────────────────────────────────
  async function loadRoster() {
    const db = getDB();
    if (!db) {
      showError('Supabase belum dikonfigurasi. Pastikan js/env.js sudah dihasilkan.');
      return;
    }

    try {
      // Fetch all students from `absen` table
      const { data, error } = await db
        .from('absen')
        .select('id, class, name, stats')
        .order('name');

      if (error) throw error;
      if (!data || data.length === 0) {
        showError('Daftar siswa kosong. Import data ke tabel absen di Supabase terlebih dahulu.');
        return;
      }

      data.forEach(row => {
        const classCode = String(row.class);
        if (!classCode) return;

        if (!rosterByClass.has(classCode)) {
          rosterByClass.set(classCode, []);
        }
        rosterByClass.get(classCode).push({
          id: row.id,
          name: row.name,
          class: row.class,
          stats: row.stats,
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
      // Mark already-absent students
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

  function showSuccess(record, qrToken = null) {
    successDetail.textContent = `${record.name} — Kelas ${record.class}`;
    
    // Show QR code section if token is provided
    if (qrToken && typeof QRCode !== 'undefined') {
      qrcodeContainer.innerHTML = ''; // Clear previous QR code
      new QRCode(qrcodeContainer, {
        text: qrToken,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      qrSection.classList.remove('hidden');
    } else {
      qrSection.classList.add('hidden');
    }
    
    successSection.classList.remove('hidden');
  }

  function getSubmitErrorMessage(err) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return 'Supabase belum diset. Isi .env, jalankan node scripts/generate-env.mjs, lalu buka ulang halaman.';
    }
    if (err && /relation .*absen.* does not exist/i.test(err.message || '')) {
      return 'Tabel absen belum dibuat di Supabase.';
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
});
