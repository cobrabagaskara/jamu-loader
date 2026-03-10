// ==================== SCRIPT.JS - VERSI FLEKSIBEL ====================
(function() {
    'use strict';

    console.log('📋 PKM Module: Data Pasien Reader dimulai...');

    // Fungsi extract ID dari URL (TETAP SAMA)
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/klaster_siklushidup\/(\d+)/);
        return match ? match[1] : null;
    }

    // Fungsi baca data dari HALAMAN APAPUN
    function extractPatientData() {
        const data = {};
        const patientId = getPatientIdFromUrl();

        // ===== METODE 1: Cari di halaman detail pasien (.ti-item) =====
        document.querySelectorAll('.ti-item').forEach(item => {
            const label = item.querySelector('.ti-label')?.textContent?.trim().toLowerCase();
            const value = item.querySelector('.ti-value')?.textContent?.trim();
            if (label && value) data[label] = value;
        });

        // ===== METODE 2: Cari di halaman skrining (format label-value) =====
        if (Object.keys(data).length === 0) {
            // Cari semua baris yang mengandung label
            document.querySelectorAll('.row, .form-group, tr, .field-item').forEach(row => {
                const text = row.textContent || '';
                if (text.includes('Nama Pasien') || text.includes('No Rekam Medis') || text.includes('NIK')) {
                    const labelElement = row.querySelector('label, strong, b, .label, th');
                    const valueElement = row.querySelector('span:not(.label), div:not(.label), td:last-child, .value');
                    
                    if (labelElement && valueElement) {
                        const label = labelElement.textContent.trim().toLowerCase();
                        const value = valueElement.textContent.trim();
                        data[label] = value;
                    }
                }
            });
        }

        // ===== METODE 3: Cari teks langsung =====
        if (Object.keys(data).length === 0) {
            // Ambil semua teks di halaman
            const bodyText = document.body.textContent || '';
            
            // Cari Nama Pasien
            const namaMatch = bodyText.match(/Nama Pasien[:\s]*([^\n]+)/i);
            if (namaMatch) data['nama'] = namaMatch[1].trim();
            
            // Cari No Rekam Medis / RM
            const rmMatch = bodyText.match(/(?:No[.\s]*Rekam[.\s]*Medis|RM|No[.\s]*eRM)[:\s]*(\d+)/i);
            if (rmMatch) data['no. erm'] = rmMatch[1];
            
            // Cari NIK
            const nikMatch = bodyText.match(/NIK[:\s]*(\d+)/i);
            if (nikMatch) data['nik'] = nikMatch[1];
        }

        // ===== METODE 4: Ambil dari elemen yang visible di UI =====
        if (Object.keys(data).length === 0) {
            // Cari elemen yang biasanya berisi nama pasien
            const nameElement = document.querySelector('.patient-name, .nama-pasien, h1, h2, h3');
            if (nameElement) data['nama'] = nameElement.textContent.trim();
            
            // Cari elemen yang berisi RM
            const rmElement = document.querySelector('.rm-number, .no-rm, .rekam-medis');
            if (rmElement) data['no. erm'] = rmElement.textContent.trim();
        }

        // Format data final
        const patientData = {
            id: patientId,
            nama: data['nama'] || data['nama pasien'] || data['name'] || 'Tidak diketahui',
            nik: data['nik'] || data['n i k'] || data['no. nik'] || '',
            no_rm: data['no. erm'] || data['rm'] || data['no rekam medis'] || '',
            gender: data['jenis kelamin'] || data['jk'] || data['gender'] || '',
            usia: data['umur'] || data['usia'] || data['age'] || '',
            timestamp: Date.now(),
            url: window.location.href,
            halaman: window.location.pathname
        };

        return patientData;
    }

    // Fungsi simpan data
    function savePatientData() {
        try {
            const patientData = extractPatientData();
            
            if (!patientData.id) {
                console.log('ℹ️ Bukan halaman detail pasien (tidak ada ID)');
                return false;
            }

            // Hapus data lama untuk pasien lain
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('pasien_') && key !== `pasien_${patientData.id}`) {
                    localStorage.removeItem(key);
                }
            });

            // Simpan data baru
            const storageKey = `pasien_${patientData.id}`;
            localStorage.setItem(storageKey, JSON.stringify(patientData, null, 2));
            
            console.log(`✅ Data tersimpan untuk pasien: ${patientData.nama} (ID: ${patientData.id})`);
            console.log(`📁 Key: ${storageKey}`);
            
            // Tampilkan notifikasi kecil
            showMiniNotification(`Data ${patientData.nama} tersimpan`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Gagal menyimpan data:', error);
            return false;
        }
    }

    // Notifikasi mini
    function showMiniNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            background: #2E7D32;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 999999;
            opacity: 0.9;
        `;
        notif.textContent = `📋 ${message}`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }

    // ==================== JALANKAN ====================
    
    // Jalankan saat halaman siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(savePatientData, 800);
        });
    } else {
        setTimeout(savePatientData, 800);
    }

    // Jalankan juga saat navigasi SPA
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(savePatientData, 800);
        }
    }).observe(document, { subtree: true, childList: true });

    console.log('✅ Module Data Pasien Reader siap (Fleksibel Mode)');

})();
