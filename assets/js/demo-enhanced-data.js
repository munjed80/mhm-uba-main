// demo-enhanced-data.js — Comprehensive demo data for showcasing enhanced features
(function() {
  'use strict';
  
  /**
   * Create enhanced demo data with all features
   */
  function createEnhancedDemoData() {
    console.log('🎭 Creating enhanced demo data with all features');
    
    const store = window.ubaStore;
    if (!store) {
      console.warn('Store not available, skipping demo data creation');
      return;
    }
    
    // Clear existing data
    clearExistingData();
    
    // Create demo data with relationships
    createDemoProjects();
    createDemoTasks();
    createDemoInvoices();
    createDemoClients();
    
    console.log('✓ Enhanced demo data created successfully');
    
    // Show notification
    if (window.showToast) {
      window.showToast('Enhanced demo data created with all features!', 'success');
    }
  }
  
  /**
   * Clear existing data
   */
  function clearExistingData() {
    const store = window.ubaStore;
    const collections = ['projects', 'tasks', 'invoices', 'clients'];
    
    collections.forEach(collection => {
      if (store[collection] && store[collection].clear) {
        store[collection].clear();
      }
    });
  }
  
  /**
   * Create demo projects
   */
  function createDemoProjects() {
    const store = window.ubaStore;
    if (!store.projects) return;
    
    const demoProjects = [
      {
        id: 'proj-1',
        name: 'E-commerce Website Redesign',
        client: 'TechCorp Solutions',
        stage: 'in_progress',
        budget: 15000,
        description: 'Complete redesign of the e-commerce platform with modern UI/UX, mobile optimization, and enhanced checkout process.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'proj-2',
        name: 'Mobile App Development',
        client: 'StartupXYZ',
        stage: 'lead',
        budget: 25000,
        description: 'Native mobile application for iOS and Android with real-time synchronization and offline capabilities.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'proj-3',
        name: 'Marketing Dashboard',
        client: 'Digital Agency Pro',
        stage: 'ongoing',
        budget: 8000,
        description: 'Analytics dashboard for tracking marketing campaigns, ROI, and customer acquisition metrics.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      },
      {
        id: 'proj-4',
        name: 'Corporate Website',
        client: 'MegaCorp Industries',
        stage: 'completed',
        budget: 12000,
        description: 'Professional corporate website with CMS, blog, and contact forms.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      }
    ];
    
    demoProjects.forEach(project => {
      store.projects.create(project);
    });
  }
  
  /**
   * Create demo tasks with various priorities and due dates
   */
  function createDemoTasks() {
    const store = window.ubaStore;
    if (!store.tasks) return;
    
    const now = new Date();
    const demoTasks = [
      // E-commerce Website Redesign tasks
      {
        id: 'task-1',
        title: 'Design Homepage Layout',
        description: 'Create wireframes and mockups for the new homepage design with focus on conversion optimization.',
        status: 'done',
        priority: 'high',
        project_id: 'proj-1',
        due: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'task-2',
        title: 'Implement Shopping Cart',
        description: 'Develop the shopping cart functionality with add/remove items, quantity updates, and price calculations.',
        status: 'in_progress',
        priority: 'high',
        project_id: 'proj-1',
        due: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Overdue
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
      },
      {
        id: 'task-3',
        title: 'Setup Payment Gateway',
        description: 'Integrate Stripe payment processing with proper error handling and security measures.',
        status: 'todo',
        priority: 'high',
        project_id: 'proj-1',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Due tomorrow
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
      },
      {
        id: 'task-4',
        title: 'Mobile Responsive Testing',
        description: 'Test website on various devices and screen sizes, fix responsive issues.',
        status: 'todo',
        priority: 'medium',
        project_id: 'proj-1',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // Due in 3 days
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      
      // Mobile App Development tasks
      {
        id: 'task-5',
        title: 'App Architecture Planning',
        description: 'Define the technical architecture, choose frameworks, and plan the development approach.',
        status: 'in_progress',
        priority: 'high',
        project_id: 'proj-2',
        due: new Date(Date.now()).toISOString(), // Due today
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      },
      {
        id: 'task-6',
        title: 'User Authentication System',
        description: 'Implement secure user registration, login, and password reset functionality.',
        status: 'todo',
        priority: 'high',
        project_id: 'proj-2',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      
      // Marketing Dashboard tasks
      {
        id: 'task-7',
        title: 'Google Analytics Integration',
        description: 'Connect Google Analytics API and create data visualization widgets.',
        status: 'done',
        priority: 'medium',
        project_id: 'proj-3',
        due: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
      },
      {
        id: 'task-8',
        title: 'Custom Chart Components',
        description: 'Build reusable chart components for displaying campaign performance metrics.',
        status: 'in_progress',
        priority: 'medium',
        project_id: 'proj-3',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
      },
      
      // Unlinked tasks (no project)
      {
        id: 'task-9',
        title: 'Update Portfolio Website',
        description: 'Add recent projects to portfolio and update bio section.',
        status: 'todo',
        priority: 'low',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // Due next week
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'task-10',
        title: 'Learn New Framework',
        description: 'Research and learn about the latest React features and best practices.',
        status: 'in_progress',
        priority: 'low',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // Due in 2 weeks
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
      },
      
      // Additional tasks to demonstrate search and filtering
      {
        id: 'task-11',
        title: 'Security Audit',
        description: 'Perform comprehensive security review of all systems and fix vulnerabilities.',
        status: 'todo',
        priority: 'high',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      },
      {
        id: 'task-12',
        title: 'Database Optimization',
        description: 'Optimize database queries and improve application performance.',
        status: 'todo',
        priority: 'medium',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      }
    ];
    
    demoTasks.forEach(task => {
      store.tasks.create(task);
    });
  }
  
  /**
   * Create demo invoices
   */
  function createDemoInvoices() {
    const store = window.ubaStore;
    if (!store.invoices) return;
    
    const demoInvoices = [
      {
        id: 'inv-1',
        label: 'E-commerce Website - Phase 1',
        amount: 7500,
        status: 'paid',
        project_id: 'proj-1',
        due: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString()
      },
      {
        id: 'inv-2',
        label: 'Mobile App Development - Initial Payment',
        amount: 10000,
        status: 'sent',
        project_id: 'proj-2',
        due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'inv-3',
        label: 'Marketing Dashboard - Final Payment',
        amount: 4000,
        status: 'draft',
        project_id: 'proj-3',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'inv-4',
        label: 'Corporate Website - Full Payment',
        amount: 12000,
        status: 'paid',
        project_id: 'proj-4',
        due: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString()
      }
    ];
    
    demoInvoices.forEach(invoice => {
      store.invoices.create(invoice);
    });
  }
  
  /**
   * Create demo clients
   */
  function createDemoClients() {
    const store = window.ubaStore;
    if (!store.clients) return;
    
    const demoClients = [
      {
        id: 'client-1',
        name: 'TechCorp Solutions',
        email: 'contact@techcorp.com',
        phone: '+1-555-0123',
        company: 'TechCorp Solutions',
        address: '123 Tech Street, Silicon Valley, CA 94101',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
      },
      {
        id: 'client-2',
        name: 'StartupXYZ',
        email: 'hello@startupxyz.com',
        phone: '+1-555-0456',
        company: 'StartupXYZ Inc.',
        address: '456 Innovation Ave, New York, NY 10001',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString()
      },
      {
        id: 'client-3',
        name: 'Digital Agency Pro',
        email: 'info@digitalagencypro.com',
        phone: '+1-555-0789',
        company: 'Digital Agency Pro LLC',
        address: '789 Marketing Blvd, Austin, TX 73301',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString()
      },
      {
        id: 'client-4',
        name: 'MegaCorp Industries',
        email: 'business@megacorp.com',
        phone: '+1-555-0321',
        company: 'MegaCorp Industries Ltd.',
        address: '321 Corporate Plaza, Chicago, IL 60601',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
      }
    ];
    
    demoClients.forEach(client => {
      store.clients.create(client);
    });
  }
  
  /**
   * Generate demo reminders and notifications
   */
  function generateDemoReminders() {
    // Trigger enhanced tasks to check for demo reminders
    if (window.UBAEnhancedTasks && window.UBAEnhancedTasks.checkReminders) {
      setTimeout(() => {
        window.UBAEnhancedTasks.checkReminders();
      }, 2000);
    }
    
    // Create some demo notifications
    if (window.showToast) {
      setTimeout(() => {
        window.showToast('Demo: Task \"Implement Shopping Cart\" is overdue!', 'error', { title: 'Overdue Task' });
      }, 3000);
      
      setTimeout(() => {
        window.showToast('Demo: Task \"App Architecture Planning\" is due today', 'warning', { title: 'Due Today' });
      }, 4000);
      
      setTimeout(() => {
        window.showToast('Demo: Task \"Setup Payment Gateway\" is due tomorrow', 'warning', { title: 'Due Tomorrow' });
      }, 5000);
    }
  }
  
  /**
   * Auto-create demo data if no existing data
   */
  function autoCreateDemoData() {
    const store = window.ubaStore;
    if (!store) return;
    
    // Check if we already have data
    const hasProjects = store.projects && store.projects.getAll().length > 0;
    const hasTasks = store.tasks && store.tasks.getAll().length > 0;
    
    // Only create demo data if we don't have existing data
    if (!hasProjects && !hasTasks) {
      console.log('No existing data found, creating enhanced demo data...');
      setTimeout(createEnhancedDemoData, 1000);
      setTimeout(generateDemoReminders, 3000);
    }
  }
  
  // Expose demo data functions
  window.UBADemoData = {
    create: createEnhancedDemoData,
    generateReminders: generateDemoReminders,
    autoCreate: autoCreateDemoData
  };
  
  // Auto-create demo data when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(autoCreateDemoData, 2000);
    });
  } else {
    setTimeout(autoCreateDemoData, 2000);
  }
  
  console.log('✓ Enhanced Demo Data module loaded');
  
})();