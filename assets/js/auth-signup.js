/**
 * Signup Page Logic with Supabase Authentication
 * Handles user registration and redirects
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

    // Bind signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
    }

    // Bind "Go to login" link
    const loginLink = document.getElementById('goto-login');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
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
   * Handle signup form submission
   */
  async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    const errorDiv = document.getElementById('signup-error');
    const submitBtn = document.getElementById('submit-signup');

    // Clear previous errors
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }

    if (name.length < 2) {
      showError('Name must be at least 2 characters');
      return;
    }

    if (!validateEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
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
      submitBtn.textContent = 'Creating account...';
    }

    try {
      const result = await window.UBAApi.auth.signup(email, password, { name });
      
      if (result && result.user) {
        console.log('[Auth] Signup successful:', result.user.email);
        
        // Show success message
        const successDiv = document.getElementById('signup-success');
        if (successDiv) {
          successDiv.textContent = 'Account created! Redirecting to login...';
          successDiv.style.display = 'block';
        } else {
          alert('Account created successfully! Please login.');
        }
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        showError('Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('[Auth] Signup error:', error);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please login instead.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError(errorMessage);
    } finally {
      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create account';
      }
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    const errorDiv = document.getElementById('signup-error');
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
