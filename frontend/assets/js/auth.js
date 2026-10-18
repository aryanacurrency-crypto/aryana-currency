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
  //  دقیقاً بر اساس فیلد is_verified
  // ═══════════════════════════════════════
  async checkKycVerified() {
    console.log("🛡️ [KYC] Checking verification status...");
    
    // 1. چک سریع از روی لوکال استوری
    const user = this.getUser();
    if (user) {
      console.log("🛡️ [KYC] Local user is_verified:", user.is_verified);
      if (user.is_verified === true) {
        console.log("🛡️ [KYC] ✅ Verified from local storage");
        return true;
      }
    }

    // 2. اگه لوکال استوری قدیمی بود یا مقدار نداشت، مستقیم از سرور می‌پرسیم
    try {
      if (typeof API === 'undefined') {
        console.log("🛡️ [KYC] ❌ API undefined");
        return false;
      }
      
      console.log("🛡️ [KYC] Fetching from server...");
      const freshUser = await API.me();
      if (freshUser) {
        console.log("🛡️ [KYC] Server user is_verified:", freshUser.is_verified);
        this.setUser(freshUser); // آپدیت لوکال استوری
        if (freshUser.is_verified === true) {
          console.log("🛡️ [KYC] ✅ Verified from server");
          return true;
        }
      }
    } catch (e) {
      console.error('🛡️ [KYC] ❌ Failed to check from server:', e);
    }

    console.log("🛡️ [KYC] ❌ Not verified");
    return false;
  }
};

window.Auth = Auth;