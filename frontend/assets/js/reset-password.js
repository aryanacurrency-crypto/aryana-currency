/* ═══════════════════════════════════════
   ARYANA CURRENCY — Reset Password v4
   Single-Column · Mobile-First
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();

  // ─── Token from URL ───
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const form = document.getElementById('resetForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const successBox = document.getElementById('successBox');
  const successText = document.getElementById('successText');

  if (!form) {
    console.error('[Reset] Form #resetForm not found');
    return;
  }

  /* ═══════════════════════════════════════
     🛑 NO TOKEN → SHOW ERROR
     ═══════════════════════════════════════ */

  if (!token) {
    showError('Invalid reset link. Please request a new one.');
    form.style.display = 'none';
    return;
  }

  /* ═══════════════════════════════════════
     🔍 PASSWORD TOGGLES
     ═══════════════════════════════════════ */

  setupPasswordToggle('togglePassword', 'password');
  setupPasswordToggle('togglePasswordConfirm', 'passwordConfirm');

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
     📤 FORM SUBMIT
     ═══════════════════════════════════════ */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorBox) errorBox.style.display = 'none';
    if (successBox) successBox.style.display = 'none';

    const password = document.getElementById('password')?.value || '';
    const passwordConfirm = document.getElementById('passwordConfirm')?.value || '';

    // ─── Validation ───
    if (!password || !passwordConfirm) {
      return showError('Please fill in both password fields.');
    }

    if (password.length < 8) {
      return showError('Password must be at least 8 characters.');
    }

    if (password !== passwordConfirm) {
      return showError('Passwords do not match.');
    }

    // ─── Disable button ───
    submitBtn.disabled = true;
    const origHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      // ─── API Call ───
      await API.resetPassword(token, password);

      // ─── Success ───
      showSuccess('Password changed successfully! Redirecting to login...');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);

    } catch (err) {
      console.error('[Reset] Error:', err);

      let msg = err?.detail || 'Failed to reset password.';

      if (msg.includes('نامعتبر')) {
        msg = 'Invalid reset link. Please request a new one.';
      } else if (msg.includes('منقضی')) {
        msg = 'Reset link expired. Please request a new one.';
      } else if (msg.includes('استفاده شده')) {
        msg = 'This link has already been used.';
      } else if (err?.status === 0) {
        msg = 'Cannot connect to server. Check your internet.';
      }

      showError(msg);

      submitBtn.disabled = false;
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

  function showSuccess(message) {
    if (successBox && successText) {
      successText.textContent = message;
      successBox.style.display = 'flex';
      successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (typeof Notify !== 'undefined') {
      Notify.success(message);
    }
  }
});