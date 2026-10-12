/* ═══════════════════════════════════════
   ARYANA CURRENCY — API Client
   ═══════════════════════════════════════ */

const API = {
  async request(path, options = {}) {
    const url = `${CONFIG.API_BASE}${path}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = localStorage.getItem(CONFIG.STORAGE.ACCESS_TOKEN);
    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 && !options.skipAuth && !options.skipRefresh) {
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            return this.request(path, { ...options, skipRefresh: true });
          }
        }

        throw {
          status: res.status,
          detail: data.detail || 'Request failed',
          data,
        };
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      throw {
        status: 0,
        detail: 'Network error. Please try again.',
        data: null,
      };
    }
  },

  async tryRefresh() {
    const refreshToken = localStorage.getItem(CONFIG.STORAGE.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        if (typeof Auth !== 'undefined') Auth.logout();
        return false;
      }

      const data = await res.json();
      localStorage.setItem(CONFIG.STORAGE.ACCESS_TOKEN, data.access_token);
      return true;
    } catch {
      if (typeof Auth !== 'undefined') Auth.logout();
      return false;
    }
  },

  // ═══════════════════════════════════════
  //              Auth
  // ═══════════════════════════════════════

  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },

  forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  },

  resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
      skipAuth: true,
    });
  },

  me() {
    return this.request('/auth/me');
  },

  updateProfile(data) {
    return this.request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  // ═══════════════════════════════════════
  //              Public
  // ═══════════════════════════════════════

  getPaymentInfo() {
    return this.request('/public/payment-info', { skipAuth: true });
  },

  // ═══════════════════════════════════════
  //              Rates
  // ═══════════════════════════════════════

  getCurrentRate() {
    return this.request('/rates/current', { skipAuth: true });
  },

  getRateHistory(limit = 50) {
    return this.request(`/rates/history?limit=${limit}`, { skipAuth: true });
  },

  setRate(buyPrice, sellPrice) {
    return this.request('/rates/', {
      method: 'POST',
      body: JSON.stringify({
        buy_price_afn: String(buyPrice),
        sell_price_afn: String(sellPrice),
      }),
    });
  },

  // ═══════════════════════════════════════
  //              Wallet
  // ═══════════════════════════════════════

  getWallets() {
    return this.request('/wallet/');
  },

  // ═══════════════════════════════════════
  //              Orders (User)
  // ═══════════════════════════════════════

  createOrder(side, amountUsdt) {
    return this.request('/orders/', {
      method: 'POST',
      body: JSON.stringify({ side, amount_usdt: String(amountUsdt) }),
    });
  },

  getMyOrders(statusFilter = null) {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    return this.request(`/orders/my${q}`);
  },

  getMyOrder(id) {
    return this.request(`/orders/my/${id}`);
  },

  submitPayment(orderId, paymentReference, note = null) {
    return this.request(`/orders/${orderId}/submit-payment`, {
      method: 'POST',
      body: JSON.stringify({ payment_reference: paymentReference, note }),
    });
  },

  cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/cancel`, { method: 'POST' });
  },

  // ═══════════════════════════════════════
  //              Admin
  // ═══════════════════════════════════════

  getAdminStats() {
    return this.request('/admin/stats');
  },

  getAdminUsers(search = '') {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/admin/users${q}`);
  },

  getUserDetail(userId) {
    return this.request(`/admin/users/${userId}`);
  },

  toggleUserActive(userId) {
    return this.request(`/admin/users/${userId}/toggle-active`, { method: 'POST' });
  },

  getUserWallets(userId) {
    return this.request(`/admin/users/${userId}/wallets`);
  },

  getPendingOrders() {
    return this.request('/admin/orders/pending');
  },

  getAdminOrders(statusFilter = null, side = null) {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (side) params.append('side', side);
    const q = params.toString() ? `?${params}` : '';
    return this.request(`/orders/admin/all${q}`);
  },

  getAdminOrderDetail(orderId) {
    return this.request(`/admin/orders/${orderId}`);
  },

  adminCompleteOrder(orderId, platformRef, adminNote = null) {
    return this.request(`/orders/${orderId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        platform_payment_reference: platformRef,
        admin_note: adminNote,
      }),
    });
  },

  adminRejectOrder(orderId, reason) {
    return this.request(`/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ═══════════════════════════════════════
  //              KYC
  // ═══════════════════════════════════════

  getKycStatus() {
    return this.request('/kyc/status');
  },

  async uploadKycDocument(docType, file) {
    const formData = new FormData();
    formData.append('doc_type', docType);
    formData.append('file', file);

    const token = localStorage.getItem(CONFIG.STORAGE.ACCESS_TOKEN);
    const res = await fetch(`${CONFIG.API_BASE}/kyc/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw { status: res.status, detail: data.detail || 'Upload failed', data };
    }
    return data;
  },

  getPendingKyc() {
    return this.request('/kyc/admin/pending');
  },

  approveKyc(docId) {
    return this.request(`/kyc/admin/${docId}/approve`, { method: 'POST' });
  },

  rejectKyc(docId, reason) {
    return this.request(`/kyc/admin/${docId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getKycStats() {
    return this.request('/kyc/admin/stats');
  },
};