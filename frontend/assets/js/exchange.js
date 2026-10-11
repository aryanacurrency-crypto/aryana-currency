/* ═══════════════════════════════════════
   ARYANA CURRENCY — Exchange Page Logic
   ═══════════════════════════════════════ */

const ExchangeState = {
  side: 'BUY',
  rate: null,
  wallets: null,
};

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
      I18N.setLanguage(e.target.value).then(updateAll);
    });
  }

  // تشخیص side از URL
  const params = new URLSearchParams(window.location.search);
  const sideParam = params.get('side');
  if (sideParam === 'SELL') {
    ExchangeState.side = 'SELL';
  }

  // راهاندازی تبها
  setupTabs();

  // دکمههای مقدار سریع
  document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.quick;
      const input = document.getElementById('amountUsdt');
      input.value = val;
      calculate();
    });
  });

  // ورودی مقدار
  const amountInput = document.getElementById('amountUsdt');
  amountInput.addEventListener('input', calculate);

  // فرم
  const form = document.getElementById('exchangeForm');
  form.addEventListener('submit', handleSubmit);

  // بارگذاری نرخ و کیف پولها
  await loadData();

  // آپدیت اولیه
  updateAll();
});

/**
 * تنظیم تبها (BUY/SELL)
 */
function setupTabs() {
  const tabBuy = document.getElementById('tabBuy');
  const tabSell = document.getElementById('tabSell');

  tabBuy.addEventListener('click', () => setSide('BUY'));
  tabSell.addEventListener('click', () => setSide('SELL'));

  updateTabsUI();
}

function setSide(side) {
  ExchangeState.side = side;
  updateTabsUI();
  updateAll();
  calculate();
}

function updateTabsUI() {
  const tabBuy = document.getElementById('tabBuy');
  const tabSell = document.getElementById('tabSell');

  tabBuy.classList.toggle('active', ExchangeState.side === 'BUY');
  tabSell.classList.toggle('active', ExchangeState.side === 'SELL');
  tabBuy.classList.toggle('buy', ExchangeState.side === 'BUY');
  tabSell.classList.toggle('sell', ExchangeState.side === 'SELL');
}

/**
 * آپدیت همه متنهای وابسته به side
 */
function updateAll() {
  const isBuy = ExchangeState.side === 'BUY';

  // عنوان فرم
  const formTitle = document.getElementById('formTitle');
  if (formTitle) {
    formTitle.textContent = isBuy
      ? I18N.t('exchangeFormTitleBuy') || 'Buy USDT'
      : I18N.t('exchangeFormTitleSell') || 'Sell USDT';
  }

  // برچسب total
  const totalLabel = document.getElementById('sumTotalLabel');
  if (totalLabel) {
    totalLabel.textContent = isBuy
      ? (I18N.t('exchangeYouPay') || 'You pay')
      : (I18N.t('exchangeYouReceive') || 'You receive');
  }

  // عنوان راهنما
  const instrTitle = document.getElementById('instructionsTitle');
  if (instrTitle) {
    instrTitle.textContent = isBuy
      ? (I18N.t('exchangeHowToBuy') || 'How to buy')
      : (I18N.t('exchangeHowToSell') || 'How to sell');
  }

  // آیتمهای راهنما
  const list = document.getElementById('instructionsList');
  if (list) {
    const keys = isBuy
      ? ['exchangeStep1Buy', 'exchangeStep2Buy', 'exchangeStep3Buy', 'exchangeStep4Buy', 'exchangeStep5Buy']
      : ['exchangeStep1Sell', 'exchangeStep2Sell', 'exchangeStep3Sell', 'exchangeStep4Sell', 'exchangeStep5Sell'];

    list.innerHTML = '';
    keys.forEach(k => {
      const li = document.createElement('li');
      li.setAttribute('data-i18n', k);
      li.textContent = I18N.t(k);
      list.appendChild(li);
    });
  }
}

/**
 * بارگذاری نرخ و کیف پول
 */
async function loadData() {
  try {
    const [rate, wallets] = await Promise.all([
      API.getCurrentRate(),
      API.getWallets(),
    ]);
    ExchangeState.rate = rate;
    ExchangeState.wallets = wallets;
  } catch (err) {
    console.error('Failed to load data:', err);
    showError(I18N.currentLang === 'en' ? 'Could not load exchange rate.'
            : I18N.currentLang === 'fa' ? 'بارگذاری نرخ ناموفق بود.'
            : 'د نرخ بارول ناکام شو.');
  }
}

/**
 * محاسبه و نمایش
 */
function calculate() {
  const amountInput = document.getElementById('amountUsdt');
  const amount = parseFloat(amountInput.value);

  const sumRate = document.getElementById('sumRate');
  const sumGross = document.getElementById('sumGross');
  const sumFee = document.getElementById('sumFee');
  const sumTotal = document.getElementById('sumTotal');

  if (!ExchangeState.rate || isNaN(amount) || amount <= 0) {
    sumRate.textContent = '—';
    sumGross.textContent = '—';
    sumFee.textContent = '—';
    sumTotal.textContent = '—';
    return;
  }

  const isBuy = ExchangeState.side === 'BUY';
  const rate = isBuy
    ? Number(ExchangeState.rate.sell_price_afn)
    : Number(ExchangeState.rate.buy_price_afn);

  const gross = amount * rate;
  const fee = gross * 0.015; // 1.5%
  const total = isBuy ? (gross + fee) : (gross - fee);

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  sumRate.textContent = `${fmt(rate)} AFN`;
  sumGross.textContent = `${fmt(gross)} AFN`;
  sumFee.textContent = `${fmt(fee)} AFN`;
  sumTotal.textContent = `${fmt(total)} AFN`;
}

/**
 * ارسال سفارش
 */
async function handleSubmit(e) {
  e.preventDefault();

  const errorBox = document.getElementById('errorBox');
  errorBox.style.display = 'none';

  const amountInput = document.getElementById('amountUsdt');
  const submitBtn = document.getElementById('submitBtn');
  const amount = parseFloat(amountInput.value);

  // اعتبارسنجی
  if (isNaN(amount) || amount < 10) {
    showError(I18N.currentLang === 'en' ? 'Minimum order is 10 USDT.'
            : I18N.currentLang === 'fa' ? 'حداقل سفارش ۱۰ تتر است.'
            : 'لږترلږه غوښتنه ۱۰ تتر ده.');
    return;
  }

  // برای SELL، چک موجودی
  if (ExchangeState.side === 'SELL' && ExchangeState.wallets) {
    const usdt = ExchangeState.wallets.usdt;
    const avail = Number(usdt.balance) - Number(usdt.locked_balance);
    if (amount > avail) {
      showError(I18N.currentLang === 'en' ? `Insufficient USDT balance. Available: ${avail.toFixed(2)}`
              : I18N.currentLang === 'fa' ? `موجودی تتر کافی نیست. موجودی: ${avail.toFixed(2)}`
              : `د تتر موجودي بس نه ده. شته: ${avail.toFixed(2)}`);
      return;
    }
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="spinner"></span>';

  try {
    const order = await API.createOrder(ExchangeState.side, amount);
    // موفق → برو به صفحه جزئیات سفارش
    window.location.href = `order.html?id=${order.id}`;
  } catch (err) {
    console.error('Order error:', err);
    let msg = err.detail || 'Order failed.';
    if (msg.includes('حداقل')) {
      msg = I18N.currentLang === 'en' ? 'Minimum order is 10 USDT.'
          : I18N.currentLang === 'fa' ? 'حداقل سفارش ۱۰ تتر است.'
          : 'لږترلږه غوښتنه ۱۰ تتر ده.';
    } else if (msg.includes('موجودی')) {
      msg = I18N.currentLang === 'en' ? 'Insufficient balance.'
          : I18N.currentLang === 'fa' ? 'موجودی کافی نیست.'
          : 'موجودي بس نه ده.';
    } else if (err.status === 0) {
      msg = I18N.currentLang === 'en' ? 'Cannot connect to server.'
          : I18N.currentLang === 'fa' ? 'اتصال به سرور برقرار نشد.'
          : 'سرور سره اړیکه نشوه.';
    }
    showError(msg);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function showError(msg) {
  const errorBox = document.getElementById('errorBox');
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}