/* ═══════════════════════════════════════
   ARYANA CURRENCY — Contact v4
   Dynamic from Admin Settings · Real fields
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

      // ═══ Telegram Channel (کارت اول - Live Chat) ═══
      if (info.telegram_channel) {
        const tgLink = document.getElementById('contactTelegram');
        if (tgLink) {
          tgLink.href = info.telegram_channel;
          // اگه می‌خوای متن هم عوض بشه:
          // const span = tgLink.querySelector('span');
          // if (span) span.textContent = 'Join Channel';
        }
      }

      // ═══ Telegram Support (کارت دوم) ═══
      if (info.telegram_support) {
        const tgSupportLink = document.getElementById('contactTelegramSupport');
        if (tgSupportLink) {
          const username = info.telegram_support.replace('@', '');
          tgSupportLink.href = `https://t.me/${username}`;
          const span = tgSupportLink.querySelector('span');
          if (span) span.textContent = info.telegram_support;
        }
      }

      // ═══ Address (کارت چهارم - اگه داری) ═══
      if (info.address) {
        const addrEl = document.getElementById('contactAddress');
        if (addrEl) addrEl.textContent = info.address;
      }

      // ═══ Phone (اگه API داشت) ═══
      if (info.phone) {
        const phoneLink = document.getElementById('contactPhone');
        if (phoneLink) {
          const span = phoneLink.querySelector('span');
          if (span) span.textContent = info.phone;
          phoneLink.href = `tel:${info.phone.replace(/\s/g, '')}`;
          phoneLink.style.display = '';
        }
      } else {
        // اگه phone نبود، کارتش رو مخفی کن
        const phoneCard = document.getElementById('contactPhoneCard');
        if (phoneCard) phoneCard.style.display = 'none';
      }

      // ═══ WhatsApp (اگه API داشت) ═══
      if (info.whatsapp) {
        const waLink = document.getElementById('contactWhatsapp');
        if (waLink) {
          const url = info.whatsapp.startsWith('http')
            ? info.whatsapp
            : `https://wa.me/${info.whatsapp.replace(/\D/g, '')}`;
          waLink.href = url;
        }
      }

    } catch (err) {
      console.warn('[Contact] Load failed:', err);
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
        // ─── API Send (اگه endpoint داری) ───
        // await API.request('/contact/send', {
        //   method: 'POST',
        //   body: JSON.stringify({ name, email, subject, message }),
        //   skipAuth: true,
        // });

        await new Promise((r) => setTimeout(r, 1000));

        if (typeof Notify !== 'undefined') {
          Notify.success('Message sent! We will reply within a few hours.');
        }

        form.reset();

      } catch (err) {
        console.error('[Contact] Send failed:', err);
        if (typeof Notify !== 'undefined') {
          Notify.error('Failed to send. Please try again.');
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