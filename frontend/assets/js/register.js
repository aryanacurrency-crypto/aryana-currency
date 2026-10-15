/* ═══════════════════════════════════════
   ARYANA CURRENCY — Register Page Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const emailInput = document.getElementById('email');
  const fullNameInput = document.getElementById('fullName');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('passwordConfirm');
  const referralInput = document.getElementById('referralCode');
  const referralStatus = document.getElementById('referralStatus');
  const passwordStrength = document.getElementById('passwordStrength');

  // ─── فقط انگلیسی توی ایمیل ───
  if (typeof preventNonEnglish === 'function') {
    preventNonEnglish(emailInput);
    preventNonEnglish(fullNameInput, { mode: 'name' });
  }

  // ─── Show/Hide Password ───
  setupPasswordToggle('passwordToggle', passwordInput);
  setupPasswordToggle('passwordConfirmToggle', passwordConfirmInput);

  function setupPasswordToggle(btnId, input) {
    const btn = document.getElementById(btnId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.style.color = isPassword ? 'var(--gold)' : '';
    });
  }

  // ═══════════════════════════════════════
  //   Referral Code — Auto-fill & Validate
  // ═══════════════════════════════════════
  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('partner');

  if (refFromUrl && referralInput) {
    referralInput.value = refFromUrl.toUpperCase();
    validateReferralCode(referralInput.value);
  }

  let referralTimeout;

  if (referralInput) {
    referralInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const code = e.target.value.trim();
      if (referralStatus) referralStatus.className = 'referral-status';

      if (!code || code.length < 4) return;

      clearTimeout(referralTimeout);
      if (referralStatus) referralStatus.classList.add('checking');

      referralTimeout = setTimeout(() => validateReferralCode(code), 500);
    });
  }

  async function validateReferralCode(code) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/referral/validate/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        if (referralStatus) {
          referralStatus.className = 'referral-status valid';
          referralStatus.textContent = '✓';
        }
      } else {
        if (referralStatus) {
          referralStatus.className = 'referral-status invalid';
          referralStatus.textContent = '✕';
        }
      }
    } catch (err) {
      console.error('Referral validation error:', err);
      if (referralStatus) referralStatus.className = 'referral-status';
    }
  }

  // ═══════════════════════════════════════
  //         Password Strength
  // ═══════════════════════════════════════
  if (passwordInput && passwordStrength) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (!val) {
        passwordStrength.style.display = 'none';
        return;
      }

      passwordStrength.style.display = 'flex';
      const { level, text } = checkPasswordStrength(val);

      const bars = passwordStrength.querySelector('.strength-bars');
      const textEl = passwordStrength.querySelector('.strength-text');

      bars.className = 'strength-bars ' + level;
      textEl.className = 'strength-text ' + level;
      textEl.textContent = text;
    });
  }

  function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (password.length < 6) return { level: 'weak', text: 'Weak' };
    if (score <= 2) return { level: 'weak', text: 'Weak' };
    if (score === 3) return { level: 'fair', text: 'Fair' };
    if (score === 4) return { level: 'good', text: 'Good' };
    return { level: 'strong', text: 'Strong' };
  }

  // ═══════════════════════════════════════
  //              Submit
  // ═══════════════════════════════════════
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorBox) errorBox.classList.remove('show');

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const country = form.country.value;
    const phone = form.phone.value.trim();
    const password = form.password.value;
    const passwordConfirm = form.passwordConfirm.value;
    const referralCode = referralInput ? referralInput.value.trim().toUpperCase() : '';
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validation
    if (!fullName || !email || !country || !phone || !password) {
      return showError('Please fill in all required fields.');
    }

    if (!isValidEmail(email)) {
      return showError('Please enter a valid email address.');
    }

    if (!isValidPhone(phone)) {
      return showError('Please enter a valid phone number.');
    }

    if (password.length < 8) {
      return showError('Password must be at least 8 characters.');
    }

    if (password !== passwordConfirm) {
      return showError('Passwords do not match.');
    }

    if (!agreeTerms) {
      return showError('Please accept the Terms of Service and Privacy Policy.');
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
      const payload = {
        email,
        password,
        full_name: fullName,
        phone: `${country}|${phone}`,
      };

      if (referralCode) payload.referral_code = referralCode;

      await API.register(payload);

      const tokens = await API.login(email, password);
      Auth.setTokens(tokens.access_token, tokens.refresh_token);

      const user = await API.me();
      Auth.setUser(user);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 600);

    } catch (err) {
      console.error('Register error:', err);
      let msg = err.detail || 'Registration failed. Please try again.';

      if (msg.includes('referral') || msg.includes('کد دعوت')) {
        msg = 'Invalid referral code.';
        if (referralStatus) {
          referralStatus.className = 'referral-status invalid';
          referralStatus.textContent = '✕';
        }
      } else if (msg.includes('ایمیل') || msg.includes('email')) {
        msg = 'This email is already registered.';
      } else if (msg.includes('تلفن') || msg.includes('phone')) {
        msg = 'This phone number is already registered.';
      } else if (err.status === 0) {
        msg = 'Cannot connect to server. Check your internet.';
      }

      showError(msg);
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  });

  function showError(message) {
    if (!errorBox) {
      alert(message);
      return;
    }
    errorBox.textContent = message;
    errorBox.classList.add('show');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});