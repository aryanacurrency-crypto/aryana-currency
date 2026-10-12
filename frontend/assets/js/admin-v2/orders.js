/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Orders v2
   Orders management
   ═══════════════════════════════════════ */

let allOrders = [];
let filteredOrders = [];

/* ═══════════════════════════════════════
              Init (بعد از common.js)
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // صبر کن common.js init بشه
  await new Promise(resolve => setTimeout(resolve, 100));

  // Setup filters
  setupFilters();

  // Load orders
  await loadOrders();
});

/* ═══════════════════════════════════════
              Filters
   ═══════════════════════════════════════ */

function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const sideFilter = document.getElementById('sideFilter');

  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters());
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => applyFilters());
  }

  if (sideFilter) {
    sideFilter.addEventListener('change', () => applyFilters());
  }
}

function applyFilters() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const status = document.getElementById('statusFilter')?.value || '';
  const side = document.getElementById('sideFilter')?.value || '';

  filteredOrders = allOrders.filter(order => {
    // Search
    if (search) {
      const ref = (order.reference || '').toLowerCase();
      if (!ref.includes(search)) return false;
    }

    // Status
    if (status && order.status !== status) return false;

    // Side
    if (side && order.side !== side) return false;

    return true;
  });

  renderOrders();
}

/* ═══════════════════════════════════════
              Load Orders
   ═══════════════════════════════════════ */

async function loadOrders() {
  try {
    AdminCommon.showLoading();

    allOrders = await API.getAdminOrders() || [];
    filteredOrders = [...allOrders];

    AdminCommon.hideLoading();
    renderOrders();

  } catch (err) {
    console.error('Load orders failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">Failed to load orders.</p>
    `;
  }
}

/* ═══════════════════════════════════════
              Render
   ═══════════════════════════════════════ */

function renderOrders() {
  const tableWrap = document.getElementById('tableWrap');
  const table = document.getElementById('ordersTable');
  const body = document.getElementById('ordersBody');
  const empty = document.getElementById('emptyBox');

  if (!filteredOrders.length) {
    if (tableWrap) tableWrap.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  body.innerHTML = '';

  filteredOrders.forEach(order => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => {
      window.location.href = `order-detail-v2.html?id=${order.id}`;
    };

    const amount = AdminCommon.formatNumber(order.amount_usdt, 2);
    const date = AdminCommon.formatDateTime(order.created_at);

    tr.innerHTML = `
      <td><span class="cell-mono">${order.reference}</span></td>
      <td>${AdminCommon.sideBadge(order.side)}</td>
      <td>
        <strong>${amount}</strong>
        <span class="cell-muted"> USDT</span>
      </td>
      <td>${AdminCommon.statusBadge(order.status)}</td>
      <td class="cell-muted">${date}</td>
      <td>
        <div class="admin-actions">
          <button class="admin-btn secondary">
            View →
          </button>
        </div>
      </td>
    `;

    body.appendChild(tr);
  });
}