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


/* ═══════════════════════════════════════
   Profile — Referral & Rewards Wheel
   ═══════════════════════════════════════ */

let profileReferralCode = '—';
let profileReferralLink = '—';
let profileWheelState = {
  prizes: [],
  availableTickets: 0,
  ticketPrice: 50,
  maxSpinsPerDay: 10,
  todaySpins: 0,
  isEnabled: true,
  spinning: false,
  currentRotation: 0,
};

// ═══════════════════════════════════════
//         Referral Data
// ═══════════════════════════════════════

async function loadReferralData() {
  try {
    const stats = await API.request('/referral/me');

    profileReferralCode = stats.code || '—';
    profileReferralLink = `${window.location.origin}${window.location.pathname.replace('profile.html', 'register.html')}?ref=${profileReferralCode}`;

    const codeEl = document.getElementById('profileReferralCode');
    const linkEl = document.getElementById('profileReferralLink');
    if (codeEl) codeEl.textContent = profileReferralCode;
    if (linkEl) linkEl.value = profileReferralLink;

    document.getElementById('profileTotalReferrals').textContent = stats.total_referrals || 0;
    document.getElementById('profileLocked').textContent = `${(stats.locked_amount || 0).toFixed(2)} AFN`;
    document.getElementById('profileReleased').textContent = `${(stats.total_earned || 0).toFixed(2)} AFN`;
    document.getElementById('profileEarned').textContent = `${(stats.total_earned || 0).toFixed(2)} AFN`;

    const list = await API.request('/referral/list');
    renderReferralsList(list);

  } catch (err) {
    console.error('Referral load failed:', err);
  }
}

function renderReferralsList(list) {
  const container = document.getElementById('profileReferralsList');
  if (!container) return;

  if (!list || list.length === 0) return;

  container.innerHTML = list.map(r => {
    const isReleased = r.bonus_status === 'released';

    const badgeColor = isReleased
      ? 'background: rgba(14, 203, 129, 0.12); color: var(--green);'
      : 'background: rgba(240, 185, 11, 0.12); color: var(--gold);';

    const badgeText = isReleased ? 'Released' : 'Pending';

    return `
      <div style="padding:16px; background:var(--bg-tertiary); border:1px solid var(--border-subtle); border-radius:12px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:10px;">
          <strong style="font-size:14px;">${escapeHtml(r.referred_user_name)}</strong>
          <span style="padding:4px 10px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; ${badgeColor}">
            ${badgeText}
          </span>
        </div>

        <div style="display:flex; gap:6px; font-size:11px; margin-bottom:12px; flex-wrap:wrap;">
          <span style="padding:4px 10px; border-radius:6px; background:${r.registered_at ? 'rgba(14, 203, 129, 0.1)' : 'var(--bg-hover)'}; color:${r.registered_at ? 'var(--green)' : 'var(--text-tertiary)'}; font-weight:600;">
            Registration
          </span>
          <span style="padding:4px 10px; border-radius:6px; background:${r.kyc_completed ? 'rgba(14, 203, 129, 0.1)' : 'rgba(240, 185, 11, 0.1)'}; color:${r.kyc_completed ? 'var(--green)' : 'var(--gold)'}; font-weight:600;">
            KYC
          </span>
          <span style="padding:4px 10px; border-radius:6px; background:${r.first_trade_done ? 'rgba(14, 203, 129, 0.1)' : 'rgba(240, 185, 11, 0.1)'}; color:${r.first_trade_done ? 'var(--green)' : 'var(--gold)'}; font-weight:600;">
            First Trade
          </span>
        </div>

        <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border-subtle); font-size:13px;">
          <span style="color:var(--text-secondary);">Reward</span>
          <strong style="color:var(--gold); font-variant-numeric:tabular-nums;">${r.bonus_amount.toFixed(2)} AFN</strong>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════
//         Copy & Share
// ═══════════════════════════════════════

function copyText(text, btn) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showCopied(btn));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopied(btn);
  }
}

function showCopied(btn) {
  if (!btn) return;
  btn.classList.add('copied');
  const span = btn.querySelector('span');
  const original = span?.textContent || '';
  if (span) span.textContent = 'Copied';

  setTimeout(() => {
    btn.classList.remove('copied');
    if (span) span.textContent = original;
  }, 1500);
}

document.getElementById('profileCopyCode')?.addEventListener('click', (e) => {
  copyText(profileReferralCode, e.currentTarget);
});

document.getElementById('profileCopyLink')?.addEventListener('click', (e) => {
  copyText(profileReferralLink, e.currentTarget);
});

document.querySelectorAll('.ref-share-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.share;
    const shareText = `Join Aryana Currency — trusted USDT/AFN exchange. Use my code: ${profileReferralCode}`;

    if (type === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(profileReferralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + profileReferralLink)}`, '_blank');
    } else if (type === 'copy') {
      copyText(profileReferralLink, btn);
    }
  });
});

// ═══════════════════════════════════════
//         Wheel Data
// ═══════════════════════════════════════

async function loadWheelData() {
  try {
    const data = await API.request('/wheel/status');

    profileWheelState.prizes = data.prizes || [];
    profileWheelState.availableTickets = data.available_tickets || 0;
    profileWheelState.ticketPrice = data.ticket_price || 50;
    profileWheelState.maxSpinsPerDay = data.max_spins_per_day || 10;
    profileWheelState.todaySpins = data.today_spins || 0;
    profileWheelState.isEnabled = data.is_enabled;

    document.getElementById('profileTicketsCount').textContent = profileWheelState.availableTickets;
    document.getElementById('profileTicketPrice').textContent = `${profileWheelState.ticketPrice} AFN`;
    document.getElementById('profileTodaySpins').textContent =
      `${profileWheelState.todaySpins} / ${profileWheelState.maxSpinsPerDay}`;

    renderProfileWheel(profileWheelState.prizes);
    updateProfileSpinBtn();

  } catch (err) {
    console.error('Wheel load failed:', err);
  }
}

function renderProfileWheel(prizes) {
  const svg = document.getElementById('profileWheelSvg');
  if (!svg) return;

  const total = prizes.length;
  if (total === 0) return;

  const sliceAngle = 360 / total;
  const cx = 200, cy = 200, r = 195;

  let content = '';

  prizes.forEach((prize, i) => {
    const startAngle = i * sliceAngle - 90;
    const endAngle = startAngle + sliceAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    content += `<path d="${path}" fill="${prize.color}" stroke="#0B0E11" stroke-width="2"/>`;

    const midAngle = startAngle + sliceAngle / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const tx = cx + r * 0.68 * Math.cos(midRad);
    const ty = cy + r * 0.68 * Math.sin(midRad);

    let textRotation = midAngle + 90;
    if (textRotation > 90 && textRotation < 270) textRotation += 180;

    const label = (prize.label || '').trim();

    content += `
      <g transform="translate(${tx}, ${ty}) rotate(${textRotation})">
        <text x="0" y="4" text-anchor="middle" font-size="12" font-weight="800" fill="white" font-family="Inter, sans-serif">${label}</text>
      </g>
    `;
  });

  content += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0B0E11" stroke-width="2"/>`;

  svg.innerHTML = content;
}

function updateProfileSpinBtn() {
  const btn = document.getElementById('profileSpinBtn');
  const hint = document.getElementById('profileSpinHint');
  if (!btn || !hint) return;

  if (!profileWheelState.isEnabled) {
    btn.disabled = true;
    hint.textContent = 'Wheel disabled';
    return;
  }

  if (profileWheelState.availableTickets < 1) {
    btn.disabled = true;
    hint.textContent = 'Ticket required';
    return;
  }

  if (profileWheelState.todaySpins >= profileWheelState.maxSpinsPerDay) {
    btn.disabled = true;
    hint.textContent = 'Daily limit reached';
    return;
  }

  btn.disabled = false;
  hint.textContent = 'Ready to spin';
}

document.getElementById('profileSpinBtn')?.addEventListener('click', async () => {
  if (profileWheelState.spinning) return;

  profileWheelState.spinning = true;
  document.getElementById('profileWheelResult').style.display = 'none';

  const btn = document.getElementById('profileSpinBtn');
  btn.disabled = true;
  btn.classList.add('spinning');

  try {
    const result = await API.request('/wheel/spin', { method: 'POST' });

    const extraTurns = 7 + Math.floor(Math.random() * 3);
    const totalRotation = profileWheelState.currentRotation + (extraTurns * 360) + (360 - result.target_angle);

    const wheel = document.getElementById('profileWheel');
    wheel.style.transition = `transform ${result.duration || 8}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    wheel.style.transform = `rotate(${totalRotation}deg)`;

    profileWheelState.currentRotation = totalRotation % 360;

    setTimeout(() => {
      showProfileResult(result);
      profileWheelState.spinning = false;
      btn.classList.remove('spinning');
      loadWheelData();
    }, (result.duration || 8) * 1000 + 200);

  } catch (err) {
    console.error('Spin failed:', err);
    profileWheelState.spinning = false;
    btn.disabled = false;
    btn.classList.remove('spinning');
    if (typeof Notifications !== 'undefined') {
      Notifications.error(err.detail || 'Spin failed');
    }
  }
});

function showProfileResult(result) {
  const container = document.getElementById('profileWheelResult');
  const titleEl = document.getElementById('profileResultTitle');
  const amountEl = document.getElementById('profileResultAmount');
  const iconEl = document.getElementById('profileResultIcon');

  const r = result.result;

  let title = '', amount = '', icon = '';

  if (r.type === 'cash' && r.amount > 0) {
    title = 'Reward Won';
    amount = `${r.amount.toFixed(2)} ${r.currency}`;
    icon = '◆';
  } else if (r.type === 'ticket') {
    title = 'Bonus Tickets';
    amount = `+${r.ticket_count} Ticket${r.ticket_count > 1 ? 's' : ''}`;
    icon = '◇';
  } else {
    title = 'No Reward';
    amount = 'Try Again';
    icon = '○';
  }

  iconEl.textContent = icon;
  titleEl.textContent = title;
  amountEl.textContent = amount;

  container.style.display = 'block';

  if (typeof Notifications !== 'undefined') {
    if (r.type === 'cash' && r.amount > 0) {
      Notifications.success(`Reward: ${r.amount} ${r.currency}`);
    }
  }
}

document.getElementById('profileBuyTicketBtn')?.addEventListener('click', async () => {
  const count = prompt('Quantity (1-10):', '1');
  if (!count) return;

  const n = parseInt(count, 10);
  if (isNaN(n) || n < 1 || n > 10) {
    if (typeof Notifications !== 'undefined') {
      Notifications.error('Enter a number between 1 and 10');
    }
    return;
  }

  try {
    await API.request(`/wheel/buy-ticket?count=${n}`, { method: 'POST' });
    if (typeof Notifications !== 'undefined') {
      Notifications.success(`${n} ticket(s) purchased`);
    }
    await loadWheelData();
  } catch (err) {
    if (typeof Notifications !== 'undefined') {
      Notifications.error(err.detail || 'Purchase failed');
    }
  }
});

// ═══════════════════════════════════════
//         Lazy load on tab click
// ═══════════════════════════════════════

document.querySelectorAll('.profile-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    if (tab === 'referral') {
      loadReferralData();
    } else if (tab === 'wheel') {
      loadWheelData();
    }
  });
});

// ═══════════════════════════════════════
//         Helper
// ═══════════════════════════════════════

function escapeHtml(t) {
  if (!t) return '';
  const div = document.createElement('div');
  div.textContent = String(t);
  return div.innerHTML;
}