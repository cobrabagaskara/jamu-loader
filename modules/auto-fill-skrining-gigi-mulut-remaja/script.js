(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        // Jawaban berdasarkan data skrining (q2 - q9)
        answers: {
            q2: '0',  // Tidak ada keluhan
            q3: '1',  // Ya
            q4: '1',  // Ya
            q5: '0',  // Tidak
            q6: '0',  // Tidak
            q7: '1',  // Ya
            q8: '1',  // Ya
            q9: '0'   // Tidak
        },

        // UI Colors
        progressColor: '#3498db',  // Biru
        successColor: '#27ae60',   // Hijau
        errorColor: '#e74c3c',     // Merah

        // Timing
        delayBetweenActions: 150,   // ms
        finalDelay: 1000            // ms
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    const Utils = {
        // Enhanced event triggering
        triggerEvents(element, value) {
            if (!element) return;

            element.value = value;

            const events = [
                new Event('input', { bubbles: true, cancelable: true }),
                new Event('change', { bubbles: true, cancelable: true }),
                new Event('blur', { bubbles: true, cancelable: true }),
                new CustomEvent('customChange', { bubbles: true, cancelable: true }),
                new Event('keydown', { bubbles: true, cancelable: true }),
                new Event('keyup', { bubbles: true, cancelable: true }),
                new Event('keypress', { bubbles: true, cancelable: true })
            ];

            events.forEach(event => element.dispatchEvent(event));
        },

        // Find element dengan multiple strategies
        findElement(name) {
            const selectors = [
                `input[name="${name}"]:checked`,
                `input[name="${name}"]`,
                `select[name="${name}"]`,
                `textarea[name="${name}"]`,
                `[name="${name}"]`
            ];

            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) return el;
            }
            return null;
        },

        // Format timestamp
        formatTime(date) {
            return date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        },

        // Parse usia dari URL atau halaman
        parseAge() {
            try {
                const url = window.location.href;
                const ageMatch = url.match(/\/create\/(\d+)/);
                if (ageMatch) {
                    const months = parseInt(ageMatch[1]);
                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;
                    return {
                        totalMonths: months,
                        formatted: `${years} Thn ${remainingMonths} Bln`
                    };
                }
            } catch (e) {
                console.error('Error parsing age:', e);
            }
            return { totalMonths: 0, formatted: 'Tidak diketahui' };
        }
    };

    // ============================================
    // UI COMPONENTS
    // ============================================
    const UI = {
        // Create floating progress indicator
        createProgressIndicator() {
            const div = document.createElement('div');
            div.id = 'autoFillProgress';
            div.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 2px solid ${CONFIG.progressColor};
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 9999;
                min-width: 300px;
                font-family: Arial, sans-serif;
            `;
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div style="width: 20px; height: 20px; background: ${CONFIG.progressColor}; border-radius: 50%;"></div>
                    <strong style="color: ${CONFIG.progressColor};">Auto Fill Skrining</strong>
                </div>
                <div id="progressStatus" style="color: #555; font-size: 14px;">
                    Memulai otomatisasi...
                </div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <small style="color: #777;">⏱️ ${Utils.formatTime(new Date())}</small>
                </div>
            `;
            document.body.appendChild(div);
            return div;
        },

        // Update progress
        updateProgress(status, color = '#555') {
            const indicator = document.getElementById('autoFillProgress');
            if (indicator) {
                const statusEl = indicator.querySelector('#progressStatus');
                if (statusEl) {
                    statusEl.textContent = status;
                    statusEl.style.color = color;
                }
            }
        },

        // Show completion popup
        showCompletionPopup(success = true, details = {}) {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                animation: fadeIn 0.3s;
            `;

            const color = success ? CONFIG.successColor : CONFIG.errorColor;
            const icon = success ? '✅' : '❌';
            const title = success ? 'Berhasil!' : 'Gagal!';

            overlay.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                ">
                    <div style="
                        font-size: 60px;
                        margin-bottom: 20px;
                        color: ${color};
                    ">${icon}</div>

                    <h2 style="
                        margin: 0 0 15px 0;
                        color: ${color};
                        font-size: 24px;
                    ">${title}</h2>

                    <p style="color: #555; margin-bottom: 25px;">
                        Skrining Gigi & Mulut Remaja telah ${success ? 'berhasil diisi otomatis' : 'gagal diproses'}
                    </p>

                    ${success ? `
                    <div style="
                        background: #f8f9fa;
                        border-left: 4px solid ${color};
                        padding: 15px;
                        text-align: left;
                        margin-bottom: 20px;
                        border-radius: 4px;
                    ">
                        <div style="margin-bottom: 8px;">
                            <strong>📝 Total Pertanyaan:</strong> ${Object.keys(CONFIG.answers).length}
                        </div>
                        <div style="margin-bottom: 8px;">
                            <strong>👶 Usia:</strong> ${details.age || 'Tidak diketahui'}
                        </div>
                        <div>
                            <strong>⏱️ Waktu:</strong> ${Utils.formatTime(new Date())}
                        </div>
                    </div>
                    ` : ''}

                    <button onclick="document.body.removeChild(this.parentElement.parentElement)" style="
                        background: ${color};
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 6px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.3s;
                    " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                        Tutup
                    </button>
                </div>
            `;

            document.body.appendChild(overlay);
        },

        // Remove progress indicator
        removeProgressIndicator() {
            const indicator = document.getElementById('autoFillProgress');
            if (indicator) {
                indicator.style.animation = 'fadeOut 0.3s';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 300);
            }
        }
    };

    // ============================================
    // MAIN AUTOMATION LOGIC
    // ============================================
    async function autoFillForm() {
        const progress = UI.createProgressIndicator();
        const ageInfo = Utils.parseAge();

        UI.updateProgress(`Mengisi skrining untuk usia ${ageInfo.formatted}...`);

        try {
            // Delay awal untuk memastikan DOM siap
            await new Promise(resolve => setTimeout(resolve, 500));

            let filledCount = 0;
            const totalQuestions = Object.keys(CONFIG.answers).length;

            // Loop through all questions
            for (const [question, value] of Object.entries(CONFIG.answers)) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenActions));

                const element = Utils.findElement(question);

                if (element) {
                    // Handle radio buttons
                    if (element.type === 'radio') {
                        const radioGroup = document.querySelectorAll(`input[name="${question}"][value="${value}"]`);
                        if (radioGroup.length > 0) {
                            const radio = radioGroup[0];
                            radio.checked = true;
                            Utils.triggerEvents(radio, value);
                            filledCount++;
                            UI.updateProgress(`Mengisi ${question}... (${filledCount}/${totalQuestions})`);
                        }
                    }
                    // Handle other input types
                    else {
                        Utils.triggerEvents(element, value);
                        filledCount++;
                        UI.updateProgress(`Mengisi ${question}... (${filledCount}/${totalQuestions})`);
                    }
                } else {
                    console.warn(`Element ${question} tidak ditemukan`);
                }
            }

            // Final delay
            await new Promise(resolve => setTimeout(resolve, CONFIG.finalDelay));

            // Validate form
            UI.updateProgress('Memvalidasi form...', CONFIG.successColor);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Show completion
            UI.updateProgress('Selesai!', CONFIG.successColor);
            UI.showCompletionPopup(true, { age: ageInfo.formatted });

            // Remove progress indicator after delay
            setTimeout(() => {
                UI.removeProgressIndicator();
            }, 2000);

        } catch (error) {
            console.error('Error during auto-fill:', error);
            UI.updateProgress('Terjadi error!', CONFIG.errorColor);
            UI.showCompletionPopup(false);
            UI.removeProgressIndicator();
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        console.log('🚀 Auto Fill Skrining Gigi & Mulut Remaja - Initialized');
        console.log('📍 URL:', window.location.href);

        // Auto-run after short delay
        setTimeout(() => {
            autoFillForm();
        }, 300);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();