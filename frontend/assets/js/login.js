/* ═══════════════════════════════════════
   ARYANA CURRENCY — Login Page Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Redirect if already logged in
  if (typeof Auth !== 'undefined' && Auth.redirectIfLoggedIn) {
    Auth.redirectIfLoggedIn();
  }

  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');

  // ─── Show/Hide Password ───
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      passwordToggle.style.color = isPassword ? 'var(--gold)' : '';
    });
  }

  // ─── فقط انگلیسی توی ایمیل ───
  if (typeof preventNonEnglish === 'function') {
    preventNonEnglish(emailInput);
  }

  // ─── Submit ───
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorBox) errorBox.classList.remove('show');

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      return showError('Please enter your email and password.');
    }

    if (!isValidEmail(email)) {
      return showError('Please enter a valid email address.');
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
      const tokens = await API.login(email, password);
      Auth.setTokens(tokens.access_token, tokens.refresh_token);

      const user = await API.me();
      Auth.setUser(user);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 400);

    } catch (err) {
      console.error('Login error:', err);
      let msg = err.detail || 'Login failed. Please try again.';

      if (msg.includes('اشتباه') || msg.includes('incorrect') || msg.includes('Invalid')) {
        msg = 'Email or password is incorrect.';
      } else if (msg.includes('غیرفعال') || msg.includes('disabled')) {
        msg = 'Your account is disabled. Contact support.';
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