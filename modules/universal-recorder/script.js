(function () {
  'use strict';

  console.log('🟢 Skrining Recorder v1.5.2 loaded (with FIXED Auto-Trim)');

  // =========================
  // STATE & CONFIG
  // =========================
  const recorder = {
    url: '',
    skrining: '',
    judul: '',
    actions: [],
    conditions: {
      gender: 'Both',
      minAge: null,
      maxAge: null,
      notes: ''
    },
    lastValues: new Map()
  };

  const CONFIG = {
    DEBOUNCE_MS: 500,
    CHECK_INTERVAL: 500
  };

  // =========================
  // HELPERS
  // =========================
  const now = () => new Date().toISOString();

  function getJudul() {
    const el = document.querySelector('.action-header div');
    return el ? el.textContent.trim() : '';
  }

  // Extract patient ID from URL
  function extractPatientIdFromUrl() {
    const url = window.location.href;

    const match1 = url.match(/\/create\/(\d+)/);
    if (match1) return match1[1];

    const match2 = url.match(/\/skrining\/[^/]+\/(\d+)/);
    if (match2) return match2[1];

    const match3 = url.match(/skrining[^/]+\/create\/(\d+)/);
    if (match3) return match3[1];

    const match4 = url.match(/\/skrining\/[^/]+\/create\/(\d+)/);
    if (match4) return match4[1];

    return null;
  }

  // Auto-detect patient conditions from localStorage
  function autoDetectConditions() {
    const patientId = extractPatientIdFromUrl();
    if (!patientId) return null;

    const patientData = JSON.parse(localStorage.getItem(`pasien_${patientId}`));
    if (!patientData) return null;

    return {
      gender: patientData.gender || 'Both',
      minAge: patientData.usia || null,
      maxAge: patientData.usia || null,
      notes: `Recorded untuk ${patientData.gender || 'pasien'}, usia ${patientData.usia || '?'} tahun`
    };
  }

  // ✅ FIXED AUTO-TRIM: Helper untuk trim string
  function trimString(str) {
    if (typeof str !== 'string') return str;
    return str.trim();
  }

  // ✅ FIXED: Helper untuk clean object (trim semua keys & values)
  function cleanObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    }

    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const cleanKey = trimString(key);
        const cleanValue = cleanObject(obj[key]);
        cleaned[cleanKey] = cleanValue;
      }
    }
    return cleaned;
  }

  function record(action) {
    const key = `${action.type}_${action.name}`;
    const lastValue = recorder.lastValues.get(key);

    if (lastValue === action.value) {
      console.log('⏭️ Skipped duplicate:', action.name);
      return;
    }

    recorder.lastValues.set(key, action.value);

    const record = {
      ...action,
      time: now()
    };

    recorder.actions.push(record);
    console.log('📌 Recorded:', record);
  }

  // =========================
  // DEBOUNCE HELPER
  // =========================
  const debouncedInputs = new Map();

  function debounceInput(name, value, callback) {
    if (debouncedInputs.has(name)) {
      clearTimeout(debouncedInputs.get(name));
    }

    const timeout = setTimeout(() => {
      callback({ type: 'setValue', name, value });
      debouncedInputs.delete(name);
    }, CONFIG.DEBOUNCE_MS);

    debouncedInputs.set(name, timeout);
  }

  // =========================
  // RECORDER EVENTS
  // =========================
  function setupEventListeners() {
    document.addEventListener('change', e => {
      const el = e.target;

      if (el.type === 'radio' && el.checked) {
        record({ type: 'setRadio', name: el.name, value: el.value });
      }

      if (el.type === 'checkbox') {
        record({
          type: 'setCheckbox',
          name: el.name,
          value: el.checked ? 'checked' : 'unchecked'
        });
      }

      if (el.tagName === 'SELECT') {
        record({ type: 'setValue', name: el.name, value: el.value });
      }
    }, true);

    document.addEventListener('input', e => {
      const el = e.target;

      if (
        (el.tagName === 'INPUT' && ['text', 'number', 'tel', 'email'].includes(el.type)) ||
        el.tagName === 'TEXTAREA'
      ) {
        if (!el.value.trim()) return;
        debounceInput(el.name, el.value, record);
      }
    }, true);

    window.addEventListener('beforeunload', () => {
      debouncedInputs.forEach((timeout, name) => {
        clearTimeout(timeout);
        debouncedInputs.delete(name);
      });
    });
  }

  // =========================
  // BUTTON MANAGEMENT
  // =========================
  function updateButtonCounter() {
    const btn = document.getElementById('btn-export-preset');
    if (btn) {
      btn.textContent = `💾 Simpan Preset (${recorder.actions.length})`;
    }
  }

  function ensureButton() {
    let btn = document.getElementById('btn-export-preset');

    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btn-export-preset';
      btn.textContent = '💾 Simpan Preset (0)';
      Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999999,
        padding: '12px 16px',
        background: '#28a745',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease'
      });

      btn.onmouseenter = () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
      };

      btn.onmouseleave = () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      };

      btn.onclick = exportPreset;
      document.body.appendChild(btn);

      console.log('✅ Tombol Simpan Preset dipasang');
    }

    updateButtonCounter();
  }

  // =========================
  // EXPORT WITH FIXED AUTO-TRIM
  // =========================
  let isExporting = false;

  function promptForConditions(autoDetected = null) {
    const defaultGender = trimString(autoDetected?.gender) || 'Perempuan';
    const defaultMinAge = autoDetected?.minAge !== null ? autoDetected.minAge : '';
    const defaultMaxAge = autoDetected?.maxAge !== null ? autoDetected.maxAge : '';
    const defaultNotes = trimString(autoDetected?.notes) || '';

    const gender = prompt(
      'Jenis Kelamin (Laki-laki/Perempuan/Both):',
      defaultGender
    );

    if (gender === null) return null;

    const minAge = prompt(
      'Usia minimal (kosongkan jika tidak ada):',
      defaultMinAge
    );

    if (minAge === null) return null;

    const maxAge = prompt(
      'Usia maksimal (kosongkan jika tidak ada):',
      defaultMaxAge
    );

    if (maxAge === null) return null;

    const notes = prompt(
      'Catatan template (opsional):',
      defaultNotes
    );

    if (notes === null) return null;

    return {
      gender: trimString(gender) || 'Both',
      minAge: minAge.trim() ? parseInt(minAge.trim()) : null,
      maxAge: maxAge.trim() ? parseInt(maxAge.trim()) : null,
      notes: trimString(notes) || ''
    };
  }

  function exportPreset() {
    if (isExporting) return;

    if (!recorder.actions.length) {
      alert('⚠️ Belum ada data terekam!');
      return;
    }

    const autoDetected = autoDetectConditions();

    if (autoDetected) {
      console.log('🔍 Auto-detected conditions:', autoDetected);
      const confirmAuto = confirm(
        `Data pasien terdeteksi:\n` +
        `Gender: ${autoDetected.gender}\n` +
        `Usia: ${autoDetected.minAge} tahun\n\n` +
        `Gunakan data ini sebagai kondisi template? (Cancel untuk input manual)`
      );

      if (confirmAuto) {
        recorder.conditions = {
          gender: trimString(autoDetected.gender),
          minAge: autoDetected.minAge,
          maxAge: autoDetected.maxAge,
          notes: trimString(autoDetected.notes)
        };
      } else {
        const manualConditions = promptForConditions(autoDetected);
        if (!manualConditions) {
          console.log('Export dibatalkan');
          return;
        }
        recorder.conditions = manualConditions;
      }
    } else {
      console.log('ℹ️ No patient data found, prompting manual input');
      const manualConditions = promptForConditions();
      if (!manualConditions) {
        console.log('Export dibatalkan');
        return;
      }
      recorder.conditions = manualConditions;
    }

    const dokter = prompt(
      'Nama preset (contoh: perempuan_dewasa / laki_lansia):',
      'template_default'
    );

    if (!dokter || !dokter.trim()) {
      console.log('Export dibatalkan');
      return;
    }

    isExporting = true;

    const cleanJudul = recorder.judul
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '') || 'skrining';

    const filename = `${cleanJudul}__${trimString(dokter.trim())}.json`;

    // ✅ FIXED: Build clean object dengan trim di semua level
    const rawData = {
      metadata: {
        url: trimString(recorder.url),
        skrining: trimString(recorder.skrining),
        judul: trimString(recorder.judul),
        recordedAt: now(),
        totalActions: recorder.actions.length,
        conditions: recorder.conditions
      },
      actions: recorder.actions.map(action => ({
        type: trimString(action.type),
        name: trimString(action.name),
        value: trimString(action.value),
        time: action.time
      }))
    };

    // ✅ FIXED: Clean object sebelum stringify
    const cleanedData = cleanObject(rawData);

    // ✅ FIXED: Stringify dengan indentasi yang benar
    const jsonString = JSON.stringify(cleanedData, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);

    console.log('✅ Preset berhasil diexport:', filename);
    console.log('📋 Conditions:', recorder.conditions);
    console.log('✨ JSON cleaned with FIXED auto-trim!');

    setTimeout(() => {
      isExporting = false;
    }, 1000);
  }

  // =========================
  // URL WATCHER
  // =========================
  let lastUrl = '';
  let isListening = false;
  let hasShownIndicator = false;

  function cleanupState() {
    recorder.actions = [];
    recorder.lastValues.clear();
    recorder.conditions = { gender: 'Both', minAge: null, maxAge: null, notes: '' };
    isListening = false;
  }

  function startRecording() {
    cleanupState();

    recorder.url = window.location.href;
    recorder.skrining = extractPatientIdFromUrl() || 'unknown';
    recorder.judul = getJudul() || 'Skrining';

    setupEventListeners();
    isListening = true;

    ensureButton();

    console.log('▶️ Recording started:', {
      url: recorder.url,
      judul: recorder.judul,
      skrining: recorder.skrining
    });
  }

  setInterval(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      if (/skrining/i.test(currentUrl) && /create/i.test(currentUrl)) {
        console.log('🎯 Halaman skrining terdeteksi via URL:', currentUrl);
        startRecording();
        return;
      }

      if (document.querySelector('input[name*="riwayat"], input[name*="skrining"], .form-skrining, form[action*="skrining"]')) {
        console.log('🎯 Halaman skrining terdeteksi via DOM');
        startRecording();
        return;
      }
    }

    updateButtonCounter();
  }, CONFIG.CHECK_INTERVAL);

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
      if (/skrining/i.test(window.location.href) && /create/i.test(window.location.href)) {
        startRecording();
      }
    }, 500);
  }
})();