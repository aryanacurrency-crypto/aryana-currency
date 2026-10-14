/* ═══════════════════════════════════════
   ARYANA — P2P (Traders By Traders)
   ═══════════════════════════════════════ */

const P2P = {
  // State
  state: {
    side: 'BUY',
    ads: [],
    stats: null,
    filters: {
      minAmount: null,
      maxAmount: null,
    },
    currentOrder: null,
    timerInterval: null,
  },

  // ═══════════════════════════════════════
  //              Init
  // ═══════════════════════════════════════

  async init() {
    if (!Auth.isLoggedIn()) {
      window.location.href = '../login.html';
      return;
    }

    this.setupHeader();
    this.setupThemeToggle();

    // Detect page
    const path = window.location.pathname;

    if (path.includes('create-ad')) {
      this.initCreateAdPage();
    } else if (path.includes('order.html')) {
      this.initOrderPage();
    } else if (path.includes('my-ads')) {
      this.initMyAdsPage();
    } else if (path.includes('my-orders')) {
      this.initMyOrdersPage();
    } else {
      // index.html
      this.setupTabs();
      this.setupFilterButton();
      await Promise.all([this.loadStats(), this.loadAds()]);
    }
  },

  setupHeader() {
    const user = Auth.getUser();
    if (user) {
      const avatar = document.getElementById('userAvatar');
      const name = document.getElementById('userName');
      if (avatar) avatar.textContent = (user.full_name || user.email || 'U')[0].toUpperCase();
      if (name) name.textContent = user.full_name || user.email || 'User';
    }

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      Auth.logout();
    });
  },

  setupThemeToggle() {
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      if (window.Theme && typeof Theme.toggle === 'function') {
        Theme.toggle();
      } else {
        const html = document.documentElement;
        const isLight = html.classList.contains('light');
        html.classList.remove('light', 'dark');
        html.classList.add(isLight ? 'dark' : 'light');
        localStorage.setItem('aryana_theme', isLight ? 'dark' : 'light');
      }
    });
  },

  // ═══════════════════════════════════════
  //           INDEX PAGE — Tabs
  // ═══════════════════════════════════════

  setupTabs() {
    const tabs = document.querySelectorAll('.p2p-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.state.side = tab.dataset.side;
        this.loadAds();
      });
    });
  },

  setupFilterButton() {
    const btn = document.getElementById('filterBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const minStr = prompt('Minimum amount (USDT):', this.state.filters.minAmount || '');
      if (minStr === null) return;
      const maxStr = prompt('Maximum amount (USDT):', this.state.filters.maxAmount || '');
      if (maxStr === null) return;

      this.state.filters.minAmount = minStr ? parseFloat(minStr) : null;
      this.state.filters.maxAmount = maxStr ? parseFloat(maxStr) : null;
      this.loadAds();
    });
  },

  // ═══════════════════════════════════════
  //              Load Stats
  // ═══════════════════════════════════════

  async loadStats() {
    try {
      const stats = await API.getP2PStats();
      this.state.stats = stats;

      const adsEl = document.getElementById('statAds');
      const tradesEl = document.getElementById('statTrades');
      const volEl = document.getElementById('statVolume');

      if (adsEl) adsEl.textContent = stats.active_ads || 0;
      if (tradesEl) tradesEl.textContent = stats.completed_orders || 0;
      if (volEl) volEl.textContent = this.formatNumber(stats.total_volume_usdt || 0, 0);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  },

  // ═══════════════════════════════════════
  //              Load Ads
  // ═══════════════════════════════════════

  async loadAds() {
    const container = document.getElementById('adsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="p2p-loading">
        <div class="p2p-spinner"></div>
        <span>Loading ads...</span>
      </div>
    `;

    try {
      const params = {
        side: this.state.side === 'BUY' ? 'SELL' : 'BUY',
        limit: 50,
      };
      if (this.state.filters.minAmount) params.min_amount = this.state.filters.minAmount;
      if (this.state.filters.maxAmount) params.max_amount = this.state.filters.maxAmount;

      const ads = await API.getP2PAds(params);
      this.state.ads = ads || [];
      this.renderAds();
    } catch (err) {
      console.error('Failed to load ads:', err);
      container.innerHTML = `
        <div class="p2p-alert danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Failed to load ads. Please try again.</span>
        </div>
      `;
    }
  },

  renderAds() {
    const container = document.getElementById('adsContainer');
    if (!container) return;

    const ads = this.state.ads;

    if (!ads.length) {
      container.innerHTML = `
        <div class="p2p-empty">
          <div class="p2p-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>No ads available</h3>
          <p>There are no active ads for this side right now.</p>
          <a href="create-ad.html" class="p2p-create-btn">Create the first ad</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="p2p-list">${ads.map(ad => this.renderAdCard(ad)).join('')}</div>`;

    container.querySelectorAll('.p2p-ad-buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const adId = parseInt(btn.dataset.adId);
        this.openOrderModal(adId);
      });
    });
  },

  renderAdCard(ad) {
    const sideClass = ad.side === 'SELL' ? 'sell' : 'buy';
    const actionText = ad.side === 'SELL' ? 'Buy' : 'Sell';

    const sellerName = ad.seller_full_name || 'Anonymous';
    const initials = sellerName[0].toUpperCase();
    const trustScore = ad.seller_trust_score || 50;
    const completedTrades = ad.completed_trades || 0;
    const verified = ad.seller_is_verified;

    const available = this.formatNumber(ad.available_amount, 2);
    const rate = this.formatNumber(ad.rate_afn_per_usdt, 2);
    const minOrder = this.formatNumber(ad.min_order_usdt, 2);
    const maxOrder = this.formatNumber(ad.max_order_usdt, 2);

    const verifiedIcon = verified ? `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 12l2 2 4-4"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    ` : '';

    return `
      <div class="p2p-ad-card ${sideClass}">
        <div class="p2p-ad-seller">
          <div class="p2p-seller-info">
            <div class="p2p-seller-avatar">${initials}</div>
            <div>
              <div class="p2p-seller-name">
                ${this.escapeHtml(sellerName)}
                ${verifiedIcon}
              </div>
              <div class="p2p-seller-trades">${completedTrades} trades</div>
            </div>
          </div>
          <div class="p2p-trust-score">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            ${trustScore}%
          </div>
        </div>

        <div class="p2p-ad-divider"></div>

        <div class="p2p-ad-rows">
          <div class="p2p-ad-row">
            <span class="p2p-ad-label">Available</span>
            <span class="p2p-ad-value">${available} USDT</span>
          </div>
          <div class="p2p-ad-row">
            <span class="p2p-ad-label">Rate</span>
            <span class="p2p-ad-value gold">${rate} AFN</span>
          </div>
          <div class="p2p-ad-row">
            <span class="p2p-ad-label">Order Range</span>
            <span class="p2p-ad-value">${minOrder} - ${maxOrder}</span>
          </div>
        </div>

        <div class="p2p-ad-action">
          <div class="p2p-ad-method">
            <svg class="p2p-ad-method-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            ${this.escapeHtml(ad.payment_method || 'Hesab Pay')}
          </div>
          <button class="p2p-ad-buy-btn" data-ad-id="${ad.id}">
            ${actionText}
          </button>
        </div>
      </div>
    `;
  },

  openOrderModal(adId) {
    const ad = this.state.ads.find(a => a.id === adId);
    if (!ad) {
      alert('Ad not found');
      return;
    }

    const maxAvailable = Math.min(ad.max_order_usdt, ad.available_amount);

    const amountStr = prompt(
      `Enter amount of USDT to ${ad.side === 'SELL' ? 'buy' : 'sell'}:\n` +
      `Min: ${this.formatNumber(ad.min_order_usdt, 2)}\n` +
      `Max: ${this.formatNumber(maxAvailable, 2)}`
    );

    if (amountStr === null) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount < ad.min_order_usdt) {
      alert(`Minimum order is ${ad.min_order_usdt} USDT`);
      return;
    }

    if (amount > ad.max_order_usdt) {
      alert(`Maximum order is ${ad.max_order_usdt} USDT`);
      return;
    }

    if (amount > ad.available_amount) {
      alert(`Only ${ad.available_amount} USDT available`);
      return;
    }

    const rate = parseFloat(ad.rate_afn_per_usdt);
    const feePct = this.getFeePercent(amount);
    const sellerFee = amount * (feePct / 100);
    const buyerReceives = amount - sellerFee;
    const baseAfn = buyerReceives * rate;
    const buyerFeeAfn = baseAfn * (feePct / 100);
    const totalPay = baseAfn + buyerFeeAfn;

    const confirmMsg =
      `Confirm order:\n\n` +
      `Amount: ${amount.toFixed(2)} USDT\n` +
      `Rate: ${rate.toFixed(2)} AFN\n` +
      `You receive: ${buyerReceives.toFixed(2)} USDT\n` +
      `You pay: ${this.formatNumber(totalPay, 2)} AFN\n\n` +
      `Proceed?`;

    if (!confirm(confirmMsg)) return;

    this.createOrder(adId, amount);
  },

  async createOrder(adId, amount) {
    try {
      const order = await API.createP2POrder(adId, amount);
      window.location.href = `order.html?id=${order.id}`;
    } catch (err) {
      console.error('Create order failed:', err);
      alert(err.detail || 'Failed to create order');
    }
  },

  // ═══════════════════════════════════════
  //           CREATE-AD PAGE
  // ═══════════════════════════════════════

  initCreateAdPage() {
    const form = document.getElementById('createAdForm');
    if (!form) return;

    const inputs = ['totalAmount', 'rate', 'minOrder', 'maxOrder'];
    inputs.forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.updateCreateAdSummary());
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitCreateAd();
    });

    this.updateCreateAdSummary();
  },

  updateCreateAdSummary() {
    const totalAmount = parseFloat(document.getElementById('totalAmount')?.value) || 0;
    const rate = parseFloat(document.getElementById('rate')?.value) || 0;

    const feePercentEl = document.getElementById('sumFeePercent');
    const feeAmountEl = document.getElementById('sumFeeAmount');
    const buyerReceivesEl = document.getElementById('sumBuyerReceives');
    const sellerReceivesEl = document.getElementById('sumSellerReceives');

    if (!totalAmount || !rate) {
      if (feePercentEl) feePercentEl.textContent = '—';
      if (feeAmountEl) feeAmountEl.textContent = '—';
      if (buyerReceivesEl) buyerReceivesEl.textContent = '—';
      if (sellerReceivesEl) sellerReceivesEl.textContent = '—';
      return;
    }

    const feePct = this.getFeePercent(totalAmount);
    const sellerFee = totalAmount * (feePct / 100);
    const buyerReceives = totalAmount - sellerFee;
    const sellerReceivesAfn = buyerReceives * rate;

    if (feePercentEl) feePercentEl.textContent = `${feePct.toFixed(2)}%`;
    if (feeAmountEl) feeAmountEl.textContent = `${sellerFee.toFixed(2)} USDT`;
    if (buyerReceivesEl) buyerReceivesEl.textContent = `${buyerReceives.toFixed(2)} USDT`;
    if (sellerReceivesEl) sellerReceivesEl.textContent = `${this.formatNumber(sellerReceivesAfn, 2)} AFN`;
  },

  async submitCreateAd() {
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');

    const totalAmount = parseFloat(document.getElementById('totalAmount')?.value) || 0;
    const rate = parseFloat(document.getElementById('rate')?.value) || 0;
    const minOrder = parseFloat(document.getElementById('minOrder')?.value) || 0;
    const maxOrder = parseFloat(document.getElementById('maxOrder')?.value) || 0;
    const terms = document.getElementById('terms')?.value || null;

    // Validation
    const errors = [];
    if (totalAmount < 10) errors.push('Minimum amount is 10 USDT');
    if (rate <= 0) errors.push('Rate must be greater than 0');
    if (minOrder <= 0) errors.push('Min order must be greater than 0');
    if (maxOrder < minOrder) errors.push('Max order cannot be less than min order');
    if (maxOrder > totalAmount) errors.push('Max order cannot exceed total amount');

    if (errors.length) {
      this.showAlert(alertBox, 'danger', errors.join('. '));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="p2p-spinner" style="border-top-color: var(--text-inverse);"></div>
      <span>Creating...</span>
    `;

    try {
      const ad = await API.createP2PAd({
        side: 'SELL',
        total_amount: totalAmount,
        rate_afn_per_usdt: rate,
        min_order_usdt: minOrder,
        max_order_usdt: maxOrder,
        payment_method: 'Hesab Pay',
        terms: terms,
      });

      this.showAlert(alertBox, 'success', 'Ad created successfully! Redirecting...');

      setTimeout(() => {
        window.location.href = 'my-ads.html';
      }, 1200);
    } catch (err) {
      console.error('Create ad failed:', err);
      this.showAlert(alertBox, 'danger', err.detail || 'Failed to create ad');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Create Ad</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      `;
    }
  },

  // ═══════════════════════════════════════
  //           ORDER PAGE
  // ═══════════════════════════════════════

  async initOrderPage() {
    const params = new URLSearchParams(window.location.search);
    const orderId = parseInt(params.get('id'));

    if (!orderId) {
      this.showOrderError('Order ID not found');
      return;
    }

    await this.loadOrderDetail(orderId);
  },

  async loadOrderDetail(orderId) {
    const container = document.getElementById('orderContainer');
    if (!container) return;

    try {
      const order = await API.getMyP2POrderDetail(orderId);
      this.state.currentOrder = order;

      const refEl = document.getElementById('orderRef');
      if (refEl) refEl.textContent = order.reference;

      this.renderOrderDetail(order);
      this.startTimer(order);
    } catch (err) {
      console.error('Load order failed:', err);
      this.showOrderError(err.detail || 'Failed to load order');
    }
  },

  renderOrderDetail(order) {
    const container = document.getElementById('orderContainer');
    if (!container) return;

    const currentUserId = Auth.getUser()?.id;
    const isBuyer = order.buyer_id === currentUserId;
    const isSeller = order.seller_id === currentUserId;

    const statusLabels = {
      'PENDING_PAYMENT': 'Awaiting Payment',
      'PAYMENT_REVIEW': 'Payment Under Review',
      'READY_TO_RELEASE': 'Ready to Release',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      'EXPIRED': 'Expired',
      'DISPUTED': 'In Dispute',
    };

    const statusClasses = {
      'PENDING_PAYMENT': 'pending',
      'PAYMENT_REVIEW': 'review',
      'READY_TO_RELEASE': 'review',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'cancelled',
      'DISPUTED': 'disputed',
    };

    const statusLabel = statusLabels[order.status] || order.status;
    const statusClass = statusClasses[order.status] || 'pending';

    // Timer (only for pending payment)
    const showTimer = order.status === 'PENDING_PAYMENT';

    // Payment info section (only for buyer, only when PENDING_PAYMENT)
    const showPaymentSection = isBuyer && order.status === 'PENDING_PAYMENT';

    // Payment review (buyer, after submit)
    const showReviewSection = isBuyer && order.status === 'PAYMENT_REVIEW';

    // Seller waiting section
    const showSellerWait = isSeller && (
      order.status === 'PENDING_PAYMENT' ||
      order.status === 'PAYMENT_REVIEW' ||
      order.status === 'READY_TO_RELEASE'
    );

    // Completed section
    const showCompleted = order.status === 'COMPLETED';

    const html = `
      <div style="max-width: 640px; margin: 0 auto;">

        <div class="p2p-timer ${showTimer ? '' : 'danger'}" id="timerBox" style="${showTimer ? '' : 'display:none;'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Time remaining</span>
          <span class="p2p-timer-value" id="timerValue">--:--</span>
        </div>

        <div class="p2p-form-card" style="max-width: 100%; margin-bottom: 16px;">

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Status</div>
              <div style="font-size: 18px; font-weight: 800;">${statusLabel}</div>
            </div>
            <div class="p2p-status-badge ${statusClass}">${order.status.replace(/_/g, ' ')}</div>
          </div>

          <div class="p2p-ad-divider"></div>

          <div class="p2p-ad-rows">
            <div class="p2p-ad-row">
              <span class="p2p-ad-label">Amount</span>
              <span class="p2p-ad-value">${this.formatNumber(order.amount_usdt, 2)} USDT</span>
            </div>
            <div class="p2p-ad-row">
              <span class="p2p-ad-label">Rate</span>
              <span class="p2p-ad-value">${this.formatNumber(order.rate_afn_per_usdt, 2)} AFN</span>
            </div>
            <div class="p2p-ad-row">
              <span class="p2p-ad-label">Buyer Receives</span>
              <span class="p2p-ad-value gold">${this.formatNumber(order.buyer_receives_usdt, 2)} USDT</span>
            </div>
            <div class="p2p-ad-row">
              <span class="p2p-ad-label">Total Payment</span>
              <span class="p2p-ad-value">${this.formatNumber(order.total_payment_afn, 2)} AFN</span>
            </div>
          </div>

          <div class="p2p-ad-divider"></div>

          <div class="p2p-ad-rows">
            <div class="p2p-ad-row">
              <span class="p2p-ad-label">Buyer</span>
              <span class="p2p-ad-value">${this.escapeHtml(order.buyer_full_name || '—')} ${isBuyer ? '(You)' : ''}</span>
            </div>
            <div class="p2p-ad-row">
              <span class="p2p-ad-label">Seller</span>
              <span class="p2p-ad-value">${this.escapeHtml(order.seller_full_name || '—')} ${isSeller ? '(You)' : ''}</span>
            </div>
          </div>

        </div>

        ${showPaymentSection ? this.renderPaymentSection(order) : ''}

        ${showReviewSection ? `
          <div class="p2p-form-card" style="max-width: 100%;">
            <div class="p2p-alert info" style="margin: 0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Your payment is under review. Please wait for admin confirmation.</span>
            </div>
          </div>
        ` : ''}

        ${showSellerWait ? `
          <div class="p2p-form-card" style="max-width: 100%;">
            <div class="p2p-alert warning" style="margin: 0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Waiting for buyer to complete payment.</span>
            </div>
          </div>
        ` : ''}

        ${showCompleted ? `
          <div class="p2p-form-card" style="max-width: 100%;">
            <div class="p2p-alert success" style="margin: 0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Trade completed successfully!</span>
            </div>
          </div>
        ` : ''}

      </div>
    `;

    container.innerHTML = html;

    // Attach event handlers
    if (showPaymentSection) {
      document.getElementById('submitPaymentBtn')?.addEventListener('click', () => this.submitPayment());
      document.getElementById('copyAddressBtn')?.addEventListener('click', () => this.copyAddress());
      document.getElementById('cancelOrderBtn')?.addEventListener('click', () => this.cancelOrder());
    }
  },

  renderPaymentSection(order) {
    return `
      <div class="p2p-form-card" style="max-width: 100%;">

        <div style="font-size: 15px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-flex; width: 24px; height: 24px; border-radius: 50%; background: var(--gold); color: var(--text-inverse); align-items: center; justify-content: center; font-size: 13px; font-weight: 800;">1</span>
          Complete Your Payment
        </div>

        <div class="p2p-alert warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Send exactly <strong>${this.formatNumber(order.total_payment_afn, 2)} AFN</strong> to the ARYANA escrow account below.</span>
        </div>

        <div class="p2p-summary-box">
          <div class="p2p-summary-row">
            <span>Amount to Pay</span>
            <span style="color: var(--gold); font-weight: 800; font-size: 16px;">${this.formatNumber(order.total_payment_afn, 2)} AFN</span>
          </div>
          <div class="p2p-summary-row">
            <span>Payment Method</span>
            <span>${this.escapeHtml(order.seller_payment_method || 'Hesab Pay')}</span>
          </div>
          <div class="p2p-summary-row">
            <span>Account</span>
            <span style="font-family: var(--font-mono);">ARYANA ESCROW</span>
          </div>
        </div>

        <div class="p2p-field">
          <div class="p2p-field-label">
            <span>Payment Reference (TxID / Receipt #)</span>
          </div>
          <div class="p2p-field-input-wrap">
            <input
              type="text"
              id="paymentReference"
              class="p2p-field-input"
              placeholder="Enter transaction reference"
              autocomplete="off"
            >
          </div>
        </div>

        <div class="p2p-field">
          <div class="p2p-field-label">
            <span>Note (optional)</span>
          </div>
          <div class="p2p-field-input-wrap">
            <input
              type="text"
              id="paymentNote"
              class="p2p-field-input"
              placeholder="Additional info"
              maxlength="200"
              autocomplete="off"
            >
          </div>
        </div>

        <button type="button" class="p2p-submit-btn" id="submitPaymentBtn">
          <span>I've Paid</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>

        <button type="button" class="p2p-filter-btn" id="cancelOrderBtn" style="width: 100%; justify-content: center; margin-top: 12px;">
          Cancel Order
        </button>
      </div>
    `;
  },

  async submitPayment() {
    const order = this.state.currentOrder;
    if (!order) return;

    const ref = document.getElementById('paymentReference')?.value?.trim();
    const note = document.getElementById('paymentNote')?.value?.trim() || null;

    if (!ref || ref.length < 3) {
      alert('Please enter a valid payment reference');
      return;
    }

    const btn = document.getElementById('submitPaymentBtn');
    btn.disabled = true;
    btn.innerHTML = `<div class="p2p-spinner" style="border-top-color: var(--text-inverse);"></div><span>Submitting...</span>`;

    try {
      await API.submitP2PPayment(order.id, ref, note);
      alert('Payment submitted! Waiting for admin review.');
      window.location.reload();
    } catch (err) {
      console.error('Submit payment failed:', err);
      alert(err.detail || 'Failed to submit payment');
      btn.disabled = false;
      btn.innerHTML = `<span>I've Paid</span>`;
    }
  },

  async cancelOrder() {
    const order = this.state.currentOrder;
    if (!order) return;

    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await API.cancelP2POrder(order.id, 'Cancelled by user');
      alert('Order cancelled');
      window.location.href = 'my-orders.html';
    } catch (err) {
      alert(err.detail || 'Failed to cancel');
    }
  },

  startTimer(order) {
    if (order.status !== 'PENDING_PAYMENT') return;

    const expiresAt = new Date(order.expires_at).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      const timerValue = document.getElementById('timerValue');
      const timerBox = document.getElementById('timerBox');

      if (diff <= 0) {
        if (timerValue) timerValue.textContent = 'EXPIRED';
        if (timerBox) timerBox.classList.add('danger');
        clearInterval(this.state.timerInterval);
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (timerValue) timerValue.textContent = `${mins}:${String(secs).padStart(2, '0')}`;

      if (diff < 120000 && timerBox) {
        timerBox.classList.add('danger');
      }
    };

    tick();
    this.state.timerInterval = setInterval(tick, 1000);
  },

  showOrderError(msg) {
    const container = document.getElementById('orderContainer');
    if (container) {
      container.innerHTML = `
        <div class="p2p-alert danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>${this.escapeHtml(msg)}</span>
        </div>
      `;
    }
  },

  // ═══════════════════════════════════════
  //           MY ADS / MY ORDERS (placeholders)
  // ═══════════════════════════════════════

  async initMyAdsPage() {
    const container = document.getElementById('myAdsContainer');
    if (!container) return;

    try {
      const ads = await API.getMyP2PAds();
      this.renderMyAds(ads || []);
    } catch (err) {
      container.innerHTML = `<div class="p2p-alert danger"><span>Failed to load your ads</span></div>`;
    }
  },

  renderMyAds(ads) {
    const container = document.getElementById('myAdsContainer');
    if (!container) return;

    if (!ads.length) {
      container.innerHTML = `
        <div class="p2p-empty">
          <div class="p2p-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3>No ads yet</h3>
          <p>You haven't created any ads.</p>
          <a href="create-ad.html" class="p2p-create-btn">Create Ad</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="p2p-list">${ads.map(ad => this.renderAdCard(ad)).join('')}</div>`;
  },

  async initMyOrdersPage() {
    const container = document.getElementById('myOrdersContainer');
    if (!container) return;

    try {
      const orders = await API.getMyP2POrders();
      this.renderMyOrders(orders || []);
    } catch (err) {
      container.innerHTML = `<div class="p2p-alert danger"><span>Failed to load orders</span></div>`;
    }
  },

  renderMyOrders(orders) {
    const container = document.getElementById('myOrdersContainer');
    if (!container) return;

    if (!orders.length) {
      container.innerHTML = `
        <div class="p2p-empty">
          <div class="p2p-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3>No orders yet</h3>
          <p>You haven't made any P2P orders.</p>
          <a href="index.html" class="p2p-create-btn">Browse Ads</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="p2p-orders-list">${orders.map(o => this.renderOrderCard(o)).join('')}</div>`;
  },

  renderOrderCard(order) {
    const statusClass = {
      'PENDING_PAYMENT': 'pending',
      'PAYMENT_REVIEW': 'review',
      'READY_TO_RELEASE': 'review',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'cancelled',
      'DISPUTED': 'disputed',
    }[order.status] || 'pending';

    return `
      <a href="order.html?id=${order.id}" class="p2p-order-card">
        <div class="p2p-order-header">
          <span class="p2p-order-ref">${this.escapeHtml(order.reference)}</span>
          <span class="p2p-status-badge ${statusClass}">${order.status.replace(/_/g, ' ')}</span>
        </div>
        <div class="p2p-ad-rows">
          <div class="p2p-ad-row">
            <span class="p2p-ad-label">Amount</span>
            <span class="p2p-ad-value">${this.formatNumber(order.amount_usdt, 2)} USDT</span>
          </div>
          <div class="p2p-ad-row">
            <span class="p2p-ad-label">Total</span>
            <span class="p2p-ad-value gold">${this.formatNumber(order.total_payment_afn, 2)} AFN</span>
          </div>
        </div>
      </a>
    `;
  },

  // ═══════════════════════════════════════
  //              Helpers
  // ═══════════════════════════════════════

  getFeePercent(amount) {
    if (amount <= 100) return 1.5;
    if (amount <= 500) return 1.25;
    return 1.0;
  },

  formatNumber(value, decimals = 2) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  showAlert(box, type, msg) {
    if (!box) return;
    box.style.display = 'block';
    box.className = `p2p-alert ${type}`;
    box.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span>${this.escapeHtml(msg)}</span>
    `;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  P2P.init();
});

window.P2P = P2P;