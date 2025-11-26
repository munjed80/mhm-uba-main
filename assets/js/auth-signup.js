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

    // Clear form errors if UI helpers are available
    if (window.UBAFormHelpers) {
      window.UBAFormHelpers.clearFormErrors('signup-form');
    }

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }

    if (name.length < 2) {
      showError('Name must be at least 2 characters');
      if (window.UBAFormHelpers) {
        window.UBAFormHelpers.showFieldError('name', 'Name must be at least 2 characters');
      }
      return;
    }

    if (!validateEmail(email)) {
      showError('Please enter a valid email address');
      if (window.UBAFormHelpers) {
        window.UBAFormHelpers.showFieldError('email', 'Invalid email address');
      }
      return;
    }

    // Enhanced password validation (Week 5 requirement)
    if (window.UBASecurity) {
      const passwordCheck = window.UBASecurity.validatePassword(password);
      if (!passwordCheck.valid) {
        showError(passwordCheck.errors.join('. '));
        if (window.UBAFormHelpers) {
          window.UBAFormHelpers.showFieldError('password', passwordCheck.errors[0]);
        }
        return;
      }
    } else {
      // Fallback validation
      if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
      }
      if (!/[a-zA-Z]/.test(password)) {
        showError('Password must contain at least one letter');
        return;
      }
      if (!/\d/.test(password)) {
        showError('Password must contain at least one number');
        return;
      }
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      if (window.UBAFormHelpers) {
        window.UBAFormHelpers.showFieldError('confirm-password', 'Passwords do not match');
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
      submitBtn.textContent = 'Creating account...';
    }

    try {
      const result = await api.auth.signup(email, password, { name });
      
      if (result && result.user) {
        console.log('[Auth] Signup successful:', result.user.email);
        
        // Show success notification (Week 5 improvement)
        if (window.notifySuccess) {
          window.notifySuccess('Account created! Redirecting to login...', 2000);
        } else {
          const successDiv = document.getElementById('signup-success');
          if (successDiv) {
            successDiv.textContent = 'Account created! Redirecting to login...';
            successDiv.style.display = 'block';
          } else {
            alert('Account created successfully! Please login.');
          }
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
      
      // Improved error handling (Week 5 requirement)
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been taken')) {
          errorMessage = 'This email is already registered. Please login instead.';
        } else if (msg.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (msg.includes('password')) {
          errorMessage = 'Password does not meet requirements. Please use a stronger password.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // Don't expose raw Supabase errors to users
          errorMessage = 'Unable to create account. Please try again later.';
          console.error('[Auth] Raw error:', error.message);
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
    // Use notifications if available (Week 5)
    if (window.notifyError) {
      window.notifyError(message, 5000);
    }
    
    const errorDiv = document.getElementById('signup-error');
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
