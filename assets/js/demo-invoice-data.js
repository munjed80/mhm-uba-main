// demo-invoice-data.js - Rich demo data for enhanced invoice features
(function() {
  'use strict';
  
  /**
   * Create comprehensive invoice demo data
   */
  function createInvoiceDemoData() {
    console.log('💰 Creating comprehensive invoice demo data');
    
    if (!window.ubaStore?.invoices) {
      console.warn('Invoice store not available');
      return;
    }
    
    // Clear existing invoice data
    clearExistingInvoices();
    
    // Create demo clients first (for auto-linking)
    createDemoClients();
    
    // Create diverse invoice data across multiple months
    createDemoInvoices();
    
    console.log('✅ Invoice demo data created successfully');
    
    // Show notification
    if (window.showToast) {
      window.showToast('Invoice demo data created with PDF export, monthly grouping, and auto client linking!', 'success', {
        title: 'Enhanced Invoices Ready',
        duration: 5000
      });
    }
  }
  
  /**
   * Clear existing invoice data
   */
  function clearExistingInvoices() {
    const invoices = window.ubaStore.invoices.getAll() || [];
    invoices.forEach(invoice => {
      window.ubaStore.invoices.delete(invoice.id);
    });
  }
  
  /**
   * Create demo clients for auto-linking
   */
  function createDemoClients() {
    if (!window.ubaStore?.clients) return;
    
    // Clear existing clients
    const existingClients = window.ubaStore.clients.getAll() || [];
    existingClients.forEach(client => {
      window.ubaStore.clients.delete(client.id);
    });
    
    const demoClients = [
      {
        id: 'client-tech-corp',
        name: 'TechCorp Solutions',
        email: 'billing@techcorp.com',
        phone: '+1-555-0123',
        company: 'TechCorp Solutions Inc.',
        address: '123 Tech Avenue, Silicon Valley, CA 94101, USA',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()
      },
      {
        id: 'client-startup-xyz',
        name: 'StartupXYZ',
        email: 'finance@startupxyz.com',
        phone: '+1-555-0456',
        company: 'StartupXYZ Ltd.',
        address: '456 Innovation Street, New York, NY 10001, USA',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75).toISOString()
      },
      {
        id: 'client-digital-agency',
        name: 'Digital Agency Pro',
        email: 'accounts@digitalagencypro.com',
        phone: '+1-555-0789',
        company: 'Digital Agency Pro LLC',
        address: '789 Marketing Boulevard, Austin, TX 73301, USA',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
      },
      {
        id: 'client-megacorp',
        name: 'MegaCorp Industries',
        email: 'procurement@megacorp.com',
        phone: '+1-555-0321',
        company: 'MegaCorp Industries Ltd.',
        address: '321 Corporate Plaza, Chicago, IL 60601, USA',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString()
      },
      {
        id: 'client-local-business',
        name: 'Local Business Co',
        email: 'owner@localbusiness.com',
        phone: '+1-555-0654',
        company: 'Local Business Co.',
        address: '654 Main Street, Denver, CO 80201, USA',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString()
      },
      {
        id: 'client-ecommerce-store',
        name: 'E-commerce Store',
        email: 'admin@ecomstore.com',
        phone: '+1-555-0987',
        company: 'E-commerce Store Inc.',
        address: '987 Commerce Way, Seattle, WA 98101, USA',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
      }
    ];
    
    demoClients.forEach(client => {
      window.ubaStore.clients.create(client);
    });
  }
  
  /**
   * Create comprehensive demo invoices across multiple months
   */
  function createDemoInvoices() {
    const now = new Date();
    const demoInvoices = [
      
      // Current Month Invoices
      {
        client: 'TechCorp Solutions',
        label: 'E-commerce Platform Development - Phase 3',
        amount: 8500.00,
        status: 'sent',
        due: new Date(now.getFullYear(), now.getMonth(), 25).toISOString(),
        notes: 'Final phase of e-commerce platform including payment integration and security features',
        created_at: new Date(now.getFullYear(), now.getMonth(), 5).toISOString()
      },
      {
        client: 'StartupXYZ',
        label: 'Mobile App UI/UX Design',
        amount: 3200.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        notes: 'Complete UI/UX design for iOS and Android mobile application',
        created_at: new Date(now.getFullYear(), now.getMonth(), 2).toISOString()
      },
      {
        client: 'Digital Agency Pro',
        label: 'Marketing Dashboard - Monthly Maintenance',
        amount: 1500.00,
        status: 'draft',
        due: new Date(now.getFullYear(), now.getMonth(), 30).toISOString(),
        notes: 'Monthly maintenance and feature updates for marketing analytics dashboard',
        created_at: new Date(now.getFullYear(), now.getMonth(), 10).toISOString()
      },
      {
        client: 'MegaCorp Industries',
        label: 'Corporate Website Redesign',
        amount: 12000.00,
        status: 'sent',
        due: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        notes: 'Complete corporate website redesign with modern responsive layout and CMS integration',
        created_at: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      },
      {
        client: 'Local Business Co',
        label: 'Brand Identity Package',
        amount: 2800.00,
        status: 'overdue',
        due: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
        notes: 'Complete brand identity including logo design, business cards, and marketing materials',
        created_at: new Date(now.getFullYear(), now.getMonth() - 1, 25).toISOString()
      },
      
      // Previous Month Invoices
      {
        client: 'E-commerce Store',
        label: 'Online Store Setup and Configuration',
        amount: 4500.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString(),
        notes: 'Complete e-commerce store setup with payment gateway and inventory management',
        created_at: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString()
      },
      {
        client: 'TechCorp Solutions',
        label: 'API Development and Integration',
        amount: 6200.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
        notes: 'Custom API development for third-party service integration',
        created_at: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      },
      {
        client: 'StartupXYZ',
        label: 'Technical Consultation - October',
        amount: 1800.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 1, 25).toISOString(),
        notes: 'Monthly technical consultation and architecture guidance',
        created_at: new Date(now.getFullYear(), now.getMonth() - 1, 8).toISOString()
      },
      {
        client: 'Digital Agency Pro',
        label: 'SEO Optimization Package',
        amount: 2200.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 1, 30).toISOString(),
        notes: 'Complete SEO audit and optimization for improved search rankings',
        created_at: new Date(now.getFullYear(), now.getMonth() - 1, 12).toISOString()
      },
      
      // Two Months Ago
      {
        client: 'MegaCorp Industries',
        label: 'Database Migration and Optimization',
        amount: 9500.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 2, 18).toISOString(),
        notes: 'Migration of legacy database to modern cloud infrastructure with performance optimization',
        created_at: new Date(now.getFullYear(), now.getMonth() - 2, 3).toISOString()
      },
      {
        client: 'Local Business Co',
        label: 'Website Development',
        amount: 3500.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 2, 22).toISOString(),
        notes: 'Professional business website with contact forms and service pages',
        created_at: new Date(now.getFullYear(), now.getMonth() - 2, 7).toISOString()
      },
      {
        client: 'E-commerce Store',
        label: 'Payment System Integration',
        amount: 2800.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 2, 25).toISOString(),
        notes: 'Integration of multiple payment gateways and security enhancements',
        created_at: new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString()
      },
      {
        client: 'StartupXYZ',
        label: 'MVP Development - Phase 1',
        amount: 7800.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 2, 28).toISOString(),
        notes: 'Minimum viable product development for startup launch',
        created_at: new Date(now.getFullYear(), now.getMonth() - 2, 14).toISOString()
      },
      
      // Three Months Ago
      {
        client: 'TechCorp Solutions',
        label: 'Security Audit and Implementation',
        amount: 5500.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 3, 20).toISOString(),
        notes: 'Comprehensive security audit with implementation of recommended security measures',
        created_at: new Date(now.getFullYear(), now.getMonth() - 3, 5).toISOString()
      },
      {
        client: 'Digital Agency Pro',
        label: 'Analytics Dashboard Development',
        amount: 4200.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 3, 15).toISOString(),
        notes: 'Custom analytics dashboard for tracking marketing campaign performance',
        created_at: new Date(now.getFullYear(), now.getMonth() - 3, 2).toISOString()
      },
      {
        client: 'MegaCorp Industries',
        label: 'Employee Portal Development',
        amount: 11500.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 3, 25).toISOString(),
        notes: 'Internal employee portal with HR integration and document management',
        created_at: new Date(now.getFullYear(), now.getMonth() - 3, 8).toISOString()
      },
      
      // Small invoices for variety
      {
        client: 'Local Business Co',
        label: 'Domain and Hosting Setup',
        amount: 299.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString(),
        notes: 'Annual domain registration and hosting setup with SSL certificate',
        created_at: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString()
      },
      {
        client: 'E-commerce Store',
        label: 'Emergency Bug Fix',
        amount: 450.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
        notes: 'Emergency fix for checkout process bug affecting customer orders',
        created_at: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      },
      {
        client: 'StartupXYZ',
        label: 'Code Review and Optimization',
        amount: 850.00,
        status: 'sent',
        due: new Date(now.getFullYear(), now.getMonth(), 18).toISOString(),
        notes: 'Comprehensive code review with performance optimization recommendations',
        created_at: new Date(now.getFullYear(), now.getMonth(), 6).toISOString()
      },
      
      // Large project invoices
      {
        client: 'TechCorp Solutions',
        label: 'Enterprise Software Development - Phase 1',
        amount: 25000.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 2, 30).toISOString(),
        notes: 'First phase of enterprise software development including architecture design and core modules',
        created_at: new Date(now.getFullYear(), now.getMonth() - 3, 15).toISOString()
      },
      {
        client: 'MegaCorp Industries',
        label: 'Digital Transformation Consultation',
        amount: 18500.00,
        status: 'paid',
        due: new Date(now.getFullYear(), now.getMonth() - 3, 10).toISOString(),
        notes: 'Comprehensive digital transformation strategy and implementation roadmap',
        created_at: new Date(now.getFullYear(), now.getMonth() - 4, 5).toISOString()
      }
    ];
    
    // Create invoices with proper IDs
    demoInvoices.forEach((invoiceData, index) => {
      const invoice = {
        ...invoiceData,
        id: `inv-demo-${Date.now()}-${index}`
      };
      
      window.ubaStore.invoices.create(invoice);
    });
  }
  
  /**
   * Auto-create invoice demo data if no existing data
   */
  function autoCreateInvoiceDemoData() {
    if (!window.ubaStore?.invoices) return;
    
    // Check if we already have invoice data
    const existingInvoices = window.ubaStore.invoices.getAll() || [];
    
    // Only create demo data if we have few or no existing invoices
    if (existingInvoices.length < 3) {
      console.log('Creating invoice demo data...');
      setTimeout(createInvoiceDemoData, 1500);
    }
  }
  
  /**
   * Create sample branding settings
   */
  function createSampleBrandingSettings() {
    const sampleBranding = {
      companyName: 'MHM Business Solutions',
      companyAddress: '123 Innovation Drive',
      companyCity: 'Amsterdam',
      companyCountry: 'Netherlands',
      companyPhone: '+31 20 123 4567',
      companyEmail: 'info@mhmuba.com',
      companyWebsite: 'www.mhmuba.com',
      logoUrl: '',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      accentColor: '#0f172a',
      fontFamily: 'Arial, sans-serif',
      headerStyle: 'modern',
      footerText: 'Thank you for choosing MHM Business Solutions. Payment is appreciated within the specified terms.',
      paymentTerms: '30',
      bankDetails: {
        bankName: 'ABN AMRO Bank',
        accountNumber: 'NL91 ABNA 0417 1643 00',
        swiftCode: 'ABNANL2A'
      }
    };
    
    // Save to localStorage
    localStorage.setItem('uba-invoice-branding', JSON.stringify(sampleBranding));
  }
  
  /**
   * Generate sample invoice notifications
   */
  function generateInvoiceNotifications() {
    if (!window.showToast) return;
    
    // Show sample notifications after a delay
    setTimeout(() => {
      window.showToast('Monthly view shows €47,350 in invoices this month', 'info', {
        title: 'Monthly Summary',
        duration: 4000
      });
    }, 3000);
    
    setTimeout(() => {
      window.showToast('PDF export available for all invoices', 'success', {
        title: 'PDF Ready',
        duration: 4000
      });
    }, 5000);
    
    setTimeout(() => {
      window.showToast('1 overdue invoice requires attention', 'warning', {
        title: 'Overdue Notice',
        duration: 4000
      });
    }, 7000);
  }
  
  // Expose demo functions
  window.UBAInvoiceDemoData = {
    create: createInvoiceDemoData,
    autoCreate: autoCreateInvoiceDemoData,
    generateNotifications: generateInvoiceNotifications,
    createBranding: createSampleBrandingSettings
  };
  
  // Auto-create demo data when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        autoCreateInvoiceDemoData();
        createSampleBrandingSettings();
        setTimeout(generateInvoiceNotifications, 2000);
      }, 2000);
    });
  } else {
    setTimeout(() => {
      autoCreateInvoiceDemoData();
      createSampleBrandingSettings();
      setTimeout(generateInvoiceNotifications, 2000);
    }, 2000);
  }
  
  console.log('✅ Invoice Demo Data module loaded');
  
})();