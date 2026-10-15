/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Users
   ═══════════════════════════════════════ */

window.ADMIN_SKIP_AUTO_INIT = true;

document.addEventListener('DOMContentLoaded', async () => {
  await AdminCommon.init();

  let allUsers = [];
  let searchTerm = '';

  const searchInput = document.getElementById('searchInput');
  const usersBody = document.getElementById('usersBody');

  // ═══════════════════════════════════════
  //           Load Users
  // ═══════════════════════════════════════
  async function loadUsers() {
    AdminCommon.showLoading();

    try {
      const url = searchTerm ? `/admin/users?search=${encodeURIComponent(searchTerm)}` : '/admin/users';
      const users = await API.request(url);

      allUsers = users || [];
      renderUsers();
      updateStats();
      AdminCommon.hideLoading();
    } catch (e) {
      console.error('Load users failed:', e);
      Notifications.error('Failed to load users');
    }
  }

  // ═══════════════════════════════════════
  //           Render Users
  // ═══════════════════════════════════════
  function renderUsers() {
    if (!usersBody) return;

    if (!allUsers.length) {
      document.getElementById('emptyBox').style.display = 'block';
      document.getElementById('tableWrap').style.display = 'none';
      return;
    }

    document.getElementById('emptyBox').style.display = 'none';
    document.getElementById('tableWrap').style.display = 'block';

    usersBody.innerHTML = allUsers.map(u => {
      const initials = (u.full_name || u.email || 'U').charAt(0).toUpperCase();

      const roleBadge = u.role === 'ADMIN'
        ? '<span class="admin-badge red">ADMIN</span>'
        : '<span class="admin-badge gray">USER</span>';

      const kycBadge = u.is_verified
        ? '<span class="admin-badge green">✅ Verified</span>'
        : '<span class="admin-badge gold">⏳ Pending</span>';

      const statusBadge = u.is_active
        ? '<span class="admin-badge green">Active</span>'
        : '<span class="admin-badge red">Disabled</span>';

      const vipBadge = u.is_vip
        ? `<span class="admin-badge gold">⭐ VIP${u.vip_level || 1}</span>`
        : '';

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg, var(--gold), var(--gold-dark)); color:var(--text-inverse); display:grid; place-items:center; font-weight:800; font-size:13px;">
                ${initials}
              </div>
              <div>
                <div class="cell-name">${escapeHtml(u.full_name || '—')}</div>
                <div class="cell-muted">ID: ${u.id} ${vipBadge}</div>
              </div>
            </div>
          </td>
          <td class="cell-mono">${escapeHtml(u.email)}</td>
          <td class="cell-mono">${escapeHtml(u.phone || '—')}</td>
          <td>${roleBadge}</td>
          <td>${kycBadge}</td>
          <td>${statusBadge}</td>
          <td class="cell-muted">${AdminCommon.formatDate(u.created_at)}</td>
          <td>
            <div class="admin-actions">
              <button class="admin-btn secondary" data-action="vip" data-id="${u.id}">
                ${u.is_vip ? '⭐ VIP' : '👤 Make VIP'}
              </button>
              <button class="admin-btn ${u.is_active ? 'danger' : 'primary'}" data-action="toggle" data-id="${u.id}">
                ${u.is_active ? '🚫 Disable' : '✓ Enable'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Event listeners
    usersBody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const action = btn.dataset.action;

        if (action === 'toggle') toggleUser(id);
        else if (action === 'vip') openVipModal(id);
      });
    });
  }

  // ═══════════════════════════════════════
  //           Update Stats
  // ═══════════════════════════════════════
  function updateStats() {
    const total = allUsers.length;
    const active = allUsers.filter(u => u.is_active).length;
    const disabled = total - active;
    const verified = allUsers.filter(u => u.is_verified).length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statDisabled').textContent = disabled;
    document.getElementById('statVerified').textContent = verified;
  }

  // ═══════════════════════════════════════
  //           Search
  // ═══════════════════════════════════════
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTerm = e.target.value.trim();
      loadUsers();
    }, 400);
  });

  // ═══════════════════════════════════════
  //           Toggle User
  // ═══════════════════════════════════════
  async function toggleUser(id) {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    const action = user.is_active ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await API.toggleUserActive(id);
      Notifications.success(`User ${action}d`);
      await loadUsers();
    } catch (e) {
      Notifications.error(e.detail || 'Failed to toggle user');
    }
  }

  // ═══════════════════════════════════════
  //           VIP Modal
  // ═══════════════════════════════════════
  function openVipModal(id) {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    const currentVip = user.is_vip;
    const currentLevel = user.vip_level || 1;

    const html = `
      <div style="padding: 8px 0;">
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
          User: <strong>${escapeHtml(user.full_name || user.email)}</strong>
        </p>

        <div class="field">
          <label class="field-label">VIP Status</label>
          <label class="switch">
            <input type="checkbox" id="vipToggle" ${currentVip ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <div class="field" id="vipLevelField" style="${currentVip ? '' : 'display:none;'}">
          <label class="field-label">VIP Level</label>
          <select id="vipLevel" class="field-input">
            <option value="1" ${currentLevel === 1 ? 'selected' : ''}>VIP 1 (10% commission)</option>
            <option value="2" ${currentLevel === 2 ? 'selected' : ''}>VIP 2 (15% commission)</option>
            <option value="3" ${currentLevel === 3 ? 'selected' : ''}>VIP 3 (20% commission)</option>
          </select>
        </div>
      </div>
    `;

    // Create simple modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>⭐ VIP Settings</h3>
          <button class="modal-close" id="closeVipModal">×</button>
        </div>
        <div class="modal-body">${html}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelVipBtn">Cancel</button>
          <button class="btn btn-primary" id="saveVipBtn">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Listeners
    modal.querySelector('#closeVipModal').addEventListener('click', () => modal.remove());
    modal.querySelector('#cancelVipBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const vipToggle = modal.querySelector('#vipToggle');
    const vipLevelField = modal.querySelector('#vipLevelField');

    vipToggle.addEventListener('change', () => {
      vipLevelField.style.display = vipToggle.checked ? 'block' : 'none';
    });

    modal.querySelector('#saveVipBtn').addEventListener('click', async () => {
      const isVip = vipToggle.checked;
      const vipLevel = parseInt(modal.querySelector('#vipLevel').value, 10) || 1;

      try {
        await API.request(`/admin/users/${id}/vip`, {
          method: 'POST',
          body: JSON.stringify({ is_vip: isVip, vip_level: vipLevel }),
        });

        Notifications.success(isVip ? `User set as VIP${vipLevel}` : 'VIP removed');
        modal.remove();
        await loadUsers();
      } catch (e) {
        Notifications.error(e.detail || 'Failed to update VIP');
      }
    });
  }

  // ═══════════════════════════════════════
  //           Helpers
  // ═══════════════════════════════════════
  function escapeHtml(t) {
    if (!t) return '';
    const div = document.createElement('div');
    div.textContent = String(t);
    return div.innerHTML;
  }

  // ═══════════════════════════════════════
  //           Load
  // ═══════════════════════════════════════
  await loadUsers();
});