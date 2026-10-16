/* ═══════════════════════════════════════
   ARYANA CURRENCY — Deposit Confirm Form
   I've Paid · Create order + submit reference
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  let currentCurrency = 'USDT';
  let currentNetwork = 'TRC20';
  let currentRate = null;
  let submitting = false;

  /* ═══════════════════════════════════════
     🚀 INIT
     ═══════════════════════════════════════ */

  function init() {
    setupForm();
    setupAmountInput();
    loadRate();
    watchCurrencyChanges();
    watchNetworkChanges();
  }

  /* ═══════════════════════════════════════
     💱 RATE
     ═══════════════════════════════════════ */

  async function loadRate() {
    try {
      currentRate = await API.getCurrentRate();
    } catch (err) {
      console.error('Rate load failed:', err);
    }
  }

  /* ═══════════════════════════════════════
     👀 WATCH: Currency Change (USDT/AFN)
     ═══════════════════════════════════════ */

  function watchCurrencyChanges() {
    document.querySelectorAll('.currency-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const cur = tab.dataset.currency;
        if (cur === currentCurrency) return;

        currentCurrency = cur;
        applyCurrencyUI();
      });
    });

    // اولیه
    applyCurrencyUI();
  }

  function applyCurrencyUI() {
    const isUsdt = currentCurrency === 'USDT';

    // ─── Labels ───
    setText(
      'confirmAmountLabel',
      isUsdt ? 'Amount you sent (USDT)' : 'Amount you sent (AFN)'
    );

    setText('confirmAmountTag', isUsdt ? 'USDT' : 'AFN');

    setText(
      'confirmAmountHint',
      isUsdt
        ? 'Enter the exact amount of USDT you transferred.'
        : 'Enter the exact amount of AFN you sent via Hesab Pay.'
    );

    setText(
      'confirmRefLabel',
      isUsdt ? 'Transaction ID (TXID)' : 'Hesab Pay Reference Number'
    );

    setText(
      'confirmRefHint',
      isUsdt
        ? 'Copy the transaction hash from your wallet app.'
        : 'Copy the reference number from your Hesab Pay receipt.'
    );

    // ─── Placeholder ───
    const refInput = document.getElementById('confirmRef');
    if (refInput) {
      refInput.placeholder = isUsdt
        ? 'a1b2c3d4e5f6...'
        : 'HP-12345678';
    }

    const amtInput = document.getElementById('confirmAmount');
    if (amtInput) {
      amtInput.placeholder = isUsdt ? '100.00' : '7000.00';
    }

    // ─── Total Info ───
    updateTotalInfo();
  }

  /* ═══════════════════════════════════════
     👀 WATCH: Network Change
     ═══════════════════════════════════════ */

  function watchNetworkChanges() {
    // networks.js خودش تابع renderNetworkTabs رو داره
    // ما از MutationObserver استفاده می‌کنیم که تغییرات رو ببینیم

    const observer = new MutationObserver(() => {
      const activeTab = document.querySelector('.network-tab.active');
      if (activeTab) {
        const newNet = activeTab.dataset.network;
        if (newNet && newNet !== currentNetwork) {
          currentNetwork = newNet;
          updateTotalInfo();
        }
      }
    });

    const container = document.getElementById('networkTabs');
    if (container) {
      observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    // اولیه
    const activeTab = document.querySelector('.network-tab.active');
    if (activeTab) {
      currentNetwork = activeTab.dataset.network;
    }
  }

  /* ═══════════════════════════════════════
     📊 TOTAL INFO (برای USDT)
     ═══════════════════════════════════════ */

  function updateTotalInfo() {
    const info = document.getElementById('confirmTotalInfo');
    const value = document.getElementById('confirmTotalValue');
    const amtInput = document.getElementById('confirmAmount');

    if (!info || !value || !amtInput) return;

    const amount = parseFloat(amtInput.value) || 0;

    if (currentCurrency === 'USDT' && amount > 0 && currentRate) {
      // ─── کاربر USDT داده، معادل AFN رو نشون بده ───
      const rate = Number(currentRate.sell_price_afn) || 0;
      const afnEquiv = amount * rate;

      info.style.display = 'flex';
      value.textContent = `≈ ${formatNumber(afnEquiv)} AFN`;

    } else if (currentCurrency === 'AFN' && amount > 0 && currentRate) {
      // ─── کاربر AFN داده، معادل USDT رو نشون بده ───
      const rate = Number(currentRate.buy_price_afn) || 0;
      const usdtEquiv = rate > 0 ? amount / rate : 0;

      info.style.display = 'flex';
      value.textContent = `≈ ${formatNumber(usdtEquiv)} USDT`;

    } else {
      info.style.display = 'none';
    }
  }

  /* ═══════════════════════════════════════
     ✏️ AMOUNT INPUT
     ═══════════════════════════════════════ */

  function setupAmountInput() {
    const input = document.getElementById('confirmAmount');
    if (!input) return;

    input.addEventListener('input', (e) => {
      // فقط اعداد و نقطه
      let value = e.target.value.replace(/[^\d.]/g, '');

      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }

      e.target.value = value;
      updateTotalInfo();
    });
  }

  /* ═══════════════════════════════════════
     📤 SUBMIT
     ═══════════════════════════════════════ */

  function setupForm() {
    const form = document.getElementById('confirmDepositForm');
    const btn = document.getElementById('confirmSubmitBtn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (submitting) return;

      // ─── Values ───
      const amount = parseFloat(document.getElementById('confirmAmount').value) || 0;
      const ref = document.getElementById('confirmRef').value.trim();
      const note = document.getElementById('confirmNote').value.trim() || null;

      // ─── Validation ───
      if (amount <= 0) {
        Notify.warning('Please enter the amount you sent.');
        return;
      }

      if (!ref || ref.length < 4) {
        Notify.warning('Please enter a valid transaction reference.');
        return;
      }

      // ─── Minimum check ───
      const minAmount = currentCurrency === 'USDT' ? 10 : 500;
      if (amount < minAmount) {
        Notify.warning(
          `Minimum deposit is ${minAmount} ${currentCurrency}.`
        );
        return;
      }

      // ─── Confirm ───
      const ok = await Notify.confirm({
        title: 'Submit this deposit?',
        message: `We will create a BUY order for ${formatNumber(amount)} ${currentCurrency} and submit your reference for review.`,
        type: 'warning',
      });

      if (!ok) return;

      // ─── Submit ───
      submitting = true;
      btn.disabled = true;
      const orig = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span>';

      try {
        // ─── 1. Create order (BUY) ───
        let amountUsdt;

        if (currentCurrency === 'USDT') {
          amountUsdt = amount;
        } else {
          // AFN → USDT
          const rate = currentRate
            ? Number(currentRate.buy_price_afn)
            : 66.80;
          amountUsdt = rate > 0 ? amount / rate : amount / 66.80;
        }

        const order = await API.createOrder('BUY', amountUsdt.toFixed(2));

        // ─── 2. Submit payment reference ───
        await API.submitPayment(order.id, ref, note);

        // ─── 3. Success ───
        Notify.success('Deposit submitted! Awaiting verification.');

        // ─── Reset form ───
        form.reset();
        updateTotalInfo();

        // ─── Redirect به order detail ───        setTimeout(() => {
          window.location.href = `order.html?id=${order.id}`;
        }, 1200);

      } catch (err) {
        console.error('Deposit submit failed:', err);
        let msg = err.detail || 'Failed to submit deposit. Please try again.';

        if (msg.includes('موجودی')) msg = 'Insufficient balance.';
        else if (msg.includes('حداقل')) msg = 'Amount below minimum.';

        Notify.error(msg);
        btn.disabled = false;
        btn.innerHTML = orig;
        submitting = false;
      }
    });
  }

  /* ═══════════════════════════════════════
     🛠️ HELPERS
     ═══════════════════════════════════════ */

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatNumber(n, d = 2) {
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }

  /* ═══════════════════════════════════════
     🚀 START
     ═══════════════════════════════════════ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();