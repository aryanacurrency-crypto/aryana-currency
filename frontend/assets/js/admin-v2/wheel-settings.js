/* ═══════════════════════════════════════
   ARYANA CURRENCY — Admin Wheel Settings
   ═══════════════════════════════════════ */

window.ADMIN_SKIP_AUTO_INIT = true;

document.addEventListener('DOMContentLoaded', async () => {
  await AdminCommon.init();

  let state = {
    settings: null,
    prizes: [],
  };

  // ═══════════════════════════════════════
  //              Tabs
  // ═══════════════════════════════════════
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const panelId = 'panel' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
      document.getElementById(panelId)?.classList.add('active');
    });
  });

  // ═══════════════════════════════════════
  //           Load Stats
  // ═══════════════════════════════════════
  async function loadStats() {
    try {
      const stats = await API.request('/admin/wheel/stats');
      document.getElementById('statTotalSpins').textContent = stats.total_spins || 0;
      document.getElementById('statTicketsSold').textContent = stats.total_tickets_sold || 0;
      document.getElementById('statTotalPaid').textContent = (stats.total_paid_cash_afn || 0).toFixed(0);
      document.getElementById('statPending').textContent = stats.pending_approvals || 0;
    } catch (e) {
      console.error('Stats failed:', e);
    }
  }

  // ═══════════════════════════════════════
  //           Load Settings
  // ═══════════════════════════════════════
  async function loadSettings() {
    try {
      const s = await API.request('/admin/wheel/settings');
      state.settings = s;

      document.getElementById('setIsEnabled').checked = s.is_enabled;
      document.getElementById('setTicketPrice').value = s.ticket_price;
      document.getElementById('setTicketExpiry').value = s.ticket_expiry_days;
      document.getElementById('setMaxSpins').value = s.max_spins_per_day;
      document.getElementById('setMinInterval').value = s.min_spin_interval_seconds;
      document.getElementById('setSoundEnabled').checked = s.sound_enabled;

      document.getElementById('setTicketOnKyc').checked = s.ticket_on_signup_kyc;
      document.getElementById('setTicketOnKycCount').value = s.ticket_on_signup_kyc_count;
      document.getElementById('setTicketOnTrade').checked = s.ticket_on_successful_trade;
      document.getElementById('setTicketOnTradeCount').value = s.ticket_on_successful_trade_count;
      document.getElementById('setPurchaseEnabled').checked = s.ticket_purchase_enabled;

      document.getElementById('setAnimDuration').value = s.animation_duration_seconds;
      document.getElementById('setNearJackpot').value = s.near_jackpot_chance_percent;
      document.getElementById('setNearMin').value = s.near_jackpot_offset_min;
      document.getElementById('setNearMax').value = s.near_jackpot_offset_max;
      document.getElementById('setApprovalAbove').value = s.require_admin_approval_above;
      document.getElementById('setMaxBigPrize').value = s.max_big_prize_per_day;

    } catch (e) {
      console.error('Settings load failed:', e);
      Notifications.error('Failed to load settings');
    }
  }

  // ═══════════════════════════════════════
  //         Save Settings
  // ═══════════════════════════════════════
  document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('saveSettingsBtn');
    btn.disabled = true;

    try {
      const payload = {
        is_enabled: document.getElementById('setIsEnabled').checked,
        ticket_price: parseFloat(document.getElementById('setTicketPrice').value),
        ticket_expiry_days: parseInt(document.getElementById('setTicketExpiry').value, 10),
        max_spins_per_day: parseInt(document.getElementById('setMaxSpins').value, 10),
        min_spin_interval_seconds: parseInt(document.getElementById('setMinInterval').value, 10),
        sound_enabled: document.getElementById('setSoundEnabled').checked,
        ticket_on_signup_kyc: document.getElementById('setTicketOnKyc').checked,
        ticket_on_signup_kyc_count: parseInt(document.getElementById('setTicketOnKycCount').value, 10),
        ticket_on_successful_trade: document.getElementById('setTicketOnTrade').checked,
        ticket_on_successful_trade_count: parseInt(document.getElementById('setTicketOnTradeCount').value, 10),
        ticket_purchase_enabled: document.getElementById('setPurchaseEnabled').checked,
        animation_duration_seconds: parseFloat(document.getElementById('setAnimDuration').value),
        near_jackpot_chance_percent: parseFloat(document.getElementById('setNearJackpot').value),
        near_jackpot_offset_min: parseInt(document.getElementById('setNearMin').value, 10),
        near_jackpot_offset_max: parseInt(document.getElementById('setNearMax').value, 10),
        require_admin_approval_above: parseFloat(document.getElementById('setApprovalAbove').value),
        max_big_prize_per_day: parseInt(document.getElementById('setMaxBigPrize').value, 10),
      };

      await API.request('/admin/wheel/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      Notifications.success('✅ Settings saved');
    } catch (e) {
      console.error(e);
      Notifications.error(e.detail || 'Failed to save');
    } finally {
      btn.disabled = false;
    }
  });

  // ═══════════════════════════════════════
  //           Load Prizes
  // ═══════════════════════════════════════
  async function loadPrizes() {
    try {
      const data = await API.request('/admin/wheel/prizes');
      state.prizes = data.prizes || [];

      renderPrizes();
      updateProbabilityTotal(data.total_probability);
    } catch (e) {
      console.error('Prizes load failed:', e);
      Notifications.error('Failed to load prizes');
    }
  }

  function renderPrizes() {
    const body = document.getElementById('prizesBody');
    if (!body) return;

    if (!state.prizes.length) {
      body.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-tertiary); padding:40px;">No prizes yet</td></tr>`;
      return;
    }

    body.innerHTML = state.prizes.map(p => `
      <tr>
        <td>${p.sort_order}</td>
        <td style="font-size:20px;">${p.icon || '—'}</td>
        <td><strong>${escapeHtml(p.label)}</strong></td>
        <td><span class="admin-badge ${p.prize_type === 'cash' ? 'gold' : p.prize_type === 'ticket' ? 'red' : 'gray'}">${p.prize_type}</span></td>
        <td><strong>${p.prize_type === 'cash' ? p.amount + ' AFN' : p.prize_type === 'ticket' ? p.ticket_count + ' 🎟️' : '—'}</strong></td>
        <td><strong style="color:${p.probability_percent > 0 ? 'var(--gold)' : 'var(--text-tertiary)'};">${p.probability_percent.toFixed(4)}%</strong></td>
        <td>${p.is_active ? '<span class="admin-badge green">Active</span>' : '<span class="admin-badge gray">Inactive</span>'}</td>
        <td>
          <div class="admin-actions">
            <button class="admin-btn secondary" data-action="edit" data-id="${p.id}">✏️ Edit</button>
            <button class="admin-btn ${p.is_active ? 'danger' : 'primary'}" data-action="toggle" data-id="${p.id}">${p.is_active ? 'Off' : 'On'}</button>
            <button class="admin-btn danger" data-action="delete" data-id="${p.id}">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Event listeners
    body.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const action = btn.dataset.action;

        if (action === 'edit') openPrizeModal(id);
        else if (action === 'toggle') togglePrize(id);
        else if (action === 'delete') deletePrize(id);
      });
    });
  }

  function updateProbabilityTotal(total) {
    const el = document.getElementById('totalProb');
    const status = document.getElementById('probStatus');
    if (!el) return;

    el.textContent = total.toFixed(4) + '%';

    if (Math.abs(total - 100) < 0.01) {
      el.style.color = 'var(--green)';
      status.textContent = '✅';
    } else if (total > 100) {
      el.style.color = 'var(--red)';
      status.textContent = '❌ Too high';
    } else {
      el.style.color = 'var(--gold)';
      status.textContent = '⚠️';
    }
  }

  // ═══════════════════════════════════════
  //         Prize Modal
  // ═══════════════════════════════════════
  const prizeModal = document.getElementById('prizeModal');

  document.getElementById('addPrizeBtn')?.addEventListener('click', () => openPrizeModal());
  document.getElementById('closePrizeModal')?.addEventListener('click', closePrizeModal);
  document.getElementById('cancelPrizeBtn')?.addEventListener('click', closePrizeModal);

  prizeModal?.addEventListener('click', (e) => {
    if (e.target === prizeModal) closePrizeModal();
  });

  function openPrizeModal(prizeId = null) {
    const title = document.getElementById('prizeModalTitle');
    const hiddenId = document.getElementById('prizeId');

    if (prizeId) {
      const p = state.prizes.find(x => x.id === prizeId);
      if (!p) return;

      title.textContent = '✏️ Edit Prize';
      hiddenId.value = p.id;

      document.getElementById('prizeType').value = p.prize_type;
      document.getElementById('prizeSortOrder').value = p.sort_order;
      document.getElementById('prizeIcon').value = p.icon || '';
      document.getElementById('prizeColor').value = p.color;
      document.getElementById('prizeLabel').value = p.label;
      document.getElementById('prizeAmount').value = p.amount;
      document.getElementById('prizeTicketCount').value = p.ticket_count;
      document.getElementById('prizeProbability').value = p.probability_percent;
      document.getElementById('prizeMaxDay').value = p.max_wins_per_day || '';
      document.getElementById('prizeMaxUser').value = p.max_wins_per_user || '';
      document.getElementById('prizeIsActive').checked = p.is_active;

    } else {
      title.textContent = '🎁 Add Prize';
      hiddenId.value = '';

      document.getElementById('prizeType').value = 'cash';
      document.getElementById('prizeSortOrder').value = state.prizes.length;
      document.getElementById('prizeIcon').value = '🏆';
      document.getElementById('prizeColor').value = '#FFD700';
      document.getElementById('prizeLabel').value = '';
      document.getElementById('prizeAmount').value = '10';
      document.getElementById('prizeTicketCount').value = '0';
      document.getElementById('prizeProbability').value = '0';
      document.getElementById('prizeMaxDay').value = '';
      document.getElementById('prizeMaxUser').value = '';
      document.getElementById('prizeIsActive').checked = true;
    }

    prizeModal.style.display = 'flex';
  }

  function closePrizeModal() {
    prizeModal.style.display = 'none';
  }

  // Save prize
  document.getElementById('savePrizeBtn')?.addEventListener('click', async () => {
    const id = document.getElementById('prizeId').value;
    const isEdit = !!id;
    const btn = document.getElementById('savePrizeBtn');

    const payload = {
      sort_order: parseInt(document.getElementById('prizeSortOrder').value, 10) || 0,
      prize_type: document.getElementById('prizeType').value,
      label: document.getElementById('prizeLabel').value.trim(),
      icon: document.getElementById('prizeIcon').value.trim() || null,
      color: document.getElementById('prizeColor').value,
      amount: parseFloat(document.getElementById('prizeAmount').value) || 0,
      ticket_count: parseInt(document.getElementById('prizeTicketCount').value, 10) || 0,
      probability_percent: parseFloat(document.getElementById('prizeProbability').value) || 0,
      is_active: document.getElementById('prizeIsActive').checked,
    };

    const maxDay = document.getElementById('prizeMaxDay').value;
    if (maxDay) payload.max_wins_per_day = parseInt(maxDay, 10);

    const maxUser = document.getElementById('prizeMaxUser').value;
    if (maxUser) payload.max_wins_per_user = parseInt(maxUser, 10);

    if (!payload.label) {
      Notifications.error('Label is required');
      return;
    }

    btn.disabled = true;

    try {
      if (isEdit) {
        await API.request(`/admin/wheel/prizes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        Notifications.success('✅ Prize updated');
      } else {
        await API.request('/admin/wheel/prizes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        Notifications.success('✅ Prize created');
      }

      closePrizeModal();
      await loadPrizes();
    } catch (e) {
      console.error(e);
      Notifications.error(e.detail || 'Failed to save prize');
    } finally {
      btn.disabled = false;
    }
  });

  // Toggle prize
  async function togglePrize(id) {
    try {
      await API.request(`/admin/wheel/prizes/${id}/toggle`, { method: 'PATCH' });
      await loadPrizes();
    } catch (e) {
      Notifications.error(e.detail || 'Failed to toggle');
    }
  }

  // Delete prize
  async function deletePrize(id) {
    if (!confirm('Delete this prize?')) return;

    try {
      await API.request(`/admin/wheel/prizes/${id}`, { method: 'DELETE' });
      Notifications.success('✅ Prize deleted');
      await loadPrizes();
    } catch (e) {
      Notifications.error(e.detail || 'Failed to delete');
    }
  }

  // ═══════════════════════════════════════
  //              Helpers
  // ═══════════════════════════════════════
  function escapeHtml(t) {
    if (!t) return '';
    const div = document.createElement('div');
    div.textContent = String(t);
    return div.innerHTML;
  }

  // ═══════════════════════════════════════
  //              Init Load
  // ═══════════════════════════════════════
  try {
    await loadStats();
    await loadSettings();
    await loadPrizes();
    AdminCommon.hideLoading();
  } catch (e) {
    console.error(e);
  }
});