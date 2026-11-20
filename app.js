// Ohana Charging Play (OCP) - Web App Engine

const batteryPercentEl = document.getElementById('batteryPercent');
const chargingStatusEl = document.getElementById('chargingStatus');
const boltIconEl = document.getElementById('boltIcon');
const clockDisplayEl = document.getElementById('clockDisplay');
const themeBtn = document.getElementById('themeBtn');
const wakeLockBtn = document.getElementById('wakeLockBtn');
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');

let currentBattery = 50; // Fallback only if no param
let isCharging = true;
let wakeLock = null;

// Read real battery passed from iOS Shortcuts (?battery=57)
const urlParams = new URLSearchParams(window.location.search);
const batteryFromUrl = urlParams.get('battery') || urlParams.get('b') || urlParams.get('level');
if (batteryFromUrl !== null && !isNaN(parseInt(batteryFromUrl, 10))) {
    currentBattery = Math.min(100, Math.max(1, parseInt(batteryFromUrl, 10)));
}

// Themes
const themes = [
    { name: 'Neon Green', primary: '#00ff73', glow: 'rgba(0, 255, 115, 0.45)', secondary: '#008f3e' },
    { name: 'Cyber Cyan', primary: '#00e5ff', glow: 'rgba(0, 229, 255, 0.45)', secondary: '#00708f' },
    { name: 'Electric Violet', primary: '#bb00ff', glow: 'rgba(187, 0, 255, 0.45)', secondary: '#62008f' },
    { name: 'Solar Amber', primary: '#ffb300', glow: 'rgba(255, 179, 0, 0.45)', secondary: '#8f6400' }
];
let currentThemeIndex = 0;

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

// Initial display
updateDisplay(currentBattery, isCharging);

// Native Battery API detection (for devices that support it)
if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
        function readBattery() {
            currentBattery = Math.round(battery.level * 100);
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
}

// Live charging accumulation (iPhone XS fast charges ~1% every 80 seconds)
setInterval(() => {
    if (isCharging && currentBattery < 100) {
        currentBattery += 1;
        updateDisplay(currentBattery, true);
        if (currentBattery === 100) {
            playChime(880);
        }
    }
}, 80000);

// Tap battery to edit manually if ever needed
batteryPercentEl.addEventListener('click', () => {
    const val = prompt('বর্তমান চার্জ পার্সেন্টেজ লিখুন:', currentBattery);
    if (val !== null && !isNaN(parseInt(val, 10))) {
        currentBattery = Math.min(100, Math.max(1, parseInt(val, 10)));
        updateDisplay(currentBattery, isCharging);
    }
});

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

// Screen Wake Lock API
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLockBtn.textContent = '✅ স্ক্রিন লক অফ (স্ক্রিন বন্ধ হবে না)';
            wakeLockBtn.style.borderColor = 'var(--primary-color)';
            wakeLock.addEventListener('release', () => {
                wakeLockBtn.textContent = '🔓 স্ক্রিন অন রাখুন (WakeLock)';
            });
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

wakeLockBtn.addEventListener('click', () => {
    requestWakeLock();
    playChime(580);
});

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});
window.addEventListener('touchstart', requestWakeLock, { once: true });
window.addEventListener('click', requestWakeLock, { once: true });
