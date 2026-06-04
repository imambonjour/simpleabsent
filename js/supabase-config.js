/**
 * Supabase Configuration
 * ======================
 * File ini adalah satu-satunya tempat konfigurasi koneksi Supabase.
 * Semua halaman (index, admin, scan) menggunakan variabel dari sini.
 */

// ========================
// KONFIGURASI UTAMA
// ========================
// Browser tidak bisa membaca .env langsung. Jalankan:
//   node scripts/generate-env.mjs
// untuk membuat js/env.js dari .env sebelum membuka halaman.
const APP_CONFIG = window.APP_CONFIG || {};
const SUPABASE_URL = APP_CONFIG.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = APP_CONFIG.SUPABASE_ANON_KEY || '';
const ADMIN_PASSWORD = APP_CONFIG.ADMIN_PASSWORD || '';

// ========================
// INISIALISASI CLIENT
// ========================
// Gunakan namespace window.supabase dari CDN — jangan redeclare 'supabase'
let _db = null;

function getDB() {
  if (_db) return _db;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[supabase-config] Konfigurasi Supabase belum tersedia. Generate js/env.js dari .env.');
    return null;
  }

  // window.supabase diset oleh CDN @supabase/supabase-js
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    _db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _db;
  }

  console.error('[supabase-config] Supabase CDN belum dimuat!');
  return null;
}

// ========================
// TOAST NOTIFICATION
// ========================
function showToast(message, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<i data-lucide="check-circle-2"></i>',
    error: '<i data-lucide="x-circle"></i>',
    warning: '<i data-lucide="alert-triangle"></i>',
    info: '<i data-lucide="info"></i>'
  };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ========================
// CSV PARSER
// ========================
function parseCSV(text) {
  console.log('[parseCSV] Total bytes:', text.length);
  
  // Normalize line endings
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  console.log('[parseCSV] Total lines detected:', lines.length);
  
  if (lines.length < 2) {
    return { headers: [], rows: [], errors: ['File CSV kosong atau hanya ada header'] };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const required = ['id', 'nama'];
  const missing = required.filter(r => !headers.includes(r));

  if (missing.length > 0) {
    return { headers, rows: [], errors: [`Kolom wajib tidak ditemukan: ${missing.join(', ')}. Header harus: id,nama`] };
  }

  const idIdx   = headers.indexOf('id');
  const namaIdx = headers.indexOf('nama');
  const rows    = [];
  const errors  = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Sederhana: split by comma, gabungkan sisa untuk nama (antisipasi nama dengan koma)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length < 2) {
      errors.push(`Baris ${i + 1}: format tidak sesuai`);
      continue;
    }

    const id   = values[idIdx];
    const nama = values.slice(namaIdx).join(',').trim();

    if (!id || !nama) {
      errors.push(`Baris ${i + 1}: id atau nama kosong`);
      continue;
    }

    rows.push({ id, nama });
  }

  console.log('[parseCSV] Parsing complete - Rows:', rows.length, 'Errors:', errors.length);
  if (errors.length > 0) {
    console.warn('[parseCSV] Errors:', errors);
  }

  return { headers, rows, errors };
}

// ========================
// UTILITIES
// ========================
function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
