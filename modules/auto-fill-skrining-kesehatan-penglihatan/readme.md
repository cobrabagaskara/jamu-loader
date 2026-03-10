🎯 Fitur Script:

✅ Auto-Selection Template Berdasarkan Usia
Template
Kondisi
Perbedaan Utama
<18
Usia < 18 tahun
jenis_pemeriksaan_mata = "E tumbling"
>=18
Usia ≥ 18 tahun
jenis_pemeriksaan_mata = "Uncorrected Snellen Chart"
✅ Tanpa Validasi Gender
Berlaku untuk semua gender (Laki-laki & Perempuan)
Tidak ada pembatasan gender
✅ Enhanced Event Triggering
7 events (click, mousedown, mouseup, focus, change, input, blur)
Form validation trigger untuk memastikan form benar-benar selesai
Support untuk 18 field radio button
✅ Validasi Data Usia
Jika usia tidak valid (NaN atau negatif) → tampilkan error popup
Menampilkan usia di console untuk debugging
✅ Popup Completion dengan Info Detail
123456
Template yang Digunakan:
• < 18 tahun  ← atau "≥ 18 tahun"

ℹ️ Perbedaan Template:
• < 18 tahun: Jenis Pemeriksaan = "E tumbling"
• ≥ 18 tahun: Jenis Pemeriksaan = "Uncorrected Snellen Chart"
✅ Data yang Diisi (18 field):
Semua field terisi sesuai recording, dengan perbedaan hanya pada field jenis_pemeriksaan_mata:
< 18 tahun: "E tumbling"
≥ 18 tahun: "Uncorrected Snellen Chart"
📝 Cara Install:
Buka Tampermonkey → Create a new script
Hapus semua kode default
Paste kode di atas
Simpan dengan Ctrl+S
Buka halaman Skrining Kesehatan Penglihatan → script akan langsung berjalan otomatis! 🚀
💡 Catatan Penting:
Script otomatis memilih template berdasarkan usia pasien dari localStorage
Perbedaan utama hanya pada jenis pemeriksaan mata (sesuai protokol klinis)
Cocok untuk skrining penglihatan pada anak/remaja (<18) vs dewasa (≥18)
Progress indicator berwarna hijau (#27ae60) untuk membedakan dengan skrining lain
