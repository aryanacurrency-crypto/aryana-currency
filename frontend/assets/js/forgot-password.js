/* ═══════════════════════════════════════
   ARYANA CURRENCY — Forgot Password Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const form = document.getElementById('forgotForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const successState = document.getElementById('successState');
  const sentEmail = document.getElementById('sentEmail');
  const resendLink = document.getElementById('resendLink');
  const emailInput = document.getElementById('email');

  // ─── فقط انگلیسی توی ایمیل ───
  preventNonEnglish(emailInput);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    errorBox.style.display = 'none';

    const email = form.email.value.trim();

    if (!email) {
      showError('لطفاً ایمیل خود را وارد کنید.');
      return;
    }

    if (!isValidEmail(email)) {
      showError('لطفاً یک ایمیل معتبر وارد کنید.');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.forgotPassword(email);

      sentEmail.textContent = email;
      form.style.display = 'none';
      successState.style.display = 'block';

    } catch (err) {
      console.error('Forgot password error:', err);
      let msg = err.detail || 'خطا در ارسال لینک بازنشانی.';

      if (err.status === 0) {
        msg = 'اتصال به سرور برقرار نشد.';
      }

      showError(msg);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // دکمه "try again"
  if (resendLink) {
    resendLink.addEventListener('click', (e) => {
      e.preventDefault();
      successState.style.display = 'none';
      form.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send reset link</span>';
      form.email.value = '';
      form.email.focus();
    });
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});