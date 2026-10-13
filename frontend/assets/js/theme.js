/* ═══════════════════════════════════════
   ARYANA CURRENCY — Theme (Dark/Light Mode)
   ═══════════════════════════════════════ */

const Theme = {
  init() {
    const saved = localStorage.getItem(CONFIG.STORAGE.THEME);

    // اگه کاربر قبلاً انتخاب کرده
    if (saved === 'dark') {
      this.setDark();
    } else if (saved === 'light') {
      this.setLight();
    } else {
      // تشخیص از سیستم کاربر
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        this.setDark();
      } else {
        this.setLight();
      }
    }

    // دکمه toggle
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }
  },

  toggle() {
    if (document.body.classList.contains('light')) {
      this.setDark();
    } else {
      this.setLight();
    }
  },

  setDark() {
    document.body.classList.remove('light');
    document.body.classList.add('dark');

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      `;
      toggle.setAttribute('aria-label', 'Switch to light mode');
      toggle.setAttribute('title', 'Switch to light mode');
    }
    localStorage.setItem(CONFIG.STORAGE.THEME, 'dark');
  },

  setLight() {
    document.body.classList.remove('dark');
    document.body.classList.add('light');

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      `;
      toggle.setAttribute('aria-label', 'Switch to dark mode');
      toggle.setAttribute('title', 'Switch to dark mode');
    }
    localStorage.setItem(CONFIG.STORAGE.THEME, 'light');
  },
};

window.Theme = Theme;