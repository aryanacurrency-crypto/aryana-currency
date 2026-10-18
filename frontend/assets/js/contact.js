/* ═══════════════════════════════════════
   ARYANA CURRENCY — Contact v5
   Dynamic from Admin Settings + Email Send
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');

  /* ═══════════════════════════════════════
     📥 LOAD CONTACT INFO
     ═══════════════════════════════════════ */

  async function loadContactInfo() {
    try {
      const info = await API.getContactInfo();

      console.log('[Contact] Loaded:', info);

      // ═══ Email ═══
      if (info.email) {
        const emailLink = document.getElementById('contactEmail');
        if (emailLink) {
          const span = emailLink.querySelector('span');
          if (span) span.textContent = info.email;
          emailLink.href = `mailto:${info.email}`;
        }
      }

      // ═══ Telegram Channel ═══
      if (info.telegram_channel) {
        const tgLink = document.getElementById('contactTelegram');
        if (tgLink) {
          tgLink.href = info.telegram_channel;
        }
      }

      // ═══ Telegram Support ═══
      if (info.telegram_support) {
        const tgSupportLink = document.getElementById('contactTelegramSupport');
        if (tgSupportLink) {
          const username = info.telegram_support.replace('@', '');
          tgSupportLink.href = `https://t.me/${username}`;
          const span = tgSupportLink.querySelector('span');
          if (span) span.textContent = info.telegram_support;
        }
      }

      // ═══ Address ═══
      if (info.address) {
        const addrEl = document.getElementById('contactAddress');
        if (addrEl) addrEl.textContent = info.address;
      }

    } catch (err) {
      console.warn('[Contact] Load failed:', err);
    }
  }

  /* ═══════════════════════════════════════
     📤 FORM SUBMIT — Send to Email
     ═══════════════════════════════════════ */

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const subject = document.getElementById('subject')?.value;
      const message = document.getElementById('message')?.value.trim();

      // ═══ Validation ═══
      if (!name || !email || !subject || !message) {
        if (typeof Notify !== 'undefined') {
          Notify.warning('Please fill all fields.');
        }
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (typeof Notify !== 'undefined') {
          Notify.warning('Please enter a valid email.');
        }
        return;
      }

      // ═══ Submit ═══
      submitBtn.disabled = true;
      const origHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner"></span>';

      try {
        const response = await API.request('/contact/send', {
          method: 'POST',
          body: JSON.stringify({ name, email, subject, message }),
          skipAuth: true,
        });

        console.log('[Contact] Message sent:', response);

        if (typeof Notify !== 'undefined') {
          Notify.success('Message sent! We will reply within a few hours.');
        }

        form.reset();

      } catch (err) {
        console.error('[Contact] Send failed:', err);

        let msg = err?.detail || 'Failed to send. Please try again.';

        if (err?.status === 0) {
          msg = 'Cannot connect to server. Check your internet.';
        }

        if (typeof Notify !== 'undefined') {
          Notify.error(msg);
        }

      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHTML;
      }
    });
  }

  /* ═══════════════════════════════════════
     🚀 INIT
     ═══════════════════════════════════════ */

  await loadContactInfo();
});