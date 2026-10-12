/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin KYC v2
   KYC verification management
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
              Init
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // صبر کن common.js init بشه
  await new Promise(resolve => setTimeout(resolve, 100));

  await Promise.all([
    loadStats(),
    loadPending(),
  ]);
});

/* ═══════════════════════════════════════
              Load Stats
   ═══════════════════════════════════════ */

async function loadStats() {
  try {
    const stats = await API.getKycStats();

    setText('statTotal', stats.total_users || 0);
    setText('statVerified', stats.verified_users || 0);
    setText('statPending', stats.pending_documents || 0);

    // Unverified = total - verified
    const unverified = (stats.total_users || 0) - (stats.verified_users || 0);
    setText('statUnverified', unverified);

  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

/* ═══════════════════════════════════════
              Load Pending
   ═══════════════════════════════════════ */

async function loadPending() {
  try {
    AdminCommon.showLoading();

    const list = await API.getPendingKyc();

    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('contentBox').style.display = 'block';

    const container = document.getElementById('pendingContainer');
    const empty = document.getElementById('emptyBox');
    const badge = document.getElementById('pendingCountBadge');

    if (badge) badge.textContent = list.length;

    container.innerHTML = '';

    if (!list.length) {
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';

    list.forEach(group => {
      const card = createUserCard(group);
      container.appendChild(card);
    });

  } catch (err) {
    console.error('Load pending KYC failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">Failed to load KYC requests.</p>
    `;
  }
}

/* ═══════════════════════════════════════
              Create User Card
   ═══════════════════════════════════════ */

function createUserCard(group) {
  const user = group.user;
  const docs = group.documents;

  const card = document.createElement('div');
  card.className = 'admin-detail-card';
  card.style.marginBottom = 'var(--space-4)';

  // Initial avatar
  const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();

  // KYC badge
  const kycBadge = user.is_verified
    ? '<span class="kyc-inline verified">✓ Verified</span>'
    : '<span class="kyc-inline unverified">Not Verified</span>';

  const docsHtml = docs.map(doc => {
    const typeNames = {
      'national_id': 'National ID',
      'passport': 'Passport',
      'selfie': 'Selfie',
    };
    const typeName = typeNames[doc.doc_type] || doc.doc_type;
    const date = AdminCommon.formatDateTime(doc.created_at);

    return `
      <div class="kyc-doc-row" data-doc-id="${doc.id}">
        <div class="kyc-doc-info">
          <div class="kyc-doc-type">${typeName}</div>
          <div class="kyc-doc-date">Submitted ${date}</div>
        </div>
        <div class="admin-actions">
          <button class="admin-btn secondary" data-action="view" data-doc-id="${doc.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </button>
          <button class="admin-btn primary" data-action="approve" data-doc-id="${doc.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Approve
          </button>
          <button class="admin-btn danger" data-action="reject" data-doc-id="${doc.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Reject
          </button>
        </div>
      </div>
    `;
  }).join('');

  card.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-4); padding-bottom:var(--space-4); border-bottom:1px solid var(--border-subtle);">
      <div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, var(--gold), var(--gold-dark)); color:var(--text-inverse); display:grid; place-items:center; font-size:20px; font-weight:800; flex-shrink:0;">
        ${initial}
      </div>
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:var(--space-3); margin-bottom:4px; flex-wrap:wrap;">
          <strong style="font-size:15px; color:var(--text-primary);">${user.full_name || user.email}</strong>
          ${kycBadge}
        </div>
        <div style="font-size:12px; color:var(--text-secondary);">
          ${user.email} · User ID: #${user.id}
        </div>
        ${user.phone ? `<div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">📞 ${user.phone}</div>` : ''}
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:var(--space-2);">
      ${docsHtml}
    </div>
  `;

  // Setup buttons
  card.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const docId = parseInt(btn.dataset.docId);
      viewKycFile(docId);
    });
  });

  card.querySelectorAll('[data-action="approve"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const docId = parseInt(btn.dataset.docId);
      approveDoc(docId, card);
    });
  });

  card.querySelectorAll('[data-action="reject"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const docId = parseInt(btn.dataset.docId);
      rejectDoc(docId, card);
    });
  });

  return card;
}

/* ═══════════════════════════════════════
              View File
   ═══════════════════════════════════════ */

async function viewKycFile(docId) {
  try {
    const token = localStorage.getItem(CONFIG.STORAGE.ACCESS_TOKEN);

    // روش ۱: از endpoint admin با توکن
    const res = await fetch(`${CONFIG.API_BASE}/kyc/admin/file/${docId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      Notify.error('Failed to load file.');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    // باز کردن در تب جدید
    window.open(url, '_blank');

    // پاک کردن بعد از ۱ دقیقه
    setTimeout(() => URL.revokeObjectURL(url), 60000);

  } catch (err) {
    console.error('View file failed:', err);
    Notify.error('Failed to load file.');
  }
}

/* ═══════════════════════════════════════
              Approve
   ═══════════════════════════════════════ */

async function approveDoc(docId, card) {
  const ok = await Notify.confirm({
    title: 'Approve this document?',
    message: 'The user will be marked as verified if this is their only pending document.',
    type: 'info',
  });

  if (!ok) return;

  try {
    await API.approveKyc(docId);
    Notify.success('Document approved!');

    // حذف ردیف مدرک
    const row = card.querySelector(`[data-doc-id="${docId}"]`);
    if (row) {
      row.style.opacity = '0';
      row.style.transform = 'translateX(-20px)';
      row.style.transition = 'all 0.3s ease';
      setTimeout(() => row.remove(), 300);
    }

    // رفرش
    setTimeout(async () => {
      await loadStats();
      await loadPending();
      AdminCommon.updateBadges();
    }, 500);

  } catch (err) {
    console.error('Approve failed:', err);
    Notify.error(err.detail || 'Failed to approve.');
  }
}

/* ═══════════════════════════════════════
              Reject
   ═══════════════════════════════════════ */

async function rejectDoc(docId, card) {
  const reason = await Notify.prompt(
    'Reason for rejection',
    'e.g. Blurry image',
    'danger'
  );

  if (!reason || String(reason).trim().length < 3) return;

  try {
    await API.rejectKyc(docId, String(reason).trim());
    Notify.warning('Document rejected.');

    // حذف ردیف
    const row = card.querySelector(`[data-doc-id="${docId}"]`);
    if (row) {
      row.style.opacity = '0';
      row.style.transform = 'translateX(-20px)';
      row.style.transition = 'all 0.3s ease';
      setTimeout(() => row.remove(), 300);
    }

    // رفرش
    setTimeout(async () => {
      await loadStats();
      await loadPending();
      AdminCommon.updateBadges();
    }, 500);

  } catch (err) {
    console.error('Reject failed:', err);
    Notify.error(err.detail || 'Failed to reject.');
  }
}

/* ═══════════════════════════════════════
              Helpers
   ═══════════════════════════════════════ */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}