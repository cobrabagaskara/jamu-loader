(function() {
    'use strict';

    // =========================
    // TEMPLATE SKRINING RISIKO KANKER PARU
    // =========================
    const kankerParuTemplate = {
        meta: {
            url: "https://cirebon.epuskesmas.id/skriningkankerparu/create/",
            skrining: "risiko_kanker_paru",
            judul: "Skrining Risiko Kanker Paru",
            conditions: {
                gender: "Laki-laki (Perempuan perlu konfirmasi)",
                minAge: null,
                maxAge: null,
                notes: "Template dengan conditional gender & usia"
            }
        },
        actions: [
            // Field CONDITIONAL - Jenis Kelamin
            { type: "setRadio", name: "jenis_kelamin", value: "CONDITIONAL_GENDER", isConditional: true, field: "gender" },

            // Field CONDITIONAL - Usia
            { type: "setRadio", name: "usia", value: "CONDITIONAL_AGE", isConditional: true, field: "age" },

            // Field STATIC (7 field dari recording)
            { type: "setRadio", name: "diagnosis_kanker", value: "1" },
            { type: "setRadio", name: "keluarga_kanker", value: "1" },
            { type: "setRadio", name: "riwayat_merokok", value: "2" },
            { type: "setRadio", name: "riwayat_bekerja", value: "1" },
            { type: "setRadio", name: "tempat_tinggal_berpolusi", value: "1" },
            { type: "setRadio", name: "rumah_tidak_sehat", value: "1" },
            { type: "setRadio", name: "diagnosis_paru_kronik", value: "1" }
        ]
    };

    // =========================
    // HELPERS - ENHANCED EVENT TRIGGERING
    // =========================
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/\/skriningkankerparu\/create\/(\d+)/);
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
    // CONDITIONAL LOGIC
    // =========================
    function getGenderValue(gender) {
        if (gender === "Laki-laki") return "3";
        if (gender === "Perempuan") return "1";
        return null;
    }

    function getAgeValue(usia) {
        if (usia < 45) {
            console.log(`📋 Usia ${usia} → Field "usia" = "1" (<45 tahun)`);
            return "1";
        } else if (usia >= 45 && usia <= 65) {
            console.log(`📋 Usia ${usia} → Field "usia" = "2" (45-65 tahun)`);
            return "2";
        } else if (usia > 65) {
            console.log(`📋 Usia ${usia} → Field "usia" = "3" (>65 tahun)`);
            return "3";
        }
        console.warn(`⚠️ Usia ${usia} tidak masuk kategori apapun`);
        return null;
    }

    // =========================
    // GENDER CONFIRMATION POPUP (UNTUK PEREMPUAN)
    // =========================
    function showGenderConfirmationPopup(patientData, ageValue, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.id = 'genderConfirmOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 9999999;
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
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.4s ease-out;
            text-align: center;
        `;

        popup.innerHTML = `
            <div style="margin-bottom: 25px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" style="margin: 0 auto;">
                    <circle cx="12" cy="12" r="10" fill="#ff9800"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h2 style="color: #e67e22; margin-bottom: 15px; font-size: 26px; font-weight: 700;">
                ⚠️ KONFIRMASI SKRINING
            </h2>
            <p style="color: #2c3e50; font-size: 18px; margin-bottom: 20px; font-weight: bold;">
                Pasien: <span style="color: #3498db;">${patientData.nama}</span>
            </p>
            <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0; text-align: left; color: #5d4037; line-height: 1.7; font-size: 15px;">
                <strong>ℹ️ INFORMASI PENTING:</strong><br><br>
                Skrining Risiko Kanker Paru <strong>tidak direkomendasikan</strong> untuk pasien perempuan karena risiko klinis yang berbeda.<br><br>
                Apakah Anda tetap ingin melanjutkan skrining ini?
            </div>
            <div style="display: flex; gap: 15px; justify-content: center; margin: 30px 0;">
                <button id="btnConfirmYes" style="
                    padding: 14px 40px;
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
                    YA, LANJUTKAN
                </button>
                <button id="btnConfirmNo" style="
                    padding: 14px 40px;
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(231, 76, 60, 0.6)'"
                  onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(231, 76, 60, 0.4)'">
                    TIDAK, BATALKAN
                </button>
            </div>
            <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #7f8c8d; line-height: 1.6;">
                <strong>ℹ️ Catatan:</strong><br>
                • Keputusan klinis tetap menjadi tanggung jawab tenaga kesehatan<br>
                • Pastikan indikasi skrining sesuai protokol kesehatan yang berlaku
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Event listener - YA
        document.getElementById('btnConfirmYes').onclick = () => {
            overlay.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
                if (typeof onConfirm === 'function') onConfirm();
            }, 300);
        };

        // Event listener - TIDAK
        document.getElementById('btnConfirmNo').onclick = () => {
            overlay.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
                if (typeof onCancel === 'function') onCancel();
                cleanupAllUI();
            }, 300);
        };

        // Close dengan ESC = batalkan
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handler);
                if (typeof onCancel === 'function') onCancel();
                cleanupAllUI();
            }
        });

        // Add animations
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

        // Cek gender dan usia
        const gender = patientData.gender || '?';
        const usia = parseFloat(patientData.usia) || 0;
        const nama = patientData.nama || 'Pasien';

        console.log(`📋 Data Pasien: ${nama}, ${gender}, ${usia} tahun`);

        // Hitung nilai untuk field "usia" berdasarkan rentang usia
        const ageValue = getAgeValue(usia);
        if (!ageValue) {
            console.error('❌ Tidak dapat menentukan nilai field "usia"');
            showErrorPopup(
                'Error pada perhitungan skor usia',
                `Pasien: ${nama}\nUsia: ${usia} tahun\n\nSistem tidak dapat menentukan kategori usia untuk skrining.`
            );
            return;
        }

        // Tentukan rentang usia untuk ditampilkan di popup
        let ageRange;
        if (usia < 45) ageRange = "<45 tahun";
        else if (usia >= 45 && usia <= 65) ageRange = "45-65 tahun";
        else if (usia > 65) ageRange = ">65 tahun";

        // Jika pasien PEREMPUAN → tampilkan konfirmasi
        if (gender === "Perempuan") {
            console.log(`⚠️ Pasien Perempuan terdeteksi - Menampilkan konfirmasi...`);
            showGenderConfirmationPopup(
                patientData,
                ageValue,
                () => {
                    // User klik "YA" → lanjutkan dengan gender "1"
                    console.log('✅ Konfirmasi diterima - Melanjutkan skrining untuk Perempuan');
                    const genderValue = getGenderValue("Perempuan");
                    fillKankerParuForm(patientData, genderValue, ageValue, ageRange);
                },
                () => {
                    // User klik "TIDAK" → batalkan
                    console.log('❌ Skrining dibatalkan oleh user untuk pasien Perempuan');
                }
            );
            return;
        }

        // Jika pasien LAKI-LAKI → langsung lanjutkan
        if (gender === "Laki-laki") {
            console.log(`✅ Skrining Kanker Paru berlaku untuk pasien ini (${usia} tahun)`);
            const genderValue = getGenderValue("Laki-laki");
            fillKankerParuForm(patientData, genderValue, ageValue, ageRange);
            return;
        }

        // Gender tidak dikenali
        console.error(`❌ Gender tidak dikenali: ${gender}`);
        showErrorPopup(
            'Gender tidak dikenali',
            `Pasien: ${nama}\nJenis Kelamin: ${gender}\n\nSistem tidak dapat memproses skrining karena data gender tidak valid.`
        );
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
        const existing = document.getElementById('kankerParuProgress');
        if (existing) existing.remove();

        const progressBar = document.createElement('div');
        progressBar.id = 'kankerParuProgress';
        progressBar.style.cssText = `
            position: fixed;
            top: 25px;
            right: 25px;
            padding: 12px 25px;
            background: #e74c3c;
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
        const progressBar = document.getElementById('kankerParuProgress');
        if (progressBar) {
            progressBar.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (progressBar && progressBar.parentNode) progressBar.remove();
            }, 300);
        }
    }

    // =========================
    // FILL FORM - WITH CONDITIONAL FIELDS
    // =========================
    function fillKankerParuForm(patientData, genderValue, ageValue, ageRange) {
        console.log(`🚀 Memulai auto-fill Skrining Risiko Kanker Paru...`);
        console.log(`   → Gender: ${patientData.gender} (value: ${genderValue})`);
        console.log(`   → Usia: ${patientData.usia} tahun (rentang: ${ageRange}, value: ${ageValue})`);

        // Tampilkan progress
        showProgress('Mengisi form Kanker Paru...');

        // Auto-fill sesuai template
        kankerParuTemplate.actions.forEach((action, index) => {
            setTimeout(() => {
                if (action.type === "setRadio") {
                    let valueToSet = action.value;

                    // Jika field ini conditional, tentukan nilai berdasarkan parameter
                    if (action.isConditional) {
                        if (action.field === "gender") {
                            valueToSet = genderValue;
                        } else if (action.field === "age") {
                            valueToSet = ageValue;
                        }
                    }

                    setRadio(action.name, valueToSet);
                }

                // Setelah action terakhir, trigger validation dan tampilkan popup
                if (index === kankerParuTemplate.actions.length - 1) {
                    setTimeout(() => {
                        triggerFormValidation();

                        setTimeout(() => {
                            hideProgress();
                            showCompletionPopup(patientData, ageRange, genderValue);
                        }, 1000);
                    }, 800);
                }
            }, index * 180); // Delay 180ms antar action
        });
    }

    // =========================
    // COMPLETION POPUP
    // =========================
    function showCompletionPopup(patientData, ageRange, genderValue) {
        // Tentukan label gender untuk ditampilkan
        const genderLabel = (genderValue === "3") ? "Laki-laki" : "Perempuan";

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
                ✅ AUTO-FILL KANKER PARU SELESAI
            </h2>
            <p style="color: #e67e22; font-weight: bold; font-size: 18px; margin: 15px 0;">
                ⚠️ WAJIB PERIKSA KEMBALI SEBELUM SIMPAN! ⚠️
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left; color: #555; line-height: 1.6;">
                <strong>Data Pasien:</strong><br>
                Nama: ${patientData.nama || '-'}<br>
                Jenis Kelamin: <span style="color: #3498db; font-weight: bold;">${genderLabel}</span><br>
                Usia: <span style="color: #e74c3c; font-weight: bold;">${patientData.usia || '?'} tahun</span><br>
                <strong>Field Conditional:</strong><br>
                • Jenis Kelamin: <span style="color: #9b59b6; font-weight: bold;">${genderLabel}</span><br>
                • Rentang Usia: <span style="color: #9b59b6; font-weight: bold;">${ageRange}</span>
            </div>
            <div style="background: #e8f5e9; border-left: 4px solid #27ae60; padding: 12px; border-radius: 0 8px 8px 0; margin: 15px 0; text-align: left; color: #27ae60; line-height: 1.6; font-weight: bold;">
                ℹ️ Penjelasan Field Conditional:<br>
                • <strong>Jenis Kelamin:</strong> Laki-laki="3", Perempuan="1"<br>
                • <strong>Usia:</strong> &lt;45="1", 45-65="2", &gt;65="3"
            </div>
            <p style="color: #555; line-height: 1.7; margin-bottom: 25px; font-size: 14px;">
                Form Skrining Risiko Kanker Paru telah terisi otomatis.<br>
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

        const confirmOverlay = document.getElementById('genderConfirmOverlay');
        if (confirmOverlay && confirmOverlay.parentNode) confirmOverlay.remove();

        const errorOverlay = document.getElementById('errorOverlay');
        if (errorOverlay && errorOverlay.parentNode) errorOverlay.remove();

        // Hapus progress
        const progress = document.getElementById('kankerParuProgress');
        if (progress && progress.parentNode) progress.remove();

        console.log('🧹 Semua UI Auto Fill Kanker Paru telah dibersihkan');
    }

    // =========================
    // INIT
    // =========================
    console.log('🟢 Auto Fill Skrining Risiko Kanker Paru loaded (Conditional: Gender + Usia + Konfirmasi Perempuan)');

    // Tunggu DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', validateAndFillForm);
    } else {
        setTimeout(validateAndFillForm, 500);
    }

})();