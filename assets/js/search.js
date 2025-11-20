/**
 * Comprehensive Search, Filter, and Sort System
 * Provides global search functionality across all modules and data types
 */

let searchHistory = [];
let searchIndex = new Map();
let activeFilters = new Map();
let activeSorts = new Map();

// Search configuration for different data types
const SEARCH_CONFIGS = {
    leads: {
        fields: ['company', 'contactName', 'email', 'phone', 'industry', 'source', 'notes'],
        weights: { company: 3, contactName: 2, email: 2, industry: 2, source: 1, phone: 1, notes: 1 },
        filters: ['status', 'industry', 'source', 'priority'],
        sorts: ['company', 'contactName', 'createdAt', 'value', 'priority']
    },
    expenses: {
        fields: ['description', 'category', 'receipt', 'amount'],
        weights: { description: 3, category: 2, receipt: 1, amount: 2 },
        filters: ['category', 'status', 'dateRange'],
        sorts: ['date', 'amount', 'category', 'description']
    },
    clients: {
        fields: ['name', 'email', 'phone', 'company', 'industry', 'notes'],
        weights: { name: 3, company: 3, email: 2, industry: 2, phone: 1, notes: 1 },
        filters: ['status', 'industry', 'tier'],
        sorts: ['name', 'company', 'createdAt', 'lastContact']
    },
    projects: {
        fields: ['name', 'description', 'client', 'stage'],
        weights: { name: 3, client: 2, description: 2, stage: 1 },
        filters: ['stage', 'client', 'priority'],
        sorts: ['name', 'createdAt', 'deadline', 'stage']
    },
    tasks: {
        fields: ['title', 'description', 'project', 'assignee'],
        weights: { title: 3, description: 2, project: 2, assignee: 1 },
        filters: ['status', 'priority', 'assignee', 'project'],
        sorts: ['title', 'createdAt', 'dueDate', 'priority']
    },
    invoices: {
        fields: ['clientName', 'description', 'amount', 'status'],
        weights: { clientName: 3, description: 2, amount: 2, status: 1 },
        filters: ['status', 'client', 'dateRange'],
        sorts: ['createdAt', 'amount', 'dueDate', 'clientName']
    }
};

// Initialize search system
function initSearchSystem() {
    console.log('Initializing comprehensive search system...');
    loadSearchHistory();
    createGlobalSearchUI();
    buildSearchIndex();
    setupSearchEventListeners();
    
    // Initialize module-specific search on each page
    initModuleSearch();
}

// Load search history from localStorage
function loadSearchHistory() {
    try {
        const saved = localStorage.getItem('uba-search-history');
        if (saved) {
            searchHistory = JSON.parse(saved);
            // Keep only last 50 searches
            if (searchHistory.length > 50) {
                searchHistory = searchHistory.slice(-50);
                saveSearchHistory();
            }
        }
    } catch (error) {
        console.error('Error loading search history:', error);
        searchHistory = [];
    }
}

// Save search history to localStorage
function saveSearchHistory() {
    try {
        localStorage.setItem('uba-search-history', JSON.stringify(searchHistory));
    } catch (error) {
        console.error('Error saving search history:', error);
    }
}

// Create global search UI in topbar
function createGlobalSearchUI() {
    const topRight = document.querySelector('.uba-top-right');
    if (!topRight) return;
    
    // Check if search already exists
    if (document.getElementById('global-search-container')) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.id = 'global-search-container';
    searchContainer.className = 'global-search-container';
    searchContainer.innerHTML = `
        <div class="global-search-input-wrapper">
            <input 
                type="text" 
                id="global-search-input" 
                class="global-search-input" 
                placeholder="Search across all data..." 
                autocomplete="off"
            >
            <button class="global-search-button" onclick="performGlobalSearch()">
                🔍
            </button>
        </div>
        <div id="global-search-results" class="global-search-results" style="display: none;">
            <!-- Search results will appear here -->
        </div>
    `;
    
    // Insert before notification bell
    const notificationBell = topRight.querySelector('#notification-bell');
    if (notificationBell) {
        topRight.insertBefore(searchContainer, notificationBell);
    } else {
        const userPill = topRight.querySelector('.uba-user-pill');
        if (userPill) {
            topRight.insertBefore(searchContainer, userPill);
        } else {
            topRight.appendChild(searchContainer);
        }
    }
}

// Build search index for all data types
function buildSearchIndex() {
    searchIndex.clear();
    
    try {
        // Index leads
        const leadsStore = window.ubaStore?.leads;
        if (leadsStore) {
            const leads = leadsStore.getAll() || [];
            indexData('leads', leads, SEARCH_CONFIGS.leads);
        }
        
        // Index expenses
        const expensesStore = window.ubaStore?.expenses;
        if (expensesStore) {
            const expenses = expensesStore.getAll() || [];
            indexData('expenses', expenses, SEARCH_CONFIGS.expenses);
        }
        
        // Index clients
        const clientsStore = window.ubaStore?.clients;
        if (clientsStore) {
            const clients = clientsStore.getAll() || [];
            indexData('clients', clients, SEARCH_CONFIGS.clients);
        }
        
        // Index projects
        const projectsStore = window.ubaStore?.projects;
        if (projectsStore) {
            const projects = projectsStore.getAll() || [];
            indexData('projects', projects, SEARCH_CONFIGS.projects);
        }
        
        // Index tasks
        const tasksStore = window.ubaStore?.tasks;
        if (tasksStore) {
            const tasks = tasksStore.getAll() || [];
            indexData('tasks', tasks, SEARCH_CONFIGS.tasks);
        }
        
        // Index invoices
        const invoicesStore = window.ubaStore?.invoices;
        if (invoicesStore) {
            const invoices = invoicesStore.getAll() || [];
            indexData('invoices', invoices, SEARCH_CONFIGS.invoices);
        }
        
        console.log(`Search index built with ${searchIndex.size} entries`);
    } catch (error) {
        console.error('Error building search index:', error);
    }
}

// Index data for a specific type
function indexData(type, data, config) {
    if (!Array.isArray(data)) return;
    
    data.forEach(item => {
        const searchableText = config.fields
            .map(field => {
                const value = getNestedValue(item, field);
                return value ? String(value).toLowerCase() : '';
            })
            .join(' ');
        
        if (searchableText.trim()) {
            const key = `${type}:${item.id}`;
            searchIndex.set(key, {
                type,
                id: item.id,
                item,
                searchableText,
                config
            });
        }
    });
}

// Get nested value from object (supports dot notation)
function getNestedValue(obj, path) {
    return path.split('.').reduce((value, key) => value?.[key], obj);
}

// Setup search event listeners
function setupSearchEventListeners() {
    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;
    
    let searchTimeout;
    
    // Real-time search as user types
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                performGlobalSearch(query);
            } else {
                hideSearchResults();
            }
        }, 300);
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        handleSearchKeyboard(e);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        const container = document.getElementById('global-search-container');
        if (container && !container.contains(e.target)) {
            hideSearchResults();
        }
    });
}

// Perform global search
function performGlobalSearch(query = null) {
    const searchInput = document.getElementById('global-search-input');
    const searchQuery = query || searchInput?.value.trim();
    
    if (!searchQuery || searchQuery.length < 2) {
        hideSearchResults();
        return [];
    }
    
    // Add to search history
    addToSearchHistory(searchQuery);
    
    // Perform search
    const results = searchAllData(searchQuery);
    
    // Display results
    displaySearchResults(results, searchQuery);
    
    return results;
}

// Search all indexed data
function searchAllData(query) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const results = [];
    
    for (const [key, indexed] of searchIndex) {
        const score = calculateSearchScore(indexed.searchableText, queryWords, indexed.config.weights);
        
        if (score > 0) {
            results.push({
                ...indexed,
                score,
                highlights: findHighlights(indexed.item, queryWords, indexed.config.fields)
            });
        }
    }
    
    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
}

// Calculate search score for an item
function calculateSearchScore(text, queryWords, weights = {}) {
    let score = 0;
    
    queryWords.forEach(word => {
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&'), 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            // Base score for matches
            score += matches.length;
            
            // Bonus for exact matches
            if (text.toLowerCase().includes(word.toLowerCase())) {
                score += 2;
            }
            
            // Bonus for matches at word boundaries
            const wordBoundaryRegex = new RegExp(`\\\\b${word.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}\\\\b`, 'gi');
            const wordBoundaryMatches = text.match(wordBoundaryRegex);
            if (wordBoundaryMatches) {
                score += wordBoundaryMatches.length * 2;
            }
        }
    });
    
    return score;
}

// Find highlights in search results
function findHighlights(item, queryWords, fields) {
    const highlights = {};
    
    fields.forEach(field => {
        const value = getNestedValue(item, field);
        if (value) {
            const stringValue = String(value);
            let highlightedValue = stringValue;
            
            queryWords.forEach(word => {
                const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')})`, 'gi');
                highlightedValue = highlightedValue.replace(regex, '<mark>$1</mark>');
            });
            
            if (highlightedValue !== stringValue) {
                highlights[field] = highlightedValue;
            }
        }
    });
    
    return highlights;
}

// Display search results
function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">🔍</div>
                <div class="search-no-results-text">No results found for "${query}"</div>
                <div class="search-no-results-hint">Try different keywords or check spelling</div>
            </div>
        `;
        resultsContainer.style.display = 'block';
        return;
    }
    
    // Group results by type
    const groupedResults = groupBy(results.slice(0, 20), 'type'); // Limit to top 20 results
    
    let html = `
        <div class="search-results-header">
            <span class="search-results-count">${results.length} result${results.length === 1 ? '' : 's'} for "${query}"</span>
            <button class="search-clear-btn" onclick="clearSearch()">Clear</button>
        </div>
    `;
    
    Object.keys(groupedResults).forEach(type => {
        const typeResults = groupedResults[type];
        const typeConfig = SEARCH_CONFIGS[type];
        
        html += `
            <div class="search-type-section">
                <h4 class="search-type-title">${capitalizeFirst(type)} (${typeResults.length})</h4>
                <div class="search-type-results">
        `;
        
        typeResults.slice(0, 5).forEach(result => { // Limit to 5 per type
            html += formatSearchResult(result, typeConfig);
        });
        
        if (typeResults.length > 5) {
            html += `
                <div class="search-show-more">
                    <button class="uba-btn-link" onclick="showAllResults('${type}', '${query}')">
                        Show all ${typeResults.length} ${type} results
                    </button>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
}

// Format individual search result
function formatSearchResult(result, config) {
    const { item, highlights, type } = result;
    
    // Get primary display field
    const primaryField = config.fields[0];
    const primaryValue = highlights[primaryField] || getNestedValue(item, primaryField) || 'Unknown';
    
    // Get secondary fields for description
    const secondaryFields = config.fields.slice(1, 3);
    const secondaryValues = secondaryFields
        .map(field => highlights[field] || getNestedValue(item, field))
        .filter(Boolean)
        .join(' • ');
    
    const typeIcon = getTypeIcon(type);
    const onClick = `openSearchResult('${type}', '${item.id}')`;
    
    return `
        <div class="search-result-item" onclick="${onClick}">
            <div class="search-result-icon">${typeIcon}</div>
            <div class="search-result-content">
                <div class="search-result-title">${primaryValue}</div>
                ${secondaryValues ? `<div class="search-result-description">${secondaryValues}</div>` : ''}
                <div class="search-result-meta">${capitalizeFirst(type)}</div>
            </div>
        </div>
    `;
}

// Get icon for data type
function getTypeIcon(type) {
    const icons = {
        leads: '🧲',
        expenses: '📤',
        clients: '👥',
        projects: '📊',
        tasks: '✓',
        invoices: '📄'
    };
    return icons[type] || '📋';
}

// Hide search results
function hideSearchResults() {
    const resultsContainer = document.getElementById('global-search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    hideSearchResults();
}

// Open search result
function openSearchResult(type, id) {
    // Map types to page URLs
    const pageUrls = {
        leads: 'leads.html',
        expenses: 'expenses.html',
        clients: 'clients.html',
        projects: 'projects.html',
        tasks: 'tasks.html',
        invoices: 'invoices.html'
    };
    
    const url = pageUrls[type];
    if (url) {
        // Store the selected item ID for highlighting
        sessionStorage.setItem('uba-search-highlight', JSON.stringify({ type, id }));
        window.location.href = url;
    }
    
    hideSearchResults();
}

// Add to search history
function addToSearchHistory(query) {
    // Remove existing entry if it exists
    searchHistory = searchHistory.filter(item => item.query !== query);
    
    // Add new entry at the beginning
    searchHistory.unshift({
        query,
        timestamp: new Date().toISOString(),
        count: 1
    });
    
    // Keep only last 50 searches
    if (searchHistory.length > 50) {
        searchHistory = searchHistory.slice(0, 50);
    }
    
    saveSearchHistory();
}

// Initialize module-specific search for current page
function initModuleSearch() {
    const pageId = document.getElementById('page-id')?.dataset?.page;
    if (!pageId) return;
    
    const moduleType = pageId.replace('-page', '');
    const config = SEARCH_CONFIGS[moduleType];
    
    if (config) {
        createModuleSearchUI(moduleType, config);
    }
}

// Create module-specific search UI
function createModuleSearchUI(moduleType, config) {
    const container = document.querySelector('.uba-card-header');
    if (!container || document.getElementById('module-search-container')) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.id = 'module-search-container';
    searchContainer.className = 'module-search-container';
    searchContainer.innerHTML = `
        <div class="module-search-controls">
            <input 
                type="text" 
                id="module-search-input" 
                class="module-search-input" 
                placeholder="Search ${moduleType}..." 
            >
            <select id="module-filter-select" class="module-filter-select">
                <option value="">All ${moduleType}</option>
                ${generateFilterOptions(moduleType, config)}
            </select>
            <select id="module-sort-select" class="module-sort-select">
                <option value="">Sort by...</option>
                ${generateSortOptions(config)}
            </select>
            <button class="module-search-clear" onclick="clearModuleSearch()">Clear</button>
        </div>
    `;
    
    container.appendChild(searchContainer);
    
    // Setup event listeners
    setupModuleSearchListeners(moduleType, config);
}

// Generate filter options for module
function generateFilterOptions(moduleType, config) {
    // This would be dynamically generated based on actual data
    // For now, return basic options
    return config.filters.map(filter => 
        `<option value="${filter}">${capitalizeFirst(filter)}</option>`
    ).join('');
}

// Generate sort options for module
function generateSortOptions(config) {
    return config.sorts.map(sort => [
        `<option value="${sort}-asc">${capitalizeFirst(sort)} ↑</option>`,
        `<option value="${sort}-desc">${capitalizeFirst(sort)} ↓</option>`
    ]).flat().join('');
}

// Setup module search listeners
function setupModuleSearchListeners(moduleType, config) {
    const searchInput = document.getElementById('module-search-input');
    const filterSelect = document.getElementById('module-filter-select');
    const sortSelect = document.getElementById('module-sort-select');
    
    if (!searchInput) return;
    
    let searchTimeout;
    
    const performModuleSearch = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.trim();
            const filter = filterSelect?.value || '';
            const sort = sortSelect?.value || '';
            
            // Notify the module to update its display
            if (typeof window[`filter${capitalizeFirst(moduleType)}`] === 'function') {
                window[`filter${capitalizeFirst(moduleType)}`](query, filter, sort);
            }
        }, 300);
    };
    
    searchInput.addEventListener('input', performModuleSearch);
    if (filterSelect) filterSelect.addEventListener('change', performModuleSearch);
    if (sortSelect) sortSelect.addEventListener('change', performModuleSearch);
}

// Clear module search
function clearModuleSearch() {
    const searchInput = document.getElementById('module-search-input');
    const filterSelect = document.getElementById('module-filter-select');
    const sortSelect = document.getElementById('module-sort-select');
    
    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = '';
    if (sortSelect) sortSelect.value = '';
    
    // Trigger search clear
    const pageId = document.getElementById('page-id')?.dataset?.page;
    if (pageId) {
        const moduleType = pageId.replace('-page', '');
        if (typeof window[`filter${capitalizeFirst(moduleType)}`] === 'function') {
            window[`filter${capitalizeFirst(moduleType)}`]('', '', '');
        }
    }
}

// Handle keyboard navigation in search
function handleSearchKeyboard(e) {
    if (e.key === 'Escape') {
        hideSearchResults();
    } else if (e.key === 'Enter') {
        const firstResult = document.querySelector('.search-result-item');
        if (firstResult) {
            firstResult.click();
        }
    }
}

// Group array by key
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
}

// Capitalize first letter
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Public API for search system
window.search = {
    init: initSearchSystem,
    performGlobal: performGlobalSearch,
    buildIndex: buildSearchIndex,
    clear: clearSearch,
    clearModule: clearModuleSearch
};

// Make global functions available
window.performGlobalSearch = performGlobalSearch;
window.clearSearch = clearSearch;
window.clearModuleSearch = clearModuleSearch;
window.openSearchResult = openSearchResult;
window.showAllResults = (type, query) => {
    console.log(`Show all ${type} results for: ${query}`);
    // Implementation for showing all results
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchSystem);
} else {
    initSearchSystem();
}