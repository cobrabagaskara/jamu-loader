(function() {
    'use strict';

    // Fungsi extract ID dari URL
    function getPatientIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/klaster_siklushidup\/(\d+)/);
        return match ? match[1] : null;
    }

    // Fungsi parse usia detail dari string "35 Thn 9 Bln 14 Hr"
    function parseAgeDetail(ageString) {
        const result = {
            tahun: 0,
            bulan: 0,
            hari: 0,
            total_bulan: 0,
            total_hari: 0,
            raw: ageString || ''
        };

        if (!ageString) return result;

        // Parse tahun
        const tahunMatch = ageString.match(/(\d+)\s*Thn/i);
        if (tahunMatch) {
            result.tahun = parseInt(tahunMatch[1]);
        }

        // Parse bulan
        const bulanMatch = ageString.match(/(\d+)\s*Bln/i);
        if (bulanMatch) {
            result.bulan = parseInt(bulanMatch[1]);
        }

        // Parse hari
        const hariMatch = ageString.match(/(\d+)\s*Hr/i);
        if (hariMatch) {
            result.hari = parseInt(hariMatch[1]);
        }

        // Hitung total dalam bulan (1 tahun = 12 bulan)
        result.total_bulan = (result.tahun * 12) + result.bulan + (result.hari / 30);

        // Hitung total dalam hari (1 tahun = 365 hari, 1 bulan = 30 hari)
        result.total_hari = (result.tahun * 365) + (result.bulan * 30) + result.hari;

        console.log(`📊 Parse Age: "${ageString}" → ${result.tahun} Thn ${result.bulan} Bln ${result.hari} Hr = ${result.total_bulan.toFixed(2)} bulan`);

        return result;
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
        const ageDetail = parseAgeDetail(data['umur']);

        data.gender = data['jenis kelamin'] || '';
        data.usia_raw = data['umur'] || '';
        data.usia = ageDetail.tahun; // Tetap simpan tahun untuk kompatibilitas
        data.usia_tahun = ageDetail.tahun;
        data.usia_bulan = ageDetail.bulan;
        data.usia_hari = ageDetail.hari;
        data.usia_total_bulan = ageDetail.total_bulan;
        data.usia_total_hari = ageDetail.total_hari;
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
            max-width: 400px;
        `;
        notification.innerHTML = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Main logic
    const currentId = getPatientIdFromUrl();

    if (currentId) {
        // Baca data pasien
        const patientData = extractPatientData();

        // Simpan ke localStorage dengan key berdasarkan ID
        localStorage.setItem(`pasien_${currentId}`, JSON.stringify(patientData));

        // Tampilkan notifikasi detail
        const ageInfo = patientData.usia_total_bulan
            ? `${patientData.usia_tahun} Thn ${patientData.usia_bulan} Bln (${patientData.usia_total_bulan.toFixed(2)} bulan)`
            : `${patientData.usia} Thn`;

        showNotification(
            `✅ Data tersimpan!<br>` +
            `<strong>${patientData.nama}</strong><br>` +
            `Usia: ${ageInfo}`,
            'success'
        );

        console.log('📊 Data Pasien Lengkap:', patientData);
        console.log(`   → Usia: ${patientData.usia_tahun} Thn ${patientData.usia_bulan} Bln ${patientData.usia_hari} Hr`);
        console.log(`   → Total: ${patientData.usia_total_bulan.toFixed(2)} bulan / ${patientData.usia_total_hari} hari`);

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
    } else {
        console.warn('⚠️ Tidak dapat mendeteksi ID pasien dari URL');
        showNotification('⚠️ ID pasien tidak terdeteksi!', 'error');
    }
})();
