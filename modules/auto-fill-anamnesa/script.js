(function () {

    function run() {


    const CONFIG = {
        // Delay (ms) setelah klik riwayat sebelum mulai polling popup
        POPUP_POLL_INTERVAL: 300,
        // Maksimum berapa kali polling popup (total ~15 detik)
        POPUP_MAX_POLLS: 50,
        // Selector tab Anamnesa di dalam popup
        TAB_ANAMNESA_SELECTOR: '#tab_anamnesa',
        // Selector panel isi anamnesa
        PANEL_ANAMNESA_SELECTOR: '#anamnesa_riwayat',
        // Selector modal popup riwayat pelayanan
        MODAL_SELECTOR: '#modal',
    };




    function parseTanggal(str) {
        const m = str.trim().match(/^(\d{2})-(\d{2})-(\d{4})/);
        if (!m) return null;
        return new Date(+m[3], +m[2] - 1, +m[1]);
    }


    function today() {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }


    function setInput(el, value) {
        if (!el) return;
        // Pilih prototype yang sesuai: HTMLInputElement atau HTMLTextAreaElement
        const proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
        if (nativeSetter && nativeSetter.set) nativeSetter.set.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('keyup',  { bubbles: true }));
    }


    function setSelect(el, value) {
        if (!el) return;
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }


    function setRadio(name, value) {
        const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
        radios.forEach(r => {
            r.checked = (r.value.trim().toLowerCase() === value.trim().toLowerCase());
        });
        const target = document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);
        if (target) {
            // Dispatch change agar jQuery listener bereaksi
            target.dispatchEvent(new Event('change', { bubbles: true }));
            // Khusus field Anamnesa: trigger fungsi validasi bawaan sistem
            if (name.startsWith('Anamnesa[') && typeof window.checkRadioRiwayatPsikologis === 'function') {
                window.checkRadioRiwayatPsikologis(target);
            }
        }
    }


    function extractNumber(str) {
        if (!str) return null;
        const m = str.trim().match(/^[\d.]+/);
        return m ? m[0] : null;
    }


    function extractBracketValue(str) {
        if (!str) return null;
        const m = str.trim().match(/\[(\d+)\]/);
        return m ? m[1] : null;
    }


    const MAP_MEMBUKA_MATA = {
        'spontan': '4',
        'terhadap rangsangan suara': '3',
        'terhadap nyeri': '2',
        'tidak ada': '1',
    };
    const MAP_RESPON_VERBAL = {
        'orientasi baik': '5',
        'orientasi terganggu': '4',
        'kata-kata tidak jelas': '3',
        'suara tidak jelas': '2',
        'tidak ada respon': '1',
    };
    const MAP_RESPON_MOTORIK = {
        'mampu bergerak': '6',
        'melokalisasi nyeri': '5',
        'fleksi menarik': '4',
        'fleksi abnormal': '3',
        'ekstensi': '2',
        'tidak ada respon': '1',
    };
    const MAP_TRIAGE = {
        'gawat darurat': 'GAWAT DARURAT',
        'darurat': 'DARURAT',
        'tidak gawat darurat': 'TIDAK GAWAT DARURAT',
        'meninggal': 'MENINGGAL',
    };
    const MAP_KESADARAN = {
        'compos mentis': 'COMPOS MENTIS',
        'somnolen': 'SOMNOLEN',
        'sopor': 'SOPOR',
        'coma': 'COMA',
    };

    // ── Status Fisis / Neurologis / Mental ───────────────────

    function mapYaTidak(val) {
        const k = toKey(val);
        if (k === 'ya') return '1';
        if (k === 'tidak' || k === 'tidak ada') return '0';
        return null;
    }

    const MAP_EKSPRESI_EMOSI = {
        'tenang': 'tenang', 'cemas': 'cemas', 'takut': 'takut',
        'gelisah': 'gelisah', 'sedih': 'sedih', 'marah': 'marah',
    };
    const MAP_BAHASA = {
        'indonesia': 'indonesia', 'daerah': 'daerah', 'lainnya': 'lainnya',
    };
    const MAP_TINGGAL_DENGAN = {
        'sendiri': 'sendiri', 'suami/istri': 'suami/istri',
        'orangtua': 'orangtua', 'lainnya': 'lainnya',
    };
    const MAP_SOSIAL_EKONOMI = {
        'baik': 'baik', 'kurang': 'kurang', 'cukup': 'cukup',
    };
    const MAP_STATUS_EKONOMI = {
        'baik': 'baik', 'kurang': 'kurang', 'cukup': 'cukup',
    };
    const MAP_HUBUNGAN_KELUARGA = {
        'harmonis': 'harmonis', 'kurang harmonis': 'kurang_harmonis',
        'tidak harmonis': 'tidak_harmonis', 'konflik besar': 'konflik',
    };

    function toKey(str) { return str ? str.trim().toLowerCase() : ''; }




    function parsePopupAnamnesa(panelEl) {
        const data = {};
        const rows = panelEl.querySelectorAll('table tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            // Proses pasangan kolom: [0]label [1]: [2]nilai  dan [3]label [4]: [5]nilai
            for (let i = 0; i + 2 < cells.length; i += 3) {
                const labelEl = cells[i];
                const valueEl = cells[i + 2];
                if (!labelEl || !valueEl) continue;

                const label = toKey(labelEl.textContent);
                // Ambil teks bersih dari value cell (strip span badge dsb)
                const value = valueEl.textContent.replace(/\s+/g, ' ').trim();

                if (!label || !value) continue;

                // Simpan semua label → value
                data[label] = value;
            }
        });

        return data;
    }




    function isSafeSelector(selector) {
        if (!selector) return false;
        const forbidden = [
            'Anamnesa[keluhan_utama]',
            'Anamnesa[keluhan_tambahan]',
            'Anamnesa[lama_sakit_tahun]',
            'Anamnesa[lama_sakit_bulan]',
            'Anamnesa[lama_sakit_hari]',
            'Anamnesa[dokter_id]',
            'Anamnesa[perawat_id]',
            'dokter_nama_bpjs',
            'perawat_nama',
            'keluhan-tambahan',
            'sakit_tahun',
            'sakit_bulan',
            'sakit_hari',
        ];
        return !forbidden.some(f => selector.includes(f));
    }

    function safeSetInput(el, value) {
        if (!el) return false;
        // Cek name & id tidak termasuk field terlarang
        const identifier = (el.name || '') + (el.id || '');
        if (!isSafeSelector(identifier)) {
            console.warn('[AutoFill] ⛔ Diblokir – field Anamnesa tidak boleh diisi:', identifier);
            return false;
        }
        setInput(el, value);
        return true;
    }

    function safeSetSelect(el, value) {
        if (!el) return false;
        const identifier = (el.name || '') + (el.id || '');
        if (!isSafeSelector(identifier)) {
            console.warn('[AutoFill] ⛔ Diblokir – select Anamnesa tidak boleh diisi:', identifier);
            return false;
        }
        setSelect(el, value);
        return true;
    }

    function fillForm(data) {
        console.log('[AutoFill] Data yang diekstrak dari popup:', data);

        let filledCount = 0;

        function fill(key, action) {
            const val = data[key];
            if (val !== undefined && val !== null && val.trim() !== '') {
                action(val.trim());
                filledCount++;
                console.log(`[AutoFill] ✓ ${key} → "${val.trim()}"`);
            } else {
                console.log(`[AutoFill] ✗ ${key} tidak ditemukan / kosong`);
            }
        }

        // ── GCS ──────────────────────────────────────────────
        fill('membuka mata', val => {
            const mapped = MAP_MEMBUKA_MATA[toKey(val)];
            if (mapped) safeSetSelect(document.querySelector('select[name="PeriksaFisik[membuka_mata]"]'), mapped);
        });
        fill('respon verbal', val => {
            const mapped = MAP_RESPON_VERBAL[toKey(val)];
            if (mapped) safeSetSelect(document.querySelector('select[name="PeriksaFisik[respon_verbal]"]'), mapped);
        });
        fill('respon motorik', val => {
            const mapped = MAP_RESPON_MOTORIK[toKey(val)];
            if (mapped) safeSetSelect(document.querySelector('select[name="PeriksaFisik[respon_motorik]"]'), mapped);
        });

        // Trigger kalkulasi GCS → Kesadaran otomatis
        if (typeof window.checkGsc === 'function') window.checkGsc();

        // Kesadaran (fallback jika checkGsc tidak update otomatis)
        fill('kesadaran', val => {
            const mapped = MAP_KESADARAN[toKey(val)];
            if (mapped) safeSetSelect(document.querySelector('select[name="PeriksaFisik[kesadaran]"]'), mapped);
        });

        // ── TTV ──────────────────────────────────────────────
        fill('sistole', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.getElementById('sistole'), n);
        });
        fill('diastole', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.getElementById('diastole'), n);
        });
        fill('detak nadi', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.querySelector('input[name="PeriksaFisik[detak_nadi]"]'), n);
        });
        fill('nafas', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.querySelector('input[name="PeriksaFisik[nafas]"]'), n);
        });
        fill('saturasi (sp02)', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.querySelector('input[name="PeriksaFisik[saturasi]"]'), n);
        });
        fill('suhu', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.querySelector('input[name="PeriksaFisik[suhu]"]'), n);
        });

        // Trigger hitung MAP
        if (typeof window.checkMap === 'function') window.checkMap();

        // ── Detak Jantung (radio) ─────────────────────────────
        fill('detak jantung', val => {
            const upper = val.toUpperCase();
            if (upper.includes('REGULAR') && !upper.includes('IREG')) {
                setRadio('PeriksaFisik[detak_jantung]', 'REGULAR');
            } else if (upper.includes('IREG')) {
                setRadio('PeriksaFisik[detak_jantung]', 'IREGULAR');
            }
        });

        // ── Triage (radio) ────────────────────────────────────
        fill('triage', val => {
            const mapped = MAP_TRIAGE[toKey(val)];
            if (mapped) setRadio('PeriksaFisik[triage]', mapped);
        });

        // ── Anthropometri ─────────────────────────────────────
        fill('tinggi badan', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.getElementById('tinggi_badan'), n);
        });
        fill('berat badan', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.getElementById('berat_badan'), n);
        });
        fill('lingkar perut', val => {
            const n = extractNumber(val);
            if (n) safeSetInput(document.querySelector('input[name="PeriksaFisik[lingkar_perut]"]'), n);
        });

        // Trigger hitung IMT
        if (typeof window.hitungImt === 'function') window.hitungImt();

        // ── Fungsional / Barthel ──────────────────────────────
        fill('mobilisasi', val => {
            const n = extractBracketValue(val);
            if (n !== null) safeSetSelect(document.querySelector('select[name="PeriksaFisik[mobilisasi]"]'), n);
        });
        fill('toileting', val => {
            const n = extractBracketValue(val);
            if (n !== null) safeSetSelect(document.querySelector('select[name="PeriksaFisik[toileting]"]'), n);
        });
        fill('makan/minum', val => {
            const n = extractBracketValue(val);
            if (n !== null) safeSetSelect(document.querySelector('select[name="PeriksaFisik[makan_minum]"]'), n);
        });
        fill('mandi', val => {
            const n = extractBracketValue(val);
            if (n !== null) safeSetSelect(document.querySelector('select[name="PeriksaFisik[mandi]"]'), n);
        });
        fill('berpakaian', val => {
            const n = extractBracketValue(val);
            if (n !== null) safeSetSelect(document.querySelector('select[name="PeriksaFisik[berpakaian]"]'), n);
        });

        // Trigger hitung skor aktivitas fungsional
        if (typeof window.checkJenisAktifitas === 'function') window.checkJenisAktifitas();

        // ── Status Fisis / Neurologis / Mental ───────────────
        fill('apakah menggunakan alat bantu saat beraktifitas', val => {
            const v = mapYaTidak(val);
            if (v !== null) setRadio('Anamnesa[alat_bantu_aktrifitas]', v);
        });
        fill('adakah kendala komunikasi', val => {
            const v = mapYaTidak(val);
            if (v !== null) setRadio('Anamnesa[kendala_komunikasi]', v);
        });
        fill('adakah yang merawat dirumah', val => {
            const v = mapYaTidak(val);
            if (v !== null) setRadio('Anamnesa[merawat_dirumah]', v);
        });
        fill('apakah membutuhkan bantuan orang lain saat beraktifitas', val => {
            const v = mapYaTidak(val);
            if (v !== null) setRadio('Anamnesa[membutuhkan_bantuan]', v);
        });
        fill('ekspresi dan emosi', val => {
            const mapped = MAP_EKSPRESI_EMOSI[toKey(val)];
            if (mapped) safeSetSelect(document.querySelector('select[name="Anamnesa[ekspresi_emosi]"]'), mapped);
        });
        fill('bahasa yang digunakan', val => {
            const mapped = MAP_BAHASA[toKey(val)];
            if (mapped) setRadio('Anamnesa[bahasa_digunakan]', mapped);
        });
        fill('tinggal dengan', val => {
            const mapped = MAP_TINGGAL_DENGAN[toKey(val)];
            if (mapped) setRadio('Anamnesa[tinggal_dengan]', mapped);
        });
        fill('sosial ekonomi', val => {
            const mapped = MAP_SOSIAL_EKONOMI[toKey(val)];
            if (mapped) setRadio('Anamnesa[sosial_ekonomi]', mapped);
        });
        fill('gangguan jiwa dimasa lalu', val => {
            // Popup: "Tidak" atau "Ya" atau "Tidak Ada"
            const v = mapYaTidak(val === 'Tidak Ada' ? 'Tidak' : val);
            if (v !== null) setRadio('Anamnesa[gangguan_jiwa_dimasa_lalu]', v);
        });
        fill('status ekonomi', val => {
            const mapped = MAP_STATUS_EKONOMI[toKey(val)];
            if (mapped) setRadio('Anamnesa[status_ekonomi]', mapped);
        });
        fill('hubungan dengan keluarga', val => {
            const mapped = MAP_HUBUNGAN_KELUARGA[toKey(val)];
            if (mapped) safeSetSelect(document.querySelector('select[name="Anamnesa[hubungan_keluarga]"]'), mapped);
        });

        // Trigger validasi psikologis setelah semua radio Status Fisis diisi
        if (typeof window.checkRadioRiwayatPsikologis === 'function') {
            document.querySelectorAll('[name^="Anamnesa["][type="radio"]:checked').forEach(r => {
                window.checkRadioRiwayatPsikologis(r);
            });
        }

        // ── Lainnya ───────────────────────────────────────────
        // Merokok
        fill('merokok', val => {
            const v = mapYaTidak(val === 'Tidak' ? 'Tidak' : val === 'Ya' ? 'Ya' : val);
            // value form: "0" = Tidak, "1" = Ya
            if (v !== null) setRadio('Anamnesa[merokok]', v);
        });
        // Konsumsi Alkohol
        fill('konsumsi alkohol', val => {
            const v = mapYaTidak(val);
            if (v !== null) setRadio('Anamnesa[konsumsi_alkohol]', v);
        });
        // Kurang Sayur/Buah
        fill('kurang sayur/buah', val => {
            const v = mapYaTidak(val);
            if (v !== null) setRadio('Anamnesa[kurang_sayur_buah]', v);
        });
        // Terapi Obat
        fill('terapi obat', val => {
            const el = document.querySelector('textarea[name="Anamnesa[terapi]"]');
            if (el) safeSetInput(el, val);
        });
        // Terapi Non Obat
        fill('terapi non obat', val => {
            const el = document.querySelector('textarea[name="Anamnesa[terapi_non_obat]"]');
            if (el) safeSetInput(el, val);
        });
        // BMHP — tidak ada di popup, isi dengan nilai default
        const bmhpEl = document.querySelector('textarea[name="Anamnesa[bmhp]"]');
        if (bmhpEl && bmhpEl.value.trim() === '') {
            safeSetInput(bmhpEl, 'tidak menggunakan BMHP');
            filledCount++;
            console.log('[AutoFill] ✓ bmhp → "tidak menggunakan BMHP" (default)');
        }
        // Edukasi
        fill('edukasi', val => {
            const el = document.querySelector('textarea[name="Anamnesa[edukasi]"]');
            if (el) safeSetInput(el, val);
        });

        // Notif selesai
        showNotif(`✅ Auto-fill selesai! ${filledCount} field berhasil diisi dari kunjungan sebelumnya.`, 'success');
        console.log(`[AutoFill] Selesai. ${filledCount} field diisi.`);
    }



    /**
     * Tunggu popup muncul, cek apakah anamnesa ada datanya.
     * Kalau kosong (tidak pernah diisi), tutup popup dan coba kandidat berikutnya.
     * candidates: array link elemen terurut dari paling baru ke paling lama.
     * candidateIndex: index yang sedang dicoba saat ini.
     */
    function waitForPopupAndExtract(candidates, candidateIndex) {
        if (candidateIndex === undefined) candidateIndex = 0;
        let polls = 0;

        const interval = setInterval(() => {
            polls++;
            if (polls > CONFIG.POPUP_MAX_POLLS) {
                clearInterval(interval);
                showNotif('⚠️ Popup tidak ditemukan atau terlalu lama loading.', 'warning');
                return;
            }

            const modal = document.querySelector(CONFIG.MODAL_SELECTOR);
            if (!modal || modal.style.display === 'none') return;

            const tabAnamnesa = modal.querySelector(CONFIG.TAB_ANAMNESA_SELECTOR);
            if (!tabAnamnesa) return;

            tabAnamnesa.click();

            setTimeout(() => {
                const panel = modal.querySelector(CONFIG.PANEL_ANAMNESA_SELECTOR);
                if (!panel) {
                    showNotif('⚠️ Panel Anamnesa tidak ditemukan di popup.', 'warning');
                    return;
                }

                // Belum selesai load — lanjut polling
                if (!panel.textContent.includes('Periksa Fisik')) return;

                clearInterval(interval);

                // Cek apakah anamnesa kunjungan ini punya data (ada nilai TTV)
                const panelText = panel.textContent;
                const adaData = panelText.includes('Sistole') ||
                                panelText.includes('Berat Badan') ||
                                panelText.includes('Detak Nadi');

                if (!adaData) {
                    // Kunjungan ini tidak diisi anamnesa — coba yang lebih lama
                    const btnClose = modal.querySelector('#button_close');
                    if (btnClose) btnClose.click();

                    const nextIndex = candidateIndex + 1;
                    if (nextIndex < candidates.length) {
                        const nextLink = candidates[nextIndex];
                        const nextText = nextLink.textContent.match(/(\d{2}-\d{2}-\d{4})/);
                        const nextDate = nextText ? nextText[1] : '?';
                        showNotif(`⚠️ Kunjungan ${candidateIndex + 1} tidak ada anamnesa. Mencoba ${nextDate}…`, 'warning');
                        console.log(`[AutoFill] Kunjungan index ${candidateIndex} kosong, coba index ${nextIndex}`);

                        setTimeout(() => {
                            nextLink.click();
                            waitForPopupAndExtract(candidates, nextIndex);
                        }, 600);
                    } else {
                        // Semua kunjungan tidak ada data anamnesa
                        showNotif('❌ Semua kunjungan sebelumnya tidak memiliki data anamnesa yang diisi.', 'error');
                        console.log('[AutoFill] Semua kandidat kunjungan kosong.');
                    }
                    return;
                }

                // Ada data — lanjut isi form
                const data = parsePopupAnamnesa(panel);
                fillForm(data);

                const btnClose = modal.querySelector('#button_close');
                if (btnClose) btnClose.click();

            }, 500);

        }, CONFIG.POLL_INTERVAL || CONFIG.POPUP_POLL_INTERVAL);
    }



    function findAndClickPreviousVisit() {
        const todayDate = today();
        const allLinks = document.querySelectorAll('a.riwayat.btn');

        // Kumpulkan semua kunjungan sebelum hari ini, urutkan dari paling baru
        const candidates = [];
        allLinks.forEach(link => {
            const text = link.textContent || '';
            const dateMatch = text.match(/(\d{2}-\d{2}-\d{4})/);
            if (!dateMatch) return;
            const d = parseTanggal(dateMatch[1]);
            if (!d || d >= todayDate) return;
            candidates.push({ link, date: d });
        });

        if (candidates.length === 0) {
            showNotif('ℹ️ Tidak ada kunjungan sebelumnya yang ditemukan.', 'info');
            return;
        }

        // Urutkan dari paling baru ke paling lama
        candidates.sort((a, b) => b.date - a.date);
        const linkList = candidates.map(c => c.link);

        const firstDate = candidates[0].date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        showNotif(`🔍 Membuka kunjungan ${firstDate}…`, 'info');
        console.log(`[AutoFill] ${candidates.length} kandidat kunjungan ditemukan. Mencoba yang paling baru...`);

        linkList[0].click();
        waitForPopupAndExtract(linkList, 0);
    }



    function showNotif(msg, type) {
        const colors = {
            success: '#28a745',
            warning: '#ffc107',
            info:    '#17a2b8',
            error:   '#dc3545',
        };

        const old = document.getElementById('autofill-notif');
        if (old) old.remove();

        const div = document.createElement('div');
        div.id = 'autofill-notif';
        div.textContent = msg;
        div.style.position     = 'fixed';
        div.style.bottom       = '20px';
        div.style.right        = '20px';
        div.style.background   = colors[type] || '#333';
        div.style.color        = (type === 'warning') ? '#333' : '#fff';
        div.style.padding      = '12px 18px';
        div.style.borderRadius = '8px';
        div.style.fontSize     = '13px';
        div.style.fontFamily   = 'sans-serif';
        div.style.boxShadow    = '0 4px 12px rgba(0,0,0,0.25)';
        div.style.zIndex       = '999999';
        div.style.maxWidth     = '350px';
        div.style.lineHeight   = '1.5';
        div.style.transition   = 'opacity 0.3s';
        document.body.appendChild(div);

        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 400);
        }, 5000);
    }



    // Guard: mencegah autofill berjalan ganda jika shortcut ditekan cepat
    let isRunning = false;

    function init() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + Z
            if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
                e.preventDefault();

                if (isRunning) {
                    showNotif('⏳ Sedang memproses, harap tunggu…', 'info');
                    return;
                }

                // Pastikan halaman anamnesa sudah siap (ada data riwayat)
                if (!document.querySelector('a.riwayat.btn')) {
                    showNotif('⚠️ Tabel riwayat kunjungan belum tersedia.', 'warning');
                    return;
                }

                isRunning = true;
                findAndClickPreviousVisit();

                // Reset guard setelah 20 detik
                setTimeout(() => { isRunning = false; }, 20000);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

})();