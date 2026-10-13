/* ═══════════════════════════════════════
   ARYANA CURRENCY — PWA Logic
   Registers service worker + injects bottom nav
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // تشخیص PWA
  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // ثبت Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.warn('SW registration failed:', err));
    });
  }

  // اگه PWA هست، کلاس PWA به html اضافه کن
  if (isPWA) {
    document.documentElement.classList.add('pwa-mode');

    document.addEventListener('DOMContentLoaded', () => {
      injectBottomNav();
      document.body.classList.add('pwa-active');
    });
  }

  /**
   * منوی پایین
   */
  function injectBottomNav() {
    if (document.getElementById('pwaBottomNav')) return;

    const path = window.location.pathname;
    const isAdmin = path.includes('/admin/');
    const isInPages = path.includes('/pages/');

    const prefix = isInPages ? '' : 'pages/';

    // منوی کاربر
    const userNav = [
      { href: `${prefix}dashboard.html`, icon: 'home', label: 'Home', key: 'dashboard' },
      { href: `${prefix}exchange.html`, icon: 'trade', label: 'Trade', key: 'exchange' },
      { href: `${prefix}orders.html`, icon: 'orders', label: 'Orders', key: 'orders' },
      { href: `${prefix}profile.html`, icon: 'profile', label: 'Profile', key: 'profile' },
    ];

    // منوی ادمین
    const adminNav = [
      { href: 'index.html', icon: 'dashboard', label: 'Dashboard', key: 'index' },
      { href: 'orders.html', icon: 'orders', label: 'Orders', key: 'orders' },
      { href: 'users.html', icon: 'users', label: 'Users', key: 'users' },
      { href: 'settings.html', icon: 'settings', label: 'Settings', key: 'settings' },
    ];

    const navItems = isAdmin ? adminNav : userNav;

    // تشخیص فعال
    let currentFile = path.split('/').pop().replace('.html', '') || 'dashboard';
    let activeKey = currentFile === 'index' ? 'dashboard' : currentFile;

    const navHTML = navItems
      .map((item) => {
        const isActive = item.key === activeKey;
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
   * آیکون‌ها
   */
  function getIcon(name) {
    const icons = {
      home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      trade: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/></svg>`,
      orders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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