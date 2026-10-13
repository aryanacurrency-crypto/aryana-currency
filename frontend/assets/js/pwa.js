/* ═══════════════════════════════════════
   ARYANA CURRENCY — PWA Logic
   Persistent bottom nav (survives page changes)
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // ─── ثبت Service Worker ───
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.warn('SW registration failed:', err));
    });
  }

  // ─── اگه PWA هست ───
  if (isPWA) {
    document.documentElement.classList.add('pwa-mode');

    const initPWA = () => {
      document.body.classList.add('pwa-active');
      injectBottomNav();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPWA);
    } else {
      initPWA();
    }
  }

  /**
   * منوی پایین (پایدار)
   */
  function injectBottomNav() {
    // اگه از قبل هست، کاری نکن
    if (document.getElementById('pwaBottomNav')) return;

    const path = window.location.pathname;
    const isAdmin = path.includes('/admin/');
    const isInPages = path.includes('/pages/');

    const prefix = isInPages ? '' : 'pages/';

    const userNav = [
      { href: `${prefix}dashboard.html`, icon: 'home', label: 'Home', keys: ['dashboard', 'index', ''] },
      { href: `${prefix}exchange.html`, icon: 'trade', label: 'Trade', keys: ['exchange'] },
      { href: `${prefix}orders.html`, icon: 'orders', label: 'Orders', keys: ['orders', 'order'] },
      { href: `${prefix}profile.html`, icon: 'profile', label: 'Profile', keys: ['profile'] },
    ];

    const adminNav = [
      { href: 'index.html', icon: 'dashboard', label: 'Dashboard', keys: ['index', ''] },
      { href: 'orders.html', icon: 'orders', label: 'Orders', keys: ['orders', 'order-detail'] },
      { href: 'users.html', icon: 'users', label: 'Users', keys: ['users'] },
      { href: 'settings.html', icon: 'settings', label: 'Settings', keys: ['settings'] },
    ];

    const navItems = isAdmin ? adminNav : userNav;

    let currentFile = path.split('/').pop().replace('.html', '');
    if (currentFile === 'index') currentFile = 'dashboard';

    const navHTML = navItems
      .map((item) => {
        const isActive = item.keys.includes(currentFile);
        return `
          <a href="${item.href}" class="pwa-nav-item ${isActive ? 'active' : ''}">
            <div class="pwa-nav-icon">${getIcon(item.icon)}</div>
            <span class="pwa-nav-label">${item.label}</span>
          </a>
        `;
      })
      .join('');

    const nav = document.createElement('nav');
    nav.className = 'pwa-bottom-nav';
    nav.id = 'pwaBottomNav';
    nav.innerHTML = navHTML;

    document.body.appendChild(nav);
  }

  /**
   * آیکون‌های سفارشی (خطوط نازک، مدرن)
   */
  function getIcon(name) {
    const icons = {
      home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z"/></svg>`,

      trade: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h11l-3-3"/><path d="M20 17H9l3 3"/><path d="M4 7l3 3"/><path d="M20 17l-3-3"/></svg>`,

      orders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>`,

      profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`,

      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>`,

      users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="6" r="3"/><path d="M22 21c0-3-2-5-5-5"/></svg>`,

      settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    };
    return icons[name] || '';
  }

  /**
   * دکمه نصب
   */
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  function showInstallButton() {
    if (document.getElementById('pwaInstallBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.className = 'pwa-install-btn';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Install App
    `;

    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install outcome:', outcome);
      deferredPrompt = null;
      btn.remove();
    });

    document.body.appendChild(btn);
  }
})();