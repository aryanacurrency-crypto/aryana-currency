/* ═══════════════════════════════════════
   ARYANA CURRENCY — Rewards Wheel v3
   Navy-Purple · Light · ARYANA OS
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  Auth.requireLogin();

  // ─── Header user ───
  const user = Auth.getUser();
  if (user) {
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    if (avatarEl) avatarEl.textContent = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = user.full_name || user.email || 'User';
  }

  // ─── Logout + Theme ───
  document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
  document.getElementById('themeToggle')?.addEventListener('click', () => Theme.toggle());

  /* ═══════════════════════════════════════
     STATE
     ═══════════════════════════════════════ */

  let wheelState = {
    prizes: [],
    availableTickets: 0,
    ticketPrice: 50,
    maxSpinsPerDay: 10,
    todaySpins: 0,
    isEnabled: true,
    spinning: false,
    currentRotation: 0,
    animationDuration: 8,
  };

  /* ═══════════════════════════════════════
     LOAD WHEEL STATUS
     ═══════════════════════════════════════ */

  async function loadWheelStatus() {
    try {
      const data = await API.request('/wheel/status');

      wheelState.prizes = data.prizes || [];
      wheelState.availableTickets = data.available_tickets || 0;
      wheelState.ticketPrice = data.ticket_price || 50;
      wheelState.maxSpinsPerDay = data.max_spins_per_day || 10;
      wheelState.todaySpins = data.today_spins || 0;
      wheelState.isEnabled = data.is_enabled;

      document.getElementById('ticketsCount').textContent = wheelState.availableTickets;
      document.getElementById('ticketPrice').textContent = `${wheelState.ticketPrice} AFN`;
      document.getElementById('todaySpins').textContent =
        `${wheelState.todaySpins} / ${wheelState.maxSpinsPerDay}`;

      const modalPrice = document.getElementById('modalTicketPrice');
      if (modalPrice) modalPrice.textContent = `${wheelState.ticketPrice} AFN`;

      renderWheel(wheelState.prizes);
      updateSpinButton();

    } catch (err) {
      console.error('Failed to load wheel status:', err);
      if (typeof Notifications !== 'undefined') {
        Notifications.error('Failed to load wheel');
      }
    }
  }

  /* ═══════════════════════════════════════
     RENDER WHEEL
     ═══════════════════════════════════════ */

  function renderWheel(prizes) {
    const svg = document.getElementById('wheelSvg');
    if (!svg) return;

    const total = prizes.length;
    if (total === 0) return;

    const sliceAngle = 360 / total;
    const cx = 200;
    const cy = 200;
    const r = 195;

    let svgContent = `
      <defs>
        <radialGradient id="innerShade" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(30,64,175,0.20)" />
        </radialGradient>
      </defs>
    `;

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

      // ─── Stroke سفید بین قطعه‌ها ───
      svgContent += `<path d="${path}" fill="${prize.color}" stroke="#FFFFFF" stroke-width="2"/>`;

      const midAngle = startAngle + sliceAngle / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const textR = r * 0.72;
      const tx = cx + textR * Math.cos(midRad);
      const ty = cy + textR * Math.sin(midRad);

      let label = (prize.label || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

      let textRotation = midAngle + 90;
      if (textRotation > 90 && textRotation < 270) {
        textRotation += 180;
      }

      const isLightBg = isLightColor(prize.color);
      const textColor = isLightBg ? '#0F172A' : '#FFFFFF';
      const subTextColor = isLightBg ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.85)';

      const hasNumber = /\d/.test(label);
      const subLabel = prize.prize_type === 'cash'
        ? 'AFN'
        : prize.prize_type === 'ticket'
          ? 'TICKET'
          : '';

      if (hasNumber && subLabel) {
        svgContent += `
          <g transform="translate(${tx}, ${ty}) rotate(${textRotation})">
            <text x="0" y="-6" text-anchor="middle" font-size="22" font-weight="900" fill="${textColor}" font-family="Manrope, Inter, sans-serif" letter-spacing="-0.5">${escapeSvg(label)}</text>
            <text x="0" y="12" text-anchor="middle" font-size="9" font-weight="700" fill="${subTextColor}" font-family="Manrope, Inter, sans-serif" letter-spacing="1.5">${subLabel}</text>
          </g>
        `;
      } else {
        svgContent += `
          <g transform="translate(${tx}, ${ty}) rotate(${textRotation})">
            <text x="0" y="4" text-anchor="middle" font-size="14" font-weight="800" fill="${textColor}" font-family="Manrope, Inter, sans-serif">${escapeSvg(label)}</text>
          </g>
        `;
      }
    });

    // ─── Inner shade ───
    svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#innerShade)" pointer-events="none"/>`;

    // ─── Border حلقه Navy-Purple ───
    svgContent += `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="rgba(124,58,237,0.3)" stroke-width="1" pointer-events="none"/>`;

    svg.innerHTML = svgContent;
  }

  function isLightColor(hex) {
    if (!hex) return false;
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160;
  }

  function escapeSvg(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ═══════════════════════════════════════
     SPIN BUTTON STATE
     ═══════════════════════════════════════ */

  function updateSpinButton() {
    const hub = document.getElementById('wheelHub');
    if (!hub) return;

    if (!wheelState.isEnabled) {
      hub.style.opacity = '0.4';
      hub.style.cursor = 'not-allowed';
      return;
    }

    if (wheelState.availableTickets < 1) {
      hub.style.opacity = '0.5';
      hub.style.cursor = 'not-allowed';
      return;
    }

    if (wheelState.todaySpins >= wheelState.maxSpinsPerDay) {
      hub.style.opacity = '0.5';
      hub.style.cursor = 'not-allowed';
      return;
    }

    hub.style.opacity = '1';
    hub.style.cursor = 'pointer';
  }

  /* ═══════════════════════════════════════
     SPIN ACTION
     ═══════════════════════════════════════ */

  document.getElementById('wheelHub')?.addEventListener('click', async () => {
    if (wheelState.spinning) return;

    if (wheelState.availableTickets < 1) {
      if (typeof Notifications !== 'undefined') {
        Notifications.error('You need a ticket to spin');
      }
      return;
    }

    if (wheelState.todaySpins >= wheelState.maxSpinsPerDay) {
      if (typeof Notifications !== 'undefined') {
        Notifications.error('Daily spin limit reached');
      }
      return;
    }

    wheelState.spinning = true;
    document.getElementById('wheelResult').style.display = 'none';

    const hub = document.getElementById('wheelHub');
    hub.classList.add('spinning');

    try {
      const result = await API.request('/wheel/spin', { method: 'POST' });

      wheelState.animationDuration = result.duration || 8;

      const targetAngle = result.target_angle;
      const extraTurns = 7 + Math.floor(Math.random() * 3);
      const totalRotation = wheelState.currentRotation + (extraTurns * 360) + (360 - targetAngle);

      const wheel = document.getElementById('wheel');
      wheel.style.transition = `transform ${wheelState.animationDuration}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
      wheel.style.transform = `rotate(${totalRotation}deg)`;

      wheelState.currentRotation = totalRotation % 360;

      playTickSounds(wheelState.animationDuration);

      setTimeout(() => {
        showResult(result);
        wheelState.spinning = false;
        hub.classList.remove('spinning');

        loadWheelStatus();
        loadRecentWinners();

      }, wheelState.animationDuration * 1000 + 200);

    } catch (err) {
      console.error('Spin failed:', err);
      wheelState.spinning = false;
      hub.classList.remove('spinning');

      if (typeof Notifications !== 'undefined') {
        Notifications.error(err.detail || 'Spin failed. Try again.');
      }
    }
  });

  /* ═══════════════════════════════════════
     RESULT DISPLAY
     ═══════════════════════════════════════ */

  function showResult(result) {
    const container = document.getElementById('wheelResult');
    const iconEl = document.getElementById('resultIcon');
    const titleEl = document.getElementById('resultTitle');
    const amountEl = document.getElementById('resultAmount');

    const r = result.result;

    let icon = '💰';
    let title = '';
    let amount = '';

    if (r.type === 'cash' && r.amount > 0) {
      icon = '💰';
      title = 'You Won!';
      amount = `${r.amount.toFixed(2)} ${r.currency}`;
      fireConfetti();

    } else if (r.type === 'ticket') {
      icon = '🎟️';
      title = 'Bonus Tickets';
      amount = `+${r.ticket_count} Ticket${r.ticket_count > 1 ? 's' : ''}`;

    } else {
      icon = '🎯';
      title = 'Try Again';
      amount = 'Better luck next time';
    }

    if (result.requires_approval) {
      icon = '⏳';
      title = 'Pending Approval';
      amount = 'Your reward is being reviewed';
    }

    iconEl.textContent = icon;
    titleEl.textContent = title;
    amountEl.textContent = amount;

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (typeof Notifications !== 'undefined') {
      if (r.type === 'cash' && r.amount > 0) {
        Notifications.success(`You won ${r.amount} ${r.currency}!`);
      } else if (r.type === 'ticket') {
        Notifications.success(`You won ${r.ticket_count} ticket(s)!`);
      } else {
        Notifications.info('Better luck next time!');
      }
    }
  }

  /* ═══════════════════════════════════════
     SPIN AGAIN
     ═══════════════════════════════════════ */

  document.getElementById('spinAgainBtn')?.addEventListener('click', () => {
    document.getElementById('wheelResult').style.display = 'none';
    if (wheelState.availableTickets >= 1) {
      document.getElementById('wheelHub').click();
    }
  });

  /* ═══════════════════════════════════════
     TICK SOUNDS / GLOW
     ═══════════════════════════════════════ */

  function playTickSounds(duration) {
    const glow = document.getElementById('wheelGlow');
    if (glow) {
      glow.classList.add('active');
      setTimeout(() => glow.classList.remove('active'), duration * 1000);
    }
  }

  /* ═══════════════════════════════════════
     RECENT WINNERS
     ═══════════════════════════════════════ */

  async function loadRecentWinners() {
    const list = document.getElementById('winnersList');
    if (!list) return;

    const mockWinners = [
      { name: 'Ahmad R.',    prize: '50 AFN',  time: '2 min ago',  color: '#1E40AF' },
      { name: 'Fatima K.',   prize: '20 AFN',  time: '5 min ago',  color: '#10B981' },
      { name: 'Ali M.',      prize: 'Ticket',  time: '8 min ago',  color: '#7C3AED' },
      { name: 'Zahra S.',    prize: '100 AFN', time: '12 min ago', color: '#7C3AED' },
      { name: 'Mohammad A.', prize: '10 AFN',  time: '15 min ago', color: '#1E40AF' },
    ];

    list.innerHTML = mockWinners.map(w => `
      <div class="wheel-winner-item">
        <div class="wheel-winner-avatar" style="background:${w.color}">
          ${w.name.charAt(0)}
        </div>
        <div class="wheel-winner-info">
          <div class="wheel-winner-name">${w.name}</div>
          <div class="wheel-winner-time">${w.time}</div>
        </div>
        <div class="wheel-winner-prize" style="color:${w.color}">
          ${w.prize}
        </div>
      </div>
    `).join('');
  }

  /* ═══════════════════════════════════════
     BUY TICKET MODAL
     ═══════════════════════════════════════ */

  const buyModal = document.getElementById('buyTicketModal');
  const qtyInput = document.getElementById('qtyInput');
  const modalTotal = document.getElementById('modalTotal');

  document.getElementById('buyTicketBtn')?.addEventListener('click', () => {
    buyModal.style.display = 'flex';
    updateModalTotal();
  });

  document.getElementById('closeBuyModal')?.addEventListener('click', () => {
    buyModal.style.display = 'none';
  });

  document.getElementById('cancelBuyBtn')?.addEventListener('click', () => {
    buyModal.style.display = 'none';
  });

  buyModal?.addEventListener('click', (e) => {
    if (e.target === buyModal) buyModal.style.display = 'none';
  });

  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qty = parseInt(btn.dataset.qty, 10);
      qtyInput.value = qty;

      document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updateModalTotal();
    });
  });

  qtyInput?.addEventListener('input', () => {
    let v = parseInt(qtyInput.value, 10) || 1;
    if (v < 1) v = 1;
    if (v > 10) v = 10;
    qtyInput.value = v;

    document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
    updateModalTotal();
  });

  function updateModalTotal() {
    const qty = parseInt(qtyInput.value, 10) || 1;
    const total = qty * wheelState.ticketPrice;
    modalTotal.textContent = `${total} AFN`;
  }

  document.getElementById('confirmBuyBtn')?.addEventListener('click', async () => {
    const qty = parseInt(qtyInput.value, 10) || 1;
    const btn = document.getElementById('confirmBuyBtn');

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.request(`/wheel/buy-ticket?count=${qty}`, { method: 'POST' });

      buyModal.style.display = 'none';
      btn.disabled = false;
      btn.innerHTML = orig;

      if (typeof Notifications !== 'undefined') {
        Notifications.success(`${qty} ticket(s) purchased!`);
      }

      await loadWheelStatus();

    } catch (err) {
      console.error('Buy failed:', err);
      btn.disabled = false;
      btn.innerHTML = orig;

      if (typeof Notifications !== 'undefined') {
        Notifications.error(err.detail || 'Purchase failed');
      }
    }
  });

  /* ═══════════════════════════════════════
     CONFETTI
     ═══════════════════════════════════════ */

  function fireConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#1E40AF', '#7C3AED', '#10B981', '#FFFFFF', '#4F46E5', '#A78BFA'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 5 + 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.style.display = 'none';
      }
    }

    animate();
  }

  /* ═══════════════════════════════════════
     INIT
     ═══════════════════════════════════════ */

  await loadWheelStatus();
  await loadRecentWinners();
});