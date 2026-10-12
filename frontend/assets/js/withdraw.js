/* ═══════════════════════════════════════
   ARYANA CURRENCY — Withdraw v2 Logic
   ═══════════════════════════════════════ */

let currentCurrency = 'USDT';
let currentWallets = null;
let myWithdrawals = [];

/* ═══════════════════════════════════════
              Init
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

  showAdminButton();
  renderUserInfo();

  // Currency tabs
  document.querySelectorAll('.currency-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const cur = tab.dataset.currency;
      if (cur === currentCurrency) return;
      currentCurrency = cur;
      applyCurrency();
    });
  });

  // Max button
  const maxBtn = document.getElementById('maxBtn');
  if (maxBtn) maxBtn.addEventListener('click', useMaxBalance);

  // Input validation
  const amountInput = document.getElementById('amount');
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^\d.]/g, '');
      const parts = value.split('.');
      if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
      e.target.value = value;
    });
  }

  // Form
  const form = document.getElementById('withdrawForm');
  if (form) form.addEventListener('submit', handleSubmit);

  // Modal
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
  if (cancelConfirmBtn) cancelConfirmBtn.addEventListener('click', closeConfirmModal);

  const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');
  if (confirmWithdrawBtn) confirmWithdrawBtn.addEventListener('click', confirmWithdrawal);

  // Load data
  await Promise.all([
    loadProfile(),
    loadWallets(),
    loadMyWithdrawals(),
  ]);

  applyCurrency();
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

async function loadWallets() {
  try {
    currentWallets = await API.getWallets();
    updateBalanceDisplay();
  } catch (err) {
    console.error('Wallets load failed:', err);
  }
}

async function loadMyWithdrawals() {
  try {
    myWithdrawals = await API.request('/withdrawals/my') || [];
    renderRecentWithdrawals();
  } catch (err) {
    console.error('Withdrawals load failed:', err);
    myWithdrawals = [];
    renderRecentWithdrawals();
  }
}

/* ═══════════════════════════════════════
              Apply Currency
   ═══════════════════════════════════════ */

function applyCurrency() {
  // Tabs
  document.querySelectorAll('.currency-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.currency === currentCurrency);
  });

  const isUsdt = currentCurrency === 'USDT';

  // Card header
  setText('cardTitle', isUsdt ? 'Withdraw USDT' : 'Withdraw AFN');
  setText('cardSubtitle', isUsdt
    ? 'Request a withdrawal to your TRC20 wallet.'
    : 'Request a withdrawal to your Hesab Pay account.'
  );

  // Form labels
  setText('amountCurrency', currentCurrency);
  setText('minHint', isUsdt ? 'Minimum: 10 USDT' : 'Minimum: 500 AFN');
  setText('destinationLabel', isUsdt ? 'USDT Wallet Address (TRC20)' : 'Hesab Pay Number');
  setText('destinationHint', isUsdt
    ? 'Paste your TRC20 (Tron) wallet address.'
    : 'Enter your Hesab Pay number.'
  );

  // Placeholder
  const destInput = document.getElementById('destination');
  if (destInput) {
    destInput.placeholder = isUsdt ? 'T...' : '07XX XXX XXX';
    destInput.value = '';
  }

  const amountInput = document.getElementById('amount');
  if (amountInput) amountInput.value = '';

  // Holder field (فقط AFN)
  const holderField = document.getElementById('holderField');
  if (holderField) {
    holderField.style.display = isUsdt ? 'none' : 'block';
    if (isUsdt) {
      const holderInput = document.getElementById('destinationHolder');
      if (holderInput) holderInput.value = '';
    }
  }

  // Balance display
  updateBalanceDisplay();
}

function updateBalanceDisplay() {
  if (!currentWallets) return;

  const isUsdt = currentCurrency === 'USDT';
  const wallet = isUsdt ? currentWallets.usdt : currentWallets.afn;

  if (!wallet) return;

  const balance = Number(wallet.balance || 0);
  const locked = Number(wallet.locked_balance || 0);
  const available = balance - locked;

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  setText('balanceValue', fmt(available));
  setText('balanceCurrency', currentCurrency);

  const lockedInfo = document.getElementById('lockedInfo');
  const lockedValue = document.getElementById('lockedValue');

  if (lockedInfo && lockedValue) {
    if (locked > 0) {
      lockedInfo.style.display = 'block';
      lockedValue.textContent = `${fmt(locked)} ${currentCurrency}`;
    } else {
      lockedInfo.style.display = 'none';
    }
  }
}

/* ═══════════════════════════════════════
              Max Balance
   ═══════════════════════════════════════ */

function useMaxBalance() {
  if (!currentWallets) return;

  const isUsdt = currentCurrency === 'USDT';
  const wallet = isUsdt ? currentWallets.usdt : currentWallets.afn;

  if (!wallet) return;

  const balance = Number(wallet.balance || 0);
  const locked = Number(wallet.locked_balance || 0);
  const available = balance - locked;

  if (available <= 0) {
    Notify.warning('No available balance.');
    return;
  }

  // کم کردن ۰.۰۱ برای جلوگیری از گرد کردن
  const maxValue = Math.max(0, available - 0.01);

  const amountInput = document.getElementById('amount');
  if (amountInput) {
    amountInput.value = maxValue.toFixed(2);
  }
}

/* ═══════════════════════════════════════
              Submit
   ═══════════════════════════════════════ */

let pendingWithdrawal = null;

function handleSubmit(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value);
  const destination = document.getElementById('destination').value.trim();
  const destinationHolder = document.getElementById('destinationHolder')?.value.trim() || null;

  const isUsdt = currentCurrency === 'USDT';

  // Validation
  if (!amount || amount <= 0) {
    Notify.warning('Please enter a valid amount.');
    return;
  }

  // Min
  if (isUsdt && amount < 10) {
    Notify.warning('Minimum withdrawal is 10 USDT.');
    return;
  }
  if (!isUsdt && amount < 500) {
    Notify.warning('Minimum withdrawal is 500 AFN.');
    return;
  }

  // Destination
  if (!destination) {
    Notify.warning(isUsdt ? 'Please enter your wallet address.' : 'Please enter your Hesab Pay number.');
    return;
  }

  if (isUsdt && !destination.startsWith('T')) {
    Notify.warning('TRC20 wallet address must start with T.');
    return;
  }

  if (!isUsdt && !destinationHolder) {
    Notify.warning('Please enter the account holder name.');
    return;
  }

  // Check balance
  if (currentWallets) {
    const wallet = isUsdt ? currentWallets.usdt : currentWallets.afn;
    if (wallet) {
      const balance = Number(wallet.balance || 0);
      const locked = Number(wallet.locked_balance || 0);
      const available = balance - locked;

      if (amount > available) {
        Notify.error(`Insufficient balance. Available: ${available.toFixed(2)} ${currentCurrency}`);
        return;
      }
    }
  }

  // Save pending
  pendingWithdrawal = {
    currency: currentCurrency,
    amount,
    destination,
    destinationHolder,
  };

  // Show confirm modal
  openConfirmModal(pendingWithdrawal);
}

/* ═══════════════════════════════════════
              Confirm Modal
   ═══════════════════════════════════════ */

function openConfirmModal(data) {
  const modal = document.getElementById('confirmModal');
  if (!modal) return;

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  setText('confirmAmount', `${fmt(data.amount)} ${data.currency}`);
  setText('confirmDestination', data.destination);

  const holderRow = document.getElementById('confirmHolderRow');
  if (holderRow) {
    if (data.destinationHolder) {
      holderRow.style.display = 'flex';
      setText('confirmHolder', data.destinationHolder);
    } else {
      holderRow.style.display = 'none';
    }
  }

  modal.classList.add('show');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('show');
  pendingWithdrawal = null;
}

async function confirmWithdrawal() {
  if (!pendingWithdrawal) return;

  const btn = document.getElementById('confirmWithdrawBtn');
  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await API.request('/withdrawals/', {
      method: 'POST',
      body: JSON.stringify({
        currency: pendingWithdrawal.currency,
        amount: String(pendingWithdrawal.amount),
        destination: pendingWithdrawal.destination,
        destination_holder: pendingWithdrawal.destinationHolder,
      }),
    });

    closeConfirmModal();
    Notify.success('Withdrawal request submitted! Awaiting review.');

    // Reset form
    document.getElementById('withdrawForm').reset();

    // Reload
    setTimeout(async () => {
      await loadWallets();
      await loadMyWithdrawals();
      applyCurrency();
    }, 800);

  } catch (err) {
    console.error('Withdrawal failed:', err);
    let msg = err.detail || 'Failed to submit withdrawal.';

    if (msg.includes('موجودی')) {
      msg = 'Insufficient balance.';
    } else if (msg.includes('حداقل')) {
      msg = msg.replace('حداقل برداشت تتر', 'Minimum withdrawal is').replace('است', 'USDT.').replace('حداقل برداشت افغانی', 'Minimum withdrawal is');
    }

    Notify.error(msg);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ═══════════════════════════════════════
              Recent Withdrawals
   ═══════════════════════════════════════ */

function renderRecentWithdrawals() {
  const container = document.getElementById('recentList');
  if (!container) return;

  const recent = (myWithdrawals || []).slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `
      <div class="withdrawals-empty">
        No withdrawal requests yet.
      </div>
    `;
    return;
  }

  const statusMap = {
    'PENDING': { cls: 'pending', text: 'Pending' },
    'PROCESSING': { cls: 'processing', text: 'Processing' },
    'COMPLETED': { cls: 'completed', text: 'Completed' },
    'REJECTED': { cls: 'rejected', text: 'Rejected' },
    'CANCELLED': { cls: 'cancelled', text: 'Cancelled' },
  };

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  container.innerHTML = '';

  recent.forEach(w => {
    const s = statusMap[w.status] || { cls: '', text: w.status };
    const date = new Date(w.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const div = document.createElement('div');
    div.className = 'withdrawal-item';
    div.innerHTML = `
      <div class="withdrawal-item-left">
        <div class="withdrawal-item-ref">${w.reference}</div>
        <div class="withdrawal-item-amount">
          ${fmt(w.amount)}<small>${w.currency}</small>
        </div>
      </div>
      <div class="withdrawal-item-right">
        <div class="withdrawal-status ${s.cls}">${s.text}</div>
        <div class="withdrawal-item-date">${date}</div>
      </div>
    `;

    container.appendChild(div);
  });
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}