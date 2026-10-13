/* ═══════════════════════════════════════
   ARYANA CURRENCY — Dynamic Footer
   ═══════════════════════════════════════ */

window.addEventListener('load', function() {
  setTimeout(function() {
    injectFooter();
  }, 500);
});

function injectFooter() {
  if (document.querySelector('.home-footer')) return;
  if (window.location.pathname.includes('/admin/')) return;

  const isInPages = window.location.pathname.includes('/pages/');
  const prefix = isInPages ? '../' : '';

  const footerHTML = `
    <footer class="home-footer" id="dynamicFooter">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="${prefix}index.html" class="app-brand">
              <img src="${prefix}assets/images/logo.png" alt="ARYANA CURRENCY">
              <div class="app-brand-text">
                ARYANA
                <small>CURRENCY</small>
              </div>
            </a>
            <p class="footer-desc">
              A licensed digital currency exchange focused on clarity, security, and a straightforward customer experience.
            </p>
            <div id="footerContact"></div>
          </div>

          <div class="footer-col">
            <h4>Platform</h4>
            <a href="${prefix}index.html#rates">Exchange Rates</a>
            <a href="${prefix}index.html#how">How It Works</a>
            <a href="${prefix}pages/register.html">Register</a>
            <a href="${prefix}pages/login.html">Login</a>
          </div>

          <div class="footer-col">
            <h4>Company</h4>
            <a href="${prefix}pages/about.html">About Us</a>
            <a href="${prefix}pages/contact.html">Contact</a>
          </div>

          <div class="footer-col">
            <h4>Information</h4>
            <a href="${prefix}pages/privacy.html">Privacy Policy</a>
            <a href="${prefix}pages/terms.html">Terms of Service</a>
            <a href="${prefix}pages/risk.html">Risk Disclosure</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© <span id="footerYear"></span> <strong>ARYANA CURRENCY</strong>. All rights reserved.</span>
          <span>Clarity in every exchange.</span>
        </div>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML('beforeend', footerHTML);

  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  loadContact();
}

async function loadContact() {
  const container = document.getElementById('footerContact');
  if (!container) return;

  // آدرس API رو از CONFIG بخون یا مستقیم بذار
  let apiBase = 'https://aryana-backend.onrender.com/api/v1';

  if (typeof window.CONFIG !== 'undefined' && window.CONFIG.API_BASE) {
    apiBase = window.CONFIG.API_BASE;
  }

  try {
    const res = await fetch(apiBase + '/public/contact-info');
    const info = await res.json();

    if (!info.email && !info.telegram_channel && !info.telegram_support && !info.address) {
      container.style.display = 'none';
      return;
    }

    let html = '<div class="footer-contact-title">Get in touch</div>';
    html += '<div class="footer-contact-list">';

    if (info.email) {
      html += `
        <a href="mailto:${info.email}" class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>${info.email}</span>
        </a>
      `;
    }

    if (info.telegram_channel) {
      const name = info.telegram_channel.replace(/.*t\.me\//, '@');
      html += `
        <a href="${info.telegram_channel}" target="_blank" class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span>${name}</span>
        </a>
      `;
    }

    if (info.telegram_support) {
      const username = info.telegram_support.startsWith('@') ? info.telegram_support : '@' + info.telegram_support;
      html += `
        <a href="https://t.me/${username.replace('@','')}" target="_blank" class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>${username}</span>
        </a>
      `;
    }

    if (info.address) {
      html += `
        <div class="footer-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${info.address}</span>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

  } catch (err) {
    console.error('Contact load failed:', err);
    container.style.display = 'none';
  }
}