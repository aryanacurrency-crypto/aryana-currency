/* ═══════════════════════════════════════
   ARYANA CURRENCY — Auth Manager
   Token storage, user state, redirects
   ═══════════════════════════════════════ */

const Auth = {
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(CONFIG.STORAGE.ACCESS_TOKEN, accessToken);
    localStorage.setItem(CONFIG.STORAGE.REFRESH_TOKEN, refreshToken);
  },

  getAccessToken() {
    return localStorage.getItem(CONFIG.STORAGE.ACCESS_TOKEN);
  },

  getRefreshToken() {
    return localStorage.getItem(CONFIG.STORAGE.REFRESH_TOKEN);
  },

  setUser(user) {
    localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
  },

  getUser() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getAccessToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  },

  logout() {
    localStorage.removeItem(CONFIG.STORAGE.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE.USER);
    window.location.href = this.getBasePath() + 'pages/login.html';
  },

  getBasePath() {
    if (window.location.pathname.includes('/pages/')) {
      return '../';
    }
    return '';
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = this.getBasePath() + 'pages/login.html';
    }
  },

  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = this.getBasePath() + 'pages/dashboard.html';
    }
  },

  // ═══════════════════════════════════════
  //  KYC Verification Check (Server-Side)
  //  کاملاً بر اساس فیلد is_verified در بک‌اند
  // ═══════════════════════════════════════
  async checkKycVerified() {
    // 1. چک سریع از روی لوکال استوری
    const user = this.getUser();
    if (user && user.is_verified === true) {
      return true;
    }

    // 2. اگه لوکال استوری قدیمی بود، مستقیم از سرور می‌پرسیم
    try {
      if (typeof API === 'undefined') return false;
      
      const freshUser = await API.me();
      if (freshUser) {
        this.setUser(freshUser); // آپدیت لوکال استوری برای بارهای بعدی
        if (freshUser.is_verified === true) {
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to check KYC status from server:', e);
    }

    return false;
  }
};

window.Auth = Auth;