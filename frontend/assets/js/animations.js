/* ═══════════════════════════════════════
   ARYANA CURRENCY — Scroll Animations
   Fade-in elements when they enter viewport
   ═══════════════════════════════════════ */

const Animations = {
  observer: null,

  init() {
    // اگه مرورگر از IntersectionObserver پشتیبانی نمیکنه، هیچ کاری نکن
    if (!('IntersectionObserver' in window)) return;

    // اگه کاربر reduced-motion داره، احترام بذار
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // المانهایی که باید انیمیت بشن
    const selectors = [
      '.card',
      '.rate-card',
      '.step-card',
      '.stat-card',
      '.balance-card',
      '.action-card',
      '.order-card',
      '.profile-card',
      '.trust-item',
      '.cta-box',
      '.orders-table-wrap',
      '.admin-section',
      '.profile-header-card',
      '.exchange-form-card',
      '.instructions-card',
    ];

    const elements = document.querySelectorAll(selectors.join(', '));

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    });

    elements.forEach((el, index) => {
      // اگه قبلاً in-view شده، دوباره نکن
      if (el.classList.contains('in-view')) return;

      el.classList.add('animate-in');

      // تاخیر کوچیک برای stagger (اگه چند تا کنار هم باشن)
      const delay = Math.min((index % 4) * 80, 300);
      el.style.transitionDelay = `${delay}ms`;

      this.observer.observe(el);
    });
  },

  /**
   * رفرش (وقتی محتوای جدید لود شد)
   */
  refresh() {
    this.init();
  },
};

// خودکار راه بیفته
document.addEventListener('DOMContentLoaded', () => {
  // تاخیر کوچیک برای اینکه محتوای داینامیک اول لود بشه
  setTimeout(() => Animations.init(), 100);
});

window.Animations = Animations;