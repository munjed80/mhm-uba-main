/**
 * Session Guard for Protected Pages
 * Checks if user is authenticated and redirects to login if not
 */

(function() {
  'use strict';

  // List of protected pages that require authentication
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
    'automations.html'
  ];

  // List of public pages (no auth required)
  const PUBLIC_PAGES = [
    'login.html',
    'signup.html',
    '404.html',
    'demo-index.html',
    'demo-gallery.html'
  ];

  /**
   * Check if current page requires authentication
   */
  function isProtectedPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    return PROTECTED_PAGES.includes(currentPage);
  }

  /**
   * Check if current page is public
   */
  function isPublicPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    return PUBLIC_PAGES.includes(currentPage);
  }

  /**
   * Check authentication and redirect if needed
   */
  async function checkAuth() {
    // Skip auth check for public pages
    if (isPublicPage()) {
      console.log('[AuthGuard] Public page, skipping auth check');
      return;
    }

    // If not a protected page, allow access
    if (!isProtectedPage()) {
      console.log('[AuthGuard] Non-protected page, allowing access');
      return;
    }

    // Check if Supabase is configured
    if (!window.UBAApi || !window.UBAApi.auth) {
      console.warn('[AuthGuard] Supabase not configured - allowing access (demo mode)');
      return;
    }

    try {
      const session = await window.UBAApi.auth.getSession();
      
      if (!session || !session.user) {
        console.warn('[AuthGuard] No active session, redirecting to login...');
        // Store the intended destination
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
        window.location.href = 'login.html';
        return;
      }

      // Session is valid
      console.log('[AuthGuard] Session valid for user:', session.user.email);
      
      // Store user in memory for the session
      window.currentUser = session.user;
      
      // Update UI with user info if elements exist
      updateUserUI(session.user);
      
    } catch (error) {
      console.error('[AuthGuard] Session check failed:', error);
      // On error, redirect to login
      window.location.href = 'login.html';
    }
  }

  /**
   * Update UI elements with user information
   */
  function updateUserUI(user) {
    // Update user name displays
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = user.user_metadata?.name || user.email;
    });

    // Update user email displays
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = user.email;
    });

    // Show logout button if it exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && !logoutBtn.hasAttribute('data-listener')) {
      logoutBtn.addEventListener('click', handleLogout);
      logoutBtn.setAttribute('data-listener', 'true');
    }
  }

  /**
   * Handle logout
   */
  async function handleLogout(e) {
    if (e) e.preventDefault();

    if (!window.UBAApi || !window.UBAApi.auth) {
      console.warn('[AuthGuard] Supabase not configured');
      return;
    }

    try {
      await window.UBAApi.auth.logout();
      window.currentUser = null;
      console.log('[AuthGuard] Logout successful');
      window.location.href = 'login.html';
    } catch (error) {
      console.error('[AuthGuard] Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  }

  // Export logout function globally
  window.logout = handleLogout;

  // Run auth check on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }

})();
