/**
 * Simple Absent Page Logic
 * ========================
 * Handles: name/class/absent number form -> Supabase insert.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const absentForm = document.getElementById('absent-form');
  const inputName = document.getElementById('input-name');
  const inputClass = document.getElementById('input-class');
  const inputAbsentNumber = document.getElementById('input-absent-number');
  const formError = document.getElementById('absent-error');
  const btnSubmit = document.getElementById('btn-submit-absent');
  const setupNotice = document.getElementById('setup-notice');
  const successSection = document.getElementById('success-section');
  const successDetail = document.getElementById('success-detail');
  const btnAddAnother = document.getElementById('btn-add-another');

  fillAbsentNumbers();
  showSetupNoticeIfNeeded();

  absentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const studentName = inputName.value.trim();
    const studentClass = inputClass.value.trim();
    const absentNumber = Number(inputAbsentNumber.value);

    if (!studentName) {
      showError('Silakan masukkan nama.');
      inputName.focus();
      return;
    }

    if (!studentClass) {
      showError('Silakan masukkan kelas.');
      inputClass.focus();
      return;
    }

    if (!Number.isInteger(absentNumber) || absentNumber < 1) {
      showError('Silakan pilih nomor absen.');
      inputAbsentNumber.focus();
      return;
    }

    setLoading(true);
    hideError();

    try {
      const db = getDB();
      if (!db) {
        throw new Error('Supabase belum dikonfigurasi.');
      }

      const payload = {
        student_name: studentName,
        student_class: studentClass,
        absent_number: absentNumber,
      };

      const { error } = await db
        .from('absensi')
        .insert(payload);

      if (error) {
        throw error;
      }

      showSuccess(payload);
      showToast('Absensi tersimpan', 'success');
      absentForm.reset();
      fillAbsentNumbers();
      inputName.focus();
    } catch (error) {
      console.error('[student] submit absent error:', error);
      showError(getSubmitErrorMessage(error));
      showToast('Gagal menyimpan absensi', 'error');
    } finally {
      setLoading(false);
    }
  });

  btnAddAnother.addEventListener('click', () => {
    successSection.classList.add('hidden');
    inputName.focus();
  });

  function fillAbsentNumbers() {
    const selectedValue = inputAbsentNumber.value;
    inputAbsentNumber.innerHTML = '<option value="">Pilih nomor</option>';

    for (let number = 1; number <= 40; number += 1) {
      const option = document.createElement('option');
      option.value = String(number);
      option.textContent = String(number).padStart(2, '0');
      inputAbsentNumber.appendChild(option);
    }

    inputAbsentNumber.value = selectedValue;
  }

  function showSetupNoticeIfNeeded() {
    const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
    setupNotice.classList.toggle('hidden', isConfigured);
  }

  function showSuccess(record) {
    const number = String(record.absent_number).padStart(2, '0');
    successDetail.textContent = `${record.student_name} - Kelas ${record.student_class} - No. ${number}`;
    successSection.classList.remove('hidden');
  }

  function getSubmitErrorMessage(error) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return 'Supabase belum diset. Isi .env, jalankan node scripts/generate-env.mjs, lalu buka ulang halaman.';
    }

    if (error && error.code === '23505') {
      return 'Data ini sudah pernah masuk. Periksa nama, kelas, dan nomor absen.';
    }

    if (error && /relation .*absensi.* does not exist/i.test(error.message || '')) {
      return 'Tabel absensi belum dibuat di Supabase. Jalankan SQL dari guide_supabase.md.';
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
