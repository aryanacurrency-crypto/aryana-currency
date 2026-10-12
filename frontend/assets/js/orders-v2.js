/* ═══════════════════════════════════════
   ARYANA CURRENCY — Orders v2 Logic
   Orders list (Binance-style)
   ═══════════════════════════════════════ */

let allOrders = [];
let currentTab = 'open';
let currentFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  showAdminButton();
  renderUserInfo();

  // Main tabs
  document.querySelectorAll('.main-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;

      // فیلتر Pill
      const pills = document.getElementById('filterPills');
      if (pills) {
        pills.style.display = currentTab === 'all' ? 'flex' : 'none';
      }

      renderOrders();
    });
  });

  // Filter pills (فقط در tab All)
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderOrders();
    });
  });

  await loadOrders();
});

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function showAdminButton() {
  const user = Auth.getUser();
  const btn = document.getElementById('adminPanelBtn');
  if (btn && user && user.role === 'ADMIN') {
    btn.style.display = 'grid';
  }
}

function renderUserInfo() {
  const user = Auth.getUser();
  if (!user) return;

  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = (user.full_name || 'User').split(' ')[0];
}

/* ═══════════════════════════════════════
              Load Orders
   ═══════════════════════════════════════ */

async function loadOrders() {
  try {
    try {
      const user = await API.me();
      Auth.setUser(user);
      showAdminButton();
      const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
      const avatarEl = document.getElementById('userAvatar');
      const nameEl = document.getElementById('userName');
      if (avatarEl) avatarEl.textContent = initial;
      if (nameEl) nameEl.textContent = (user.full_name || 'User').split(' ')[0];
    } catch (e) {
      console.error('Profile load failed:', e);
    }

    allOrders = await API.getMyOrders() || [];

    document.getElementById('loadingBox').style.display = 'none';

    renderStats();
    renderOrders();

  } catch (err) {
    console.error('Load orders failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">Could not load orders.</p>
    `;
  }
}

/* ═══════════════════════════════════════
              Stats
   ═══════════════════════════════════════ */

function renderStats() {
  const total = allOrders.length;
  const completed = allOrders.filter(o => o.status === 'COMPLETED').length;
  const pending = allOrders.filter(o =>
    o.status === 'PENDING' || o.status === 'AWAITING_REVIEW' || o.status === 'PROCESSING'
  ).length;
  const volume = allOrders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.amount_usdt || 0), 0);

  const fmt = (n, decimals = 2) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  setText('statTotal', total);
  setText('statCompleted', completed);
  setText('statPending', pending);
  setText('statVolume', fmt(volume, 2) + ' USDT');

  // Tab counts
  setText('tabCountOpen', pending);
  setText('tabCountHistory', completed);
  setText('tabCountAll', total);
}

/* ═══════════════════════════════════════
              Render Orders
   ═══════════════════════════════════════ */

function renderOrders() {
  const list = document.getElementById('ordersList');
  const empty = document.getElementById('emptyBox');

  // فیلتر بر اساس tab
  let filtered = allOrders;

  if (currentTab === 'open') {
    filtered = allOrders.filter(o =>
      o.status === 'PENDING' || o.status === 'AWAITING_REVIEW' || o.status === 'PROCESSING'
    );
  } else if (currentTab === 'history') {
    filtered = allOrders.filter(o =>
      o.status === 'COMPLETED' || o.status === 'CANCELLED' || o.status === 'REJECTED'
    );
  }

  // فیلتر بر اساس side (در tab All)
  if (currentTab === 'all' && currentFilter) {
    filtered = filtered.filter(o => o.side === currentFilter);
  }

  if (!filtered.length) {
    list.style.display = 'none';
    empty.style.display = 'block';

    const title = document.getElementById('emptyTitle');
    const text = document.getElementById('emptyText');

    if (currentTab === 'open') {
      if (title) title.textContent = 'No open orders';
      if (text) text.textContent = 'You have no active orders right now.';
    } else if (currentTab === 'history') {
      if (title) title.textContent = 'No order history';
      if (text) text.textContent = 'Your completed orders will appear here.';
    } else {
      if (title) title.textContent = 'No orders yet';
      if (text) text.textContent = 'Start by making your first exchange.';
    }
    return;
  }

  empty.style.display = 'none';
  list.style.display = 'flex';
  list.innerHTML = '';

  filtered.forEach(order => {
    const card = createOrderCard(order);
    list.appendChild(card);
  });
}

/* ═══════════════════════════════════════
              Order Card
   ═══════════════════════════════════════ */

function createOrderCard(order) {
  const isBuy = order.side === 'BUY';

  const card = document.createElement('div');
  card.className = `order-card-item ${isBuy ? 'buy' : 'sell'}`;
  card.onclick = () => {
    window.location.href = `order-v2.html?id=${order.id}`;
  };

  // Status config
  const statusConfig = {
    'PENDING': { cls: 'pending', text: 'Pending' },
    'AWAITING_REVIEW': { cls: 'review', text: 'In Review' },
    'PROCESSING': { cls: 'processing', text: 'Processing' },
    'COMPLETED': { cls: 'completed', text: 'Completed' },
    'CANCELLED': { cls: 'cancelled', text: 'Cancelled' },
    'REJECTED': { cls: 'rejected', text: 'Rejected' },
  };
  const s = statusConfig[order.status] || { cls: '', text: order.status };

  // Progress steps
  const progressMap = {
    'PENDING': 1,
    'AWAITING_REVIEW': 2,
    'PROCESSING': 3,
    'COMPLETED': 4,
  };
  const currentStep = progressMap[order.status] || 0;

  let progressHtml = '';
  if (order.status === 'CANCELLED') {
    progressHtml = `<div class="progress-step cancelled"></div><div class="progress-step cancelled"></div><div class="progress-step cancelled"></div><div class="progress-step cancelled"></div>`;
  } else if (order.status === 'REJECTED') {
    progressHtml = `<div class="progress-step rejected"></div><div class="progress-step rejected"></div><div class="progress-step rejected"></div><div class="progress-step rejected"></div>`;
  } else {
    for (let i = 1; i <= 4; i++) {
      if (i < currentStep) {
        progressHtml += `<div class="progress-step done"></div>`;
      } else if (i === currentStep) {
        progressHtml += `<div class="progress-step active"></div>`;
      } else {
        progressHtml += `<div class="progress-step"></div>`;
      }
    }
  }

  // Time ago
  const timeAgo = getTimeAgo(new Date(order.created_at));

  const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

  card.innerHTML = `
    <div class="order-card-head">
      <div class="order-side-badge">
        <div class="order-side-icon ${isBuy ? 'buy' : 'sell'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isBuy
              ? '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'
              : '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'}
          </svg>
        </div>
        <div>
          <div class="order-side-title ${isBuy ? 'buy' : 'sell'}">
            ${isBuy ? 'BUY USDT' : 'SELL USDT'}
          </div>
          <div class="order-side-ref">${order.reference}</div>
        </div>
      </div>

      <div class="order-status-badge ${s.cls}">${s.text}</div>
    </div>

    <div class="order-card-stats">
      <div class="order-stat">
        <div class="order-stat-label">Amount</div>
        <div class="order-stat-value">
          ${fmt(order.amount_usdt)}<small>USDT</small>
        </div>
      </div>
      <div class="order-stat">
        <div class="order-stat-label">Rate</div>
        <div class="order-stat-value">
          ${fmt(order.rate_afn_per_usdt)}<small>AFN</small>
        </div>
      </div>
      <div class="order-stat">
        <div class="order-stat-label">${isBuy ? 'Total Paid' : 'Total Received'}</div>
        <div class="order-stat-value">
          ${fmt(order.net_afn)}<small>AFN</small>
        </div>
      </div>
    </div>

    <div class="order-progress">
      ${progressHtml}
    </div>

    <div class="order-card-foot">
      <div class="order-time">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        ${timeAgo}
      </div>

      <div class="order-view-btn">
        <span>View</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </div>
  `;

  return card;
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}