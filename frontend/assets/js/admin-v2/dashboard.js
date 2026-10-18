/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin v2 Dashboard
   Uses AdminCommon for shared logic
   ═══════════════════════════════════════ */

window.ADMIN_SKIP_AUTO_INIT = true;

document.addEventListener('DOMContentLoaded', async () => {
  // common.js خودش auth + sidebar + theme + i18n رو انجام می‌ده
  await AdminCommon.init();

  // دکمه Refresh
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAll();
      if (typeof Notify !== 'undefined') Notify.info('Refreshed');
    });
  }

  // لود داده‌ها
  await loadAll();
});

/* ═══════════════════════════════════════
              Load All
   ═══════════════════════════════════════ */

async function loadAll() {
  try {
    await Promise.all([
      loadStats(),
      loadPendingOrders(),
      loadKycStats(),
      loadWithdrawalStats(),
      loadP2PStats(),
    ]);

    AdminCommon.hideLoading();
  } catch (err) {
    console.error('Load failed:', err);
    const loading = document.getElementById('loadingBox');
    if (loading) {
      loading.innerHTML = `<p style="color:var(--red); font-size:13px;">Failed to load dashboard.</p>`;
    }
  }
}

/* ═══════════════════════════════════════
              Stats
   ═══════════════════════════════════════ */

async function loadStats() {
  try {
    const stats = await API.getAdminStats();

    const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

    setText('statUsers', fmt(stats.total_users));
    setText('statCompletedOrders', fmt(stats.completed_orders));
    setText('statPendingOrders', fmt(stats.pending_orders));
    setText('statFees', fmt(stats.total_fees_afn, 0));
    setText('statCompletedOrdersSub', `${fmt(stats.total_usdt_traded, 2)} USDT traded`);
    setText('statTotalOrders', fmt(stats.total_orders));
    setText('statUsdtTraded', `${fmt(stats.total_usdt_traded, 0)} USDT`);
  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

async function loadKycStats() {
  try {
    const stats = await API.getKycStats();
    setText('statKycPending', stats.pending_documents || 0);
    setText('statUsersSub', `${stats.verified_users || 0} verified`);
    AdminCommon.setBadge('kyc', stats.pending_documents || 0);
  } catch (err) {
    console.error('KYC stats load failed:', err);
  }
}

async function loadWithdrawalStats() {
  try {
    const stats = await API.request('/withdrawals/admin/stats');
    setText('statWithdrawalsPending', stats.pending || 0);
    AdminCommon.setBadge('withdrawals', stats.pending || 0);
  } catch (err) {
    console.error('Withdrawal stats load failed:', err);
    setText('statWithdrawalsPending', '0');
  }
}

async function loadP2PStats() {
  try {
    const [pending, disputed] = await Promise.all([
      API.getAdminP2PPendingReview().catch(() => []),
      API.getAdminP2PDisputed().catch(() => []),
    ]);

    setText('statP2PPending', pending.length);
    setText('statP2PDisputed', disputed.length);
    AdminCommon.setBadge('p2p', pending.length + disputed.length);
  } catch (err) {
    console.error('P2P stats load failed:', err);
    setText('statP2PPending', '0');
    setText('statP2PDisputed', '0');
  }
}

/* ═══════════════════════════════════════
              Pending Orders
   ═══════════════════════════════════════ */

async function loadPendingOrders() {
  try {
    const orders = await API.getPendingOrders();
    const empty = document.getElementById('pendingEmpty');
    const table = document.getElementById('pendingTable');
    const body = document.getElementById('pendingBody');
    const countBadge = document.getElementById('pendingCountBadge');

    if (countBadge) countBadge.textContent = orders.length;
    AdminCommon.setBadge('orders', orders.length);

    if (!orders.length) {
      if (empty) empty.style.display = 'block';
      if (table) table.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (table) table.style.display = 'table';
    if (body) body.innerHTML = '';

    orders.forEach(order => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.onclick = () => {
        window.location.href = `order-detail.html?id=${order.id}`;
      };

      const isBuy = order.side === 'BUY';
      const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
      const date = new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      tr.innerHTML = `
        <td><span class="cell-mono">${order.reference}</span></td>
        <td><span class="admin-badge ${isBuy ? 'green' : 'red'}">${isBuy ? '▲ BUY' : '▼ SELL'}</span></td>
        <td><strong>${fmt(order.amount_usdt)}</strong><span class="cell-muted"> USDT</span></td>
        <td><span class="admin-badge blue">In Review</span></td>
        <td class="cell-muted">${date}</td>
        <td>
          <div class="admin-actions">
            <button type="button" class="admin-btn gold" onclick="event.stopPropagation(); window.location.href='order-detail.html?id=${order.id}'">
              Review →
            </button>
          </div>
        </td>
      `;
      body.appendChild(tr);
    });
  } catch (err) {
    console.error('Pending orders load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}