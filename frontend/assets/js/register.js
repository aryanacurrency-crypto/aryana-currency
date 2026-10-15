/* ═══════════════════════════════════════
   ARYANA CURRENCY — Register Page Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  Auth.redirectIfLoggedIn();

  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const successBox = document.getElementById('successBox');
  const emailInput = document.getElementById('email');
  const fullNameInput = document.getElementById('fullName');
  const referralInput = document.getElementById('referralCode');
  const referralStatus = document.getElementById('referralStatus');

  // ─── فقط انگلیسی توی ایمیل ───
  preventNonEnglish(emailInput);

  // ─── اسم: فقط حروف انگلیسی و فاصله ───
  preventNonEnglish(fullNameInput, { mode: 'name' });

  // ─── Show/Hide Password ───
  attachPasswordToggle('password', 'passwordToggle');
  attachPasswordToggle('passwordConfirm', 'passwordConfirmToggle');

  // ═══════════════════════════════════════
  //   🎁 Referral Code — Auto-fill از URL
  // ═══════════════════════════════════════
  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl =
    urlParams.get('ref') ||
    urlParams.get('referral') ||
    urlParams.get('partner');

  if (refFromUrl && referralInput) {
    referralInput.value = refFromUrl.toUpperCase();
    validateReferralCode(referralInput.value);
  }

  // ═══════════════════════════════════════
  //   🎁 Referral Code — Validation زنده
  // ═══════════════════════════════════════
  let referralCheckTimeout;

  if (referralInput) {
    // فقط حروف و اعداد انگلیسی، خودکار uppercase
    referralInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

      const code = e.target.value.trim();
      referralStatus.className = 'referral-status';

      if (!code) {
        return;
      }

      if (code.length < 4) {
        return;
      }

      clearTimeout(referralCheckTimeout);
      referralStatus.classList.add('checking');

      referralCheckTimeout = setTimeout(() => {
        validateReferralCode(code);
      }, 500);
    });
  }

  async function validateReferralCode(code) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/referral/validate/${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        referralStatus.className = 'referral-status valid';
        referralStatus.title = `Invited by: ${data.referrer_name}`;
      } else {
        referralStatus.className = 'referral-status invalid';
      }
    } catch (err) {
      console.error('Referral validation error:', err);
      referralStatus.className = 'referral-status';
    }
  }

  // ═══════════════════════════════════════
  //              Form Submit
  // ═══════════════════════════════════════
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    errorBox.style.display = 'none';
    successBox.style.display = 'none';

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim() || null;
    const password = form.password.value;
    const passwordConfirm = form.passwordConfirm.value;
    const referralCode = referralInput ? referralInput.value.trim().toUpperCase() : null;

    // اعتبارسنجی
    if (!fullName || !email || !password) {
      showError(I18N.t('registerErrorEmpty') || 'Please fill in required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showError(I18N.currentLang === 'en' ? 'Please enter a valid email address.'
            : I18N.currentLang === 'fa' ? 'لطفاً یک ایمیل معتبر وارد کنید.'
            : 'مهرباني وکړئ یو سم ایمیل ولیکئ.');
      return;
    }

    if (phone && !isValidPhone(phone)) {
      showError(I18N.currentLang === 'en' ? 'Please enter a valid phone number.'
            : I18N.currentLang === 'fa' ? 'لطفاً یک شماره تلفن معتبر وارد کنید.'
            : 'مهرباني وکړئ یو سم تلیفون شمېره ولیکئ.');
      return;
    }

    if (password.length < 8) {
      showError(I18N.t('registerErrorPasswordShort') || 'Password must be at least 8 characters.');
      return;
    }

    if (password !== passwordConfirm) {
      showError(I18N.t('registerErrorPasswordMatch') || 'Passwords do not match.');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      const payload = {
        email,
        password,
        full_name: fullName,
        phone,
      };

      // 🎁 Referral Code (فقط اگه پر بود)
      if (referralCode) {
        payload.referral_code = referralCode;
      }

      await API.register(payload);

      const tokens = await API.login(email, password);
      Auth.setTokens(tokens.access_token, tokens.refresh_token);

      const user = await API.me();
      Auth.setUser(user);

      showSuccess(I18N.t('registerSuccess') || 'Account created! Redirecting...');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 900);

    } catch (err) {
      console.error('Register error:', err);
      let msg = err.detail || 'Registration failed. Please try again.';

      if (msg.includes('کد دعوت') || msg.includes('referral') || msg.includes('code')) {
        msg = I18N.currentLang === 'en' ? 'Invalid referral code.'
            : I18N.currentLang === 'fa' ? 'کد دعوت نامعتبر است.'
            : 'د بلنې کوډ سم نه دی.';
        referralStatus.className = 'referral-status invalid';
      } else if (msg.includes('ایمیل')) {
        msg = I18N.currentLang === 'en' ? 'This email is already registered.'
            : I18N.currentLang === 'fa' ? 'این ایمیل قبلاً ثبت شده است.'
            : 'دا ایمیل لا دمخه ثبت شوی دی.';
      } else if (msg.includes('تلفن')) {
        msg = I18N.currentLang === 'en' ? 'This phone number is already registered.'
            : I18N.currentLang === 'fa' ? 'این شماره تلفن قبلاً ثبت شده است.'
            : 'دا تلیفون شمېره لا دمخه ثبت شوې ده.';
      } else if (err.status === 0) {
        msg = I18N.currentLang === 'en' ? 'Cannot connect to server.'
            : I18N.currentLang === 'fa' ? 'اتصال به سرور برقرار نشد.'
            : 'سرور سره اړیکه نشوه.';
      }

      showError(msg);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSuccess(message) {
    successBox.textContent = message;
    successBox.style.display = 'block';
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});