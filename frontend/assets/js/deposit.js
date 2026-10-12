/* ═══════════════════════════════════════
   ARYANA CURRENCY — Deposit v2 Logic
   ═══════════════════════════════════════ */

let paymentInfo = null;
let currentCurrency = 'USDT';
let currentNetwork = 'TRC20';

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

  // Copy button
  const copyBtn = document.getElementById('copyAddressBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const addressEl = document.getElementById('addressValue');
      if (addressEl && addressEl.textContent !== '—') {
        copyText(addressEl.textContent, copyBtn);
      }
    });
  }

  // Load payment info
  await loadPaymentInfo();

  // Apply default currency
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
              Load Payment Info
   ═══════════════════════════════════════ */

async function loadPaymentInfo() {
  try {
    paymentInfo = await API.getPaymentInfo();
  } catch (err) {
    console.error('Load payment info failed:', err);
    Notify.error('Could not load deposit info. Please refresh.');
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

  if (currentCurrency === 'USDT') {
    applyUsdt();
  } else {
    applyAfn();
  }
}

function applyUsdt() {
  // Card header
  setText('cardTitle', 'Deposit USDT');
  setText('cardSubtitle', 'Choose a network, then send USDT to the address below.');

  // Icon
  const icon = document.getElementById('cardIcon');
  if (icon) {
    icon.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    `;
  }

  // Network block رو نشون بده
  const networkBlock = document.getElementById('networkBlock');
  if (networkBlock) networkBlock.style.display = 'block';

  // Network tabs رو رندر کن
  renderNetworkTabs('networkTabs', (id) => {
    applyNetwork(id);
  }, currentNetwork);

  // شبکه فعلی رو اعمال کن
  applyNetwork(currentNetwork);

  // Address wrap
  const addressWrap = document.getElementById('addressValueWrap');
  if (addressWrap) addressWrap.classList.remove('hesab');

  // Visual block
  setText('visualLabel', 'Use Copy Button');
  setText('visualText', 'Tap the copy button to copy the address, then paste it in your wallet app.');
}

function applyNetwork(networkId) {
  currentNetwork = networkId;
  const net = getNetwork(networkId);

  // Info list
  setText('networkValue', net.fullName);
  setText('minValue', net.minDeposit);

  // Address label
  setText('addressLabel', `USDT Wallet Address (${net.label})`);

  // Wallet address from API
  const walletAddress = paymentInfo?.[net.walletField]
    || paymentInfo?.usdt_wallet
    || '—';
  setText('addressValue', walletAddress);

  // Danger warning
  const dangerText = document.getElementById('warningDangerText');
  if (dangerText) {
    dangerText.innerHTML = `<strong>Important:</strong> ${net.warning}`;
  }

  // Info warning
  const infoText = document.getElementById('warningInfoText');
  if (infoText) {
    infoText.textContent = 'Deposits are processed within 30 minutes. After sending, place a SELL order on the Trade page.';
  }
}

function applyAfn() {
  // Card header
  setText('cardTitle', 'Deposit AFN');
  setText('cardSubtitle', 'Send Afghan Afghani via Hesab Pay to the number below.');

  // Icon
  const icon = document.getElementById('cardIcon');
  if (icon) {
    icon.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    `;
  }

  // Network block مخفی
  const networkBlock = document.getElementById('networkBlock');
  if (networkBlock) networkBlock.style.display = 'none';

  // Address
  setText('addressLabel', 'Hesab Pay Number');

  const addressWrap = document.getElementById('addressValueWrap');
  if (addressWrap) addressWrap.classList.add('hesab');

  setText('addressValue', paymentInfo?.hesab_pay || '—');

  // Visual block
  setText('visualLabel', 'Use Copy Button');
  setText('visualText', 'Tap the copy button to copy the number, then paste it in your Hesab Pay app.');

  // Warnings
  const dangerText = document.getElementById('warningDangerText');
  if (dangerText) {
    dangerText.innerHTML = `<strong>Important:</strong> Send only <span>AFN via Hesab Pay</span> to this number. Confirm the account holder name is <strong>${paymentInfo?.hesab_pay_holder || 'ARYANA CURRENCY'}</strong> before sending.`;
  }

  const infoText = document.getElementById('warningInfoText');
  if (infoText) {
    infoText.textContent = 'Deposits are processed within 30 minutes. After sending, place a BUY order on the Trade page.';
  }
}

/* ═══════════════════════════════════════
              Copy
   ═══════════════════════════════════════ */

function copyText(text, btnEl) {
  if (!text || text === '—') {
    Notify.warning('Nothing to copy.');
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopied(btnEl);
    }).catch(() => {
      fallbackCopy(text, btnEl);
    });
  } else {
    fallbackCopy(text, btnEl);
  }
}

function fallbackCopy(text, btnEl) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showCopied(btnEl);
  } catch (err) {
    Notify.error('Could not copy.');
  }
  document.body.removeChild(textarea);
}

function showCopied(btnEl) {
  if (!btnEl) {
    Notify.success('Copied to clipboard!');
    return;
  }

  const origHtml = btnEl.innerHTML;
  btnEl.classList.add('copied');
  btnEl.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>Copied</span>
  `;

  Notify.success('Address copied!');

  setTimeout(() => {
    btnEl.classList.remove('copied');
    btnEl.innerHTML = origHtml;
  }, 1500);
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}