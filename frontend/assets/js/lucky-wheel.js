/* ═══════════════════════════════════════
   ARYANA CURRENCY — Lucky Wheel Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  Auth.requireLogin();

  // Header
  const user = Auth.getUser();
  if (user) {
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    if (avatarEl) avatarEl.textContent = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = user.full_name || user.email || 'User';
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
  document.getElementById('themeToggle')?.addEventListener('click', () => Theme.toggle());

  // ═══════════════════════════════════════
  //              State
  // ═══════════════════════════════════════
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

  // ═══════════════════════════════════════
  //           Load Wheel Status
  // ═══════════════════════════════════════
  async function loadWheelStatus() {
    try {
      const data = await API.request('/wheel/status');

      wheelState.prizes = data.prizes || [];
      wheelState.availableTickets = data.available_tickets || 0;
      wheelState.ticketPrice = data.ticket_price || 50;
      wheelState.maxSpinsPerDay = data.max_spins_per_day || 10;
      wheelState.todaySpins = data.today_spins || 0;
      wheelState.isEnabled = data.is_enabled;

      // Update UI
      document.getElementById('ticketsCount').textContent = wheelState.availableTickets;
      document.getElementById('ticketPrice').textContent = `${wheelState.ticketPrice} AFN`;
      document.getElementById('todaySpins').textContent =
        `${wheelState.todaySpins} / ${wheelState.maxSpinsPerDay}`;
      document.getElementById('modalTicketPrice').textContent = `${wheelState.ticketPrice} AFN`;

      // Render wheel
      renderWheel(wheelState.prizes);

      // Update spin button
      updateSpinButton();

    } catch (err) {
      console.error('Failed to load wheel status:', err);
      if (typeof Notifications !== 'undefined') {
        Notifications.error('Failed to load wheel');
      }
    }
  }

  // ═══════════════════════════════════════
  //              Render Wheel
  // ═══════════════════════════════════════
  function renderWheel(prizes) {
    const svg = document.getElementById('wheelSvg');
    if (!svg) return;

    const total = prizes.length;
    if (total === 0) return;

    const sliceAngle = 360 / total;
    const cx = 200;
    const cy = 200;
    const r = 190;

    let svgContent = `
      <defs>
        <radialGradient id="hubGrad" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#FFD700"/>
          <stop offset="100%" stop-color="#B58C0F"/>
        </radialGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
    `;

    // Draw each slice
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

      const path = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      // Slice
      svgContent += `<path d="${path}" fill="${prize.color}" stroke="#0B0E11" stroke-width="2"/>`;

      // Text
      const midAngle = startAngle + sliceAngle / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const textR = r * 0.7;
      const tx = cx + textR * Math.cos(midRad);
      const ty = cy + textR * Math.sin(midRad);

      let label = prize.label || '';
      // اگر label با ایموجی شروع می‌شه، جدا کنیم
      const icon = prize.icon || '';
      const shortLabel = label.replace(icon, '').trim();

      // چرخش متن با زاویه
      let textRotation = midAngle + 90;
      if (textRotation > 90 && textRotation < 270) {
        textRotation += 180;
      }

      svgContent += `
        <g transform="translate(${tx}, ${ty}) rotate(${textRotation})">
          ${icon ? `<text x="0" y="-8" text-anchor="middle" font-size="18" fill="white" filter="url(#shadow)">${icon}</text>` : ''}
          <text x="0" y="${icon ? 10 : 5}" text-anchor="middle" font-size="13" font-weight="800" fill="white" filter="url(#shadow)">${shortLabel}</text>
        </g>
      `;
    });

    // Outer ring (gold)
    svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#hubGrad)" stroke-width="8"/>`;

    svg.innerHTML = svgContent;
  }

  // ═══════════════════════════════════════
  //              Spin Button
  // ═══════════════════════════════════════
  function updateSpinButton() {
    const btn = document.getElementById('spinBtn');
    const hint = document.getElementById('spinBtnHint');

    if (!btn) return;

    if (!wheelState.isEnabled) {
      btn.disabled = true;
      if (hint) hint.textContent = 'Wheel is disabled';
      return;
    }

    if (wheelState.availableTickets < 1) {
      btn.disabled = true;
      if (hint) hint.textContent = 'You need a ticket to spin';
      return;
    }

    if (wheelState.todaySpins >= wheelState.maxSpinsPerDay) {
      btn.disabled = true;
      if (hint) hint.textContent = 'Daily limit reached — come back tomorrow';
      return;
    }

    btn.disabled = false;
    if (hint) hint.textContent = 'Good luck!';
  }

  // ═══════════════════════════════════════
  //              Spin Action
  // ═══════════════════════════════════════
  document.getElementById('spinBtn')?.addEventListener('click', async () => {
    if (wheelState.spinning) return;
    if (wheelState.availableTickets < 1) return;

    wheelState.spinning = true;
    document.getElementById('wheelResult').style.display = 'none';

    const btn = document.getElementById('spinBtn');
    btn.disabled = true;
    btn.classList.add('spinning');

    try {
      // ۱. درخواست چرخش از سرور
      const result = await API.request('/wheel/spin', { method: 'POST' });

      wheelState.animationDuration = result.duration || 8;

      // ۲. محاسبه زاویه نهایی
      // سرور زاویه رو با rotate(0) می‌ده (بالای گردونه)
      // گردونه باید این زاویه رو بگیره
      const targetAngle = result.target_angle;

      // چرخش اضافی برای هیجان (۷-۹ دور)
      const extraTurns = 7 + Math.floor(Math.random() * 3);
      const totalRotation = wheelState.currentRotation + (extraTurns * 360) + (360 - targetAngle);

      // ۳. اعمال انیمیشن
      const wheel = document.getElementById('wheel');
      wheel.style.transition = `transform ${wheelState.animationDuration}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
      wheel.style.transform = `rotate(${totalRotation}deg)`;

      wheelState.currentRotation = totalRotation % 360;

      // ۴. افکت نزدیک jackpot
      playTickSounds(wheelState.animationDuration);

      // ۵. صبر تا پایان انیمیشن
      setTimeout(() => {
        showResult(result);
        wheelState.spinning = false;
        btn.classList.remove('spinning');

        // Reload status
        loadWheelStatus();
        loadRecentWinners();

      }, wheelState.animationDuration * 1000 + 200);

    } catch (err) {
      console.error('Spin failed:', err);
      wheelState.spinning = false;
      btn.disabled = false;
      btn.classList.remove('spinning');

      if (typeof Notifications !== 'undefined') {
        Notifications.error(err.detail || 'Spin failed. Try again.');
      }
    }
  });

  // ═══════════════════════════════════════
  //              Show Result
  // ═══════════════════════════════════════
  function showResult(result) {
    const container = document.getElementById('wheelResult');
    const iconEl = document.getElementById('resultIcon');
    const titleEl = document.getElementById('resultTitle');
    const amountEl = document.getElementById('resultAmount');

    const r = result.result;

    let icon = '🎉';
    let title = '';
    let amount = '';

    if (r.type === 'cash' && r.amount > 0) {
      icon = r.icon || '💰';
      title = `You won ${r.amount} ${r.currency}!`;
      amount = `${r.amount.toFixed(2)} ${r.currency}`;
      fireConfetti();

    } else if (r.type === 'ticket') {
      icon = '🎟️';
      title = `You won ${r.ticket_count} free ticket(s)!`;
      amount = `+${r.ticket_count} 🎟️`;

    } else {
      icon = '😅';
      title = 'Better luck next time!';
      amount = 'Try again';
    }

    if (result.requires_approval) {
      title = '⏳ Pending Approval';
      amount = 'Your prize is being reviewed';
    }

    iconEl.textContent = icon;
    titleEl.textContent = title;
    amountEl.textContent = amount;

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (typeof Notifications !== 'undefined') {
      if (r.type === 'cash' && r.amount > 0) {
        Notifications.success(`🎉 You won ${r.amount} ${r.currency}!`);
      } else if (r.type === 'ticket') {
        Notifications.success(`🎟️ You won ${r.ticket_count} ticket(s)!`);
      } else {
        Notifications.info('Better luck next time!');
      }
    }
  }

  // ═══════════════════════════════════════
  //         Spin Again Button
  // ═══════════════════════════════════════
  document.getElementById('spinAgainBtn')?.addEventListener('click', () => {
    document.getElementById('wheelResult').style.display = 'none';
    if (wheelState.availableTickets >= 1) {
      document.getElementById('spinBtn').click();
    }
  });

  // ═══════════════════════════════════════
  //         Tick Sounds (optional)
  // ═══════════════════════════════════════
  function playTickSounds(duration) {
    // می‌تونی صدا اضافه کنی
    // فعلاً فقط افکت بصری
    const glow = document.getElementById('wheelGlow');
    if (glow) {
      glow.classList.add('active');
      setTimeout(() => glow.classList.remove('active'), duration * 1000);
    }
  }

  // ═══════════════════════════════════════
  //         Recent Winners
  // ═══════════════════════════════════════
  async function loadRecentWinners() {
    const list = document.getElementById('winnersList');
    if (!list) return;

    // برای MVP، یه لیست نمونه نشون می‌دیم
    // در آینده می‌تونه از API بیاد
    const mockWinners = [
      { name: 'Ahmad R.', prize: '50 AFN', time: '2 min ago', color: '#FF9800' },
      { name: 'Fatima K.', prize: '20 AFN', time: '5 min ago', color: '#4CAF50' },
      { name: 'Ali M.', prize: '🎟️ Ticket', time: '8 min ago', color: '#F44336' },
      { name: 'Zahra S.', prize: '100 AFN', time: '12 min ago', color: '#9C27B0' },
      { name: 'Mohammad A.', prize: '10 AFN', time: '15 min ago', color: '#2196F3' },
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

  // ═══════════════════════════════════════
  //         Buy Ticket Modal
  // ═══════════════════════════════════════
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

  // Qty selector buttons
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

  // Confirm buy
  document.getElementById('confirmBuyBtn')?.addEventListener('click', async () => {
    const qty = parseInt(qtyInput.value, 10) || 1;
    const btn = document.getElementById('confirmBuyBtn');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.request(`/wheel/buy-ticket?count=${qty}`, { method: 'POST' });

      buyModal.style.display = 'none';
      btn.disabled = false;
      btn.textContent = 'Buy Now';

      if (typeof Notifications !== 'undefined') {
        Notifications.success(`✅ ${qty} ticket(s) purchased!`);
      }

      await loadWheelStatus();

    } catch (err) {
      console.error('Buy failed:', err);
      btn.disabled = false;
      btn.textContent = 'Buy Now';

      if (typeof Notifications !== 'undefined') {
        Notifications.error(err.detail || 'Purchase failed');
      }
    }
  });

  // ═══════════════════════════════════════
  //              Confetti
  // ═══════════════════════════════════════
  function fireConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#FFD700', '#FF9800', '#4CAF50', '#9C27B0', '#2196F3', '#F44336'];

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

  // ═══════════════════════════════════════
  //              Init
  // ═══════════════════════════════════════
  await loadWheelStatus();
  await loadRecentWinners();
});