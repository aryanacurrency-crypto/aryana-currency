/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin v2 Dashboard
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  if (!Auth.isAdmin()) {
    window.location.href = '../dashboard-v2.html';
    return;
  }

  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  // Refresh
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAll();
      Notify.info('Refreshed');
    });
  }

  // Load all
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
    ]);

    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('contentBox').style.display = 'block';

    updateBadges();

  } catch (err) {
    console.error('Load failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">Failed to load dashboard.</p>
    `;
  }
}

/* ═══════════════════════════════════════
              Stats
   ═══════════════════════════════════════ */

let statsData = {};

async function loadStats() {
  try {
    const stats = await API.getAdminStats();
    statsData = stats;

    const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

    setText('statUsers', fmt(stats.total_users));
    setText('statCompletedOrders', fmt(stats.completed_orders));
    setText('statPendingOrders', fmt(stats.pending_orders));
    setText('statFees', fmt(stats.total_fees_afn, 0));

    // Subs
    setText('statCompletedOrdersSub', `${fmt(stats.total_usdt_traded, 2)} USDT traded`);

    // Overview stats
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

    // Badge
    const badge = document.getElementById('countKyc');
    if (badge) {
      if (stats.pending_documents > 0) {
        badge.textContent = stats.pending_documents;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('KYC stats load failed:', err);
  }
}

async function loadWithdrawalStats() {
  try {
    const stats = await API.request('/withdrawals/admin/stats');
    setText('statWithdrawalsPending', stats.pending || 0);

    // Badge
    const badge = document.getElementById('countWithdrawals');
    if (badge) {
      if (stats.pending > 0) {
        badge.textContent = stats.pending;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Withdrawal stats load failed:', err);
    // اگه endpoint نبود، صفر بذار
    setText('statWithdrawalsPending', '0');
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
    const badge = document.getElementById('countOrders');
    const countBadge = document.getElementById('pendingCountBadge');

    // Badge sidebar
    if (badge) {
      if (orders.length > 0) {
        badge.textContent = orders.length;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Count badge section
    if (countBadge) {
      countBadge.textContent = orders.length;
    }

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
        window.location.href = `order-detail-v2.html?id=${order.id}`;
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
        <td>
          <span class="admin-badge ${isBuy ? 'green' : 'red'}">
            ${isBuy ? '▲ BUY' : '▼ SELL'}
          </span>
        </td>
        <td>
          <strong>${fmt(order.amount_usdt)}</strong>
          <span class="cell-muted"> USDT</span>
        </td>
        <td>
          <span class="admin-badge blue">In Review</span>
        </td>
        <td class="cell-muted">${date}</td>
        <td>
          <div class="admin-actions">
            <button class="admin-btn gold" onclick="event.stopPropagation(); window.location.href='order-detail-v2.html?id=${order.id}'">
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

function updateBadges() {
  // already handled in individual loads
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}