/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Order Detail v2
   Complete or reject orders
   ═══════════════════════════════════════ */

let currentOrder = null;
let orderUser = null;

/* ═══════════════════════════════════════
              Init
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // صبر کن common.js init بشه
  await new Promise(resolve => setTimeout(resolve, 100));

  // Copy ref
  const refCopy = document.getElementById('refCopy');
  if (refCopy) {
    refCopy.addEventListener('click', () => {
      const ref = document.getElementById('orderRef')?.textContent;
      if (ref && ref !== '—') copyText(ref);
    });
  }

  // Copy user ref
  const copyUserRefBtn = document.getElementById('copyUserRefBtn');
  if (copyUserRefBtn) {
    copyUserRefBtn.addEventListener('click', () => {
      const ref = document.getElementById('userRefValue')?.textContent;
      if (ref && ref !== '—') copyText(ref, copyUserRefBtn);
    });
  }

  // Load order
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');

  if (!orderId) {
    showError('Order ID missing.');
    return;
  }

  try {
    currentOrder = await API.getAdminOrderDetail(orderId);

    // Load user
    try {
      orderUser = await API.getUserDetail(currentOrder.user_id);
    } catch {
      orderUser = null;
    }

    render();

  } catch (err) {
    console.error('Load error:', err);
    showError(err.detail || 'Could not load order.');
  }
});

/* ═══════════════════════════════════════
              Render
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

  // Timeline
  renderTimeline(o.status);

  // User info
  if (orderUser) {
    setText('userName', orderUser.full_name || '—');
    setText('userEmail', orderUser.email || '—');
    setText('userPhone', orderUser.phone || '—');
    setText('userHesabPay', orderUser.hesab_pay_number || '—');
    setText('userWallet', orderUser.usdt_wallet_address || '—');

    // KYC badge
    const kycEl = document.getElementById('userKyc');
    if (kycEl) {
      if (orderUser.is_verified) {
        kycEl.innerHTML = `<span class="kyc-inline verified">✓ Verified</span>`;
      } else {
        kycEl.innerHTML = `<span class="kyc-inline unverified">Not Verified</span>`;
      }
    }
  }

  // Order summary
  const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

  const sideEl = document.getElementById('detailSide');
  if (sideEl) {
    sideEl.innerHTML = AdminCommon.sideBadge(o.side);
  }

  setText('detailAmount', `${fmt(o.amount_usdt)} USDT`);
  setText('detailRate', `${fmt(o.rate_afn_per_usdt)} AFN`);
  setText('detailGross', `${fmt(o.gross_afn)} AFN`);
  setText('detailFee', `${fmt(o.fee_afn)} AFN`);
  setText('detailTotal', `${fmt(o.net_afn)} AFN`);
  setText('detailTotalLabel', isBuy ? 'Total Paid' : 'Total Received');

  // User submitted ref
  if (o.user_payment_reference) {
    document.getElementById('userRefCard').style.display = 'block';
    setText('userRefValue', o.user_payment_reference);

    const refLabel = document.getElementById('refBoxLabel');
    if (refLabel) {
      refLabel.textContent = isBuy
        ? 'Hesab Pay Transaction Reference'
        : 'USDT Transaction Hash (TXID)';
    }

    if (o.user_note) {
      const noteText = document.getElementById('userNoteText');
      if (noteText) {
        noteText.style.display = 'block';
        noteText.textContent = `Note: ${o.user_note}`;
      }
    }
  }

  // Actions (only for AWAITING_REVIEW or PROCESSING)
  if (o.status === 'AWAITING_REVIEW' || o.status === 'PROCESSING') {
    document.getElementById('actionsCard').style.display = 'block';

    // Platform ref label
    const refLabel = document.getElementById('platformRefLabel');
    if (refLabel) {
      refLabel.textContent = isBuy
        ? 'USDT TXID (You sent to user)'
        : 'Hesab Pay Reference (You sent to user)';
    }

    const hint = document.getElementById('platformRefHint');
    if (hint) {
      hint.textContent = isBuy
        ? 'The TXID of the USDT you sent to the user\'s wallet.'
        : 'The reference of the Hesab Pay payment you sent to the user.';
    }

    // Setup buttons
    document.getElementById('completeBtn').addEventListener('click', handleComplete);
    document.getElementById('rejectBtn').addEventListener('click', handleReject);
  }

  // Admin note (for completed/rejected/cancelled)
  if (o.admin_note || o.rejection_reason) {
    document.getElementById('adminNoteBox').style.display = 'block';

    const box = document.getElementById('adminNoteBox');
    const label = document.getElementById('adminNoteLabel');

    if (o.status === 'REJECTED' || o.status === 'CANCELLED') {
      box.classList.remove('info');
      if (label) label.textContent = 'Rejection Reason';
      setText('adminNoteText', o.rejection_reason || o.admin_note || '—');
    } else {
      box.classList.add('info');
      if (label) label.textContent = 'Admin Note';
      setText('adminNoteText', o.admin_note);
    }
  }
}

/* ═══════════════════════════════════════
              Status Banner
   ═══════════════════════════════════════ */

function renderStatusBanner(status) {
  const banner = document.getElementById('statusBanner');
  const icon = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  const text = document.getElementById('statusText');

  if (!banner) return;

  banner.className = 'admin-status-banner';

  const config = {
    'PENDING': {
      cls: 'pending', icon: '⏳',
      title: 'Awaiting Payment',
      text: 'User has not submitted a payment reference yet.',
    },
    'AWAITING_REVIEW': {
      cls: 'review', icon: '🔍',
      title: 'Awaiting Your Verification',
      text: 'User submitted a reference. Please verify and complete or reject.',
    },
    'PROCESSING': {
      cls: 'processing', icon: '⚙',
      title: 'Processing',
      text: 'Ready to complete once funds are sent.',
    },
    'COMPLETED': {
      cls: 'completed', icon: '✓',
      title: 'Order Completed',
      text: 'Funds have been delivered successfully.',
    },
    'CANCELLED': {
      cls: 'cancelled', icon: '✕',
      title: 'Cancelled',
      text: 'Cancelled by the user.',
    },
    'REJECTED': {
      cls: 'rejected', icon: '✕',
      title: 'Rejected',
      text: 'Rejected by admin.',
    },
  };

  const c = config[status] || config.PENDING;
  banner.classList.add(c.cls);
  if (icon) icon.textContent = c.icon;
  if (title) title.textContent = c.title;
  if (text) text.textContent = c.text;
}

/* ═══════════════════════════════════════
              Timeline
   ═══════════════════════════════════════ */

function renderTimeline(status) {
  const stages = ['PENDING', 'AWAITING_REVIEW', 'PROCESSING', 'COMPLETED'];
  const currentIdx = stages.indexOf(status);

  document.querySelectorAll('#timelineSteps .info-step').forEach(el => {
    const step = el.dataset.step;
    const idx = stages.indexOf(step);

    el.classList.remove('done', 'active');

    if (status === 'CANCELLED' || status === 'REJECTED') {
      return;
    }

    if (idx < currentIdx) {
      el.classList.add('done');
      const num = el.querySelector('.info-step-num');
      if (num) num.textContent = '✓';
    } else if (idx === currentIdx) {
      el.classList.add('active');
      const num = el.querySelector('.info-step-num');
      if (num) num.textContent = (idx + 1).toString();
    } else {
      const num = el.querySelector('.info-step-num');
      if (num) num.textContent = (idx + 1).toString();
    }
  });
}

/* ═══════════════════════════════════════
              Complete
   ═══════════════════════════════════════ */

async function handleComplete() {
  const btn = document.getElementById('completeBtn');
  const platformRef = document.getElementById('platformRef').value.trim();
  const adminNote = document.getElementById('adminNote').value.trim() || null;

  if (!platformRef) {
    Notify.warning('Please enter the platform payment reference.');
    return;
  }

  const ok = await Notify.confirm({
    title: 'Complete this order?',
    message: `This will update the user's balance and record ledger entries. Order: ${currentOrder.reference}`,
    type: 'warning',
  });

  if (!ok) return;

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await API.adminCompleteOrder(currentOrder.id, platformRef, adminNote);
    Notify.success('Order completed successfully!');

    setTimeout(() => window.location.reload(), 1200);

  } catch (err) {
    console.error('Complete error:', err);
    Notify.error(err.detail || 'Failed to complete order.');
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ═══════════════════════════════════════
              Reject
   ═══════════════════════════════════════ */

async function handleReject() {
  const btn = document.getElementById('rejectBtn');

  const reason = await Notify.prompt(
    'Reason for rejection',
    'e.g. Transaction not found',
    'danger'
  );

  if (!reason || String(reason).trim().length < 3) return;

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await API.adminRejectOrder(currentOrder.id, String(reason).trim());
    Notify.warning('Order rejected.');

    setTimeout(() => window.location.reload(), 1200);

  } catch (err) {
    console.error('Reject error:', err);
    Notify.error(err.detail || 'Failed to reject order.');
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ═══════════════════════════════════════
              Copy
   ═══════════════════════════════════════ */

function copyText(text, btnEl) {
  if (!text || text === '—') return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      Notify.success('Copied!');
    }).catch(() => {
      Notify.error('Could not copy.');
    });
  } else {
    Notify.error('Copy not supported.');
  }
}

/* ═══════════════════════════════════════
              Error
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
      <a href="orders.html" class="admin-btn secondary">← Back to Orders</a>
    </div>
  `;
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}