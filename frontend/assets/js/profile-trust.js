/* ═══════════════════════════════════════
   ARYANA — Trust Score & Trading Stats
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  let loaded = false;

  function init() {
    const tradingTab = document.querySelector('.profile-nav-item[data-tab="trading"]');
    if (!tradingTab) return;

    tradingTab.addEventListener('click', () => {
      if (!loaded) {
        loadTrustScore();
        loaded = true;
      }
    });
  }

  async function loadTrustScore() {
    const loadingEl = document.getElementById('trustScoreLoading');
    const contentEl = document.getElementById('trustScoreContent');

    try {
      const data = await API.getMyReputation();

      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';

      renderTrustScore(data);
    } catch (err) {
      console.error('Failed to load trust score:', err);
      if (loadingEl) {
        loadingEl.innerHTML = `<div class="p2p-alert danger" style="margin:0;"><span>Failed to load stats. Please try again.</span></div>`;
      }
    }
  }

  function renderTrustScore(data) {
    const score = Number(data.trust_score) || 0;
    const completed = Number(data.completed_trades) || 0;
    const cancelled = Number(data.cancelled_trades) || 0;
    const disputed = Number(data.disputed_trades) || 0;
    const total = Number(data.total_trades) || 0;
    const isVerified = Boolean(data.is_verified);
    const isBlocked = Boolean(data.is_blocked);

    const scoreNum = document.getElementById('trustScoreNum');

    const progress = document.getElementById('trustProgress');
    if (progress) {
      const radius = 52;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (score / 100) * circumference;

      progress.style.strokeDasharray = `${circumference}`;
      progress.style.strokeDashoffset = offset;

      let color = '#F6465D';
      if (score >= 80) color = '#0ECB81';
      else if (score >= 60) color = '#F0B90B';
      else if (score >= 40) color = '#FF9800';

      progress.style.stroke = color;
      animateNumber(scoreNum, score);
    }

    const levelEl = document.getElementById('trustScoreLevel');
    const descEl = document.getElementById('trustScoreDesc');

    let level, levelColor, desc;

    if (isBlocked) {
      level = '🚫 Blocked';
      levelColor = 'var(--red)';
      desc = 'Your account is blocked from P2P trading.';
    } else if (score >= 80) {
      level = '💎 Elite Trader';
      levelColor = 'var(--green)';
      desc = 'Excellent reputation. Trusted by the community.';
    } else if (score >= 60) {
      level = '🟢 Trusted Trader';
      levelColor = 'var(--green)';
      desc = 'Good reputation. Safe to trade with.';
    } else if (score >= 40) {
      level = '🟡 Rising Trader';
      levelColor = 'var(--gold)';
      desc = 'Building reputation. Keep up the good work.';
    } else {
      level = '🔴 New Trader';
      levelColor = 'var(--red)';
      desc = 'New to P2P. Complete more trades to build trust.';
    }

    if (levelEl) {
      levelEl.textContent = level;
      levelEl.style.color = levelColor;
    }
    if (descEl) descEl.textContent = desc;

    const badgesEl = document.getElementById('trustBadges');
    if (badgesEl) {
      const badges = [];

      if (isVerified) {
        badges.push(`<span class="trust-badge verified">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;">
            <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
          </svg>
          Verified
        </span>`);
      }

      if (completed >= 100) {
        badges.push(`<span class="trust-badge elite">🔥 Top Trader</span>`);
      }

      if (completed >= 10 && disputed === 0) {
        badges.push(`<span class="trust-badge trusted">🛡️ Trusted</span>`);
      }

      if (total < 5 && !isBlocked) {
        badges.push(`<span class="trust-badge new">🆕 New</span>`);
      }

      if (disputed > 0) {
        badges.push(`<span class="trust-badge warning">⚠️ ${disputed} Dispute${disputed > 1 ? 's' : ''}</span>`);
      }

      badgesEl.innerHTML = badges.join('') || '<span class="trust-badge neutral">No badges yet</span>';
    }

    setText('statCompleted', completed);
    setText('statCancelled', cancelled);
    setText('statDisputed', disputed);
    setText('statTotal', total);

    let successRate = 0;
    if (total > 0) {
      successRate = Math.round((completed / total) * 100);
    }

    const rateEl = document.getElementById('successRate');
    if (rateEl) {
      rateEl.textContent = total > 0 ? `${successRate}%` : '—';
      rateEl.style.color = successRate >= 80 ? 'var(--green)' : successRate >= 50 ? 'var(--gold)' : 'var(--red)';
    }

    const fillEl = document.getElementById('successFill');
    if (fillEl) {
      fillEl.style.width = `${successRate}%`;
      fillEl.style.background = successRate >= 80
        ? 'linear-gradient(90deg, #0ECB81, #0A9D63)'
        : successRate >= 50
          ? 'linear-gradient(90deg, #F0B90B, #B58C0F)'
          : 'linear-gradient(90deg, #F6465D, #C73049)';
    }
  }

  function animateNumber(el, target) {
    if (!el) return;
    const duration = 800;
    const start = performance.now();
    const from = 0;

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.floor(from + (target - from) * easeOutCubic(progress));
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();