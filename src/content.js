// ==================== CONTENT.JS ====================
// Bridge: kirim PAGE_READY + userInfo ke background
console.log('🚀 Jamu Loader: Extension active');

// ============== AMBIL IDENTITAS PENGGUNA ==============
function getUserInfo() {
  let username = '-';
  let hostname = '-';

  try {
    // Username: ambil dari teks #menu_user di navbar ePuskesmas
    const menuUser = document.getElementById('menu_user');
    if (menuUser) {
      // Clone agar bisa buang child <span> (label & caret) tanpa merusak DOM
      const clone = menuUser.cloneNode(true);
      clone.querySelectorAll('span').forEach(s => s.remove());
      username = clone.textContent.trim() || '-';
    }
  } catch (e) {
    console.warn('⚠️ Gagal ambil username:', e.message);
  }

  try {
    // Hostname: kombinasi platform + potongan user-agent sebagai fingerprint ringan
    const platform = navigator.platform || 'unknown';
    const ua = navigator.userAgent.substring(0, 80);
    hostname = `${platform} | ${ua}`;
  } catch (e) {
    console.warn('⚠️ Gagal ambil hostname:', e.message);
  }

  return { username, hostname };
}

// ============== KIRIM PAGE_READY + USERINFO ==============
const userInfo = getUserInfo();
console.log(`👤 Jamu Loader: User terdeteksi = "${userInfo.username}"`);

chrome.runtime.sendMessage({
  action:   'PAGE_READY',
  url:      window.location.href,
  username: userInfo.username,
  hostname: userInfo.hostname,
}, (response) => {
  if (chrome.runtime.lastError) {
    console.warn('⚠️ Jamu Loader: Background belum siap -', chrome.runtime.lastError.message);
    return;
  }
  if (response?.success) {
    console.log('✅ Jamu Loader: Background notified, modules sedang dimuat...');
  }
});
