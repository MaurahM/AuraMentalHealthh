// --- THEME DEFINITIONS ---
const themes = {
    'pink': {
        '--bg': '#3b1534',
        '--panel': '#5a2450',
        '--card': '#6f3b64',
        '--accent': '#ff2fa6',
        '--muted': '#d9c9dc',
        '--white': '#ffffff'
    },
    'blue': {
        '--bg': '#0f1c30',
        '--panel': '#1d344e',
        '--card': '#2a415a',
        '--accent': '#4dc3ff',
        '--muted': '#c4d7e8',
        '--white': '#ffffff'
    },
    'green': {
        '--bg': '#1b321c',
        '--panel': '#294f29',
        '--card': '#366136',
        '--accent': '#8aff80',
        '--muted': '#e0f1e0',
        '--white': '#ffffff'
    }
};

function applyTheme(themeName) {
    const root = document.documentElement;
    const theme = themes[themeName] || themes.pink;
    
    // Apply every variable in the object
    Object.keys(theme).forEach(key => {
        root.style.setProperty(key, theme[key]);
    });

    localStorage.setItem('user-theme', themeName);
}

// 1. Initialize immediately
applyTheme(localStorage.getItem('user-theme') || 'pink');

// 2. Listen for changes in other tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'user-theme') applyTheme(e.newValue);
});

// 3. Security (Cleaned up)
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = function(e) {
    if (e.keyCode == 123) return false; // F12
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false;
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
};