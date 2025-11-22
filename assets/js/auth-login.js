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

  /**
   * Check if user already has an active session
   */
  async function checkExistingSession() {
    if (!window.UBAApi || !window.UBAApi.auth) {
      console.warn('[Auth] Supabase API not available - running in local mode');
      return;
    }

    try {
      const session = await window.UBAApi.auth.getSession();
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

    // Basic validation
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }

    if (!validateEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }

    // Check if Supabase is available
    if (!window.UBAApi || !window.UBAApi.auth) {
      showError('Authentication service not available. Please configure Supabase.');
      return;
    }

    // Disable submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
    }

    try {
      const result = await window.UBAApi.auth.login(email, password);
      
      if (result && result.user) {
        console.log('[Auth] Login successful:', result.user.email);
        
        // Store user info in memory only (not localStorage for security)
        window.currentUser = result.user;
        
        // Redirect to dashboard
        window.location.href = 'index.html';
      } else {
        showError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address first';
        } else {
          errorMessage = error.message;
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
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    } else {
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
