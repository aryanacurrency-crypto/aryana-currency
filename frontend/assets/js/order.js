/* ═══════════════════════════════════════
   ARYANA CURRENCY — Order Detail Page
   ═══════════════════════════════════════ */

let currentOrder = null;
let paymentInfo = null;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireLogin();
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.value = I18N.currentLang;
    langSelect.addEventListener('change', (e) => I18N.setLanguage(e.target.value));
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');

  if (!orderId) {
    showError('Order ID missing.');
    return;
  }

  try {
    const [order, pInfo] = await Promise.all([
      API.getMyOrder(orderId),
      API.getPaymentInfo().catch(() => null),
    ]);

    currentOrder = order;
    paymentInfo = pInfo;

    render();
  } catch (err) {
    console.error('Load error:', err);
    showError(err.detail || 'Could not load order.');
  }
});

function render() {
  document.getElementById('loadingBox').style.display = 'none';
  document.getElementById('orderContent').style.display = 'block';

  const o = currentOrder;
  const isBuy = o.side === 'BUY';

  document.getElementById('orderRef').textContent = o.reference;

  renderStatusBanner(o.status);

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

  renderTimeline(o.status);

  if (o.status === 'PENDING') {
    renderPaymentBox(o);
    document.getElementById('submitBox').style.display = 'block';
    document.getElementById('actionsBox').style.display = 'flex';
    setupSubmitForm();
    setupCancel();
  } else {
    document.getElementById('paymentBox').style.display = 'none';
    document.getElementById('submitBox').style.display = 'none';
    document.getElementById('actionsBox').style.display = 'none';
  }

  if (o.admin_note && (o.status === 'REJECTED' || o.status === 'CANCELLED')) {
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
    'PENDING': {
      cls: 'pending', icon: '⏳',
      title: { en: 'Awaiting payment', fa: 'در انتظار پرداخت', ps: 'د تادیې په تمه' },
      text: { en: 'Send the exact amount and submit the reference below.', fa: 'مبلغ دقیق را ارسال کنید و شماره تراکنش را ثبت کنید.', ps: 'سمه اندازه ولېږئ او د معاملې شمېره ثبت کړئ.' },
    },
    'AWAITING_REVIEW': {
      cls: 'review', icon: '🔍',
      title: { en: 'Awaiting verification', fa: 'در انتظار تأیید', ps: 'د تصدیق په تمه' },
      text: { en: 'Our team is reviewing your payment.', fa: 'تیم ما در حال بررسی پرداخت شما است.', ps: 'زموږ ټیم ستاسو تادیه کتنه کوي.' },
    },
    'PROCESSING': {
      cls: 'processing', icon: '⚙',
      title: { en: 'Processing', fa: 'در حال پردازش', ps: 'پروسس' },
      text: { en: 'Verified. We are sending the funds.', fa: 'تأیید شد. در حال ارسال وجوه.', ps: 'تصدیق شو. پیسې لیږو.' },
    },
    'COMPLETED': {
      cls: 'completed', icon: '✓',
      title: { en: 'Completed', fa: 'تکمیل شد', ps: 'بشپړ شو' },
      text: { en: 'Your transaction is complete. Thank you!', fa: 'تراکنش شما تکمیل شد. سپاسگزاریم!', ps: 'ستاسو معامله بشپړه شوه. مننه!' },
    },
    'CANCELLED': {
      cls: 'cancelled', icon: '✕',
      title: { en: 'Cancelled', fa: 'لغو شد', ps: 'لغوه شو' },
      text: { en: 'This order was cancelled.', fa: 'این سفارش لغو شد.', ps: 'دا غوښتنه لغوه شوه.' },
    },
    'REJECTED': {
      cls: 'rejected', icon: '✕',
      title: { en: 'Rejected', fa: 'رد شد', ps: 'رد شو' },
      text: { en: 'This order was rejected by our team.', fa: 'این سفارش توسط تیم ما رد شد.', ps: 'دا غوښتنه زموږ ټیم رد کړه.' },
    },
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

    if (step === currentStatus) {
      li.classList.add('active');
    } else if (currentIdx > -1 && stepIdx < currentIdx) {
      li.classList.add('done');
    }
  });

  if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') {
    document.querySelectorAll('#timeline li').forEach(li => {
      li.classList.remove('active', 'done');
    });
  }
}

function renderPaymentBox(order) {
  const box = document.getElementById('paymentBox');
  const usdtBox = document.getElementById('paymentUsdtBox');
  const afnBox = document.getElementById('paymentAfnBox');
  const warning = document.getElementById('paymentWarning');

  if (!paymentInfo) {
    box.style.display = 'none';
    return;
  }

  box.style.display = 'block';

  if (order.side === 'BUY') {
    usdtBox.style.display = 'none';
    afnBox.style.display = 'block';

    document.getElementById('platformHesabPay').textContent = paymentInfo.hesab_pay || '—';
    document.getElementById('platformAmount').textContent = `${fmt(order.net_afn)} AFN`;

    setupCopy('copyHesab', paymentInfo.hesab_pay);
    setupCopy('copyAmount', fmt(order.net_afn));

    warning.textContent = I18N.currentLang === 'en'
      ? `After sending ${fmt(order.net_afn)} AFN via Hesab Pay, paste the transaction reference below and submit.`
      : I18N.currentLang === 'fa'
      ? `پس از ارسال ${fmt(order.net_afn)} افغانی از طریق حساب پی، شماره تراکنش را در پایین ثبت کنید.`
      : `له حساب پی له لارې ${fmt(order.net_afn)} افغانۍ لیږلو وروسته، د معاملې شمېره لاندې ثبت کړئ.`;
  } else {
    usdtBox.style.display = 'block';
    afnBox.style.display = 'none';

    document.getElementById('platformWalletAddress').textContent = paymentInfo.usdt_wallet || '—';

    setupCopy('copyWallet', paymentInfo.usdt_wallet);

    warning.textContent = I18N.currentLang === 'en'
      ? `Send exactly ${fmt(order.amount_usdt)} USDT via TRC20 network to the address above, then paste the TXID below.`
      : I18N.currentLang === 'fa'
      ? `دقیقاً ${fmt(order.amount_usdt)} تتر از شبکه TRC20 به آدرس بالا ارسال کنید، سپس TXID را در پایین ثبت نمایید.`
      : `سم ${fmt(order.amount_usdt)} تتر د TRC20 شبکې له لارې پورتني پته ته ولېږئ، بیا TXID لاندې ثبت کړئ.`;
  }
}

function setupCopy(btnId, value) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      const orig = newBtn.textContent;
      newBtn.textContent = '✓';
      setTimeout(() => { newBtn.textContent = orig; }, 1200);
    });
  });
}

function setupSubmitForm() {
  const form = document.getElementById('submitForm');
  const btn = document.getElementById('submitPaymentBtn');

  const refLabel = document.getElementById('paymentRefLabel');
  const refInput = document.getElementById('paymentRef');

  if (currentOrder.side === 'BUY') {
    if (refLabel) refLabel.textContent = I18N.currentLang === 'en' ? 'Hesab Pay transaction reference'
                                  : I18N.currentLang === 'fa' ? 'شماره تراکنش حساب پی'
                                  : 'د حساب پی د معاملې شمېره';
    if (refInput) refInput.placeholder = 'HP-...';
  } else {
    if (refLabel) refLabel.textContent = I18N.currentLang === 'en' ? 'USDT transaction hash (TXID)'
                                  : I18N.currentLang === 'fa' ? 'هش تراکنش تتر (TXID)'
                                  : 'د تتر د معاملې هش (TXID)';
    if (refInput) refInput.placeholder = 'abc123...';
  }

  form.onsubmit = async (e) => {
    e.preventDefault();

    const ref = document.getElementById('paymentRef').value.trim();
    const note = document.getElementById('paymentNote').value.trim() || null;

    if (!ref) return;

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      const updated = await API.submitPayment(currentOrder.id, ref, note);
      currentOrder = updated;
      Notify.success(
        I18N.currentLang === 'en' ? 'Payment submitted. Awaiting verification.'
        : I18N.currentLang === 'fa' ? 'پرداخت ثبت شد. در انتظار تأیید.'
        : 'تادیه ثبت شوه. د تصدیق په تمه.'
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      Notify.error(err.detail || 'Failed to submit.');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  };
}

function setupCancel() {
  const btn = document.getElementById('cancelOrderBtn');
  if (!btn) return;

  btn.onclick = async () => {
    const ok = await Notify.confirm({
      title: I18N.currentLang === 'en' ? 'Cancel this order?'
           : I18N.currentLang === 'fa' ? 'این سفارش لغو شود؟'
           : 'دا غوښتنه لغوه شي؟',
      message: I18N.currentLang === 'en' ? 'This action cannot be undone.'
             : I18N.currentLang === 'fa' ? 'این اقدام قابل بازگشت نیست.'
             : 'دا کړنه نه شي بیرته کېدای.',
      type: 'warning',
    });

    if (!ok) return;

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.cancelOrder(currentOrder.id);
      Notify.warning(
        I18N.currentLang === 'en' ? 'Order cancelled.'
        : I18N.currentLang === 'fa' ? 'سفارش لغو شد.'
        : 'غوښتنه لغوه شوه.'
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      Notify.error(err.detail || 'Cancel failed.');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  };
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function showError(msg) {
  document.getElementById('loadingBox').style.display = 'none';
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.style.display = 'block';
}