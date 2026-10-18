/* ═══════════════════════════════════════
   ARYANA CURRENCY — Login v4
   Single-Column · Mobile-First · ARYANA OS
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();

  // ─── Redirect if already logged in ───
  if (typeof Auth !== 'undefined' && Auth.redirectIfLoggedIn) {
    Auth.redirectIfLoggedIn();
  }

  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('togglePassword');
  const rememberCheckbox = document.getElementById('remember');

  /* ═══════════════════════════════════════
     🔍 PASSWORD TOGGLE
     ═══════════════════════════════════════ */

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      passwordToggle.innerHTML = isPassword
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
     📧 REMEMBER: Prefill
     ═══════════════════════════════════════ */

  const rememberedEmail = localStorage.getItem('aryana_remember_email');
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  /* ═══════════════════════════════════════
     📤 FORM SUBMIT
     ═══════════════════════════════════════ */

  if (!form) {
    console.error('[Login] Form #loginForm not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ─── Hide previous error ───
    if (errorBox) errorBox.style.display = 'none';

    const email = (emailInput?.value || '').trim();
    const password = passwordInput?.value || '';
    const remember = rememberCheckbox?.checked || false;

    // ─── Validation ───
    if (!email || !password) {
      return showError('Please enter your email and password.');
    }

    if (!isValidEmail(email)) {
      return showError('Please enter a valid email address.');
    }

    // ─── Disable button ───
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    const origHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      // ─── API Login ───
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
        console.warn('[Login] Profile fetch failed:', profileErr);
      }

      // ─── Remember email ───
      if (remember) {
        localStorage.setItem('aryana_remember_email', email);
      } else {
        localStorage.removeItem('aryana_remember_email');
      }

      // ─── Notify ───
      if (typeof Notify !== 'undefined') {
        Notify.success('Welcome back! Redirecting...');
      }

      // ─── Redirect ───
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);

    } catch (err) {
      console.error('[Login] Error:', err);

      let msg = err?.detail || 'Login failed. Please try again.';

      if (msg.includes('اشتباه') || msg.includes('incorrect') || msg.includes('Invalid') || msg.includes('invalid')) {
        msg = 'Email or password is incorrect.';
      } else if (msg.includes('غیرفعال') || msg.includes('disabled')) {
        msg = 'Your account is disabled. Contact support.';
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