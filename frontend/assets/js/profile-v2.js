/* ═══════════════════════════════════════
   ARYANA CURRENCY — Profile v2 Logic
   ═══════════════════════════════════════ */

let currentUser = null;

/* ─── KYC State ─── */
let selectedFiles = {
  national_id: null,
  passport: null,
  selfie: null,
};

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

  // Tabs
  setupTabs();

  // Forms
  setupPersonalForm();
  setupPaymentForm();
  setupPasswordForm();
  setupKycHandlers();

  // Show admin button
  showAdminButton();

  // Load data
  renderUserFromCache();

  await Promise.all([
    loadProfile(),
    loadKycStatus(),
  ]);
});

/* ═══════════════════════════════════════
              Tabs
   ═══════════════════════════════════════ */

function setupTabs() {
  const items = document.querySelectorAll('.profile-nav-item');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.tab;

      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.profile-panel').forEach(p => p.classList.remove('active'));
      const panel = document.querySelector(`[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════
              Show Admin Button
   ═══════════════════════════════════════ */

function showAdminButton() {
  const user = Auth.getUser();
  const btn = document.getElementById('adminPanelBtn');
  if (!btn) return;

  if (user && user.role === 'ADMIN') {
    btn.style.display = 'grid';
  }
}

/* ═══════════════════════════════════════
              Render User
   ═══════════════════════════════════════ */

function renderUserFromCache() {
  const user = Auth.getUser();
  if (!user) return;

  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();

  setText('sideAvatar', initial);
  setText('userAvatar', initial);
  setText('sideName', user.full_name || 'User');
  setText('userName', (user.full_name || 'User').split(' ')[0]);
  setText('sideEmail', user.email);
}

async function loadProfile() {
  try {
    currentUser = await API.me();
    Auth.setUser(currentUser);
    renderProfile();
    showAdminButton();
  } catch (err) {
    console.error('Load profile failed:', err);
    Notify.error(err.detail || 'Could not load profile.');
  }
}

function renderProfile() {
  const u = currentUser;
  if (!u) return;

  const initial = (u.full_name || u.email || '?').charAt(0).toUpperCase();

  // Header
  setText('userAvatar', initial);
  setText('userName', (u.full_name || 'User').split(' ')[0]);

  // Sidebar
  setText('sideAvatar', initial);
  setText('sideName', u.full_name || 'User');
  setText('sideEmail', u.email);

  // Badges
  const roleBadge = document.getElementById('sideRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = u.role;
    roleBadge.className = 'profile-badge ' + (u.role === 'ADMIN' ? 'admin' : 'user');
  }

  const kycBadge = document.getElementById('sideKycBadge');
  if (kycBadge) {
    kycBadge.textContent = u.is_verified ? 'VERIFIED' : 'UNVERIFIED';
    kycBadge.className = 'profile-badge ' + (u.is_verified ? 'verified' : 'unverified');
  }

  // Personal
  setValue('fullName', u.full_name || '');
  setValue('phone', u.phone || '');
  setValue('emailDisplay', u.email);

  // Payment
  setValue('hesabPay', u.hesab_pay_number || '');
  setValue('hesabHolder', u.hesab_pay_holder_name || '');
  setValue('usdtWallet', u.usdt_wallet_address || '');
  setValue('usdtNetwork', u.usdt_wallet_network || 'TRC20');

  // Account Info
  setText('infoId', '#' + u.id);
  setText('infoCreated', new Date(u.created_at).toLocaleDateString());
  setText('infoRole', u.role);
  setText('infoKyc', u.is_verified ? 'Verified' : 'Pending');
  setText('infoStatus', u.is_active ? 'Active' : 'Disabled');
}

/* ═══════════════════════════════════════
              Personal Form
   ═══════════════════════════════════════ */

function setupPersonalForm() {
  const form = document.getElementById('personalForm');
  const btn = document.getElementById('savePersonalBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim() || null;

    if (!fullName) {
      Notify.warning('Full name is required.');
      return;
    }

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      const updated = await API.updateProfile({
        full_name: fullName,
        phone,
      });
      currentUser = updated;
      Auth.setUser(updated);
      renderProfile();
      Notify.success('Profile updated.');
    } catch (err) {
      console.error('Update failed:', err);
      Notify.error(err.detail || 'Failed to update profile.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
              Payment Form
   ═══════════════════════════════════════ */

function setupPaymentForm() {
  const form = document.getElementById('walletForm');
  const btn = document.getElementById('savePaymentBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const hesabPay = document.getElementById('hesabPay').value.trim() || null;
    const hesabHolder = document.getElementById('hesabHolder').value.trim() || null;
    const usdtWallet = document.getElementById('usdtWallet').value.trim() || null;
    const usdtNetwork = document.getElementById('usdtNetwork').value || 'TRC20';

    // Validation
    if (usdtWallet && !usdtWallet.startsWith('T') && usdtNetwork === 'TRC20') {
      Notify.warning('TRC20 wallet address must start with T.');
      return;
    }
    if (usdtWallet && !usdtWallet.startsWith('0x') && usdtNetwork === 'BEP20') {
      Notify.warning('BEP20 wallet address must start with 0x.');
      return;
    }

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      const updated = await API.updateProfile({
        hesab_pay_number: hesabPay,
        hesab_pay_holder_name: hesabHolder,
        usdt_wallet_address: usdtWallet,
        usdt_wallet_network: usdtNetwork,
      });
      currentUser = updated;
      Auth.setUser(updated);
      renderProfile();
      Notify.success('Payment details updated.');
    } catch (err) {
      console.error('Update failed:', err);
      Notify.error(err.detail || 'Failed to update payment details.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
              Password Form
   ═══════════════════════════════════════ */

function setupPasswordForm() {
  const form = document.getElementById('passwordForm');
  const btn = document.getElementById('changePasswordBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) {
      Notify.warning('Please fill all fields.');
      return;
    }
    if (newPass.length < 8) {
      Notify.warning('New password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirm) {
      Notify.warning('New passwords do not match.');
      return;
    }

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.changePassword(current, newPass);
      form.reset();
      Notify.success('Password changed successfully.');
    } catch (err) {
      console.error('Change password failed:', err);
      let msg = err.detail || 'Failed to change password.';
      if (msg.includes('فعلی اشتباه')) msg = 'Current password is incorrect.';
      Notify.error(msg);
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
              KYC
   ═══════════════════════════════════════ */

function setupKycHandlers() {
  // Choose file buttons
  document.querySelectorAll('[data-upload]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.upload;
      const inputId = type === 'national_id' ? 'fileNationalId'
                    : type === 'passport' ? 'filePassport'
                    : 'fileSelfie';
      const input = document.getElementById(inputId);
      if (input) input.click();
    });
  });

  // File inputs
  const fileInputs = [
    { input: 'fileNationalId', name: 'nameNationalId', type: 'national_id' },
    { input: 'filePassport', name: 'namePassport', type: 'passport' },
    { input: 'fileSelfie', name: 'nameSelfie', type: 'selfie' },
  ];

  fileInputs.forEach(({ input, name, type }) => {
    const el = document.getElementById(input);
    if (!el) return;

    el.addEventListener('change', () => {
      const file = el.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Notify.error('File too large. Max 5 MB.');
        el.value = '';
        return;
      }

      selectedFiles[type] = file;

      const nameEl = document.getElementById(name);
      if (nameEl) {
        nameEl.textContent = `✓ ${file.name}`;
        nameEl.style.display = 'block';
      }

      updateKycUploadBar();
    });
  });

  // Clear
  const clearBtn = document.getElementById('kycClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selectedFiles = { national_id: null, passport: null, selfie: null };
      ['fileNationalId', 'filePassport', 'fileSelfie'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      ['nameNationalId', 'namePassport', 'nameSelfie'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      updateKycUploadBar();
    });
  }

  // Submit
  const submitBtn = document.getElementById('kycSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleKycUpload);
  }
}

function updateKycUploadBar() {
  const bar = document.getElementById('kycUploadBar');
  if (!bar) return;

  const hasAny = Object.values(selectedFiles).some(f => f !== null);
  bar.style.display = hasAny ? 'flex' : 'none';
}

async function handleKycUpload() {
  const btn = document.getElementById('kycSubmitBtn');
  const toUpload = Object.entries(selectedFiles).filter(([_, f]) => f !== null);

  if (toUpload.length === 0) {
    Notify.warning('Please choose at least one file.');
    return;
  }

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    for (const [docType, file] of toUpload) {
      await API.uploadKycDocument(docType, file);
    }

    Notify.success('Documents uploaded. Awaiting verification.');

    // Reset
    selectedFiles = { national_id: null, passport: null, selfie: null };
    ['fileNationalId', 'filePassport', 'fileSelfie'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['nameNationalId', 'namePassport', 'nameSelfie'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    updateKycUploadBar();

    await loadKycStatus();
  } catch (err) {
    console.error('KYC upload failed:', err);
    Notify.error(err.detail || 'Upload failed.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function loadKycStatus() {
  try {
    const data = await API.getKycStatus();
    renderKycStatus(data);
  } catch (err) {
    console.error('Load KYC status failed:', err);
  }
}

function renderKycStatus(data) {
  const banner = document.getElementById('kycBanner');
  const icon = document.getElementById('kycBannerIcon');
  const title = document.getElementById('kycBannerTitle');
  const text = document.getElementById('kycBannerText');
  const docsList = document.getElementById('kycDocsList');
  const uploadGrid = document.getElementById('kycUploadGrid');

  if (!banner) return;

  banner.className = 'kyc-banner';

  const config = {
    'NOT_SUBMITTED': {
      cls: 'not-submitted',
      icon: '⏳',
      title: 'Not submitted',
      text: 'Upload your documents to get verified.',
      showUpload: true,
    },
    'PENDING': {
      cls: 'pending',
      icon: '🔍',
      title: 'Under review',
      text: 'Your documents are being reviewed. Usually takes up to 24 hours.',
      showUpload: false,
    },
    'APPROVED': {
      cls: 'approved',
      icon: '✓',
      title: 'Verified',
      text: 'Your identity has been verified. You have full access.',
      showUpload: false,
    },
    'REJECTED': {
      cls: 'rejected',
      icon: '✕',
      title: 'Rejected',
      text: 'One or more documents were rejected. Please re-upload.',
      showUpload: true,
    },
  };

  const c = config[data.overall_status] || config.NOT_SUBMITTED;
  banner.classList.add(c.cls);
  if (icon) icon.textContent = c.icon;
  if (title) title.textContent = c.title;
  if (text) text.textContent = c.text;

  if (uploadGrid) {
    uploadGrid.style.display = c.showUpload ? 'grid' : 'none';
  }
  if (!c.showUpload) {
    const bar = document.getElementById('kycUploadBar');
    if (bar) bar.style.display = 'none';
  }

  // Documents list
  if (docsList && data.documents && data.documents.length > 0) {
    docsList.innerHTML = '';
    data.documents.forEach(doc => {
      const statusMap = {
        'PENDING': { text: 'Pending', cls: 'badge-warning' },
        'APPROVED': { text: 'Approved', cls: 'badge-success' },
        'REJECTED': { text: 'Rejected', cls: 'badge-danger' },
      };
      const typeNames = {
        'national_id': 'National ID',
        'passport': 'Passport',
        'selfie': 'Selfie',
      };
      const s = statusMap[doc.status] || statusMap.PENDING;

      const row = document.createElement('div');
      row.className = 'kyc-doc-row';
      row.innerHTML = `
        <div class="kyc-doc-info">
          <div class="kyc-doc-type">${typeNames[doc.doc_type] || doc.doc_type}</div>
          <div class="kyc-doc-date">${new Date(doc.created_at).toLocaleString()}</div>
          ${doc.rejection_reason ? `<div class="kyc-doc-reason">${doc.rejection_reason}</div>` : ''}
        </div>
        <span class="badge ${s.cls}">${s.text}</span>
      `;
      docsList.appendChild(row);
    });
  } else if (docsList) {
    docsList.innerHTML = '';
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}