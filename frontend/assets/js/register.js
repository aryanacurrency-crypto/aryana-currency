/* ═══════════════════════════════════════
   ARYANA CURRENCY — Register v4
   Single-Column · Mobile-First · ARYANA OS
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();

  // ─── Redirect if already logged in ───
  if (typeof Auth !== 'undefined' && Auth.redirectIfLoggedIn) {
    Auth.redirectIfLoggedIn();
  }

  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const referralInput = document.getElementById('referral');

  if (!form) {
    console.error('[Register] Form #registerForm not found');
    return;
  }

  /* ═══════════════════════════════════════
     🔍 PASSWORD TOGGLES
     ═══════════════════════════════════════ */

  setupPasswordToggle('togglePassword', 'password');
  setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

  function setupPasswordToggle(toggleId, inputId) {
    const toggleBtn = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (!toggleBtn || !input) return;

    toggleBtn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      toggleBtn.innerHTML = isPassword
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>`;
    });
  }

  /* ═══════════════════════════════════════
     🔗 REFERRAL: Auto-fill from URL
     ═══════════════════════════════════════ */

  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('partner');

  if (refFromUrl && referralInput) {
    referralInput.value = refFromUrl.toUpperCase();
  }

  // ─── Uppercase referral only ───
  if (referralInput) {
    referralInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
  }

  /* ═══════════════════════════════════════
     📤 FORM SUBMIT
     ═══════════════════════════════════════ */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorBox) errorBox.style.display = 'none';

    // ─── Values ───
    const fullName = document.getElementById('fullName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const country = document.getElementById('country')?.value || 'AF';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const referral = referralInput?.value.trim().toUpperCase() || null;
    const agreeTerms = document.getElementById('agreeTerms')?.checked || false;

    // ─── Validation ───
    if (!fullName || fullName.length < 2) {
      return showError('Please enter your full name.');
    }

    if (!email || !isValidEmail(email)) {
      return showError('Please enter a valid email address.');
    }

    if (!phone || phone.length < 8) {
      return showError('Please enter a valid phone number.');
    }

    if (!password || password.length < 8) {
      return showError('Password must be at least 8 characters.');
    }

    if (password !== confirmPassword) {
      return showError('Passwords do not match.');
    }

    if (!agreeTerms) {
      return showError('Please agree to the Terms of Service and Privacy Policy.');
    }

    // ─── Disable button ───
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    const origHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      // ─── Build payload ───
      const payload = {
        email,
        password,
        full_name: fullName,
        phone: `${country}|${phone}`,
      };

      if (referral) {
        payload.referral_code = referral;
      }

      console.log('[Register] Sending:', payload);

      // ─── Register ───
      await API.register(payload);

      console.log('[Register] Account created, now logging in...');

      // ─── Auto-login ───
      const tokens = await API.login(email, password);

      // ─── Save tokens ───
      if (typeof Auth !== 'undefined' && Auth.setTokens) {
        Auth.setTokens(tokens.access_token, tokens.refresh_token);
      } else {
        localStorage.setItem(CONFIG.STORAGE.ACCESS_TOKEN, tokens.access_token);
        localStorage.setItem(CONFIG.STORAGE.REFRESH_TOKEN, tokens.refresh_token);
      }

      // ─── Fetch user ───
      try {
        const user = await API.me();
        if (typeof Auth !== 'undefined' && Auth.setUser) {
          Auth.setUser(user);
        }
      } catch (profileErr) {
        console.warn('[Register] Profile fetch failed:', profileErr);
      }

      // ─── Notify ───
      if (typeof Notify !== 'undefined') {
        Notify.success('Account created! Welcome to Aryana.');
      }

      // ─── Redirect ───
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);

    } catch (err) {
      console.error('[Register] Error:', err);

      let msg = err?.detail || 'Registration failed. Please try again.';

      if (msg.includes('referral') || msg.includes('کد دعوت')) {
        msg = 'Invalid referral code.';
      } else if (msg.includes('ایمیل') || msg.includes('email')) {
        msg = 'This email is already registered. Try logging in.';
      } else if (msg.includes('تلفن') || msg.includes('phone')) {
        msg = 'This phone number is already registered.';
      } else if (err?.status === 0) {
        msg = 'Cannot connect to server. Check your internet.';
      }

      showError(msg);

      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = origHTML;
    }
  });

  /* ═══════════════════════════════════════
     🛠️ HELPERS
     ═══════════════════════════════════════ */

  function showError(message) {
    if (errorBox && errorText) {
      errorText.textContent = message;
      errorBox.style.display = 'flex';
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (typeof Notify !== 'undefined') {
      Notify.error(message);
    } else {
      alert(message);
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});