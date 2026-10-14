/* ═══════════════════════════════════════
   ARYANA — Admin v2 P2P Orders
   ═══════════════════════════════════════ */

let currentFilter = 'PAYMENT_REVIEW';

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

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadOrders();
      Notify.info('Refreshed');
    });
  }

  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadOrders();
    });
  });

  await loadOrders();
});

async function loadOrders() {
  const loadingBox = document.getElementById('loadingBox');
  const contentBox = document.getElementById('contentBox');
  const empty = document.getElementById('ordersEmpty');
  const table = document.getElementById('ordersTable');
  const body = document.getElementById('ordersBody');

  loadingBox.style.display = 'block';
  contentBox.style.display = 'none';

  try {
    let orders;
    if (currentFilter === 'PAYMENT_REVIEW') {
      orders = await API.getAdminP2PPendingReview();
    } else if (currentFilter === 'DISPUTED') {
      orders = await API.getAdminP2PDisputed();
    } else {
      orders = await API.getAdminP2POrders();
    }

    await loadCounts();

    loadingBox.style.display = 'none';
    contentBox.style.display = 'block';

    if (!orders || !orders.length) {
      empty.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    table.style.display = 'table';
    body.innerHTML = '';

    orders.forEach(order => {
      const statusClass = {
        'PENDING_PAYMENT': 'gold',
        'PAYMENT_REVIEW': 'blue',
        'READY_TO_RELEASE': 'blue',
        'COMPLETED': 'green',
        'CANCELLED': 'gray',
        'EXPIRED': 'gray',
        'DISPUTED': 'red',
      }[order.status] || 'gray';

      const date = new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', {
        minimumFractionDigits: d, maximumFractionDigits: d,
      });

      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.onclick = () => {
        window.location.href = `p2p-order-detail.html?id=${order.id}`;
      };

      tr.innerHTML = `
        <td><span class="cell-mono">${order.reference}</span></td>
        <td><div style="font-weight:600;font-size:13px;">Buyer #${order.buyer_id}</div></td>
        <td><div style="font-weight:600;font-size:13px;">Seller #${order.seller_id}</div></td>
        <td><strong>${fmt(order.amount_usdt)}</strong><span class="cell-muted"> USDT</span></td>
        <td><strong style="color:var(--gold);">${fmt(order.total_payment_afn)}</strong></td>
        <td><span class="admin-badge ${statusClass}">${order.status.replace(/_/g, ' ')}</span></td>
        <td class="cell-muted">${date}</td>
        <td>
          <div class="admin-actions">
            <button class="admin-btn gold" onclick="event.stopPropagation(); window.location.href='p2p-order-detail.html?id=${order.id}'">
              View →
            </button>
          </div>
        </td>
      `;
      body.appendChild(tr);
    });

  } catch (err) {
    console.error('Load orders failed:', err);
    loadingBox.innerHTML = `<p style="color:var(--red);font-size:13px;">Failed to load orders.</p>`;
  }
}

async function loadCounts() {
  try {
    const [pending, disputed] = await Promise.all([
      API.getAdminP2PPendingReview().catch(() => []),
      API.getAdminP2PDisputed().catch(() => []),
    ]);

    const c1 = document.getElementById('countPendingReview');
    const c2 = document.getElementById('countDisputed');
    if (c1) c1.textContent = pending.length;
    if (c2) c2.textContent = disputed.length;

    updateSidebarBadge(pending.length + disputed.length);
  } catch (err) {
    console.error('Counts failed:', err);
  }
}

function updateSidebarBadge(count) {
  const badge = document.getElementById('countP2P');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}