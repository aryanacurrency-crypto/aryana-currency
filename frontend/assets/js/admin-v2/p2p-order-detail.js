/* ═══════════════════════════════════════
   ARYANA — Admin v2 P2P Order Detail
   ═══════════════════════════════════════ */

let currentOrder = null;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  if (!Auth.isAdmin()) {
    window.location.href = '../dashboard.html';
    return;
  }

  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  const params = new URLSearchParams(window.location.search);
  const orderId = parseInt(params.get('id'));

  if (!orderId) {
    showError('Order ID not found');
    return;
  }

  await loadOrder(orderId);
});

/* ═══════════════════════════════════════
             Load Order
   ═══════════════════════════════════════ */

async function loadOrder(orderId) {
  const loadingBox = document.getElementById('loadingBox');
  const contentBox = document.getElementById('contentBox');

  try {
    const order = await API.getAdminP2POrderDetail(orderId);
    currentOrder = order;
    renderOrder(order);
    loadingBox.style.display = 'none';
    contentBox.style.display = 'block';
  } catch (err) {
    console.error('Load order failed:', err);
    loadingBox.innerHTML = `<p style="color:var(--red);font-size:13px;">Failed to load order.</p>`;
  }
}

function renderOrder(order) {
  const contentBox = document.getElementById('contentBox');

  const statusClass = {
    'PENDING_PAYMENT': 'gold',
    'PAYMENT_REVIEW': 'blue',
    'READY_TO_RELEASE': 'blue',
    'COMPLETED': 'green',
    'CANCELLED': 'gray',
    'EXPIRED': 'gray',
    'DISPUTED': 'red',
  }[order.status] || 'gray';

  const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', {
    minimumFractionDigits: d, maximumFractionDigits: d,
  });

  const date = (iso) => iso ? new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  // ═══ SVG inline style (اجباری) ═══
  const SVG_STYLE = 'width:18px;height:18px;max-width:18px;max-height:18px;min-width:18px;min-height:18px;flex-shrink:0;display:block;';

  let actionsHtml = '';

  if (order.status === 'PAYMENT_REVIEW' || order.status === 'READY_TO_RELEASE') {
    actionsHtml = `
      <div class="p2p-admin-actions">
        <button class="p2p-admin-btn success" id="completeBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Complete & Release Escrow
        </button>
        <button class="p2p-admin-btn danger" id="rejectBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Reject Order
        </button>
      </div>
    `;
  } else if (order.status === 'DISPUTED') {
    actionsHtml = `
      <div style="background:var(--red-bg);border:1px solid rgba(246,70,93,0.3);border-radius:12px;padding:16px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:6px;">⚠️ Dispute Reason</div>
        <div style="font-size:13px;color:var(--text-primary);line-height:1.6;">${escapeHtml(order.dispute_reason || '—')}</div>
      </div>
      <div class="p2p-admin-actions">
        <button class="p2p-admin-btn success" id="resolveBuyerBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Resolve for Buyer
        </button>
        <button class="p2p-admin-btn danger" id="resolveSellerBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Resolve for Seller
        </button>
      </div>
    `;
  }

  contentBox.innerHTML = `
    <div class="admin-page-header">
      <a href="p2p-orders.html" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);text-decoration:none;margin-bottom:8px;">
        ← Back to P2P Orders
      </a>
      <h1>Order ${escapeHtml(order.reference)}</h1>
      <p>Created ${date(order.created_at)}</p>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:16px;margin-bottom:20px;">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary);margin-bottom:4px;">Status</div>
        <div style="font-size:18px;font-weight:800;">${order.status.replace(/_/g, ' ')}</div>
      </div>
      <span class="admin-badge ${statusClass}" style="font-size:12px;padding:6px 14px;">${order.status.replace(/_/g, ' ')}</span>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-bottom:20px;">

      <div class="admin-detail-card">
        <div class="admin-detail-card-title">Trade Details</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Amount</span><strong>${fmt(order.amount_usdt)} USDT</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Rate</span><strong>${fmt(order.rate_afn_per_usdt)} AFN</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Buyer Receives</span><strong style="color:var(--green);">${fmt(order.buyer_receives_usdt)} USDT</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Seller Receives</span><strong>${fmt(order.seller_receives_afn)} AFN</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Total Payment</span><strong style="color:var(--gold);">${fmt(order.total_payment_afn)} AFN</strong></div>
          <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-subtle);">
            <span style="color:var(--text-secondary);">Fee (Seller)</span><strong>${fmt(order.seller_fee_usdt)} USDT</strong>
          </div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Fee (Buyer)</span><strong>${fmt(order.buyer_fee_afn)} AFN</strong></div>
        </div>
      </div>

      <div class="admin-detail-card">
        <div class="admin-detail-card-title">Parties</div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Buyer</div>
            <div style="font-size:14px;font-weight:700;">${escapeHtml(order.buyer_full_name || 'Unknown')}</div>
            <div style="font-size:12px;color:var(--text-secondary);">User #${order.buyer_id}</div>
          </div>
          <div>
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Seller</div>
            <div style="font-size:14px;font-weight:700;">${escapeHtml(order.seller_full_name || 'Unknown')}</div>
            <div style="font-size:12px;color:var(--text-secondary);">User #${order.seller_id}</div>
          </div>
        </div>
      </div>

      <div class="admin-detail-card" style="grid-column:1/-1;">
        <div class="admin-detail-card-title">Payment Proof</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Buyer Reference</span><strong class="cell-mono">${escapeHtml(order.buyer_payment_reference || '—')}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Buyer Note</span><strong>${escapeHtml(order.buyer_note || '—')}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Paid At</span><strong>${date(order.paid_at)}</strong></div>
        </div>
      </div>

    </div>

    ${actionsHtml ? `
      <div class="admin-detail-card">
        <div class="admin-detail-card-title">Admin Actions</div>
        <div style="margin-top:16px;">
          ${actionsHtml}
        </div>
      </div>
    ` : ''}
  `;

  document.getElementById('completeBtn')?.addEventListener('click', () => completeOrder());
  document.getElementById('rejectBtn')?.addEventListener('click', () => rejectOrder());
  document.getElementById('resolveBuyerBtn')?.addEventListener('click', () => resolveDispute('BUYER'));
  document.getElementById('resolveSellerBtn')?.addEventListener('click', () => resolveDispute('SELLER'));
}

/* ═══════════════════════════════════════
             Actions
   ═══════════════════════════════════════ */

async function completeOrder() {
  if (!currentOrder) return;

  const confirmed = await showConfirm({
    icon: 'success',
    title: 'Complete & Release Escrow?',
    message: `This will release ${Number(currentOrder.buyer_receives_usdt).toFixed(2)} USDT to the buyer and credit the seller. This action cannot be undone.`,
    confirmText: 'Complete',
    cancelText: 'Cancel',
    confirmStyle: 'success',
  });

  if (!confirmed) return;

  const btn = document.getElementById('completeBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="p2p-spinner" style="border-top-color:white;"></div> Processing...';
  }

  try {
    await API.adminCompleteP2POrder(currentOrder.id, 'Completed via admin panel');
    showToast('Order completed! Escrow released.', 'success');
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Complete failed:', err);
    showToast(err.detail || 'Failed to complete order', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;max-width:18px;max-height:18px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Complete & Release Escrow`;
    }
  }
}

async function rejectOrder() {
  if (!currentOrder) return;

  const reason = await showConfirm({
    icon: 'danger',
    title: 'Reject Order?',
    message: 'Please provide a reason for rejecting this order. The buyer will be notified.',
    inputPlaceholder: 'e.g., Payment not received, invalid receipt...',
    inputRequired: true,
    confirmText: 'Reject Order',
    cancelText: 'Cancel',
    confirmStyle: 'danger',
  });

  if (!reason) return;

  const btn = document.getElementById('rejectBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="p2p-spinner" style="border-top-color:white;"></div> Rejecting...';
  }

  try {
    await API.adminRejectP2POrder(currentOrder.id, reason);
    showToast('Order rejected', 'warning');
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Reject failed:', err);
    showToast(err.detail || 'Failed to reject order', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;max-width:18px;max-height:18px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Reject Order`;
    }
  }
}

async function resolveDispute(decision) {
  if (!currentOrder) return;

  const isBuyer = decision === 'BUYER';

  const note = await showConfirm({
    icon: isBuyer ? 'success' : 'danger',
    title: isBuyer ? 'Resolve for Buyer?' : 'Resolve for Seller?',
    message: isBuyer
      ? 'The escrowed USDT will be released to the buyer. The seller will not receive funds.'
      : 'The escrowed USDT will be returned to the seller. The buyer will not receive USDT.',
    inputPlaceholder: 'Admin note (required)...',
    inputRequired: true,
    confirmText: isBuyer ? 'Resolve for Buyer' : 'Resolve for Seller',
    cancelText: 'Cancel',
    confirmStyle: isBuyer ? 'success' : 'danger',
  });

  if (!note) return;

  try {
    await API.adminResolveP2PDispute(currentOrder.id, decision, note);
    showToast(`Dispute resolved for ${decision}`, 'success');
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Resolve failed:', err);
    showToast(err.detail || 'Failed to resolve dispute', 'error');
  }
}

/* ═══════════════════════════════════════
             Confirm Dialog
   ═══════════════════════════════════════ */

function showConfirm(options) {
  return new Promise((resolve) => {
    const {
      icon = 'warning',
      title = 'Are you sure?',
      message = '',
      inputPlaceholder = null,
      inputRequired = false,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmStyle = 'primary',
    } = options;

    const SVG_STYLE = 'width:28px;height:28px;max-width:28px;max-height:28px;flex-shrink:0;';

    const icons = {
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    };

    const overlay = document.createElement('div');
    overlay.className = 'p2p-confirm-overlay';
    overlay.innerHTML = `
      <div class="p2p-confirm">
        <div class="p2p-confirm-icon ${icon}">${icons[icon] || icons.warning}</div>
        <div class="p2p-confirm-title">${escapeHtml(title)}</div>
        ${message ? `<div class="p2p-confirm-message">${escapeHtml(message)}</div>` : ''}
        ${inputPlaceholder ? `<textarea class="p2p-confirm-input" placeholder="${escapeHtml(inputPlaceholder)}" id="p2pConfirmInput"></textarea>` : ''}
        <div class="p2p-confirm-actions">
          <button class="p2p-confirm-btn cancel" id="p2pConfirmCancel">${escapeHtml(cancelText)}</button>
          <button class="p2p-confirm-btn ${confirmStyle}" id="p2pConfirmOk">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('p2pConfirmInput');
    const okBtn = document.getElementById('p2pConfirmOk');
    const cancelBtn = document.getElementById('p2pConfirmCancel');

    if (input) input.focus(); else okBtn.focus();

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };

    cancelBtn.onclick = () => close(inputPlaceholder ? null : false);

    okBtn.onclick = () => {
      if (inputPlaceholder && inputRequired) {
        const val = (input?.value || '').trim();
        if (val.length < 3) {
          input?.focus();
          input.style.borderColor = 'var(--red)';
          setTimeout(() => { input.style.borderColor = ''; }, 1500);
          return;
        }
        close(val);
      } else if (inputPlaceholder) {
        close((input?.value || '').trim() || '');
      } else {
        close(true);
      }
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(inputPlaceholder ? null : false);
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        close(inputPlaceholder ? null : false);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

/* ═══════════════════════════════════════
             Toast Notification
   ═══════════════════════════════════════ */

function showToast(message, type = 'info', duration = 3000) {
  document.querySelectorAll('.p2p-toast').forEach(t => t.remove());

  const SVG_STYLE = 'width:18px;height:18px;max-width:18px;max-height:18px;flex-shrink:0;';

  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${SVG_STYLE}"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `p2p-toast p2p-toast-${type}`;
  toast.innerHTML = `
    <div class="p2p-toast-icon">${icons[type] || icons.info}</div>
    <div class="p2p-toast-message">${escapeHtml(message)}</div>
    <button class="p2p-toast-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;max-width:14px;max-height:14px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  document.body.appendChild(toast);

  toast.querySelector('.p2p-toast-close').addEventListener('click', () => {
    toast.classList.add('p2p-toast-out');
    setTimeout(() => toast.remove(), 300);
  });

  if (duration > 0) {
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.add('p2p-toast-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}

/* ═══════════════════════════════════════
             Helpers
   ═══════════════════════════════════════ */

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showError(msg) {
  document.getElementById('loadingBox').innerHTML = `<p style="color:var(--red);font-size:13px;">${msg}</p>`;
}