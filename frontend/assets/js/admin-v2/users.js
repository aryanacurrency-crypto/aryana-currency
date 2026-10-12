/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Users v2
   User management
   ═══════════════════════════════════════ */

let allUsers = [];
let filteredUsers = [];
let currentAdmin = null;

/* ═══════════════════════════════════════
              Init
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // صبر کن common.js init بشه
  await new Promise(resolve => setTimeout(resolve, 100));

  currentAdmin = Auth.getUser();

  // Setup search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadUsers(e.target.value.trim());
      }, 400);
    });
  }

  // Load
  await loadUsers();
});

/* ═══════════════════════════════════════
              Load Users
   ═══════════════════════════════════════ */

async function loadUsers(search = '') {
  try {
    AdminCommon.showLoading();

    allUsers = await API.getAdminUsers(search) || [];
    filteredUsers = [...allUsers];

    AdminCommon.hideLoading();
    renderStats();
    renderUsers();

  } catch (err) {
    console.error('Load users failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">Failed to load users.</p>
    `;
  }
}

/* ═══════════════════════════════════════
              Stats
   ═══════════════════════════════════════ */

function renderStats() {
  const total = allUsers.length;
  const active = allUsers.filter(u => u.is_active).length;
  const disabled = allUsers.filter(u => !u.is_active).length;
  const verified = allUsers.filter(u => u.is_verified).length;

  setText('statTotal', total);
  setText('statActive', active);
  setText('statDisabled', disabled);
  setText('statVerified', verified);
}

/* ═══════════════════════════════════════
              Render Users
   ═══════════════════════════════════════ */

function renderUsers() {
  const tableWrap = document.getElementById('tableWrap');
  const body = document.getElementById('usersBody');
  const empty = document.getElementById('emptyBox');

  if (!filteredUsers.length) {
    if (tableWrap) tableWrap.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  body.innerHTML = '';

  filteredUsers.forEach(user => {
    const tr = document.createElement('tr');

    const isSelf = currentAdmin && user.id === currentAdmin.id;
    const isAdmin = user.role === 'ADMIN';
    const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();

    // Role badge
    const roleBadge = isAdmin
      ? '<span class="admin-badge gold">ADMIN</span>'
      : '<span class="admin-badge gray">USER</span>';

    // KYC badge
    const kycBadge = user.is_verified
      ? '<span class="kyc-inline verified">✓ Verified</span>'
      : '<span class="kyc-inline unverified">Not Verified</span>';

    // Status badge
    const statusBadge = user.is_active
      ? '<span class="admin-badge green">Active</span>'
      : '<span class="admin-badge red">Disabled</span>';

    // Actions
    let actionsHtml = '';
    if (isSelf) {
      actionsHtml = '<span class="cell-muted" style="font-size:11px;">(you)</span>';
    } else {
      actionsHtml = `
        <button class="admin-btn ${user.is_active ? 'danger' : 'primary'}" data-action="toggle" data-id="${user.id}">
          ${user.is_active ? '✕ Disable' : '✓ Enable'}
        </button>
      `;
    }

    const joined = AdminCommon.formatDate(user.created_at, { year: undefined });

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:var(--space-3);">
          <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, var(--gold), var(--gold-dark)); color:var(--text-inverse); display:grid; place-items:center; font-size:14px; font-weight:800; flex-shrink:0;">
            ${initial}
          </div>
          <div>
            <div class="cell-name">${user.full_name || '—'}</div>
            <div class="cell-muted">ID: #${user.id}</div>
          </div>
        </div>
      </td>
      <td><span class="cell-muted">${user.email}</span></td>
      <td><span class="cell-muted">${user.phone || '—'}</span></td>
      <td>${roleBadge}</td>
      <td>${kycBadge}</td>
      <td>${statusBadge}</td>
      <td class="cell-muted">${joined}</td>
      <td>
        <div class="admin-actions">
          ${actionsHtml}
        </div>
      </td>
    `;

    // Setup toggle
    const toggleBtn = tr.querySelector('[data-action="toggle"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleUser(user);
      });
    }

    body.appendChild(tr);
  });
}

/* ═══════════════════════════════════════
              Toggle User
   ═══════════════════════════════════════ */

async function toggleUser(user) {
  const action = user.is_active ? 'disable' : 'enable';

  const ok = await Notify.confirm({
    title: `${user.is_active ? 'Disable' : 'Enable'} this user?`,
    message: user.is_active
      ? `${user.email} will not be able to log in or place orders until re-enabled.`
      : `${user.email} will regain full access to their account.`,
    type: user.is_active ? 'danger' : 'info',
  });

  if (!ok) return;

  try {
    await API.toggleUserActive(user.id);

    Notify.success(`User ${user.is_active ? 'disabled' : 'enabled'} successfully.`);

    // Reload
    await loadUsers(document.getElementById('searchInput')?.value.trim() || '');

  } catch (err) {
    console.error('Toggle user failed:', err);
    Notify.error(err.detail || 'Failed to update user.');
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}