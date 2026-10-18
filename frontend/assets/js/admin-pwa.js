/* ═══════════════════════════════════════
   ARYANA — Admin PWA Install & Drawer
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ═══ 1. Register Service Worker ═══
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .then((reg) => console.log('[Admin SW] registered:', reg.scope))
        .catch((err) => console.warn('[Admin SW] failed:', err));
    });
  }

  // ═══ 2. Ensure Manifest ═══
  function ensureManifest() {
    if (document.querySelector('link[rel="manifest"]')) return;
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest-admin.json';
    document.head.appendChild(link);
  }
  ensureManifest();

  // ═══ 3. Bottom Sheet Drawer ═══
  const sidebar = document.querySelector('.admin-sidebar');

  function openDrawer() { sidebar?.classList.add('open'); }
  function closeDrawer() { sidebar?.classList.remove('open'); }
  function toggleDrawer() { sidebar?.classList.toggle('open'); }

  document.querySelector('.admin-brand')?.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      toggleDrawer();
    }
  });

  sidebar?.addEventListener('click', (e) => {
    const rect = sidebar.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    if (clickY < 30) toggleDrawer();
  });

  sidebar?.addEventListener('click', (e) => {
    const link = e.target.closest('.admin-nav-item');
    if (link) setTimeout(closeDrawer, 100);
  });

  document.addEventListener('click', (e) => {
    if (!sidebar?.classList.contains('open')) return;
    if (!sidebar.contains(e.target) && !e.target.closest('.admin-brand')) {
      closeDrawer();
    }
  });

  window.addEventListener('popstate', closeDrawer);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeDrawer();
  });

  // ═══ 4. PWA Install Prompt ═══
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const dismissed = localStorage.getItem('admin_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    showInstallPrompt();
  });

  function showInstallPrompt() {
    if (document.querySelector('.arya-install-prompt')) return;

    const banner = document.createElement('div');
    banner.className = 'arya-install-prompt';
    banner.innerHTML = `
      <div class="arya-install-prompt-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <div class="arya-install-prompt-text">
        <strong>Install ARYANA Admin</strong>
        Install app for faster access
      </div>
      <button type="button" id="adminInstallBtn">Install</button>
      <button type="button" class="close-install" id="adminDismissBtn" aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    document.body.appendChild(banner);

    document.getElementById('adminInstallBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      deferredPrompt = null;
      banner.remove();
    });

    document.getElementById('adminDismissBtn').addEventListener('click', () => {
      localStorage.setItem('admin_install_dismissed', Date.now().toString());
      banner.remove();
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Installed!');
    deferredPrompt = null;
    document.querySelector('.arya-install-prompt')?.remove();
  });

  // iOS Safari manual hint
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (isIOS && !isStandalone) {
    const dismissed = localStorage.getItem('admin_install_dismissed');
    if (!dismissed || Date.now() - parseInt(dismissed) >= 7 * 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        if (document.querySelector('.arya-install-prompt')) return;

        const banner = document.createElement('div');
        banner.className = 'arya-install-prompt';
        banner.innerHTML = `
          <div class="arya-install-prompt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
          <div class="arya-install-prompt-text">
            <strong>Install on iPhone</strong>
            Tap <b>Share</b> → <b>Add to Home Screen</b>
          </div>
          <button type="button" class="close-install" id="adminDismissBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        `;
        document.body.appendChild(banner);

        document.getElementById('adminDismissBtn').addEventListener('click', () => {
          localStorage.setItem('admin_install_dismissed', Date.now().toString());
          banner.remove();
        });
      }, 3000);
    }
  }

})();