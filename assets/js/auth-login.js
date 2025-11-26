/**
 * Login Page Logic with Supabase Authentication
 * Handles user login, session management, and redirects
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Check if already logged in
    checkExistingSession();

    // Bind login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Bind "Go to signup" link
    const signupLink = document.getElementById('goto-signup');
    if (signupLink) {
      signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'signup.html';
      });
    }
  }

  function getApi() {
    return window.UbaAPI || window.UBAApi;
  }

  /**
   * Check if user already has an active session
   */
  async function checkExistingSession() {
    const api = getApi();
    if (!api || !api.auth) {
      console.warn('[Auth] Supabase API not available - running in local mode');
      return;
    }

    try {
      const session = await api.auth.getSession();
      if (session && session.user) {
        console.log('[Auth] Active session found, redirecting to dashboard...');
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('[Auth] Session check failed:', error);
    }
  }

  /**
   * Handle login form submission
   */
  async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('submit-login');

    // Clear previous errors
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }

    // Clear form errors if UI helpers are available
    if (window.UBAFormHelpers) {
      window.UBAFormHelpers.clearFormErrors('login-form');
    }

    // Basic validation
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }

    if (!validateEmail(email)) {
      showError('Please enter a valid email address');
      if (window.UBAFormHelpers) {
        window.UBAFormHelpers.showFieldError('email', 'Invalid email address');
      }
      return;
    }

    // Check if Supabase is available
    const api = getApi();
    if (!api || !api.auth) {
      showError('Authentication service not available. Please configure Supabase.');
      return;
    }

    // Disable submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
    }

    try {
      const result = await api.auth.login(email, password);
      
      if (result && result.user) {
        console.log('[Auth] Login successful:', result.user.email);
        
        // Store user info in memory only (not localStorage for security)
        window.currentUser = result.user;
        
        // Show success notification (Week 5 improvement)
        if (window.notifySuccess) {
          window.notifySuccess('Login successful! Redirecting...', 1500);
        }
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      } else {
        showError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      
      // Improved error handling (Week 5 requirement)
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
          errorMessage = 'Invalid email or password';
        } else if (msg.includes('email not confirmed') || msg.includes('confirm')) {
          errorMessage = 'Please confirm your email address first';
        } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // Don't expose raw Supabase errors to users
          errorMessage = 'Unable to sign in. Please try again later.';
          console.error('[Auth] Raw error:', error.message);
        }
      }
      
      showError(errorMessage);
    } finally {
      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
      }
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    // Use notifications if available (Week 5)
    if (window.notifyError) {
      window.notifyError(message, 5000);
    }
    
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    } else if (!window.notifyError) {
      alert('Error: ' + message);
    }
  }

  /**
   * Simple email validation
   */
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

})();
