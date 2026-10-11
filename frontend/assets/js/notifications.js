/* ═══════════════════════════════════════
   ARYANA CURRENCY — Notifications
   Toast + Confirm dialog
   ═══════════════════════════════════════ */

const Notify = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  /**
   * نمایش Toast
   * @param {string} message - پیام
   * @param {string} type - 'success' | 'error' | 'info' | 'warning'
   * @param {string} title - عنوان (اختیاری)
   * @param {number} duration - مدت نمایش (ms)
   */
  toast(message, type = 'info', title = null, duration = 4000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '✓',
      error: '✕',
      info: 'i',
      warning: '!',
    };

    const defaultTitles = {
      success: { en: 'Success', fa: 'موفق', ps: 'بریالی' },
      error: { en: 'Error', fa: 'خطا', ps: 'خطا' },
      info: { en: 'Info', fa: 'اطلاع', ps: 'معلومات' },
      warning: { en: 'Warning', fa: 'هشدار', ps: 'خبرتیا' },
    };

    let displayTitle = title;
    if (!displayTitle && typeof I18N !== 'undefined') {
      displayTitle = (defaultTitles[type] || defaultTitles.info)[I18N.currentLang] || defaultTitles[type].en;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || 'i'}</div>
      <div class="toast-content">
        ${displayTitle ? `<div class="toast-title">${escapeHtml(displayTitle)}</div>` : ''}
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">×</button>
    `;

    // دکمه بستن
    toast.querySelector('.toast-close').addEventListener('click', () => this.closeToast(toast));

    this.container.appendChild(toast);

    // انیمیشن ورود
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    // حذف خودکار
    if (duration > 0) {
      setTimeout(() => this.closeToast(toast), duration);
    }

    return toast;
  },

  closeToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  },

  // Shortcuts
  success(message, title = null) {
    return this.toast(message, 'success', title);
  },
  error(message, title = null) {
    return this.toast(message, 'error', title, 6000);
  },
  info(message, title = null) {
    return this.toast(message, 'info', title);
  },
  warning(message, title = null) {
    return this.toast(message, 'warning', title, 5000);
  },

  /**
   * Confirm dialog سفارشی
   * @param {object} options - { title, message, confirmText, cancelText, type, input }
   * @returns {Promise<boolean|string>}
   */
  confirm(options = {}) {
    return new Promise((resolve) => {
      const opts = {
        title: options.title || '',
        message: options.message || '',
        confirmText: options.confirmText || null,
        cancelText: options.cancelText || null,
        type: options.type || 'warning', // 'warning' | 'danger' | 'info'
        input: options.input || null,     // { placeholder: '...' } برای prompt
        ...options,
      };

      // پیشفرضهای ترجمه
      if (!opts.confirmText && typeof I18N !== 'undefined') {
        opts.confirmText = I18N.currentLang === 'en' ? 'Confirm'
                        : I18N.currentLang === 'fa' ? 'تأیید'
                        : 'تصدیق';
      }
      if (!opts.cancelText && typeof I18N !== 'undefined') {
        opts.cancelText = I18N.currentLang === 'en' ? 'Cancel'
                        : I18N.currentLang === 'fa' ? 'لغو'
                        : 'لغوه';
      }

      const iconMap = {
        warning: '⚠',
        danger: '⚠',
        info: 'i',
      };

      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <div class="confirm-icon ${opts.type}">${iconMap[opts.type] || '⚠'}</div>
          ${opts.title ? `<div class="confirm-title">${escapeHtml(opts.title)}</div>` : ''}
          ${opts.message ? `<div class="confirm-message">${escapeHtml(opts.message)}</div>` : ''}
          ${opts.input ? `<input type="text" class="confirm-input" placeholder="${escapeAttr(opts.input.placeholder || '')}" />` : ''}
          <div class="confirm-actions">
            <button class="btn btn-outline-dark" data-action="cancel">${escapeHtml(opts.cancelText)}</button>
            <button class="btn ${opts.type === 'danger' ? 'btn-danger' : 'btn-gold'}" data-action="confirm">${escapeHtml(opts.confirmText)}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('show'));

      const input = overlay.querySelector('.confirm-input');
      if (input) setTimeout(() => input.focus(), 150);

      const close = (result) => {
        overlay.classList.remove('show');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 200);
        resolve(result);
      };

      overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        if (opts.input) {
          const val = input.value.trim();
          close(val || false);
        } else {
          close(true);
        }
      });

      // کلیدها
      const keyHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', keyHandler);
          close(false);
        }
        if (e.key === 'Enter' && opts.input) {
          document.removeEventListener('keydown', keyHandler);
          const val = input.value.trim();
          close(val || false);
        }
      };
      document.addEventListener('keydown', keyHandler);

      // کلیک بیرون
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });
    });
  },

  /**
   * Prompt سفارشی (کوتاه)
   */
  prompt(title, placeholder = '', type = 'warning') {
    return this.confirm({
      title,
      type,
      input: { placeholder },
    });
  },
};

/**
 * Escape HTML برای جلوگیری از XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}