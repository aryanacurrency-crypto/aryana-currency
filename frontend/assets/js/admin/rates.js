/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Rates
   ═══════════════════════════════════════ */

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

  const form = document.getElementById('rateForm');
  form.addEventListener('submit', handleSubmit);

  await loadCurrentRate();
  await loadHistory();
});

/**
 * لود نرخ فعلی
 */
async function loadCurrentRate() {
  try {
    const rate = await API.getCurrentRate();

    document.getElementById('currentBuy').textContent = `${fmt(rate.buy_price_afn)} AFN`;
    document.getElementById('currentSell').textContent = `${fmt(rate.sell_price_afn)} AFN`;
    document.getElementById('currentUpdated').textContent = new Date(rate.created_at).toLocaleString();

    // پر کردن فرم با مقدار فعلی (برای راحتی)
    document.getElementById('buyPrice').value = rate.buy_price_afn;
    document.getElementById('sellPrice').value = rate.sell_price_afn;
  } catch (err) {
    console.error('Load current rate failed:', err);
    document.getElementById('currentBuy').textContent = '—';
    document.getElementById('currentSell').textContent = '—';
    document.getElementById('currentUpdated').textContent = 
      I18N.currentLang === 'en' ? 'No active rate set' 
      : I18N.currentLang === 'fa' ? 'نرخ فعالی تنظیم نشده' 
      : 'فعال نرخ نه دی ټاکل شوی';
  }
}

/**
 * لود تاریخچه نرخها
 */
async function loadHistory() {
  try {
    const history = await API.getRateHistory(20);
    const body = document.getElementById('historyBody');

    if (!history.length) {
      body.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--muted);">
        ${I18N.currentLang === 'en' ? 'No history.' 
        : I18N.currentLang === 'fa' ? 'تاریخچه‌ای نیست.' 
        : 'تاریخچه نشته.'}
      </td></tr>`;
      return;
    }

    body.innerHTML = '';
    history.forEach(rate => {
      const tr = document.createElement('tr');
      const isActive = rate.is_active;
      const date = new Date(rate.created_at).toLocaleString();

      tr.innerHTML = `
        <td><strong>${fmt(rate.buy_price_afn)}</strong></td>
        <td><strong>${fmt(rate.sell_price_afn)}</strong></td>
        <td>
          <span class="order-status ${isActive ? 'status-completed' : 'status-cancelled'}">
            ${isActive 
              ? (I18N.currentLang === 'en' ? 'Active' : I18N.currentLang === 'fa' ? 'فعال' : 'فعال')
              : (I18N.currentLang === 'en' ? 'Inactive' : I18N.currentLang === 'fa' ? 'غیرفعال' : 'غیر فعال')}
          </span>
        </td>
        <td style="font-size:11px; color:var(--muted);">${date}</td>
      `;
      body.appendChild(tr);
    });
  } catch (err) {
    console.error('Load history failed:', err);
  }
}

/**
 * ذخیره نرخ جدید
 */
async function handleSubmit(e) {
  e.preventDefault();

  const successBox = document.getElementById('successBox');
  const errorBox = document.getElementById('errorBox');
  const submitBtn = document.getElementById('submitBtn');

  successBox.style.display = 'none';
  errorBox.style.display = 'none';

  const buyPrice = parseFloat(document.getElementById('buyPrice').value);
  const sellPrice = parseFloat(document.getElementById('sellPrice').value);

  // اعتبارسنجی
  if (isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0 || sellPrice <= 0) {
    showError(I18N.currentLang === 'en' ? 'Please enter valid prices.'
            : I18N.currentLang === 'fa' ? 'لطفاً نرخ‌های معتبر وارد کنید.'
            : 'مهرباني وکړئ سم نرخونه ولیکئ.');
    return;
  }

  if (sellPrice <= buyPrice) {
    showError(I18N.currentLang === 'en' ? 'Sell price must be higher than buy price.'
            : I18N.currentLang === 'fa' ? 'نرخ فروش باید بالاتر از نرخ خرید باشد.'
            : 'د پلور نرخ باید د پېر له نرخ لوړ وي.');
    return;
  }

  submitBtn.disabled = true;
  const orig = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="spinner"></span>';

  try {
    await API.setRate(buyPrice, sellPrice);

    showSuccess(I18N.currentLang === 'en' ? 'Rate updated successfully.'
              : I18N.currentLang === 'fa' ? 'نرخ با موفقیت به‌روزرسانی شد.'
              : 'نرخ په بریالیتوب سره تازه شو.');

    await loadCurrentRate();
    await loadHistory();

    setTimeout(() => { successBox.style.display = 'none'; }, 3000);
  } catch (err) {
    console.error('Set rate error:', err);
    let msg = err.detail || 'Failed to save rate.';
    if (msg.includes('بزرگتر')) {
      msg = I18N.currentLang === 'en' ? 'Sell price must be higher than buy price.'
          : I18N.currentLang === 'fa' ? 'نرخ فروش باید بالاتر از نرخ خرید باشد.'
          : 'د پلور نرخ باید د پېر له نرخ لوړ وي.';
    }
    showError(msg);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = orig;
  }
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(msg) {
  const box = document.getElementById('successBox');
  box.textContent = msg;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}