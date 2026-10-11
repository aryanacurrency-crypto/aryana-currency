/* ═══════════════════════════════════════
   ARYANA CURRENCY — Dashboard Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // ۱. چک لاگین
  Auth.requireLogin();

  // ۲. تم
  Theme.init();

  // ۳. زبان
  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = I18N.currentLang;
    langSelect.addEventListener('change', (e) => I18N.setLanguage(e.target.value));
  }

  // ۴. خروج
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  // ۵. نمایش اطلاعات کاربر از localStorage
  renderUserInfo();

  // ۶. نمایش دکمه ادمین اگه کاربر ادمین هست
  showAdminButton();

  // ۷. لود داده‌ها از API
  await Promise.all([
    loadUserProfile(),
    loadWallets(),
    loadRecentOrders(),
  ]);
});

/**
 * نمایش اطلاعات کاربر از localStorage (سریع)
 */
function renderUserInfo() {
  const user = Auth.getUser();
  if (!user) return;

  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
  const avatar = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  const welcomeName = document.getElementById('welcomeName');

  if (avatar) avatar.textContent = initial;
  if (nameEl) nameEl.textContent = user.full_name || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
  if (welcomeName) welcomeName.textContent = (user.full_name || 'User').split(' ')[0];
}

/**
 * نمایش دکمه Admin Panel اگه کاربر ادمین هست
 */
function showAdminButton() {
  const user = Auth.getUser();
  const btn = document.getElementById('adminPanelBtn');

  if (!btn) return;

  if (user && user.role === 'ADMIN') {
    btn.style.display = 'inline-flex';
  } else {
    btn.style.display = 'none';
  }
}

/**
 * گرفتن اطلاعات به‌روز کاربر از API
 */
async function loadUserProfile() {
  try {
    const user = await API.me();
    Auth.setUser(user);

    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const avatar = document.getElementById('userAvatar');
    const welcomeName = document.getElementById('welcomeName');

    if (nameEl) nameEl.textContent = user.full_name || 'User';
    if (emailEl) emailEl.textContent = user.email || '';
    if (avatar) avatar.textContent = (user.full_name || user.email || '?').charAt(0).toUpperCase();
    if (welcomeName) welcomeName.textContent = (user.full_name || 'User').split(' ')[0];

    // چک مجدد نقش کاربر (اگه از آخرین لاگین عوض شده باشه)
    showAdminButton();
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

/**
 * لود کیف پول‌ها
 */
async function loadWallets() {
  try {
    const wallets = await API.getWallets();
    const usdt = wallets.usdt || {};
    const afn = wallets.afn || {};

    const usdtEl = document.getElementById('usdtBalance');
    const afnEl = document.getElementById('afnBalance');
    const usdtLocked = document.getElementById('usdtLocked');

    const fmt = (n, decimals = 2) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (usdtEl) {
      const bal = Number(usdt.balance || 0);
      usdtEl.textContent = `${fmt(bal, 2)} USDT`;
    }

    if (afnEl) {
      const bal = Number(afn.balance || 0);
      afnEl.textContent = `${fmt(bal, 2)} AFN`;
    }

    if (usdtLocked) {
      const locked = Number(usdt.locked_balance || 0);
      if (locked > 0) {
        usdtLocked.style.display = 'inline-block';
        usdtLocked.querySelector('strong').textContent = `${fmt(locked, 2)} USDT`;
      } else {
        usdtLocked.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Failed to load wallets:', err);
  }
}

/**
 * لود سفارش‌های اخیر
 */
async function loadRecentOrders() {
  try {
    const orders = await API.getMyOrders();
    const recent = (orders || []).slice(0, 5);

    const emptyEl = document.getElementById('ordersEmpty');
    const tableEl = document.getElementById('ordersTable');
    const bodyEl = document.getElementById('ordersBody');

    if (!recent.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (tableEl) tableEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (tableEl) tableEl.style.display = 'table';
    if (bodyEl) bodyEl.innerHTML = '';

    recent.forEach(order => {
      const tr = document.createElement('tr');

      const statusMap = {
        'PENDING': 'status-pending',
        'AWAITING_REVIEW': 'status-review',
        'PROCESSING': 'status-processing',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled',
        'REJECTED': 'status-rejected',
      };

      const statusText = {
        'PENDING': I18N.currentLang === 'en' ? 'Pending' : I18N.currentLang === 'fa' ? 'در انتظار' : 'په تمه',
        'AWAITING_REVIEW': I18N.currentLang === 'en' ? 'In Review' : I18N.currentLang === 'fa' ? 'در بازبینی' : 'په کتنه',
        'PROCESSING': I18N.currentLang === 'en' ? 'Processing' : I18N.currentLang === 'fa' ? 'در حال پردازش' : 'پروسس',
        'COMPLETED': I18N.currentLang === 'en' ? 'Completed' : I18N.currentLang === 'fa' ? 'تکمیل' : 'بشپړ',
        'CANCELLED': I18N.currentLang === 'en' ? 'Cancelled' : I18N.currentLang === 'fa' ? 'لغو شده' : 'لغوه',
        'REJECTED': I18N.currentLang === 'en' ? 'Rejected' : I18N.currentLang === 'fa' ? 'رد شده' : 'رد شوی',
      };

      const sideText = order.side === 'BUY'
        ? (I18N.currentLang === 'en' ? 'BUY' : I18N.currentLang === 'fa' ? 'خرید' : 'پېر')
        : (I18N.currentLang === 'en' ? 'SELL' : I18N.currentLang === 'fa' ? 'فروش' : 'پلور');

      const date = new Date(order.created_at).toLocaleDateString();

      tr.innerHTML = `
        <td><strong>${order.reference}</strong></td>
        <td><span class="order-side ${order.side.toLowerCase()}">${sideText}</span></td>
        <td>${Number(order.amount_usdt).toLocaleString()} USDT</td>
        <td><span class="order-status ${statusMap[order.status] || ''}">${statusText[order.status] || order.status}</span></td>
        <td>${date}</td>
      `;

      bodyEl.appendChild(tr);
    });

  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}