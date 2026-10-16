/* ═══════════════════════════════════════
   ARYANA CURRENCY — Referral Page v3
   Light · Navy-Purple · ARYANA OS
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();

  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  Auth.requireLogin();

  /* ═══════════════════════════════════════
     👤 HEADER USER
     ═══════════════════════════════════════ */

  const user = Auth.getUser();
  if (user) {
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');

    if (avatarEl) {
      avatarEl.textContent = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
    }
    if (nameEl) {
      nameEl.textContent = (user.full_name || user.email || 'User').split(' ')[0];
    }

    // Admin button
    if (user.role === 'ADMIN') {
      const adminBtn = document.getElementById('adminPanelBtn');
      if (adminBtn) adminBtn.style.display = 'grid';
    }
  }

  /* ═══════════════════════════════════════
     🎛️ HEADER ACTIONS
     ═══════════════════════════════════════ */

  document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
  document.getElementById('themeToggle')?.addEventListener('click', () => Theme.toggle());

  /* ═══════════════════════════════════════
     🔗 STATE
     ═══════════════════════════════════════ */

  let referralCode = '—';
  let referralLink = '—';

  /* ═══════════════════════════════════════
     📊 LOAD STATS
     ═══════════════════════════════════════ */

  async function loadStats() {
    try {
      const stats = await API.request('/referral/me');

      referralCode = stats.code || '—';
      referralLink = `${window.location.origin}${window.location.pathname.replace('referral.html', 'register.html')}?ref=${referralCode}`;

      // ─── Code + Link ───
      const codeEl = document.getElementById('referralCode');
      const linkEl = document.getElementById('referralLink');
      if (codeEl) codeEl.textContent = referralCode;
      if (linkEl) linkEl.value = referralLink;

      // ─── Stats ───
      const totalReferrals = stats.total_referrals || 0;
      const lockedAmount = stats.locked_amount || 0;
      const releasedAmount = stats.total_earned || 0;
      const totalEarned = releasedAmount + lockedAmount;

      setText('statTotalReferrals', totalReferrals);
      setText('statLocked', `${lockedAmount.toFixed(2)} AFN`);
      setText('statReleased', `${releasedAmount.toFixed(2)} AFN`);
      setText('statTotalEarned', `${totalEarned.toFixed(2)} AFN`);

    } catch (err) {
      console.error('Failed to load referral stats:', err);
      if (typeof Notifications !== 'undefined') {
        Notifications.error('Failed to load referral data');
      }
    }
  }

  /* ═══════════════════════════════════════
     📋 LOAD REFERRALS LIST
     ═══════════════════════════════════════ */

  async function loadReferralsList() {
    try {
      const list = await API.request('/referral/list');

      const container = document.getElementById('referralsList');
      const countEl = document.getElementById('referralsCount');

      if (countEl) countEl.textContent = list.length;

      if (!list || list.length === 0) {
        return; // empty state already rendered
      }

      container.innerHTML = '';

      list.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'referral-item';

        const isReleased = r.bonus_status === 'released';

        // ─── Steps ───
        const step1 = `<div class="ref-step ${r.registered_at ? 'done' : 'pending'}">
          ${r.registered_at ? '✓' : '⏳'} Registered
        </div>`;

        const step2 = `<div class="ref-step ${r.kyc_completed ? 'done' : 'pending'}">
          ${r.kyc_completed ? '✓' : '⏳'} KYC
        </div>`;

        const step3 = `<div class="ref-step ${r.first_trade_done ? 'done' : 'pending'}">
          ${r.first_trade_done ? '✓' : '⏳'} First Trade
        </div>`;

        // ─── Bonus Badge ───
        const badge = isReleased
          ? '<span class="ref-bonus-badge released">💰 Released</span>'
          : '<span class="ref-bonus-badge locked">🔒 Locked</span>';

        // ─── HTML ───
        card.innerHTML = `
          <div class="ref-item-header">
            <div class="ref-item-name">👤 ${escapeHtml(r.referred_user_name)}</div>
            ${badge}
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

  /* ═══════════════════════════════════════
     📋 COPY TO CLIPBOARD
     ═══════════════════════════════════════ */

  function copyToClipboard(text, button) {
    if (!text || text === '—') {
      if (typeof Notifications !== 'undefined') {
        Notifications.warning('Nothing to copy.');
      }
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showCopied(button))
        .catch(() => fallbackCopy(text, button));
    } else {
      fallbackCopy(text, button);
    }
  }

  function fallbackCopy(text, button) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();

    try {
      document.execCommand('copy');
      showCopied(button);
    } catch (err) {
      if (typeof Notifications !== 'undefined') {
        Notifications.error('Could not copy.');
      }
    }

    document.body.removeChild(ta);
  }

  function showCopied(button) {
    if (!button) return;

    button.classList.add('copied');
    const span = button.querySelector('span');
    const original = span ? span.textContent : '';

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

  /* ═══════════════════════════════════════
     📤 SHARE BUTTONS
     ═══════════════════════════════════════ */

  document.querySelectorAll('.share-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.share;

      const shareText = `Join Aryana Currency — the trusted USDT ↔ AFN exchange! Use my code ${referralCode} and start trading today.`;

      if (type === 'telegram') {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
          '_blank'
        );

      } else if (type === 'whatsapp') {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`,
          '_blank'
        );

      } else if (type === 'facebook') {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
          '_blank'
        );

      } else if (type === 'copy') {
        copyToClipboard(referralLink, btn);
      }
    });
  });

  /* ═══════════════════════════════════════
     🛠️ HELPERS
     ═══════════════════════════════════════ */

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /* ═══════════════════════════════════════
     🚀 INIT
     ═══════════════════════════════════════ */

  await loadStats();
  await loadReferralsList();
});