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
    if (document.body.classList.contains('dark')) {
      this.setLight();
    } else {
      this.setDark();
    }
  },

  setDark() {
    document.body.classList.add('dark');
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.textContent = '☀';
      toggle.setAttribute('aria-label', 'Switch to light mode');
    }
    localStorage.setItem(CONFIG.STORAGE.THEME, 'dark');
  },

  setLight() {
    document.body.classList.remove('dark');
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.textContent = '☾';
      toggle.setAttribute('aria-label', 'Switch to dark mode');
    }
    localStorage.setItem(CONFIG.STORAGE.THEME, 'light');
  },
};