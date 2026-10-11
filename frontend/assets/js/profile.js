/* ═══════════════════════════════════════
   ARYANA CURRENCY — Profile Page Logic
   ═══════════════════════════════════════ */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = I18N.currentLang;
    langSelect.addEventListener('change', (e) => I18N.setLanguage(e.target.value));
  }

  // تب‌ها
  setupTabs();

  // فرم‌ها
  setupPersonalForm();
  setupPaymentForm();
  setupPasswordForm();

  // KYC
  setupKycHandlers();

  // لود پروفایل
  await loadProfile();

  // لود وضعیت KYC
  await loadKycStatus();
});

/* ═══════════════════════════════════════
                تب‌ها
   ═══════════════════════════════════════ */

function setupTabs() {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
      const content = document.querySelector(`[data-tab-content="${target}"]`);
      if (content) content.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════
              لود پروفایل
   ═══════════════════════════════════════ */

async function loadProfile() {
  try {
    currentUser = await API.me();
    Auth.setUser(currentUser);
    renderProfile();
  } catch (err) {
    console.error('Load profile failed:', err);
    showError(err.detail || 'Could not load profile.');
  }
}

function renderProfile() {
  const u = currentUser;

  // Header
  const initial = (u.full_name || u.email || '?').charAt(0).toUpperCase();
  document.getElementById('avatar').textContent = initial;
  document.getElementById('headerName').textContent = u.full_name || 'User';
  document.getElementById('headerEmail').textContent = u.email;

  // Badges
  const roleBadge = document.getElementById('badgeRole');
  roleBadge.textContent = u.role;
  roleBadge.className = 'profile-badge ' + (u.role === 'ADMIN' ? 'gold' : 'gray');

  const kycBadge = document.getElementById('badgeKyc');
  const kycStatus = u.is_verified ? 'VERIFIED' : 'PENDING';
  kycBadge.textContent = 'KYC ' + kycStatus;
  kycBadge.className = 'profile-badge ' + (u.is_verified ? 'green' : 'gray');

  // Personal
  document.getElementById('fullName').value = u.full_name || '';
  document.getElementById('phone').value = u.phone || '';
  document.getElementById('emailDisplay').value = u.email;

  // Payment
  document.getElementById('hesabPay').value = u.hesab_pay_number || '';
  document.getElementById('hesabHolder').value = u.hesab_pay_holder_name || '';
  document.getElementById('usdtWallet').value = u.usdt_wallet_address || '';
  document.getElementById('usdtNetwork').value = u.usdt_wallet_network || 'TRC20';

  // Account info
  document.getElementById('infoId').textContent = '#' + u.id;
  document.getElementById('infoCreated').textContent = new Date(u.created_at).toLocaleDateString();
  document.getElementById('infoRole').textContent = u.role;
  document.getElementById('infoKyc').textContent = u.is_verified ? 'Verified' : 'Pending';
  document.getElementById('infoStatus').textContent = u.is_active ? 'Active' : 'Disabled';
}

/* ═══════════════════════════════════════
          فرم اطلاعات شخصی
   ═══════════════════════════════════════ */

function setupPersonalForm() {
  const form = document.getElementById('personalForm');
  const btn = document.getElementById('savePersonalBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim() || null;

    if (!fullName) {
      showError(I18N.currentLang === 'en' ? 'Full name is required.'
              : I18N.currentLang === 'fa' ? 'نام کامل الزامی است.'
              : 'بشپړ نوم اړین دی.');
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
      showSuccess(I18N.currentLang === 'en' ? 'Profile updated.'
                : I18N.currentLang === 'fa' ? 'پروفایل به‌روزرسانی شد.'
                : 'پروفایل تازه شو.');
      setTimeout(hideAlerts, 2500);
    } catch (err) {
      console.error('Update profile failed:', err);
      showError(err.detail || 'Failed to update profile.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
          فرم اطلاعات پرداخت
   ═══════════════════════════════════════ */

function setupPaymentForm() {
  const form = document.getElementById('paymentForm');
  const btn = document.getElementById('savePaymentBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const hesabPay = document.getElementById('hesabPay').value.trim() || null;
    const hesabHolder = document.getElementById('hesabHolder').value.trim() || null;
    const usdtWallet = document.getElementById('usdtWallet').value.trim() || null;
    const usdtNetwork = document.getElementById('usdtNetwork').value || 'TRC20';

    // اعتبارسنجی ولت تتر
    if (usdtWallet && !usdtWallet.startsWith('T') && usdtNetwork === 'TRC20') {
      showError(I18N.currentLang === 'en' ? 'TRC20 wallet address must start with T.'
              : I18N.currentLang === 'fa' ? 'آدرس TRC20 باید با T شروع شود.'
              : 'د TRC20 پته باید د T سره پیل شي.');
      return;
    }

    if (usdtWallet && !usdtWallet.startsWith('0x') && usdtNetwork === 'BEP20') {
      showError(I18N.currentLang === 'en' ? 'BEP20 wallet address must start with 0x.'
              : I18N.currentLang === 'fa' ? 'آدرس BEP20 باید با 0x شروع شود.'
              : 'د BEP20 پته باید د 0x سره پیل شي.');
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
      showSuccess(I18N.currentLang === 'en' ? 'Payment details updated.'
                : I18N.currentLang === 'fa' ? 'اطلاعات پرداخت به‌روزرسانی شد.'
                : 'د تادیې معلومات تازه شول.');
      setTimeout(hideAlerts, 2500);
    } catch (err) {
      console.error('Update payment failed:', err);
      showError(err.detail || 'Failed to update payment details.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
           فرم تغییر رمز
   ═══════════════════════════════════════ */

function setupPasswordForm() {
  const form = document.getElementById('passwordForm');
  const btn = document.getElementById('changePasswordBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) {
      showError(I18N.currentLang === 'en' ? 'Please fill all fields.'
              : I18N.currentLang === 'fa' ? 'لطفاً همه فیلدها را پر کنید.'
              : 'مهرباني وکړئ ټول ساحې ډک کړئ.');
      return;
    }

    if (newPass.length < 8) {
      showError(I18N.currentLang === 'en' ? 'New password must be at least 8 characters.'
              : I18N.currentLang === 'fa' ? 'پسورد جدید باید حداقل ۸ کاراکتر باشد.'
              : 'نوی پټنوم باید لږترلږه ۸ توري وي.');
      return;
    }

    if (newPass !== confirm) {
      showError(I18N.currentLang === 'en' ? 'New passwords do not match.'
              : I18N.currentLang === 'fa' ? 'پسوردهای جدید یکسان نیستند.'
              : 'نوي پټنومونه سره سمون نه خوري.');
      return;
    }

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.changePassword(current, newPass);
      form.reset();
      showSuccess(I18N.currentLang === 'en' ? 'Password changed successfully.'
                : I18N.currentLang === 'fa' ? 'پسورد با موفقیت تغییر کرد.'
                : 'پټنوم په بریالیتوب سره بدل شو.');
      setTimeout(hideAlerts, 3000);
    } catch (err) {
      console.error('Change password failed:', err);
      let msg = err.detail || 'Failed to change password.';
      if (msg.includes('فعلی اشتباه')) {
        msg = I18N.currentLang === 'en' ? 'Current password is incorrect.'
            : I18N.currentLang === 'fa' ? 'پسورد فعلی اشتباه است.'
            : 'اوسنی پټنوم غلط دی.';
      }
      showError(msg);
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
                KYC
   ═══════════════════════════════════════ */

let selectedFiles = {
  national_id: null,
  passport: null,
  selfie: null,
};

function setupKycHandlers() {
  // کلیک روی دکمه‌های Choose file
  document.querySelectorAll('[data-upload]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.upload;
      const input = document.getElementById(
        type === 'national_id' ? 'fileNationalId' :
        type === 'passport' ? 'filePassport' :
        'fileSelfie'
      );
      if (input) input.click();
    });
  });

  // تغییر فایل‌ها
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
        Notify.error(
          I18N.currentLang === 'en' ? 'File too large. Max 5 MB.'
          : I18N.currentLang === 'fa' ? 'فایل خیلی بزرگه. حداکثر ۵ مگابایت.'
          : 'فایل ډیر لوی دی. اعظمي ۵ MB.'
        );
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

  // دکمه Clear
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

  // دکمه Upload
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
    Notify.warning(
      I18N.currentLang === 'en' ? 'Please choose at least one file.'
      : I18N.currentLang === 'fa' ? 'لطفاً حداقل یک فایل انتخاب کنید.'
      : 'مهرباني وکړئ لږترلږه یو فایل غوره کړئ.'
    );
    return;
  }

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    for (const [docType, file] of toUpload) {
      await API.uploadKycDocument(docType, file);
    }

    Notify.success(
      I18N.currentLang === 'en' ? 'Documents uploaded. Awaiting verification.'
      : I18N.currentLang === 'fa' ? 'مدارک آپلود شد. در انتظار تأیید.'
      : 'اسناد پورته شول. د تصدیق په تمه.'
    );

    // ریست
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
  const banner = document.getElementById('kycStatusBanner');
  const icon = document.getElementById('kycStatusIcon');
  const title = document.getElementById('kycStatusTitle');
  const text = document.getElementById('kycStatusText');
  const docsContainer = document.getElementById('kycDocuments');
  const uploadBox = document.getElementById('kycUploadBox');

  if (!banner) return;

  banner.className = 'kyc-status-banner';

  const config = {
    'NOT_SUBMITTED': {
      cls: 'not-submitted',
      icon: '⏳',
      title: { en: 'Not submitted', fa: 'ارسال نشده', ps: 'نه دی سپارل شوی' },
      text: { 
        en: 'Upload your documents to verify your identity.',
        fa: 'برای تأیید هویت، مدارک خود را آپلود کنید.',
        ps: 'د خپل هویت تصدیق لپاره خپل اسناد پورته کړئ.'
      },
      showUpload: true,
    },
    'PENDING': {
      cls: 'pending',
      icon: '🔍',
      title: { en: 'Under review', fa: 'در حال بررسی', ps: 'د کتنې لاندې' },
      text: { 
        en: 'Your documents are being reviewed. This usually takes up to 24 hours.',
        fa: 'مدارک شما در حال بررسی است. معمولاً تا ۲۴ ساعت طول می‌کشد.',
        ps: 'ستاسو اسناد کتل کیږي. دا معمولاً تر ۲۴ ساعتونو پورې وخت نیسي.'
      },
      showUpload: false,
    },
    'APPROVED': {
      cls: 'approved',
      icon: '✓',
      title: { en: 'Verified', fa: 'تأیید شده', ps: 'تصدیق شوی' },
      text: { 
        en: 'Your identity has been verified. You have full access to all features.',
        fa: 'هویت شما تأیید شد. به تمام امکانات دسترسی کامل دارید.',
        ps: 'ستاسو هویت تصدیق شو. تاسو ټولو ځانګړتیاوو ته بشپړ لاسرسی لرئ.'
      },
      showUpload: false,
    },
    'REJECTED': {
      cls: 'rejected',
      icon: '✕',
      title: { en: 'Rejected', fa: 'رد شده', ps: 'رد شوی' },
      text: { 
        en: 'One or more documents were rejected. Please re-upload.',
        fa: 'یک یا چند مدرک رد شد. لطفاً دوباره آپلود کنید.',
        ps: 'یو یا ډیر اسناد رد شول. مهرباني وکړئ بیا پورته کړئ.'
      },
      showUpload: true,
    },
  };

  const c = config[data.overall_status] || config.NOT_SUBMITTED;
  banner.classList.add(c.cls);
  icon.textContent = c.icon;
  title.textContent = c.title[I18N.currentLang] || c.title.en;
  text.textContent = c.text[I18N.currentLang] || c.text.en;

  // مخفی یا نشون دادن بخش آپلود
  if (uploadBox) {
    uploadBox.style.display = c.showUpload ? 'grid' : 'none';
  }
  if (!c.showUpload) {
    const bar = document.getElementById('kycUploadBar');
    if (bar) bar.style.display = 'none';
  }

  // لیست مدارک
  if (docsContainer && data.documents.length > 0) {
    docsContainer.innerHTML = '';
    data.documents.forEach(doc => {
      const div = document.createElement('div');
      div.className = 'kyc-doc-row';

      const statusMap = {
        'PENDING': { text: { en: 'Pending', fa: 'در انتظار', ps: 'په تمه' }, cls: 'status-review' },
        'APPROVED': { text: { en: 'Approved', fa: 'تأیید', ps: 'تصدیق' }, cls: 'status-completed' },
        'REJECTED': { text: { en: 'Rejected', fa: 'رد', ps: 'رد' }, cls: 'status-rejected' },
      };

      const typeNames = {
        'national_id': { en: 'National ID', fa: 'تذکره ملی', ps: 'ملي تذکره' },
        'passport': { en: 'Passport', fa: 'پاسپورت', ps: 'پاسپورت' },
        'selfie': { en: 'Selfie', fa: 'سلفی', ps: 'سیلفي' },
      };

      const s = statusMap[doc.status] || statusMap.PENDING;
      const typeName = (typeNames[doc.doc_type] || {})[I18N.currentLang] || doc.doc_type;

      div.innerHTML = `
        <div>
          <div class="kyc-doc-type">${typeName}</div>
          <div class="kyc-doc-date">${new Date(doc.created_at).toLocaleString()}</div>
          ${doc.rejection_reason ? `<div class="kyc-doc-reason">${doc.rejection_reason}</div>` : ''}
        </div>
        <span class="order-status ${s.cls}">${s.text[I18N.currentLang] || s.text.en}</span>
      `;
      docsContainer.appendChild(div);
    });
  } else if (docsContainer) {
    docsContainer.innerHTML = '';
  }
}

/* ═══════════════════════════════════════
                Helpers
   ═══════════════════════════════════════ */

function showSuccess(msg) {
  const box = document.getElementById('successBox');
  box.textContent = msg;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideAlerts() {
  document.getElementById('successBox').style.display = 'none';
  document.getElementById('errorBox').style.display = 'none';
}