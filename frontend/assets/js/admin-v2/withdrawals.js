/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Withdrawals v2
   Withdrawal management
   ═══════════════════════════════════════ */

let allWithdrawals = [];
let filteredWithdrawals = [];
let usersCache = {};

/* ═══════════════════════════════════════
              Init
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // صبر کن common.js init بشه
  await new Promise(resolve => setTimeout(resolve, 100));

  // Setup filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      applyFilter();
    });
  }

  // Load
  await Promise.all([
    loadStats(),
    loadWithdrawals(),
  ]);
});

/* ═══════════════════════════════════════
              Stats
   ═══════════════════════════════════════ */

async function loadStats() {
  try {
    const stats = await API.request('/withdrawals/admin/stats');

    setText('statTotal', stats.total || 0);
    setText('statPending', stats.pending || 0);
    setText('statCompleted', stats.completed || 0);
    setText('statRejected', stats.rejected || 0);

  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Load
   ═══════════════════════════════════════ */

async function loadWithdrawals() {
  try {
    AdminCommon.showLoading();

    allWithdrawals = await API.request('/withdrawals/admin/all') || [];
    filteredWithdrawals = [...allWithdrawals];

    // Load user info for each withdrawal
    await loadUsersForWithdrawals();

    AdminCommon.hideLoading();
    renderWithdrawals();

  } catch (err) {
    console.error('Load withdrawals failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">Failed to load withdrawals.</p>
    `;
  }
}

async function loadUsersForWithdrawals() {
  const uniqueUserIds = [...new Set(allWithdrawals.map(w => w.user_id))];

  for (const userId of uniqueUserIds) {
    if (usersCache[userId]) continue;

    try {
      const user = await API.getUserDetail(userId);
      usersCache[userId] = user;
    } catch (e) {
      usersCache[userId] = null;
    }
  }
}

/* ═══════════════════════════════════════
              Filter
   ═══════════════════════════════════════ */

function applyFilter() {
  const status = document.getElementById('statusFilter')?.value || '';

  filteredWithdrawals = allWithdrawals.filter(w => {
    if (status && w.status !== status) return false;
    return true;
  });

  renderWithdrawals();
}

/* ═══════════════════════════════════════
              Render
   ═══════════════════════════════════════ */

function renderWithdrawals() {
  const tableWrap = document.getElementById('tableWrap');
  const body = document.getElementById('withdrawalsBody');
  const empty = document.getElementById('emptyBox');

  if (!filteredWithdrawals.length) {
    if (tableWrap) tableWrap.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  body.innerHTML = '';

  filteredWithdrawals.forEach(w => {
    const tr = document.createElement('tr');

    const user = usersCache[w.user_id];
    const userName = user ? (user.full_name || user.email) : `User #${w.user_id}`;
    const userEmail = user ? user.email : '';

    const amount = AdminCommon.formatNumber(w.amount, 2);
    const date = AdminCommon.formatDateTime(w.created_at);
    const isPending = w.status === 'PENDING';

    // کوتاه کردن destination
    const destShort = w.destination.length > 20
      ? w.destination.slice(0, 10) + '...' + w.destination.slice(-6)
      : w.destination;

    tr.innerHTML = `
      <td><span class="cell-mono">${w.reference}</span></td>
      <td>
        <div class="cell-name">${userName}</div>
        <div class="cell-muted">${userEmail}</div>
      </td>
      <td>
        <strong>${amount}</strong>
        <span class="cell-muted"> ${w.currency}</span>
      </td>
      <td>
        <span class="cell-mono" title="${w.destination}">${destShort}</span>
      </td>
      <td>${AdminCommon.statusBadge(w.status)}</td>
      <td class="cell-muted">${date}</td>
      <td>
        <div class="admin-actions">
          ${isPending ? `
            <button class="admin-btn primary" data-action="complete" data-id="${w.id}">
              ✓ Complete
            </button>
            <button class="admin-btn danger" data-action="reject" data-id="${w.id}">
              ✕ Reject
            </button>
          ` : `
            <button class="admin-btn secondary" data-action="view" data-id="${w.id}">
              Details
            </button>
          `}
        </div>
      </td>
    `;

    // Setup buttons
    tr.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);

        if (action === 'complete') {
          handleComplete(id);
        } else if (action === 'reject') {
          handleReject(id);
        } else if (action === 'view') {
          handleView(id);
        }
      });
    });

    body.appendChild(tr);
  });
}

/* ═══════════════════════════════════════
              Actions
   ═══════════════════════════════════════ */

async function handleComplete(withdrawalId) {
  const w = allWithdrawals.find(x => x.id === withdrawalId);
  if (!w) return;

  const user = usersCache[w.user_id];
  const userName = user ? (user.full_name || user.email) : `User #${w.user_id}`;

  // درخواست reference
  const ref = await Notify.prompt(
    'Platform Payment Reference',
    `Reference for sending ${AdminCommon.formatNumber(w.amount, 2)} ${w.currency} to ${userName}`,
    'info'
  );

  if (!ref || String(ref).trim().length < 3) return;

  const ok = await Notify.confirm({
    title: 'Complete this withdrawal?',
    message: `This will deduct ${AdminCommon.formatNumber(w.amount, 2)} ${w.currency} from ${userName}'s balance and mark the request as completed.`,
    type: 'warning',
  });

  if (!ok) return;

  try {
    await API.request(`/withdrawals/admin/${withdrawalId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        platform_payment_reference: String(ref).trim(),
        admin_note: null,
      }),
    });

    Notify.success('Withdrawal completed successfully!');

    setTimeout(async () => {
      await loadStats();
      await loadWithdrawals();
      AdminCommon.updateBadges();
    }, 800);

  } catch (err) {
    console.error('Complete failed:', err);
    Notify.error(err.detail || 'Failed to complete withdrawal.');
  }
}

async function handleReject(withdrawalId) {
  const reason = await Notify.prompt(
    'Reason for rejection',
    'e.g. Invalid destination address',
    'danger'
  );

  if (!reason || String(reason).trim().length < 3) return;

  try {
    await API.request(`/withdrawals/admin/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        reason: String(reason).trim(),
      }),
    });

    Notify.warning('Withdrawal rejected.');

    setTimeout(async () => {
      await loadStats();
      await loadWithdrawals();
      AdminCommon.updateBadges();
    }, 800);

  } catch (err) {
    console.error('Reject failed:', err);
    Notify.error(err.detail || 'Failed to reject withdrawal.');
  }
}

function handleView(withdrawalId) {
  const w = allWithdrawals.find(x => x.id === withdrawalId);
  if (!w) return;

  const user = usersCache[w.user_id];
  const userName = user ? (user.full_name || user.email) : `User #${w.user_id}`;

  Notify.info(
    `Ref: ${w.reference} | User: ${userName} | Amount: ${AdminCommon.formatNumber(w.amount, 2)} ${w.currency} | Destination: ${w.destination}`
  );
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}