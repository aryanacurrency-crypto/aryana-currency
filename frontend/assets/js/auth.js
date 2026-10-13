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
};

window.Auth = Auth;