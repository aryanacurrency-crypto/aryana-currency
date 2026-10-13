/* ═══════════════════════════════════════
   ARYANA CURRENCY — PWA Logic
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // ثبت SW
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.warn('SW registration failed:', err));
    });
  }

  if (isPWA) {
    document.documentElement.classList.add('pwa-mode');

    const initPWA = () => {
      document.body.classList.add('pwa-active');
      injectBottomNav();

      // اگه توی profile.html هستیم، پیش‌فرض Settings رو باز کن
      if (window.location.pathname.includes('profile.html')) {
        setTimeout(openDefaultProfileTab, 150);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPWA);
    } else {
      initPWA();
    }
  }

  /**
   * باز کردن تب پیش‌فرض Settings در پروفایل
   */
  function openDefaultProfileTab() {
    // پاک کردن همه
    document.querySelectorAll('.profile-nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.profile-panel').forEach(panel => panel.classList.remove('active'));

    // باز کردن Settings
    const settingsNav = document.querySelector('.profile-nav-item[data-tab="settings"]');
    const settingsPanel = document.querySelector('.profile-panel[data-panel="settings"]');

    if (settingsNav && settingsPanel) {
      settingsNav.classList.add('active');
      settingsPanel.classList.add('active');
    }
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
   * آیکون‌ها (Binance-style)
   */
  function getIcon(name) {
    const icons = {
      home: `<svg viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z"/></svg>`,

      trade: `<svg viewBox="0 0 24 24"><path d="M4 8h12l-3-3"/><path d="M20 16H8l3 3"/><path d="M4 8l3 3"/><path d="M20 16l-3-3"/></svg>`,

      orders: `<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>`,

      profile: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`,

      dashboard: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>`,

      users: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="6" r="3"/><path d="M22 21c0-3-2-5-5-5"/></svg>`,

      settings: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
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