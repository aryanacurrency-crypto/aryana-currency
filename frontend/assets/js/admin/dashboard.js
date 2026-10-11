/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Dashboard
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // چک لاگین + ادمین
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

  await loadStats();
  await loadPendingOrders();
});

/**
 * لود آمار کلی
 */
async function loadStats() {
  try {
    const stats = await API.getAdminStats();

    document.getElementById('statUsers').textContent = Number(stats.total_users).toLocaleString();
    document.getElementById('statPending').textContent = Number(stats.pending_orders).toLocaleString();
    document.getElementById('statCompleted').textContent = Number(stats.completed_orders).toLocaleString();
    document.getElementById('statFees').textContent = Number(stats.total_fees_afn).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });

    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('contentBox').style.display = 'block';
  } catch (err) {
    console.error('Stats error:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">
        ${I18N.currentLang === 'en' ? 'Failed to load stats.'
        : I18N.currentLang === 'fa' ? 'بارگذاری آمار ناموفق بود.'
        : 'احصایې بارول ناکامې شوې.'}
      </p>
    `;
  }
}

/**
 * لود سفارشهای در انتظار
 */
async function loadPendingOrders() {
  try {
    const orders = await API.getPendingOrders();

    const empty = document.getElementById('pendingEmpty');
    const table = document.getElementById('pendingTableWrap');
    const body = document.getElementById('pendingBody');

    if (!orders.length) {
      empty.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    table.style.display = 'block';
    body.innerHTML = '';

    orders.forEach(order => {
      const tr = document.createElement('tr');
      const isBuy = order.side === 'BUY';

      const sideText = isBuy
        ? { en: 'BUY', fa: 'خرید', ps: 'پېر' }
        : { en: 'SELL', fa: 'فروش', ps: 'پلور' };

      const date = new Date(order.created_at).toLocaleDateString();

      tr.innerHTML = `
        <td><strong>${order.reference}</strong></td>
        <td><span class="order-side ${order.side.toLowerCase()}">${sideText[I18N.currentLang] || sideText.en}</span></td>
        <td>${Number(order.amount_usdt).toLocaleString()} USDT</td>
        <td><span class="order-status status-review">${I18N.currentLang === 'en' ? 'In Review' : I18N.currentLang === 'fa' ? 'در بازبینی' : 'په کتنه'}</span></td>
        <td>${date}</td>
        <td style="text-align:end;">
          <button class="btn-xs btn-xs-primary" data-review="${order.id}">
            ${I18N.currentLang === 'en' ? 'Review' : I18N.currentLang === 'fa' ? 'بررسی' : 'کتل'}
          </button>
        </td>
      `;

      tr.querySelector('[data-review]').addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `orders.html?id=${order.id}`;
      });

      body.appendChild(tr);
    });
  } catch (err) {
    console.error('Pending orders error:', err);
  }
}