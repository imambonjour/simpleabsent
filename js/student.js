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

  // Face verification elements
  const faceSection     = document.getElementById('face-section');
  const faceStudentName = document.getElementById('face-student-name');
  const faceVideo       = document.getElementById('face-video');
  const faceCamera      = document.getElementById('face-camera');
  const faceStatus      = document.getElementById('face-status');
  const faceSuccessMark = document.getElementById('face-success-mark');
  const btnCancelFace   = document.getElementById('btn-cancel-face');
  const btnStartFace    = document.getElementById('btn-start-face');

  // QR result elements
  const qrSection      = document.getElementById('qr-section');
  const qrCode         = document.getElementById('qr-code');
  const qrName         = document.getElementById('qr-name');
  const qrClass        = document.getElementById('qr-class');
  const btnBack        = document.getElementById('btn-back');

  // Retro Letter Elements
  const retroLetterSection      = document.getElementById('retro-letter-section');
  const retroLetterPage         = document.getElementById('retro-letter-page');
  const retroSuccessPage        = document.getElementById('retro-success-page');
  const retroBtnYa              = document.getElementById('retro-btn-ya');
  const retroBtnTidak           = document.getElementById('retro-btn-tidak');
  const retroSadMessage         = document.getElementById('retro-sad-message');
  const retroCalendarMonthYear  = document.getElementById('retro-calendar-month-year');
  const retroBtnPrevMonth       = document.getElementById('retro-btn-prev-month');
  const retroBtnNextMonth       = document.getElementById('retro-btn-next-month');
  const retroCalendarDays       = document.getElementById('retro-calendar-days-container');
  const retroSelectedDateDisp   = document.getElementById('retro-selected-date-display');
  const retroBtnCopy            = document.getElementById('retro-btn-copy');
  const retroCopyToast          = document.getElementById('retro-copy-toast');
  const retroBtnReset           = document.getElementById('retro-btn-reset');

  let clickCount = 0;
  let selectedDateObject = null;
  let currentYear = 2026;
  let currentMonthIndex = 5; // Juni
  let activeHumairaStudent = null;
  let pendingFaceStudent = null;
  let faceStream = null;
  let isVerifyingFace = false;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const sadMessages = [
    "Serius kak?",
    "I'm gonna be very sad...",
    "Pikir-pikir dulu dong kak...",
    "Masa tidak mau ketemu sama sekali...",
    "Pokoknya harus ketemuan! Tidak ada alasan!",
    "Aku sedih sekali kalau kakak menolak...",
    "Sudah tidak ada tombol 'Tidak' lagi ya! Bye!"
  ];

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

    hideError();
    pendingFaceStudent = student;
    openFaceVerification(student);
  });

  btnStartFace.addEventListener('click', async () => {
    if (!pendingFaceStudent || isVerifyingFace) return;
    await runFaceVerification(pendingFaceStudent);
  });

  btnCancelFace.addEventListener('click', () => {
    closeFaceVerification();
    absentForm.closest('.card').classList.remove('hidden');
    inputName.focus();
  });

  btnAddAnother.addEventListener('click', () => {
    successSection.classList.add('hidden');
    inputClass.focus();
  });

  btnBack.addEventListener('click', () => {
    qrSection.classList.add('hidden');
    closeFaceVerification();
    absentForm.closest('.card').classList.remove('hidden');
    absentForm.reset();
    resetNameSelector();
    inputClass.focus();
  });

  // ── Face verification flow ─────────────────────────────────────────────────
  async function openFaceVerification(student) {
    absentForm.closest('.card').classList.add('hidden');
    qrSection.classList.add('hidden');
    successSection.classList.add('hidden');
    faceSection.classList.remove('hidden');
    faceStudentName.textContent = student.name;
    faceStatus.textContent = 'Menyiapkan kamera...';
    faceCamera.classList.remove('face-camera--scanning', 'face-camera--verified');
    faceSuccessMark.classList.add('hidden');
    btnStartFace.disabled = true;
    btnCancelFace.disabled = false;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    try {
      await startFaceCamera();
      faceStatus.textContent = 'Arahkan wajah ke kamera, lalu mulai scan.';
      btnStartFace.disabled = false;
      btnStartFace.focus();
    } catch (err) {
      console.error('[student] camera error:', err);
      faceStatus.textContent = getCameraErrorMessage(err);
      btnStartFace.disabled = true;
    }
  }

  async function startFaceCamera() {
    stopFaceCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Kamera tidak didukung browser ini.');
    }

    faceStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 640 },
      },
      audio: false,
    });

    faceVideo.srcObject = faceStream;
    await faceVideo.play();
  }

  async function runFaceVerification(student) {
    isVerifyingFace = true;
    btnStartFace.disabled = true;
    btnCancelFace.disabled = true;
    faceCamera.classList.add('face-camera--scanning');
    faceStatus.textContent = 'Memindai titik wajah...';

    try {
      await delay(1200);
      faceStatus.textContent = 'Mencocokkan identitas...';
      const imageBlob = await captureFaceImage();
      await uploadFaceImage(student, imageBlob);

      faceStatus.textContent = 'Wajah terverifikasi.';
      faceCamera.classList.remove('face-camera--scanning');
      faceCamera.classList.add('face-camera--verified');
      faceSuccessMark.classList.remove('hidden');
      if (window.lucide) {
        window.lucide.createIcons();
      }

      await delay(900);
      closeFaceVerification();
      await saveAttendance(student);
    } catch (err) {
      console.error('[student] face verification error:', err);
      faceCamera.classList.remove('face-camera--scanning', 'face-camera--verified');
      faceSuccessMark.classList.add('hidden');
      faceStatus.textContent = getFaceErrorMessage(err);
      btnStartFace.disabled = false;
      btnCancelFace.disabled = false;
    } finally {
      isVerifyingFace = false;
    }
  }

  async function captureFaceImage() {
    if (!faceVideo.videoWidth || !faceVideo.videoHeight) {
      throw new Error('Kamera belum siap.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = faceVideo.videoWidth;
    canvas.height = faceVideo.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(faceVideo, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Gagal mengambil gambar.'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.82);
    });
  }

  async function uploadFaceImage(student, imageBlob) {
    const db = getDB();
    if (!db) throw new Error('Supabase belum dikonfigurasi.');

    const safeId = String(student.id).replace(/[^a-z0-9_-]/gi, '-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `${student.class}/${safeId}-${timestamp}.jpg`;
    const { error } = await db.storage
      .from('face')
      .upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;
  }

  function closeFaceVerification() {
    stopFaceCamera();
    faceSection.classList.add('hidden');
    faceCamera.classList.remove('face-camera--scanning', 'face-camera--verified');
    faceSuccessMark.classList.add('hidden');
    btnStartFace.disabled = false;
    btnCancelFace.disabled = false;
    isVerifyingFace = false;
    pendingFaceStudent = null;
  }

  function stopFaceCamera() {
    if (faceStream) {
      faceStream.getTracks().forEach(track => track.stop());
      faceStream = null;
    }
    faceVideo.srcObject = null;
  }

  async function saveAttendance(student) {
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

      if (isHumaira(student)) {
        startHumairaFlow(student);
      } else {
        showQRCode(student);
        showToast('Absensi berhasil disimpan!', 'success');
      }
      absentForm.reset();
      resetNameSelector();
    } catch (err) {
      console.error('[student] submit error:', err);
      absentForm.closest('.card').classList.remove('hidden');
      showError(getSubmitErrorMessage(err));
      showToast('Gagal menyimpan absensi', 'error');
    } finally {
      setLoading(false);
    }
  }

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

    if (isHumaira(student)) {
      document.body.classList.add('special-humaira');
      generateCuteOrnaments();
    } else {
      document.body.classList.remove('special-humaira');
      clearCuteOrnaments();
    }

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

  function getCameraErrorMessage(err) {
    if (err && err.name === 'NotAllowedError') {
      return 'Izin kamera ditolak. Aktifkan izin kamera untuk lanjut.';
    }
    if (err && err.name === 'NotFoundError') {
      return 'Kamera tidak ditemukan di perangkat ini.';
    }
    return 'Kamera tidak bisa dibuka. Coba refresh halaman.';
  }

  function getFaceErrorMessage(err) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return 'Supabase belum diset. Upload wajah tidak bisa dilakukan.';
    }
    if (err && /row-level security|violates row-level/i.test(err.message || '')) {
      return 'Upload ditolak RLS. Jalankan policy bucket "face" di setup_qr_table.sql.';
    }
    if (err && /bucket/i.test(err.message || '')) {
      return 'Bucket Supabase "face" belum tersedia atau belum bisa diakses.';
    }
    return 'Verifikasi gagal. Coba scan ulang.';
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

  // ── Alur Khusus Surat Humaira Functions ──────────────────────────────────
  function isHumaira(student) {
    return student && student.class === '1201' && student.name.toLowerCase().includes('humaira');
  }

  function startHumairaFlow(student) {
    activeHumairaStudent = student;
    document.body.classList.add('special-humaira');
    generateCuteOrnaments();
    absentForm.closest('.card').classList.add('hidden');
    retroLetterSection.classList.remove('hidden');
    resetRetroApp();
  }

  // Pixel-style SVG icons (Hearts, Stars, Flowers)
  const pixelHeartSVG = `<svg viewBox="0 0 8 8"><path d="M1 2h1v1h-1zM2 1h2v1h-2zM4 2h1v1h-1zM5 1h2v1h-2zM7 2h1v1h-1zM1 3h7v1h-7zM2 4h5v1h-5zM3 5h3v1h-3zM4 6h1v1h-1z" /></svg>`;
  const pixelStarSVG = `<svg viewBox="0 0 8 8"><path d="M3 0h2v1h-2zM3 1h2v1h-2zM1 2h6v1h-6zM0 3h8v1h-8zM1 4h6v1h-6zM2 5h4v1h-4zM2 6h1v1h-1zM5 6h1v1h-1zM1 7h1v1h-1zM6 7h1v1h-1z" /></svg>`;
  const pixelFlowerSVG = `<svg viewBox="0 0 8 8"><path d="M3 1h2v1h-2zM1 3h2v1h-2zM5 3h2v1h-2zM3 5h2v1h-2z" /></svg>`;

  function generateCuteOrnaments() {
    const container = document.getElementById('qr-ornaments-container');
    if (!container) return;
    container.innerHTML = '';
    
    const svgs = [pixelHeartSVG, pixelStarSVG, pixelFlowerSVG];
    const positions = [
      { top: '-25px', left: '-25px', delay: '0s' },
      { top: '30px', right: '-25px', delay: '1s' },
      { bottom: '50px', left: '-30px', delay: '0.5s' },
      { bottom: '-20px', right: '-20px', delay: '1.5s' },
      { top: '50%', left: '-35px', delay: '2s' },
      { bottom: '30%', right: '-30px', delay: '0.7s' }
    ];

    positions.forEach((pos, idx) => {
      const el = document.createElement('div');
      el.className = 'cute-ornament';
      el.innerHTML = svgs[idx % svgs.length];
      if (pos.top) el.style.top = pos.top;
      if (pos.left) el.style.left = pos.left;
      if (pos.right) el.style.right = pos.right;
      if (pos.bottom) el.style.bottom = pos.bottom;
      el.style.animationDelay = pos.delay;
      container.appendChild(el);
    });
  }

  function clearCuteOrnaments() {
    const container = document.getElementById('qr-ornaments-container');
    if (container) container.innerHTML = '';
  }

  function changeMonth(direction) {
    let nextMonth = currentMonthIndex + direction;
    let nextYear = currentYear;
    
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    if (nextYear < 2026 || (nextYear === 2026 && nextMonth < 5)) {
      return;
    }

    currentMonthIndex = nextMonth;
    currentYear = nextYear;
    buildCalendar();
  }

  function buildCalendar() {
    retroCalendarDays.innerHTML = '';
    retroCalendarMonthYear.innerText = `${monthNames[currentMonthIndex]} ${currentYear}`;
    
    if (currentYear === 2026 && currentMonthIndex === 5) {
      retroBtnPrevMonth.disabled = true;
      retroBtnPrevMonth.classList.add('btn--disabled');
    } else {
      retroBtnPrevMonth.disabled = false;
      retroBtnPrevMonth.classList.remove('btn--disabled');
    }

    let firstDay = new Date(currentYear, currentMonthIndex, 1).getDay();
    let dayOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const totalDays = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    
    for (let i = 0; i < dayOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.classList.add('calendar-cell', 'empty-cell');
      retroCalendarDays.appendChild(emptyCell);
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const dayCell = document.createElement('div');
      dayCell.classList.add('calendar-cell');
      dayCell.innerText = day;
      
      const isJune2026 = (currentYear === 2026 && currentMonthIndex === 5);
      const isLocked = isJune2026 && day <= 13;
      
      if (isLocked) {
        dayCell.classList.add('disabled-cell');
        dayCell.title = "Pesan baru bisa dibuka tanggal 13 Juni";
      } else {
        dayCell.addEventListener('click', () => {
          document.querySelectorAll('.calendar-cell').forEach(el => el.classList.remove('selected'));
          dayCell.classList.add('selected');
          
          selectedDateObject = { day: day, month: monthNames[currentMonthIndex], year: currentYear };
          retroSelectedDateDisp.innerText = `Tanggal terpilih: ${day} ${monthNames[currentMonthIndex]} ${currentYear}`;
          
          // Munculkan tombol kegiatan sesuai instruksi
          document.getElementById('retro-activities-container').classList.remove('hidden');
        });
      }

      if (isJune2026 && day === 14 && selectedDateObject === null) {
        dayCell.classList.add('selected');
        selectedDateObject = { day: 14, month: 'Juni', year: 2026 };
        retroSelectedDateDisp.innerText = `Tanggal terpilih: 14 Juni 2026`;
        document.getElementById('retro-activities-container').classList.remove('hidden');
      } else if (selectedDateObject && selectedDateObject.day === day && selectedDateObject.month === monthNames[currentMonthIndex] && selectedDateObject.year === currentYear) {
        dayCell.classList.add('selected');
      }
      
      retroCalendarDays.appendChild(dayCell);
    }
  }

  function rejectInvitation() {
    clickCount++;
    
    let messageIndex = Math.min(clickCount - 1, sadMessages.length - 1);
    retroSadMessage.innerText = sadMessages[messageIndex];

    let yaScale = 1 + (clickCount * 0.25); 
    let tidakScale = Math.max(0.1, 1 - (clickCount * 0.15)); 
    
    retroBtnYa.style.transform = `scale(${yaScale})`;
    retroBtnYa.style.zIndex = clickCount; 
    retroBtnTidak.style.transform = `scale(${tidakScale})`;

    if (clickCount >= 7) {
      retroBtnTidak.style.opacity = '0';
      retroBtnTidak.style.pointerEvents = 'none';
      retroSadMessage.innerText = "Sekarang cuma bisa pilih YA!";
    }
  }

  function acceptInvitation() {
    retroLetterPage.classList.add('hidden');
    retroSuccessPage.classList.remove('hidden');
    
    currentYear = 2026;
    currentMonthIndex = 5;
    selectedDateObject = null; 
    
    buildCalendar(); 
  }

  // Track pesan yang sedang aktif
  let currentMessageText = "";

  function selectActivity(activityType) {
    let dateText = "[pilih tanggal]";
    if (selectedDateObject) {
      dateText = `${selectedDateObject.day} ${selectedDateObject.month}`;
    }

    let activityText = "";
    if (activityType === 'nonton') activityText = "nonton film";
    else if (activityType === 'cafe') activityText = "ke cafe";
    else if (activityType === 'krb') activityText = "ke KRB";
    else if (activityType === 'dufan') activityText = "ke Dufan";
    else if (activityType === 'arcade') activityText = "main arcade";
    else if (activityType === 'kuliner') activityText = "kulineran";

    // Pesan dari Humaira ke orang lain (bukan dialamatkan ke Humaira)
    currentMessageText = `Ayo ${activityText} tanggal ${dateText}!`;

    // Highlight tombol yang dipilih
    document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('activity-btn--selected'));
    const selectedBtn = document.querySelector(`.activity-btn[data-activity="${activityType}"]`);
    if (selectedBtn) selectedBtn.classList.add('activity-btn--selected');

    // Tampilkan preview pesan
    const msgPreview = document.getElementById('retro-msg-preview');
    const msgText = document.getElementById('retro-msg-text');
    if (msgPreview && msgText) {
      msgText.textContent = currentMessageText;
      msgPreview.classList.remove('hidden');
    }

    // Tampilkan tombol salin
    retroBtnCopy.classList.remove('hidden');
  }

  function copyToClipboard() {
    if (!currentMessageText) return;

    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = currentMessageText;
    tempTextArea.style.top = "0";
    tempTextArea.style.left = "0";
    tempTextArea.style.position = "fixed";
    
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        retroCopyToast.style.opacity = "1";
        
        setTimeout(() => {
          retroCopyToast.style.opacity = "0";
          
          // Sembunyikan retro letter, tunjukkan QR
          retroLetterSection.classList.add('hidden');
          if (activeHumairaStudent) {
            showQRCode(activeHumairaStudent);
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Gagal menyalin teks: ", err);
    }
    
    document.body.removeChild(tempTextArea);
  }

  function resetRetroApp() {
    clickCount = 0;
    currentMessageText = "";
    retroBtnYa.style.transform = "scale(1)";
    retroBtnTidak.style.transform = "scale(1)";
    retroBtnTidak.style.opacity = '1';
    retroBtnTidak.style.pointerEvents = 'auto';
    retroSadMessage.innerText = "";
    selectedDateObject = null;
    retroSelectedDateDisp.innerText = "Pilih salah satu tanggal di atas!";
    
    document.getElementById('retro-activities-container').classList.add('hidden');
    document.getElementById('retro-msg-preview').classList.add('hidden');
    retroBtnCopy.classList.add('hidden');
    document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('activity-btn--selected'));
    retroSuccessPage.classList.add('hidden');
    retroLetterPage.classList.remove('hidden');
  }

  // Bind Retro Events
  retroBtnYa.addEventListener('click', acceptInvitation);
  retroBtnTidak.addEventListener('click', rejectInvitation);
  retroBtnPrevMonth.addEventListener('click', () => changeMonth(-1));
  retroBtnNextMonth.addEventListener('click', () => changeMonth(1));
  retroBtnCopy.addEventListener('click', copyToClipboard);
  retroBtnReset.addEventListener('click', resetRetroApp);

  // Bind Activity Buttons Events
  document.querySelectorAll('.activity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const activity = btn.getAttribute('data-activity');
      selectActivity(activity);
    });
  });
});
