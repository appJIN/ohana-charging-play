// Ohana Charging Play (OCP) v2.0 - Pure Real-Time Engine (Zero Fake Timer)

const batteryPercentEl = document.getElementById('batteryPercent');
const chargingStatusEl = document.getElementById('chargingStatus');
const boltIconEl = document.getElementById('boltIcon');
const themeBtn = document.getElementById('themeBtn');

let currentBattery = 0;
let isCharging = true;
let wakeLock = null;

// Clear any accidental old timers
for (let i = 1; i < 99999; i++) {
    window.clearInterval(i);
}

// 1. Extract genuine battery percentage passed from iOS Shortcuts
function extractBatteryFromURL() {
    const fullUrl = window.location.href;
    const search = window.location.search || '';
    
    try {
        const urlParams = new URLSearchParams(search);
        const val = urlParams.get('battery') || urlParams.get('b') || urlParams.get('level') || urlParams.get('charge');
        if (val) return val;
    } catch(e) {}
    
    const match = fullUrl.match(/[?&#](?:battery|b|level|charge)?=?\s*(\d{1,3}(?:\.\d+)?)/i);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

const batteryFound = extractBatteryFromURL();
if (batteryFound !== null) {
    let parsed = parseFloat(batteryFound);
    if (parsed > 0 && parsed <= 1.0) {
        parsed = Math.round(parsed * 100);
    }
    if (!isNaN(parsed) && parsed > 0) {
        currentBattery = Math.min(100, Math.max(1, Math.round(parsed)));
    }
} else {
    // If opened directly without param, check storage or default to last known
    const cached = localStorage.getItem('ocp_last_battery');
    currentBattery = cached ? parseInt(cached, 10) : 75;
}

localStorage.setItem('ocp_last_battery', currentBattery);

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

if (themeBtn) {
    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme(currentThemeIndex);
    });
}

// Battery Display Updates (Large, High-Contrast UI)
function updateDisplay(level, charging) {
    batteryPercentEl.textContent = Math.round(level);
    
    if (level >= 100) {
        chargingStatusEl.textContent = 'FULLY CHARGED (100%)';
        chargingStatusEl.style.borderColor = '#ffea00';
        chargingStatusEl.style.color = '#ffea00';
    } else if (charging) {
        chargingStatusEl.textContent = 'CHARGING';
        chargingStatusEl.style.borderColor = 'var(--primary-color)';
        chargingStatusEl.style.color = 'var(--primary-color)';
    } else {
        chargingStatusEl.textContent = 'NOT CHARGING';
        chargingStatusEl.style.borderColor = '#ff4444';
        chargingStatusEl.style.color = '#ff4444';
    }
}

// Display genuine value immediately
updateDisplay(currentBattery, isCharging);

// Tap anywhere on the stage to re-check or edit
document.body.addEventListener('click', (e) => {
    if (e.target === themeBtn) return;
    // Gentle pulse feedback
    batteryPercentEl.style.transform = 'scale(1.08)';
    setTimeout(() => {
        batteryPercentEl.style.transform = 'scale(1)';
    }, 200);
});

// Screen Wake Lock API (Keep Screen Awake while charging)
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {}
}

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});
window.addEventListener('touchstart', requestWakeLock, { once: true });
window.addEventListener('click', requestWakeLock, { once: true });
requestWakeLock();
