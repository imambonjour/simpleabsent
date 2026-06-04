/**
 * Scanner Page Logic
 * ==================
 * Handles: camera QR scanning, manual token input, claim validation, scan history
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Scanner elements
  const btnStartScan = document.getElementById('btn-start-scan');
  const btnStopScan  = document.getElementById('btn-stop-scan');
  const scannerStatus = document.getElementById('scanner-status');
  const scanResultContainer = document.getElementById('scan-result-container');

  // Manual input elements
  const manualToken     = document.getElementById('manual-token');
  const btnManualCheck  = document.getElementById('btn-manual-check');

  // Stats elements
  const scanCount   = document.getElementById('scan-count');
  const scanTotal   = document.getElementById('scan-total');
  const scanPercent = document.getElementById('scan-percent');

  // History elements
  const scanHistory      = document.getElementById('scan-history');
  const btnClearHistory  = document.getElementById('btn-clear-history');

  let html5QrCode = null;
  let isScanning = false;
  let scanHistoryLog = [];
  let lastScannedToken = '';
  let scanCooldown = false;
  let isStartingScanner = false;

  // Init
  renderInitialScannerStatus();
  refreshStats();

  // ========================
  // QR Scanner
  // ========================
  btnStartScan.addEventListener('click', startScanner);
  btnStopScan.addEventListener('click', stopScanner);

  async function startScanner() {
    if (isScanning || isStartingScanner) return;

    isStartingScanner = true;
    btnStartScan.disabled = true;
    setScannerStatus('Meminta izin kamera...', 'info');

    try {
      if (!window.Html5Qrcode || !window.Html5QrcodeSupportedFormats) {
        throw new Error('Library scanner QR gagal dimuat. Periksa koneksi internet lalu refresh halaman.');
      }

      ensureCameraSupported();
      const cameraId = await getPreferredCameraId();

      if (!html5QrCode) {
        html5QrCode = new window.Html5Qrcode('scanner-reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1,
        formatsToSupport: [window.Html5QrcodeSupportedFormats.QR_CODE],
      };

      await html5QrCode.start(
        cameraId,
        config,
        onScanSuccess,
        onScanError
      );

      isScanning = true;
      btnStartScan.classList.add('hidden');
      btnStopScan.classList.remove('hidden');
      setScannerStatus('Scanner aktif. Arahkan kamera ke QR siswa.', 'success');
      showToast('Scanner aktif', 'info');

    } catch (err) {
      console.error('Scanner error:', err);
      showCameraError(err);
    } finally {
      isStartingScanner = false;
      btnStartScan.disabled = false;
    }
  }

  async function stopScanner() {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
      } catch (e) {
        // Ignore stop errors
      }
      isScanning = false;
      btnStopScan.classList.add('hidden');
      btnStartScan.classList.remove('hidden');
      setScannerStatus('Scanner dihentikan.', 'info');
      showToast('Scanner dihentikan', 'info');
    }
  }

  function renderInitialScannerStatus() {
    if (!isCameraSecureOrigin()) {
      setScannerStatus(
        'Kamera tidak bisa aktif dari alamat HTTP biasa. Buka lewat HTTPS, atau gunakan http://localhost di perangkat yang sama.',
        'warning'
      );
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerStatus('Browser ini tidak mendukung akses kamera. Coba Chrome/Firefox terbaru.', 'error');
      return;
    }

    setScannerStatus('Tekan Mulai Scan untuk meminta izin kamera.', 'info');
  }

  function ensureCameraSupported() {
    if (!isCameraSecureOrigin()) {
      throw new Error('Kamera hanya tersedia di HTTPS atau localhost. Android tidak akan meminta izin kamera dari HTTP IP lokal.');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser tidak mendukung akses kamera.');
    }
  }

  async function getPreferredCameraId() {
    const cameras = await window.Html5Qrcode.getCameras();

    if (!cameras || cameras.length === 0) {
      throw new Error('Kamera tidak ditemukan di perangkat ini.');
    }

    const backCamera = cameras.find(camera => {
      const label = (camera.label || '').toLowerCase();
      return label.includes('back') ||
        label.includes('rear') ||
        label.includes('environment') ||
        label.includes('belakang');
    });

    return (backCamera || cameras[cameras.length - 1]).id;
  }

  function isCameraSecureOrigin() {
    return window.isSecureContext || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  }

  function showCameraError(err) {
    const message = getCameraErrorMessage(err);
    setScannerStatus(message, 'error');
    showToast(message, 'error', 6000);
  }

  function getCameraErrorMessage(err) {
    const name = err && err.name ? err.name : '';
    const message = err && err.message ? err.message : '';

    if (message) return message;
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Izin kamera ditolak. Buka pengaturan browser/site permission lalu izinkan kamera.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'Kamera tidak ditemukan di perangkat ini.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'Kamera sedang dipakai aplikasi lain atau tidak bisa dibuka.';
    }
    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return 'Kamera belakang tidak tersedia. Coba lagi atau gunakan input manual.';
    }
    if (name === 'SecurityError') {
      return 'Akses kamera diblokir karena halaman tidak dibuka lewat HTTPS.';
    }

    return 'Gagal mengakses kamera. Pastikan izin kamera diberikan.';
  }

  function setScannerStatus(message, type = 'info') {
    scannerStatus.textContent = message;
    scannerStatus.className = `scanner-status scanner-status--${type} mb-4`;
  }

  function onScanSuccess(decodedText) {
    if (scanCooldown) return;
    if (decodedText === lastScannedToken) return;

    scanCooldown = true;
    lastScannedToken = decodedText;

    if (navigator.vibrate) navigator.vibrate(100);

    processToken(decodedText);

    setTimeout(() => {
      scanCooldown = false;
      lastScannedToken = '';
    }, 2000);
  }

  function onScanError(errorMessage) {
    // Silently ignore
  }

  // ========================
  // Manual Input
  // ========================
  btnManualCheck.addEventListener('click', () => {
    const token = manualToken.value.trim();
    if (!token) {
      showToast('Masukkan token QR atau ID Siswa', 'warning');
      manualToken.focus();
      return;
    }
    processToken(token);
    manualToken.value = '';
  });

  manualToken.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnManualCheck.click();
    }
  });

  // ========================
  // Process Token / Student ID
  // ========================
  async function processToken(input) {
    try {
      const db = getDB();
      if (!db) throw new Error('Koneksi Supabase tidak tersedia');

      const { data, error } = await db.rpc('claim_konsumsi', { token: input });
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      if (!result) throw new Error('Response claim kosong');

      showScanResult(result);
      addToHistory(result);
      refreshStats();

    } catch (err) {
      console.error('Process token error:', err);
      showScanResult({
        success: false,
        message: 'Koneksi gagal. Coba lagi.',
        nama: ''
      });
    }
  }

  // ========================
  // Scan Result Display
  // ========================
  function showScanResult(result) {
    let type, icon, title, detail;

    if (result.success) {
      type = 'success';
      icon = '<i data-lucide="check-circle"></i>';
      title = 'Berhasil!';
      detail = `${result.nama}`;
      showToast(`${result.nama} berhasil diverifikasi`, 'success');
    } else if (result.message.includes('sudah')) {
      type = 'duplicate';
      icon = '<i data-lucide="alert-triangle"></i>';
      title = 'Sudah Diambil!';
      detail = result.nama ? `${result.nama}` : result.message;
      showToast('Konsumsi sudah diambil sebelumnya', 'warning');
    } else {
      type = 'invalid';
      icon = '<i data-lucide="x-circle"></i>';
      title = 'Tidak Valid';
      detail = result.message;
      showToast('QR Code tidak valid', 'error');
    }

    scanResultContainer.innerHTML = `
      <div class="scan-result scan-result--${type}">
        <div class="scan-result__icon" aria-hidden="true">${icon}</div>
        <div class="scan-result__title">${title}</div>
        <div class="scan-result__detail">${detail}</div>
      </div>
    `;
    scanResultContainer.classList.remove('hidden');

    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      scanResultContainer.innerHTML = '';
      scanResultContainer.classList.add('hidden');
    }, 4500);
  }

  // ========================
  // Scan History
  // ========================
  function addToHistory(result) {
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const entry = {
      time,
      nama: result.nama || '-',
      success: result.success,
      message: result.message,
    };

    scanHistoryLog.unshift(entry);
    renderHistory();
  }

  function renderHistory() {
    if (scanHistoryLog.length === 0) {
      scanHistory.innerHTML = `
        <div class="empty-state" style="padding: var(--space-4);">
          <div class="empty-state__icon" aria-hidden="true"><i data-lucide="clipboard-list"></i></div>
          <div class="empty-state__text" style="font-size: var(--text-sm);">Belum ada scan</div>
        </div>
      `;
      if (window.lucide) {
        window.lucide.createIcons();
      }
      return;
    }

    scanHistory.innerHTML = scanHistoryLog.map(entry => {
      const statusIcon = entry.success ? '<i data-lucide="check" style="width:16px; height:16px;"></i>' : (entry.message.includes('sudah') ? '<i data-lucide="alert-triangle" style="width:16px; height:16px;"></i>' : '<i data-lucide="x" style="width:16px; height:16px;"></i>');
      const statusColor = entry.success ? 'var(--success-icon)' : (entry.message.includes('sudah') ? 'var(--warning-icon)' : 'var(--error-icon)');

      return `
        <div class="scan-history-item">
          <span class="scan-history-item__time">${entry.time}</span>
          <span style="color: ${statusColor}; display: flex; align-items: center;">${statusIcon}</span>
          <span style="font-weight:500; color: var(--warm-800);">${escapeHTML(entry.nama)}</span>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  btnClearHistory.addEventListener('click', () => {
    scanHistoryLog = [];
    renderHistory();
    showToast('Riwayat dibersihkan', 'info');
  });

  // ========================
  // Stats
  // ========================
  async function refreshStats() {
    const db = getDB();
    if (!db) {
      scanCount.textContent = '0';
      scanTotal.textContent = '0';
      scanPercent.textContent = '0%';
      return;
    }

    try {
      const [{ count: total, error: totalError }, { count: claimed, error: claimedError }] = await Promise.all([
        db.from('QR').select('id', { count: 'exact', head: true }),
        db.from('QR').select('id', { count: 'exact', head: true }).eq('claimed', true),
      ]);

      if (totalError || claimedError) throw totalError || claimedError;

      const totalCount = total || 0;
      const claimedCount = claimed || 0;
      const percent = totalCount > 0 ? Math.round((claimedCount / totalCount) * 100) : 0;

      scanCount.textContent = claimedCount;
      scanTotal.textContent = totalCount;
      scanPercent.textContent = `${percent}%`;
    } catch (err) {
      console.error('Refresh stats error:', err);
      showToast('Gagal memuat statistik scan', 'error');
    }
  }

  // ========================
  // Utilities
  // ========================
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  window.addEventListener('beforeunload', () => {
    if (html5QrCode && isScanning) {
      html5QrCode.stop().catch(() => {});
    }
  });
});
