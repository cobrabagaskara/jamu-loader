(function() {
    'use strict';

    // =========================
    // TEMPLATES BERDASARKAN RENTANG USIA
    // =========================
    const anemiaTemplates = {
        // Template untuk usia < 12 tahun
        '<12': {
            meta: {
                url: "https://cirebon.epuskesmas.id/skrininganemia/create/",
                skrining: "anemia_<12",
                judul: "Skrining Anemia",
                ageRange: "< 12 tahun",
                notes: "Template untuk usia kurang dari 12 tahun"
            },
            actions: [
                { type: "setRadio", name: "q1", value: "0" },
                { type: "setRadio", name: "q2", value: "1" },
                { type: "setRadio", name: "q3", value: "1" },
                { type: "setRadio", name: "q4", value: "0" },
                { type: "setRadio", name: "q5", value: "0" },
                { type: "setRadio", name: "q6", value: "0" },
                { type: "setRadio", name: "q7", value: "0" },
                { type: "setRadio", name: "q8", value: "0" },
                { type: "setRadio", name: "q9", value: "0" },
                { type: "setRadio", name: "q10", value: "0" },
                { type: "setRadio", name: "q11", value: "0" },
                { type: "setRadio", name: "q12", value: "1" },
                { type: "setRadio", name: "q13", value: "1" },
                { type: "setRadio", name: "q14", value: "0" },
                { type: "setRadio", name: "q15", value: "1" },
                { type: "setRadio", name: "tanda_klinis_anemia", value: "0" },
                { type: "setValue", name: "skor", value: "1" }
            ]
        },

        // Template untuk usia 12 - 18 tahun (inklusif)
        '12_18': {
            meta: {
                url: "https://cirebon.epuskesmas.id/skrininganemia/create/",
                skrining: "anemia_12_18",
                judul: "Skrining Anemia",
                ageRange: "12 - 18 tahun",
                notes: "Template untuk usia 12 sampai 18 tahun (inklusif)"
            },
            actions: [
                { type: "setRadio", name: "q1", value: "0" },
                { type: "setRadio", name: "q2", value: "1" },
                { type: "setRadio", name: "q3", value: "1" },
                { type: "setRadio", name: "q4", value: "0" },
                { type: "setRadio", name: "q5", value: "0" },
                { type: "setRadio", name: "q6", value: "0" },
                { type: "setRadio", name: "q7", value: "1" },  // PERBEDAAN: q7 = "1"
                { type: "setRadio", name: "q8", value: "0" },
                { type: "setRadio", name: "q9", value: "1" },  // PERBEDAAN: q9 = "1"
                { type: "setRadio", name: "q10", value: "0" },
                { type: "setRadio", name: "q11", value: "0" },
                { type: "setRadio", name: "q12", value: "1" },
                { type: "setRadio", name: "q13", value: "1" },
                { type: "setRadio", name: "q14", value: "0" },
                { type: "setRadio", name: "q15", value: "1" },
                { type: "setRadio", name: "tanda_klinis_anemia", value: "0" },
                { type: "setValue", name: "skor", value: "1" }
            ]
        },

        // Template untuk usia ≥ 19 tahun
        '>=19': {
            meta: {
                url: "https://cirebon.epuskesmas.id/skrininganemia/create/",
                skrining: "anemia_>=19",
                judul: "Skrining Anemia",
                ageRange: "≥ 19 tahun",
                notes: "Template untuk usia 19 tahun ke atas"
            },
            actions: [
                { type: "setRadio", name: "q1", value: "0" },
                { type: "setRadio", name: "q2", value: "1" },
                { type: "setRadio", name: "q3", value: "1" },
                { type: "setRadio", name: "q4", value: "0" },
                { type: "setRadio", name: "q5", value: "0" },
                { type: "setRadio", name: "q6", value: "0" },
                { type: "setRadio", name: "q7", value: "1" },  // PERBEDAAN: q7 = "1"
                { type: "setRadio", name: "q8", value: "0" },
                { type: "setRadio", name: "q9", value: "0" },
                { type: "setRadio", name: "q10", value: "0" },
                { type: "setRadio", name: "q11", value: "0" },
                { type: "setRadio", name: "q12", value: "1" },
                { type: "setRadio", name: "q13", value: "1" },
                { type: "setRadio", name: "q14", value: "0" },
                { type: "setRadio", name: "q15", value: "1" },
                { type: "setRadio", name: "tanda_klinis_anemia", value: "0" },
                { type: "setValue", name: "skor", value: "1" }
            ]
        }
    };

    // =========================
    // HELPERS - ENHANCED EVENT TRIGGERING
    // =========================
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/\/skrininganemia\/create\/(\d+)/);
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

    function setValue(name, value) {
        const inputSelector = `input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`;
        waitForElement(inputSelector, (input) => {
            if (input) {
                input.value = value;

                // Trigger events
                const events = ['change', 'input'];
                events.forEach(eventName => {
                    const event = new Event(eventName, { bubbles: true });
                    input.dispatchEvent(event);
                });

                console.log(`✓ Value set: ${name} = ${value}`);
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
        const allCheckedRadios = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
        allCheckedRadios.forEach(input => {
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        });

        console.log(`✓ Re-triggered ${allCheckedRadios.length} checked inputs`);
    }

    // =========================
    // AGE CALCULATION IN YEARS (FROM ENHANCED PEREKAM)
    // =========================
    function calculateAgeInYears(patientData) {
        // Strategy 1: Gunakan field enhanced perekam (usia_total_bulan)
        if (patientData.usia_total_bulan !== undefined && patientData.usia_total_bulan !== null) {
            const months = parseFloat(patientData.usia_total_bulan);
            const years = months / 12;
            console.log(`🔢 Usia dari usia_total_bulan: ${months.toFixed(2)} bulan = ${years.toFixed(2)} tahun`);
            return years;
        }

        // Strategy 2: Parse dari string usia (format: "X Thn Y Bln Z Hr")
        if (patientData.usia && typeof patientData.usia === 'string') {
            const match = patientData.usia.match(/(\d+)\s*Thn\s*(\d+)\s*Bln\s*(\d+)\s*Hr/);
            if (match) {
                const years = parseInt(match[1]);
                const months = parseInt(match[2]);
                const days = parseInt(match[3]);
                const totalMonths = (years * 12) + months + (days / 30);
                const totalYears = totalMonths / 12;
                console.log(`🔢 Usia di-parse dari string: ${totalYears.toFixed(2)} tahun`);
                return totalYears;
            }

            // Fallback: coba parse sebagai angka (tahun)
            const ageInYears = parseFloat(patientData.usia);
            if (!isNaN(ageInYears)) {
                console.log(`🔢 Usia di-parse sebagai tahun: ${ageInYears.toFixed(2)} tahun`);
                return ageInYears;
            }
        }

        // Strategy 3: Gunakan field terpisah (usia_tahun, usia_bulan, usia_hari)
        if (patientData.usia_tahun !== undefined) {
            const years = parseFloat(patientData.usia_tahun) || 0;
            const months = parseFloat(patientData.usia_bulan) || 0;
            const days = parseFloat(patientData.usia_hari) || 0;
            const totalMonths = (years * 12) + months + (days / 30);
            const totalYears = totalMonths / 12;
            console.log(`🔢 Usia dari field terpisah: ${totalYears.toFixed(2)} tahun`);
            return totalYears;
        }

        console.warn('⚠️ Tidak dapat menentukan usia dalam tahun');
        return null;
    }

    // =========================
    // AGE VALIDATION & TEMPLATE SELECTION
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

        // Hitung usia dalam tahun
        const ageInYears = calculateAgeInYears(patientData);
        const gender = patientData.gender || '?';
        const nama = patientData.nama || 'Pasien';
        const usiaRaw = patientData.usia || '?';

        console.log(`📋 Data Pasien: ${nama}, ${gender}, Usia: ${usiaRaw}`);
        console.log(`🔢 Usia dalam tahun: ${ageInYears !== null ? ageInYears.toFixed(2) : 'TIDAK DIKETAHUI'}`);

        // Validasi: pastikan usia valid
        if (ageInYears === null || isNaN(ageInYears) || ageInYears < 0) {
            console.error('❌ Usia tidak valid');
            showErrorPopup(
                'Data usia tidak valid',
                `Pasien: ${nama}\nData usia: ${usiaRaw}\n\nSistem tidak dapat menentukan usia pasien. Pastikan data pasien direkam dengan perekam yang sudah diperbarui.`
            );
            return;
        }

        // Tentukan template berdasarkan rentang usia (SESUAI KONDISI BARU)
        let templateKey;
        let ageRange;

        if (ageInYears < 12) {
            templateKey = '<12';
            ageRange = '< 12 tahun';
        } else if (ageInYears >= 12 && ageInYears < 19) { // ✅ < 19
            templateKey = '12_18';
            ageRange = '12 - <19 tahun'; // Label diperjelas

        } else if (ageInYears >= 19) {
            templateKey = '>=19';
            ageRange = '≥ 19 tahun';
        } else {
            // Kasus edge: 18 < usia < 19 (misal: 18.5 tahun)
            console.error(`❌ Usia ${ageInYears.toFixed(2)} tidak masuk kategori apapun`);
            showErrorPopup(
                'Rentang usia tidak valid',
                `Pasien: ${nama}\nUsia: ${ageInYears.toFixed(2)} tahun\n\nSkrining Anemia hanya berlaku untuk:\n• < 12 tahun\n• 12 - 18 tahun\n• ≥ 19 tahun`
            );
            return;
        }

        // Ambil template yang sesuai
        const selectedTemplate = anemiaTemplates[templateKey];

        if (!selectedTemplate) {
            console.error(`❌ Template tidak ditemukan: ${templateKey}`);
            showErrorPopup(
                `Template tidak ditemukan`,
                `Template untuk rentang usia ${ageRange} tidak tersedia.\nSilakan hubungi administrator.`
            );
            return;
        }

        console.log(`✅ Template ditemukan: ${templateKey} (${ageRange})`);
        console.log(`✅ Skrining Anemia berlaku untuk pasien ini (${ageInYears.toFixed(2)} tahun)`);

        // Langsung fill form dengan template yang dipilih
        fillAnemiaForm(patientData, selectedTemplate, ageRange, ageInYears);
    }

    // =========================
    // ERROR POPUP (USIA TIDAK VALID)
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
                ℹ️ Skrining Anemia memiliki 3 kategori usia:<br>
                • < 12 tahun<br>
                • 12 - 18 tahun<br>
                • ≥ 19 tahun
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
        const existing = document.getElementById('anemiaProgress');
        if (existing) existing.remove();

        const progressBar = document.createElement('div');
        progressBar.id = 'anemiaProgress';
        progressBar.style.cssText = `
            position: fixed;
            top: 25px;
            right: 25px;
            padding: 12px 25px;
            background: #c0392b;
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
        const progressBar = document.getElementById('anemiaProgress');
        if (progressBar) {
            progressBar.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (progressBar && progressBar.parentNode) progressBar.remove();
            }, 300);
        }
    }

    // =========================
    // FILL FORM - ENHANCED WITH VALIDATION TRIGGER
    // =========================
    function fillAnemiaForm(patientData, template, ageRange, ageInYears) {
        console.log(`🚀 Memulai auto-fill Skrining Anemia (${ageRange})...`);

        // Tampilkan progress
        showProgress(`Mengisi form Anemia (${ageRange})...`);

        // Auto-fill sesuai template yang dipilih
        template.actions.forEach((action, index) => {
            setTimeout(() => {
                if (action.type === "setRadio") {
                    setRadio(action.name, action.value);
                } else if (action.type === "setValue") {
                    setValue(action.name, action.value);
                }

                // Setelah action terakhir, trigger validation dan tampilkan popup
                if (index === template.actions.length - 1) {
                    setTimeout(() => {
                        triggerFormValidation();

                        setTimeout(() => {
                            hideProgress();
                            showCompletionPopup(patientData, ageRange, ageInYears);
                        }, 1000);
                    }, 800);
                }
            }, index * 170); // Delay 170ms antar action
        });
    }

    // =========================
    // COMPLETION POPUP
    // =========================
    function showCompletionPopup(patientData, ageRange, ageInYears) {
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
                ✅ AUTO-FILL ANEMIA SELESAI
            </h2>
            <p style="color: #e67e22; font-weight: bold; font-size: 18px; margin: 15px 0;">
                ⚠️ WAJIB PERIKSA KEMBALI SEBELUM SIMPAN! ⚠️
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left; color: #555; line-height: 1.6;">
                <strong>Data Pasien:</strong><br>
                Nama: ${patientData.nama || '-'}<br>
                Jenis Kelamin: <span style="color: #3498db; font-weight: bold;">${patientData.gender || '-'}</span><br>
                Usia: <span style="color: #e74c3c; font-weight: bold;">${patientData.usia || '?'} (${ageInYears.toFixed(2)} tahun)</span><br>
                <strong>Kategori Usia:</strong><br>
                • <span style="color: #9b59b6; font-weight: bold;">${ageRange}</span>
            </div>
            <div style="background: #e8f5e9; border-left: 4px solid #27ae60; padding: 12px; border-radius: 0 8px 8px 0; margin: 15px 0; text-align: left; color: #27ae60; line-height: 1.6; font-weight: bold;">
                ℹ️ Kategori Skrining Anemia:<br>
                • <strong>&lt; 12 tahun</strong><br>
                • <strong>12 - 18 tahun</strong> (inklusif)<br>
                • <strong>≥ 19 tahun</strong>
            </div>
            <p style="color: #555; line-height: 1.7; margin-bottom: 25px; font-size: 14px;">
                Form Skrining Anemia telah terisi otomatis.<br>
                <strong style="color: #c0392b;">Anda tetap bertanggung jawab</strong> untuk:<br>
                • Memverifikasi jawaban dengan pasien/orang tua<br>
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
        const progress = document.getElementById('anemiaProgress');
        if (progress && progress.parentNode) progress.remove();

        console.log('🧹 Semua UI Auto Fill Anemia telah dibersihkan');
    }

    // =========================
    // INIT
    // =========================
    console.log('🟢 Auto Fill Skrining Anemia loaded (3 templates: <12, 12-18, ≥19)');

    // Tunggu DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', validateAgeAndFillForm);
    } else {
        setTimeout(validateAgeAndFillForm, 500);
    }

})();