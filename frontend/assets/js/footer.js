/* ═══════════════════════════════════════
   ARYANA CURRENCY — Footer Loader
   Loads contact info into all footers
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await loadFooterContact();
});

async function loadFooterContact() {
  // اگه جای مخصوص توی صفحه نیست، کاری نکن
  const container = document.getElementById('footerContact');
  if (!container) return;

  try {
    const info = await API.getContactInfo();

    // اگه هیچ اطلاعاتی نیست، کل بخش رو مخفی کن
    if (!info.email && !info.telegram_channel && !info.telegram_support && !info.address) {
      container.style.display = 'none';
      return;
    }

    let html = '<div class="footer-contact-title">Get in touch</div>';
    html += '<div class="footer-contact-list">';

    // ─── Email ───
    if (info.email) {
      html += `
        <a href="mailto:${info.email}" class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>${escapeHtml(info.email)}</span>
        </a>
      `;
    }

    // ─── Telegram Channel ───
    if (info.telegram_channel) {
      const channelName = extractTelegramName(info.telegram_channel);
      html += `
        <a href="${escapeHtml(info.telegram_channel)}" target="_blank" rel="noopener" class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span>${escapeHtml(channelName)}</span>
        </a>
      `;
    }

    // ─── Telegram Support ───
    if (info.telegram_support) {
      const username = info.telegram_support.startsWith('@')
        ? info.telegram_support
        : `@${info.telegram_support}`;
      html += `
        <a href="https://t.me/${username.replace('@', '')}" target="_blank" rel="noopener" class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>${escapeHtml(username)}</span>
        </a>
      `;
    }

    // ─── Address ───
    if (info.address) {
      html += `
        <div class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${escapeHtml(info.address)}</span>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

  } catch (err) {
    console.error('Failed to load footer contact:', err);
    container.style.display = 'none';
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function extractTelegramName(url) {
  if (!url) return '';
  const match = url.match(/t\.me\/([^\/\?]+)/);
  if (match) return `@${match[1]}`;
  return url;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}