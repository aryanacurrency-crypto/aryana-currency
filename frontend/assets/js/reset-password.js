/* ═══════════════════════════════════════
   ARYANA CURRENCY — Reset Password Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── گرفتن توکن از URL ───
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const form = document.getElementById('resetForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const successBox = document.getElementById('successBox');

  // ─── اگه توکن نبود، خطا ───
  if (!token) {
    showError('لینک بازنشانی نامعتبر است. لطفاً دوباره درخواست دهید.');
    form.style.display = 'none';
    return;
  }

  // ─── Show/Hide Password ───
  attachPasswordToggle('password', 'passwordToggle');
  attachPasswordToggle('passwordConfirm', 'passwordConfirmToggle');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    errorBox.style.display = 'none';
    successBox.style.display = 'none';

    const password = form.password.value;
    const passwordConfirm = form.passwordConfirm.value;

    if (!password || !passwordConfirm) {
      showError('لطفاً هر دو فیلد را پر کنید.');
      return;
    }

    if (password.length < 8) {
      showError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
      return;
    }

    if (password !== passwordConfirm) {
      showError('رمزهای عبور یکسان نیستند.');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.resetPassword(token, password);

      showSuccess('رمز عبور با موفقیت تغییر کرد! در حال انتقال به صفحه ورود...');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);

    } catch (err) {
      console.error('Reset password error:', err);
      let msg = err.detail || 'خطا در بازنشانی رمز عبور.';

      if (msg.includes('نامعتبر')) {
        msg = 'لینک بازنشانی نامعتبر است.';
      } else if (msg.includes('منقضی')) {
        msg = 'لینک بازنشانی منقضی شده است. لطفاً دوباره درخواست دهید.';
      } else if (msg.includes('استفاده شده')) {
        msg = 'این لینک قبلاً استفاده شده است.';
      } else if (err.status === 0) {
        msg = 'اتصال به سرور برقرار نشد.';
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