/* ═══════════════════════════════════════
   ARYANA CURRENCY — Command Palette
   ⌘K / Ctrl+K · Spotlight-style
   ═══════════════════════════════════════ */

const CommandPalette = (() => {
  let overlay = null;
  let input = null;
  let results = null;
  let selectedIndex = 0;
  let filteredItems = [];
  let allItems = [];
  let isOpen = false;

  /* ═══════════════════════════════════════
     📋 COMMAND DEFINITIONS
     اینجا هر چیزی که کاربر باید بتونه پیدا کنه
     ═══════════════════════════════════════ */

  function getCommands() {
    return [
      // ─── Navigation ───
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        subtitle: 'Go to dashboard',
        icon: 'grid',
        iconVariant: 'navy',
        group: 'Navigation',
        keywords: ['home', 'dashboard', 'overview', 'داشبورد', 'اصلی'],
        href: 'dashboard.html',
      },
      {
        id: 'nav-trade',
        title: 'Trade USDT',
        subtitle: 'Buy or sell USDT',
        icon: 'exchange',
        iconVariant: 'navy',
        group: 'Navigation',
        keywords: ['trade', 'exchange', 'convert', 'تبادل', 'معامله'],
        href: 'exchange.html',
      },
      {
        id: 'nav-p2p',
        title: 'P2P Market',
        subtitle: 'Direct trades with other users',
        icon: 'users',
        iconVariant: 'purple',
        group: 'Navigation',
        keywords: ['p2p', 'peer', 'direct', 'مستقیم'],
        href: 'p2p/index.html',
      },
      {
        id: 'nav-orders',
        title: 'My Orders',
        subtitle: 'View all your orders',
        icon: 'file',
        iconVariant: 'navy',
        group: 'Navigation',
        keywords: ['orders', 'history', 'سفارشات', 'تاریخچه'],
        href: 'orders.html',
      },
      {
        id: 'nav-profile',
        title: 'Profile',
        subtitle: 'Your account & settings',
        icon: 'user',
        iconVariant: 'navy',
        group: 'Navigation',
        keywords: ['profile', 'account', 'settings', 'پروفایل', 'حساب'],
        href: 'profile.html',
      },
      {
        id: 'nav-wheel',
        title: 'Lucky Wheel',
        subtitle: 'Spin to win rewards',
        icon: 'wheel',
        iconVariant: 'purple',
        group: 'Navigation',
        keywords: ['wheel', 'spin', 'lucky', 'گردونه', 'جایزه'],
        href: 'lucky-wheel.html',
      },
      {
        id: 'nav-referral',
        title: 'Referral',
        subtitle: 'Invite friends & earn',
        icon: 'gift',
        iconVariant: 'purple',
        group: 'Navigation',
        keywords: ['referral', 'invite', 'gift', 'رفرال', 'دعوت'],
        href: 'referral.html',
      },

      // ─── Trade Actions ───
      {
        id: 'action-buy',
        title: 'Buy USDT',
        subtitle: 'Start a buy order',
        icon: 'arrow-down-left',
        iconVariant: 'green',
        group: 'Quick Actions',
        keywords: ['buy', 'purchase', 'خرید'],
        href: 'exchange.html?side=BUY',
      },
      {
        id: 'action-sell',
        title: 'Sell USDT',
        subtitle: 'Start a sell order',
        icon: 'arrow-up-right',
        iconVariant: 'red',
        group: 'Quick Actions',
        keywords: ['sell', 'فروش'],
        href: 'exchange.html?side=SELL',
      },

      // ─── Wallet Actions ───
      {
        id: 'action-deposit',
        title: 'Deposit',
        subtitle: 'Add funds to your wallet',
        icon: 'arrow-down',
        iconVariant: 'green',
        group: 'Wallet',
        keywords: ['deposit', 'add', 'topup', 'واریز', 'افزودن'],
        href: 'deposit.html',
      },
      {
        id: 'action-withdraw',
        title: 'Withdraw',
        subtitle: 'Withdraw funds',
        icon: 'arrow-up',
        iconVariant: 'red',
        group: 'Wallet',
        keywords: ['withdraw', 'cash out', 'برداشت'],
        href: 'withdraw.html',
      },

      // ─── Account ───
      {
        id: 'account-security',
        title: 'Security Settings',
        subtitle: 'Password, 2FA & sessions',
        icon: 'shield',
        iconVariant: 'navy',
        group: 'Account',
        keywords: ['security', 'password', '2fa', 'امنیت', 'رمز'],
        href: 'profile.html#security',
      },
      {
        id: 'account-kyc',
        title: 'Verification (KYC)',
        subtitle: 'Verify your identity',
        icon: 'check-circle',
        iconVariant: 'green',
        group: 'Account',
        keywords: ['kyc', 'verify', 'identity', 'احراز', 'تایید'],
        href: 'profile.html#kyc',
      },
      {
        id: 'account-referral',
        title: 'Referral Code',
        subtitle: 'Copy your referral link',
        icon: 'link',
        iconVariant: 'purple',
        group: 'Account',
        keywords: ['referral', 'code', 'link', 'کد', 'لینک'],
        action: 'copyReferral',
      },

      // ─── Support ───
      {
        id: 'support-contact',
        title: 'Contact Support',
        subtitle: 'We are here 24/7',
        icon: 'message-circle',
        iconVariant: 'navy',
        group: 'Support',
        keywords: ['support', 'help', 'contact', 'پشتیبانی', 'کمک'],
        href: 'contact.html',
      },
      {
        id: 'support-terms',
        title: 'Terms & Privacy',
        subtitle: 'Read our policies',
        icon: 'file',
        iconVariant: 'navy',
        group: 'Support',
        keywords: ['terms', 'privacy', 'legal', 'قوانین', 'حریم'],
        href: 'terms.html',
      },

      // ─── Theme & Language ───
      {
        id: 'settings-theme',
        title: 'Toggle Theme',
        subtitle: 'Switch between light and dark',
        icon: 'moon',
        iconVariant: 'purple',
        group: 'Settings',
        keywords: ['theme', 'dark', 'light', 'تم', 'حالت'],
        action: 'toggleTheme',
      },
      {
        id: 'settings-lang-en',
        title: 'English',
        subtitle: 'Switch to English',
        icon: 'globe',
        iconVariant: 'navy',
        group: 'Language',
        keywords: ['english', 'en', 'انگلیسی'],
        action: 'setLang',
        langCode: 'en',
      },
      {
        id: 'settings-lang-fa',
        title: 'فارسی',
        subtitle: 'Switch to Persian',
        icon: 'globe',
        iconVariant: 'navy',
        group: 'Language',
        keywords: ['persian', 'fa', 'farsi', 'فارسی'],
        action: 'setLang',
        langCode: 'fa',
      },
      {
        id: 'settings-lang-ps',
        title: 'پښتو',
        subtitle: 'Switch to Pashto',
        icon: 'globe',
        iconVariant: 'navy',
        group: 'Language',
        keywords: ['pashto', 'ps', 'پشتو'],
        action: 'setLang',
        langCode: 'ps',
      },

      // ─── Auth ───
      {
        id: 'auth-logout',
        title: 'Logout',
        subtitle: 'Sign out of your account',
        icon: 'log-out',
        iconVariant: 'red',
        group: 'Account',
        keywords: ['logout', 'sign out', 'خروج'],
        action: 'logout',
      },
    ];
  }

  /* ═══════════════════════════════════════
     🎨 SVG ICONS
     ═══════════════════════════════════════ */

  const ICONS = {
    'grid': '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    'exchange': '<path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/>',
    'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'wheel': '<circle cx="12" cy="12" r="10"/><path d="M12 2v10l7 5"/>',
    'gift': '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    'arrow-down-left': '<line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>',
    'arrow-up-right': '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
    'arrow-down': '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    'arrow-up': '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  };

  /* ═══════════════════════════════════════
     🚀 INIT
     ═══════════════════════════════════════ */

  function init() {
    allItems = getCommands();
    buildUI();
    bindEvents();
  }

  /* ═══════════════════════════════════════
     🏗️ BUILD UI
     ═══════════════════════════════════════ */

  function buildUI() {
    if (document.getElementById('cmdOverlay')) return;

    overlay = document.createElement('div');
    overlay.className = 'cmd-overlay';
    overlay.id = 'cmdOverlay';
    overlay.innerHTML = `
      <div class="cmd-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="cmd-search">
          <svg class="cmd-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${ICONS.search}
          </svg>
          <input
            type="text"
            class="cmd-input"
            id="cmdInput"
            placeholder="Search or jump to..."
            autocomplete="off"
            spellcheck="false"
          >
          <kbd class="cmd-kbd">ESC</kbd>
        </div>

        <div class="cmd-results" id="cmdResults"></div>

        <div class="cmd-footer">
          <div class="cmd-footer-hints">
            <div class="cmd-footer-hint">
              <kbd class="cmd-kbd cmd-kbd-sm">↑</kbd>
              <kbd class="cmd-kbd cmd-kbd-sm">↓</kbd>
              <span>Navigate</span>
            </div>
            <div class="cmd-footer-hint">
              <kbd class="cmd-kbd cmd-kbd-sm">↵</kbd>
              <span>Select</span>
            </div>
            <div class="cmd-footer-hint">
              <kbd class="cmd-kbd cmd-kbd-sm">ESC</kbd>
              <span>Close</span>
            </div>
          </div>
          <div class="cmd-footer-brand">
            <span class="cmd-footer-brand-dot"></span>
            <span>ARYANA OS</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    input = document.getElementById('cmdInput');
    results = document.getElementById('cmdResults');
  }

  /* ═══════════════════════════════════════
     🎯 BIND EVENTS
     ═══════════════════════════════════════ */

  function bindEvents() {
    // ─── Global keydown ───
    document.addEventListener('keydown', handleGlobalKey);

    // ─── Overlay click (close if clicking outside) ───
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // ─── Input events ───
    input.addEventListener('input', handleSearch);

    // ─── Keyboard navigation inside input ───
    input.addEventListener('keydown', handleInputKey);
  }

  function handleGlobalKey(e) {
    // ⌘K / Ctrl+K → open
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isOpen) close();
      else open();
      return;
    }

    // "/" alone (when not typing in input/textarea) → open
    if (e.key === '/' && !isTypingContext()) {
      e.preventDefault();
      open();
      return;
    }

    // ESC → close
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  }

  function isTypingContext() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  function handleInputKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectedIndex = 0;
      renderResults();
    } else if (e.key === 'End') {
      e.preventDefault();
      selectedIndex = filteredItems.length - 1;
      renderResults();
    }
  }

  /* ═══════════════════════════════════════
     🔍 SEARCH
     ═══════════════════════════════════════ */

  function handleSearch() {
    selectedIndex = 0;
    filterAndRender(input.value);
  }

  function filterAndRender(query) {
    const q = (query || '').trim().toLowerCase();

    if (!q) {
      filteredItems = allItems.slice();
    } else {
      filteredItems = allItems
        .map((item) => {
          const score = scoreItem(item, q);
          return score > 0 ? { ...item, _score: score } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b._score - a._score);
    }

    renderResults(q);
  }

  function scoreItem(item, q) {
    let score = 0;

    const title = item.title.toLowerCase();
    const subtitle = (item.subtitle || '').toLowerCase();
    const group = (item.group || '').toLowerCase();
    const keywords = (item.keywords || []).map((k) => String(k).toLowerCase());

    // Exact title match
    if (title === q) score += 1000;

    // Title starts with query
    if (title.startsWith(q)) score += 500;

    // Title contains query
    if (title.includes(q)) score += 300;

    // Keyword starts with
    for (const kw of keywords) {
      if (kw === q) score += 400;
      if (kw.startsWith(q)) score += 200;
      if (kw.includes(q)) score += 100;
    }

    // Subtitle contains
    if (subtitle.includes(q)) score += 50;

    // Group contains
    if (group.includes(q)) score += 30;

    return score;
  }

  /* ═══════════════════════════════════════
     🎨 RENDER
     ═══════════════════════════════════════ */

  function renderResults(query = '') {
    if (filteredItems.length === 0) {
      results.innerHTML = `
        <div class="cmd-empty">
          <div class="cmd-empty-icon">🔍</div>
          <div class="cmd-empty-title">No results found</div>
          <div class="cmd-empty-text">
            Try a different keyword, or use <kbd>⌘K</kbd> to search again.
          </div>
        </div>
      `;
      return;
    }

    // Group items
    const grouped = {};
    filteredItems.forEach((item, index) => {
      const g = item.group || 'Other';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push({ ...item, _index: index });
    });

    let html = '';
    for (const groupName in grouped) {
      html += `<div class="cmd-group">`;
      html += `<div class="cmd-group-title">${escapeHtml(groupName)}</div>`;
      for (const item of grouped[groupName]) {
        html += renderItem(item, query);
      }
      html += `</div>`;
    }

    results.innerHTML = html;

    // Bind click events
    results.querySelectorAll('.cmd-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        selectedIndex = idx;
        executeSelected();
      });
      el.addEventListener('mouseenter', () => {
        const idx = parseInt(el.dataset.index, 10);
        if (idx !== selectedIndex) {
          selectedIndex = idx;
          updateSelectedVisual();
        }
      });
    });

    scrollSelectedIntoView();
  }

  function renderItem(item, query) {
    const isSelected = item._index === selectedIndex;
    const iconSvg = ICONS[item.icon] || ICONS.grid;
    const highlighted = highlightMatch(item.title, query);

    return `
      <div class="cmd-item ${isSelected ? 'selected' : ''}" data-index="${item._index}" data-id="${item.id}">
        <div class="cmd-item-icon ${item.iconVariant || 'navy'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${iconSvg}
          </svg>
        </div>
        <div class="cmd-item-content">
          <div class="cmd-item-title">${highlighted}</div>
          <div class="cmd-item-subtitle">${escapeHtml(item.subtitle || '')}</div>
        </div>
        <div class="cmd-item-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    `;
  }

  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const safeText = escapeHtml(text);
    const safeQuery = escapeRegExp(query);
    const regex = new RegExp(`(${safeQuery})`, 'ig');
    return safeText.replace(regex, '<mark>$1</mark>');
  }

  /* ═══════════════════════════════════════
     ⌨️ SELECTION
     ═══════════════════════════════════════ */

  function moveSelection(delta) {
    if (filteredItems.length === 0) return;
    selectedIndex = (selectedIndex + delta + filteredItems.length) % filteredItems.length;
    updateSelectedVisual();
    scrollSelectedIntoView();
  }

  function updateSelectedVisual() {
    results.querySelectorAll('.cmd-item').forEach((el) => {
      const idx = parseInt(el.dataset.index, 10);
      el.classList.toggle('selected', idx === selectedIndex);
    });
  }

  function scrollSelectedIntoView() {
    const selected = results.querySelector('.cmd-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /* ═══════════════════════════════════════
     ▶️ EXECUTE
     ═══════════════════════════════════════ */

  function executeSelected() {
    const item = filteredItems[selectedIndex];
    if (!item) return;
    execute(item);
  }

  function execute(item) {
    close();

    // Small delay so the close animation plays
    setTimeout(() => {
      // ─── Custom actions ───
      if (item.action) {
        runAction(item);
        return;
      }

      // ─── Navigate ───
      if (item.href) {
        window.location.href = item.href;
      }
    }, 120);
  }

  function runAction(item) {
    switch (item.action) {
      case 'toggleTheme':
        if (typeof Theme !== 'undefined' && Theme.toggle) {
          Theme.toggle();
        } else {
          // Fallback: toggle manually
          const html = document.documentElement;
          const isDark = html.classList.contains('dark');
          html.classList.toggle('dark', !isDark);
          html.classList.toggle('light', isDark);
          html.setAttribute('data-theme', isDark ? 'light' : 'dark');
          localStorage.setItem('aryana_theme', isDark ? 'light' : 'dark');
        }
        break;

      case 'setLang':
        if (item.langCode && typeof I18N !== 'undefined') {
          I18N.load(item.langCode).then(() => {
            I18N.apply();
            if (typeof Notify !== 'undefined') {
              Notify.success('Language changed');
            }
          });
        }
        break;

      case 'copyReferral':
        copyReferralLink();
        break;

      case 'logout':
        if (typeof Notify !== 'undefined' && Notify.confirm) {
          Notify.confirm({
            title: 'Logout',
            message: 'Are you sure you want to sign out?',
            type: 'danger',
          }).then((ok) => {
            if (ok && typeof Auth !== 'undefined') Auth.logout();
          });
        } else if (typeof Auth !== 'undefined') {
          Auth.logout();
        }
        break;
    }
  }

  function copyReferralLink() {
    const user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
    const code = user?.referral_code || user?.username || 'ARYANA';
    const url = `${window.location.origin}/pages/register.html?ref=${code}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        if (typeof Notify !== 'undefined') Notify.success('Referral link copied!');
      }).catch(() => {
        if (typeof Notify !== 'undefined') Notify.error('Failed to copy');
      });
    } else {
      // Fallback
      const tmp = document.createElement('textarea');
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      if (typeof Notify !== 'undefined') Notify.success('Referral link copied!');
    }
  }

  /* ═══════════════════════════════════════
     🚪 OPEN / CLOSE
     ═══════════════════════════════════════ */

  function open() {
    if (isOpen) return;
    isOpen = true;

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    input.value = '';
    selectedIndex = 0;
    filterAndRender('');

    // Focus after animation
    setTimeout(() => input.focus(), 80);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    overlay.classList.remove('show');
    document.body.style.overflow = '';

    // Blur input to hide mobile keyboard
    if (input) input.blur();
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  /* ═══════════════════════════════════════
     🔗 TRIGGER BUTTON (توی هدر)
     ═══════════════════════════════════════ */

  function bindTriggers() {
    document.querySelectorAll('[data-cmd-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
    });
  }

  /* ═══════════════════════════════════════
     🛠️ HELPERS
     ═══════════════════════════════════════ */

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ═══════════════════════════════════════
     🌍 PUBLIC API
     ═══════════════════════════════════════ */

  return {
    init,
    open,
    close,
    toggle,
    bindTriggers,
    /** اضافه کردن دستور جدید به صورت داینامیک */
    addCommand(cmd) {
      allItems.push(cmd);
    },
    /** حذف دستور */
    removeCommand(id) {
      allItems = allItems.filter((c) => c.id !== id);
    },
  };
})();

/* ═══════════════════════════════════════
   🚀 AUTO-INIT
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  CommandPalette.init();
  CommandPalette.bindTriggers();
});

window.CommandPalette = CommandPalette;