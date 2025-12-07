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

// --- CORE FUNCTIONS ---

// Function to apply a selected theme
function applyTheme(themeName) {
    const theme = themes[themeName];
    // Default to pink if the theme is invalid
    if (!theme) {
        applyTheme('pink');
        return;
    }

    // Apply the CSS variables to the document root
    for (const [key, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(key, value);
    }
    
    // Save the theme choice for next page load
    localStorage.setItem('user-theme', themeName);
}

// Function to initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('user-theme');
    // Apply the saved theme, or default to 'pink'
    applyTheme(savedTheme || 'pink');
}

// Automatically run the initialization when this script loads
initializeTheme();

// disable-rightclick.js
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  alert('Right-click is disabled on this app!');
});
document.addEventListener('keydown', e => {
  // F12
  if (e.key === 'F12') e.preventDefault();
  // Ctrl+Shift+I / Cmd+Option+I (DevTools)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') e.preventDefault();
  // Ctrl+U (View source)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') e.preventDefault();
});
