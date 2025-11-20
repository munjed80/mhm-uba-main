/**
 * Comprehensive Notification Center Module
 * Handles toast notifications, notification center, and notification persistence
 */

let notificationsData = [];
let unreadCount = 0;

// Notification types and their configurations
const NOTIFICATION_TYPES = {
    info: {
        icon: '🔔',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)'
    },
    success: {
        icon: '✅',
        color: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.1)'
    },
    warning: {
        icon: '⚠️',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)'
    },
    error: {
        icon: '❌',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)'
    },
    system: {
        icon: '⚙️',
        color: '#6b7280',
        bg: 'rgba(107, 114, 128, 0.1)'
    },
    lead: {
        icon: '🧲',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.1)'
    },
    expense: {
        icon: '📤',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.1)'
    },
    task: {
        icon: '✓',
        color: '#22d3ee',
        bg: 'rgba(34, 211, 238, 0.1)'
    },
    project: {
        icon: '📊',
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.1)'
    }
};

// Initialize notifications system
function initNotifications() {
    console.log('Initializing notifications system...');
    loadNotificationsData();
    createNotificationBell();
    createNotificationCenter();
    updateNotificationBadge();
    
    // Set up auto-save
    setupNotificationAutoSave();
    
    // Generate some initial notifications for demo
    if (notificationsData.length === 0) {
        generateDemoNotifications();
    }
}

// Load notifications data from localStorage
function loadNotificationsData() {
    try {
        const saved = localStorage.getItem('uba-notifications');
        if (saved) {
            notificationsData = JSON.parse(saved);
            // Clean old notifications (keep last 100)
            if (notificationsData.length > 100) {
                notificationsData = notificationsData.slice(-100);
                saveNotificationsData();
            }
        } else {
            notificationsData = [];
        }
        
        // Calculate unread count
        unreadCount = notificationsData.filter(n => !n.read).length;
        console.log(`Loaded ${notificationsData.length} notifications, ${unreadCount} unread`);
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsData = [];
        unreadCount = 0;
    }
}

// Save notifications data to localStorage
function saveNotificationsData() {
    try {
        localStorage.setItem('uba-notifications', JSON.stringify(notificationsData));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

// Create notification bell in topbar
function createNotificationBell() {
    const topRight = document.querySelector('.uba-top-right');
    if (!topRight) return;
    
    // Check if bell already exists
    if (document.getElementById('notification-bell')) return;
    
    const bellContainer = document.createElement('div');
    bellContainer.innerHTML = `
        <button id="notification-bell" class="uba-notification-bell" onclick="toggleNotificationCenter()" title="Notifications">
            <span class="notification-icon">🔔</span>
            <span id="notification-badge" class="notification-badge" style="display: none;">0</span>
        </button>
    `;
    
    // Insert before the user pill
    const userPill = topRight.querySelector('.uba-user-pill');
    if (userPill) {
        topRight.insertBefore(bellContainer.firstElementChild, userPill);
    } else {
        topRight.appendChild(bellContainer.firstElementChild);
    }
}

// Create notification center modal
function createNotificationCenter() {
    // Check if center already exists
    if (document.getElementById('notification-center')) return;
    
    const centerHTML = `
        <div id="notification-center" class="notification-center" style="display: none;">
            <div class="notification-center-content">
                <div class="notification-center-header">
                    <h3>Notifications</h3>
                    <div class="notification-center-actions">
                        <button class="uba-btn-link" onclick="markAllNotificationsRead()" title="Mark all as read">
                            Mark all read
                        </button>
                        <button class="uba-btn-link" onclick="clearAllNotifications()" title="Clear all">
                            Clear all
                        </button>
                        <button class="notification-close" onclick="closeNotificationCenter()" title="Close">
                            ✕
                        </button>
                    </div>
                </div>
                <div class="notification-center-body" id="notification-center-body">
                    <!-- Notifications will be rendered here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', centerHTML);
}

// Enhanced showToast function that also creates persistent notifications
function showToast(message, type = 'info', options = {}) {
    // Create persistent notification if not disabled
    if (!options.skipPersistent) {
        createNotification(message, type, options);
    }
    
    // Show toast
    displayToast(message, type, options);
}

// Display toast notification
function displayToast(message, type = 'info', options = {}) {
    let container = document.getElementById('uba-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'uba-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1500;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    const toast = document.createElement('div');
    toast.className = 'uba-toast';
    toast.style.cssText = `
        background: ${typeConfig.bg};
        border: 1px solid ${typeConfig.color};
        border-radius: 8px;
        padding: 12px 16px;
        color: ${typeConfig.color};
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 280px;
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        pointer-events: auto;
        cursor: pointer;
    `;
    
    toast.innerHTML = `
        <span>${typeConfig.icon}</span>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; font-size: 16px;">✕</button>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });
    
    // Auto remove
    const duration = options.duration || (type === 'error' ? 5000 : 3000);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    });
}

// Create persistent notification
function createNotification(message, type = 'info', options = {}) {
    const notification = {
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false,
        title: options.title || getDefaultTitle(type),
        action: options.action || null,
        data: options.data || null
    };
    
    notificationsData.unshift(notification);
    unreadCount++;
    
    // Keep only last 100 notifications
    if (notificationsData.length > 100) {
        notificationsData = notificationsData.slice(0, 100);
    }
    
    updateNotificationBadge();
    saveNotificationsData();
    
    // Update center if open
    if (document.getElementById('notification-center').style.display !== 'none') {
        renderNotificationCenter();
    }
    
    return notification.id;
}

// Get default title for notification type
function getDefaultTitle(type) {
    const titles = {
        info: 'Information',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
        system: 'System',
        lead: 'Lead Update',
        expense: 'Expense Update',
        task: 'Task Update',
        project: 'Project Update'
    };
    return titles[type] || 'Notification';
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Toggle notification center
function toggleNotificationCenter() {
    const center = document.getElementById('notification-center');
    if (!center) return;
    
    if (center.style.display === 'none') {
        openNotificationCenter();
    } else {
        closeNotificationCenter();
    }
}

// Open notification center
function openNotificationCenter() {
    const center = document.getElementById('notification-center');
    if (!center) return;
    
    renderNotificationCenter();
    center.style.display = 'flex';
    
    // Add click outside to close
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);
}

// Close notification center
function closeNotificationCenter() {
    const center = document.getElementById('notification-center');
    if (center) {
        center.style.display = 'none';
        document.removeEventListener('click', handleOutsideClick);
    }
}

// Handle outside click
function handleOutsideClick(event) {
    const center = document.getElementById('notification-center');
    const bell = document.getElementById('notification-bell');
    
    if (center && !center.contains(event.target) && !bell.contains(event.target)) {
        closeNotificationCenter();
    }
}

// Render notification center
function renderNotificationCenter() {
    const body = document.getElementById('notification-center-body');
    if (!body) return;
    
    if (notificationsData.length === 0) {
        body.innerHTML = `
            <div class="notification-empty">
                <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
                    <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">No notifications yet</div>
                    <div style="font-size: 14px;">You'll see important updates and activities here</div>
                </div>
            </div>
        `;
        return;
    }
    
    // Sort by newest first
    const sortedNotifications = [...notificationsData].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    body.innerHTML = sortedNotifications.map(notification => {
        const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
        const timeAgo = formatTimeAgo(notification.timestamp);
        
        return `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon" style="color: ${typeConfig.color};">
                    ${typeConfig.icon}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? `<button class="uba-btn-link" onclick="markNotificationRead('${notification.id}')">Mark read</button>` : ''}
                    <button class="uba-btn-link uba-btn-danger" onclick="deleteNotification('${notification.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Mark notification as read
function markNotificationRead(id) {
    const notification = notificationsData.find(n => n.id === id);
    if (notification && !notification.read) {
        notification.read = true;
        unreadCount = Math.max(0, unreadCount - 1);
        updateNotificationBadge();
        saveNotificationsData();
        renderNotificationCenter();
    }
}

// Mark all notifications as read
function markAllNotificationsRead() {
    notificationsData.forEach(n => n.read = true);
    unreadCount = 0;
    updateNotificationBadge();
    saveNotificationsData();
    renderNotificationCenter();
}

// Delete notification
function deleteNotification(id) {
    const index = notificationsData.findIndex(n => n.id === id);
    if (index !== -1) {
        const notification = notificationsData[index];
        if (!notification.read) {
            unreadCount = Math.max(0, unreadCount - 1);
        }
        notificationsData.splice(index, 1);
        updateNotificationBadge();
        saveNotificationsData();
        renderNotificationCenter();
    }
}

// Clear all notifications
function clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
        notificationsData = [];
        unreadCount = 0;
        updateNotificationBadge();
        saveNotificationsData();
        renderNotificationCenter();
    }
}

// Format time ago
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
        return 'Just now';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Setup auto-save
function setupNotificationAutoSave() {
    // Auto-save every 30 seconds if there are unsaved changes
    setInterval(() => {
        if (notificationsData.length > 0) {
            saveNotificationsData();
        }
    }, 30000);
}

// Generate demo notifications
function generateDemoNotifications() {
    const demoNotifications = [
        {
            message: 'New lead "Acme Corp" added to pipeline',
            type: 'lead',
            title: 'New Lead',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
        },
        {
            message: 'Expense "Office supplies" ($127.50) has been paid',
            type: 'expense',
            title: 'Expense Paid',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
            message: 'Task "Prepare quarterly report" completed',
            type: 'task',
            title: 'Task Completed',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
            message: 'Welcome to MHM UBA! Your workspace is ready.',
            type: 'system',
            title: 'Welcome',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        }
    ];
    
    demoNotifications.forEach((demo, index) => {
        createNotification(demo.message, demo.type, {
            title: demo.title,
            skipPersistent: true
        });
        // Mark older notifications as read
        if (index >= 2) {
            notificationsData[index].read = true;
            unreadCount--;
        }
    });
    
    updateNotificationBadge();
    saveNotificationsData();
}

// Notification API functions for other modules
window.notifications = {
    show: showToast,
    create: createNotification,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
    delete: deleteNotification,
    clearAll: clearAllNotifications
};

// Make global functions available
window.showToast = showToast;
window.toggleNotificationCenter = toggleNotificationCenter;
window.openNotificationCenter = openNotificationCenter;
window.closeNotificationCenter = closeNotificationCenter;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
window.initNotifications = initNotifications;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}