/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Order Detail
   Complete or reject orders (updates ledger)
   ═══════════════════════════════════════ */

let currentOrder = null;
let orderUser = null;

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

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');

  if (!orderId) {
    showError('Order ID missing.');
    return;
  }

  try {
    currentOrder = await API.getAdminOrderDetail(orderId);

    try {
      orderUser = await API.getUserDetail(currentOrder.user_id);
    } catch {
      orderUser = null;
    }

    render();
  } catch (err) {
    console.error('Load error:', err);
    showError(err.detail || 'Could not load order.');
  }
});

function render() {
  document.getElementById('loadingBox').style.display = 'none';
  document.getElementById('contentBox').style.display = 'block';

  const o = currentOrder;
  const isBuy = o.side === 'BUY';

  document.getElementById('orderTitle').textContent = `Order #${o.reference}`;
  document.getElementById('orderRef').textContent = o.reference;

  renderStatusBanner(o.status);

  // اطلاعات کاربر
  if (orderUser) {
    document.getElementById('userName').textContent = orderUser.full_name || '—';
    document.getElementById('userEmail').textContent = orderUser.email || '—';
    document.getElementById('userPhone').textContent = orderUser.phone || '—';
    document.getElementById('userHesabPay').textContent = orderUser.hesab_pay_number || '—';
    document.getElementById('userWallet').textContent = orderUser.usdt_wallet_address || '—';

    // KYC status badge
    const kycEl = document.getElementById('userKycStatus');
    if (kycEl) {
      if (orderUser.is_verified) {
        kycEl.innerHTML = `<span class="order-status status-completed">✓ ${I18N.currentLang === 'en' ? 'Verified' : I18N.currentLang === 'fa' ? 'تأیید شده' : 'تصدیق شوی'}</span>`;
      } else {
        kycEl.innerHTML = `<span class="order-status status-pending">${I18N.currentLang === 'en' ? 'Not verified' : I18N.currentLang === 'fa' ? 'تأیید نشده' : 'نه تصدیق شوی'}</span>`;
      }
    }
  } else {
    document.getElementById('userName').textContent = '—';
    document.getElementById('userEmail').textContent = '—';
    document.getElementById('userPhone').textContent = '—';
    document.getElementById('userHesabPay').textContent = '—';
    document.getElementById('userWallet').textContent = '—';
    const kycEl = document.getElementById('userKycStatus');
    if (kycEl) kycEl.textContent = '—';
  }

  // جزئیات سفارش
  document.getElementById('detailSide').textContent = isBuy
    ? (I18N.t('exchangeTabBuy') || 'Buy USDT')
    : (I18N.t('exchangeTabSell') || 'Sell USDT');

  document.getElementById('detailAmount').textContent = `${fmt(o.amount_usdt)} USDT`;
  document.getElementById('detailRate').textContent = `${fmt(o.rate_afn_per_usdt)} AFN`;
  document.getElementById('detailGross').textContent = `${fmt(o.gross_afn)} AFN`;
  document.getElementById('detailFee').textContent = `${fmt(o.fee_afn)} AFN`;
  document.getElementById('detailTotal').textContent = `${fmt(o.net_afn)} AFN`;

  document.getElementById('detailTotalLabel').textContent = isBuy
    ? (I18N.t('exchangeYouPay') || 'You pay')
    : (I18N.t('exchangeYouReceive') || 'You receive');

  // Referencهای ثبت‌شده
  if (o.user_payment_reference) {
    document.getElementById('userRefBox').style.display = 'block';
    document.getElementById('userRefValue').textContent = o.user_payment_reference;

    if (o.user_note) {
      document.getElementById('userNoteRow').style.display = 'flex';
      document.getElementById('userNoteValue').textContent = o.user_note;
    }
  }

  // Timeline
  renderTimeline(o.status);

  // Actions
  if (o.status === 'AWAITING_REVIEW' || o.status === 'PROCESSING') {
    document.getElementById('actionsCard').style.display = 'block';

    const platformRefLabel = document.getElementById('platformRefLabel');
    if (platformRefLabel) {
      platformRefLabel.textContent = isBuy
        ? (I18N.currentLang === 'en' ? 'USDT TXID (you sent to user)'
          : I18N.currentLang === 'fa' ? 'TXID تتر (برای کاربر فرستادید)'
          : 'د تتر TXID (کاروونکي ته لیږل شوی)')
        : (I18N.currentLang === 'en' ? 'Hesab Pay reference (you sent to user)'
          : I18N.currentLang === 'fa' ? 'شماره تراکنش حساب پی (برای کاربر فرستادید)'
          : 'د حساب پی شمېره (کاروونکي ته لیږل شوې)');
    }

    document.getElementById('completeBtn').addEventListener('click', handleComplete);
    document.getElementById('rejectBtn').addEventListener('click', handleReject);
  }

  // Admin note
  if (o.admin_note) {
    document.getElementById('adminNoteBox').style.display = 'block';
    document.getElementById('adminNoteText').textContent = o.admin_note;
  }
}

function renderStatusBanner(status) {
  const banner = document.getElementById('statusBanner');
  const icon = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  const text = document.getElementById('statusText');

  banner.className = 'order-status-banner';

  const config = {
    'PENDING': { cls: 'pending', icon: '⏳',
      title: { en: 'Awaiting payment', fa: 'در انتظار پرداخت', ps: 'د تادیې په تمه' },
      text: { en: 'User has not submitted a payment reference yet.', fa: 'کاربر هنوز شماره تراکنشی ثبت نکرده.', ps: 'کاروونکي لا تر اوسه د معاملې شمېره نه ده ثبت کړې.' } },
    'AWAITING_REVIEW': { cls: 'review', icon: '🔍',
      title: { en: 'Awaiting your verification', fa: 'در انتظار تأیید شما', ps: 'ستاسو د تصدیق په تمه' },
      text: { en: 'Verify the payment reference, then complete or reject.', fa: 'شماره تراکنش را بررسی کنید، سپس تأیید یا رد کنید.', ps: 'د معاملې شمېره وګورئ، بیا تصدیق یا رد کړئ.' } },
    'PROCESSING': { cls: 'processing', icon: '⚙',
      title: { en: 'Processing', fa: 'در پردازش', ps: 'پروسس' },
      text: { en: 'Ready to complete once funds are sent.', fa: 'پس از ارسال وجوه، تکمیل کنید.', ps: 'کله چې پیسې ولېږل شوې، بشپړ کړئ.' } },
    'COMPLETED': { cls: 'completed', icon: '✓',
      title: { en: 'Completed', fa: 'تکمیل شده', ps: 'بشپړ شو' },
      text: { en: 'Funds have been delivered.', fa: 'وجوه تحویل داده شده.', ps: 'پیسې سپارل شوې.' } },
    'CANCELLED': { cls: 'cancelled', icon: '✕',
      title: { en: 'Cancelled', fa: 'لغو شده', ps: 'لغوه' },
      text: { en: 'Cancelled by the user.', fa: 'توسط کاربر لغو شد.', ps: 'د کاروونکي لخوا لغوه شو.' } },
    'REJECTED': { cls: 'rejected', icon: '✕',
      title: { en: 'Rejected', fa: 'رد شده', ps: 'رد شوی' },
      text: { en: 'Rejected by admin.', fa: 'توسط ادمین رد شد.', ps: 'د اډمین لخوا رد شو.' } },
  };

  const c = config[status] || config.PENDING;
  banner.classList.add(c.cls);
  icon.textContent = c.icon;
  title.textContent = c.title[I18N.currentLang] || c.title.en;
  text.textContent = c.text[I18N.currentLang] || c.text.en;
}

function renderTimeline(currentStatus) {
  const steps = ['PENDING', 'AWAITING_REVIEW', 'PROCESSING', 'COMPLETED'];
  const currentIdx = steps.indexOf(currentStatus);

  document.querySelectorAll('#timeline li').forEach(li => {
    const step = li.dataset.step;
    const stepIdx = steps.indexOf(step);
    li.classList.remove('active', 'done');

    if (step === currentStatus) li.classList.add('active');
    else if (currentIdx > -1 && stepIdx < currentIdx) li.classList.add('done');
  });

  if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') {
    document.querySelectorAll('#timeline li').forEach(li => li.classList.remove('active', 'done'));
  }
}

async function handleComplete() {
  const btn = document.getElementById('completeBtn');
  const platformRef = document.getElementById('platformRef').value.trim();
  const adminNote = document.getElementById('adminNote').value.trim() || null;

  if (!platformRef) {
    Notify.warning(
      I18N.currentLang === 'en' ? 'Please enter the platform payment reference.'
      : I18N.currentLang === 'fa' ? 'لطفاً شماره تراکنش پلتفرم را وارد کنید.'
      : 'مهرباني وکړئ د پلاتفورم د تادیې شمېره ولیکئ.'
    );
    return;
  }

  const confirmTitle = I18N.currentLang === 'en' ? 'Complete this order?'
    : I18N.currentLang === 'fa' ? 'این سفارش تکمیل شود؟'
    : 'دا غوښتنه بشپړه شي؟';

  const confirmMsg = I18N.currentLang === 'en'
    ? `This will update the user's balance and record ledger entries. Order: ${currentOrder.reference}`
    : I18N.currentLang === 'fa'
    ? `موجودی کاربر به‌روزرسانی می‌شود و دفتر کل ثبت می‌گردد. سفارش: ${currentOrder.reference}`
    : `د کاروونکي موجودي به تازه شي او د لیجر ثبت به وشي. غوښتنه: ${currentOrder.reference}`;

  const ok = await Notify.confirm({
    title: confirmTitle,
    message: confirmMsg,
    type: 'warning',
  });

  if (!ok) return;

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await API.adminCompleteOrder(currentOrder.id, platformRef, adminNote);
    Notify.success(
      I18N.currentLang === 'en' ? 'Order completed successfully.'
      : I18N.currentLang === 'fa' ? 'سفارش با موفقیت تکمیل شد.'
      : 'غوښتنه په بریالیتوب سره بشپړه شوه.'
    );
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Complete error:', err);
    Notify.error(err.detail || 'Failed to complete order.');
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function handleReject() {
  const btn = document.getElementById('rejectBtn');

  const reason = await Notify.prompt(
    I18N.currentLang === 'en' ? 'Reason for rejection'
    : I18N.currentLang === 'fa' ? 'دلیل رد'
    : 'د رد دلیل',
    I18N.currentLang === 'en' ? 'Enter the reason...'
    : I18N.currentLang === 'fa' ? 'دلیل را وارد کنید...'
    : 'دلیل ولیکئ...',
    'danger'
  );

  if (!reason || String(reason).trim().length < 3) return;

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await API.adminRejectOrder(currentOrder.id, String(reason).trim());
    Notify.warning(
      I18N.currentLang === 'en' ? 'Order rejected.'
      : I18N.currentLang === 'fa' ? 'سفارش رد شد.'
      : 'غوښتنه رد شوه.'
    );
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Reject error:', err);
    Notify.error(err.detail || 'Failed to reject order.');
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function showError(msg) {
  document.getElementById('loadingBox').style.display = 'none';
  const box = document.getElementById('contentBox');
  box.style.display = 'block';
  box.innerHTML = `<div class="alert alert-error">${msg}</div>`;
}