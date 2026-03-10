(function() {
    'use strict';

    // =========================
    // TEMPLATE SKRINING TBC - HYBRID (CONDITIONAL + STATIC)
    // =========================
    const tbcTemplate = {
        meta: {
            url: "https://cirebon.epuskesmas.id/skrining/tbc/",
            skrining: "tbc",
            judul: "Skrining Gejala TBC dan Penyakit Pernapasan Lainnya",
            conditions: {
                gender: "Semua",
                minAge: null,
                maxAge: null,
                notes: "Template untuk semua gender dan usia"
            }
        },
        actions: [
            // Field STATIC - nilai dari recording
            { type: "setRadio", name: "riwayat_kontak_tbc", value: "0" },
            { type: "setRadio", name: "batuk_2_minggu_lebih", value: "0" },
            { type: "setRadio", name: "pernah_terdiagnosa", value: "0" },
            { type: "setRadio", name: "berobat_tidak_tuntas", value: "0" },
            { type: "setRadio", name: "malnutrisi", value: "0" },
            { type: "setRadio", name: "merokok", value: "0" },
            { type: "setRadio", name: "riwayat_kencing_manis", value: "0" },
            { type: "setRadio", name: "odhiv", value: "0" },

            // Field CONDITIONAL - nilai berdasarkan usia
            { type: "setRadio", name: "lansia", value: "CONDITIONAL_AGE", isConditional: true },

            // Field STATIC - nilai dari recording
            { type: "setRadio", name: "hamil", value: "0" },
            { type: "setRadio", name: "wbp", value: "0" },
            { type: "setRadio", name: "tinggal_wilayah_kumuh", value: "0" },
            { type: "setRadio", name: "abnormalitas_tbc", value: "Normal" },
            { type: "setRadio", name: "batuk", value: "0" },
            { type: "setRadio", name: "bb_turun", value: "0" },
            { type: "setRadio", name: "demam", value: "0" },
            { type: "setRadio", name: "berkeringat", value: "0" }
        ]
    };

    // =========================
    // HELPERS - ENHANCED EVENT TRIGGERING
    // =========================
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/\/skrining\/tbc\/(\d+)/);
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
    // CONDITIONAL LOGIC FOR SPECIFIC FIELDS
    // =========================
    function getConditionalValue(fieldName, patientData) {
        const usia = patientData.usia || 0;

        // Logika conditional untuk field "lansia"
        if (fieldName === "lansia") {
            if (usia < 65) {
                console.log(`📋 Field 'lansia': Usia ${usia} < 65 → Value = "0"`);
                return "0";
            } else {
                console.log(`📋 Field 'lansia': Usia ${usia} ≥ 65 → Value = "1"`);
                return "1";
            }
        }

        // Tambahkan logika conditional lainnya di sini jika diperlukan

        return null; // Tidak ada conditional logic untuk field ini
    }

    // =========================
    // VALIDATION & EXECUTION
    // =========================
    function validateAndFillForm() {
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

        // Tampilkan data pasien
        const usia = patientData.usia || '?';
        const gender = patientData.gender || '?';
        const nama = patientData.nama || 'Pasien';

        console.log(`📋 Data Pasien: ${nama}, ${gender}, ${usia} tahun`);
        console.log(`✅ Skrining TBC berlaku untuk semua pasien`);

        // Langsung fill form
        fillTBCForm(patientData);
    }

    // =========================
    // ERROR POPUP
    // =========================
    function showErrorPopup(title, message) {
        const overlay = document.createElement('div');
        overlay.id = 'errorOverlay';
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
        const existing = document.getElementById('tbcProgress');
        if (existing) existing.remove();

        const progressBar = document.createElement('div');
        progressBar.id = 'tbcProgress';
        progressBar.style.cssText = `
            position: fixed;
            top: 25px;
            right: 25px;
            padding: 12px 25px;
            background: #3498db;
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
        const progressBar = document.getElementById('tbcProgress');
        if (progressBar) {
            progressBar.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (progressBar && progressBar.parentNode) progressBar.remove();
            }, 300);
        }
    }

    // =========================
    // FILL FORM - WITH CONDITIONAL LOGIC
    // =========================
    function fillTBCForm(patientData) {
        console.log('🚀 Memulai auto-fill Skrining TBC...');

        // Tampilkan progress
        showProgress('Mengisi form TBC...');

        // Auto-fill sesuai template
        tbcTemplate.actions.forEach((action, index) => {
            setTimeout(() => {
                if (action.type === "setRadio") {
                    let valueToSet = action.value;

                    // Cek apakah field ini menggunakan logika conditional
                    if (action.isConditional) {
                        const conditionalValue = getConditionalValue(action.name, patientData);
                        if (conditionalValue !== null) {
                            valueToSet = conditionalValue;
                        }
                    }

                    // Set radio dengan value yang sudah ditentukan
                    setRadio(action.name, valueToSet);
                }

                // Setelah action terakhir, trigger validation dan tampilkan popup
                if (index === tbcTemplate.actions.length - 1) {
                    setTimeout(() => {
                        triggerFormValidation();

                        setTimeout(() => {
                            hideProgress();
                            showCompletionPopup(patientData);
                        }, 1000);
                    }, 800);
                }
            }, index * 200); // Delay 200ms antar action
        });
    }

    // =========================
    // COMPLETION POPUP
    // =========================
    function showCompletionPopup(patientData) {
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
                ✅ AUTO-FILL TBC SELESAI
            </h2>
            <p style="color: #e67e22; font-weight: bold; font-size: 18px; margin: 15px 0;">
                ⚠️ WAJIB PERIKSA KEMBALI SEBELUM SIMPAN! ⚠️
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left; color: #555; line-height: 1.6;">
                <strong>Data Pasien:</strong><br>
                Nama: ${patientData.nama || '-'}<br>
                Jenis Kelamin: <span style="color: #3498db; font-weight: bold;">${patientData.gender || '-'}</span><br>
                Usia: <span style="color: #e74c3c; font-weight: bold;">${patientData.usia || '?'} tahun</span><br>
                <strong>Field Conditional:</strong><br>
                • Lansia: <span style="color: #9b59b6; font-weight: bold;">${patientData.usia >= 65 ? 'Ya (≥65 th)' : 'Tidak (<65 th)'}</span>
            </div>
            <p style="color: #555; line-height: 1.7; margin-bottom: 25px; font-size: 14px;">
                Form Skrining TBC telah terisi otomatis.<br>
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
        const overlay = document.getElementById('completionOverlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (overlay && overlay.parentNode) overlay.remove();
            }, 300);
        }

        const progress = document.getElementById('tbcProgress');
        if (progress && progress.parentNode) progress.remove();

        console.log('🧹 Semua UI Auto Fill TBC telah dibersihkan');
    }

    // =========================
    // INIT
    // =========================
    console.log('🟢 Auto Fill Skrining TBC loaded (Hybrid: Conditional + Static)');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', validateAndFillForm);
    } else {
        setTimeout(validateAndFillForm, 500);
    }

})();