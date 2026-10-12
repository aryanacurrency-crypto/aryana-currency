/* ═══════════════════════════════════════
   ARYANA CURRENCY — Login Page Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  Auth.redirectIfLoggedIn();

  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const emailInput = document.getElementById('email');

  // ─── فقط انگلیسی توی ایمیل ───
  preventNonEnglish(emailInput);

  // ─── Show/Hide Password ───
  attachPasswordToggle('password', 'passwordToggle');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    errorBox.style.display = 'none';
    errorBox.textContent = '';

    const email = form.email.value.trim();
    const password = form.password.value;

    // اعتبارسنجی
    if (!email || !password) {
      showError(I18N.t('loginErrorEmpty') || 'Please fill in all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showError(I18N.currentLang === 'en' ? 'Please enter a valid email address.'
            : I18N.currentLang === 'fa' ? 'لطفاً یک ایمیل معتبر وارد کنید.'
            : 'مهرباني وکړئ یو سم ایمیل ولیکئ.');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      const tokens = await API.login(email, password);
      Auth.setTokens(tokens.access_token, tokens.refresh_token);

      const user = await API.me();
      Auth.setUser(user);

      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Login error:', err);
      let msg = err.detail || 'Login failed. Please try again.';

      if (msg.includes('ایمیل یا پسورد')) {
        msg = I18N.currentLang === 'en' ? 'Invalid email or password.'
            : I18N.currentLang === 'fa' ? 'ایمیل یا پسورد اشتباه است.'
            : 'ناسم یا پټنوم غلط دی.';
      } else if (msg.includes('غیرفعال')) {
        msg = I18N.currentLang === 'en' ? 'Account is disabled.'
            : I18N.currentLang === 'fa' ? 'حساب کاربری غیرفعال است.'
            : 'حساب غیر فعال دی.';
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
});