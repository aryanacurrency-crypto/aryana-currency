/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin KYC
   ═══════════════════════════════════════ */

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

  await loadStats();
  await loadPending();
});

async function loadStats() {
  try {
    const stats = await API.getKycStats();
    document.getElementById('statTotal').textContent = stats.total_users || 0;
    document.getElementById('statVerified').textContent = stats.verified_users || 0;
    document.getElementById('statPending').textContent = stats.pending_documents || 0;
  } catch (err) {
    console.error('Load stats failed:', err);
  }
}

async function loadPending() {
  try {
    const list = await API.getPendingKyc();

    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('pendingSection').style.display = 'block';

    const container = document.getElementById('pendingContainer');
    const empty = document.getElementById('emptyBox');

    container.innerHTML = '';

    if (!list.length) {
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';

    list.forEach(group => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.style.marginBottom = '18px';

      const user = group.user;
      const docs = group.documents;

      const docsHtml = docs.map(doc => {
        const typeNames = {
          'national_id': { en: 'National ID', fa: 'تذکره ملی', ps: 'ملي تذکره' },
          'passport': { en: 'Passport', fa: 'پاسپورت', ps: 'پاسپورت' },
          'selfie': { en: 'Selfie', fa: 'سلفی', ps: 'سیلفي' },
        };
        const typeName = (typeNames[doc.doc_type] || {})[I18N.currentLang] || doc.doc_type;

        return `
          <div class="kyc-doc-row">
            <div>
              <div class="kyc-doc-type">${typeName}</div>
              <div class="kyc-doc-date">${new Date(doc.created_at).toLocaleString()}</div>
            </div>
            <div class="table-actions">
              <button class="btn-xs btn-xs-muted" onclick="viewKycFile(${doc.id})">
                ${I18N.currentLang === 'en' ? 'View' : I18N.currentLang === 'fa' ? 'مشاهده' : 'کتل'}
              </button>
              <button class="btn-xs btn-xs-primary" data-approve="${doc.id}">
                ${I18N.currentLang === 'en' ? 'Approve' : I18N.currentLang === 'fa' ? 'تأیید' : 'تصدیق'}
              </button>
              <button class="btn-xs btn-xs-danger" data-reject="${doc.id}">
                ${I18N.currentLang === 'en' ? 'Reject' : I18N.currentLang === 'fa' ? 'رد' : 'رد'}
              </button>
            </div>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <h2 style="margin-bottom:12px;">${user.full_name || user.email}</h2>
        <div class="order-details" style="margin-bottom:14px;">
          <div class="order-detail-row">
            <span data-i18n="thEmail">Email</span>
            <span>${user.email}</span>
          </div>
          <div class="order-detail-row">
            <span data-i18n="thPhone">Phone</span>
            <span>${user.phone || '—'}</span>
          </div>
          <div class="order-detail-row">
            <span data-i18n="profileUserId">User ID</span>
            <span>#${user.id}</span>
          </div>
        </div>
        <div style="margin-top:15px;">${docsHtml}</div>
      `;

      card.querySelectorAll('[data-approve]').forEach(btn => {
        btn.addEventListener('click', () => approveDoc(parseInt(btn.dataset.approve)));
      });

      card.querySelectorAll('[data-reject]').forEach(btn => {
        btn.addEventListener('click', () => rejectDoc(parseInt(btn.dataset.reject)));
      });

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Load pending KYC failed:', err);
    document.getElementById('loadingBox').innerHTML = `
      <p style="color:var(--red); font-size:13px;">
        ${I18N.currentLang === 'en' ? 'Could not load KYC requests.'
        : I18N.currentLang === 'fa' ? 'بارگذاری درخواست‌ها ناموفق بود.'
        : 'غوښتنې بارول ناکامې شوې.'}
      </p>
    `;
  }
}

async function viewKycFile(docId) {
  try {
    const token = localStorage.getItem(CONFIG.STORAGE.ACCESS_TOKEN);
    const res = await fetch(`${CONFIG.API_BASE}/kyc/admin/file/${docId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      Notify.error('Failed to load file.');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    console.error('View file failed:', err);
    Notify.error('Failed to load file.');
  }
}

async function approveDoc(docId) {
  const ok = await Notify.confirm({
    title: I18N.currentLang === 'en' ? 'Approve this document?'
      : I18N.currentLang === 'fa' ? 'این مدرک تأیید شود؟'
      : 'دا سند تصدیق شي؟',
    message: I18N.currentLang === 'en' ? 'The user will be marked as verified.'
      : I18N.currentLang === 'fa' ? 'کاربر به‌عنوان تأیید‌شده علامت‌گذاری می‌شود.'
      : 'کارونکی به توګه تصدیق شوی نښه کیږي.',
    type: 'info',
  });

  if (!ok) return;

  try {
    await API.approveKyc(docId);
    Notify.success(
      I18N.currentLang === 'en' ? 'Document approved.'
      : I18N.currentLang === 'fa' ? 'مدرک تأیید شد.'
      : 'سند تصدیق شو.'
    );
    await loadStats();
    await loadPending();
  } catch (err) {
    Notify.error(err.detail || 'Failed to approve.');
  }
}

async function rejectDoc(docId) {
  const reason = await Notify.prompt(
    I18N.currentLang === 'en' ? 'Reason for rejection'
      : I18N.currentLang === 'fa' ? 'دلیل رد'
      : 'د رد دلیل',
    I18N.currentLang === 'en' ? 'e.g. Blurry image'
      : I18N.currentLang === 'fa' ? 'مثلاً عکس واضح نیست'
      : 'لکه عکس روښانه نه دی',
    'danger'
  );

  if (!reason || String(reason).trim().length < 3) return;

  try {
    await API.rejectKyc(docId, String(reason).trim());
    Notify.warning(
      I18N.currentLang === 'en' ? 'Document rejected.'
      : I18N.currentLang === 'fa' ? 'مدرک رد شد.'
      : 'سند رد شو.'
    );
    await loadStats();
    await loadPending();
  } catch (err) {
    Notify.error(err.detail || 'Failed to reject.');
  }
}

// Global function for onclick
window.viewKycFile = viewKycFile;