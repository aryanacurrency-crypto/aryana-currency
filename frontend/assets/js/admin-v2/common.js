/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin v2 Common
   Shared logic for all admin pages
   ═══════════════════════════════════════ */

const AdminCommon = {
  // Active page (از body dataset گرفته میشه)
  activePage: null,

  /* ═══════════════════════════════════════
                Init
     ═══════════════════════════════════════ */

  async init() {
    // چک ادمین
    Auth.requireLogin();
    if (!Auth.isAdmin()) {
      window.location.href = '../dashboard-v2.html';
      return;
    }

    // تم
    Theme.init();

    // زبان
    const initialLang = I18N.detectInitialLang();
    await I18N.load(initialLang);
    I18N.apply();

    // Active page
    this.activePage = document.body.dataset.adminPage || 'dashboard';

    // Sidebar
    this.renderSidebar();

    // Topbar actions
    this.setupTopbar();

    // Badge updates
    this.updateBadges();
  },

  /* ═══════════════════════════════════════
                Sidebar
     ═══════════════════════════════════════ */

  renderSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    const items = [
      {
        href: 'index-v2.html',
        icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
        label: 'Dashboard',
        key: 'dashboard',
      },
      {
        href: 'orders-v2.html',
        icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
        label: 'Orders',
        key: 'orders',
        badge: 'orders',
      },
      {
        href: 'kyc-v2.html',
        icon: '<path d="M9 12l2 2 4-4"/><path d="M21 12c0 5-3.5 8.5-9 10-5.5-1.5-9-5-9-10V5l9-3 9 3z"/>',
        label: 'KYC',
        key: 'kyc',
        badge: 'kyc',
      },
      {
        href: 'withdrawals-v2.html',
        icon: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
        label: 'Withdrawals',
        key: 'withdrawals',
        badge: 'withdrawals',
      },
      {
        href: 'rates-v2.html',
        icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        label: 'Rates',
        key: 'rates',
      },
      {
        href: 'users-v2.html',
        icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        label: 'Users',
        key: 'users',
      },
    ];

    let html = '<nav class="admin-nav">';

    items.forEach(item => {
      const isActive = item.key === this.activePage;
      const badgeHtml = item.badge
        ? `<span class="nav-count" id="badge-${item.badge}" style="display:none;">0</span>`
        : '';

      html += `
        <a href="${item.href}" class="admin-nav-item ${isActive ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${item.icon}
          </svg>
          <span class="nav-text">${item.label}</span>
          ${badgeHtml}
        </a>
      `;
    });

    // Divider + back to site
    html += `
      <div class="admin-nav-divider"></div>
      <a href="../dashboard-v2.html" class="admin-nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        <span class="nav-text">Back to site</span>
      </a>
    `;

    html += '</nav>';
    sidebar.innerHTML = html;
  },

  /* ═══════════════════════════════════════
                Topbar
     ═══════════════════════════════════════ */

  setupTopbar() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }

    // Refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }

    // Back button (اگه صفحه خودش نداره)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
  },

  /* ═══════════════════════════════════════
                Badges
     ═══════════════════════════════════════ */

  async updateBadges() {
    // سفارش‌های در انتظار
    try {
      const pending = await API.getPendingOrders();
      this.setBadge('orders', pending.length);
    } catch (e) {
      console.error('Badge orders failed:', e);
    }

    // KYC در انتظار
    try {
      const stats = await API.getKycStats();
      this.setBadge('kyc', stats.pending_documents || 0);
    } catch (e) {
      console.error('Badge KYC failed:', e);
    }

    // برداشت‌های در انتظار
    try {
      const stats = await API.request('/withdrawals/admin/stats');
      this.setBadge('withdrawals', stats.pending || 0);
    } catch (e) {
      console.error('Badge withdrawals failed:', e);
    }
  },

  setBadge(key, count) {
    const badge = document.getElementById(`badge-${key}`);
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  },

  /* ═══════════════════════════════════════
                Helpers
     ═══════════════════════════════════════ */

  formatNumber(n, decimals = 2) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  formatDate(dateStr, options = {}) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const defaults = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', { ...defaults, ...options });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  timeAgo(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    return this.formatDate(dateStr);
  },

  statusBadge(status) {
    const map = {
      'PENDING': { cls: 'gold', text: 'Pending' },
      'AWAITING_REVIEW': { cls: 'blue', text: 'In Review' },
      'PROCESSING': { cls: 'processing', text: 'Processing' },
      'COMPLETED': { cls: 'green', text: 'Completed' },
      'CANCELLED': { cls: 'gray', text: 'Cancelled' },
      'REJECTED': { cls: 'red', text: 'Rejected' },
    };
    const s = map[status] || { cls: 'gray', text: status };
    return `<span class="admin-badge ${s.cls}">${s.text}</span>`;
  },

  sideBadge(side) {
    const isBuy = side === 'BUY';
    return `<span class="admin-badge ${isBuy ? 'green' : 'red'}">${isBuy ? '▲ BUY' : '▼ SELL'}</span>`;
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  },

  /* ═══════════════════════════════════════
                UI Helpers
     ═══════════════════════════════════════ */

  showLoading() {
    const loading = document.getElementById('loadingBox');
    const content = document.getElementById('contentBox');
    if (loading) loading.style.display = 'block';
    if (content) content.style.display = 'none';
  },

  hideLoading() {
    const loading = document.getElementById('loadingBox');
    const content = document.getElementById('contentBox');
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
  },

  showEmpty(wrapId, emptyId) {
    const wrap = document.getElementById(wrapId);
    const empty = document.getElementById(emptyId);
    if (wrap) wrap.style.display = 'none';
    if (empty) empty.style.display = 'block';
  },

  hideEmpty(wrapId, emptyId) {
    const wrap = document.getElementById(wrapId);
    const empty = document.getElementById(emptyId);
    if (wrap) wrap.style.display = 'block';
    if (empty) empty.style.display = 'none';
  },
};

/* ═══════════════════════════════════════
              Auto-init
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // اگه common.js لود شده، خودکار init میکنه
  // مگر اینکه صفحه خودش flag بذاره
  if (!window.ADMIN_SKIP_AUTO_INIT) {
    AdminCommon.init();
  }
});