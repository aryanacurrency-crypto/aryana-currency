/* ═══════════════════════════════════════
   ARYANA CURRENCY — Profile: Referral & Wheel
   Loaded only when user opens those tabs
   ═══════════════════════════════════════ */

(function() {
  'use strict';

  let profileReferralCode = '—';
  let profileReferralLink = '—';
  let profileWheelState = {
    prizes: [],
    availableTickets: 0,
    ticketPrice: 50,
    maxSpinsPerDay: 10,
    todaySpins: 0,
    isEnabled: true,
    spinning: false,
    currentRotation: 0,
  };
  let referralLoaded = false;
  let wheelLoaded = false;

  // ═══════════════════════════════════════
  //              REFERRAL
  // ═══════════════════════════════════════
  async function loadReferralData() {
    if (referralLoaded) return;
    referralLoaded = true;

    try {
      const stats = await API.request('/referral/me');

      profileReferralCode = stats.code || '—';
      profileReferralLink = `${window.location.origin}${window.location.pathname.replace('profile.html', 'register.html')}?ref=${profileReferralCode}`;

      const codeEl = document.getElementById('profileReferralCode');
      const linkEl = document.getElementById('profileReferralLink');
      if (codeEl) codeEl.textContent = profileReferralCode;
      if (linkEl) linkEl.value = profileReferralLink;

      const el1 = document.getElementById('profileTotalReferrals');
      const el2 = document.getElementById('profileLocked');
      const el3 = document.getElementById('profileReleased');
      const el4 = document.getElementById('profileEarned');

      if (el1) el1.textContent = stats.total_referrals || 0;
      if (el2) el2.textContent = `${(stats.locked_amount || 0).toFixed(2)} AFN`;
      if (el3) el3.textContent = `${(stats.total_earned || 0).toFixed(2)} AFN`;
      if (el4) el4.textContent = `${(stats.total_earned || 0).toFixed(2)} AFN`;

      const list = await API.request('/referral/list');
      renderReferralsList(list);

    } catch (err) {
      console.error('Referral load failed:', err);
      referralLoaded = false;
    }
  }

  function renderReferralsList(list) {
    const container = document.getElementById('profileReferralsList');
    if (!container) return;

    if (!list || list.length === 0) return;

    container.innerHTML = list.map(r => {
      const isReleased = r.bonus_status === 'released';
      const badgeBg = isReleased ? 'rgba(14, 203, 129, 0.12)' : 'rgba(240, 185, 11, 0.12)';
      const badgeColor = isReleased ? 'var(--green)' : 'var(--gold)';
      const badgeText = isReleased ? 'Released' : 'Pending';

      return `
        <div style="padding:16px; background:var(--bg-tertiary); border:1px solid var(--border-subtle); border-radius:12px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:10px;">
            <strong style="font-size:14px;">${escapeHtml(r.referred_user_name)}</strong>
            <span style="padding:4px 10px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; background:${badgeBg}; color:${badgeColor};">
              ${badgeText}
            </span>
          </div>

          <div style="display:flex; gap:6px; font-size:11px; margin-bottom:12px; flex-wrap:wrap;">
            <span style="padding:4px 10px; border-radius:6px; background:${r.registered_at ? 'rgba(14, 203, 129, 0.1)' : 'var(--bg-hover)'}; color:${r.registered_at ? 'var(--green)' : 'var(--text-tertiary)'}; font-weight:600;">Registration</span>
            <span style="padding:4px 10px; border-radius:6px; background:${r.kyc_completed ? 'rgba(14, 203, 129, 0.1)' : 'rgba(240, 185, 11, 0.1)'}; color:${r.kyc_completed ? 'var(--green)' : 'var(--gold)'}; font-weight:600;">KYC</span>
            <span style="padding:4px 10px; border-radius:6px; background:${r.first_trade_done ? 'rgba(14, 203, 129, 0.1)' : 'rgba(240, 185, 11, 0.1)'}; color:${r.first_trade_done ? 'var(--green)' : 'var(--gold)'}; font-weight:600;">First Trade</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border-subtle); font-size:13px;">
            <span style="color:var(--text-secondary);">Reward</span>
            <strong style="color:var(--gold); font-variant-numeric:tabular-nums;">${r.bonus_amount.toFixed(2)} AFN</strong>
          </div>
        </div>
      `;
    }).join('');
  }

  // ═══════════════════════════════════════
  //              WHEEL
  // ═══════════════════════════════════════
  async function loadWheelData() {
    if (wheelLoaded) return;
    wheelLoaded = true;

    try {
      const data = await API.request('/wheel/status');

      profileWheelState.prizes = data.prizes || [];
      profileWheelState.availableTickets = data.available_tickets || 0;
      profileWheelState.ticketPrice = data.ticket_price || 50;
      profileWheelState.maxSpinsPerDay = data.max_spins_per_day || 10;
      profileWheelState.todaySpins = data.today_spins || 0;
      profileWheelState.isEnabled = data.is_enabled;

      const el1 = document.getElementById('profileTicketsCount');
      const el2 = document.getElementById('profileTicketPrice');
      const el3 = document.getElementById('profileTodaySpins');

      if (el1) el1.textContent = profileWheelState.availableTickets;
      if (el2) el2.textContent = `${profileWheelState.ticketPrice} AFN`;
      if (el3) el3.textContent = `${profileWheelState.todaySpins} / ${profileWheelState.maxSpinsPerDay}`;

      renderProfileWheel(profileWheelState.prizes);
      updateProfileSpinBtn();

    } catch (err) {
      console.error('Wheel load failed:', err);
      wheelLoaded = false;
    }
  }

  function renderProfileWheel(prizes) {
    const svg = document.getElementById('profileWheelSvg');
    if (!svg) return;

    const total = prizes.length;
    if (total === 0) return;

    const sliceAngle = 360 / total;
    const cx = 200, cy = 200, r = 195;

    let content = '';

    prizes.forEach((prize, i) => {
      const startAngle = i * sliceAngle - 90;
      const endAngle = startAngle + sliceAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      content += `<path d="${path}" fill="${prize.color}" stroke="#0B0E11" stroke-width="1"/>`;

      const midAngle = startAngle + sliceAngle / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const tx = cx + r * 0.72 * Math.cos(midRad);
      const ty = cy + r * 0.72 * Math.sin(midRad);

      let label = (prize.label || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

      let textRotation = midAngle + 90;
      if (textRotation > 90 && textRotation < 270) textRotation += 180;

      const isLightBg = isLightColor(prize.color);
      const textColor = isLightBg ? '#0B0E11' : '#FFFFFF';
      const hasNumber = /\d/.test(label);
      const subLabel = prize.prize_type === 'cash' ? 'AFN' : prize.prize_type === 'ticket' ? 'TICKET' : '';

      if (hasNumber && subLabel) {
        content += `
          <g transform="translate(${tx}, ${ty}) rotate(${textRotation})">
            <text x="0" y="-6" text-anchor="middle" font-size="22" font-weight="900" fill="${textColor}" font-family="Inter, sans-serif" letter-spacing="-0.5">${escapeSvg(label)}</text>
            <text x="0" y="12" text-anchor="middle" font-size="9" font-weight="700" fill="${textColor}" opacity="0.85" font-family="Inter, sans-serif" letter-spacing="1.5">${subLabel}</text>
          </g>
        `;
      } else {
        content += `
          <g transform="translate(${tx}, ${ty}) rotate(${textRotation})">
            <text x="0" y="4" text-anchor="middle" font-size="14" font-weight="800" fill="${textColor}" font-family="Inter, sans-serif">${escapeSvg(label)}</text>
          </g>
        `;
      }
    });

    content += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0B0E11" stroke-width="2"/>`;

    svg.innerHTML = content;
  }

  function isLightColor(hex) {
    if (!hex) return false;
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160;
  }

  function escapeSvg(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updateProfileSpinBtn() {
    const btn = document.getElementById('profileSpinBtn');
    const hint = document.getElementById('profileSpinHint');
    if (!btn || !hint) return;

    if (!profileWheelState.isEnabled) {
      btn.disabled = true;
      hint.textContent = 'Wheel disabled';
      return;
    }
    if (profileWheelState.availableTickets < 1) {
      btn.disabled = true;
      hint.textContent = 'Ticket required';
      return;
    }
    if (profileWheelState.todaySpins >= profileWheelState.maxSpinsPerDay) {
      btn.disabled = true;
      hint.textContent = 'Daily limit reached';
      return;
    }

    btn.disabled = false;
    hint.textContent = 'Ready to spin';
  }

  // ═══════════════════════════════════════
  //              SPIN
  // ═══════════════════════════════════════
  document.addEventListener('click', async (e) => {
    const spinBtn = e.target.closest('#profileSpinBtn');
    if (!spinBtn) return;

    if (profileWheelState.spinning) return;

    if (profileWheelState.availableTickets < 1) {
      if (typeof Notifications !== 'undefined') Notifications.error('You need a ticket to spin');
      return;
    }

    profileWheelState.spinning = true;
    const resultBox = document.getElementById('profileWheelResult');
    if (resultBox) resultBox.style.display = 'none';

    spinBtn.disabled = true;
    spinBtn.classList.add('spinning');

    try {
      const result = await API.request('/wheel/spin', { method: 'POST' });

      const duration = result.duration || 8;
      const targetAngle = result.target_angle;
      const extraTurns = 7 + Math.floor(Math.random() * 3);
      const totalRotation = profileWheelState.currentRotation + (extraTurns * 360) + (360 - targetAngle);

      const wheel = document.getElementById('profileWheel');
      if (wheel) {
        wheel.style.transition = `transform ${duration}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
        wheel.style.transform = `rotate(${totalRotation}deg)`;
      }

      profileWheelState.currentRotation = totalRotation % 360;

      setTimeout(() => {
        showProfileResult(result);
        profileWheelState.spinning = false;
        spinBtn.classList.remove('spinning');
        wheelLoaded = false;
        loadWheelData();
      }, duration * 1000 + 200);

    } catch (err) {
      console.error('Spin failed:', err);
      profileWheelState.spinning = false;
      spinBtn.disabled = false;
      spinBtn.classList.remove('spinning');
      if (typeof Notifications !== 'undefined') Notifications.error(err.detail || 'Spin failed');
    }
  });

  function showProfileResult(result) {
    const container = document.getElementById('profileWheelResult');
    const iconEl = document.getElementById('profileResultIcon');
    const titleEl = document.getElementById('profileResultTitle');
    const amountEl = document.getElementById('profileResultAmount');

    if (!container) return;

    const r = result.result;
    let icon = '◆', title = '', amount = '';

    if (r.type === 'cash' && r.amount > 0) {
      title = 'You Won';
      amount = `${r.amount.toFixed(2)} ${r.currency}`;
      icon = '◆';
    } else if (r.type === 'ticket') {
      title = 'Bonus Tickets';
      amount = `+${r.ticket_count} Ticket${r.ticket_count > 1 ? 's' : ''}`;
      icon = '◇';
    } else {
      title = 'No Reward';
      amount = 'Better luck next time';
      icon = '○';
    }

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (amountEl) amountEl.textContent = amount;

    container.style.display = 'block';

    if (typeof Notifications !== 'undefined') {
      if (r.type === 'cash' && r.amount > 0) {
        Notifications.success(`You won ${r.amount} ${r.currency}!`);
      } else if (r.type === 'ticket') {
        Notifications.success(`You won ${r.ticket_count} ticket(s)!`);
      }
    }
  }

  // ═══════════════════════════════════════
  //              BUY TICKETS
  // ═══════════════════════════════════════
  document.addEventListener('click', async (e) => {
    const buyBtn = e.target.closest('#profileBuyTicketBtn');
    if (!buyBtn) return;

    const count = prompt('How many tickets? (1-10)', '1');
    if (!count) return;

    const n = parseInt(count, 10);
    if (isNaN(n) || n < 1 || n > 10) {
      if (typeof Notifications !== 'undefined') Notifications.error('Enter a number between 1 and 10');
      return;
    }

    try {
      await API.request(`/wheel/buy-ticket?count=${n}`, { method: 'POST' });
      if (typeof Notifications !== 'undefined') Notifications.success(`${n} ticket(s) purchased!`);
      wheelLoaded = false;
      await loadWheelData();
    } catch (err) {
      if (typeof Notifications !== 'undefined') Notifications.error(err.detail || 'Purchase failed');
    }
  });

  // ═══════════════════════════════════════
  //         COPY & SHARE
  // ═══════════════════════════════════════
  document.addEventListener('click', (e) => {
    const copyCodeBtn = e.target.closest('#profileCopyCode');
    if (copyCodeBtn) {
      copyText(profileReferralCode, copyCodeBtn);
      return;
    }

    const copyLinkBtn = e.target.closest('#profileCopyLink');
    if (copyLinkBtn) {
      copyText(profileReferralLink, copyLinkBtn);
      return;
    }

    const shareBtn = e.target.closest('.ref-share-btn');
    if (shareBtn) {
      const type = shareBtn.dataset.share;
      const shareText = `Join Aryana Currency! Use my code ${profileReferralCode}`;

      if (type === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(profileReferralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (type === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + profileReferralLink)}`, '_blank');
      } else if (type === 'copy') {
        copyText(profileReferralLink, shareBtn);
      }
    }
  });

  function copyText(text, btn) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showCopied(btn));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopied(btn);
    }
  }

  function showCopied(btn) {
    if (!btn) return;
    btn.classList.add('copied');
    const span = btn.querySelector('span');
    const original = span ? span.textContent : '';
    if (span) span.textContent = 'Copied';
    setTimeout(() => {
      btn.classList.remove('copied');
      if (span) span.textContent = original;
    }, 1500);
  }

  // ═══════════════════════════════════════
  //         TAB CLICK LISTENER
  //         (بعد از profile.js اصلی)
  // ═══════════════════════════════════════
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.profile-nav-item');
    if (!navItem) return;

    const tab = navItem.dataset.tab;
    if (tab === 'referral') {
      setTimeout(loadReferralData, 100);
    } else if (tab === 'wheel') {
      setTimeout(loadWheelData, 100);
    }
  });

  // ═══════════════════════════════════════
  //              HELPERS
  // ═══════════════════════════════════════
  function escapeHtml(t) {
    if (!t) return '';
    const div = document.createElement('div');
    div.textContent = String(t);
    return div.innerHTML;
  }

})();