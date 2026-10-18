/* ═══════════════════════════════════════
   ARYANA CURRENCY — Deposit v3 Logic
   Light · Navy-Purple · ARYANA OS
   ═══════════════════════════════════════ */

let paymentInfo = null;
let currentCurrency = 'USDT';
let currentNetwork = 'TRC20';

/* ═══════════════════════════════════════
   🛡️ KYC CHECK HELPER
   ═══════════════════════════════════════ */
function isKycVerified() {
  const user = Auth.getUser();
  if (!user) return false;
  const status = String(user.kyc_status || user.kycStatus || '').toLowerCase();
  return status === 'verified' || status === 'true' || user.is_kyc_verified === true;
}

/* ═══════════════════════════════════════
   🚀 INIT
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  
  // ─── 🔒 KYC GATE ───
  if (!isKycVerified()) {
    document.querySelector('.app-main').style.display = 'none';
    showKycModal();
    return;
  }
  // ───────────────────

  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => Theme.toggle());

  showAdminButton();
  renderUserInfo();

  document.querySelectorAll('.currency-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const cur = tab.dataset.currency;
      if (cur === currentCurrency) return;

      currentCurrency = cur;
      applyCurrency();
    });
  });

  const copyBtn = document.getElementById('copyAddressBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const addressEl = document.getElementById('addressValue');
      if (addressEl && addressEl.textContent !== '—') {
        copyText(addressEl.textContent, copyBtn);
      }
    });
  }

  await loadPaymentInfo();
  applyCurrency();
});

/* ═══════════════════════════════════════
   🛡️ KYC MODAL
   ═══════════════════════════════════════ */

function showKycModal() {
  const modalHtml = `
    <div class="kyc-modal-overlay" id="kycModal" style="position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.3s ease;">
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
        <button type="button" onclick="window.location.href='dashboard.html'" style="display:inline-flex;align-items:center;justify-content:center;width:100%;padding:14px;background:transparent;color:#64748B;font-size:15px;font-weight:700;border-radius:12px;border:none;cursor:pointer;transition:background 0.2s;">
          Back to Dashboard
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  setTimeout(() => {
    const overlay = document.getElementById('kycModal');
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.querySelector('.kyc-modal').style.transform = 'translateY(0)';
    }
  }, 10);
}

/* ═══════════════════════════════════════
   👤 HELPERS
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
   📥 LOAD PAYMENT INFO
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
   💱 APPLY CURRENCY
   ═══════════════════════════════════════ */

function applyCurrency() {
  document.querySelectorAll('.currency-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.currency === currentCurrency);
  });

  if (currentCurrency === 'USDT') {
    applyUsdt();
  } else {
    applyAfn();
  }
}

function applyUsdt() {
  setText('cardTitle', 'Deposit USDT');
  setText('cardSubtitle', 'Choose a network, then send USDT to the address below.');

  const icon = document.getElementById('cardIcon');
  if (icon) {
    icon.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    `;
  }

  const networkBlock = document.getElementById('networkBlock');
  if (networkBlock) networkBlock.style.display = 'block';

  if (typeof renderNetworkTabs === 'function') {
    renderNetworkTabs('networkTabs', (id) => {
      applyNetwork(id);
    }, currentNetwork);
  }

  applyNetwork(currentNetwork);

  const addressWrap = document.getElementById('addressValueWrap');
  if (addressWrap) addressWrap.classList.remove('hesab');

  setText('visualLabel', 'Use Copy Button');
  setText('visualText', 'Tap the copy button to copy the address, then paste it in your wallet app.');

  const infoText = document.getElementById('warningInfoText');
  if (infoText) {
    infoText.textContent = 'Deposits are processed within 30 minutes. After sending, place a SELL order on the Trade page.';
  }
}

function applyNetwork(networkId) {
  currentNetwork = networkId;

  if (typeof getNetwork !== 'function') {
    console.warn('networks.js not loaded — using fallback');
    return;
  }

  const net = getNetwork(networkId);
  if (!net) return;

  setText('networkValue', net.fullName);
  setText('minValue', net.minDeposit);
  setText('addressLabel', `USDT Wallet Address (${net.label})`);

  const walletAddress =
    paymentInfo?.[net.walletField] ||
    paymentInfo?.usdt_wallet ||
    paymentInfo?.wallet_address ||
    '—';

  setText('addressValue', walletAddress);

  const dangerText = document.getElementById('warningDangerText');
  if (dangerText) {
    dangerText.innerHTML = `<strong>Important:</strong> ${net.warning}`;
  }

  const dangerCur = document.getElementById('dangerCurrency');
  if (dangerCur) {
    dangerCur.textContent = `USDT (${net.label})`;
  }
}

function applyAfn() {
  setText('cardTitle', 'Deposit AFN');
  setText('cardSubtitle', 'Send Afghan Afghani via Hesab Pay to the number below.');

  const icon = document.getElementById('cardIcon');
  if (icon) {
    icon.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    `;
  }

  const networkBlock = document.getElementById('networkBlock');
  if (networkBlock) networkBlock.style.display = 'none';

  setText('addressLabel', 'Hesab Pay Number');

  const addressWrap = document.getElementById('addressValueWrap');
  if (addressWrap) addressWrap.classList.add('hesab');

  setText('addressValue', paymentInfo?.hesab_pay || '—');

  setText('visualLabel', 'Use Copy Button');
  setText('visualText', 'Tap the copy button to copy the number, then paste it in your Hesab Pay app.');

  const dangerText = document.getElementById('warningDangerText');
  if (dangerText) {
    const holder = paymentInfo?.hesab_pay_holder || 'ARYANA CURRENCY';
    dangerText.innerHTML = `<strong>Important:</strong> Send only <span>AFN via Hesab Pay</span> to this number. Confirm the account holder name is <strong>${holder}</strong> before sending.`;
  }

  const infoText = document.getElementById('warningInfoText');
  if (infoText) {
    infoText.textContent = 'Deposits are processed within 30 minutes. After sending, place a BUY order on the Trade page.';
  }
}

/* ═══════════════════════════════════════
   📋 COPY
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
   🛠️ HELPERS
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}