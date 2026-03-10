(function() {
    'use strict';

    // Fungsi extract ID dari URL
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/klaster_siklushidup\/(\d+)/);
        return match ? match[1] : null;
    }

    // Fungsi parse usia dari string "35 Thn 9 Bln 14 Hr"
    function parseAge(ageString) {
        const match = ageString?.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    // Fungsi baca data dari HTML
    function extractPatientData() {
        const data = {};

        // Baca dari HTML structure
        document.querySelectorAll('.ti-item').forEach(item => {
            const label = item.querySelector('.ti-label')?.textContent?.trim();
            const value = item.querySelector('.ti-value')?.textContent?.trim();

            if (label && value) {
                data[label.toLowerCase()] = value;
            }
        });

        // Parse data penting
        data.gender = data['jenis kelamin'] || '';
        data.usia_raw = data['umur'] || '';
        data.usia = parseAge(data['umur']);
        data.nama = data['nama'] || '';
        data.nik = data['nik'] || '';
        data.no_rm = data['no. erm'] || '';
        data.id = getPatientIdFromUrl();
        data.timestamp = Date.now();

        return data;
    }

    // Fungsi tampilkan notifikasi
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 99999;
            font-family: Arial, sans-serif;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Main logic
    const currentId = getPatientIdFromUrl();

    if (currentId) {
        // Baca data pasien
        const patientData = extractPatientData();

        // Simpan ke localStorage dengan key berdasarkan ID
        localStorage.setItem(`pasien_${currentId}`, JSON.stringify(patientData));

        // Tampilkan notifikasi
        showNotification(`✅ Data pasien ${patientData.nama} tersimpan!`, 'success');

        console.log('📊 Data Pasien:', patientData);

        // Tambahkan CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
})();
