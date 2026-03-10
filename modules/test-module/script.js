// Test Module untuk Skrining Auto Loader
(function() {
    'use strict';

    console.log('[SkriningAuto-TestModule] Test module loaded!');
    console.log('[SkriningAuto-TestModule] Current URL:', window.location.href);
    
    // Contoh: Tambah tombol sederhana
    const style = `
        .skrining-test-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 99999;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .skrining-test-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
    `;
    
    // Tambah CSS
    const styleEl = document.createElement('style');
    styleEl.textContent = style;
    document.head.appendChild(styleEl);
    
    // Tambah tombol
    const button = document.createElement('button');
    button.className = 'skrining-test-button';
    button.textContent = '🎯 Test Module Active';
    button.addEventListener('click', function() {
        alert('Test Module berhasil dijalankan!\nURL: ' + window.location.href);
    });
    
    document.body.appendChild(button);
    
    console.log('[SkriningAuto-TestModule] Button added to page');
    
})();
