/* ═══════════════════════════════════════
   ARYANA CURRENCY — Home Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  await initTicker();
  await loadLiveRates();

  // Smooth scroll for hash links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('href');
      if (target === '#') return;
      const el = document.querySelector(target);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Live update every 60s
  setInterval(() => {
    initTicker();
    loadLiveRates();
  }, 60000);
});

/**
 * Ticker — live market prices
 */
async function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  const defaultPrices = {
    USDT: '70.50',
    EUR: '76.50',
    GBP: '89.20',
    AED: '19.20',
    IRT: '0.0011',
    PKR: '0.245',
    CHF: '81.30',
    AUD: '45.80',
  };

  let usdtPrice = defaultPrices.USDT;

  try {
    const rate = await API.getCurrentRate();
    usdtPrice = Number(rate.sell_price_afn).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (err) {
    console.error('Ticker rate load failed:', err);
  }

  const items = [
    { symbol: 'USDT/AFN', price: usdtPrice,          change: '+0.45%', up: true },
    { symbol: 'USD/AFN',  price: usdtPrice,          change: '+0.12%', up: true },
    { symbol: 'EUR/AFN',  price: defaultPrices.EUR,  change: '+0.18%', up: true },
    { symbol: 'GBP/AFN',  price: defaultPrices.GBP,  change: '−0.09%', up: false },
    { symbol: 'AED/AFN',  price: defaultPrices.AED,  change: '+0.09%', up: true },
    { symbol: 'IRT/AFN',  price: defaultPrices.IRT,  change: '+0.05%', up: true },
    { symbol: 'PKR/AFN',  price: defaultPrices.PKR,  change: '−0.15%', up: false },
    { symbol: 'CHF/AFN',  price: defaultPrices.CHF,  change: '+0.22%', up: true },
    { symbol: 'AUD/AFN',  price: defaultPrices.AUD,  change: '−0.07%', up: false },
  ];

  const buildItem = (item) => `
    <div class="ticker-item">
      <span class="symbol">${item.symbol}</span>
      <span class="price">${item.price}</span>
      <span class="change ${item.up ? 'up' : 'down'}">${item.up ? '▲' : '▼'} ${item.change}</span>
    </div>
  `;

  const groupHtml = items.map(buildItem).join('');
  track.innerHTML = groupHtml + groupHtml;
}

/**
 * Load live rates
 */
async function loadLiveRates() {
  try {
    const rate = await API.getCurrentRate();

    const fmt = (n) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setText('liveSellPrice', `${fmt(rate.sell_price_afn)} AFN`);
    setText('liveBuyPrice', `${fmt(rate.buy_price_afn)} AFN`);
    setText('rateSellCard', `${fmt(rate.sell_price_afn)} AFN`);
    setText('rateBuyCard', `${fmt(rate.buy_price_afn)} AFN`);

    const tickerItems = document.querySelectorAll('.ticker-item');
    tickerItems.forEach(item => {
      const symbolEl = item.querySelector('.symbol');
      if (symbolEl) {
        const symbol = symbolEl.textContent;
        const priceEl = item.querySelector('.price');
        if (priceEl && (symbol === 'USDT/AFN' || symbol === 'USD/AFN')) {
          priceEl.textContent = fmt(rate.sell_price_afn);
        }
      }
    });

  } catch (err) {
    console.error('Failed to load rates:', err);

    const badge = document.querySelector('.live-badge');
    if (badge) {
      badge.textContent = '—';
      badge.style.background = 'rgba(148, 163, 184, 0.15)';
      badge.style.color = '#94A3B8';
    }
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}