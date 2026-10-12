/* ═══════════════════════════════════════
   ARYANA CURRENCY — Home v2 Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // سال جاری
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ساخت ticker
  initTicker();

  // لود نرخ زنده
  await loadLiveRates();

  // هر ۶۰ ثانیه آپدیت
  setInterval(loadLiveRates, 60000);
});

/**
 * ساخت ticker خودکار (دو نسخه برای انیمیشن بی‌نهایت)
 */
function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  const items = [
    { symbol: 'USDT/AFN', price: '70.50', change: '+0.45%', up: true },
    { symbol: 'USD/AFN', price: '69.00', change: '+0.12%', up: true },
    { symbol: 'EUR/USD', price: '1.08', change: '−0.08%', up: false },
    { symbol: 'BTC/USDT', price: '67,234.50', change: '+1.20%', up: true },
    { symbol: 'ETH/USDT', price: '3,456.80', change: '−0.34%', up: false },
    { symbol: 'AED/AFN', price: '18.78', change: '+0.09%', up: true },
    { symbol: 'PKR/AFN', price: '0.245', change: '−0.15%', up: false },
  ];

  const buildItem = (item) => `
    <div class="ticker-item">
      <span class="symbol">${item.symbol}</span>
      <span class="price">${item.price}</span>
      <span class="change ${item.up ? 'up' : 'down'}">${item.up ? '▲' : '▼'} ${item.change}</span>
    </div>
  `;

  const groupHtml = items.map(buildItem).join('');

  // دو نسخه برای انیمیشن بی‌نهایت
  track.innerHTML = groupHtml + groupHtml;
}

/**
 * لود نرخ زنده از API
 */
async function loadLiveRates() {
  try {
    const rate = await API.getCurrentRate();

    const fmt = (n) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // کارت hero
    setText('liveSellPrice', `${fmt(rate.sell_price_afn)} AFN`);
    setText('liveBuyPrice', `${fmt(rate.buy_price_afn)} AFN`);

    // کارت‌های rates
    setText('rateSellCard', `${fmt(rate.sell_price_afn)} AFN`);
    setText('rateBuyCard', `${fmt(rate.buy_price_afn)} AFN`);

    // آپدیت ticker با نرخ واقعی
    const tickerItems = document.querySelectorAll('.ticker-item');
    tickerItems.forEach(item => {
      const symbolEl = item.querySelector('.symbol');
      if (symbolEl && symbolEl.textContent === 'USDT/AFN') {
        const priceEl = item.querySelector('.price');
        if (priceEl) priceEl.textContent = fmt(rate.sell_price_afn);
      }
    });

  } catch (err) {
    console.error('Failed to load rates:', err);

    const badge = document.querySelector('.live-badge');
    if (badge) {
      badge.textContent = '—';
      badge.style.background = 'rgba(132, 142, 156, 0.1)';
      badge.style.color = 'var(--text-tertiary)';
    }
  }
}

/**
 * Helper: تنظیم متن
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}