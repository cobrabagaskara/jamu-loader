(function() {
    'use strict';

    // =========================
    // TEMPLATE SKRINING OBESITAS
    // =========================
    const obesitasTemplate = {
        meta: {
            url: "https://cirebon.epuskesmas.id/skriningobesitas/create/",
            skrining: "skrining_obesitas",
            judul: "Skrining Obesitas",
            conditions: {
                gender: "Semua",
                minAge: null,
                maxAge: null,
                notes: "Template untuk semua gender dan usia"
            }
        },
        actions: [
            { type: "setRadio", name: "makan_manis", value: "Ya" },
            { type: "setRadio", name: "aktifitas_fisik", value: "Ya" },
            { type: "setRadio", name: "istirahat_cukup", value: "Ya" },
            { type: "setRadio", name: "risiko_merokok", value: "Tidak" },
            { type: "setRadio", name: "keluarga_alkohol_merokok", value: "Tidak" },
            { type: "setRadio", name: "obat_steroid", value: "Tidak" },
            { type: "setDropdown", name: "kategori_status_gizi", value: "CONDITIONAL_IMT", isConditional: true }
        ]
    };

    // =========================
    // HELPERS - ENHANCED EVENT TRIGGERING
    // =========================
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/\/skriningobesitas\/create\/(\d+)/);
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

    // Function untuk set dropdown dengan value yang sesuai
    function setDropdown(name, value) {
        const dropdownSelector = `select[name="${name}"]`;
        waitForElement(dropdownSelector, (dropdown) => {
            if (dropdown) {
                // Cari option yang cocok (berdasarkan value atau text)
                let optionFound = null;

                for (let i = 0; i < dropdown.options.length; i++) {
                    const opt = dropdown.options[i];
                    if (opt.value === value || opt.text === value) {
                        optionFound = opt;
                        break;
                    }
                }

                if (optionFound) {
                    dropdown.value = optionFound.value;

                    // Trigger events untuk form validation
                    const events = ['change', 'input', 'click'];
                    events.forEach(eventName => {
                        const event = new Event(eventName, { bubbles: true });
                        dropdown.dispatchEvent(event);
                    });

                    console.log(`✓ Dropdown set: ${name} = ${value}`);
                } else {
                    console.warn(`⚠️ Option "${value}" tidak ditemukan di dropdown ${name}`);
                }
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
        const allCheckedRadios = document.querySelectorAll('input[type="radio"]:checked, select');
        allCheckedRadios.forEach(input => {
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        });

        console.log(`✓ Re-triggered ${allCheckedRadios.length} checked inputs`);
    }

    // =========================
    // IMT LOGIC - READ VALUE & CALCULATE CATEGORY (FIXED)
    // =========================
    function getIMTValue() {
        const imtInput = document.querySelector('input[name="imt"]');
        if (imtInput && imtInput.value) {
            const imt = parseFloat(imtInput.value);
            console.log(`📊 Nilai IMT terdeteksi: ${imt}`);
            return imt;
        }
        console.warn('⚠️ Nilai IMT tidak ditemukan di halaman');
        return null;
    }

    // FIXED: Logika rentang IMT yang benar (IMT < 17 masuk Gizi Kurang)
    function getIMTKategori(imt) {
        if (imt < 17) {
            console.log(`📋 IMT ${imt} (< 17) → Kategori: Gizi Kurang (KRITIS)`);
            return "Gizi Kurang";
        } else if (imt >= 17 && imt <= 18.4) {
            console.log(`📋 IMT ${imt} (17-18.4) → Kategori: Gizi Kurang`);
            return "Gizi Kurang";
        } else if (imt >= 18.5 && imt <= 25) {
            console.log(`📋 IMT ${imt} (18.5-25) → Kategori: Gizi Baik`);
            return "Gizi Baik";
        } else if (imt >= 25 && imt <= 27) {
            console.log(`📋 IMT ${imt} (25-27) → Kategori: Gizi Lebih`);
            return "Gizi Lebih";
        } else if (imt > 27) {
            console.log(`📋 IMT ${imt} (> 27) → Kategori: Obesitas`);
            return "Obesitas";
        }
        console.warn(`⚠️ IMT ${imt} tidak masuk kategori apapun`);
        return null;
    }

    // =========================
    // WARNING POPUPS (CRITICAL & OBESITY) - WITH DELAY
    // =========================
    function showCriticalWarningPopup(imtValue, patientData, onCloseCallback) {
        const overlay = document.createElement('div');
        overlay.id = 'criticalWarningOverlay';
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
            background: #ff4444;
            border-radius: 12px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.4s ease-out;
            text-align: center;
            border: 4px solid #ff0000;
        `;

        popup.innerHTML = `
            <div style="margin-bottom: 25px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="margin: 0 auto;">
                    <circle cx="12" cy="12" r="10" fill="#ff0000"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h2 style="color: white; margin-bottom: 15px; font-size: 28px; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                ⚠️ PERINGATAN KRITIS! ⚠️
            </h2>
            <p style="color: white; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                IMT: <span style="font-size: 36px; color: #ffffff; background: #cc0000; padding: 5px 15px; border-radius: 8px; display: inline-block;">${imtValue}</span>
            </p>
            <div style="background: #ff0000; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; line-height: 1.6; font-size: 16px;">
                <strong>⚠️ STATUS GIZI SANGAT KRITIS ⚠️</strong><br><br>
                Pasien memiliki Indeks Masa Tubuh (IMT) yang sangat rendah.<br>
                Ini berisiko tinggi terhadap kesehatan!
            </div>
            <div style="background: white; color: #d32f2f; padding: 20px; border-radius: 8px; margin: 20px 0; line-height: 1.7; font-weight: bold; font-size: 15px;">
                <strong>TINDAKAN SEGERA:</strong><br>
                • PERIKSA ULANG hasil anamnesa<br>
                • HUBUNGI DOKTER yang bertugas<br>
                • Lakukan evaluasi klinis mendalam<br>
                • Pertimbangkan rujukan ke fasilitas yang lebih lengkap
            </div>
            <div style="background: #ff0000; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; line-height: 1.5; font-size: 14px;">
                <strong>Data Pasien:</strong><br>
                Nama: ${patientData.nama || '-'}<br>
                Usia: ${patientData.usia || '?'} tahun<br>
                Jenis Kelamin: ${patientData.gender || '-'}
            </div>
            <button id="btnCloseCritical" style="
                padding: 16px 50px;
                background: #ffffff;
                color: #d32f2f;
                border: 3px solid #ffffff;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.5)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.3)'">
                OK, SAYA AKAN HUBUNGI DOKTER
            </button>
            <div style="margin-top: 25px; padding: 12px; background: #cc0000; border-radius: 8px; font-size: 13px; color: white; line-height: 1.5;">
                <strong>ℹ️ Catatan:</strong> IMT < 17 menunjukkan status gizi sangat kurang dan memerlukan intervensi medis segera.
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Event listener - WITH DELAY
        document.getElementById('btnCloseCritical').onclick = () => {
            overlay.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
                // Delay 300ms sebelum panggil callback
                setTimeout(() => {
                    if (typeof onCloseCallback === 'function') {
                        onCloseCallback();
                    }
                }, 300);
            }, 300);
        };

        // Close dengan ESC
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handler);
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

    function showObesityWarningPopup(imtValue, patientData, onCloseCallback) {
        const overlay = document.createElement('div');
        overlay.id = 'obesityWarningOverlay';
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
            background: #ffd700;
            border-radius: 12px;
            padding: 35px;
            max-width: 550px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            animation: slideUp 0.4s ease-out;
            text-align: center;
            border: 3px solid #ff8c00;
        `;

        popup.innerHTML = `
            <div style="margin-bottom: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" stroke-width="2" style="margin: 0 auto;">
                    <circle cx="12" cy="12" r="10" fill="#ffd700"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h2 style="color: #d35400; margin-bottom: 15px; font-size: 26px; font-weight: 700;">
                ⚠️ PERINGATAN OBESITAS ⚠️
            </h2>
            <p style="color: #d35400; font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                IMT: <span style="font-size: 32px; color: #e67e22; background: #fff3cd; padding: 5px 15px; border-radius: 8px; display: inline-block;">${imtValue}</span>
            </p>
            <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 15px 0; line-height: 1.6; font-size: 15px; border-left: 4px solid #ffc107;">
                <strong>⚠️ STATUS OBESITAS ⚠️</strong><br><br>
                Pasien memiliki Indeks Masa Tubuh (IMT) yang tinggi.<br>
                Perlu edukasi dan intervensi gizi yang tepat.
            </div>
            <div style="background: white; color: #d35400; padding: 15px; border-radius: 8px; margin: 15px 0; line-height: 1.7; font-weight: bold; font-size: 14px;">
                <strong>REKOMENDASI:</strong><br>
                • Edukasi pola makan sehat<br>
                • Anjurkan aktivitas fisik teratur<br>
                • Pantau berat badan secara berkala<br>
                • Konsultasi dengan ahli gizi jika perlu
            </div>
            <div style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 8px; margin: 15px 0; line-height: 1.5; font-size: 13px;">
                <strong>Data Pasien:</strong><br>
                Nama: ${patientData.nama || '-'}<br>
                Usia: ${patientData.usia || '?'} tahun<br>
                Jenis Kelamin: ${patientData.gender || '-'}
            </div>
            <button id="btnCloseObesity" style="
                padding: 14px 45px;
                background: #ff8c00;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(255, 140, 0, 0.4);
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 140, 0, 0.6)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 140, 0, 0.4)'">
                OK, SAYA MENGERTI
            </button>
            <div style="margin-top: 20px; padding: 10px; background: #fff3cd; border-radius: 8px; font-size: 12px; color: #856404; line-height: 1.5;">
                <strong>ℹ️ Catatan:</strong> IMT > 27 menunjukkan status obesitas dan memerlukan edukasi gizi serta pemantauan.
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Event listener - WITH DELAY
        document.getElementById('btnCloseObesity').onclick = () => {
            overlay.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
                // Delay 300ms sebelum panggil callback
                setTimeout(() => {
                    if (typeof onCloseCallback === 'function') {
                        onCloseCallback();
                    }
                }, 300);
            }, 300);
        };

        // Close dengan ESC
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
        console.log(`✅ Skrining Obesitas berlaku untuk semua pasien`);

        // Langsung fill form
        fillObesitasForm(patientData);
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
        const existing = document.getElementById('obesitasProgress');
        if (existing) existing.remove();

        const progressBar = document.createElement('div');
        progressBar.id = 'obesitasProgress';
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
        const progressBar = document.getElementById('obesitasProgress');
        if (progressBar) {
            progressBar.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (progressBar && progressBar.parentNode) progressBar.remove();
            }, 300);
        }
    }

    // =========================
    // PROCEED WITH FORM FILLING (SETelah Warning Popup Ditutup)
    // =========================
    function proceedWithFormFilling(patientData, imtValue) {
        // Tampilkan progress
        showProgress('Mengisi form Obesitas...');

        // Auto-fill sesuai template
        obesitasTemplate.actions.forEach((action, index) => {
            setTimeout(() => {
                if (action.type === "setRadio") {
                    setRadio(action.name, action.value);
                } else if (action.type === "setDropdown") {
                    let valueToSet = action.value;

                    // Jika field ini conditional (dropdown IMT), hitung berdasarkan nilai IMT
                    if (action.isConditional) {
                        if (imtValue !== null) {
                            const kategori = getIMTKategori(imtValue);
                            if (kategori) {
                                valueToSet = kategori;
                                console.log(`✅ Kategori IMT terdeteksi: ${kategori}`);
                            }
                        }
                    }

                    setDropdown(action.name, valueToSet);
                }

                // Setelah action terakhir, trigger validation dan tampilkan popup
                if (index === obesitasTemplate.actions.length - 1) {
                    setTimeout(() => {
                        triggerFormValidation();

                        setTimeout(() => {
                            hideProgress();
                            showCompletionPopup(patientData, imtValue);
                        }, 1000);
                    }, 800);
                }
            }, index * 200); // Delay 200ms antar action
        });
    }

    // =========================
    // FILL FORM - WITH IMT CONDITIONAL LOGIC (FIXED: Set dropdown BEFORE popup)
    // =========================
    function fillObesitasForm(patientData) {
        console.log('🚀 Memulai auto-fill Skrining Obesitas...');

        // Baca nilai IMT dari HTML
        const imtValue = getIMTValue();

        // Hitung kategori IMT
        const imtKategori = imtValue !== null ? getIMTKategori(imtValue) : null;

        // SET DROPDOWN SEBELUM popup warning muncul
        if (imtValue !== null && imtKategori) {
            console.log(`🔧 Setting dropdown ke: ${imtKategori}`);
            setDropdown("kategori_status_gizi", imtKategori);
        }

        // Tampilkan warning popup jika IMT < 17 (CRITICAL)
        if (imtValue !== null && imtValue < 17) {
            console.log(`🔴 IMT ${imtValue} < 17 → PERINGATAN KRITIS!`);
            // Tampilkan popup + callback untuk lanjut ke form filling
            showCriticalWarningPopup(imtValue, patientData, () => {
                proceedWithFormFilling(patientData, imtValue);
            });
            return; // HENTIKAN eksekusi di sini
        }

        // Tampilkan warning popup jika IMT > 27 (OBESITAS)
        if (imtValue !== null && imtValue > 27) {
            console.log(`🟡 IMT ${imtValue} > 27 → PERINGATAN OBESITAS!`);
            // Tampilkan popup + callback untuk lanjut ke form filling
            showObesityWarningPopup(imtValue, patientData, () => {
                proceedWithFormFilling(patientData, imtValue);
            });
            return; // HENTIKAN eksekusi di sini
        }

        // Jika TIDAK ADA warning popup → langsung lanjut ke form filling
        proceedWithFormFilling(patientData, imtValue);
    }

    // =========================
    // COMPLETION POPUP
    // =========================
    function showCompletionPopup(patientData, imtValue) {
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

        // Tentukan kategori IMT untuk ditampilkan
        let imtKategori = "Tidak terdeteksi";
        if (imtValue !== null) {
            imtKategori = getIMTKategori(imtValue) || "Tidak terdeteksi";
        }

        popup.innerHTML = `
            <div style="margin-bottom: 25px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2" style="margin: 0 auto;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2 style="color: #27ae60; margin-bottom: 10px; font-size: 24px; font-weight: 700;">
                ✅ AUTO-FILL OBESITAS SELESAI
            </h2>
            <p style="color: #e67e22; font-weight: bold; font-size: 18px; margin: 15px 0;">
                ⚠️ WAJIB PERIKSA KEMBALI SEBELUM SIMPAN! ⚠️
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left; color: #555; line-height: 1.6;">
                <strong>Data Pasien:</strong><br>
                Nama: ${patientData.nama || '-'}<br>
                Jenis Kelamin: <span style="color: #3498db; font-weight: bold;">${patientData.gender || '-'}</span><br>
                Usia: <span style="color: #e74c3c; font-weight: bold;">${patientData.usia || '?'} tahun</span><br>
                <strong>IMT Terdeteksi:</strong><br>
                • Nilai IMT: <span style="color: #9b59b6; font-weight: bold;">${imtValue !== null ? imtValue : 'Tidak terdeteksi'}</span><br>
                • Kategori: <span style="color: #27ae60; font-weight: bold;">${imtKategori}</span>
            </div>
            <p style="color: #555; line-height: 1.7; margin-bottom: 25px; font-size: 14px;">
                Form Skrining Obesitas telah terisi otomatis.<br>
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

        const criticalOverlay = document.getElementById('criticalWarningOverlay');
        if (criticalOverlay && criticalOverlay.parentNode) criticalOverlay.remove();

        const obesityOverlay = document.getElementById('obesityWarningOverlay');
        if (obesityOverlay && obesityOverlay.parentNode) obesityOverlay.remove();

        // Hapus progress
        const progress = document.getElementById('obesitasProgress');
        if (progress && progress.parentNode) progress.remove();

        console.log('🧹 Semua UI Auto Fill Obesitas telah dibersihkan');
    }

    // =========================
    // INIT
    // =========================
    console.log('🟢 Auto Fill Skrining Obesitas v1.1 - FIXED loaded (IMT < 17 fix + Dropdown before popup + Delay 300ms)');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', validateAndFillForm);
    } else {
        setTimeout(validateAndFillForm, 500);
    }

})();