/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Settings
   ═══════════════════════════════════════ */

let currentSettings = null;

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

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // Refresh
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadSettings();
      Notify.info('Refreshed');
    });
  }

  // Tabs
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.tab === 'contact' ? 'panelContact' : 'panelPayment';
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

  // Payment button
  const savePaymentBtn = document.getElementById('savePaymentBtn');
  if (savePaymentBtn) savePaymentBtn.addEventListener('click', handlePaymentSubmit);

  // Load
  await loadSettings();
});

/* ═══════════════════════════════════════
              Load
   ═══════════════════════════════════════ */

async function loadSettings() {
  try {
    currentSettings = await API.getPlatformSettings();

    // Contact fields
    setVal('contactPhone', currentSettings.contact_phone);
    setVal('contactEmail', currentSettings.contact_email);
    setVal('contactAddress', currentSettings.contact_address);
    setVal('contactTelegram', currentSettings.contact_telegram);
    setVal('contactWhatsapp', currentSettings.contact_whatsapp);

    // Payment fields
    setVal('hesabPayNumber', currentSettings.hesab_pay_number);
    setVal('hesabPayHolder', currentSettings.hesab_pay_holder);
    setVal('walletTrc20', currentSettings.usdt_wallet_trc20);
    setVal('walletBep20', currentSettings.usdt_wallet_bep20);
    setVal('walletErc20', currentSettings.usdt_wallet_erc20);
    setVal('minDepositUsdt', currentSettings.min_deposit_usdt);
    setVal('minWithdrawUsdt', currentSettings.min_withdraw_usdt);
    setVal('minWithdrawAfn', currentSettings.min_withdraw_afn);

    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('contentBox').style.display = 'block';

  } catch (err) {
    console.error('Load settings failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">Failed to load settings.</p>
    `;
  }
}

/* ═══════════════════════════════════════
              Save Contact
   ═══════════════════════════════════════ */

async function handleContactSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('saveContactBtn');
  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const payload = {
      contact_phone: getVal('contactPhone'),
      contact_email: getVal('contactEmail'),
      contact_address: getVal('contactAddress'),
      contact_telegram: getVal('contactTelegram'),
      contact_whatsapp: getVal('contactWhatsapp'),
    };

    const updated = await API.updatePlatformSettings(payload);
    currentSettings = updated;

    Notify.success('Contact info saved!');

  } catch (err) {
    console.error('Save contact failed:', err);
    Notify.error(err.detail || 'Failed to save.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ═══════════════════════════════════════
              Save Payment
   ═══════════════════════════════════════ */

async function handlePaymentSubmit() {
  const btn = document.getElementById('savePaymentBtn');
  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const payload = {
      hesab_pay_number: getVal('hesabPayNumber'),
      hesab_pay_holder: getVal('hesabPayHolder'),
      usdt_wallet_trc20: getVal('walletTrc20'),
      usdt_wallet_bep20: getVal('walletBep20'),
      usdt_wallet_erc20: getVal('walletErc20'),
      min_deposit_usdt: parseFloat(getVal('minDepositUsdt')) || 10,
      min_withdraw_usdt: parseFloat(getVal('minWithdrawUsdt')) || 10,
      min_withdraw_afn: parseFloat(getVal('minWithdrawAfn')) || 500,
    };

    const updated = await API.updatePlatformSettings(payload);
    currentSettings = updated;

    Notify.success('Payment info saved!');

  } catch (err) {
    console.error('Save payment failed:', err);
    Notify.error(err.detail || 'Failed to save.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}