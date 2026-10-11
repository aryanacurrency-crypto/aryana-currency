/* ═══════════════════════════════════════
   ARYANA CURRENCY — Orders List Page
   ═══════════════════════════════════════ */

let allOrders = [];
let currentFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // زبان
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = I18N.currentLang;
    langSelect.addEventListener('change', (e) => {
      I18N.setLanguage(e.target.value).then(() => {
        renderOrders();
      });
    });
  }

  // خروج
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  // فیلترها
  document.querySelectorAll('.exchange-tab[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.exchange-tab[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderOrders();
    });
  });

  // لود سفارشها
  await loadOrders();
});

/**
 * لود همه سفارشها از API
 */
async function loadOrders() {
  try {
    allOrders = await API.getMyOrders();
    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'block';
    renderOrders();
  } catch (err) {
    console.error('Failed to load orders:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">
        ${I18N.currentLang === 'en' ? 'Could not load orders.' 
        : I18N.currentLang === 'fa' ? 'بارگذاری سفارش‌ها ناموفق بود.' 
        : 'غوښتنې بارول ناکام شوې.'}
      </p>
    `;
  }
}

/**
 * رندر سفارشها با فیلتر فعلی
 */
function renderOrders() {
  const empty = document.getElementById('emptyBox');
  const table = document.getElementById('ordersTable');
  const body = document.getElementById('ordersBody');

  // فیلتر
  const filtered = currentFilter
    ? allOrders.filter(o => o.status === currentFilter)
    : allOrders;

  if (!filtered.length) {
    empty.style.display = 'block';
    table.style.display = 'none';
    body.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  table.style.display = 'table';
  body.innerHTML = '';

  filtered.forEach(order => {
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
      'PROCESSING': { en: 'Processing', fa: 'در حال پردازش', ps: 'پروسس' },
      'COMPLETED': { en: 'Completed', fa: 'تکمیل', ps: 'بشپړ' },
      'CANCELLED': { en: 'Cancelled', fa: 'لغو شده', ps: 'لغوه' },
      'REJECTED': { en: 'Rejected', fa: 'رد شده', ps: 'رد شوی' },
    };

    const sideText = isBuy
      ? { en: 'BUY', fa: 'خرید', ps: 'پېر' }
      : { en: 'SELL', fa: 'فروش', ps: 'پلور' };

    const date = new Date(order.created_at).toLocaleDateString();
    const amount = Number(order.amount_usdt).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const lang = I18N.currentLang;

    tr.innerHTML = `
      <td><strong>${order.reference}</strong></td>
      <td><span class="order-side ${order.side.toLowerCase()}">${sideText[lang] || sideText.en}</span></td>
      <td>${amount} USDT</td>
      <td><span class="order-status ${statusMap[order.status] || ''}">${(statusText[order.status] || {})[lang] || order.status}</span></td>
      <td>${date}</td>
      <td style="text-align:end;">→</td>
    `;

    tr.addEventListener('click', () => {
      window.location.href = `order.html?id=${order.id}`;
    });

    body.appendChild(tr);
  });
}