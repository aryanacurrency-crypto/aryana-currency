/* ═══════════════════════════════════════
   ARYANA CURRENCY — Dashboard v3 Logic
   ARYANA OS · Live · Bento · Command Palette
   ═══════════════════════════════════════ */

let currentRate = null;
let previousRate = null;
let currentWallets = null;
let hideBalance = false;
let rateHistory = [];
let pollingInterval = null;
let clockInterval = null;

const POLL_INTERVAL = 5000;   // 5s — rate
const CLOCK_INTERVAL = 1000;  // 1s — clock

/* ═══════════════════════════════════════
   🚀 INIT
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // ─── Greeting + Clock ───
  renderGreeting();
  renderClock();
  clockInterval = setInterval(renderClock, CLOCK_INTERVAL);

  // ─── User info (fast) ───
  renderUserInfo();
  showAdminButton();

  // ─── Logout ───
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // ─── Theme toggle ───
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => Theme.toggle());

  // ─── Balance toggle ───
  const toggleBtn = document.getElementById('toggleBalance');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleBalanceVisibility);

  // ─── Copy referral ───
  const copyBtn = document.getElementById('copyReferralBtn');
  if (copyBtn) copyBtn.addEventListener('click', copyReferralCode);

  // ─── Notifications (placeholder) ───
  const notifBtn = document.getElementById('notificationsBtn');
  if (notifBtn) notifBtn.addEventListener('click', () => {
    Notify.info('No new notifications');
  });

  // ─── Load profile + rate first ───
  await Promise.all([
    loadProfile(),
    loadRate(),
  ]);

  // ─── Then wallets, orders, stats ───
  await Promise.all([
    loadWallets(),
    loadRecentOrders(),
    loadStats(),
    loadReferral(),
    loadWheelTickets(),
    loadVipStatus(),
  ]);

  // ─── Generate insights after data ───
  generateInsights();

  // ─── Start live polling ───
  startLivePolling();
});

/* ═══════════════════════════════════════
   👋 GREETING & CLOCK
   ═══════════════════════════════════════ */

function renderGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  let greetingFa = 'شب بخیر';
  let greetingPs = 'ښه ماښام';

  if (hour < 12) {
    greeting = 'Good morning';
    greetingFa = 'صبح بخیر';
    greetingPs = 'سهار پخیر';
  } else if (hour < 18) {
    greeting = 'Good afternoon';
    greetingFa = 'ظهر بخیر';
    greetingPs = 'غرمه پخیر';
  }

  const lang = I18N.currentLang || 'en';
  const text = lang === 'fa' ? greetingFa : lang === 'ps' ? greetingPs : greeting;

  const el = document.getElementById('greetingText');
  if (el) el.textContent = text;
}

function renderClock() {
  const now = new Date();
  const lang = I18N.currentLang || 'en';

  const localeMap = { en: 'en-US', fa: 'fa-IR', ps: 'ps-AF' };
  const locale = localeMap[lang] || 'en-US';

  const dateOpts = { weekday: 'long', month: 'short', day: 'numeric' };
  const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: false };

  const dateStr = now.toLocaleDateString(locale, dateOpts);
  const timeStr = now.toLocaleTimeString(locale, timeOpts);

  setText('pageDate', dateStr);
  setText('pageTime', timeStr);
}

/* ═══════════════════════════════════════
   👤 USER
   ═══════════════════════════════════════ */

function renderUserInfo() {
  const user = Auth.getUser();
  if (!user) return;

  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
  const firstName = (user.full_name || 'User').split(' ')[0];

  setText('userAvatar', initial);
  setText('userName', firstName);
  setText('welcomeName', firstName);

  const refCode = user.referral_code || user.username || `ARY${String(user.id || 0).padStart(3, '0')}`;
  setText('referralCode', refCode.toUpperCase());

  if (user.created_at) {
    const d = new Date(user.created_at);
    const month = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    setText('statMemberSince', month);
  } else {
    setText('statMemberSince', '—');
  }
}

function showAdminButton() {
  const user = Auth.getUser();
  const btn = document.getElementById('adminPanelBtn');
  if (!btn) return;

  if (user && user.role === 'ADMIN') {
    btn.style.display = 'grid';
  }
}

async function loadProfile() {
  try {
    const user = await API.me();
    Auth.setUser(user);

    const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
    const firstName = (user.full_name || 'User').split(' ')[0];

    setText('userAvatar', initial);
    setText('userName', firstName);
    setText('welcomeName', firstName);

    const refCode = user.referral_code || user.username || `ARY${String(user.id || 0).padStart(3, '0')}`;
    setText('referralCode', refCode.toUpperCase());

    if (user.created_at) {
      const d = new Date(user.created_at);
      const month = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      setText('statMemberSince', month);
    }

    showAdminButton();
  } catch (err) {
    console.error('Profile load failed:', err);
  }
}

/* ═══════════════════════════════════════
   💱 RATE + LIVE POLLING
   ═══════════════════════════════════════ */

async function loadRate() {
  try {
    const rate = await API.getCurrentRate();

    if (rate) {
      previousRate = currentRate;
      currentRate = rate;

      updateRateUI(rate);

      const price = Number(rate.sell_price_afn);
      rateHistory.push(price);
      if (rateHistory.length > 20) rateHistory.shift();

      drawSparkline();
      updateMarketPrices(rate);
    }
  } catch (err) {
    console.error('Rate load failed:', err);
  }
}

function updateRateUI(rate) {
  const sellPrice = Number(rate.sell_price_afn);
  const buyPrice = Number(rate.buy_price_afn);

  const el = document.getElementById('statUsdtPrice');
  if (el) {
    el.textContent = formatNumber(sellPrice, 2) + ' AFN';

    if (previousRate && previousRate.sell_price_afn) {
      const prev = Number(previousRate.sell_price_afn);
      if (sellPrice > prev) {
        el.classList.remove('flash-down');
        el.classList.add('flash-up');
      } else if (sellPrice < prev) {
        el.classList.remove('flash-up');
        el.classList.add('flash-down');
      }
      setTimeout(() => {
        el.classList.remove('flash-up', 'flash-down');
      }, 900);
    }
  }

  const trendEl = document.getElementById('rateTrend');
  if (trendEl && previousRate) {
    const prev = Number(previousRate.sell_price_afn);
    const diff = sellPrice - prev;
    const pct = prev > 0 ? (diff / prev) * 100 : 0;

    const isUp = diff >= 0;
    trendEl.classList.toggle('up', isUp);
    trendEl.classList.toggle('down', !isUp);

    const pctSpan = trendEl.querySelector('span');
    if (pctSpan) {
      pctSpan.textContent = (isUp ? '+' : '') + pct.toFixed(2) + '%';
    }

    const svg = trendEl.querySelector('svg polyline');
    if (svg) {
      svg.setAttribute('points', isUp ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
    }
  }
}

function updateMarketPrices(rate) {
  const sellPrice = Number(rate.sell_price_afn);
  const buyPrice = Number(rate.buy_price_afn);

  setText('marketUsdtPrice', formatNumber(sellPrice, 2) + ' AFN');
  setText('marketUsdPrice', formatNumber(sellPrice, 2) + ' AFN');
  setText('marketAfnPrice', formatNumber(1 / sellPrice, 6) + ' USDT');
}

function startLivePolling() {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    if (document.hidden) return;
    await loadRate();
  }, POLL_INTERVAL);
}

/* ═══════════════════════════════════════
   📈 SPARKLINE
   ═══════════════════════════════════════ */

function drawSparkline() {
  const line = document.getElementById('sparkLine');
  const area = document.getElementById('sparkArea');

  if (!line || !area) return;

  let data = rateHistory.slice();
  if (data.length < 2) {
    data = [70.2, 70.3, 70.1, 70.4, 70.5, 70.45, 70.55, 70.5];
  }

  const W = 300;
  const H = 60;
  const PAD = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const step = (W - PAD * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = PAD + i * step;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${H} L${points[0].x.toFixed(1)},${H} Z`;

  line.setAttribute('d', linePath);
  area.setAttribute('d', areaPath);
}

/* ═══════════════════════════════════════
   👛 WALLETS
   ═══════════════════════════════════════ */

async function loadWallets() {
  try {
    const wallets = await API.getWallets();
    currentWallets = wallets;

    const usdt = wallets.usdt || {};
    const afn = wallets.afn || {};

    const usdtBalance = Number(usdt.balance || 0);
    const afnBalance = Number(afn.balance || 0);

    const rate = currentRate ? Number(currentRate.sell_price_afn) : 70.5;
    const afnInUsdt = afnBalance / rate;
    const totalUsdt = usdtBalance + afnInUsdt;

    animateNumber('totalBalance', totalUsdt, '$', 2);
    setText('totalEquivalent', `≈ ${formatNumber(totalUsdt, 2)} USDT`);

    const changeEl = document.getElementById('balanceChange');
    if (changeEl) {
      const change = 2.45;
      const isUp = change >= 0;
      changeEl.classList.toggle('up', isUp);
      changeEl.classList.toggle('down', !isUp);
      const span = changeEl.querySelector('span');
      if (span) span.textContent = (isUp ? '+' : '') + change.toFixed(2) + '%';
    }

  } catch (err) {
    console.error('Wallets load failed:', err);
  }
}

function toggleBalanceVisibility() {
  hideBalance = !hideBalance;
  const hero = document.getElementById('balanceHero');
  if (!hero) return;

  hero.classList.toggle('balance-hidden', hideBalance);

  if (hideBalance) {
    setText('totalBalance', '••••••');
    setText('totalEquivalent', '••••••');
  } else {
    if (currentWallets) {
      loadWallets();
    }
  }
}

/* ═══════════════════════════════════════
   📊 STATS
   ═══════════════════════════════════════ */

async function loadStats() {
  try {
    const orders = await API.getMyOrders();
    const list = Array.isArray(orders) ? orders : [];

    const totalOrders = list.length;
    const completed = list.filter(o => o.status === 'COMPLETED').length;
    const volume = list
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.amount_usdt || 0), 0);

    animateNumber('statTotalOrders', totalOrders, '', 0);
    setText('statCompleted', completed);
    setText('statVolume', formatNumber(volume, 2) + ' USDT');
  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

/* ═══════════════════════════════════════
   📋 RECENT ORDERS → ACTIVITY
   ═══════════════════════════════════════ */

async function loadRecentOrders() {
  const container = document.getElementById('activityList');
  if (!container) return;

  try {
    const orders = await API.getMyOrders();
    const list = Array.isArray(orders) ? orders : [];
    const recent = list.slice(0, 6);

    if (!recent.length) {
      container.innerHTML = `
        <div class="activity-empty">
          <div class="activity-empty-icon">📭</div>
          <div class="activity-empty-title">No activity yet</div>
          <div class="activity-empty-text">Your recent trades will appear here</div>
          <a href="exchange.html?side=BUY" class="btn btn-primary btn-sm" style="margin-top: 12px;">
            Start trading
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    recent.forEach(order => {
      const isBuy = order.side === 'BUY';
      const timeAgo = getTimeAgo(new Date(order.created_at));

      const statusLabels = {
        'PENDING': { en: 'Pending', fa: 'در انتظار', ps: 'په تمه' },
        'AWAITING_REVIEW': { en: 'In Review', fa: 'در بازبینی', ps: 'په کتنه' },
        'PROCESSING': { en: 'Processing', fa: 'در پردازش', ps: 'پروسس' },
        'COMPLETED': { en: 'Completed', fa: 'تکمیل شد', ps: 'بشپړ شو' },
        'CANCELLED': { en: 'Cancelled', fa: 'لغو شد', ps: 'لغوه' },
        'REJECTED': { en: 'Rejected', fa: 'رد شد', ps: 'رد شو' },
      };

      const statusLabel = (statusLabels[order.status] || {})[I18N.currentLang] || order.status;

      const item = document.createElement('a');
      item.className = 'activity-item';
      item.href = `order.html?id=${order.id}`;

      item.innerHTML = `
        <div class="activity-item-icon ${isBuy ? 'buy' : 'sell'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isBuy
              ? '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'
              : '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'}
          </svg>
        </div>
        <div class="activity-item-content">
          <div class="activity-item-title">
            ${isBuy ? 'Buy' : 'Sell'} <strong>${formatNumber(order.amount_usdt, 2)} USDT</strong>
          </div>
          <div class="activity-item-meta">
            <span>${order.reference || '—'}</span>
            <span class="dot-sep"></span>
            <span>${statusLabel}</span>
          </div>
        </div>
        <div class="activity-item-right">
          <div class="activity-item-amount ${isBuy ? 'positive' : 'negative'}">
            ${isBuy ? '+' : '−'}${formatNumber(order.amount_usdt, 2)}
          </div>
          <div class="activity-item-time">${timeAgo}</div>
        </div>
      `;

      container.appendChild(item);
    });

  } catch (err) {
    console.error('Orders load failed:', err);
    container.innerHTML = `
      <div class="activity-empty">
        <div class="activity-empty-icon">⚠️</div>
        <div class="activity-empty-title">Could not load activity</div>
        <div class="activity-empty-text">Please try again later</div>
      </div>
    `;
  }
}

/* ═══════════════════════════════════════
   🎁 REFERRAL
   ═══════════════════════════════════════ */

async function loadReferral() {
  try {
    setText('referralInvited', '0');
    setText('referralEarned', '0 AFN');
  } catch (err) {
    console.error('Referral load failed:', err);
  }
}

function copyReferralCode() {
  const codeEl = document.getElementById('referralCode');
  if (!codeEl) return;

  const code = codeEl.textContent.trim();
  const url = `${window.location.origin}/pages/register.html?ref=${code}`;

  copyToClipboard(url).then(() => {
    Notify.success('Referral link copied!');
  }).catch(() => {
    Notify.error('Could not copy');
  });
}

/* ═══════════════════════════════════════
   🎡 WHEEL
   ═══════════════════════════════════════ */

async function loadWheelTickets() {
  try {
    setText('wheelTickets', '3');
    setText('wheelTicketsQuick', '3');
  } catch (err) {
    console.error('Wheel load failed:', err);
  }
}

/* ═══════════════════════════════════════
   ⭐ VIP
   ═══════════════════════════════════════ */

async function loadVipStatus() {
  try {
    setText('vipLevel', 'Level 1');
    setText('vipName', 'Silver');
    setText('vipNext', 'Gold');
    setText('vipProgressPct', '45%');
    const fill = document.getElementById('vipProgressFill');
    if (fill) fill.style.width = '45%';
  } catch (err) {
    console.error('VIP load failed:', err);
  }
}

/* ═══════════════════════════════════════
   💡 SMART INSIGHTS
   ═══════════════════════════════════════ */

function generateInsights() {
  const container = document.getElementById('insightsSection');
  if (!container) return;

  const insights = [];

  if (currentRate) {
    insights.push({
      icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
      title: 'Rate update',
      text: `Today's USDT rate is <strong>${formatNumber(currentRate.sell_price_afn, 2)} AFN</strong>. Good time to trade!`,
    });
  }

  const wheelEl = document.getElementById('wheelTickets');
  const tickets = wheelEl ? wheelEl.textContent : '0';
  if (Number(tickets) > 0) {
    insights.push({
      icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2v10l7 5"/>',
      title: 'Wheel tickets ready',
      text: `You have <strong>${tickets} spin${Number(tickets) > 1 ? 's' : ''}</strong> available. Try your luck!`,
    });
  }

  insights.push({
    icon: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>',
    title: 'Earn with referrals',
    text: 'Invite friends and earn <strong>10%</strong> of every trade they make.',
  });

  container.innerHTML = insights.map(i => `
    <div class="insight-card">
      <div class="insight-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          ${i.icon}
        </svg>
      </div>
      <div class="insight-content">
        <div class="insight-title">${i.title}</div>
        <div class="insight-text">${i.text}</div>
      </div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════
   🛠️ HELPERS
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatNumber(n, decimals = 2) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const lang = I18N.currentLang || 'en';
  const labels = {
    en: { now: 'Just now', m: 'm', h: 'h', d: 'd' },
    fa: { now: 'همین الان', m: 'د', h: 'س', d: 'ر' },
    ps: { now: 'همدا اوس', m: 'د', h: 'س', d: 'و' },
  };
  const L = labels[lang] || labels.en;
  if (seconds < 60) return L.now;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${L.m}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${L.h}`;
  const days = Math.floor(hours / 24);
  return `${days}${L.d}`;
}

function animateNumber(id, target, prefix = '', decimals = 0, duration = 800) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    if (decimals > 0) {
      el.textContent = prefix + formatNumber(current, decimals);
    } else {
      el.textContent = prefix + Math.round(current).toLocaleString('en-US');
    }
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      if (decimals > 0) {
        el.textContent = prefix + formatNumber(target, decimals);
      } else {
        el.textContent = prefix + Math.round(target).toLocaleString('en-US');
      }
    }
  }
  requestAnimationFrame(tick);
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const tmp = document.createElement('textarea');
      tmp.value = text;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

window.addEventListener('beforeunload', () => {
  if (pollingInterval) clearInterval(pollingInterval);
  if (clockInterval) clearInterval(clockInterval);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadRate();
    loadWallets();
  }
});

window.Dashboard = {
  reload: () => {
    loadRate();
    loadWallets();
    loadRecentOrders();
  },
};


/* ═══════════════════════════════════════
   🔒 KYC GATE — جلوگیری از واریز بدون احراز هویت
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const depositLinks = document.querySelectorAll('a[href*="deposit.html"]');
  
  depositLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault(); // همیشه اول جلوگیری می‌کنیم

      // از تابع قدرتمند auth.js استفاده می‌کنیم که خودش با سرور چک می‌کنه
      const isVerified = await Auth.checkKycVerified();

      if (isVerified) {
        window.location.href = link.href; // اگه تایید شد، برو به دیپازیت
      } else {
        showKycWarningModal(); // اگه تایید نشد، مودال رو نشون بده
      }
    });
  });
});

function showKycWarningModal() {
  let modal = document.getElementById('kycWarningModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'kycWarningModal';
    modal.innerHTML = `
      <div class="kyc-modal-overlay show" id="kycModalOverlay" style="position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.3s ease;">
        <div class="kyc-modal" style="background:#FFFFFF;border-radius:24px;padding:32px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.1);transform:translateY(20px);transition:transform 0.3s ease;">
          <div style="width:64px;height:64px;background:#FEF2F2;color:#EF4444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:12px;">Identity Verification Required</h2>
          <p style="font-size:14px;color:#64748B;line-height:1.6;margin-bottom:24px;">
            To protect your account and comply with regulations, you must complete KYC verification before making deposits or trades.
          </p>
          <a href="profile.html" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;background:linear-gradient(135deg,#1E40AF,#7C3AED);color:white;font-size:15px;font-weight:700;border-radius:12px;text-decoration:none;transition:transform 0.2s;border:none;cursor:pointer;margin-bottom:12px;">
            Verify Identity Now
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
          <button type="button" id="closeKycModal" style="display:inline-flex;align-items:center;justify-content:center;width:100%;padding:14px;background:transparent;color:#64748B;font-size:15px;font-weight:700;border-radius:12px;border:none;cursor:pointer;transition:background 0.2s;">
            Maybe Later
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => {
      document.getElementById('kycModalOverlay').style.opacity = '1';
      document.querySelector('#kycWarningModal .kyc-modal').style.transform = 'translateY(0)';
    }, 10);
    
    document.getElementById('closeKycModal').addEventListener('click', () => {
      closeKycModal();
    });
    
    document.getElementById('kycModalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'kycModalOverlay') {
        closeKycModal();
      }
    });
  } else {
    modal.style.display = 'block';
    setTimeout(() => {
      document.getElementById('kycModalOverlay').style.opacity = '1';
      document.querySelector('#kycWarningModal .kyc-modal').style.transform = 'translateY(0)';
    }, 10);
  }
}

function closeKycModal() {
  const overlay = document.getElementById('kycModalOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    document.querySelector('#kycWarningModal .kyc-modal').style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.getElementById('kycWarningModal').style.display = 'none';
    }, 300);
  }
}