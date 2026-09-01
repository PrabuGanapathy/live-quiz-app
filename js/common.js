// ============================================================================
// COMMON UTILITIES FOR ALL PAGES
// ============================================================================

// Generate a unique player ID
function generatePlayerId() {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate a 6-character alphanumeric run code
function generateRunCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get URL parameter
function getUrlParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

// Set URL parameter without page reload
function setUrlParam(param, value) {
  const params = new URLSearchParams(window.location.search);
  params.set(param, value);
  window.history.replaceState({}, '', `?${params.toString()}`);
}

// Format milliseconds to MM:SS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Calculate points based on time taken
// max = 1000 (instant), min = 500 (full timeout)
function calculatePoints(timeTakenMs, timeLimitMs) {
  if (timeTakenMs >= timeLimitMs) {
    return 500; // Right at or past the buzzer
  }
  // Linear scale: 500 + (1000 - 500) * (1 - timeTaken/timeLimit)
  const remaining = timeLimitMs - timeTakenMs;
  const ratio = remaining / timeLimitMs; // 0 to 1
  return Math.round(500 + 500 * ratio);
}

// Generate a shareable link for players
function getPlayerJoinLink(runCode) {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*\.html.*/, '/index.html');
  return `${baseUrl}?run=${runCode}`;
}

// Store data to localStorage
function localStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Retrieve data from localStorage
function localRetrieve(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

// Clear localStorage
function localClear(key) {
  localStorage.removeItem(key);
}

// Show a toast notification
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy');
  });
}

// Validate email (basic)
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Color palette for MCQ buttons
const BUTTON_COLORS = [
  '#2E7DD8', // Blue
  '#E63946', // Pink/Red
  '#06A77D', // Green
  '#FF9F1C'  // Orange
];

const BUTTON_COLOR_NAMES = ['blue', 'pink', 'green', 'orange'];
