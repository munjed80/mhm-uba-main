// mobile-navigation.js - Mobile-friendly navigation enhancements
(function() {
  'use strict';

  // Create (or reuse) mobile menu toggle button
  function createMobileMenuToggle() {
    const existingButton = document.querySelector('.uba-mobile-nav-toggle, .uba-mobile-menu-toggle');
    const existingOverlay = document.querySelector('.uba-sidebar-overlay, .uba-mobile-overlay');

    let createdButton = false;
    let createdOverlay = false;

    // Prefer the existing toggle button created by app.js. If it doesn't exist,
    // create one that matches the primary `.uba-mobile-nav-toggle` styles so we
    // avoid rendering two hamburger buttons on mobile.
    const button = existingButton || (() => {
      const newButton = document.createElement('button');
      newButton.className = 'uba-mobile-nav-toggle';
      newButton.setAttribute('aria-label', 'Toggle navigation menu');
      newButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      `;

      document.body.appendChild(newButton);
      createdButton = true;
      return newButton;
    })();

    // Reuse the sidebar overlay if it already exists to prevent stacking two
    // overlays. Fall back to the existing mobile overlay or create a new
    // sidebar overlay for consistent styling with app.js.
    const overlay = existingOverlay || (() => {
      const newOverlay = document.createElement('div');
      newOverlay.className = 'uba-sidebar-overlay';
      newOverlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(newOverlay);
      createdOverlay = true;
      return newOverlay;
    })();

    return { button, overlay, createdButton, createdOverlay };
  }

  // Toggle mobile sidebar
  function toggleMobileSidebar(forceClose = false) {
    const sidebar = document.querySelector('.uba-sidebar');
    const overlay = document.querySelector('.uba-sidebar-overlay') || document.querySelector('.uba-mobile-overlay');

    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('is-open') || sidebar.classList.contains('open');

    if (forceClose || isOpen) {
      sidebar.classList.remove('open', 'is-open');
      if (overlay) overlay.classList.remove('active', 'is-visible');
      document.body.style.overflow = '';
    } else {
      sidebar.classList.add('is-open');
      if (overlay) overlay.classList.add('active', 'is-visible');
      document.body.style.overflow = 'hidden';
    }
  }

  // Close sidebar when clicking a link
  function closeSidebarOnNavigation() {
    const navLinks = document.querySelectorAll('.uba-sidebar a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(() => toggleMobileSidebar(true), 100);
      });
    });
  }

  // Make tables responsive
  function enhanceTablesForMobile() {
    const tables = document.querySelectorAll('table:not(.uba-responsive-table)');
    tables.forEach(table => {
      if (table.closest('.uba-table-wrapper')) {
        return; // Already wrapped
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'uba-table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      table.classList.add('uba-responsive-table');
    });
  }

  // Add swipe indicators to scrollable content
  function addSwipeIndicators() {
    const scrollables = document.querySelectorAll('.uba-kanban-board, .uba-table-wrapper');
    scrollables.forEach(el => {
      if (!el.classList.contains('uba-swipeable')) {
        el.classList.add('uba-swipeable');
      }
    });
  }

  // Touch-friendly dropdowns
  function enhanceDropdowns() {
    const dropdowns = document.querySelectorAll('select');
    dropdowns.forEach(select => {
      // On mobile, native select is often better
      if (window.innerWidth <= 768) {
        select.style.fontSize = '16px'; // Prevent zoom on iOS
      }
    });
  }

  // Improve form accessibility on mobile
  function enhanceForms() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      // Prevent zoom on focus for iOS
      if (window.innerWidth <= 768) {
        if (!input.style.fontSize || parseInt(input.style.fontSize) < 16) {
          input.style.fontSize = '16px';
        }
      }

      // Add better mobile keyboards
      if (input.type === 'email' && !input.getAttribute('inputmode')) {
        input.setAttribute('inputmode', 'email');
      }
      if (input.type === 'tel' && !input.getAttribute('inputmode')) {
        input.setAttribute('inputmode', 'tel');
      }
      if (input.type === 'number' && !input.getAttribute('inputmode')) {
        input.setAttribute('inputmode', 'numeric');
      }
    });
  }

  // Handle orientation changes
  function handleOrientationChange() {
    // Refresh layout on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        enhanceTablesForMobile();
        addSwipeIndicators();
      }, 200);
    });
  }

  // Detect mobile device
  function isMobileDevice() {
    return window.innerWidth <= 960 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Initialize mobile enhancements
  function initMobileEnhancements() {
    if (!isMobileDevice()) {
      return; // Skip on desktop
    }

    // Create mobile menu
    const { button, overlay, createdButton, createdOverlay } = createMobileMenuToggle();

    // Attach event listeners
    if (button && createdButton) {
      button.addEventListener('click', () => toggleMobileSidebar());
    }

    if (overlay && createdOverlay) {
      overlay.addEventListener('click', () => toggleMobileSidebar(true));
    }

    // Close sidebar when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMobileSidebar(true);
      }
    });

    // Enhance navigation
    closeSidebarOnNavigation();

    // Enhance UI elements
    enhanceTablesForMobile();
    addSwipeIndicators();
    enhanceDropdowns();
    enhanceForms();
    handleOrientationChange();
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileEnhancements);
  } else {
    initMobileEnhancements();
  }

  // Re-initialize on window resize (for responsive testing)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isMobileDevice()) {
        enhanceTablesForMobile();
        addSwipeIndicators();
      } else {
        // Clean up mobile elements on desktop
        toggleMobileSidebar(true);
      }
    }, 250);
  });

  // Expose API for external use
  window.UBAMobile = {
    toggleSidebar: toggleMobileSidebar,
    isMobile: isMobileDevice,
    init: initMobileEnhancements
  };

})();
