/* ═══════════════════════════════════════
   ARYANA CURRENCY — i18n (Multi-language)
   ═══════════════════════════════════════ */

const I18N = {
  translations: {},
  currentLang: 'en',

  /**
   * مسیر پایه (چون بعضی صفحات توی pages/ هستن)
   */
  getBasePath() {
  // اگه توی پوشه pages هستیم (یا admin)، برو یه پله بالاتر
  const path = window.location.pathname;
  if (path.includes('/pages/admin/')) {
    return '../../';
  }
  if (path.includes('/pages/')) {
    return '../';
  }
  return '';
},

  /**
   * لود کردن فایل ترجمه
   */
  async load(lang) {
    if (!CONFIG.LANGUAGES.includes(lang)) {
      lang = CONFIG.DEFAULT_LANG;
    }
    try {
      const basePath = this.getBasePath();
      const res = await fetch(`${basePath}locales/${lang}.json`);
      if (!res.ok) throw new Error(`Failed to load ${lang}`);
      this.translations = await res.json();
      this.currentLang = lang;
      localStorage.setItem(CONFIG.STORAGE.LANGUAGE, lang);
      return true;
    } catch (err) {
      console.error('i18n load error:', err);
      if (lang !== 'en') {
        return this.load('en');
      }
      return false;
    }
  },

  /**
   * اعمال ترجمه روی صفحه
   */
  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const value = this.translations[key];
      if (value === undefined) return;

      if (value.includes('<')) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    document.documentElement.lang = this.currentLang;
    document.documentElement.dir = this.currentLang === 'en' ? 'ltr' : 'rtl';
    document.body.dir = document.documentElement.dir;

    const titles = {
      en: 'ARYANA CURRENCY | Digital Exchange',
      fa: 'آریانا کرنسی | صرافی دیجیتال',
      ps: 'آریانا کرنسي | ډیجیټل صرافي',
    };
    document.title = titles[this.currentLang] || titles.en;
  },

  /**
   * تغییر زبان
   */
  async setLanguage(lang) {
    await this.load(lang);
    this.apply();

    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { lang: this.currentLang }
    }));
  },

  /**
   * ترجمه یه کلید خاص
   */
  t(key) {
    return this.translations[key] || key;
  },

  /**
   * تشخیص زبان اولیه
   */
  detectInitialLang() {
    const saved = localStorage.getItem(CONFIG.STORAGE.LANGUAGE);
    if (saved && CONFIG.LANGUAGES.includes(saved)) return saved;

    const browser = (navigator.language || 'en').toLowerCase();
    if (browser.startsWith('fa') || browser.startsWith('prs')) return 'fa';
    if (browser.startsWith('ps')) return 'ps';
    return 'en';
  },
};

window.I18N = I18N;