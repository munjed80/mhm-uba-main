/**
 * Expenses Management Module
 * Comprehensive CRUD functionality for business expense tracking
 */

let expensesData = [];
let currentExpenseId = null;
let isEditMode = false;

// Initialize the expenses page
function initExpensesPage() {
    console.log('Initializing expenses page...');
    loadExpensesData();
    renderExpensesTable();
    updateExpensesMetrics();
    
    // Set today's date as default
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Apply translations if available
    if (window.ubaI18n && window.ubaI18n.applyTranslations) {
        window.ubaI18n.applyTranslations(localStorage.getItem('uba-lang') || 'en');
    }
}

// Load expenses data from store
function loadExpensesData() {
    try {
        const store = window.ubaStore;
        if (store && store.expenses) {
            expensesData = store.expenses.getAll() || [];
        } else {
            // Fallback to demo data if no store available
            expensesData = getDefaultExpenses();
        }
        console.log(`Loaded ${expensesData.length} expenses`);
    } catch (error) {
        console.error('Error loading expenses data:', error);
        expensesData = getDefaultExpenses();
    }
}

// Get default demo expenses
function getDefaultExpenses() {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().slice(0, 7);
    
    return [
        {
            id: 'exp-1',
            date: `${currentMonth}-15`,
            category: 'Software',
            description: 'Project management software subscription',
            amount: 49.99,
            status: 'paid',
            receipt: 'Invoice #PM-2024-001'
        },
        {
            id: 'exp-2',
            date: `${currentMonth}-12`,
            category: 'Office Supplies',
            description: 'Office equipment and supplies',
            amount: 127.50,
            status: 'paid',
            receipt: 'Receipt #OS-445'
        },
        {
            id: 'exp-3',
            date: `${currentMonth}-08`,
            category: 'Marketing',
            description: 'Social media advertising campaign',
            amount: 299.00,
            status: 'pending',
            receipt: 'Campaign #SMC-2024-03'
        },
        {
            id: 'exp-4',
            date: `${lastMonth}-28`,
            category: 'Travel',
            description: 'Client meeting travel expenses',
            amount: 180.75,
            status: 'reimbursed',
            receipt: 'Travel voucher #TV-234'
        },
        {
            id: 'exp-5',
            date: `${lastMonth}-22`,
            category: 'Utilities',
            description: 'Internet and phone services',
            amount: 89.99,
            status: 'paid',
            receipt: 'Bill #UTIL-Nov-2024'
        }
    ];
}

// Render the expenses table
function renderExpensesTable() {
    const tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;

    if (expensesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">
                    <div style="font-size: 18px; margin-bottom: 8px;">No expenses found</div>
                    <div style="font-size: 14px;">Click "Add Expense" to create your first expense record</div>
                </td>
            </tr>
        `;
        return;
    }

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expensesData].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sortedExpenses.map(expense => {
        const statusClass = getStatusClass(expense.status);
        const formattedDate = formatDate(expense.date);
        const formattedAmount = formatCurrency(expense.amount);

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>
                    <span class="uba-category-badge" data-category="${expense.category}">
                        ${expense.category}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 500;">${expense.description || 'No description'}</div>
                    ${expense.receipt ? `<div style="font-size: 12px; color: var(--muted); margin-top: 2px;">${expense.receipt}</div>` : ''}
                </td>
                <td style="font-weight: 600;">${formattedAmount}</td>
                <td>
                    <span class="uba-status-badge ${statusClass}">
                        ${capitalizeFirst(expense.status)}
                    </span>
                </td>
                <td>
                    <div class="uba-table-actions">
                        <button class="uba-btn-link" onclick="editExpense('${expense.id}')" title="Edit expense">
                            Edit
                        </button>
                        <button class="uba-btn-link uba-btn-danger" onclick="deleteExpense('${expense.id}')" title="Delete expense">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update expenses metrics
function updateExpensesMetrics() {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Filter current month expenses
    const thisMonthExpenses = expensesData.filter(expense => 
        expense.date && expense.date.startsWith(currentMonth)
    );
    
    // Calculate metrics
    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalExpenses = expensesData.length;
    const pendingCount = expensesData.filter(expense => expense.status === 'pending').length;
    
    // Calculate average per month (last 6 months)
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
    const recentExpenses = expensesData.filter(expense => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate >= sixMonthsAgo;
    });
    
    const monthlyTotals = {};
    recentExpenses.forEach(expense => {
        const month = expense.date.slice(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(expense.amount || 0);
    });
    
    const avgPerMonth = Object.keys(monthlyTotals).length > 0 
        ? Object.values(monthlyTotals).reduce((sum, total) => sum + total, 0) / Object.keys(monthlyTotals).length 
        : 0;
    
    // Update DOM elements
    updateElement('expenses-this-month', formatCurrency(thisMonthTotal));
    updateElement('expenses-total-count', totalExpenses.toString());
    updateElement('expenses-pending-count', pendingCount.toString());
    updateElement('expenses-avg-month', formatCurrency(avgPerMonth));
}

// Open expense modal for creating new expense
function openExpenseModal(expenseId = null) {
    const modal = document.getElementById('expense-modal');
    const title = document.getElementById('expense-modal-title');
    const saveText = document.getElementById('expense-save-text');
    
    if (!modal) return;
    
    isEditMode = !!expenseId;
    currentExpenseId = expenseId;
    
    // Clear form and errors
    clearExpenseForm();
    clearExpenseErrors();
    
    if (isEditMode) {
        title.textContent = 'Edit Expense';
        saveText.textContent = 'Update Expense';
        loadExpenseData(expenseId);
    } else {
        title.textContent = 'Add New Expense';
        saveText.textContent = 'Save Expense';
        // Set default date to today
        const dateInput = document.getElementById('expense-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        // Set default status to pending
        const statusInput = document.getElementById('expense-status');
        if (statusInput) {
            statusInput.value = 'pending';
        }
    }
    
    modal.style.display = 'flex';
    
    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input:not([readonly])');
        if (firstInput) firstInput.focus();
    }, 100);
}

// Close expense modal
function closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    clearExpenseForm();
    clearExpenseErrors();
    currentExpenseId = null;
    isEditMode = false;
}

// Load expense data into form for editing
function loadExpenseData(expenseId) {
    const expense = expensesData.find(l => l.id === expenseId);
    if (!expense) return;
    
    document.getElementById('expense-date').value = expense.date || '';
    document.getElementById('expense-category').value = expense.category || '';
    document.getElementById('expense-description').value = expense.description || '';
    document.getElementById('expense-amount').value = expense.amount || '';
    document.getElementById('expense-status').value = expense.status || 'pending';
    document.getElementById('expense-receipt').value = expense.receipt || '';
}

// Clear expense form
function clearExpenseForm() {
    const form = document.getElementById('expense-form');
    if (form) {
        form.reset();
    }
}

// Clear expense form errors
function clearExpenseErrors() {
    const errorElements = document.querySelectorAll('.uba-field-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    // Remove error styling from inputs
    const inputs = document.querySelectorAll('#expense-modal input, #expense-modal select, #expense-modal textarea');
    inputs.forEach(input => {
        input.classList.remove('uba-input-error');
    });
}

// Validate expense form
function validateExpenseForm() {
    clearExpenseErrors();
    let isValid = true;
    
    const date = document.getElementById('expense-date').value.trim();
    const category = document.getElementById('expense-category').value.trim();
    const amount = document.getElementById('expense-amount').value.trim();
    
    // Validate date
    if (!date) {
        showFieldError('expense-date', 'Date is required');
        isValid = false;
    } else if (!isValidDate(date)) {
        showFieldError('expense-date', 'Please enter a valid date');
        isValid = false;
    }
    
    // Validate category
    if (!category) {
        showFieldError('expense-category', 'Category is required');
        isValid = false;
    }
    
    // Validate amount
    if (!amount) {
        showFieldError('expense-amount', 'Amount is required');
        isValid = false;
    } else {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            showFieldError('expense-amount', 'Amount must be a positive number');
            isValid = false;
        }
    }
    
    return isValid;
}

// Save expense (create or update)
function saveExpense() {
    if (!validateExpenseForm()) {
        return;
    }
    
    const expenseData = {
        date: document.getElementById('expense-date').value.trim(),
        category: document.getElementById('expense-category').value.trim(),
        description: document.getElementById('expense-description').value.trim(),
        amount: parseFloat(document.getElementById('expense-amount').value.trim()),
        status: document.getElementById('expense-status').value,
        receipt: document.getElementById('expense-receipt').value.trim()
    };
    
    try {
        const store = window.ubaStore;
        
        if (isEditMode && currentExpenseId) {
            // Update existing expense
            if (store && store.expenses) {
                store.expenses.update(currentExpenseId, expenseData);
            } else {
                // Fallback for demo mode
                const index = expensesData.findIndex(l => l.id === currentExpenseId);
                if (index !== -1) {
                    expensesData[index] = { ...expensesData[index], ...expenseData };
                }
            }
            
            if (window.showToast) {
                window.showToast(`Expense "${expenseData.description || expenseData.category}" updated successfully`, 'expense', {
                    title: 'Expense Updated',
                    data: { expenseId: currentExpenseId, description: expenseData.description }
                });
            }
        } else {
            // Create new expense
            const newExpense = {
                id: 'exp-' + Date.now(),
                createdAt: new Date().toISOString(),
                ...expenseData
            };
            
            if (store && store.expenses) {
                store.expenses.create(newExpense);
            } else {
                // Fallback for demo mode
                expensesData.push(newExpense);
            }
            
            if (window.showToast) {
                window.showToast(`New expense "${expenseData.description || expenseData.category}" added (${formatCurrency(expenseData.amount)})`, 'expense', {
                    title: 'Expense Created',
                    data: { expenseId: newExpense.id, description: expenseData.description, amount: expenseData.amount }
                });
            }
        }
        
        // Refresh data and UI
        refreshExpensesData();
        closeExpenseModal();
        
    } catch (error) {
        console.error('Error saving expense:', error);
        if (window.showToast) {
            window.showToast('Error saving expense. Please try again.', 'error');
        }
    }
}

// Edit expense
function editExpense(expenseId) {
    openExpenseModal(expenseId);
}

// Delete expense
function deleteExpense(expenseId) {
    const expense = expensesData.find(l => l.id === expenseId);
    if (!expense) return;
    
    if (!confirm(`Are you sure you want to delete the expense "${expense.description || expense.category}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const store = window.ubaStore;
        
        if (store && store.expenses) {
            store.expenses.delete(expenseId);
        } else {
            // Fallback for demo mode
            const index = expensesData.findIndex(l => l.id === expenseId);
            if (index !== -1) {
                expensesData.splice(index, 1);
            }
        }
        
        // Refresh data and UI
        loadExpensesData();
        renderExpensesTable();
        updateExpensesMetrics();
        
        if (window.showToast) {
            window.showToast(`Expense "${expense.description || expense.category}" removed`, 'info', {
                title: 'Expense Deleted',
                data: { description: expense.description }
            });
        }
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        if (window.showToast) {
            window.showToast('Error deleting expense. Please try again.', 'error');
        }
    }
}

// Utility functions
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + '-error');
    
    if (field) {
        field.classList.add('uba-input-error');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function getStatusClass(status) {
    const statusClasses = {
        'pending': 'uba-status-warning',
        'paid': 'uba-status-success',
        'reimbursed': 'uba-status-info'
    };
    return statusClasses[status] || 'uba-status-default';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

// Update expenses data and refresh search index
function refreshExpensesData() {
    loadExpensesData();
    renderExpensesTable();
    updateExpensesMetrics();
    
    // Rebuild search index after data changes
    if (typeof window.search?.buildIndex === 'function') {
        setTimeout(() => window.search.buildIndex(), 100);
    }
}

// Filter expenses based on search, filter, and sort criteria
function filterExpenses(searchQuery = '', filterBy = '', sortBy = '') {
    let filteredExpenses = [...expensesData];
    
    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredExpenses = filteredExpenses.filter(expense => {
            return [expense.description, expense.category, expense.receipt, String(expense.amount)]
                .some(field => field && field.toLowerCase().includes(query));
        });
    }
    
    // Apply status/category filter
    if (filterBy) {
        filteredExpenses = filteredExpenses.filter(expense => {
            switch (filterBy) {
                case 'category':
                    return expense.category === filterBy;
                case 'status':
                    return expense.status === filterBy;
                case 'dateRange':
                    // This would be implemented based on specific date range logic
                    return true;
                default:
                    return true;
            }
        });
    }
    
    // Apply sorting
    if (sortBy) {
        const [field, direction] = sortBy.split('-');
        filteredExpenses.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // Handle different data types
            if (field === 'amount') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else if (field === 'date') {
                valueA = new Date(valueA).getTime() || 0;
                valueB = new Date(valueB).getTime() || 0;
            } else if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (direction === 'desc') {
                return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
            } else {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            }
        });
    }
    
    // Re-render table with filtered results
    renderExpensesTableWithData(filteredExpenses);
}

// Render expenses table with specific data
function renderExpensesTableWithData(expenses) {
    const tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;

    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">
                    <div style="font-size: 18px; margin-bottom: 8px;">No expenses found</div>
                    <div style="font-size: 14px;">Try adjusting your search or filter criteria</div>
                </td>
            </tr>
        `;
        return;
    }

    // Sort expenses by date (newest first) if no custom sort
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sortedExpenses.map(expense => {
        const statusClass = getStatusClass(expense.status);
        const formattedDate = formatDate(expense.date);
        const formattedAmount = formatCurrency(expense.amount);

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>
                    <span class="uba-category-badge" data-category="${expense.category}">
                        ${expense.category}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 500;">${expense.description || 'No description'}</div>
                    ${expense.receipt ? `<div style="font-size: 12px; color: var(--muted); margin-top: 2px;">${expense.receipt}</div>` : ''}
                </td>
                <td style="font-weight: 600;">${formattedAmount}</td>
                <td>
                    <span class="uba-status-badge ${statusClass}">
                        ${capitalizeFirst(expense.status)}
                    </span>
                </td>
                <td>
                    <div class="uba-table-actions">
                        <button class="uba-btn-link" onclick="editExpense('${expense.id}')" title="Edit expense">
                            Edit
                        </button>
                        <button class="uba-btn-link uba-btn-danger" onclick="deleteExpense('${expense.id}')" title="Delete expense">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Make functions available globally
window.filterExpenses = filterExpenses;
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.saveExpense = saveExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.initExpensesPage = initExpensesPage;

// Handle modal clicks
document.addEventListener('click', function(event) {
    const modal = document.getElementById('expense-modal');
    if (event.target === modal) {
        closeExpenseModal();
    }
});

// Handle escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('expense-modal');
        if (modal && modal.style.display !== 'none') {
            closeExpenseModal();
        }
    }
});

// Handle enter key in form
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.closest('#expense-form')) {
        if (event.target.tagName === 'TEXTAREA') {
            return; // Allow enter in textarea
        }
        event.preventDefault();
        saveExpense();
    }
});