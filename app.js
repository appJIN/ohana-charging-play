// Ohana Charging Play (OCP) - Web App Engine

const batteryPercentEl = document.getElementById('batteryPercent');
const chargingStatusEl = document.getElementById('chargingStatus');
const boltIconEl = document.getElementById('boltIcon');
const clockDisplayEl = document.getElementById('clockDisplay');
const themeBtn = document.getElementById('themeBtn');
const wakeLockBtn = document.getElementById('wakeLockBtn');
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');

let currentBattery = 85;
let isCharging = true;
let wakeLock = null;

// Themes
const themes = [
    { name: 'Neon Green', primary: '#00ff73', glow: 'rgba(0, 255, 115, 0.45)', secondary: '#008f3e' },
    { name: 'Cyber Cyan', primary: '#00e5ff', glow: 'rgba(0, 229, 255, 0.45)', secondary: '#00708f' },
    { name: 'Electric Violet', primary: '#bb00ff', glow: 'rgba(187, 0, 255, 0.45)', secondary: '#62008f' },
    { name: 'Solar Amber', primary: '#ffb300', glow: 'rgba(255, 179, 0, 0.45)', secondary: '#8f6400' }
];
let currentThemeIndex = 0;

// Apply Theme
function applyTheme(index) {
    const theme = themes[index];
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--primary-glow', theme.glow);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
}

themeBtn.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme(currentThemeIndex);
});

// Real-time Clock
function updateClock() {
    const now = new Date();
    clockDisplayEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Sound synthesizer using Web Audio API
function playChime(freq = 520) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log('AudioContext not allowed yet');
    }
}

// Battery Display Updates
function updateDisplay(level, charging) {
    batteryPercentEl.textContent = Math.round(level);
    
    if (level >= 100) {
        chargingStatusEl.textContent = 'FULLY CHARGED (100%)';
        chargingStatusEl.style.borderColor = '#ffea00';
        chargingStatusEl.style.color = '#ffea00';
    } else if (charging) {
        chargingStatusEl.textContent = 'FAST CHARGING';
        chargingStatusEl.style.borderColor = 'var(--primary-color)';
        chargingStatusEl.style.color = 'var(--primary-color)';
    } else {
        chargingStatusEl.textContent = 'NOT CHARGING';
        chargingStatusEl.style.borderColor = '#ff4444';
        chargingStatusEl.style.color = '#ff4444';
    }
}

// Native Battery API detection
if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
        function readBattery() {
            currentBattery = battery.level * 100;
            isCharging = battery.charging;
            updateDisplay(currentBattery, isCharging);
        }
        readBattery();
        battery.addEventListener('levelchange', readBattery);
        battery.addEventListener('chargingchange', () => {
            readBattery();
            if (battery.charging) playChime(660);
        });
    });
} else {
    // Fallback if browser restricts Battery API
    updateDisplay(currentBattery, isCharging);
}

// Manual adjustments
minusBtn.addEventListener('click', () => {
    currentBattery = Math.max(1, currentBattery - 5);
    updateDisplay(currentBattery, isCharging);
});
plusBtn.addEventListener('click', () => {
    currentBattery = Math.min(100, currentBattery + 5);
    updateDisplay(currentBattery, isCharging);
    if (currentBattery === 100) playChime(880);
});

// Screen Wake Lock API (Keep Screen ON without sleeping!)
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLockBtn.textContent = '✅ স্ক্রিন লক অফ (স্ক্রিন বন্ধ হবে না)';
            wakeLockBtn.style.borderColor = 'var(--primary-color)';
            wakeLock.addEventListener('release', () => {
                wakeLockBtn.textContent = '🔓 স্ক্রিন অন রাখুন (WakeLock)';
            });
        } else {
            wakeLockBtn.textContent = '⚠️ আপনার ব্রাউজারে WakeLock সক্রিয় নেই';
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

wakeLockBtn.addEventListener('click', () => {
    requestWakeLock();
    playChime(580);
});

// Auto-request wake lock on page load / touch
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});
window.addEventListener('touchstart', requestWakeLock, { once: true });
window.addEventListener('click', requestWakeLock, { once: true });
