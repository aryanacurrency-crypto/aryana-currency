/* ═══════════════════════════════════════
   ARYANA CURRENCY — Contact Page Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await loadContactInfo();
});

async function loadContactInfo() {
  try {
    const info = await API.getContactInfo();

    // ─── Email ───
    const emailEl = document.getElementById('contactEmailValue');
    const emailLink = document.getElementById('contactEmailLink');
    if (info.email) {
      emailEl.textContent = info.email;
      emailLink.href = `mailto:${info.email}`;
    } else {
      emailEl.textContent = 'Coming soon';
      emailLink.style.pointerEvents = 'none';
      emailLink.style.opacity = '0.5';
    }

    // ─── Telegram Channel ───
    const channelEl = document.getElementById('contactTelegramChannelValue');
    const channelLink = document.getElementById('contactTelegramChannelLink');
    if (info.telegram_channel) {
      const channelName = extractTelegramName(info.telegram_channel);
      channelEl.textContent = channelName;
      channelLink.href = info.telegram_channel;
    } else {
      channelEl.textContent = 'Coming soon';
      channelLink.style.pointerEvents = 'none';
      channelLink.style.opacity = '0.5';
    }

    // ─── Telegram Support ───
    const supportEl = document.getElementById('contactTelegramSupportValue');
    const supportLink = document.getElementById('contactTelegramSupportLink');
    if (info.telegram_support) {
      const username = info.telegram_support.startsWith('@')
        ? info.telegram_support
        : `@${info.telegram_support}`;
      supportEl.textContent = username;
      supportLink.href = `https://t.me/${username.replace('@', '')}`;
    } else {
      supportEl.textContent = 'Coming soon';
      supportLink.style.pointerEvents = 'none';
      supportLink.style.opacity = '0.5';
    }

    // ─── Address ───
    const addressEl = document.getElementById('contactAddressValue');
    if (info.address) {
      addressEl.textContent = info.address;
    } else {
      addressEl.textContent = 'Coming soon';
    }

  } catch (err) {
    console.error('Failed to load contact info:', err);
  }
}

function extractTelegramName(url) {
  if (!url) return '';
  const match = url.match(/t\.me\/([^\/\?]+)/);
  if (match) return `@${match[1]}`;
  return url;
}