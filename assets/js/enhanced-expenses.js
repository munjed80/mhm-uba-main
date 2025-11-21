// enhanced-expenses.js - Comprehensive expense management with categories, charts, receipts, and improved UI
(function() {
  'use strict';
  
  /**
   * Enhanced Expenses System - Main Module
   * Features: Categories management, Charts (Pie & Trend), Receipt uploads, Enhanced dropdown design
   */
  window.UBAEnhancedExpenses = {
    
    // State management
    categories: [],
    expenses: [],
    charts: {},
    fileUploads: {},
    
    /**
     * Initialize enhanced expense system
     */
    init() {
      console.log('💸 Initializing Enhanced Expense System');

      this.loadExpenseCategories();

      const isExpensesContext = this.isExpensesPage();
      if (!isExpensesContext) {
        this.teardownDetachedUI();
        console.log('↩️ Skipping Enhanced Expense UI wiring – no expenses view on this page');
        return;
      }
      
      this.setupCategoryManagement();
      this.setupCharts();
      this.setupReceiptUpload();
      this.enhanceDropdownDesign();
      this.initializeUI();
      
      console.log('✅ Enhanced Expense System initialized');
    },

    /**
     * Detect if current page contains the expenses experience
     */
    isExpensesPage() {
      const pageMarker = document.getElementById('page-id');
      if (pageMarker?.dataset?.page) {
        return pageMarker.dataset.page === 'expenses-page';
      }

      if (document.body?.dataset?.activeView === 'expenses') {
        return true;
      }

      if (document.querySelector('[data-view="expenses"]')) {
        return true;
      }

      return window.location.pathname.includes('expenses');
    },

    /**
     * Remove stray modals/overlays when not on the expenses page
     */
    teardownDetachedUI() {
      const modal = document.getElementById('category-management-modal');
      if (modal) {
        if (!modal.classList.contains('is-hidden')) {
          document.body.style.overflow = '';
        }
        modal.remove();
      }
    },
    
    /**
     * Load expense categories from localStorage
     */
    loadExpenseCategories() {
      try {
        const savedCategories = localStorage.getItem('uba-expense-categories');
        this.categories = savedCategories ? JSON.parse(savedCategories) : this.getDefaultCategories();
        console.log('✅ Expense categories loaded');
      } catch (error) {
        console.warn('⚠️ Failed to load categories:', error);
        this.categories = this.getDefaultCategories();
      }
    },
    
    /**
     * Get default expense categories
     */
    getDefaultCategories() {
      return [
        {
          id: 'cat-office',
          name: 'Office Supplies',
          nameAr: 'مستلزمات مكتبية',
          icon: '📎',
          color: '#3b82f6',
          description: 'Office equipment, stationery, and supplies',
          budget: 500,
          active: true
        },
        {
          id: 'cat-software',
          name: 'Software',
          nameAr: 'برمجيات',
          icon: '💻',
          color: '#8b5cf6',
          description: 'Software subscriptions, licenses, and tools',
          budget: 1200,
          active: true
        },
        {
          id: 'cat-travel',
          name: 'Travel',
          nameAr: 'سفر',
          icon: '✈️',
          color: '#10b981',
          description: 'Business travel, accommodation, and transport',
          budget: 2000,
          active: true
        },
        {
          id: 'cat-marketing',
          name: 'Marketing',
          nameAr: 'تسويق',
          icon: '📢',
          color: '#f59e0b',
          description: 'Advertising, campaigns, and promotional materials',
          budget: 1500,
          active: true
        },
        {
          id: 'cat-equipment',
          name: 'Equipment',
          nameAr: 'معدات',
          icon: '🔧',
          color: '#6b7280',
          description: 'Hardware, machinery, and equipment',
          budget: 3000,
          active: true
        },
        {
          id: 'cat-utilities',
          name: 'Utilities',
          nameAr: 'مرافق',
          icon: '💡',
          color: '#ef4444',
          description: 'Internet, phone, electricity, and utilities',
          budget: 800,
          active: true
        },
        {
          id: 'cat-rent',
          name: 'Rent',
          nameAr: 'إيجار',
          icon: '🏢',
          color: '#06b6d4',
          description: 'Office rent and facility costs',
          budget: 2500,
          active: true
        },
        {
          id: 'cat-insurance',
          name: 'Insurance',
          nameAr: 'تأمين',
          icon: '🛡️',
          color: '#84cc16',
          description: 'Business insurance and protection',
          budget: 400,
          active: true
        },
        {
          id: 'cat-professional',
          name: 'Professional Services',
          nameAr: 'خدمات مهنية',
          icon: '👔',
          color: '#ec4899',
          description: 'Legal, accounting, and consulting services',
          budget: 1000,
          active: true
        },
        {
          id: 'cat-meals',
          name: 'Meals & Entertainment',
          nameAr: 'وجبات وترفيه',
          icon: '🍽️',
          color: '#f97316',
          description: 'Business meals and entertainment',
          budget: 600,
          active: true
        },
        {
          id: 'cat-other',
          name: 'Other',
          nameAr: 'أخرى',
          icon: '📋',
          color: '#64748b',
          description: 'Miscellaneous business expenses',
          budget: 500,
          active: true
        }
      ];
    },
    
    /**
     * Save categories to localStorage
     */
    saveCategories() {
      try {
        localStorage.setItem('uba-expense-categories', JSON.stringify(this.categories));
        console.log('✅ Categories saved');
      } catch (error) {
        console.error('❌ Failed to save categories:', error);
      }
    },
    
    /**
     * Setup category management functionality
     */
    setupCategoryManagement() {
      console.log('🏷️ Setting up category management');
      
      // Add category management button to expenses page
      this.addCategoryManagementButton();
      
      // Create category management modal
      this.createCategoryModal();
      
      // Update expense form dropdown with categories
      this.updateExpenseFormCategories();
    },

    /**
     * Scoped modal helpers so overlays never linger between pages
     */
    showModuleModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      if (typeof window.showModal === 'function') {
        window.showModal(modalId);
      } else {
        modal.classList.remove('is-hidden');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      modal.classList.remove('is-hidden');
      modal.classList.add('is-visible');
      modal.setAttribute('aria-hidden', 'false');
    },

    hideModuleModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      if (typeof window.hideModal === 'function') {
        window.hideModal(modalId);
      } else {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }

      modal.classList.remove('is-visible');
      modal.classList.add('is-hidden');
      modal.setAttribute('aria-hidden', 'true');
    },
    
    /**
     * Add category management button
     */
    addCategoryManagementButton() {
      const expensesHeader = document.querySelector('#expenses-page .uba-card-header');
      if (expensesHeader) {
        const buttonContainer = expensesHeader.querySelector('div:last-child');
        if (buttonContainer) {
          // Add category management button
          const categoryBtn = document.createElement('button');
          categoryBtn.className = 'uba-btn uba-btn-ghost';
          categoryBtn.innerHTML = '<span class=\"icon\">🏷️</span> Categories';
          categoryBtn.onclick = () => this.openCategoryManagement();
          
          // Insert before the Add Expense button
          const addBtn = buttonContainer.querySelector('.uba-btn-primary');
          if (addBtn) {
            buttonContainer.insertBefore(categoryBtn, addBtn);
          }
        }
      }
    },
    
    /**
     * Create category management modal
     */
    createCategoryModal() {
      const modal = document.createElement('div');
      modal.id = 'category-management-modal';
      modal.className = 'uba-modal category-modal is-hidden';
      modal.innerHTML = `
        <div class=\"uba-modal-overlay\" onclick=\"window.UBAEnhancedExpenses.closeCategoryManagement()\"></div>
        <div class=\"uba-modal-dialog category-dialog\">
          <div class=\"uba-modal-header\">
            <h3><span class=\"icon\">🏷️</span> إدارة فئات الصرف (Expense Categories Management)</h3>
            <button class=\"uba-modal-close\" onclick=\"window.UBAEnhancedExpenses.closeCategoryManagement()\">×</button>
          </div>
          <div class=\"uba-modal-body category-body\">
            <!-- Category form -->
            <div class=\"category-form-section\">
              <h4>Add/Edit Category</h4>
              <form id=\"category-form\" class=\"category-form\">
                <input type=\"hidden\" id=\"category-edit-id\" />
                <div class=\"category-form-grid\">
                  <div class=\"form-group\">
                    <label for=\"category-name\">Name *</label>
                    <input type=\"text\" id=\"category-name\" class=\"uba-input\" placeholder=\"Category name\" required />
                  </div>
                  <div class=\"form-group\">
                    <label for=\"category-name-ar\">Arabic Name</label>
                    <input type=\"text\" id=\"category-name-ar\" class=\"uba-input\" placeholder=\"الاسم بالعربية\" />
                  </div>
                  <div class=\"form-group\">
                    <label for=\"category-icon\">Icon</label>
                    <div class=\"icon-selector\">
                      <input type=\"text\" id=\"category-icon\" class=\"uba-input icon-input\" placeholder=\"📎\" maxlength=\"2\" />
                      <div class=\"icon-suggestions\">
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('📎')\">📎</span>
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('💻')\">💻</span>
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('✈️')\">✈️</span>
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('📢')\">📢</span>
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('🔧')\">🔧</span>
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('💡')\">💡</span>
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('🏢')\">🏢</span>
                        <span class=\"icon-option\" onclick=\"window.UBAEnhancedExpenses.selectIcon('🛡️')\">🛡️</span>
                      </div>
                    </div>
                  </div>
                  <div class=\"form-group\">
                    <label for=\"category-color\">Color</label>
                    <input type=\"color\" id=\"category-color\" class=\"uba-input color-picker\" value=\"#3b82f6\" />
                  </div>
                  <div class=\"form-group full-width\">
                    <label for=\"category-description\">Description</label>
                    <input type=\"text\" id=\"category-description\" class=\"uba-input\" placeholder=\"Brief description\" />
                  </div>
                  <div class=\"form-group\">
                    <label for=\"category-budget\">Monthly Budget (€)</label>
                    <input type=\"number\" id=\"category-budget\" class=\"uba-input\" min=\"0\" step=\"0.01\" placeholder=\"0.00\" />
                  </div>
                  <div class=\"form-group\">
                    <label class=\"checkbox-label\">
                      <input type=\"checkbox\" id=\"category-active\" checked />
                      <span class=\"checkmark\"></span>
                      Active
                    </label>
                  </div>
                </div>
                <div class=\"category-form-actions\">
                  <button type=\"button\" class=\"uba-btn uba-btn-ghost\" onclick=\"window.UBAEnhancedExpenses.clearCategoryForm()\">Clear</button>
                  <button type=\"submit\" class=\"uba-btn uba-btn-primary\">Save Category</button>
                </div>
              </form>
            </div>
            
            <!-- Categories list -->
            <div class=\"category-list-section\">
              <h4>Existing Categories</h4>
              <div id=\"categories-list\" class=\"categories-grid\">
                <!-- Categories will be rendered here -->
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      
      // Setup form submission
      const form = modal.querySelector('#category-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCategoryFromForm();
      });
    },
    
    /**
     * Open category management modal
     */
    openCategoryManagement() {
      const modal = document.getElementById('category-management-modal');
      if (!modal) return;
      this.renderCategoriesList();
      this.showModuleModal('category-management-modal');
    },
    
    /**
     * Close category management modal
     */
    closeCategoryManagement() {
      this.hideModuleModal('category-management-modal');
      this.clearCategoryForm();
    },
    
    /**
     * Render categories list in modal
     */
    renderCategoriesList() {
      const container = document.getElementById('categories-list');
      if (!container) return;
      
      container.innerHTML = this.categories.map(category => `
        <div class=\"category-item ${category.active ? 'active' : 'inactive'}\" style=\"border-left: 4px solid ${category.color}\">
          <div class=\"category-header\">
            <div class=\"category-icon-name\">
              <span class=\"category-icon\">${category.icon}</span>
              <div class=\"category-names\">
                <strong class=\"category-name\">${category.name}</strong>
                ${category.nameAr ? `<small class=\"category-name-ar\">${category.nameAr}</small>` : ''}
              </div>
            </div>
            <div class=\"category-actions\">
              <button class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"window.UBAEnhancedExpenses.editCategory('${category.id}')\" title=\"Edit category\">
                ✏️
              </button>
              <button class=\"uba-btn uba-btn-sm uba-btn-danger\" onclick=\"window.UBAEnhancedExpenses.deleteCategory('${category.id}')\" title=\"Delete category\">
                🗑️
              </button>
            </div>
          </div>
          <div class=\"category-details\">
            <p class=\"category-description\">${category.description}</p>
            <div class=\"category-meta\">
              <span class=\"category-budget\">Budget: €${category.budget || 0}/month</span>
              <span class=\"category-status ${category.active ? 'active' : 'inactive'}\">
                ${category.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      `).join('');
    },
    
    /**
     * Clear category form
     */
    clearCategoryForm() {
      document.getElementById('category-edit-id').value = '';
      document.getElementById('category-name').value = '';
      document.getElementById('category-name-ar').value = '';
      document.getElementById('category-icon').value = '';
      document.getElementById('category-color').value = '#3b82f6';
      document.getElementById('category-description').value = '';
      document.getElementById('category-budget').value = '';
      document.getElementById('category-active').checked = true;
    },
    
    /**
     * Select icon for category
     */
    selectIcon(icon) {
      document.getElementById('category-icon').value = icon;
    },
    
    /**
     * Save category from form
     */
    saveCategoryFromForm() {
      const editId = document.getElementById('category-edit-id').value;
      const categoryData = {
        name: document.getElementById('category-name').value.trim(),
        nameAr: document.getElementById('category-name-ar').value.trim(),
        icon: document.getElementById('category-icon').value.trim() || '📋',
        color: document.getElementById('category-color').value,
        description: document.getElementById('category-description').value.trim(),
        budget: parseFloat(document.getElementById('category-budget').value) || 0,
        active: document.getElementById('category-active').checked
      };
      
      // Validate required fields
      if (!categoryData.name) {
        this.showNotification('Category name is required', 'error');
        return;
      }
      
      if (editId) {
        // Update existing category
        const index = this.categories.findIndex(cat => cat.id === editId);
        if (index !== -1) {
          this.categories[index] = { ...this.categories[index], ...categoryData };
          this.showNotification(`Category \"${categoryData.name}\" updated successfully`, 'success');
        }
      } else {
        // Create new category
        const newCategory = {
          id: 'cat-' + Date.now(),
          ...categoryData,
          createdAt: new Date().toISOString()
        };
        this.categories.push(newCategory);
        this.showNotification(`Category \"${categoryData.name}\" created successfully`, 'success');
      }
      
      this.saveCategories();
      this.renderCategoriesList();
      this.updateExpenseFormCategories();
      this.clearCategoryForm();
    },
    
    /**
     * Edit category
     */
    editCategory(categoryId) {
      const category = this.categories.find(cat => cat.id === categoryId);
      if (!category) return;
      
      document.getElementById('category-edit-id').value = category.id;
      document.getElementById('category-name').value = category.name;
      document.getElementById('category-name-ar').value = category.nameAr || '';
      document.getElementById('category-icon').value = category.icon;
      document.getElementById('category-color').value = category.color;
      document.getElementById('category-description').value = category.description || '';
      document.getElementById('category-budget').value = category.budget || '';
      document.getElementById('category-active').checked = category.active;
    },
    
    /**
     * Delete category
     */
    deleteCategory(categoryId) {
      const category = this.categories.find(cat => cat.id === categoryId);
      if (!category) return;
      
      if (confirm(`Are you sure you want to delete the category \"${category.name}\"?\
\
This action cannot be undone.`)) {
        this.categories = this.categories.filter(cat => cat.id !== categoryId);
        this.saveCategories();
        this.renderCategoriesList();
        this.updateExpenseFormCategories();
        this.showNotification(`Category \"${category.name}\" deleted`, 'info');
      }
    },
    
    /**
     * Update expense form categories dropdown
     */
    updateExpenseFormCategories() {
      const categorySelect = document.getElementById('expense-category');
      if (!categorySelect) return;
      
      // Clear existing options except the first one
      categorySelect.innerHTML = '<option value=\"\">Select Category</option>';
      
      // Add active categories
      this.categories
        .filter(category => category.active)
        .forEach(category => {
          const option = document.createElement('option');
          option.value = category.name;
          option.textContent = `${category.icon} ${category.name}`;
          option.setAttribute('data-category-id', category.id);
          categorySelect.appendChild(option);
        });
    },
    
    /**
     * Setup charts functionality
     */
    setupCharts() {
      console.log('📊 Setting up expense charts');
      
      // Add charts section to expenses page
      this.addChartsSection();
      
      // Initialize charts
      this.initializeCharts();
    },
    
    /**
     * Add charts section to expenses page
     */
    addChartsSection() {
      const expensesView = document.querySelector('[data-view=\"expenses\"]');
      if (!expensesView) return;
      
      const chartsSection = document.createElement('div');
      chartsSection.className = 'uba-grid';
      chartsSection.style.marginBottom = '20px';
      chartsSection.innerHTML = `
        <div class=\"uba-grid-col\">
          <div class=\"charts-container\">
            <!-- Pie Chart -->
            <div class=\"uba-card chart-card\">
              <div class=\"uba-card-header\">
                <div>
                  <div class=\"uba-card-title\">📊 Expense Distribution</div>
                  <p class=\"uba-card-sub\">Breakdown by category</p>
                </div>
                <div class=\"chart-controls\">
                  <select id=\"pie-chart-period\" class=\"uba-select enhanced-dropdown\">
                    <option value=\"current-month\">This Month</option>
                    <option value=\"last-month\">Last Month</option>
                    <option value=\"last-3-months\">Last 3 Months</option>
                    <option value=\"last-6-months\">Last 6 Months</option>
                  </select>
                </div>
              </div>
              <div class=\"chart-content\">
                <canvas id=\"expense-pie-chart\" width=\"400\" height=\"300\"></canvas>
                <div id=\"pie-chart-legend\" class=\"chart-legend\"></div>
              </div>
            </div>
            
            <!-- Monthly Trend Chart -->
            <div class=\"uba-card chart-card\">
              <div class=\"uba-card-header\">
                <div>
                  <div class=\"uba-card-title\">📈 Monthly Trend</div>
                  <p class=\"uba-card-sub\">Expense trends over time</p>
                </div>
                <div class=\"chart-controls\">
                  <select id=\"trend-chart-period\" class=\"uba-select enhanced-dropdown\">
                    <option value=\"6-months\">Last 6 Months</option>
                    <option value=\"12-months\">Last 12 Months</option>
                    <option value=\"24-months\">Last 24 Months</option>
                  </select>
                </div>
              </div>
              <div class=\"chart-content\">
                <canvas id=\"expense-trend-chart\" width=\"600\" height=\"300\"></canvas>
                <div id=\"trend-chart-summary\" class=\"chart-summary\"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Insert charts before the main expenses table
      const expensesTable = expensesView.querySelector('.uba-grid');
      if (expensesTable) {
        expensesView.insertBefore(chartsSection, expensesTable);
      }
      
      // Setup chart period change handlers
      const pieSelect = document.getElementById('pie-chart-period');
      const trendSelect = document.getElementById('trend-chart-period');
      
      if (pieSelect) {
        pieSelect.addEventListener('change', () => this.updatePieChart());
      }
      
      if (trendSelect) {
        trendSelect.addEventListener('change', () => this.updateTrendChart());
      }
    },
    
    /**
     * Initialize charts
     */
    initializeCharts() {
      // Load Chart.js if not already loaded
      this.loadChartJS().then(() => {
        this.createPieChart();
        this.createTrendChart();
      }).catch(error => {
        console.warn('Charts not available:', error);
        this.createFallbackCharts();
      });
    },
    
    /**
     * Load Chart.js library
     */
    async loadChartJS() {
      if (window.Chart) return;
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },
    
    /**
     * Create pie chart
     */
    createPieChart() {
      const ctx = document.getElementById('expense-pie-chart');
      if (!ctx || !window.Chart) return;
      
      const data = this.getPieChartData();
      
      this.charts.pie = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.values,
            backgroundColor: data.colors,
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false // We'll create custom legend
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label;
                  const value = this.formatAmount(context.parsed);
                  const percentage = ((context.parsed / data.total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      
      // Create custom legend
      this.createPieChartLegend(data);
    },
    
    /**
     * Get pie chart data
     */
    getPieChartData() {
      const period = document.getElementById('pie-chart-period')?.value || 'current-month';
      const expenses = this.getExpensesForPeriod(period);
      
      // Group by category
      const categoryTotals = {};
      expenses.forEach(expense => {
        const category = expense.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
      });
      
      const labels = Object.keys(categoryTotals);
      const values = Object.values(categoryTotals);
      const total = values.reduce((sum, val) => sum + val, 0);
      
      // Get colors for categories
      const colors = labels.map(label => {
        const category = this.categories.find(cat => cat.name === label);
        return category ? category.color : '#64748b';
      });
      
      return { labels, values, colors, total };
    },
    
    /**
     * Create pie chart legend
     */
    createPieChartLegend(data) {
      const legend = document.getElementById('pie-chart-legend');
      if (!legend) return;
      
      legend.innerHTML = data.labels.map((label, index) => {
        const value = data.values[index];
        const percentage = ((value / data.total) * 100).toFixed(1);
        const color = data.colors[index];
        const category = this.categories.find(cat => cat.name === label);
        const icon = category ? category.icon : '📋';
        
        return `
          <div class=\"legend-item\">
            <span class=\"legend-color\" style=\"background-color: ${color}\"></span>
            <span class=\"legend-icon\">${icon}</span>
            <span class=\"legend-label\">${label}</span>
            <span class=\"legend-value\">${this.formatAmount(value)} (${percentage}%)</span>
          </div>
        `;
      }).join('');
    },
    
    /**
     * Create trend chart
     */
    createTrendChart() {
      const ctx = document.getElementById('expense-trend-chart');
      if (!ctx || !window.Chart) return;
      
      const data = this.getTrendChartData();
      
      this.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Total Expenses',
            data: data.values,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '€' + value.toFixed(0)
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `Total: ${this.formatAmount(context.parsed.y)}`;
                }
              }
            }
          }
        }
      });
      
      // Create trend summary
      this.createTrendSummary(data);
    },
    
    /**
     * Get trend chart data
     */
    getTrendChartData() {
      const period = document.getElementById('trend-chart-period')?.value || '6-months';
      const monthsCount = period === '12-months' ? 12 : period === '24-months' ? 24 : 6;
      
      const labels = [];
      const values = [];
      const now = new Date();
      
      // Generate labels and calculate values for each month
      for (let i = monthsCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        labels.push(monthLabel);
        
        // Calculate total expenses for this month
        const monthExpenses = this.getExpensesData().filter(expense => 
          expense.date && expense.date.startsWith(monthKey)
        );
        const monthTotal = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        
        values.push(monthTotal);
      }
      
      return { labels, values };
    },
    
    /**
     * Create trend summary
     */
    createTrendSummary(data) {
      const summary = document.getElementById('trend-chart-summary');
      if (!summary) return;
      
      const total = data.values.reduce((sum, val) => sum + val, 0);
      const average = total / data.values.length;
      const max = Math.max(...data.values);
      const min = Math.min(...data.values);
      
      summary.innerHTML = `
        <div class=\"summary-grid\">
          <div class=\"summary-item\">
            <span class=\"summary-label\">Total</span>
            <span class=\"summary-value\">${this.formatAmount(total)}</span>
          </div>
          <div class=\"summary-item\">
            <span class=\"summary-label\">Average</span>
            <span class=\"summary-value\">${this.formatAmount(average)}</span>
          </div>
          <div class=\"summary-item\">
            <span class=\"summary-label\">Highest</span>
            <span class=\"summary-value\">${this.formatAmount(max)}</span>
          </div>
          <div class=\"summary-item\">
            <span class=\"summary-label\">Lowest</span>
            <span class=\"summary-value\">${this.formatAmount(min)}</span>
          </div>
        </div>
      `;
    },
    
    /**
     * Update pie chart
     */
    updatePieChart() {
      if (this.charts.pie) {
        const data = this.getPieChartData();
        this.charts.pie.data.labels = data.labels;
        this.charts.pie.data.datasets[0].data = data.values;
        this.charts.pie.data.datasets[0].backgroundColor = data.colors;
        this.charts.pie.update();
        this.createPieChartLegend(data);
      }
    },
    
    /**
     * Update trend chart
     */
    updateTrendChart() {
      if (this.charts.trend) {
        const data = this.getTrendChartData();
        this.charts.trend.data.labels = data.labels;
        this.charts.trend.data.datasets[0].data = data.values;
        this.charts.trend.update();
        this.createTrendSummary(data);
      }
    },
    
    /**
     * Create fallback charts (for when Chart.js is not available)
     */
    createFallbackCharts() {
      // Create simple HTML-based charts
      this.createFallbackPieChart();
      this.createFallbackTrendChart();
    },
    
    /**
     * Create fallback pie chart
     */
    createFallbackPieChart() {
      const canvas = document.getElementById('expense-pie-chart');
      if (!canvas) return;
      
      const data = this.getPieChartData();
      const fallback = document.createElement('div');
      fallback.className = 'fallback-pie-chart';
      
      let cumulativePercentage = 0;
      fallback.innerHTML = `
        <div class=\"pie-chart-fallback\">
          ${data.labels.map((label, index) => {
            const value = data.values[index];
            const percentage = ((value / data.total) * 100);
            const color = data.colors[index];
            
            const segment = `
              <div class=\"pie-segment\" style=\"
                background: ${color};
                transform: rotate(${cumulativePercentage * 3.6}deg);
                clip-path: polygon(50% 50%, 50% 0%, ${50 + percentage}% 0%);
              \"></div>
            `;
            
            cumulativePercentage += percentage;
            return segment;
          }).join('')}
        </div>
        <div class=\"pie-chart-center\">
          <strong>${this.formatAmount(data.total)}</strong>
          <small>Total</small>
        </div>
      `;
      
      canvas.parentNode.replaceChild(fallback, canvas);
      this.createPieChartLegend(data);
    },
    
    /**
     * Create fallback trend chart
     */
    createFallbackTrendChart() {
      const canvas = document.getElementById('expense-trend-chart');
      if (!canvas) return;
      
      const data = this.getTrendChartData();
      const maxValue = Math.max(...data.values);
      
      const fallback = document.createElement('div');
      fallback.className = 'fallback-trend-chart';
      fallback.innerHTML = `
        <div class=\"trend-chart-bars\">
          ${data.labels.map((label, index) => {
            const value = data.values[index];
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return `
              <div class=\"trend-bar\" title=\"${label}: ${this.formatAmount(value)}\">
                <div class=\"bar\" style=\"height: ${height}%;\"></div>
                <span class=\"bar-label\">${label}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      canvas.parentNode.replaceChild(fallback, canvas);
      this.createTrendSummary(data);
    },
    
    /**
     * Setup receipt upload functionality
     */
    setupReceiptUpload() {
      console.log('📎 Setting up receipt upload integration');
      
      // Enhance expense form with receipt upload
      this.enhanceExpenseFormWithUpload();
      
      // Setup file upload handlers
      this.setupFileUploadHandlers();
    },
    
    /**
     * Enhance expense form with receipt upload
     */
    enhanceExpenseFormWithUpload() {
      const receiptField = document.getElementById('expense-receipt');
      if (!receiptField) return;
      
      // Replace textarea with enhanced upload section
      const uploadSection = document.createElement('div');
      uploadSection.className = 'receipt-upload-section';
      uploadSection.innerHTML = `
        <div class=\"upload-tabs\">
          <button type=\"button\" class=\"upload-tab active\" data-tab=\"file\">📎 Upload File</button>
          <button type=\"button\" class=\"upload-tab\" data-tab=\"notes\">📝 Notes</button>
        </div>
        
        <div class=\"upload-content\">
          <!-- File Upload Tab -->
          <div class=\"upload-tab-content active\" data-tab=\"file\">
            <div class=\"file-upload-area\" id=\"receipt-upload-area\">
              <input type=\"file\" id=\"receipt-file-input\" class=\"file-input\" accept=\".pdf,.png,.jpg,.jpeg,.gif\" multiple />
              <div class=\"upload-prompt\">
                <span class=\"upload-icon\">📎</span>
                <p>Drop receipt files here or <button type=\"button\" class=\"upload-link\" onclick=\"document.getElementById('receipt-file-input').click()\">browse files</button></p>
                <small>Supports: PDF, PNG, JPG, GIF (max 5MB each)</small>
              </div>
              <div id=\"uploaded-files\" class=\"uploaded-files\"></div>
            </div>
          </div>
          
          <!-- Notes Tab -->
          <div class=\"upload-tab-content\" data-tab=\"notes\">
            <textarea id=\"expense-receipt\" name=\"receipt\" rows=\"3\" class=\"uba-textarea\" placeholder=\"Receipt number, notes, or additional details\"></textarea>
          </div>
        </div>
      `;
      
      // Replace the original textarea's parent
      const parentGroup = receiptField.closest('.uba-form-group');
      if (parentGroup) {
        const label = parentGroup.querySelector('label');
        label.textContent = 'Receipt & Files (الإيصال والملفات)';
        
        // Replace textarea with upload section
        receiptField.parentNode.replaceChild(uploadSection, receiptField);
      }
      
      // Setup tab switching
      this.setupUploadTabs();
      
      // Setup drag and drop
      this.setupDragAndDrop();
    },
    
    /**
     * Setup upload tabs
     */
    setupUploadTabs() {
      const tabs = document.querySelectorAll('.upload-tab');
      const contents = document.querySelectorAll('.upload-tab-content');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetTab = tab.getAttribute('data-tab');
          
          // Update tab states
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update content states
          contents.forEach(content => {
            content.classList.remove('active');
            if (content.getAttribute('data-tab') === targetTab) {
              content.classList.add('active');
            }
          });
        });
      });
    },
    
    /**
     * Setup drag and drop
     */
    setupDragAndDrop() {
      const uploadArea = document.getElementById('receipt-upload-area');
      if (!uploadArea) return;
      
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });
      
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
          uploadArea.classList.add('drag-over');
        });
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
          uploadArea.classList.remove('drag-over');
        });
      });
      
      uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        this.handleFileUpload(files);
      });
    },
    
    /**
     * Setup file upload handlers
     */
    setupFileUploadHandlers() {
      const fileInput = document.getElementById('receipt-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          this.handleFileUpload(e.target.files);
        });
      }
    },
    
    /**
     * Handle file upload
     */
    handleFileUpload(files) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf'];
      
      Array.from(files).forEach(file => {
        // Validate file size
        if (file.size > maxSize) {
          this.showNotification(`File \"${file.name}\" is too large. Maximum size is 5MB.`, 'error');
          return;
        }
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          this.showNotification(`File \"${file.name}\" is not a supported format.`, 'error');
          return;
        }
        
        // Process file
        this.processUploadedFile(file);
      });
    },
    
    /**
     * Process uploaded file
     */
    processUploadedFile(file) {
      const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      // Create file object
      const fileObj = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        file: file // Store the actual file object
      };
      
      // Store in files collection (integrate with files section)
      this.storeFileInFilesSection(fileObj);
      
      // Add to current uploads
      if (!this.fileUploads.currentExpense) {
        this.fileUploads.currentExpense = [];
      }
      this.fileUploads.currentExpense.push(fileObj);
      
      // Update UI
      this.updateUploadedFilesDisplay();
      
      this.showNotification(`File \"${file.name}\" uploaded successfully`, 'success');
    },
    
    /**
     * Store file in files section
     */
    storeFileInFilesSection(fileObj) {
      // Create file entry for files section
      const fileEntry = {
        id: fileObj.id,
        name: fileObj.name,
        type: 'receipt',
        category: 'expense',
        size: fileObj.size,
        mimeType: fileObj.type,
        uploadedAt: fileObj.uploadedAt,
        tags: ['receipt', 'expense'],
        description: 'Expense receipt upload'
      };
      
      // Store in localStorage (files section integration)
      const existingFiles = JSON.parse(localStorage.getItem('uba-files') || '[]');
      existingFiles.push(fileEntry);
      localStorage.setItem('uba-files', JSON.stringify(existingFiles));
    },
    
    /**
     * Update uploaded files display
     */
    updateUploadedFilesDisplay() {
      const container = document.getElementById('uploaded-files');
      if (!container || !this.fileUploads.currentExpense) return;
      
      container.innerHTML = this.fileUploads.currentExpense.map(file => `
        <div class=\"uploaded-file\" data-file-id=\"${file.id}\">
          <div class=\"file-info\">
            <span class=\"file-icon\">${this.getFileIcon(file.type)}</span>
            <div class=\"file-details\">
              <strong class=\"file-name\">${file.name}</strong>
              <small class=\"file-size\">${this.formatFileSize(file.size)}</small>
            </div>
          </div>
          <div class=\"file-actions\">
            <button type=\"button\" class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"window.UBAEnhancedExpenses.previewFile('${file.id}')\" title=\"Preview\">
              👁️
            </button>
            <button type=\"button\" class=\"uba-btn uba-btn-sm uba-btn-danger\" onclick=\"window.UBAEnhancedExpenses.removeFile('${file.id}')\" title=\"Remove\">
              🗑️
            </button>
          </div>
        </div>
      `).join('');
    },
    
    /**
     * Get file icon based on type
     */
    getFileIcon(mimeType) {
      if (mimeType.startsWith('image/')) return '🖼️';
      if (mimeType === 'application/pdf') return '📄';
      return '📎';
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Preview file
     */
    previewFile(fileId) {
      const file = this.fileUploads.currentExpense?.find(f => f.id === fileId);
      if (!file) return;
      
      if (file.type.startsWith('image/')) {
        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.showImagePreview(file.name, e.target.result);
        };
        reader.readAsDataURL(file.file);
      } else if (file.type === 'application/pdf') {
        // Open PDF in new tab
        const url = URL.createObjectURL(file.file);
        window.open(url, '_blank');
      } else {
        this.showNotification('Preview not available for this file type', 'info');
      }
    },
    
    /**
     * Show image preview
     */
    showImagePreview(fileName, dataUrl) {
      const modal = document.createElement('div');
      modal.className = 'uba-modal image-preview-modal is-visible';
      modal.innerHTML = `
        <div class=\"uba-modal-overlay\"></div>
        <div class=\"uba-modal-dialog image-preview-dialog\">
          <div class=\"uba-modal-header\">
            <h3>${fileName}</h3>
            <button class=\"uba-modal-close\">×</button>
          </div>
          <div class=\"uba-modal-body\">
            <img src=\"${dataUrl}\" alt=\"${fileName}\" class=\"preview-image\" />
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';
      
      // Setup close handlers
      const closeBtn = modal.querySelector('.uba-modal-close');
      const overlay = modal.querySelector('.uba-modal-overlay');
      
      const closeModal = () => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
      };
      
      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', closeModal);
    },
    
    /**
     * Remove file
     */
    removeFile(fileId) {
      if (!this.fileUploads.currentExpense) return;
      
      this.fileUploads.currentExpense = this.fileUploads.currentExpense.filter(f => f.id !== fileId);
      this.updateUploadedFilesDisplay();
      
      // Also remove from files section
      const existingFiles = JSON.parse(localStorage.getItem('uba-files') || '[]');
      const updatedFiles = existingFiles.filter(f => f.id !== fileId);
      localStorage.setItem('uba-files', JSON.stringify(updatedFiles));
      
      this.showNotification('File removed', 'info');
    },
    
    /**
     * Setup enhanced dropdown design
     */
    enhanceDropdownDesign() {
      console.log('🎨 Enhancing dropdown design');
      
      // Apply enhanced styling to all dropdowns
      this.applyEnhancedDropdownStyles();
      
      // Setup dropdown interactions
      this.setupDropdownInteractions();
    },
    
    /**
     * Apply enhanced dropdown styles
     */
    applyEnhancedDropdownStyles() {
      // Add enhanced class to all select elements
      document.querySelectorAll('select').forEach(select => {
        select.classList.add('enhanced-dropdown');
      });
      
      // Enhance expense category dropdown specifically
      const categorySelect = document.getElementById('expense-category');
      if (categorySelect) {
        this.enhanceCategoryDropdown(categorySelect);
      }
    },
    
    /**
     * Enhance category dropdown
     */
    enhanceCategoryDropdown(select) {
      // Update category options with icons and colors
      const options = select.querySelectorAll('option[data-category-id]');
      options.forEach(option => {
        const categoryId = option.getAttribute('data-category-id');
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
          option.textContent = `${category.icon} ${category.name}`;
          option.setAttribute('data-color', category.color);
        }
      });
    },
    
    /**
     * Setup dropdown interactions
     */
    setupDropdownInteractions() {
      // Enhanced focus and hover effects are handled via CSS
      // Add any additional JavaScript interactions here
    },
    
    /**
     * Initialize UI components
     */
    initializeUI() {
      // Update category dropdown when page loads
      setTimeout(() => {
        this.updateExpenseFormCategories();
      }, 500);
    },
    
    // Utility methods
    
    /**
     * Get expenses data
     */
    getExpensesData() {
      if (window.ubaStore?.expenses) {
        return window.ubaStore.expenses.getAll() || [];
      }
      // Fallback to demo data
      return this.getDemoExpenses();
    },
    
    /**
     * Get demo expenses for chart testing
     */
    getDemoExpenses() {
      const now = new Date();
      return [
        {
          id: 'demo-1',
          date: now.toISOString().slice(0, 10),
          category: 'Software',
          amount: 299,
          description: 'Design software subscription'
        },
        {
          id: 'demo-2',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString().slice(0, 10),
          category: 'Office Supplies',
          amount: 156,
          description: 'Office equipment'
        },
        {
          id: 'demo-3',
          date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 10),
          category: 'Marketing',
          amount: 850,
          description: 'Social media ads'
        }
      ];
    },
    
    /**
     * Get expenses for specific period
     */
    getExpensesForPeriod(period) {
      const expenses = this.getExpensesData();
      const now = new Date();
      
      switch (period) {
        case 'current-month':
          const currentMonth = now.toISOString().slice(0, 7);
          return expenses.filter(e => e.date && e.date.startsWith(currentMonth));
          
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
          return expenses.filter(e => e.date && e.date.startsWith(lastMonth));
          
        case 'last-3-months':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          return expenses.filter(e => e.date && new Date(e.date) >= threeMonthsAgo);
          
        case 'last-6-months':
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          return expenses.filter(e => e.date && new Date(e.date) >= sixMonthsAgo);
          
        default:
          return expenses;
      }
    },
    
    /**
     * Format amount with currency
     */
    formatAmount(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount || 0);
    },
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', options = {}) {
      if (window.showToast) {
        window.showToast(message, type, options);
      } else {
        console.log(`${type.toUpperCase()}: ${message}`);
      }
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => window.UBAEnhancedExpenses.init(), 1000);
    });
  } else {
    setTimeout(() => window.UBAEnhancedExpenses.init(), 1000);
  }
  
  console.log('✅ Enhanced Expenses module loaded');
  
})();