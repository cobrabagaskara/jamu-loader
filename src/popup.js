// ==================== POPUP.JS ====================
// Dashboard untuk manage modules

let modulesState = {};
let manifest = null;

// ============== INIT ==============
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Jamu Loader Popup: Initializing...');
  await loadModulesState();
  await renderModules();
  setupEventListeners();
  await updateTrackingStatus();
});

// ============== LOAD MODULES STATE ==============
async function loadModulesState() {
  try {
    // Get manifest dari background
    const response = await chrome.runtime.sendMessage({ action: 'GET_MANIFEST' });

    if (response && response.manifest) {
      manifest = response.manifest;
      console.log('✅ Manifest loaded in popup');
    } else {
      showError('Gagal memuat manifest. Pastikan koneksi internet tersedia.');
      return;
    }

    // Get modules state dari storage
    const result = await chrome.storage.local.get(['modulesState']);
    modulesState = result.modulesState || {};

    // Initialize state untuk modul baru
    let stateChanged = false;
    for (const moduleId in manifest.modules) {
      if (!modulesState[moduleId]) {
        const moduleConfig = manifest.modules[moduleId];
        modulesState[moduleId] = {
          enabled: moduleConfig.enabled_by_default === true,
          lastUpdated: Date.now()
        };
        stateChanged = true;
        console.log(`📦 New module "${moduleId}" initialized, enabled: ${moduleConfig.enabled_by_default === true}`);
      }
    }

    if (stateChanged) {
      await chrome.storage.local.set({ modulesState });
      console.log('✅ New modules state saved');
    }

    console.log('✅ Modules state loaded');
  } catch (error) {
    console.error('❌ Error loading modules state:', error);
    showError('Error memuat modules. Coba tutup dan buka kembali popup.');
  }
}

// ============== RENDER MODULES ==============
async function renderModules() {
  const modulesList = document.getElementById('modules-list');

  if (!manifest || !manifest.modules) {
    modulesList.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#444" stroke-width="2"/>
        </svg>
        <p>Tidak ada module tersedia</p>
      </div>
    `;
    return;
  }

  const modules = manifest.modules;
  const totalCount = Object.keys(modules).length;
  const activeCount = Object.values(modulesState).filter(m => m.enabled).length;

  // Update stats
  document.getElementById('total-count').textContent = totalCount;
  document.getElementById('active-count').textContent = activeCount;

  if (totalCount === 0) {
    modulesList.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#444" stroke-width="2"/>
        </svg>
        <p>Belum ada module yang dikonfigurasi</p>
      </div>
    `;
    return;
  }

  modulesList.innerHTML = Object.entries(modules).map(([moduleId, config]) => {
    const state = modulesState[moduleId] || { enabled: config.enabled_by_default === true };
    const isActive = state.enabled;
    const defaultBadge = config.enabled_by_default === true
      ? '<span class="badge badge-on">Default ON</span>'
      : '<span class="badge badge-off">Default OFF</span>';

    return `
      <div class="module-card" data-module-id="${moduleId}">
        <div class="module-info">
          <div class="module-name">
            ${config.name || moduleId}
            ${defaultBadge}
          </div>
          <div class="module-desc">${config.description || 'Tidak ada deskripsi'}</div>
          <div class="module-meta">
            <span>📌 v${config.version || '1.0.0'}</span>
            <span>📄 ${config.file}</span>
            ${config.author ? `<span>👤 ${config.author}</span>` : ''}
          </div>
        </div>
        <label class="toggle-switch" title="${isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}">
          <input type="checkbox" ${isActive ? 'checked' : ''} data-module-id="${moduleId}">
          <span class="slider"></span>
        </label>
      </div>
    `;
  }).join('');

  // Add event listeners ke semua toggle
  document.querySelectorAll('.toggle-switch input').forEach(toggle => {
    toggle.addEventListener('change', handleModuleToggle);
  });
}

// ============== HANDLE MODULE TOGGLE ==============
async function handleModuleToggle(event) {
  const moduleId = event.target.dataset.moduleId;
  const enabled = event.target.checked;
  const moduleConfig = manifest?.modules?.[moduleId];

  if (!moduleConfig) {
    console.error(`❌ Module config tidak ditemukan untuk: ${moduleId}`);
    return;
  }

  console.log(`🔄 Toggling module "${moduleId}": ${enabled ? 'ON' : 'OFF'}`);

  // Update state lokal
  modulesState[moduleId] = {
    enabled: enabled,
    lastUpdated: Date.now()
  };

  // Simpan ke storage
  await chrome.storage.local.set({ modulesState });

  // Beritahu background script
  await chrome.runtime.sendMessage({
    action: 'MODULE_TOGGLED',
    moduleId: moduleId,
    enabled: enabled
  });

  // Update stats
  const activeCount = Object.values(modulesState).filter(m => m.enabled).length;
  document.getElementById('active-count').textContent = activeCount;

  // Tampilkan feedback
  const defaultState = moduleConfig.enabled_by_default === true ? 'ON' : 'OFF';
  showNotification(
    `${moduleConfig.name || moduleId} ${enabled ? '✅ diaktifkan' : '⛔ dinonaktifkan'} (Default: ${defaultState})`,
    enabled ? 'success' : 'warning'
  );
}

// ============== SETUP EVENT LISTENERS ==============
function setupEventListeners() {
  // Reload button
  document.getElementById('reload-btn')?.addEventListener('click', async () => {
    console.log('🔄 Reloading all modules...');

    const btn = document.getElementById('reload-btn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Reloading...';

    try {
      await chrome.runtime.sendMessage({ action: 'RELOAD_ALL_MODULES' });
      await loadModulesState();
      await renderModules();
      showNotification('✅ Semua module berhasil di-reload!', 'success');
    } catch (error) {
      console.error('❌ Reload failed:', error);
      showNotification('❌ Reload gagal. Coba lagi.', 'error');
    } finally {
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }, 1000);
    }
  });

  // Settings button
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    // Cegah duplikasi jika menu sudah terbuka
    if (document.getElementById('settings-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    overlay.innerHTML = `
      <div style="
        background: #2d2d2d;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        min-width: 260px;
        border: 1px solid rgba(76,175,80,0.4);
      ">
        <h3 style="margin-bottom: 16px; color: #4CAF50; font-size: 15px;">⚙️ Settings</h3>
        <div style="margin-bottom: 12px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" id="show-default-badge" checked>
            <span>Tampilkan badge status default</span>
          </label>
        </div>
        <div style="margin-bottom: 8px;">
          <button id="reset-state-btn" style="
            width: 100%;
            padding: 8px;
            background: #3a3a3a;
            border: 1px solid #555;
            border-radius: 6px;
            color: #e0e0e0;
            cursor: pointer;
            font-size: 13px;
          ">🗑️ Reset semua state module</button>
        </div>
        <div style="margin-bottom: 12px;">
          <button id="reset-notice-btn" style="
            width: 100%;
            padding: 8px;
            background: #3a3a3a;
            border: 1px solid #555;
            border-radius: 6px;
            color: #FF9800;
            cursor: pointer;
            font-size: 13px;
          ">🔔 Reset first-run notice (testing)</button>
        </div>
        <div style="
          margin-bottom: 12px;
          padding: 10px;
          background: #1a1a1a;
          border-radius: 6px;
          font-size: 11px;
          color: #888;
          line-height: 1.6;
        ">
          📊 <strong style="color:#ccc">Tracking aktif.</strong><br>
          Aktivitas modul dicatat untuk monitoring internal.<br>
          Data tidak disebarkan ke pihak lain.
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button id="close-settings" style="
            padding: 8px 16px;
            background: #4CAF50;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 13px;
          ">Tutup</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Tutup dengan klik overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById('close-settings').addEventListener('click', () => {
      overlay.remove();
    });

    document.getElementById('show-default-badge').addEventListener('change', (e) => {
      document.querySelectorAll('.badge').forEach(badge => {
        badge.style.display = e.target.checked ? 'inline' : 'none';
      });
    });

    document.getElementById('reset-state-btn').addEventListener('click', async () => {
      if (!confirm('Reset semua state module ke default? Tindakan ini tidak bisa dibatalkan.')) return;
      await chrome.storage.local.remove('modulesState');
      modulesState = {};
      await loadModulesState();
      await renderModules();
      overlay.remove();
      showNotification('✅ State module direset ke default', 'success');
    });
  });
}


// ============== STATUS TRACKING ==============
async function updateTrackingStatus() {
  try {
    const result = await chrome.storage.local.get(['firstRunNoticeSeen']);
    const statusText = document.querySelector('.status-text');
    if (!statusText) return;

    if (result.firstRunNoticeSeen) {
      statusText.innerHTML = 'Ready &nbsp;·&nbsp; <span style="color:#4CAF50;font-size:11px;">📊 Tracking aktif</span>';
    } else {
      statusText.innerHTML = 'Ready &nbsp;·&nbsp; <span style="color:#FF9800;font-size:11px;">⏳ Menunggu first-run notice</span>';
    }
  } catch (e) {
    // abaikan
  }
}

// ============== NOTIFICATION ==============
function showNotification(message, type = 'info') {
  const colors = {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3'
  };

  // Hapus notifikasi sebelumnya jika ada
  document.querySelectorAll('.jamu-notif').forEach(n => n.remove());

  const notification = document.createElement('div');
  notification.className = 'jamu-notif';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #2d2d2d;
    color: white;
    padding: 12px 24px;
    border-radius: 30px;
    font-size: 13px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    border-left: 4px solid ${colors[type] || colors.info};
    animation: slideUp 0.3s ease;
    max-width: 90%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  if (!document.querySelector('#notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to   { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(20px)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============== ERROR DISPLAY ==============
function showError(message) {
  const modulesList = document.getElementById('modules-list');
  if (modulesList) {
    modulesList.innerHTML = `
      <div class="empty-state" style="color: #ff5252;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#ff5252" stroke-width="2"/>
          <path d="M12 8V12" stroke="#ff5252" stroke-width="2"/>
          <circle cx="12" cy="16" r="1.5" fill="#ff5252"/>
        </svg>
        <p>${message}</p>
        <button onclick="location.reload()" style="
          margin-top: 16px;
          padding: 8px 24px;
          background: #4CAF50;
          border: none;
          border-radius: 20px;
          color: white;
          cursor: pointer;
          font-size: 13px;
        ">Coba Lagi</button>
      </div>
    `;
  }
  document.getElementById('total-count').textContent = '0';
  document.getElementById('active-count').textContent = '0';
}
