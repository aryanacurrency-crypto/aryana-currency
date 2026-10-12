/* ═══════════════════════════════════════
   ARYANA CURRENCY — Exchange v2 Logic
   Trade page
   ═══════════════════════════════════════ */

let currentRate = null;
let currentSide = 'BUY';
let currentWallets = null;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // Show admin button
  showAdminButton();

  // Render user info
  renderUserInfo();

  // تشخیص side از URL
  const params = new URLSearchParams(window.location.search);
  const sideParam = params.get('side');
  if (sideParam === 'SELL') {
    currentSide = 'SELL';
  }

  // Setup
  setupTabs();
  setupInputs();
  setupQuickAmounts();
  setupSwapButton();
  setupForm();

  // Load data
  await Promise.all([
    loadProfile(),
    loadRate(),
    loadWallets(),
  ]);

  // Apply side
  applySide();

  // Calculate اولیه
  calculate();
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
              Load Data
   ═══════════════════════════════════════ */

async function loadProfile() {
  try {
    const user = await API.me();
    Auth.setUser(user);
    showAdminButton();

    const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl) nameEl.textContent = (user.full_name || 'User').split(' ')[0];
  } catch (err) {
    console.error('Profile load failed:', err);
  }
}

async function loadRate() {
  try {
    currentRate = await API.getCurrentRate();

    const fmt = (n) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setText('rateBadge', `${fmt(currentRate.sell_price_afn)} AFN`);
  } catch (err) {
    console.error('Rate load failed:', err);
    Notify.error('Could not load exchange rate.');
  }
}

async function loadWallets() {
  try {
    currentWallets = await API.getWallets();
    updateBalanceDisplay();
  } catch (err) {
    console.error('Wallets load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Setup
   ═══════════════════════════════════════ */

function setupTabs() {
  document.querySelectorAll('.trade-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const side = tab.dataset.side;
      if (side === currentSide) return;

      currentSide = side;
      applySide();
      calculate();
    });
  });
}

function applySide() {
  const isBuy = currentSide === 'BUY';

  // Tabs
  document.querySelectorAll('.trade-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.side === currentSide);
  });

  // Title
  setText('formTitle', isBuy ? 'Buy USDT' : 'Sell USDT');
  setText('sideCardTitle', isBuy ? 'How to Buy' : 'How to Sell');

  // Submit
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.dataset.side = currentSide;
    const span = submitBtn.querySelector('span');
    if (span) span.textContent = isBuy ? 'Buy Now' : 'Sell Now';
  }

  // Pay/Receive
  if (isBuy) {
    // کاربر AFN میده، USDT میگیره
    setText('payLabel', 'You Pay');
    setText('receiveLabel', 'You Receive');
    setText('payCurrency', 'AFN');
    setText('receiveCurrency', 'USDT');
    const payIcon = document.getElementById('payCurrencyIcon');
    const receiveIcon = document.getElementById('receiveCurrencyIcon');
    if (payIcon) payIcon.className = 'currency-icon afn';
    if (receiveIcon) receiveIcon.className = 'currency-icon usdt';
    if (payIcon) payIcon.textContent = '؋';
    if (receiveIcon) receiveIcon.textContent = '₮';

    // Rate badge
    if (currentRate) {
      const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setText('rateBadge', `${fmt(currentRate.sell_price_afn)} AFN`);
    }

    // Steps
    setText('step1Text', 'Enter the amount of AFN you want to pay.');
    setText('step2Text', 'Review the rate and how much USDT you get.');
    setText('step3Text', 'Continue to see payment instructions.');
    setText('step4Text', 'Our team verifies and sends USDT to your wallet.');

  } else {
    // کاربر USDT میده، AFN میگیره
    setText('payLabel', 'You Pay');
    setText('receiveLabel', 'You Receive');
    setText('payCurrency', 'USDT');
    setText('receiveCurrency', 'AFN');
    const payIcon = document.getElementById('payCurrencyIcon');
    const receiveIcon = document.getElementById('receiveCurrencyIcon');
    if (payIcon) payIcon.className = 'currency-icon usdt';
    if (receiveIcon) receiveIcon.className = 'currency-icon afn';
    if (payIcon) payIcon.textContent = '₮';
    if (receiveIcon) receiveIcon.textContent = '؋';

    // Rate badge
    if (currentRate) {
      const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setText('rateBadge', `${fmt(currentRate.buy_price_afn)} AFN`);
    }

    // Steps
    setText('step1Text', 'Enter the amount of USDT you want to sell.');
    setText('step2Text', 'Review the rate and how much AFN you get.');
    setText('step3Text', 'Continue to see wallet address for payment.');
    setText('step4Text', 'Our team verifies and sends AFN to your Hesab Pay.');
  }

  // Placeholder
  const input = document.getElementById('amountUsdt');
  if (input) input.placeholder = '0';

  // Reset input
  if (input) input.value = '';

  // Balance display
  updateBalanceDisplay();
}

function updateBalanceDisplay() {
  if (!currentWallets) return;

  const usdt = currentWallets.usdt || {};
  const afn = currentWallets.afn || {};

  const usdtBal = Number(usdt.balance || 0) - Number(usdt.locked_balance || 0);
  const afnBal = Number(afn.balance || 0);

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // در BUY کاربر AFN میده → موجودی AFN
  // در SELL کاربر USDT میده → موجودی USDT
  const payBalanceWrap = document.getElementById('payBalanceWrap');
  const payBalanceEl = document.getElementById('payBalance');

  if (currentSide === 'BUY') {
    if (payBalanceEl) payBalanceEl.textContent = `${fmt(afnBal)} AFN`;
  } else {
    if (payBalanceEl) payBalanceEl.textContent = `${fmt(usdtBal)} USDT`;
  }

  if (payBalanceWrap) payBalanceWrap.style.display = 'inline';
}

/* ═══════════════════════════════════════
              Inputs
   ═══════════════════════════════════════ */

function setupInputs() {
  const input = document.getElementById('amountUsdt');
  if (!input) return;

  input.addEventListener('input', (e) => {
    // فقط اعداد و نقطه
    let value = e.target.value.replace(/[^\d.]/g, '');
    // فقط یه نقطه
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    e.target.value = value;
    calculate();
  });
}

function setupQuickAmounts() {
  document.querySelectorAll('.quick-amount').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('amountUsdt');
      if (!input) return;
      input.value = btn.dataset.amount;
      calculate();
    });
  });
}

function setupSwapButton() {
  const btn = document.getElementById('swapBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    currentSide = currentSide === 'BUY' ? 'SELL' : 'BUY';
    applySide();
    calculate();
  });
}

/* ═══════════════════════════════════════
              Calculate
   ═══════════════════════════════════════ */

function calculate() {
  const input = document.getElementById('amountUsdt');
  const output = document.getElementById('amountAfn');
  const sumRate = document.getElementById('sumRate');
  const sumFee = document.getElementById('sumFee');
  const sumTotal = document.getElementById('sumTotal');
  const sumTotalLabel = document.getElementById('sumTotalLabel');

  if (!currentRate) return;

  const amount = parseFloat(input.value) || 0;
  const isBuy = currentSide === 'BUY';

  const rate = isBuy
    ? Number(currentRate.sell_price_afn)
    : Number(currentRate.buy_price_afn);

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (amount <= 0) {
    output.value = '0';
    if (sumRate) sumRate.textContent = `${fmt(rate)} AFN`;
    if (sumFee) sumFee.textContent = '0.00 AFN';
    if (sumTotal) sumTotal.textContent = '0.00 AFN';
    return;
  }

  if (isBuy) {
    // کاربر AFN میده، USDT میگیره
    const gross = amount / rate;         // USDT
    const grossAfn = amount;              // AFN
    const fee = grossAfn * 0.015;         // AFN
    const totalAfn = grossAfn;            // کاربر اینقدر AFN میده (کارمزد داخل نرخ)

    output.value = fmt(gross);
    if (sumRate) sumRate.textContent = `${fmt(rate)} AFN`;
    if (sumFee) sumFee.textContent = `${fmt(fee)} AFN`;
    if (sumTotalLabel) sumTotalLabel.textContent = 'Total to Pay';
    if (sumTotal) sumTotal.textContent = `${fmt(totalAfn)} AFN`;

  } else {
    // کاربر USDT میده، AFN میگیره
    const grossAfn = amount * rate;       // AFN
    const fee = grossAfn * 0.015;         // AFN
    const totalAfn = grossAfn - fee;      // AFN دریافتی

    output.value = fmt(grossAfn);
    if (sumRate) sumRate.textContent = `${fmt(rate)} AFN`;
    if (sumFee) sumFee.textContent = `${fmt(fee)} AFN`;
    if (sumTotalLabel) sumTotalLabel.textContent = 'Total to Receive';
    if (sumTotal) sumTotal.textContent = `${fmt(totalAfn)} AFN`;
  }
}

/* ═══════════════════════════════════════
              Form Submit
   ═══════════════════════════════════════ */

function setupForm() {
  const form = document.getElementById('tradeForm');
  const btn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    errorBox.style.display = 'none';

    const input = document.getElementById('amountUsdt');
    const amount = parseFloat(input.value);

    // Validation
    if (!amount || amount <= 0) {
      Notify.warning('Please enter a valid amount.');
      return;
    }

    const isBuy = currentSide === 'BUY';

    // حداقل
    if (isBuy) {
      // کاربر AFN میده → حداقل معادل 10 USDT
      const rate = Number(currentRate.sell_price_afn);
      const minAfn = 10 * rate;
      if (amount < minAfn) {
        Notify.warning(`Minimum order is 10 USDT (≈ ${minAfn.toFixed(2)} AFN).`);
        return;
      }
    } else {
      // کاربر USDT میده → حداقل 10 USDT
      if (amount < 10) {
        Notify.warning('Minimum order is 10 USDT.');
        return;
      }

      // چک موجودی USDT
      if (currentWallets) {
        const usdt = currentWallets.usdt || {};
        const avail = Number(usdt.balance || 0) - Number(usdt.locked_balance || 0);
        if (amount > avail) {
          Notify.error(`Insufficient USDT balance. Available: ${avail.toFixed(2)}`);
          return;
        }
      }
    }

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      // ساخت سفارش
      // API ما side و amount_usdt می‌خواد
      let amountUsdt;

      if (isBuy) {
        // کاربر AFN داده → تبدیل به USDT
        const rate = Number(currentRate.sell_price_afn);
        amountUsdt = amount / rate;
      } else {
        // کاربر USDT داده
        amountUsdt = amount;
      }

      const order = await API.createOrder(currentSide, amountUsdt.toFixed(2));

      Notify.success('Order created. Redirecting...');

      setTimeout(() => {
        window.location.href = `order.html?id=${order.id}`;
      }, 800);

    } catch (err) {
      console.error('Order failed:', err);
      let msg = err.detail || 'Failed to create order.';

      if (msg.includes('حداقل')) {
        msg = 'Minimum order is 10 USDT.';
      } else if (msg.includes('موجودی')) {
        msg = 'Insufficient balance.';
      }

      Notify.error(msg);
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}