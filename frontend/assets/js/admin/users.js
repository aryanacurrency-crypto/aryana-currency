/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Users
   ═══════════════════════════════════════ */

let currentUser = null;
let searchTimeout = null;

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

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = I18N.currentLang;
    langSelect.addEventListener('change', (e) => I18N.setLanguage(e.target.value));
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadUsers(searchInput.value.trim()), 400);
  });

  currentUser = Auth.getUser();
  await loadUsers();
});

async function loadUsers(search = '') {
  try {
    const users = await API.getAdminUsers(search);

    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('usersSection').style.display = 'block';

    const empty = document.getElementById('emptyBox');
    const table = document.getElementById('usersTable');
    const body = document.getElementById('usersBody');

    if (!users.length) {
      empty.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    table.style.display = 'table';
    body.innerHTML = '';

    users.forEach(user => {
      const tr = document.createElement('tr');
      const date = new Date(user.created_at).toLocaleDateString();
      const isAdmin = user.role === 'ADMIN';
      const isSelf = currentUser && user.id === currentUser.id;

      const roleBadge = isAdmin
        ? `<span class="order-status status-review">ADMIN</span>`
        : `<span class="order-status status-cancelled">USER</span>`;

      const statusBadge = user.is_active
        ? `<span class="order-status status-completed">${I18N.currentLang === 'en' ? 'Active' : I18N.currentLang === 'fa' ? 'فعال' : 'فعال'}</span>`
        : `<span class="order-status status-rejected">${I18N.currentLang === 'en' ? 'Disabled' : I18N.currentLang === 'fa' ? 'غیرفعال' : 'غیر فعال'}</span>`;

      tr.innerHTML = `
        <td><strong>${user.full_name || '—'}</strong></td>
        <td>${user.email}</td>
        <td>${user.phone || '—'}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td style="font-size:11px; color:var(--muted);">${date}</td>
        <td>
          <div class="table-actions">
            ${!isSelf ? `
              <button class="btn-xs ${user.is_active ? 'btn-xs-danger' : 'btn-xs-primary'}" data-toggle="${user.id}">
                ${user.is_active 
                  ? (I18N.currentLang === 'en' ? 'Disable' : I18N.currentLang === 'fa' ? 'غیرفعال' : 'غیر فعال')
                  : (I18N.currentLang === 'en' ? 'Enable' : I18N.currentLang === 'fa' ? 'فعال' : 'فعال')}
              </button>
            ` : `
              <span style="font-size:10px; color:var(--muted);">${I18N.currentLang === 'en' ? '(you)' : I18N.currentLang === 'fa' ? '(شما)' : '(تاسو)'}</span>
            `}
          </div>
        </td>
      `;

      const toggleBtn = tr.querySelector('[data-toggle]');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => toggleUser(user));
      }

      body.appendChild(tr);
    });
  } catch (err) {
    console.error('Load users failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">
        ${I18N.currentLang === 'en' ? 'Could not load users.'
        : I18N.currentLang === 'fa' ? 'بارگذاری کاربران ناموفق بود.'
        : 'کاروونکي بارول ناکام شول.'}
      </p>
    `;
  }
}

async function toggleUser(user) {
  const actionTitle = user.is_active
    ? (I18N.currentLang === 'en' ? 'Disable this user?'
      : I18N.currentLang === 'fa' ? 'این کاربر غیرفعال شود؟'
      : 'دا کارونکی غیر فعال شي؟')
    : (I18N.currentLang === 'en' ? 'Enable this user?'
      : I18N.currentLang === 'fa' ? 'این کاربر فعال شود؟'
      : 'دا کارونکی فعال شي؟');

  const ok = await Notify.confirm({
    title: actionTitle,
    message: user.email,
    type: user.is_active ? 'danger' : 'info',
  });

  if (!ok) return;

  try {
    await API.toggleUserActive(user.id);

    Notify.success(
      user.is_active
        ? (I18N.currentLang === 'en' ? 'User disabled.'
          : I18N.currentLang === 'fa' ? 'کاربر غیرفعال شد.'
          : 'کارونکی غیر فعال شو.')
        : (I18N.currentLang === 'en' ? 'User enabled.'
          : I18N.currentLang === 'fa' ? 'کاربر فعال شد.'
          : 'کارونکی فعال شو.')
    );

    await loadUsers(document.getElementById('searchInput').value.trim());
  } catch (err) {
    Notify.error(err.detail || 'Failed to update user.');
  }
}