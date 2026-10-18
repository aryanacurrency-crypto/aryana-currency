/* ═══════════════════════════════════════
   ARYANA CURRENCY — Contact v3
   Dynamic from Admin Settings
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');

  /* ═══════════════════════════════════════
     📥 LOAD CONTACT INFO FROM API
     ═══════════════════════════════════════ */

  async function loadContactInfo() {
    try {
      const info = await API.getContactInfo();

      console.log('[Contact] Loaded from API:', info);

      // ═══ Email ═══
      if (info.email) {
        const emailLink = document.getElementById('contactEmail');
        if (emailLink) {
          const span = emailLink.querySelector('span');
          if (span) span.textContent = info.email;
          emailLink.href = `mailto:${info.email}`;
        }
      }

      // ═══ Phone ═══
      if (info.phone) {
        const phoneLink = document.getElementById('contactPhone');
        if (phoneLink) {
          const span = phoneLink.querySelector('span');
          if (span) span.textContent = info.phone;
          phoneLink.href = `tel:${info.phone.replace(/\s/g, '')}`;
        }
      }

      // ═══ Telegram ═══
      if (info.telegram) {
        const tgLink = document.getElementById('contactTelegram');
        if (tgLink) {
          const url = info.telegram.startsWith('http')
            ? info.telegram
            : `https://t.me/${info.telegram.replace('@', '')}`;
          tgLink.href = url;
        }
      }

      // ═══ WhatsApp ═══
      if (info.whatsapp) {
        const waLink = document.getElementById('contactWhatsapp');
        if (waLink) {
          const url = info.whatsapp.startsWith('http')
            ? info.whatsapp
            : `https://wa.me/${info.whatsapp.replace(/\D/g, '')}`;
          waLink.href = url;
        }
      }

      // ═══ Address ═══
      if (info.address) {
        const addrEl = document.getElementById('contactAddress');
        if (addrEl) addrEl.textContent = info.address;
      }

      // ═══ Working Hours ═══
      if (info.working_hours) {
        const hoursEl = document.getElementById('contactHours');
        if (hoursEl) hoursEl.textContent = info.working_hours;
      }

      // ═══ Social Links ═══
      if (info.facebook) {
        const fbLink = document.getElementById('contactFacebook');
        if (fbLink) fbLink.href = info.facebook;
      }

      if (info.instagram) {
        const igLink = document.getElementById('contactInstagram');
        if (igLink) igLink.href = info.instagram;
      }

      if (info.twitter) {
        const twLink = document.getElementById('contactTwitter');
        if (twLink) twLink.href = info.twitter;
      }

    } catch (err) {
      console.warn('[Contact] Failed to load info from API:', err);
      // fallback به مقادیر پیش‌فرض HTML
    }
  }

  /* ═══════════════════════════════════════
     📤 FORM SUBMIT
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
        // ─── API: Send message ───
        // اگه endpoint داری:
        // await API.request('/contact/send', {
        //   method: 'POST',
        //   body: JSON.stringify({ name, email, subject, message }),
        //   skipAuth: true,
        // });

        // ─── فعلاً شبیه‌سازی ───
        await new Promise((resolve) => setTimeout(resolve, 1000));

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