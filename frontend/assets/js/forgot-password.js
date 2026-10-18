/* ═══════════════════════════════════════
   ARYANA CURRENCY — Forgot Password v4
   Single-Column · Mobile-First
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();

  const form = document.getElementById('forgotForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const successState = document.getElementById('successState');
  const sentEmail = document.getElementById('sentEmail');
  const resendLink = document.getElementById('resendLink');
  const emailInput = document.getElementById('email');

  if (!form) {
    console.error('[Forgot] Form #forgotForm not found');
    return;
  }

  /* ═══════════════════════════════════════
     📤 FORM SUBMIT
     ═══════════════════════════════════════ */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorBox) errorBox.style.display = 'none';

    const email = (emailInput?.value || '').trim();

    // ─── Validation ───
    if (!email) {
      return showError('Please enter your email address.');
    }

    if (!isValidEmail(email)) {
      return showError('Please enter a valid email address.');
    }

    // ─── Disable button ───
    submitBtn.disabled = true;
    const origHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      // ─── API Call ───
      await API.forgotPassword(email);

      // ─── Show success state ───
      if (sentEmail) sentEmail.textContent = email;
      if (form) form.style.display = 'none';
      if (successState) successState.style.display = 'block';

    } catch (err) {
      console.error('[Forgot] Error:', err);

      let msg = err?.detail || 'Failed to send reset link.';

      if (err?.status === 0) {
        msg = 'Cannot connect to server. Check your internet.';
      }

      showError(msg);

      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
    }
  });

  /* ═══════════════════════════════════════
     🔄 RESEND
     ═══════════════════════════════════════ */

  if (resendLink) {
    resendLink.addEventListener('click', (e) => {
      e.preventDefault();

      if (successState) successState.style.display = 'none';
      if (form) form.style.display = 'flex';
      if (emailInput) {
        emailInput.value = '';
        emailInput.focus();
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Send Reset Link</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      `;
    });
  }

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