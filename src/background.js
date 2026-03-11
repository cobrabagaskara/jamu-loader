// ==================== BACKGROUND.JS ====================
// VERSI MULTIPLE MODULES LOADER - FIXED v2 + TRACKING + FIRST-RUN NOTICE
console.log('Jamu Loader Background: Active');

const GITHUB_BASE  = 'https://raw.githubusercontent.com/cobrabagaskara/jamu-loader/main';
const MANIFEST_URL = GITHUB_BASE + '/modules/global-manifest.json';

// ======================================================
// TRACKING CONFIG — isi setelah deploy Google Apps Script
// ======================================================
const TRACKING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzrmKI-yUDFeRG7K0USQ2UElROkRgJDE6NrbMM3Sj89v-qK8mhIKbZpdWd-unkhbMPnUg/exec';
const TRACKING_KEY      = 'Jamuloader2025';

// Cache
let manifest     = null;
let modulesCache = {};

// Lock per-tab: cegah double inject saat PAGE_READY + onUpdated trigger bersamaan
const injectionLock = {};

// ============================================================
// LOAD MANIFEST (dengan fallback ke cache lokal jika offline)
// ============================================================
async function loadManifest() {
  try {
    console.log('Jamu: Loading manifest...');
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    manifest = await res.json();
    await chrome.storage.local.set({ cachedManifest: manifest });
    console.log('Jamu: Manifest loaded - ' + Object.keys(manifest.modules).length + ' modules');
    return manifest;
  } catch (err) {
    console.warn('Jamu: GitHub offline, coba cache...', err.message);
    try {
      const r = await chrome.storage.local.get(['cachedManifest']);
      if (r.cachedManifest) {
        manifest = r.cachedManifest;
        console.log('Jamu: Manifest dari cache lokal');
        return manifest;
      }
    } catch (e) { /* abaikan */ }
    console.error('Jamu: Tidak ada manifest tersedia');
    return null;
  }
}

// ============================================================
// LOAD SINGLE MODULE SCRIPT
// ============================================================
async function loadModuleScript(moduleId, moduleConfig) {
  try {
    if (modulesCache[moduleId]) {
      return modulesCache[moduleId];
    }
    const url = GITHUB_BASE + '/modules/' + moduleConfig.file;
    const res  = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const code = await res.text();
    modulesCache[moduleId] = code;
    console.log('Jamu: Module ' + moduleId + ' downloaded (' + code.length + ' chars)');
    return code;
  } catch (err) {
    console.error('Jamu: Gagal load module ' + moduleId, err.message);
    return null;
  }
}

// ============================================================
// CEK APAKAH MODULE MATCH URL
// ============================================================
function shouldLoadModule(moduleConfig, currentUrl) {
  if (!moduleConfig.match || !Array.isArray(moduleConfig.match)) return false;
  for (const pattern of moduleConfig.match) {
    const re = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    if (re.test(currentUrl)) return true;
  }
  return false;
}

// ============================================================
// INJECT MODULE KE TAB
// ============================================================
async function injectModuleToTab(tabId, moduleId, scriptCode) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world:  'MAIN',
      func: function(mId, mCode) {
        try {
          var s   = document.createElement('script');
          s.textContent = mCode;
          s.id    = 'jamu-module-' + mId;
          (document.head || document.documentElement).appendChild(s);
          s.remove();
          console.log('Jamu: Module ' + mId + ' loaded');
        } catch (e) {
          console.error('Jamu: Module ' + mId + ' error', e);
        }
      },
      args: [moduleId, scriptCode]
    });
    return true;
  } catch (err) {
    console.error('Jamu: Inject ' + moduleId + ' gagal', err.message);
    return false;
  }
}

// ============================================================
// KIRIM DATA TRACKING KE GOOGLE SHEETS (silent)
// ============================================================
async function sendTrackingData(moduleId, moduleName, tabUrl, userInfo) {
  if (!TRACKING_ENDPOINT || TRACKING_ENDPOINT.indexOf('PASTE_URL') !== -1) return;
  try {
    await fetch(TRACKING_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key:        TRACKING_KEY,
        timestamp:  Date.now(),
        moduleId:   moduleId,
        moduleName: moduleName,
        url:        tabUrl,
        username:   userInfo.username || '-',
        hostname:   userInfo.hostname || '-'
      })
    });
    console.log('Jamu: Tracking sent - ' + moduleId + ' by ' + userInfo.username);
  } catch (err) {
    console.warn('Jamu: Tracking gagal (silent)', err.message);
  }
}

// ============================================================
// FIRST-RUN NOTICE — muncul sekali untuk pemberitahuan privasi
// ============================================================
async function maybeShowFirstRunNotice(tabId) {
  try {
    const r = await chrome.storage.local.get(['firstRunNoticeSeen']);
    if (r.firstRunNoticeSeen) return;

    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world:  'MAIN',
      func: function() {
        if (document.getElementById('jamu-first-run-notice')) return;

        var overlay = document.createElement('div');
        overlay.id = 'jamu-first-run-notice';
        overlay.style.cssText = [
          'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.6)',
          'z-index:9999999', 'display:flex', 'align-items:center',
          'justify-content:center', 'font-family:Arial,sans-serif'
        ].join(';');

        var box = document.createElement('div');
        box.style.cssText = [
          'background:#1e1e1e', 'border:1px solid rgba(76,175,80,0.5)',
          'border-radius:12px', 'padding:28px 32px', 'max-width:420px',
          'width:90%', 'box-shadow:0 8px 32px rgba(0,0,0,0.5)', 'color:#e0e0e0'
        ].join(';');

        var title = document.createElement('div');
        title.style.cssText = 'font-size:20px;margin-bottom:10px;font-weight:bold;color:#4CAF50';
        title.textContent = 'Jamu Loader';

        var subtitle = document.createElement('div');
        subtitle.style.cssText = 'font-size:14px;font-weight:600;color:#fff;margin-bottom:12px';
        subtitle.textContent = 'Pemberitahuan Penggunaan Data';

        var body = document.createElement('p');
        body.style.cssText = 'font-size:13px;line-height:1.7;color:#ccc;margin-bottom:20px';
        body.innerHTML =
          'Extension ini mencatat <strong style="color:#fff">nama akun</strong> dan ' +
          '<strong style="color:#fff">informasi perangkat</strong> Anda beserta ' +
          '<strong style="color:#fff">modul yang dijalankan</strong> untuk keperluan ' +
          'monitoring penggunaan internal.<br><br>' +
          'Data hanya digunakan oleh administrator Jamu Loader dan tidak disebarkan ke pihak lain.';

        var footer = document.createElement('div');
        footer.style.cssText = 'display:flex;justify-content:flex-end';

        var btn = document.createElement('button');
        btn.style.cssText = [
          'padding:10px 28px', 'background:#4CAF50', 'border:none',
          'border-radius:8px', 'color:white', 'font-size:14px',
          'font-weight:600', 'cursor:pointer'
        ].join(';');
        btn.textContent = 'Saya Mengerti';

        btn.addEventListener('click', function() {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.3s';
          setTimeout(function() { overlay.remove(); }, 300);
        });

        footer.appendChild(btn);
        box.appendChild(title);
        box.appendChild(subtitle);
        box.appendChild(body);
        box.appendChild(footer);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
      }
    });

    await chrome.storage.local.set({ firstRunNoticeSeen: true });
    console.log('Jamu: First-run notice ditampilkan');
  } catch (err) {
    console.warn('Jamu: First-run notice gagal', err.message);
    await chrome.storage.local.set({ firstRunNoticeSeen: true });
  }
}

// ============================================================
// NOTIFIKASI MODUL LOADED DI HALAMAN
// ============================================================
async function showInjectionNotification(tabId, moduleCount) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world:  'MAIN',
      func: function(count) {
        if (document.getElementById('jamu-loader-notif')) return;
        var n = document.createElement('div');
        n.id  = 'jamu-loader-notif';
        n.style.cssText = [
          'position:fixed', 'bottom:100px', 'right:20px',
          'background:#1B5E20', 'color:white', 'padding:12px 20px',
          'border-radius:8px', 'font-family:Arial', 'font-size:13px',
          'z-index:999999', 'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
          'border-left:4px solid #4CAF50'
        ].join(';');
        n.innerHTML = 'Jamu Loader<br>' + count + ' module(s) loaded';
        document.body.appendChild(n);
        setTimeout(function() { n.remove(); }, 3000);
      },
      args: [moduleCount]
    });
  } catch (err) { /* abaikan */ }
}

// ============================================================
// LOAD SEMUA MODULE YANG MATCH UNTUK TAB INI
// ============================================================
async function loadModulesForTab(tabId, tabUrl, userInfo) {
  userInfo = userInfo || {};

  // INJECTION LOCK: cegah double-run untuk tab + URL yang sama
  var lockKey = tabId + ':' + tabUrl;
  if (injectionLock[lockKey]) {
    console.log('Jamu: Lock aktif, skip tab ' + tabId);
    return;
  }
  injectionLock[lockKey] = true;
  setTimeout(function() { delete injectionLock[lockKey]; }, 10000);

  // Bersihkan lock lama untuk tab ini (navigasi berbeda)
  for (var k in injectionLock) {
    if (k !== lockKey && k.indexOf(tabId + ':') === 0) {
      delete injectionLock[k];
    }
  }

  // Tampilkan first-run notice jika belum pernah
  maybeShowFirstRunNotice(tabId);

  if (!manifest) await loadManifest();
  if (!manifest || !manifest.modules) {
    console.error('Jamu: Tidak ada manifest');
    delete injectionLock[lockKey];
    return;
  }

  var stateResult  = await chrome.storage.local.get(['modulesState']);
  var modulesState = stateResult.modulesState || {};
  var loadedCount  = 0;

  for (var moduleId in manifest.modules) {
    var moduleConfig = manifest.modules[moduleId];
    var moduleState  = modulesState[moduleId] || { enabled: moduleConfig.enabled_by_default === true };

    if (!moduleState.enabled) {
      console.log('Jamu: Skip ' + moduleId + ' (disabled)');
      continue;
    }

    if (shouldLoadModule(moduleConfig, tabUrl)) {
      console.log('Jamu: Match - ' + moduleId);
      var scriptCode = await loadModuleScript(moduleId, moduleConfig);
      if (scriptCode) {
        var ok = await injectModuleToTab(tabId, moduleId, scriptCode);
        if (ok) {
          loadedCount++;
          sendTrackingData(moduleId, moduleConfig.name || moduleId, tabUrl, userInfo);
        }
      }
    }
  }

  console.log('Jamu: ' + loadedCount + ' modules loaded for tab ' + tabId);
  if (loadedCount > 0) await showInjectionNotification(tabId, loadedCount);

  delete injectionLock[lockKey];
}

// ============================================================
// MESSAGE HANDLER
// ============================================================
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) {

    case 'PAGE_READY':
      if (sender.tab && request.url) {
        var userInfo = { username: request.username || '-', hostname: request.hostname || '-' };
        loadModulesForTab(sender.tab.id, request.url, userInfo);
      }
      sendResponse({ success: true });
      break;

    case 'GET_MANIFEST':
      sendResponse({ manifest: manifest });
      break;

    case 'MODULE_TOGGLED':
      if (!request.enabled && modulesCache[request.moduleId]) {
        delete modulesCache[request.moduleId];
      }
      sendResponse({ success: true });
      break;

    case 'RELOAD_ALL_MODULES':
      modulesCache = {};
      loadManifest().then(function() { sendResponse({ success: true }); });
      return true;

    case 'RESET_FIRST_RUN':
      chrome.storage.local.remove('firstRunNoticeSeen').then(function() {
        sendResponse({ success: true });
      });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  return true;
});

// Fallback onUpdated — injection lock menjamin tidak double-inject
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.indexOf('cirebon.epuskesmas.id') !== -1) {
    loadModulesForTab(tabId, tab.url, {});
  }
});

// ============================================================
// INIT
// ============================================================
async function init() {
  console.log('Jamu Loader: Initializing...');
  await loadManifest();
  console.log('Jamu Loader: Ready');
}

init();
