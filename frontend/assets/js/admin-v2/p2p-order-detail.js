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

  let actionsHtml = '';
  if (order.status === 'PAYMENT_REVIEW' || order.status === 'READY_TO_RELEASE') {
    actionsHtml = `
      <button class="admin-btn green" id="completeBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Complete & Release Escrow
      </button>
      <button class="admin-btn red" id="rejectBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Reject Order
      </button>
    `;
  } else if (order.status === 'DISPUTED') {
    actionsHtml = `
      <div style="background:var(--red-bg);border:1px solid rgba(246,70,93,0.3);border-radius:12px;padding:16px;margin-bottom:16px;width:100%;">
        <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:6px;">⚠️ Dispute Reason</div>
        <div style="font-size:13px;color:var(--text-primary);line-height:1.6;">${escapeHtml(order.dispute_reason || '—')}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;width:100%;">
        <button class="admin-btn green" id="resolveBuyerBtn">✓ Resolve for Buyer</button>
        <button class="admin-btn red" id="resolveSellerBtn">✓ Resolve for Seller</button>
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
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
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

async function completeOrder() {
  if (!currentOrder) return;
  const note = prompt('Admin note (optional):', '');
  if (note === null) return;

  try {
    await API.adminCompleteP2POrder(currentOrder.id, note || null);
    Notify.success('Order completed and escrow released');
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Complete failed:', err);
    Notify.error(err.detail || 'Failed to complete order');
  }
}

async function rejectOrder() {
  if (!currentOrder) return;
  const reason = prompt('Rejection reason:');
  if (!reason || reason.length < 3) {
    Notify.error('Please enter a valid reason');
    return;
  }

  try {
    await API.adminRejectP2POrder(currentOrder.id, reason);
    Notify.success('Order rejected');
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Reject failed:', err);
    Notify.error(err.detail || 'Failed to reject order');
  }
}

async function resolveDispute(decision) {
  if (!currentOrder) return;
  const note = prompt(`Admin note for resolving to ${decision}:`);
  if (note === null) return;

  try {
    await API.adminResolveP2PDispute(currentOrder.id, decision, note || 'Resolved by admin');
    Notify.success(`Dispute resolved for ${decision}`);
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Resolve failed:', err);
    Notify.error(err.detail || 'Failed to resolve dispute');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showError(msg) {
  document.getElementById('loadingBox').innerHTML = `<p style="color:var(--red);font-size:13px;">${msg}</p>`;
}