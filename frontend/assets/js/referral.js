/* ═══════════════════════════════════════
   ARYANA CURRENCY — Referral Page Logic
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  Auth.requireLogin();

  // Header user
  const user = Auth.getUser();
  if (user) {
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');

    if (avatarEl) {
      avatarEl.textContent = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
    }
    if (nameEl) {
      nameEl.textContent = user.full_name || user.email || 'User';
    }
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', () => Theme.toggle());

  // ═══════════════════════════════════════
  //         Load Referral Data
  // ═══════════════════════════════════════
  let referralCode = '—';
  let referralLink = '—';

  async function loadStats() {
    try {
      const stats = await API.request('/referral/me');

      referralCode = stats.code || '—';
      referralLink = `${window.location.origin}${window.location.pathname.replace('referral.html', 'register.html')}?ref=${referralCode}`;

      // پر کردن UI
      document.getElementById('referralCode').textContent = referralCode;
      document.getElementById('referralLink').value = referralLink;

      document.getElementById('statTotalReferrals').textContent = stats.total_referrals || 0;
      document.getElementById('statLocked').textContent = `${(stats.locked_amount || 0).toFixed(2)} AFN`;
      document.getElementById('statReleased').textContent = `${(stats.total_earned || 0).toFixed(2)} AFN`;
      document.getElementById('statTotalEarned').textContent = `${(stats.total_earned || 0).toFixed(2)} AFN`;

    } catch (err) {
      console.error('Failed to load referral stats:', err);
      if (typeof Notifications !== 'undefined') {
        Notifications.error('Failed to load referral data');
      }
    }
  }

  async function loadReferralsList() {
    try {
      const list = await API.request('/referral/list');

      const container = document.getElementById('referralsList');
      const countEl = document.getElementById('referralsCount');

      countEl.textContent = list.length;

      if (!list || list.length === 0) {
        return; // empty state از قبل هست
      }

      container.innerHTML = '';

      list.forEach(r => {
        const card = document.createElement('div');
        card.className = 'referral-item';

        const isReleased = r.bonus_status === 'released';
        const isLocked = r.bonus_status === 'locked';

        // مراحل
        const step1 = `<div class="ref-step ${r.registered_at ? 'done' : ''}">✅ Registered</div>`;
        const step2 = `<div class="ref-step ${r.kyc_completed ? 'done' : 'pending'}">${r.kyc_completed ? '✅' : '⏳'} KYC</div>`;
        const step3 = `<div class="ref-step ${r.first_trade_done ? 'done' : 'pending'}">${r.first_trade_done ? '✅' : '⏳'} First Trade</div>`;

        const bonusStatus = isReleased
          ? '<span class="ref-bonus-badge released">💰 Released</span>'
          : '<span class="ref-bonus-badge locked">🔒 Locked</span>';

        card.innerHTML = `
          <div class="ref-item-header">
            <div class="ref-item-name">👤 ${escapeHtml(r.referred_user_name)}</div>
            ${bonusStatus}
          </div>
          <div class="ref-item-steps">
            ${step1}
            ${step2}
            ${step3}
          </div>
          <div class="ref-item-amount">
            <span>Bonus:</span>
            <strong>${r.bonus_amount.toFixed(2)} AFN</strong>
          </div>
        `;

        container.appendChild(card);
      });

    } catch (err) {
      console.error('Failed to load referrals list:', err);
    }
  }

  // ═══════════════════════════════════════
  //              Copy Buttons
  // ═══════════════════════════════════════

  function copyToClipboard(text, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showCopied(button));
    } else {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopied(button);
    }
  }

  function showCopied(button) {
    if (!button) return;
    button.classList.add('copied');
    const original = button.querySelector('span')?.textContent || '';
    const span = button.querySelector('span');
    if (span) span.textContent = '✓ Copied';

    setTimeout(() => {
      button.classList.remove('copied');
      if (span) span.textContent = original;
    }, 1500);

    if (typeof Notifications !== 'undefined') {
      Notifications.success('Copied to clipboard!');
    }
  }

  document.getElementById('copyCodeBtn')?.addEventListener('click', (e) => {
    copyToClipboard(referralCode, e.currentTarget);
  });

  document.getElementById('copyLinkBtn')?.addEventListener('click', (e) => {
    copyToClipboard(referralLink, e.currentTarget);
  });

  // ═══════════════════════════════════════
  //           Share Buttons
  // ═══════════════════════════════════════

  const shareText = `Join Aryana Currency — the trusted USDT ↔ AFN exchange! Use my code ${referralCode} and start trading today.`;

  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.share;

      if (type === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');

      } else if (type === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`, '_blank');

      } else if (type === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');

      } else if (type === 'copy') {
        copyToClipboard(referralLink, btn);
      }
    });
  });

  // ═══════════════════════════════════════
  //           HTML escape helper
  // ═══════════════════════════════════════

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════
  //                  Load
  // ═══════════════════════════════════════

  await loadStats();
  await loadReferralsList();
});