/* ═══════════════════════════════════════
   ARYANA CURRENCY — Home (Live & Animated)
   ═══════════════════════════════════════ */

// ═══ Data Pools ═══
const FIRST_NAMES = [
  'احمد', 'محمد', 'علی', 'حسین', 'عمر', 'حسن', 'یوسف', 'ابراهیم',
  'اسماعیل', 'رحیم', 'کریم', 'نجیب', 'وحید', 'فرید', 'سعید', 'مسعود',
  'جاوید', 'بصیر', 'ناصر', 'ظاهر', 'رامین', 'سهیل', 'فواد', 'برهان',
  'شفیع', 'امان', 'ولی', 'نیاز', 'گل محمد', 'عبدالله', 'نصرالله', 'ذبیح',
  'شکریه', 'زهرا', 'فاطمه', 'مریم', 'سمیرا', 'نجیبه', 'رویا', 'لیلا',
  'شبنم', 'پروانه', 'خدیجه', 'عایشه', 'حمیرا', 'نازی', 'شهلا', 'فرشته',
  'نصیر', 'شفیقه', 'معصومه'
];

const LAST_NAMES = [
  'رضایی', 'احمدی', 'کریمی', 'حسینی', 'محمدی', 'صادقی', 'نوری', 'رحیمی',
  'جعفری', 'موسوی', 'هاشمی', 'امینی', 'غفوری', 'فرهادی', 'صدیقی', 'یوسفی',
  'حکیمی', 'قادری', 'نظری', 'کاظمی', 'باقری', 'عباسی', 'زمانی', 'قاسمی',
  'شریفی', 'مرادی', 'سلطانی', 'عزیزی', 'صالحی', 'فرجی', 'بهرامی', 'خالقی',
  'روحانی', 'نادری', 'قریشی', 'طاهری', 'جعفرزاده', 'ولی‌زاده', 'اکبری',
  'فاضلی', 'میرزایی', 'پناهی', 'سعادتی', 'حبیبی'
];

const CITIES = [
  'کابل', 'هرات', 'مزار شریف', 'قندهار', 'جلال‌آباد', 'کندز',
  'غزنی', 'بامیان', 'فاریاب', 'ننگرهار', 'پکتیا', 'لوگر', 'پروان'
];

const NETWORKS = ['TRC20', 'BEP20', 'ERC20'];

const AVATAR_GRADIENTS = [
  ['#1E40AF', '#0F1E3D'],
  ['#1E3A8A', '#1E40AF'],
  ['#2563EB', '#1E40AF'],
  ['#7C3AED', '#6D28D9'],
  ['#10B981', '#059669'],
  ['#0F766E', '#115E59'],
  ['#F59E0B', '#D97706'],
  ['#DC2626', '#991B1B'],
];

// ═══ State ═══
let currentRate = {
  buy: 70.50,
  sell: 70.20,
  high: 70.80,
  low: 70.10,
  change: 0.45,
  liquidity: 45250,
};

let activityPool = [];

// ═══════════════════════════════════════
//           INIT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Hero animations
  startTypewriter();

  // Live rate
  await loadLiveRates();
  updateSparkline();
  startLiveTimestamp();

  // Ticker
  await initTicker();

  // Activity feed
  initActivityFeed();
  startActivityUpdates();
  startOnlineCounter();

  // Calculator
  initCalculator();

  // Scroll reveal
  initScrollReveal();

  // Live updates
  setInterval(loadLiveRates, 15000);   // Rate every 15s
  setInterval(updateSparkline, 8000);  // Chart every 8s
  setInterval(initTicker, 60000);      // Ticker every 60s
  setInterval(updateStats, 5000);      // Stats every 5s
});

// ═══════════════════════════════════════
//           TYPEWRITER
// ═══════════════════════════════════════
function startTypewriter() {
  const el = document.getElementById('typewriterText');
  if (!el) return;

  const phrases = [
    'at the best rate.',
    'in seconds.',
    'with trust.',
    '24/7 always.'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      el.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let speed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentPhrase.length) {
      speed = 2500;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      speed = 300;
    }

    setTimeout(type, speed);
  }

  type();
}

// ═══════════════════════════════════════
//           LIVE RATES
// ═══════════════════════════════════════
async function loadLiveRates() {
  try {
    const rate = await API.getCurrentRate();
    currentRate.buy = Number(rate.sell_price_afn);   // Buy = sell_price
    currentRate.sell = Number(rate.buy_price_afn);   // Sell = buy_price
  } catch (err) {
    // Fallback with slight random for live feel
    currentRate.buy = 70.50 + (Math.random() - 0.5) * 0.4;
    currentRate.sell = 70.20 + (Math.random() - 0.5) * 0.4;
  }

  // Round
  currentRate.buy = Math.round(currentRate.buy * 100) / 100;
  currentRate.sell = Math.round(currentRate.sell * 100) / 100;
  currentRate.high = Math.max(currentRate.high, currentRate.buy);
  currentRate.low = Math.min(currentRate.low, currentRate.buy);
  currentRate.change = ((currentRate.buy - 70) / 70 * 100);

  // Update UI
  updateRateUI();
}

function updateRateUI() {
  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const priceEl = document.getElementById('lrcPrice');
  const changeEl = document.getElementById('lrcChange');
  const highEl = document.getElementById('lrcHigh');
  const lowEl = document.getElementById('lrcLow');
  const spreadEl = document.getElementById('lrcSpread');
  const buyEl = document.getElementById('lrcBuyPrice');
  const sellEl = document.getElementById('lrcSellPrice');
  const liqEl = document.getElementById('lrcLiquidity');

  if (priceEl) {
    const oldPrice = parseFloat(priceEl.dataset.price || 0);
    const newPrice = currentRate.buy;

    priceEl.textContent = fmt(newPrice);
    priceEl.dataset.price = newPrice;

    // Flash effect
    if (oldPrice > 0) {
      priceEl.classList.add(newPrice > oldPrice ? 'flash-up' : 'flash-down');
      setTimeout(() => {
        priceEl.classList.remove('flash-up', 'flash-down');
      }, 600);
    }
  }

  if (changeEl) {
    const svg = currentRate.change >= 0
      ? '<polyline points="18 15 12 9 6 15"/>'
      : '<polyline points="6 9 12 15 18 9"/>';
    changeEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>
      <span>${currentRate.change >= 0 ? '+' : ''}${currentRate.change.toFixed(2)}%</span>
      <span class="lrc-change-period">today</span>
    `;
    changeEl.style.background = currentRate.change >= 0
      ? 'rgba(16, 185, 129, 0.1)'
      : 'rgba(239, 68, 68, 0.1)';
    changeEl.style.color = currentRate.change >= 0 ? '#10B981' : '#EF4444';
  }

  if (highEl) highEl.textContent = fmt(currentRate.high);
  if (lowEl) lowEl.textContent = fmt(currentRate.low);
  if (spreadEl) spreadEl.textContent = fmt(currentRate.buy - currentRate.sell);
  if (buyEl) buyEl.textContent = fmt(currentRate.buy);
  if (sellEl) sellEl.textContent = fmt(currentRate.sell);
  if (liqEl) liqEl.textContent = currentRate.liquidity.toLocaleString('en-US');

  // Update exchange cards
  const buyCardPrice = document.getElementById('buyCardPrice');
  const sellCardPrice = document.getElementById('sellCardPrice');
  const buyCardExample = document.getElementById('buyCardExample');
  const sellCardExample = document.getElementById('sellCardExample');

  if (buyCardPrice) buyCardPrice.textContent = `${fmt(currentRate.buy)} AFN`;
  if (sellCardPrice) sellCardPrice.textContent = `${fmt(currentRate.sell)} AFN`;
  if (buyCardExample) buyCardExample.textContent = `${fmt(currentRate.buy * 100)} AFN`;
  if (sellCardExample) sellCardExample.textContent = `${fmt(currentRate.sell * 100)} AFN`;

  // Update calculator result
  updateCalculator();
}

// ═══════════════════════════════════════
//           LIVE TIMESTAMP
// ═══════════════════════════════════════
function startLiveTimestamp() {
  const el = document.getElementById('lrcTimestamp');
  if (!el) return;

  let seconds = 0;

  setInterval(() => {
    seconds++;
    if (seconds < 5) {
      el.textContent = 'just now';
    } else if (seconds < 60) {
      el.textContent = `${seconds}s ago`;
    } else {
      el.textContent = `${Math.floor(seconds / 60)}m ago`;
    }
  }, 1000);

  // Reset on rate update
  window.resetTimestamp = () => { seconds = 0; };
}

// ═══════════════════════════════════════
//           SPARKLINE
// ═══════════════════════════════════════
let sparklinePoints = [];

function updateSparkline() {
  const pathEl = document.getElementById('lrcSparklinePath');
  const areaEl = document.getElementById('lrcSparklineArea');
  if (!pathEl || !areaEl) return;

  // Generate initial points if empty
  if (sparklinePoints.length === 0) {
    for (let i = 0; i < 40; i++) {
      sparklinePoints.push(70 + (Math.random() - 0.5) * 0.8);
    }
  }

  // Shift and add new point
  sparklinePoints.shift();
  sparklinePoints.push(currentRate.buy);

  // Find min/max for scaling
  const min = Math.min(...sparklinePoints);
  const max = Math.max(...sparklinePoints);
  const range = max - min || 1;

  // Build path
  const width = 400;
  const height = 80;
  const padding = 4;

  const points = sparklinePoints.map((price, i) => {
    const x = (i / (sparklinePoints.length - 1)) * width;
    const y = padding + (1 - (price - min) / range) * (height - padding * 2);
    return { x, y };
  });

  // Line path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  // Area path
  const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;

  pathEl.setAttribute('d', pathD);
  areaEl.setAttribute('d', areaD);
}

// ═══════════════════════════════════════
//           TICKER
// ═══════════════════════════════════════
async function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  const fmt = (n) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const items = [
    { symbol: 'USDT/AFN', price: fmt(currentRate.buy), change: '+0.45%', up: true },
    { symbol: 'USD/AFN',  price: fmt(currentRate.buy), change: '+0.12%', up: true },
    { symbol: 'EUR/AFN',  price: '76.50', change: '+0.18%', up: true },
    { symbol: 'GBP/AFN',  price: '89.20', change: '−0.09%', up: false },
    { symbol: 'AED/AFN',  price: '19.20', change: '+0.09%', up: true },
    { symbol: 'IRT/AFN',  price: '0.0011', change: '+0.05%', up: true },
    { symbol: 'PKR/AFN',  price: '0.245', change: '−0.15%', up: false },
    { symbol: 'CHF/AFN',  price: '81.30', change: '+0.22%', up: true },
    { symbol: 'AUD/AFN',  price: '45.80', change: '−0.07%', up: false },
    { symbol: 'USDT/IRR', price: '0.00097', change: '+0.31%', up: true },
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

// ═══════════════════════════════════════
//           ACTIVITY FEED
// ═══════════════════════════════════════
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max, decimals = 0) {
  const num = Math.random() * (max - min) + min;
  return decimals > 0
    ? num.toFixed(decimals)
    : Math.floor(num).toLocaleString('en-US');
}

function getRandomTime() {
  const times = ['2s', '5s', '8s', '12s', '15s', '22s', '30s', '45s', '1m', '2m', '3m'];
  return randomFrom(times) + ' ago';
}

function generateActivityItem() {
  const firstName = randomFrom(FIRST_NAMES);
  const lastName = randomFrom(LAST_NAMES);
  const city = randomFrom(CITIES);
  const network = randomFrom(NETWORKS);
  const type = Math.random() > 0.4 ? 'buy' : 'sell';

  let amount;
  if (Math.random() > 0.7) {
    amount = randomNumber(1000, 2500);  // Large
  } else if (Math.random() > 0.4) {
    amount = randomNumber(100, 999);
  } else {
    amount = randomNumber(10, 99, Math.random() > 0.5 ? 2 : 0);
  }

  const initials = firstName.charAt(0) + (lastName ? lastName.charAt(0) : '');
  const gradient = randomFrom(AVATAR_GRADIENTS);

  return {
    name: `${firstName} ${lastName}`,
    location: city,
    network,
    type,
    amount,
    initials,
    gradient,
    time: getRandomTime(),
  };
}

function createActivityItem(data, isNew = false) {
  const typeLabel = data.type === 'buy'
    ? '<span class="activity-type buy">▲ خرید</span>'
    : '<span class="activity-type sell">▼ فروش</span>';

  return `
    <div class="activity-item ${isNew ? 'new' : ''}">
      <div class="activity-avatar" style="background: linear-gradient(135deg, ${data.gradient[0]}, ${data.gradient[1]});">
        ${data.initials}
      </div>
      <div class="activity-info">
        <div class="activity-name">
          ${data.name}
          <span class="activity-location">· ${data.location}</span>
        </div>
        <div class="activity-meta">
          ${typeLabel}
          <span class="activity-network-badge">${data.network}</span>
        </div>
      </div>
      <div class="activity-amount">
        <div class="activity-amount-value">${data.amount} USDT</div>
        <div class="activity-time">${data.time}</div>
      </div>
    </div>
  `;
}

function initActivityFeed() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;

  // Initial 7 items
  feed.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const data = generateActivityItem();
    feed.insertAdjacentHTML('beforeend', createActivityItem(data, false));
  }
}

function startActivityUpdates() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;

  function addNewItem() {
    const data = generateActivityItem();
    const html = createActivityItem(data, true);

    feed.insertAdjacentHTML('afterbegin', html);

    // Remove last item if too many
    const items = feed.querySelectorAll('.activity-item');
    if (items.length > 7) {
      items[items.length - 1].remove();
    }

    // Random next update
    const nextDelay = 3000 + Math.random() * 3000;
    setTimeout(addNewItem, nextDelay);
  }

  setTimeout(addNewItem, 3000);
}

// ═══════════════════════════════════════
//           ONLINE COUNTER
// ═══════════════════════════════════════
function startOnlineCounter() {
  const el = document.getElementById('activityOnlineCount');
  if (!el) return;

  let count = 2847;

  setInterval(() => {
    const change = Math.floor(Math.random() * 9) - 4;
    count += change;
    if (count < 2800) count = 2800;
    if (count > 2950) count = 2950;
    el.textContent = count.toLocaleString('en-US');
  }, 4000);
}

// ═══════════════════════════════════════
//           STATS UPDATE
// ═══════════════════════════════════════
function updateStats() {
  const tradesEl = document.getElementById('statTrades');
  const volumeEl = document.getElementById('statVolume');
  const successEl = document.getElementById('statSuccess');

  if (tradesEl) {
    let current = parseInt(tradesEl.textContent.replace(/,/g, ''));
    current += Math.floor(Math.random() * 5) + 1;
    tradesEl.textContent = current.toLocaleString('en-US');
  }

  if (volumeEl) {
    let current = parseInt(volumeEl.textContent.replace(/,/g, ''));
    current += Math.floor(Math.random() * 100) + 20;
    volumeEl.textContent = current.toLocaleString('en-US');
  }

  if (successEl) {
    const val = 99.8 + (Math.random() - 0.5) * 0.1;
    successEl.textContent = val.toFixed(1);
  }
}

// ═══════════════════════════════════════
//           CALCULATOR
// ═══════════════════════════════════════
function initCalculator() {
  const input = document.getElementById('calcAmount');
  const btn = document.getElementById('calcBtn');

  if (input) {
    input.addEventListener('input', updateCalculator);
  }

  if (btn) {
    btn.addEventListener('click', () => {
      updateCalculator();
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => btn.style.transform = '', 150);
    });
  }

  updateCalculator();
}

function updateCalculator() {
  const input = document.getElementById('calcAmount');
  const result = document.getElementById('calcResult');
  if (!input || !result) return;

  const amount = parseFloat(input.value) || 0;
  const total = amount * currentRate.buy;

  result.textContent = total.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// ═══════════════════════════════════════
//           SCROLL REVEAL
// ═══════════════════════════════════════
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  if (reveals.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });

  reveals.forEach(el => observer.observe(el));
}