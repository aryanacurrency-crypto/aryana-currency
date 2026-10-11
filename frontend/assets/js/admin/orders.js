/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Orders List
   ═══════════════════════════════════════ */

let currentFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  if (!Auth.isAdmin()) {
    window.location.href = '../dashboard.html';
    return;
  }

  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = I18N.currentLang;
    langSelect.addEventListener('change', (e) => I18N.setLanguage(e.target.value));
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // فیلترها
  document.querySelectorAll('.exchange-tab[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.exchange-tab[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadOrders();
    });
  });

  await loadOrders();
});

/**
 * لود سفارشها
 */
async function loadOrders() {
  document.getElementById('loadingBox').style.display = 'block';
  document.getElementById('ordersSection').style.display = 'none';

  try {
    const orders = await API.getAdminOrders(currentFilter || null);

    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'block';

    const empty = document.getElementById('emptyBox');
    const table = document.getElementById('ordersTable');
    const body = document.getElementById('ordersBody');

    if (!orders.length) {
      empty.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    table.style.display = 'table';
    body.innerHTML = '';

    orders.forEach(order => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';

      const isBuy = order.side === 'BUY';

      const statusMap = {
        'PENDING': 'status-pending',
        'AWAITING_REVIEW': 'status-review',
        'PROCESSING': 'status-processing',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled',
        'REJECTED': 'status-rejected',
      };

      const statusText = {
        'PENDING': { en: 'Pending', fa: 'در انتظار', ps: 'په تمه' },
        'AWAITING_REVIEW': { en: 'In Review', fa: 'در بازبینی', ps: 'په کتنه' },
        'PROCESSING': { en: 'Processing', fa: 'در پردازش', ps: 'پروسس' },
        'COMPLETED': { en: 'Completed', fa: 'تکمیل', ps: 'بشپړ' },
        'CANCELLED': { en: 'Cancelled', fa: 'لغو', ps: 'لغوه' },
        'REJECTED': { en: 'Rejected', fa: 'رد شده', ps: 'رد شوی' },
      };

      const sideText = isBuy
        ? { en: 'BUY', fa: 'خرید', ps: 'پېر' }
        : { en: 'SELL', fa: 'فروش', ps: 'پلور' };

      const lang = I18N.currentLang;
      const date = new Date(order.created_at).toLocaleString();

      tr.innerHTML = `
        <td><strong>${order.reference}</strong></td>
        <td><span class="order-side ${order.side.toLowerCase()}">${sideText[lang] || sideText.en}</span></td>
        <td>${Number(order.amount_usdt).toLocaleString()} USDT</td>
        <td><span class="order-status ${statusMap[order.status] || ''}">${(statusText[order.status] || {})[lang] || order.status}</span></td>
        <td style="font-size:11px; color:var(--muted);">${date}</td>
        <td style="text-align:end;">→</td>
      `;

      tr.addEventListener('click', () => {
        window.location.href = `order-detail.html?id=${order.id}`;
      });

      body.appendChild(tr);
    });
  } catch (err) {
    console.error('Load orders failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">
        ${I18N.currentLang === 'en' ? 'Could not load orders.'
        : I18N.currentLang === 'fa' ? 'بارگذاری سفارش‌ها ناموفق بود.'
        : 'غوښتنې بارول ناکامې شوې.'}
      </p>
    `;
  }
}