/**
 * MHM UBA - Authentication Guard
 * 
 * Protects pages that require authentication
 * Redirects unauthenticated users to login page
 * Handles session management and logout
 * 
 * USAGE:
 * Include this script on all protected pages:
 * <script src="assets/js/auth-guard.js"></script>
 * 
 * The guard will automatically:
 * - Check if user is authenticated
 * - Redirect to login if not authenticated
 * - Allow access if authenticated
 * - Handle logout functionality
 */

(function() {
  'use strict';

  // =====================================================
  // CONFIGURATION
  // =====================================================

  const CONFIG = {
    loginPage: 'login.html',
    signupPage: 'signup.html',
    homePage: 'index.html',
    redirectDelay: 100 // ms to wait before redirecting
  };

  // List of pages that require authentication
  const PROTECTED_PAGES = [
    'index.html',
    'clients.html',
    'projects.html',
    'tasks.html',
    'invoices.html',
    'settings.html',
    'reports.html',
    'files.html',
    'leads.html',
    'expenses.html',
    'calendar.html',
    'automations.html',
    'insights.html',
    'help.html',
    'assistant.html',
    'smart-tools.html'
  ];

  // List of public pages (no authentication required)
  const PUBLIC_PAGES = [
    'login.html',
    'signup.html',
    '404.html',
    'demo-index.html',
    'demo-gallery.html',
    'success.html'
  ];

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  /**
   * Get current page filename
   * @returns {string}
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page;
  }

  /**
   * Check if current page is protected
   * @returns {boolean}
   */
  function isProtectedPage() {
    const currentPage = getCurrentPage();
    return PROTECTED_PAGES.includes(currentPage);
  }

  /**
   * Check if current page is public
   * @returns {boolean}
   */
  function isPublicPage() {
    const currentPage = getCurrentPage();
    return PUBLIC_PAGES.includes(currentPage);
  }

  /**
   * Redirect to login page
   * @param {string} reason - Optional reason for redirect
   */
  function redirectToLogin(reason = '') {
    console.log('[Auth Guard] Redirecting to login:', reason || 'No session');
    
    // Store the intended destination
    const currentPage = getCurrentPage();
    if (currentPage && currentPage !== CONFIG.loginPage) {
      sessionStorage.setItem('uba_redirect_after_login', currentPage);
    }

    // Redirect to login
    setTimeout(() => {
      window.location.href = CONFIG.loginPage;
    }, CONFIG.redirectDelay);
  }

  /**
   * Redirect to home page
   */
  function redirectToHome() {
    console.log('[Auth Guard] Redirecting to home');
    setTimeout(() => {
      window.location.href = CONFIG.homePage;
    }, CONFIG.redirectDelay);
  }

  /**
   * Handle post-login redirect
   */
  function handlePostLoginRedirect() {
    const redirectTo = sessionStorage.getItem('uba_redirect_after_login');
    
    if (redirectTo && PROTECTED_PAGES.includes(redirectTo)) {
      console.log('[Auth Guard] Redirecting to intended page:', redirectTo);
      sessionStorage.removeItem('uba_redirect_after_login');
      window.location.href = redirectTo;
    } else {
      redirectToHome();
    }
  }

  // =====================================================
  // AUTHENTICATION CHECK
  // =====================================================

  /**
   * Check if user has valid session
   * @returns {Promise<boolean>}
   */
  async function checkAuthentication() {
    // If UbaAPI is not available, allow access (fallback to demo mode)
    if (!window.UbaAPI || !window.UbaAPI.isReady()) {
      console.warn('[Auth Guard] UbaAPI not available, allowing access');
      return true;
    }

    try {
      // Check for active session
      const sessionResult = await window.UbaAPI.auth.getSession();
      
      if (sessionResult.success && sessionResult.data) {
        console.log('[Auth Guard] ✅ Valid session found');
        return true;
      }

      // Try to get current user
      const userResult = await window.UbaAPI.auth.getCurrentUser();
      
      if (userResult.success && userResult.data) {
        console.log('[Auth Guard] ✅ User authenticated');
        return true;
      }

      console.log('[Auth Guard] ❌ No valid session');
      return false;
    } catch (error) {
      console.error('[Auth Guard] Authentication check failed:', error);
      return false;
    }
  }

  // =====================================================
  // PAGE GUARD
  // =====================================================

  /**
   * Guard the current page
   */
  async function guardPage() {
    const currentPage = getCurrentPage();
    
    console.log('[Auth Guard] Checking page:', currentPage);

    // Allow access to public pages
    if (isPublicPage()) {
      console.log('[Auth Guard] Public page, allowing access');
      return;
    }

    // Check authentication for protected pages
    if (isProtectedPage()) {
      const isAuthenticated = await checkAuthentication();

      if (!isAuthenticated) {
        console.log('[Auth Guard] Protected page, no auth, redirecting to login');
        redirectToLogin('Authentication required');
        return;
      }

      console.log('[Auth Guard] Protected page, authenticated, allowing access');
      return;
    }

    // Default: allow access
    console.log('[Auth Guard] Page not in protected list, allowing access');
  }

  // =====================================================
  // LOGOUT FUNCTIONALITY
  // =====================================================

  /**
   * Handle logout
   */
  async function handleLogout() {
    console.log('[Auth Guard] Logging out user');

    // Clear any cached data
    sessionStorage.removeItem('uba_redirect_after_login');
    
    // If UbaAPI is available, use it to logout
    if (window.UbaAPI && window.UbaAPI.isReady()) {
      try {
        const result = await window.UbaAPI.auth.logout();
        
        if (result.success) {
          console.log('[Auth Guard] Logout successful');
        } else {
          console.error('[Auth Guard] Logout failed:', result.error);
        }
      } catch (error) {
        console.error('[Auth Guard] Logout error:', error);
      }
    }

    // Clear localStorage (demo mode data)
    const demoKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('uba-') || key.startsWith('ubaLanguage')
    );
    
    // Optionally clear demo data (commented out to preserve data)
    // demoKeys.forEach(key => localStorage.removeItem(key));

    // Redirect to login
    redirectToLogin('Logged out');
  }

  /**
   * Setup logout button listeners
   */
  function setupLogoutListeners() {
    // Find all logout buttons/links
    const logoutElements = document.querySelectorAll('[data-action="logout"], .logout-btn, #logoutBtn');

    logoutElements.forEach(element => {
      element.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogout();
      });
    });

    // Global logout function
    window.logout = handleLogout;

    console.log('[Auth Guard] Logout listeners set up');
  }

  // =====================================================
  // SESSION MONITORING
  // =====================================================

  /**
   * Monitor session for expiration
   */
  function monitorSession() {
    if (!window.UbaAPI || !window.UbaAPI.isReady()) {
      return;
    }

    // Check session every 5 minutes
    const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

    setInterval(async () => {
      if (isProtectedPage()) {
        const isAuthenticated = await checkAuthentication();
        
        if (!isAuthenticated) {
          console.log('[Auth Guard] Session expired, redirecting to login');
          redirectToLogin('Session expired');
        }
      }
    }, CHECK_INTERVAL);

    console.log('[Auth Guard] Session monitoring active');
  }

  // =====================================================
  // POST-LOGIN HANDLING
  // =====================================================

  /**
   * Handle successful login on login page
   */
  function setupLoginPageHandler() {
    const currentPage = getCurrentPage();
    
    if (currentPage === CONFIG.loginPage || currentPage === CONFIG.signupPage) {
      // Store a function that login page can call after successful auth
      window.onAuthSuccess = function() {
        console.log('[Auth Guard] Authentication successful');
        handlePostLoginRedirect();
      };

      console.log('[Auth Guard] Login page handler set up');
    }
  }

  // =====================================================
  // INITIALIZE
  // =====================================================

  /**
   * Initialize auth guard
   */
  async function initialize() {
    console.log('[Auth Guard] Initializing...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
      return;
    }

    // Guard the current page
    await guardPage();

    // Setup logout functionality
    setupLogoutListeners();

    // Setup login page handler
    setupLoginPageHandler();

    // Monitor session
    monitorSession();

    console.log('[Auth Guard] ✅ Initialized successfully');
  }

  // =====================================================
  // EXPORT UTILITIES
  // =====================================================

  // Export utilities for use by other scripts
  window.UbaAuthGuard = {
    checkAuthentication,
    redirectToLogin,
    redirectToHome,
    handleLogout,
    isProtectedPage,
    isPublicPage,
    getCurrentPage
  };

  // =====================================================
  // AUTO-INITIALIZE
  // =====================================================

  // Initialize when script loads
  initialize();

})();

/**
 * USAGE EXAMPLES:
 * 
 * 1. Protect a page:
 *    Just include this script - it will auto-check authentication
 * 
 * 2. Manual logout:
 *    <button onclick="logout()">Logout</button>
 *    OR
 *    <button data-action="logout">Logout</button>
 * 
 * 3. Check auth status manually:
 *    const isAuth = await window.UbaAuthGuard.checkAuthentication();
 * 
 * 4. After successful login (in login.html):
 *    if (window.onAuthSuccess) {
 *      window.onAuthSuccess();
 *    }
 * 
 * 5. Force redirect to login:
 *    window.UbaAuthGuard.redirectToLogin('Please log in');
 */
