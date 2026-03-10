(function() {
    'use strict';

    // =========================
    // TEMPLATE SKRINING PPOK (PUMA)
    // =========================
    const pumaTemplate = {
        meta: {
            url: "https://cirebon.epuskesmas.id/skriningpuma/create/",
            skrining: "ppok_puma",
            judul: "Skrining PPOK dengan Kuesioner PUMA",
            conditions: {
                gender: "Semua",
                minAge: 40,
                maxAge: null,
                notes: "Template untuk usia ≥40 tahun dengan field 'usia' conditional"
            }
        },
        actions: [
            // Field CONDITIONAL - nilai berdasarkan rentang usia
            { type: "setRadio", name: "usia", value: "CONDITIONAL_AGE", isConditional: true },

            // Field STATIC (15 field dari recording)
            { type: "setRadio", name: "pernah_merokok", value: "0" },
            { type: "setRadio", name: "napas_pendek", value: "0" },
            { type: "setRadio", name: "dahak", value: "0" },
            { type: "setRadio", name: "batuk", value: "0" },
            { type: "setRadio", name: "pemeriksaan_fungsi_paru", value: "0" },
            { type: "setRadio", name: "wawancara_1", value: "0" },
            { type: "setRadio", name: "wawancara_2", value: "0" },
            { type: "setRadio", name: "pink_puffer", value: "0" },
            { type: "setRadio", name: "pursed_lips_breathing", value: "0" },
            { type: "setRadio", name: "otot_bantu_napas", value: "0" },
            { type: "setRadio", name: "sela_iga", value: "0" },
            { type: "setRadio", name: "barrel_chest", value: "0" },
            { type: "setRadio", name: "vesikular", value: "22803001" },
            { type: "setRadio", name: "ronki_mengi", value: "0" },
            { type: "setRadio", name: "ekspirasi", value: "0" }
        ]
    };

    // =========================
    // HELPERS - ENHANCED EVENT TRIGGERING
    // =========================
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/\/skriningpuma\/create\/(\d+)/);
        return match ? match[1] : null;
    }

    function waitForElement(selector, callback, timeout = 5000) {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                console.warn(`Timeout menunggu element: ${selector}`);
            }
        }, 100);
    }

    // ENHANCED: Trigger semua event yang mungkin dibutuhkan form validation
    function setRadio(name, value) {
        const radioSelector = `input[name="${name}"][value="${value}"]`;
        waitForElement(radioSelector, (radio) => {
            if (radio) {
                radio.checked = true;

                // Trigger 7 event untuk memastikan form validation ter-trigger
                const events = [
                    'click', 'mousedown', 'mouseup', 'focus', 'change', 'input', 'blur'
                ];

                events.forEach(eventName => {
                    const event = new Event(eventName, {
                        bubbles: eventName === 'change' || eventName === 'input',
                        cancelable: true
                    });
                    radio.dispatchEvent(event);
                });

                // Trigger juga pada parent/container
                const parent = radio.closest('.form-group, .radio-group, .question-container, div');
                if (parent) {
                    const parentEvent = new Event('change', { bubbles: true });
                    parent.dispatchEvent(parentEvent);
                }

                console.log(`✓ Radio set: ${name} = ${value} (all events triggered)`);
            }
        });
    }

    // ENHANCED: Force trigger form validation setelah semua field terisi
    function triggerFormValidation() {
        console.log('🔄 Triggering form validation...');

        const form = document.querySelector('form');
        if (form) {
            const events = [
                new Event('change', { bubbles: true }),
                new Event('input', { bubbles: true }),
                new Event('submit', { bubbles: true, cancelable: true })
            ];

            events.forEach(event => form.dispatchEvent(event));
        }

        // Re-trigger semua radio yang sudah checked
        const allCheckedRadios = document.querySelectorAll('input[type="radio"]:checked');
        allCheckedRadios.forEach(radio => {
            const event = new Event('change', { bubbles: true });
            radio.dispatchEvent(event);
        });

        console.log(`✓ Re-triggered ${allCheckedRadios.length} checked radios`);
    }

    // =========================
    // CONDITIONAL LOGIC FOR FIELD "usia"
    // =========================
    function getUsiaPUMAValue(usia) {
        // Validasi: pastikan usia ≥40 (sudah divalidasi di fungsi utama)
        if (usia >= 40 && usia <= 49) {
            console.log(`📋 Usia ${usia} → Field "usia" = "0" (40-49 tahun)`);
            return "0";
        } else if (usia >= 50 && usia <= 59) {
            console.log(`📋 Usia ${usia} → Field "usia" = "1" (50-59 tahun)`);
            return "1";
        } else if (usia >= 60) {
            console.log(`📋 Usia ${usia} → Field "usia" = "2" (≥60 tahun)`);
            return "2";
        }
        console.warn(`⚠️ Usia ${usia} tidak masuk kategori apapun`);
        return null;
    }

    // =========================
    // AGE VALIDATION & EXECUTION
    // =========================
    function validateAgeAndFillForm() {
        const patientId = getPatientIdFromUrl();

        if (!patientId) {
            console.error('❌ Tidak dapat mendeteksi ID pasien dari URL');
            showErrorPopup('ID pasien tidak terdeteksi', 'Silakan buka halaman data pasien terlebih dahulu');
            return;
        }

        // Cek localStorage untuk data pasien
        const patientData = JSON.parse(localStorage.getItem(`pasien_${patientId}`));

        if (!patientData) {
            console.error('❌ Data pasien tidak ditemukan di localStorage');
            showErrorPopup(
                'Data pasien tidak tersedia',
                'Silakan buka halaman data pasien terlebih dahulu untuk menyimpan data pasien ke sistem.'
            );
            return;
        }

        // Cek usia
        const usia = parseFloat(patientData.usia) || 0;
        const gender = patientData.gender || '?';
        const nama = patientData.nama || 'Pasien';

        console.log(`📋 Data Pasien: ${nama}, ${gender}, ${usia} tahun`);

        // Validasi: usia harus ≥40 tahun
        if (usia < 40) {
            console.log(`🚫 Skrining PPOK tidak berlaku untuk usia ${usia} tahun`);
            showErrorPopup(
                `Skrining PPOK hanya untuk usia ≥40 tahun`,
                `Pasien: ${nama}\nJenis Kelamin: ${gender}\nUsia: ${usia} tahun\n\nSkrining ini tidak berlaku untuk pasien ini.`
            );
            return;
        }

        // Hitung nilai untuk field "usia" berdasarkan rentang usia
        const usiaPUMAValue = getUsiaPUMAValue(usia);
        if (!usiaPUMAValue) {
            console.error('❌ Tidak dapat menentukan nilai field "usia"');
            showErrorPopup(
                'Error pada perhitungan skor usia',
                `Pasien: ${nama}\nUsia: ${usia} tahun\n\nSistem tidak dapat menentukan kategori usia untuk skrining PPOK.`
            );
            return;
        }

        // Tentukan rentang usia untuk ditampilkan di popup
        let ageRange;
        if (usia >= 40 && usia <= 49) ageRange = "40-49 tahun";
        else if (usia >= 50 && usia <= 59) ageRange = "50-59 tahun";
        else if (usia >= 60) ageRange = "≥60 tahun";

        console.log(`✅ Skrining PPOK berlaku untuk pasien ini (${usia} tahun)`);
        console.log(`✅ Field "usia" akan di-set ke: ${usiaPUMAValue} (${ageRange})`);

        // Langsung fill form
        fillPUMAForm(patientData, usiaPUMAValue, ageRange);
    }

    // =========================
    // ERROR POPUP (USIA < 40)
    // =========================
    function showErrorPopup(title, message) {
        const overlay = document.createElement('div');
        overlay.id = 'ageErrorOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease-out;
        `;

        const popup = document.createElement('div');
        popup.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            animation: slideUp 0.4s ease-out;
            text-align: center;
        `;

        popup.innerHTML = `
            <div style="margin-bottom: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" style="margin: 0 auto;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h3 style="color: #e74c3c; margin-bottom: 15px; font-size: 22px; font-weight: 700;">
                ⚠️ ${title}
            </h3>
            <div style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; text-align: left; color: #c0392b; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <button id="btnCloseError" style="
                padding: 12px 40px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='#c0392b'"
              onmouseout="this.style.background='#e74c3c'">
                TUTUP
            </button>
            <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #7f8c8d;">
                ℹ️ Skrining PPOK dengan Kuesioner PUMA khusus untuk pasien usia 40 tahun ke atas.
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        document.getElementById('btnCloseError').onclick = () => {
            overlay.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
            }, 300);
        };

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handler);
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // =========================
    // PROGRESS INDICATOR
    // =========================
    function showProgress(message) {
        const existing = document.getElementById('pumaProgress');
        if (existing) existing.remove();

        const progressBar = document.createElement('div');
        progressBar.id = 'pumaProgress';
        progressBar.style.cssText = `
            position: fixed;
            top: 25px;
            right: 25px;
            padding: 12px 25px;
            background: #1abc9c;
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.25);
            z-index: 99999;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;

        progressBar.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="3" stroke-dasharray="15" stroke-dashoffset="0"/>
            </svg>
            <span>${message}</span>
        `;

        document.body.appendChild(progressBar);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes slideIn {
                from { transform: translateX(150px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    function hideProgress() {
        const progressBar = document.getElementById('pumaProgress');
        if (progressBar) {
            progressBar.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (progressBar && progressBar.parentNode) progressBar.remove();
            }, 300);
        }
    }

    // =========================
    // FILL FORM - WITH CONDITIONAL FIELD "usia"
    // =========================
    function fillPUMAForm(patientData, usiaPUMAValue, ageRange) {
        console.log(`🚀 Memulai auto-fill Skrining PPOK (PUMA)...`);

        // Tampilkan progress
        showProgress('Mengisi form PPOK (PUMA)...');

        // Auto-fill sesuai template
        pumaTemplate.actions.forEach((action, index) => {
            setTimeout(() => {
                if (action.type === "setRadio") {
                    let valueToSet = action.value;

                    // Jika field ini adalah field "usia" yang conditional
                    if (action.isConditional && action.name === "usia") {
                        valueToSet = usiaPUMAValue;
                    }

                    setRadio(action.name, valueToSet);
                }

                // Setelah action terakhir, trigger validation dan tampilkan popup
                if (index === pumaTemplate.actions.length - 1) {
                    setTimeout(() => {
                        triggerFormValidation();

                        setTimeout(() => {
                            hideProgress();
                            showCompletionPopup(patientData, ageRange, usiaPUMAValue);
                        }, 1000);
                    }, 800);
                }
            }, index * 180); // Delay 180ms antar action
        });
    }

    // =========================
    // COMPLETION POPUP
    // =========================
    function showCompletionPopup(patientData, ageRange, usiaPUMAValue) {
        const overlay = document.createElement('div');
        overlay.id = 'completionOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease-out;
        `;

        const popup = document.createElement('div');
        popup.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 35px;
            max-width: 550px;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
            text-align: center;
            animation: slideUp 0.4s ease-out;
        `;

        popup.innerHTML = `
            <div style="margin-bottom: 25px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2" style="margin: 0 auto;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2 style="color: #27ae60; margin-bottom: 10px; font-size: 24px; font-weight: 700;">
                ✅ AUTO-FILL PPOK (PUMA) SELESAI
            </h2>
            <p style="color: #e67e22; font-weight: bold; font-size: 18px; margin: 15px 0;">
                ⚠️ WAJIB PERIKSA KEMBALI SEBELUM SIMPAN! ⚠️
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left; color: #555; line-height: 1.6;">
                <strong>Data Pasien:</strong><br>
                Nama: ${patientData.nama || '-'}<br>
                Jenis Kelamin: <span style="color: #3498db; font-weight: bold;">${patientData.gender || '-'}</span><br>
                Usia: <span style="color: #e74c3c; font-weight: bold;">${patientData.usia || '?'} tahun</span><br>
                <strong>Field "Usia dalam tahun" (PUMA):</strong><br>
                • Rentang Usia: <span style="color: #9b59b6; font-weight: bold;">${ageRange}</span><br>
                • Nilai yang Dipilih: <span style="color: #27ae60; font-weight: bold;">"${usiaPUMAValue}"</span>
            </div>
            <div style="background: #e8f5e9; border-left: 4px solid #27ae60; padding: 12px; border-radius: 0 8px 8px 0; margin: 15px 0; text-align: left; color: #27ae60; line-height: 1.6; font-weight: bold;">
                ℹ️ Penjelasan Field "Usia dalam tahun":<br>
                • <strong>40-49 tahun</strong> → Nilai "0"<br>
                • <strong>50-59 tahun</strong> → Nilai "1"<br>
                • <strong>≥60 tahun</strong> → Nilai "2"
            </div>
            <p style="color: #555; line-height: 1.7; margin-bottom: 25px; font-size: 14px;">
                Form Skrining PPOK dengan Kuesioner PUMA telah terisi otomatis.<br>
                <strong style="color: #c0392b;">Anda tetap bertanggung jawab</strong> untuk:<br>
                • Memverifikasi jawaban dengan pasien<br>
                • Memastikan keakuratan data<br>
                • Mengambil keputusan klinis yang tepat
            </p>
            <button id="btnCloseCompletion" style="
                padding: 14px 45px;
                background: linear-gradient(135deg, #27ae60 0%, #219653 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(39, 174, 96, 0.6)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(39, 174, 96, 0.4)'">
                OK, SAYA AKAN PERIKSA ULANG
            </button>
            <div style="margin-top: 25px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #7f8c8d; line-height: 1.5;">
                <strong>ℹ️ Catatan:</strong> Tools ini hanya membantu pengisian form.
                Keputusan klinis dan akurasi data tetap menjadi tanggung jawab tenaga kesehatan.
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        document.getElementById('btnCloseCompletion').onclick = () => {
            cleanupAllUI();
        };

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                cleanupAllUI();
                document.removeEventListener('keydown', handler);
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateY(30px); }
            }
            @keyframes slideOut {
                to { transform: translateX(150px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // =========================
    // CLEANUP ALL UI
    // =========================
    function cleanupAllUI() {
        // Hapus overlay
        const overlay = document.getElementById('completionOverlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (overlay && overlay.parentNode) overlay.remove();
            }, 300);
        }

        // Hapus progress
        const progress = document.getElementById('pumaProgress');
        if (progress && progress.parentNode) progress.remove();

        console.log('🧹 Semua UI Auto Fill PPOK (PUMA) telah dibersihkan');
    }

    // =========================
    // INIT
    // =========================
    console.log('🟢 Auto Fill Skrining PPOK (PUMA) loaded (Conditional field "usia" berdasarkan rentang usia)');

    // Tunggu DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', validateAgeAndFillForm);
    } else {
        setTimeout(validateAgeAndFillForm, 500);
    }

})();