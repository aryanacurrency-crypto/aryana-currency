/* ═══════════════════════════════════════
   ARYANA CURRENCY — Order Detail v3
   Light · Navy-Purple · Auto-Refresh
   ═══════════════════════════════════════ */

let currentOrder = null;
let paymentInfo = null;
let orderId = null;
let refreshInterval = null;

const REFRESH_INTERVAL = 15000; // 15s

/* ═══════════════════════════════════════
   🚀 INIT
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // ─── Logout ───
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // ─── Theme toggle ───
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => Theme.toggle());

  showAdminButton();
  renderUserInfo();

  // ─── Copy ref (top) ───
  const refCopy = document.getElementById('refCopy');
  if (refCopy) {
    refCopy.addEventListener('click', () => {
      const ref = document.getElementById('orderRef')?.textContent;
      if (ref && ref !== '—') copyText(ref, refCopy);
    });
  }

  // ─── Setup copy buttons ───
  setupCopyButtons();

  // ─── Get order ID from URL ───
  const params = new URLSearchParams(window.location.search);
  orderId = params.get('id');

  if (!orderId) {
    showError('Order ID missing.');
    return;
  }

  // ─── Load ───
  try {
    const [order, pInfo] = await Promise.all([
      API.getMyOrder(orderId),
      API.getPaymentInfo().catch(() => null),
    ]);

    currentOrder = order;
    paymentInfo = pInfo;

    render();

    // ─── Start auto-refresh (اگه order در جریانه) ───
    if (isOrderActive(order.status)) {
      startOrderPolling();
    }

  } catch (err) {
    console.error('Load error:', err);
    showError(err.detail || 'Could not load order.');
  }
});

/* ═══════════════════════════════════════
   👤 USER HELPERS
   ═══════════════════════════════════════ */

function showAdminButton() {
  const user = Auth.getUser();
  const btn = document.getElementById('adminPanelBtn');
  if (btn && user && user.role === 'ADMIN') {
    btn.style.display = 'grid';
  }
}

function renderUserInfo() {
  const user = Auth.getUser();
  if (!user) return;

  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = (user.full_name || 'User').split(' ')[0];
}

/* ═══════════════════════════════════════
   🔄 AUTO-REFRESH
   ═══════════════════════════════════════ */

function isOrderActive(status) {
  return ['PENDING', 'AWAITING_REVIEW', 'PROCESSING'].includes(status);
}

function startOrderPolling() {
  if (refreshInterval) clearInterval(refreshInterval);

  refreshInterval = setInterval(async () => {
    if (document.hidden) return;
    if (!currentOrder || !orderId) return;

    try {
      const fresh = await API.getMyOrder(orderId);

      // اگه status عوض شد → reload
      if (fresh.status !== currentOrder.status) {
        Notify.success('Order status updated!');
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      // اگه دیگه فعال نیست → متوقف کن
      if (!isOrderActive(fresh.status)) {
        clearInterval(refreshInterval);
      }
    } catch (err) {
      // silent
    }
  }, REFRESH_INTERVAL);
}

/* ═══════════════════════════════════════
   🎨 RENDER
   ═══════════════════════════════════════ */

function render() {
  document.getElementById('loadingBox').style.display = 'none';
  document.getElementById('contentBox').style.display = 'block';

  const o = currentOrder;
  const isBuy = o.side === 'BUY';

  // Ref
  setText('orderRef', o.reference);

  // Status banner
  renderStatusBanner(o.status);

  // Progress timeline (با تأخیر کوچیک برای انیمیشن)
  setTimeout(() => renderProgress(o.status), 80);

  // Order summary
  setText('detailSide', isBuy ? '▲ BUY USDT' : '▼ SELL USDT');
  const sideEl = document.getElementById('detailSide');
  if (sideEl) sideEl.className = 'detail-value ' + (isBuy ? 'buy' : 'sell');

  const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

  setText('detailAmount', `${fmt(o.amount_usdt)} USDT`);
  setText('detailRate', `${fmt(o.rate_afn_per_usdt)} AFN`);
  setText('detailGross', `${fmt(o.gross_afn)} AFN`);
  setText('detailFee', `${fmt(o.fee_afn)} AFN`);
  setText('detailTotal', `${fmt(o.net_afn)} AFN`);
  setText('detailTotalLabel', isBuy ? 'Total to Pay' : 'Total to Receive');

  // ─── Payment Section ───
  if (o.status === 'PENDING' && paymentInfo) {
    renderPaymentSection(o, isBuy, fmt);
    document.getElementById('paymentBox').style.display = 'block';
    document.getElementById('submitBox').style.display = 'block';
    document.getElementById('cancelBox').style.display = 'flex';
    setupSubmitForm();
    setupCancelButton();
  } else {
    document.getElementById('paymentBox').style.display = 'none';
    document.getElementById('submitBox').style.display = 'none';
    document.getElementById('cancelBox').style.display = 'none';
  }

  // ─── User submitted ref ───
  if (o.user_payment_reference) {
    document.getElementById('userRefBox').style.display = 'block';
    setText('userRefValue', o.user_payment_reference);

    if (o.user_note) {
      const noteRow = document.getElementById('userNoteRow');
      if (noteRow) noteRow.style.display = 'flex';
      setText('userNoteValue', o.user_note);
    }
  }

  // ─── Admin note ───
  if (o.admin_note) {
    document.getElementById('adminNoteBox').style.display = 'block';
    const box = document.getElementById('adminNoteBox');
    const label = document.getElementById('adminNoteLabel');

    if (o.status === 'REJECTED' || o.status === 'CANCELLED') {
      box.classList.remove('info');
      if (label) label.textContent = 'Rejection Reason';
    } else {
      box.classList.add('info');
      if (label) label.textContent = 'Admin Note';
    }

    setText('adminNoteText', o.admin_note);
  }
}

/* ═══════════════════════════════════════
   📢 STATUS BANNER
   ═══════════════════════════════════════ */

function renderStatusBanner(status) {
  const banner = document.getElementById('statusBanner');
  const icon = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  const text = document.getElementById('statusText');

  if (!banner) return;

  banner.className = 'status-banner';

  const config = {
    'PENDING': {
      cls: 'pending', icon: '⏳',
      title: 'Awaiting Payment',
      text: 'Send the exact amount using the instructions below, then submit the transaction reference.',
    },
    'AWAITING_REVIEW': {
      cls: 'review', icon: '🔍',
      title: 'Under Review',
      text: 'Your payment reference has been submitted. Our team is verifying it now.',
    },
    'PROCESSING': {
      cls: 'processing', icon: '⚙',
      title: 'Processing',
      text: 'Payment verified. We are sending your funds.',
    },
    'COMPLETED': {
      cls: 'completed', icon: '✓',
      title: 'Order Completed',
      text: 'Your funds have been delivered successfully. Thank you for using Aryana Currency!',
    },
    'CANCELLED': {
      cls: 'cancelled', icon: '✕',
      title: 'Order Cancelled',
      text: 'This order was cancelled. You can create a new one anytime.',
    },
    'REJECTED': {
      cls: 'rejected', icon: '✕',
      title: 'Order Rejected',
      text: 'This order was rejected by our team. Check the note below for details.',
    },
  };

  const c = config[status] || config.PENDING;
  banner.classList.add(c.cls);
  if (icon) icon.textContent = c.icon;
  if (title) title.textContent = c.title;
  if (text) text.textContent = c.text;
}

/* ═══════════════════════════════════════
   🎯 PROGRESS TIMELINE
   ═══════════════════════════════════════ */

function renderProgress(status) {
  const stages = ['PENDING', 'AWAITING_REVIEW', 'PROCESSING', 'COMPLETED'];
  const currentIdx = stages.indexOf(status);

  // Reset all
  document.querySelectorAll('.progress-stage').forEach((el) => {
    el.classList.remove('done', 'active', 'cancelled', 'rejected');
  });
  document.querySelectorAll('.progress-line').forEach((el) => {
    el.classList.remove('done', 'active');
  });

  // ─── Cancelled / Rejected: همه سرخ ───
  if (status === 'CANCELLED' || status === 'REJECTED') {
    document.querySelectorAll('.progress-stage').forEach((el) => {
      el.classList.add(status === 'REJECTED' ? 'rejected' : 'cancelled');
    });
    return;
  }

  // ─── Normal flow ───
  document.querySelectorAll('.progress-stage').forEach((el) => {
    const stage = el.dataset.stage;
    const idx = stages.indexOf(stage);
    const dot = el.querySelector('.progress-stage-dot');

    if (idx < currentIdx) {
      el.classList.add('done');
      if (dot) dot.textContent = '✓';
    } else if (idx === currentIdx) {
      el.classList.add('active');
      if (dot) dot.textContent = (idx + 1).toString();
    } else {
      if (dot) dot.textContent = (idx + 1).toString();
    }
  });

  // Lines
  document.querySelectorAll('.progress-line').forEach((el) => {
    const lineNum = parseInt(el.dataset.line);
    if (lineNum <= currentIdx) {
      el.classList.add('done');
    }
  });

  // Info steps (کنار)
  document.querySelectorAll('.info-step').forEach((el) => {
    const stage = el.dataset.step;
    const idx = stages.indexOf(stage);
    const num = el.querySelector('.info-step-num');

    el.classList.remove('done', 'active');
    if (idx < currentIdx) {
      el.classList.add('done');
      if (num) num.textContent = '✓';
    } else if (idx === currentIdx) {
      el.classList.add('active');
      if (num) num.textContent = (idx + 1).toString();
    } else {
      if (num) num.textContent = (idx + 1).toString();
    }
  });
}

/* ═══════════════════════════════════════
   💳 PAYMENT SECTION
   ═══════════════════════════════════════ */

function renderPaymentSection(order, isBuy, fmt) {
  const afnSection = document.getElementById('afnPaymentSection');
  const usdtSection = document.getElementById('usdtPaymentSection');

  if (isBuy) {
    // ─── BUY: کاربر AFN میده ───
    afnSection.style.display = 'block';
    usdtSection.style.display = 'none';

    setText('platformHesabPay', paymentInfo.hesab_pay || '—');
    setText('platformAmount', `${fmt(order.net_afn)} AFN`);

    setText('paymentSubtitle', 'Send AFN via Hesab Pay to complete your purchase');

    const warning = document.getElementById('paymentWarning');
    if (warning) {
      warning.innerHTML = `⚠ After sending <strong>${fmt(order.net_afn)} AFN</strong> via Hesab Pay, copy the transaction reference and paste it in the form below.`;
    }

    setText('refLabel', 'Hesab Pay Transaction Reference');
    setText('refHint', 'Paste the transaction ID from your Hesab Pay app.');

    setText('infoStep1Text', 'Transfer the AFN amount via Hesab Pay.');
    setText('infoStep2Text', 'Copy the transaction reference from Hesab Pay.');
    setText('infoStep3Text', 'Our team verifies your payment.');
    setText('infoStep4Text', 'USDT is sent to your wallet.');

  } else {
    // ─── SELL: کاربر USDT میده ───
    afnSection.style.display = 'none';
    usdtSection.style.display = 'block';

    setText('platformWallet', paymentInfo.usdt_wallet || '—');
    setText('platformUsdtAmount', `${fmt(order.amount_usdt)} USDT`);

    setText('paymentSubtitle', 'Send USDT via TRC20 network to complete your sale');

    const warning = document.getElementById('paymentWarning');
    if (warning) {
      warning.innerHTML = `⚠ Send exactly <strong>${fmt(order.amount_usdt)} USDT</strong> via TRC20 network, then paste the transaction hash (TXID) in the form below.`;
    }

    setText('refLabel', 'USDT Transaction Hash (TXID)');
    setText('refHint', 'Paste the TXID from your wallet app.');

    setText('infoStep1Text', 'Send USDT to the wallet address above.');
    setText('infoStep2Text', 'Copy the TXID from your wallet.');
    setText('infoStep3Text', 'Our team verifies the transfer.');
    setText('infoStep4Text', 'AFN is sent to your Hesab Pay.');
  }
}

/* ═══════════════════════════════════════
   📋 COPY BUTTONS
   ═══════════════════════════════════════ */

function setupCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.copy;
      const target = document.getElementById(targetId);
      if (!target) return;

      const text = target.textContent;
      if (!text || text === '—') return;

      copyText(text, btn);
    });
  });
}

function copyText(text, btnEl) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopied(btnEl);
    }).catch(() => {
      fallbackCopy(text, btnEl);
    });
  } else {
    fallbackCopy(text, btnEl);
  }
}

function fallbackCopy(text, btnEl) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    showCopied(btnEl);
  } catch (err) {
    Notify.error('Could not copy.');
  }

  document.body.removeChild(textarea);
}

function showCopied(btnEl) {
  if (!btnEl) {
    Notify.success('Copied!');
    return;
  }

  const origHtml = btnEl.innerHTML;
  btnEl.classList.add('copied');
  btnEl.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>Copied</span>
  `;

  setTimeout(() => {
    btnEl.classList.remove('copied');
    btnEl.innerHTML = origHtml;
  }, 1500);
}

/* ═══════════════════════════════════════
   📤 SUBMIT FORM
   ═══════════════════════════════════════ */

function setupSubmitForm() {
  const form = document.getElementById('submitForm');
  const btn = document.getElementById('submitPaymentBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ref = document.getElementById('paymentRef').value.trim();
    const note = document.getElementById('paymentNote').value.trim() || null;

    if (!ref) {
      Notify.warning('Please enter the transaction reference.');
      return;
    }

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.submitPayment(currentOrder.id, ref, note);
      Notify.success('Payment submitted! Awaiting verification.');

      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err) {
      console.error('Submit failed:', err);
      Notify.error(err.detail || 'Failed to submit payment.');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
   ❌ CANCEL ORDER
   ═══════════════════════════════════════ */

function setupCancelButton() {
  const btn = document.getElementById('cancelOrderBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const ok = await Notify.confirm({
      title: 'Cancel this order?',
      message: 'This action cannot be undone. You will need to create a new order if you change your mind.',
      type: 'warning',
    });

    if (!ok) return;

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.cancelOrder(currentOrder.id);
      Notify.warning('Order cancelled.');

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Cancel failed:', err);
      Notify.error(err.detail || 'Failed to cancel order.');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

/* ═══════════════════════════════════════
   ⚠️ ERROR
   ═══════════════════════════════════════ */

function showError(msg) {
  document.getElementById('loadingBox').style.display = 'none';
  const box = document.getElementById('contentBox');
  box.style.display = 'block';
  box.innerHTML = `
    <div class="alert alert-danger" style="margin-top:40px;">
      ${msg}
    </div>
    <div style="text-align:center; margin-top:20px;">
      <a href="orders.html" class="btn btn-outline" style="display:inline-flex;padding:12px 20px;background:transparent;color:#1E40AF;border:1.5px solid rgba(30,64,175,0.3);border-radius:12px;font-size:13px;font-weight:800;text-decoration:none;">
        ← Back to Orders
      </a>
    </div>
  `;
}

/* ═══════════════════════════════════════
   🧹 CLEANUP
   ═══════════════════════════════════════ */

window.addEventListener('beforeunload', () => {
  if (refreshInterval) clearInterval(refreshInterval);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentOrder && isOrderActive(currentOrder.status)) {
    startOrderPolling();
  }
});

/* ═══════════════════════════════════════
   🌍 EXPOSE
   ═══════════════════════════════════════ */

window.Order = {
  reload: () => window.location.reload(),
};

/* ═══════════════════════════════════════
   🛠️ HELPERS
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}