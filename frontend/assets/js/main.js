/* ═══════════════════════════════════════
   ARYANA CURRENCY — Main (Home Page)
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = I18N.currentLang;
    langSelect.addEventListener('change', (e) => {
      I18N.setLanguage(e.target.value);
    });
  }

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = '☰';
      });
    });
  }

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  loadLiveRates();
  setInterval(loadLiveRates, 60000);
});

async function loadLiveRates() {
  try {
    const rate = await API.getCurrentRate();
    const sellEl = document.getElementById('liveSellPrice');
    const buyEl = document.getElementById('liveBuyPrice');
    const rateSellCard = document.getElementById('rateSellCard');
    const rateBuyCard = document.getElementById('rateBuyCard');
    const statusBadge = document.getElementById('rateStatusBadge');
    const updatedAt = document.getElementById('rateUpdatedAt');

    const fmt = (n) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (sellEl) sellEl.textContent = `${fmt(rate.sell_price_afn)} AFN`;
    if (buyEl) buyEl.textContent = `${fmt(rate.buy_price_afn)} AFN`;
    if (rateSellCard) rateSellCard.textContent = `${fmt(rate.sell_price_afn)} AFN`;
    if (rateBuyCard) rateBuyCard.textContent = `${fmt(rate.buy_price_afn)} AFN`;

    if (statusBadge) {
      statusBadge.textContent = I18N.currentLang === 'en' ? 'LIVE'
                              : I18N.currentLang === 'fa' ? 'زنده'
                              : 'ژوندی';
    }

    if (updatedAt) {
      const time = new Date(rate.created_at).toLocaleString();
      const prefix = I18N.currentLang === 'en' ? 'Last update:'
                    : I18N.currentLang === 'fa' ? 'آخرین به‌روزرسانی:'
                    : 'وروستی تازه کول:';
      updatedAt.textContent = `${prefix} ${time}`;
    }
  } catch (err) {
    console.error('Failed to load rates:', err);
    const statusBadge = document.getElementById('rateStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = '—';
      statusBadge.style.background = '#eee';
      statusBadge.style.color = '#999';
    }
  }
}