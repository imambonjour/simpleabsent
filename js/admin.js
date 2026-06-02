/**
 * Admin Page Logic
 * ================
 * Handles: password auth, CSV upload/preview/import, dashboard stats, student table
 * Semua data dari Supabase (real DB).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Auth elements
  const authSection    = document.getElementById('auth-section');
  const dashSection    = document.getElementById('dashboard-section');
  const authForm       = document.getElementById('auth-form');
  const authError      = document.getElementById('auth-error');
  const inputPassword  = document.getElementById('input-password');
  const btnLogout      = document.getElementById('btn-logout');

  // Stats elements
  const statTotal     = document.getElementById('stat-total');
  const statClaimed   = document.getElementById('stat-claimed');
  const statUnclaimed = document.getElementById('stat-unclaimed');
  const statPercent   = document.getElementById('stat-percent');
  const progressBar   = document.getElementById('progress-bar');
  const progressText  = document.getElementById('progress-text');

  // Upload elements
  const uploadArea      = document.getElementById('upload-area');
  const csvInput        = document.getElementById('csv-input');
  const csvPreview      = document.getElementById('csv-preview');
  const csvCount        = document.getElementById('csv-count');
  const csvErrors       = document.getElementById('csv-errors');
  const csvTbody        = document.getElementById('csv-tbody');
  const btnCancelUpload = document.getElementById('btn-cancel-upload');
  const btnConfirmUpload = document.getElementById('btn-confirm-upload');

  // Table elements
  const studentTbody = document.getElementById('student-tbody');
  const emptyState   = document.getElementById('empty-state');
  const searchInput  = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');

  let parsedCSVRows = [];
  let allStudents   = [];

  // Init session check
  checkSession();

  // ========================
  // Authentication
  // ========================
  function checkSession() {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      showDashboard();
    }
  }

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = inputPassword.value;

    if (!ADMIN_PASSWORD) {
      authError.textContent = 'Konfigurasi admin belum tersedia. Generate js/env.js dari .env.';
      authError.classList.add('active');
      showToast('Konfigurasi admin belum tersedia', 'error');
      return;
    }

    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      authError.textContent = '';
      authError.classList.remove('active');
      showDashboard();
    } else {
      authError.textContent = 'Password salah!';
      authError.classList.add('active');
      inputPassword.value = '';
      inputPassword.focus();
      showToast('Password salah', 'error');
    }
  });

  function showDashboard() {
    authSection.classList.add('hidden');
    dashSection.classList.remove('hidden');
    refreshDashboard();
  }

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin_auth');
    dashSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    inputPassword.value = '';
    showToast('Berhasil logout', 'info');
  });

  // ========================
  // Dashboard Stats (Supabase)
  // ========================
  async function refreshDashboard() {
    try {
      const db = getDB();
      if (!db) {
        showToast('Koneksi Supabase gagal — periksa config', 'error');
        return;
      }

      // Fetch semua siswa
      const { data, error } = await db
        .from('siswa')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('[admin] refreshDashboard error:', error);
        showToast('Gagal memuat data: ' + (error.message || error.code), 'error');
        return;
      }

      allStudents = data || [];

      const total     = allStudents.length;
      const claimed   = allStudents.filter(s => s.claimed).length;
      const unclaimed = total - claimed;
      const percent   = total > 0 ? Math.round((claimed / total) * 100) : 0;

      animateValue(statTotal, total);
      animateValue(statClaimed, claimed);
      animateValue(statUnclaimed, unclaimed);
      statPercent.textContent = `${percent}%`;
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${claimed} / ${total}`;

      renderStudents(allStudents);

    } catch (err) {
      console.error('[admin] unexpected error:', err);
      showToast('Terjadi kesalahan tidak terduga', 'error');
    }
  }

  function animateValue(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target; return; }

    const duration  = 500;
    const startTime = performance.now();

    function update(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(current + (target - current) * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ========================
  // CSV Upload
  // ========================
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('upload-area--dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('upload-area--dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('upload-area--dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleCSVFile(file);
  });

  csvInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleCSVFile(file);
  });

  function handleCSVFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('File harus berformat .csv', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);

      if (result.errors.length > 0) {
        csvErrors.innerHTML = result.errors.map(err => `<div style="display: flex; align-items: center; gap: 6px;"><i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i> ${err}</div>`).join('');
        if (window.lucide) window.lucide.createIcons();
        csvErrors.classList.remove('hidden');
      } else {
        csvErrors.classList.add('hidden');
      }

      if (result.rows.length === 0) {
        showToast('Tidak ada data valid dalam CSV', 'warning');
        return;
      }

      parsedCSVRows = result.rows;
      renderCSVPreview(result.rows);
      csvPreview.classList.remove('hidden');
      csvCount.textContent = `${result.rows.length} baris`;
      showToast(`${result.rows.length} data siap diimport`, 'info');
    };

    reader.onerror = () => showToast('Gagal membaca file', 'error');
    reader.readAsText(file);
  }

  function renderCSVPreview(rows) {
    csvTbody.innerHTML = '';
    const maxPreview = Math.min(rows.length, 20);

    for (let i = 0; i < maxPreview; i++) {
      const row = rows[i];
      const tr  = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td><code style="font-size:var(--text-xs);background:var(--warm-100);padding:2px 6px;border-radius:4px;">${escapeHTML(row.id)}</code></td>
        <td>${escapeHTML(row.nama)}</td>
      `;
      csvTbody.appendChild(tr);
    }

    if (rows.length > maxPreview) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="text-align:center;color:var(--warm-400);">... dan ${rows.length - maxPreview} baris lainnya</td>`;
      csvTbody.appendChild(tr);
    }
  }

  btnCancelUpload.addEventListener('click', () => {
    csvPreview.classList.add('hidden');
    parsedCSVRows = [];
    csvInput.value = '';
  });

  btnConfirmUpload.addEventListener('click', async () => {
    if (parsedCSVRows.length === 0) return;

    btnConfirmUpload.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="display:inline-block; vertical-align:middle; width:16px; height:16px; margin-right:6px;"></i> Mengimport...';
    if (window.lucide) window.lucide.createIcons();
    btnConfirmUpload.disabled = true;

    try {
      const db = getDB();
      if (!db) throw new Error('Koneksi Supabase tidak tersedia');

      // Upsert: insert baru, skip jika id sudah ada (on conflict do nothing)
      const rows = parsedCSVRows.map(row => ({
        id:   row.id,
        nama: row.nama,
        // qr_token dibuat otomatis oleh database (DEFAULT gen_random_uuid())
      }));

      // Kirim dalam batch 100 row (antisipasi limit payload)
      const BATCH = 100;
      let totalInserted = 0;
      let totalSkipped  = 0;

      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { data, error } = await db
          .from('siswa')
          .upsert(batch, {
            onConflict: 'id',
            ignoreDuplicates: true,   // skip jika id sudah ada
          })
          .select('id');

        if (error) {
          console.error('[admin] upsert error:', error);
          throw error;
        }

        totalInserted += (data || []).length;
        totalSkipped  += batch.length - (data || []).length;
      }

      showToast(`${totalInserted} data berhasil diimport! (${totalSkipped} duplikat dilewati)`, 'success');

      // Reset upload area
      csvPreview.classList.add('hidden');
      parsedCSVRows = [];
      csvInput.value = '';

      // Refresh dashboard
      await refreshDashboard();

    } catch (err) {
      console.error('[admin] import error:', err);
      showToast('Gagal mengimport: ' + (err.message || 'Error tidak diketahui'), 'error');
    } finally {
      btnConfirmUpload.innerHTML = '<i data-lucide="check" style="display:inline-block; vertical-align:middle; width:16px; height:16px; margin-right:6px;"></i> Import ke Database';
      if (window.lucide) window.lucide.createIcons();
      btnConfirmUpload.disabled = false;
    }
  });

  // ========================
  // Student Table (filter lokal dari allStudents)
  // ========================
  function renderStudents(students) {
    const search = searchInput.value.toLowerCase().trim();
    const filter = filterStatus.value;

    let filtered = [...students];

    if (search) {
      filtered = filtered.filter(s =>
        s.nama.toLowerCase().includes(search) ||
        s.id.toLowerCase().includes(search)
      );
    }

    if (filter === 'claimed') {
      filtered = filtered.filter(s => s.claimed);
    } else if (filter === 'unclaimed') {
      filtered = filtered.filter(s => !s.claimed);
    }

    if (filtered.length === 0) {
      studentTbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    studentTbody.innerHTML = '';

    filtered.forEach((s, i) => {
      const tr = document.createElement('tr');
      const statusBadge = s.claimed
        ? '<span class="badge badge--success" style="display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Sudah</span>'
        : '<span class="badge badge--warning" style="display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="clock" style="width: 14px; height: 14px;"></i> Belum</span>';

      tr.innerHTML = `
        <td>${i + 1}</td>
        <td><code style="font-size:var(--text-xs);background:var(--warm-100);padding:2px 6px;border-radius:4px;">${escapeHTML(s.id)}</code></td>
        <td style="font-weight:500;color:var(--warm-800);">${escapeHTML(s.nama)}</td>
        <td>${statusBadge}</td>
        <td style="font-size:var(--text-xs);color:var(--warm-400);">${formatDate(s.claimed_at)}</td>
      `;
      studentTbody.appendChild(tr);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  searchInput.addEventListener('input',   () => renderStudents(allStudents));
  filterStatus.addEventListener('change', () => renderStudents(allStudents));

  // ========================
  // Utilities
  // ========================
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
