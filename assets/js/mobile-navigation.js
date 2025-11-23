// mobile-navigation.js - Mobile-friendly navigation enhancements
(function() {
  'use strict';

  // Create mobile menu toggle button
  function createMobileMenuToggle() {
    if (document.querySelector('.uba-mobile-menu-toggle')) {
      return; // Already created
    }

    const button = document.createElement('button');
    button.className = 'uba-mobile-menu-toggle';
    button.setAttribute('aria-label', 'Toggle navigation menu');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    `;

    document.body.appendChild(button);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'uba-mobile-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    return { button, overlay };
  }

  // Toggle mobile sidebar
  function toggleMobileSidebar(forceClose = false) {
    const sidebar = document.querySelector('.uba-sidebar');
    const overlay = document.querySelector('.uba-mobile-overlay');

    if (!sidebar) return;

    if (forceClose || sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('active');
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

    console.log('📱 Initializing mobile enhancements...');

    // Create mobile menu
    const { button, overlay } = createMobileMenuToggle();

    // Attach event listeners
    if (button) {
      button.addEventListener('click', () => toggleMobileSidebar());
    }

    if (overlay) {
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

    console.log('✅ Mobile enhancements initialized');
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

  console.log('📱 UBA Mobile Navigation module loaded');

})();
