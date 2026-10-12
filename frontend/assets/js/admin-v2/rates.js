/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Rates v2
   Rate management
   ═══════════════════════════════════════ */

let currentRate = null;

/* ═══════════════════════════════════════
              Init
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // صبر کن common.js init بشه
  await new Promise(resolve => setTimeout(resolve, 100));

  // Setup form
  const form = document.getElementById('rateForm');
  if (form) form.addEventListener('submit', handleSubmit);

  // Watch inputs for spread check
  ['buyPrice', 'sellPrice'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', checkSpread);
  });

  // Load
  await Promise.all([
    loadCurrentRate(),
    loadHistory(),
  ]);
});

/* ═══════════════════════════════════════
              Load Current Rate
   ═══════════════════════════════════════ */

async function loadCurrentRate() {
  try {
    const rate = await API.getCurrentRate();
    currentRate = rate;

    const fmt = (n) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

    setText('currentBuy', `${fmt(rate.buy_price_afn)} AFN`);
    setText('currentSell', `${fmt(rate.sell_price_afn)} AFN`);
    setText('currentUpdated', AdminCommon.formatDateTime(rate.created_at));

    // Spread
    const spread = Number(rate.sell_price_afn) - Number(rate.buy_price_afn);
    const spreadPercent = (spread / Number(rate.buy_price_afn)) * 100;
    setText('spreadBadge', `Spread: ${fmt(spread)} AFN (${spreadPercent.toFixed(2)}%)`);

    // Prefill form
    const buyInput = document.getElementById('buyPrice');
    const sellInput = document.getElementById('sellPrice');
    if (buyInput) buyInput.value = rate.buy_price_afn;
    if (sellInput) sellInput.value = rate.sell_price_afn;

    checkSpread();

  } catch (err) {
    console.error('Load current rate failed:', err);
    setText('currentBuy', '—');
    setText('currentSell', '—');
    setText('currentUpdated', 'No active rate');
    setText('spreadBadge', '—');
  }
}

/* ═══════════════════════════════════════
              Load History
   ═══════════════════════════════════════ */

async function loadHistory() {
  try {
    const history = await API.getRateHistory(20);

    const loading = document.getElementById('loadingHistory');
    const wrap = document.getElementById('historyWrap');
    const body = document.getElementById('historyBody');

    if (loading) loading.style.display = 'none';

    if (!history.length) {
      if (loading) {
        loading.innerHTML = `
          <div class="admin-empty-icon">◇</div>
          <h3>No rate history</h3>
          <p>Set your first rate above.</p>
        `;
        loading.style.display = 'block';
      }
      return;
    }

    if (wrap) wrap.style.display = 'block';
    body.innerHTML = '';

    const fmt = (n) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    history.forEach(rate => {
      const tr = document.createElement('tr');

      const spread = Number(rate.sell_price_afn) - Number(rate.buy_price_afn);

      tr.innerHTML = `
        <td>
          <span class="cell-mono" style="color: var(--green); font-weight: 700;">${fmt(rate.buy_price_afn)}</span>
        </td>
        <td>
          <span class="cell-mono" style="color: var(--gold); font-weight: 700;">${fmt(rate.sell_price_afn)}</span>
        </td>
        <td class="cell-muted">
          ${fmt(spread)} AFN
        </td>
        <td>
          ${rate.is_active
            ? '<span class="admin-badge green">Active</span>'
            : '<span class="admin-badge gray">Inactive</span>'}
        </td>
        <td class="cell-muted">${AdminCommon.formatDateTime(rate.created_at)}</td>
      `;

      body.appendChild(tr);
    });

  } catch (err) {
    console.error('Load history failed:', err);
  }
}

/* ═══════════════════════════════════════
              Check Spread
   ═══════════════════════════════════════ */

function checkSpread() {
  const buyInput = document.getElementById('buyPrice');
  const sellInput = document.getElementById('sellPrice');
  const warning = document.getElementById('spreadWarning');

  if (!buyInput || !sellInput || !warning) return;

  const buy = parseFloat(buyInput.value);
  const sell = parseFloat(sellInput.value);

  if (isNaN(buy) || isNaN(sell) || buy <= 0 || sell <= 0) {
    warning.style.display = 'none';
    return;
  }

  if (sell <= buy) {
    warning.style.display = 'flex';
  } else {
    warning.style.display = 'none';
  }
}

/* ═══════════════════════════════════════
              Submit
   ═══════════════════════════════════════ */

async function handleSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('saveRateBtn');
  const buyPrice = parseFloat(document.getElementById('buyPrice').value);
  const sellPrice = parseFloat(document.getElementById('sellPrice').value);

  // Validation
  if (isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0 || sellPrice <= 0) {
    Notify.warning('Please enter valid prices.');
    return;
  }

  if (sellPrice <= buyPrice) {
    Notify.error('Sell price must be higher than buy price.');
    return;
  }

  const ok = await Notify.confirm({
    title: 'Set new rate?',
    message: `Buy: ${buyPrice} AFN · Sell: ${sellPrice} AFN. The old rate will be deactivated.`,
    type: 'warning',
  });

  if (!ok) return;

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await API.setRate(buyPrice, sellPrice);

    Notify.success('Rate updated successfully!');

    setTimeout(async () => {
      await loadCurrentRate();
      await loadHistory();
    }, 800);

  } catch (err) {
    console.error('Save rate failed:', err);
    let msg = err.detail || 'Failed to save rate.';

    if (msg.includes('بزرگتر')) {
      msg = 'Sell price must be higher than buy price.';
    }

    Notify.error(msg);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}