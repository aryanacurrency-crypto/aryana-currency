/* ═══════════════════════════════════════
   ARYANA CURRENCY — Dashboard v2 Logic
   ═══════════════════════════════════════ */

let currentRate = null;
let hideBalance = false;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // Toggle Balance
  const toggleBtn = document.getElementById('toggleBalance');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleBalanceVisibility);

  // Show admin button
  showAdminButton();

  // Render user info from localStorage (quick)
  renderUserInfo();

  // Load profile + rate first
  await Promise.all([
    loadProfile(),
    loadRate(),
  ]);

  // Then load wallets, orders, stats (نیاز به rate دارن)
  await Promise.all([
    loadWallets(),
    loadRecentOrders(),
    loadStats(),
  ]);
});

/* ═══════════════════════════════════════
              Render User
   ═══════════════════════════════════════ */

function renderUserInfo() {
  const user = Auth.getUser();
  if (!user) return;

  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  const welcomeNameEl = document.getElementById('welcomeName');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = user.full_name?.split(' ')[0] || 'User';
  if (welcomeNameEl) welcomeNameEl.textContent = user.full_name?.split(' ')[0] || 'User';
}

function showAdminButton() {
  const user = Auth.getUser();
  const btn = document.getElementById('adminPanelBtn');
  if (!btn) return;

  if (user && user.role === 'ADMIN') {
    btn.style.display = 'grid';
  }
}

async function loadProfile() {
  try {
    const user = await API.me();
    Auth.setUser(user);

    const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const welcomeNameEl = document.getElementById('welcomeName');

    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl) nameEl.textContent = user.full_name?.split(' ')[0] || 'User';
    if (welcomeNameEl) welcomeNameEl.textContent = user.full_name?.split(' ')[0] || 'User';

    showAdminButton();
  } catch (err) {
    console.error('Profile load failed:', err);
  }
}

/* ═══════════════════════════════════════
                Rate
   ═══════════════════════════════════════ */

async function loadRate() {
  try {
    currentRate = await API.getCurrentRate();

    if (currentRate) {
      setText('statUsdtPrice', formatNumber(currentRate.sell_price_afn, 2) + ' AFN');
    }
  } catch (err) {
    console.error('Rate load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Wallets
   ═══════════════════════════════════════ */

async function loadWallets() {
  try {
    const wallets = await API.getWallets();
    const usdt = wallets.usdt || {};
    const afn = wallets.afn || {};

    const usdtBalance = Number(usdt.balance || 0);
    const usdtLocked = Number(usdt.locked_balance || 0);
    const afnBalance = Number(afn.balance || 0);

    // نرخ تبدیل
    const afnToUsd = currentRate ? (1 / Number(currentRate.sell_price_afn)) : (1 / 70.5);

    // محاسبه ارزش کل به دلار
    const usdtValueUsd = usdtBalance;
    const afnValueUsd = afnBalance * afnToUsd;
    const totalUsd = usdtValueUsd + afnValueUsd;

    // نمایش موجودی تتر
    setText('usdtBalance', formatNumber(usdtBalance, 2));
    setText('usdtValue', formatNumber(usdtValueUsd, 2));

    if (usdtLocked > 0) {
      const lockedEl = document.getElementById('usdtLocked');
      if (lockedEl) {
        lockedEl.style.display = 'inline-block';
        setText('usdtLockedAmount', formatNumber(usdtLocked, 2) + ' USDT');
      }
    }

    // نمایش موجودی افغانی
    setText('afnBalance', formatNumber(afnBalance, 2));
    setText('afnValue', formatNumber(afnValueUsd, 2));

    // نمایش کل
    setText('totalBalance', '$' + formatNumber(totalUsd, 2));
    setText('totalUsdt', formatNumber(totalUsd, 2) + ' USDT');

  } catch (err) {
    console.error('Wallets load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Stats
   ═══════════════════════════════════════ */

async function loadStats() {
  try {
    const orders = await API.getMyOrders();

    const totalOrders = orders.length;
    const completed = orders.filter(o => o.status === 'COMPLETED').length;
    const volume = orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.amount_usdt), 0);

    setText('statTotalOrders', totalOrders);
    setText('statCompleted', completed);
    setText('statVolume', formatNumber(volume, 2) + ' USDT');

    if (currentRate) {
      setText('statUsdtPrice', formatNumber(currentRate.sell_price_afn, 2) + ' AFN');
    }
  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Recent Orders
   ═══════════════════════════════════════ */

async function loadRecentOrders() {
  try {
    const orders = await API.getMyOrders();
    const recent = (orders || []).slice(0, 5);

    const container = document.getElementById('txList');
    const emptyEl = document.getElementById('txEmpty');

    if (!recent.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (!container) return;

    // پاک کردن قبلی
    container.innerHTML = '';
    container.appendChild(emptyEl);

    recent.forEach(order => {
      const isBuy = order.side === 'BUY';
      const item = document.createElement('div');
      item.className = 'tx-item';
      item.onclick = () => window.location.href = `order.html?id=${order.id}`;

      const statusLabels = {
        'PENDING': { en: 'Pending', fa: 'در انتظار', ps: 'په تمه' },
        'AWAITING_REVIEW': { en: 'In Review', fa: 'در بازبینی', ps: 'په کتنه' },
        'PROCESSING': { en: 'Processing', fa: 'در پردازش', ps: 'پروسس' },
        'COMPLETED': { en: 'Completed', fa: 'تکمیل شد', ps: 'بشپړ شو' },
        'CANCELLED': { en: 'Cancelled', fa: 'لغو شد', ps: 'لغوه' },
        'REJECTED': { en: 'Rejected', fa: 'رد شد', ps: 'رد شو' },
      };

      const statusLabel = (statusLabels[order.status] || {})[I18N.currentLang] || order.status;
      const timeAgo = getTimeAgo(new Date(order.created_at));

      item.innerHTML = `
        <div class="tx-icon ${isBuy ? 'buy' : 'sell'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isBuy
              ? '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'
              : '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'}
          </svg>
        </div>
        <div class="tx-details">
          <div class="tx-title">${isBuy ? 'Buy' : 'Sell'} USDT</div>
          <div class="tx-meta">
            <span>${order.reference}</span>
            <span>•</span>
            <span>${statusLabel}</span>
          </div>
        </div>
        <div class="tx-amount">
          <div class="tx-amount-value ${isBuy ? 'positive' : 'negative'}">
            ${isBuy ? '+' : '−'}${formatNumber(order.amount_usdt, 2)} USDT
          </div>
          <div class="tx-amount-time">${timeAgo}</div>
        </div>
      `;

      container.appendChild(item);
    });

  } catch (err) {
    console.error('Orders load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function toggleBalanceVisibility() {
  hideBalance = !hideBalance;
  const el = document.getElementById('totalBalance');
  const eq = document.getElementById('totalUsdt');

  if (hideBalance) {
    el.textContent = '••••••';
    el.classList.add('hidden');
    eq.textContent = '••••••';
  } else {
    loadWallets();
    el.classList.remove('hidden');
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatNumber(n, decimals = 2) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return I18N.currentLang === 'en' ? 'Just now' : I18N.currentLang === 'fa' ? 'همین الان' : 'همدا اوس';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}