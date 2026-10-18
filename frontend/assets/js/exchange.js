/* ═══════════════════════════════════════
   ARYANA CURRENCY — Exchange v3 Logic
   Live rate · Flash · Sparkline · API
   ═══════════════════════════════════════ */

let currentRate = null;
let previousRate = null;
let currentSide = 'BUY';
let currentWallets = null;
let rateHistory = [];
let pollingInterval = null;

const POLL_INTERVAL = 5000; // 5s

/* ═══════════════════════════════════════
   🚀 INIT
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // Theme toggle
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => Theme.toggle());

  // Show admin
  showAdminButton();

  // Render user
  renderUserInfo();

  // Side از URL
  const params = new URLSearchParams(window.location.search);
  const sideParam = params.get('side');
  if (sideParam === 'SELL') {
    currentSide = 'SELL';
  } else if (sideParam === 'BUY') {
    currentSide = 'BUY';
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
  calculate();

  // Live polling
  startLivePolling();
});

/* ═══════════════════════════════════════
   👤 USER
   ═══════════════════════════════════════ */

function renderUserInfo() {
  const user = Auth.getUser();
  if (!user) return;

  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
  const nameEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = (user.full_name || 'User').split(' ')[0];
}

function showAdminButton() {
  const user = Auth.getUser();
  const btn = document.getElementById('adminPanelBtn');
  if (btn && user && user.role === 'ADMIN') {
    btn.style.display = 'grid';
  }
}

async function loadProfile() {
  try {
    const user = await API.me();
    Auth.setUser(user);
    showAdminButton();
    renderUserInfo();
  } catch (err) {
    console.error('Profile load failed:', err);
  }
}

/* ═══════════════════════════════════════
   💱 RATE + LIVE POLLING
   ═══════════════════════════════════════ */

async function loadRate() {
  try {
    const rate = await API.getCurrentRate();
    if (!rate) return;

    previousRate = currentRate;
    currentRate = rate;

    const price = Number(rate.sell_price_afn);
    rateHistory.push(price);
    if (rateHistory.length > 20) rateHistory.shift();

    updateRateUI(rate);
    drawSparkline();
  } catch (err) {
    console.error('Rate load failed:', err);
  }
}

function updateRateUI(rate) {
  const sellPrice = Number(rate.sell_price_afn);
  const buyPrice = Number(rate.buy_price_afn);

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const badge = document.getElementById('rateBadge');
  if (badge) {
    const activeRate = currentSide === 'BUY' ? sellPrice : buyPrice;
    badge.textContent = `${fmt(activeRate)} AFN`;

    if (previousRate) {
      const prev = currentSide === 'BUY'
        ? Number(previousRate.sell_price_afn)
        : Number(previousRate.buy_price_afn);
      flashElement(badge, activeRate, prev);
    }
  }

  const liveValue = document.getElementById('liveRateValue');
  if (liveValue) {
    liveValue.textContent = `${fmt(sellPrice)} AFN`;
    if (previousRate) {
      const prev = Number(previousRate.sell_price_afn);
      flashElement(liveValue, sellPrice, prev);
    }
  }

  if (previousRate) {
    const prev = Number(previousRate.sell_price_afn);
    const diff = sellPrice - prev;
    const pct = prev > 0 ? (diff / prev) * 100 : 0;
    const isUp = diff >= 0;

    const changeEl = document.getElementById('liveRateChange');
    if (changeEl) {
      changeEl.classList.toggle('up', isUp);
      changeEl.classList.toggle('down', !isUp);

      const pctEl = document.getElementById('liveRatePct');
      if (pctEl) {
        pctEl.textContent = (isUp ? '+' : '') + pct.toFixed(2) + '%';
      }

      const svg = changeEl.querySelector('svg polyline');
      if (svg) {
        svg.setAttribute('points', isUp ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
      }
    }
  }

  const label = document.getElementById('liveRateLabel');
  if (label) {
    label.textContent = 'USDT / AFN';
  }
}

function flashElement(el, newVal, oldVal) {
  if (!el || newVal === oldVal) return;

  el.classList.remove('flash-up', 'flash-down');
  void el.offsetWidth;

  if (newVal > oldVal) {
    el.classList.add('flash-up');
  } else if (newVal < oldVal) {
    el.classList.add('flash-down');
  }

  setTimeout(() => {
    el.classList.remove('flash-up', 'flash-down');
  }, 900);
}

function startLivePolling() {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    if (document.hidden) return;
    await loadRate();
  }, POLL_INTERVAL);
}

/* ═══════════════════════════════════════
   📈 SPARKLINE
   ═══════════════════════════════════════ */

function drawSparkline() {
  const line = document.getElementById('sparkLine');
  const area = document.getElementById('sparkArea');
  if (!line || !area) return;

  let data = rateHistory.slice();

  if (data.length < 2) {
    data = [66.5, 66.6, 66.7, 66.65, 66.8, 66.75, 66.85, 66.80];
  }

  const W = 200;
  const H = 40;
  const PAD = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const step = (W - PAD * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = PAD + i * step;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${H} L${points[0].x.toFixed(1)},${H} Z`;

  line.setAttribute('d', linePath);
  area.setAttribute('d', areaPath);
}

/* ═══════════════════════════════════════
   👛 WALLETS
   ═══════════════════════════════════════ */

async function loadWallets() {
  try {
    currentWallets = await API.getWallets();
    updateBalanceDisplay();
  } catch (err) {
    console.error('Wallets load failed:', err);
  }
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

  const payBalanceWrap = document.getElementById('payBalanceWrap');
  const payBalanceEl = document.getElementById('payBalance');

  if (currentSide === 'BUY') {
    if (payBalanceEl) payBalanceEl.textContent = `${fmt(afnBal)} AFN`;
  } else {
    if (payBalanceEl) payBalanceEl.textContent = `${fmt(usdtBal)} USDT`;
  }

  if (payBalanceWrap) payBalanceWrap.style.display = 'inline-flex';
}

/* ═══════════════════════════════════════
   🎚️ TABS
   ═══════════════════════════════════════ */

function setupTabs() {
  document.querySelectorAll('.trade-tab').forEach((tab) => {
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

  document.querySelectorAll('.trade-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.side === currentSide);
  });

  setText('formTitle', isBuy ? 'Buy USDT' : 'Sell USDT');
  setText('stepsTitle', isBuy ? 'How to Buy' : 'How to Sell');

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.dataset.side = currentSide;
    const span = submitBtn.querySelector('span');
    if (span) {
      span.textContent = isBuy ? 'Continue Buy' : 'Continue Sell';
    }
  }

  if (isBuy) {
    setText('payLabel', 'You Pay');
    setText('receiveLabel', 'You Receive');
    setText('payCurrency', 'AFN');
    setText('receiveCurrency', 'USDT');
    setIcon('payCurrencyIcon', 'afn', '؋');
    setIcon('receiveCurrencyIcon', 'usdt', '₮');

    setText('step1Text', 'Enter the amount of AFN you want to pay.');
    setText('step2Text', 'Review the rate and how much USDT you get.');
    setText('step3Text', 'Continue to see payment instructions.');
    setText('step4Text', 'Our team verifies and sends USDT to your wallet.');

    const rate = currentRate ? Number(currentRate.sell_price_afn) : 0;
    const badge = document.getElementById('rateBadge');
    if (badge && rate) badge.textContent = `${fmtNum(rate)} AFN`;

  } else {
    setText('payLabel', 'You Pay');
    setText('receiveLabel', 'You Receive');
    setText('payCurrency', 'USDT');
    setText('receiveCurrency', 'AFN');
    setIcon('payCurrencyIcon', 'usdt', '₮');
    setIcon('receiveCurrencyIcon', 'afn', '؋');

    setText('step1Text', 'Enter the amount of USDT you want to sell.');
    setText('step2Text', 'Review the rate and how much AFN you get.');
    setText('step3Text', 'Continue to see wallet address for payment.');
    setText('step4Text', 'Our team verifies and sends AFN to your Hesab Pay.');

    const rate = currentRate ? Number(currentRate.buy_price_afn) : 0;
    const badge = document.getElementById('rateBadge');
    if (badge && rate) badge.textContent = `${fmtNum(rate)} AFN`;
  }

  const input = document.getElementById('amountUsdt');
  if (input) {
    input.value = '';
    input.placeholder = '0';
  }

  document.querySelectorAll('.quick-amount').forEach((btn) => {
    btn.classList.remove('active');
  });

  updateBalanceDisplay();
}

function setIcon(id, variant, symbol) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `currency-icon ${variant}`;
  el.textContent = symbol;
}

/* ═══════════════════════════════════════
   ✏️ INPUTS
   ═══════════════════════════════════════ */

function setupInputs() {
  const input = document.getElementById('amountUsdt');
  if (!input) return;

  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d.]/g, '');

    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    e.target.value = value;
    calculate();

    document.querySelectorAll('.quick-amount').forEach((btn) => {
      if (parseFloat(btn.dataset.amount) !== parseFloat(value)) {
        btn.classList.remove('active');
      } else {
        btn.classList.add('active');
      }
    });
  });
}

function setupQuickAmounts() {
  document.querySelectorAll('.quick-amount').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('amountUsdt');
      if (!input) return;

      input.value = btn.dataset.amount;

      document.querySelectorAll('.quick-amount').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

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
   🧮 CALCULATE
   ═══════════════════════════════════════ */

function calculate() {
  const input = document.getElementById('amountUsdt');
  const output = document.getElementById('amountAfn');
  const sumRate = document.getElementById('sumRate');
  const sumFee = document.getElementById('sumFee');
  const sumTotal = document.getElementById('sumTotal');
  const sumTotalLabel = document.getElementById('sumTotalLabel');

  if (!input || !currentRate) return;

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
    if (output) output.value = '0';
    if (sumRate) sumRate.textContent = `${fmt(rate)} AFN`;
    if (sumFee) sumFee.textContent = '0.00 AFN';
    if (sumTotal) sumTotal.textContent = '0.00 AFN';
    if (sumTotalLabel) sumTotalLabel.textContent = 'Total';
    return;
  }

  if (isBuy) {
    const totalAfn = amount;
    const grossUsdt = totalAfn / rate;
    const feeAfn = totalAfn * 0.015;
    const netUsdt = (totalAfn - feeAfn) / rate;

    if (output) output.value = fmt(netUsdt);
    if (sumRate) sumRate.textContent = `${fmt(rate)} AFN`;
    if (sumFee) sumFee.textContent = `${fmt(feeAfn)} AFN`;
    if (sumTotalLabel) sumTotalLabel.textContent = 'Total to Pay';
    if (sumTotal) sumTotal.textContent = `${fmt(totalAfn)} AFN`;

  } else {
    const totalUsdt = amount;
    const grossAfn = totalUsdt * rate;
    const feeAfn = grossAfn * 0.015;
    const netAfn = grossAfn - feeAfn;

    if (output) output.value = fmt(netAfn);
    if (sumRate) sumRate.textContent = `${fmt(rate)} AFN`;
    if (sumFee) sumFee.textContent = `${fmt(feeAfn)} AFN`;
    if (sumTotalLabel) sumTotalLabel.textContent = 'Total to Receive';
    if (sumTotal) sumTotal.textContent = `${fmt(netAfn)} AFN`;
  }
}

/* ═══════════════════════════════════════
   📤 SUBMIT
   ═══════════════════════════════════════ */

function setupForm() {
  const form = document.getElementById('tradeForm');
  const btn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    // ─── 🔒 KYC GATE ───
    const isVerified = await Auth.checkKycVerified();
    if (!isVerified) {
      showKycModal();
      return;
    }
    // ───────────────────

    const input = document.getElementById('amountUsdt');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
      Notify.warning('Please enter a valid amount.');
      return;
    }

    const isBuy = currentSide === 'BUY';

    if (isBuy) {
      const rate = Number(currentRate.sell_price_afn);
      const minAfn = 10 * rate;
      if (amount < minAfn) {
        Notify.warning(`Minimum order is 10 USDT (≈ ${minAfn.toFixed(2)} AFN).`);
        return;
      }
    } else {
      if (amount < 10) {
        Notify.warning('Minimum order is 10 USDT.');
        return;
      }

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
      let amountUsdt;
      if (isBuy) {
        const rate = Number(currentRate.sell_price_afn);
        amountUsdt = amount / rate;
      } else {
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

      if (msg.includes('حداقل')) msg = 'Minimum order is 10 USDT.';
      else if (msg.includes('موجودی')) msg = 'Insufficient balance.';

      Notify.error(msg);
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
   🛡️ KYC MODAL
   ═══════════════════════════════════════ */

function showKycModal() {
  const modalHtml = `
    <div id="kycModal" style="position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.3s ease;">
      <div class="kyc-modal" style="background:#FFFFFF;border-radius:24px;padding:32px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.1);transform:translateY(20px);transition:transform 0.3s ease;">
        <div style="width:64px;height:64px;background:#FEF2F2;color:#EF4444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:12px;">Identity Verification Required</h2>
        <p style="font-size:14px;color:#64748B;line-height:1.6;margin-bottom:24px;">
          To protect your account and comply with regulations, you must complete KYC verification before making deposits or trades.
        </p>
        <a href="profile.html" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;background:linear-gradient(135deg,#1E40AF,#7C3AED);color:white;font-size:15px;font-weight:700;border-radius:12px;text-decoration:none;transition:transform 0.2s;border:none;cursor:pointer;margin-bottom:12px;">
          Verify Identity Now
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
        <button type="button" id="closeKycModalBtn" style="display:inline-flex;align-items:center;justify-content:center;width:100%;padding:14px;background:transparent;color:#64748B;font-size:15px;font-weight:700;border-radius:12px;border:none;cursor:pointer;transition:background 0.2s;">
          Maybe Later
        </button>
      </div>
    </div>
  `;

  if (!document.getElementById('kycModal')) {
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    setTimeout(() => {
      const overlay = document.getElementById('kycModal');
      if (overlay) {
        overlay.style.opacity = '1';
        overlay.querySelector('.kyc-modal').style.transform = 'translateY(0)';
      }
    }, 10);

    document.getElementById('closeKycModalBtn').addEventListener('click', () => {
      closeKycModal();
    });

    document.getElementById('kycModal').addEventListener('click', (e) => {
      if (e.target.id === 'kycModal') {
        closeKycModal();
      }
    });
  }
}

function closeKycModal() {
  const overlay = document.getElementById('kycModal');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.querySelector('.kyc-modal').style.transform = 'translateY(20px)';
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
}

/* ═══════════════════════════════════════
   🛠️ HELPERS
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function fmtNum(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ═══════════════════════════════════════
   🧹 CLEANUP
   ═══════════════════════════════════════ */

window.addEventListener('beforeunload', () => {
  if (pollingInterval) clearInterval(pollingInterval);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadRate();
    loadWallets();
  }
});

/* ═══════════════════════════════════════
   🌍 EXPOSE
   ═══════════════════════════════════════ */

window.Exchange = {
  reload: () => {
    loadRate();
    loadWallets();
  },
};