// files.js — Production-ready SaaS File Manager for MHM UBA
// Integrates with UBA.data, UBA.billing, and UBA.members
(function () {
  'use strict';

  // ===============================
  // State Management
  // ===============================
  let allFiles = [];
  let filteredFiles = [];
  let currentCategory = 'all';
  let currentSort = 'date-desc';
  let searchQuery = '';
  let currentSmartFilter = 'all';
  let currentViewMode = 'grid';
  let currentUser = null;
  let currentRole = null;
  let renameFileId = null;

  const RECENT_DAYS = 7;
  const LARGE_FILE_THRESHOLD = 25 * 1024 * 1024; // 25 MB

  // ===============================
  // Utilities
  // ===============================
  
  function log(...args) {
    console.log('[Files]', ...args);
  }

  function warn(...args) {
    console.warn('[Files]', ...args);
  }

  function generateId() {
    if (window.crypto && crypto.randomUUID) {
      return `file-${crypto.randomUUID()}`;
    }
    return `file-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  function getFileCategory(type) {
    if (!type) return 'other';
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('image') || lowerType.includes('jpg') || lowerType.includes('png') || lowerType.includes('gif') || lowerType.includes('webp')) {
      return 'images';
    }
    if (lowerType.includes('pdf')) {
      return 'pdfs';
    }
    if (lowerType.includes('video') || lowerType.includes('mp4') || lowerType.includes('webm')) {
      return 'videos';
    }
    if (lowerType.includes('word') || lowerType.includes('document') || lowerType.includes('text') || 
        lowerType.includes('spreadsheet') || lowerType.includes('presentation')) {
      return 'documents';
    }
    return 'other';
  }

  function getFileIcon(type) {
    const category = getFileCategory(type);
    const icons = {
      images: '🖼️',
      pdfs: '📕',
      videos: '🎥',
      documents: '📄',
      other: '📎'
    };
    return icons[category] || '📎';
  }

  function normalizeFileRecord(file) {
    if (!file) return null;
    const normalized = { ...file };
    normalized.category = normalized.category || getFileCategory(normalized.type || normalized.name);
    normalized.uploadedAt = normalized.uploadedAt || normalized.created_at || new Date().toISOString();
    if (typeof normalized.isFavorite !== 'boolean') {
      normalized.isFavorite = false;
    }
    return normalized;
  }

  function isRecent(uploadedAt, days = RECENT_DAYS) {
    if (!uploadedAt) return false;
    const date = new Date(uploadedAt);
    if (Number.isNaN(date.getTime())) return false;
    const threshold = days * 24 * 60 * 60 * 1000;
    return (Date.now() - date.getTime()) <= threshold;
  }

  function canUpload() {
    if (!currentRole) return false;
    // Viewer cannot upload
    return currentRole !== 'viewer';
  }

  function canDelete() {
    if (!currentRole) return false;
    // Only Editor, Admin, Owner can delete
    return ['editor', 'admin', 'owner'].includes(currentRole);
  }

  function canRename() {
    if (!currentRole) return false;
    // Only Editor, Admin, Owner can rename
    return ['editor', 'admin', 'owner'].includes(currentRole);
  }

  // ===============================
  // Storage & Billing Integration
  // ===============================

  async function calculateTotalStorage() {
    let totalBytes = 0;
    allFiles.forEach(file => {
      totalBytes += file.size || 0;
    });
    return totalBytes;
  }

  async function updateStorageWidget() {
    const widget = document.getElementById('storage-usage-widget');
    if (!widget) return;

    try {
      const totalStorage = await calculateTotalStorage();
      const subscription = await window.UBA.billing.getCurrentSubscription();
      const plan = window.UBA.billing.PLAN_CATALOG[subscription.planId];
      
      if (!plan) {
        warn('Plan not found for:', subscription.planId);
        return;
      }
      
      const maxStorage = plan.limits.maxStorage;
      const percentage = (totalStorage / maxStorage) * 100;
      
      let statusClass = 'normal';
      if (percentage >= 90) statusClass = 'critical';
      else if (percentage >= 75) statusClass = 'warning';
      
      widget.innerHTML = `
        <div class="storage-bar">
          <div class="storage-fill storage-${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
        <div class="storage-text">${formatFileSize(totalStorage)} / ${formatFileSize(maxStorage)}</div>
      `;
    } catch (error) {
      warn('Error updating storage widget:', error);
    }
  }

  async function checkStorageLimit(additionalBytes) {
    try {
      const totalStorage = await calculateTotalStorage();
      const newTotal = totalStorage + additionalBytes;
      
      const check = await window.UBA.billing.checkLimits('storage', additionalBytes);
      
      if (!check.allowed) {
        window.UBA.billing.showPaywall({
          entityType: 'storage',
          current: totalStorage,
          limit: check.limit,
          reason: 'Storage limit reached'
        });
        return false;
      }
      
      return true;
    } catch (error) {
      warn('Error checking storage limit:', error);
      return true; // Fail open in local mode
    }
  }

  async function trackStorageUsage(bytes) {
    try {
      await window.UBA.billing.trackUsage('storage', bytes);
      await updateStorageWidget();
    } catch (error) {
      warn('Error tracking storage usage:', error);
    }
  }

  // ===============================
  // Data Operations
  // ===============================

  async function loadFiles() {
    try {
      const files = await window.UBA.data.list('files');
      allFiles = (files || []).map(normalizeFileRecord).filter(Boolean);
      log('Loaded files:', allFiles.length);
      return allFiles;
    } catch (error) {
      warn('Error loading files:', error);
      allFiles = [];
      return [];
    }
  }

  async function saveFile(fileData) {
    try {
      const newFile = await window.UBA.data.create('files', fileData);
      log('File saved:', newFile.id);
      return newFile;
    } catch (error) {
      warn('Error saving file:', error);
      throw error;
    }
  }

  async function updateFile(fileId, updates) {
    try {
      const updated = await window.UBA.data.update('files', fileId, updates);
      log('File updated:', fileId);
      return updated;
    } catch (error) {
      warn('Error updating file:', error);
      throw error;
    }
  }

  async function deleteFile(fileId) {
    try {
      // Find file to get size for storage tracking
      const file = allFiles.find(f => f.id === fileId);
      await window.UBA.data.remove('files', fileId);
      
      // Track storage decrease
      if (file && file.size) {
        await trackStorageUsage(-file.size);
      }
      
      log('File deleted:', fileId);
      return true;
    } catch (error) {
      warn('Error deleting file:', error);
      throw error;
    }
  }

  // ===============================
  // File Processing
  // ===============================

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function processAndUploadFiles(files) {
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    uploadProgress.style.display = 'block';
    
    const uploadedFiles = [];
    const total = files.length;
    
    for (let i = 0; i < total; i++) {
      const file = files[i];
      const progress = ((i + 1) / total) * 100;
      
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `Uploading ${i + 1} of ${total}...`;
      
      try {
        // Check storage limit before processing
        const canUploadFile = await checkStorageLimit(file.size);
        if (!canUploadFile) {
          showNotification(`Storage limit reached. Cannot upload ${file.name}`, 'error');
          continue;
        }
        
        // Read file content as base64
        const contentBase64 = await readFileAsBase64(file);
        
        // Create file data object
        const fileData = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          contentBase64: contentBase64,
          category: getFileCategory(file.type),
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.id || 'unknown',
          isFavorite: false
        };
        
        // Save to data layer
        const saved = await saveFile(fileData);
        uploadedFiles.push(saved);
        
        // Track storage usage
        await trackStorageUsage(file.size);
        
      } catch (error) {
        warn('Error processing file:', file.name, error);
        showNotification(`Failed to upload ${file.name}`, 'error');
      }
    }
    
    uploadProgress.style.display = 'none';
    return uploadedFiles;
  }

  // ===============================
  // UI Rendering
  // ===============================

  function applyFilters() {
    let results = [...allFiles];
    
    // Apply category filter
    if (currentCategory !== 'all') {
      results = results.filter(file => file.category === currentCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }

    // Apply smart filters
    switch (currentSmartFilter) {
      case 'recent':
        results = results.filter(file => isRecent(file.uploadedAt, RECENT_DAYS));
        break;
      case 'large':
        results = results.filter(file => (file.size || 0) >= LARGE_FILE_THRESHOLD);
        break;
      case 'favorite':
        results = results.filter(file => file.isFavorite);
        break;
      default:
        break;
    }
    
    // Apply sorting
    results.sort((a, b) => {
      switch (currentSort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        case 'date-desc':
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        case 'size-asc':
          return (a.size || 0) - (b.size || 0);
        case 'size-desc':
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });
    
    filteredFiles = results;
    return results;
  }

  function updateCategoryCounts() {
    const counts = {
      all: allFiles.length,
      images: 0,
      documents: 0,
      pdfs: 0,
      videos: 0,
      other: 0
    };
    
    allFiles.forEach(file => {
      const category = file.category || 'other';
      if (counts.hasOwnProperty(category)) {
        counts[category]++;
      }
    });
    
    Object.keys(counts).forEach(category => {
      const countEl = document.getElementById(`count-${category}`);
      if (countEl) {
        countEl.textContent = counts[category];
      }
    });
    
    // Update files count
    const filesCount = document.getElementById('files-count');
    if (filesCount) {
      filesCount.textContent = `${allFiles.length} file${allFiles.length !== 1 ? 's' : ''}`;
    }
  }

  function updateHeroStats() {
    const totalEl = document.getElementById('files-stat-total');
    const recentEl = document.getElementById('files-stat-recent');
    const imagesEl = document.getElementById('files-stat-images');

    if (totalEl) {
      totalEl.textContent = allFiles.length.toLocaleString();
    }
    if (recentEl) {
      const recentCount = allFiles.filter(file => isRecent(file.uploadedAt, RECENT_DAYS)).length;
      recentEl.textContent = recentCount.toLocaleString();
    }
    if (imagesEl) {
      const imageCount = allFiles.filter(file => file.category === 'images').length;
      imagesEl.textContent = imageCount.toLocaleString();
    }
  }

  function renderFileCard(file) {
    const canEdit = canRename();
    const canRemove = canDelete();
    const favoriteClass = file.isFavorite ? 'active' : '';
    
    return `
      <div class="file-card" data-file-id="${file.id}">
        <button class="file-favorite-btn ${favoriteClass}" type="button" title="Toggle favorite" onclick="window.FilesManager.toggleFavorite('${file.id}', event)">★</button>
        <div class="file-card-preview" onclick="window.FilesManager.openPreview('${file.id}')">
          ${file.category === 'images' ? 
            `<img src="${file.contentBase64}" alt="${file.name}" class="file-thumbnail">` :
            `<div class="file-icon-large">${getFileIcon(file.type)}</div>`
          }
        </div>
        <div class="file-card-info">
          <div class="file-card-name" title="${file.name}">${file.name}</div>
          <div class="file-card-meta">
            <span>${formatFileSize(file.size || 0)}</span>
            <span>•</span>
            <span>${formatDate(file.uploadedAt)}</span>
          </div>
        </div>
        <div class="file-card-actions">
          <button class="file-action-btn" onclick="window.FilesManager.openPreview('${file.id}')" title="Preview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="file-action-btn" onclick="window.FilesManager.downloadFile('${file.id}')" title="Download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          ${canEdit ? `
            <button class="file-action-btn" onclick="window.FilesManager.openRename('${file.id}')" title="Rename">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          ` : ''}
          ${canRemove ? `
            <button class="file-action-btn file-action-delete" onclick="window.FilesManager.confirmDelete('${file.id}')" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderFiles() {
    const files = applyFilters();
    const grid = document.getElementById('files-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!grid) return;
    grid.dataset.view = currentViewMode;

    if (files.length === 0) {
      grid.innerHTML = '';
      grid.hidden = true;
      if (emptyState) emptyState.style.display = 'flex';
    } else {
      grid.hidden = false;
      if (emptyState) emptyState.style.display = 'none';
      grid.innerHTML = files.map(file => renderFileCard(file)).join('');
    }
    
    updateCategoryCounts();
    updateHeroStats();
  }

  // ===============================
  // File Operations
  // ===============================

  function downloadFile(fileId) {
    try {
      const file = allFiles.find(f => f.id === fileId);
      if (!file) {
        showNotification('File not found', 'error');
        return;
      }
      
      // Convert base64 to blob
      const base64Data = file.contentBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification('File downloaded', 'success');
    } catch (error) {
      warn('Error downloading file:', error);
      showNotification('Failed to download file', 'error');
    }
  }

  function openPreview(fileId) {
    const file = allFiles.find(f => f.id === fileId);
    if (!file) return;
    
    const modal = document.getElementById('preview-modal');
    const fileName = document.getElementById('preview-file-name');
    const content = document.getElementById('preview-content');
    const downloadBtn = document.getElementById('preview-download-btn');
    
    if (!modal || !content) return;
    
    fileName.textContent = file.name;
    
    // Render preview based on file type
    const category = file.category;
    let previewHTML = '';
    
    if (category === 'images') {
      // Validate image type before preview
      if (file.type && file.type.startsWith('image/')) {
        previewHTML = `<img src="${file.contentBase64}" alt="${file.name}" class="preview-image">`;
      } else {
        previewHTML = `<div class="preview-unsupported"><p>Invalid image file</p></div>`;
      }
    } else if (category === 'pdfs') {
      // Validate PDF type before preview
      if (file.type === 'application/pdf') {
        previewHTML = `
          <div class="preview-pdf">
            <iframe src="${file.contentBase64}" class="preview-iframe" sandbox="allow-same-origin"></iframe>
          </div>
        `;
      } else {
        previewHTML = `<div class="preview-unsupported"><p>Invalid PDF file</p></div>`;
      }
    } else if (category === 'videos') {
      // Validate video type before preview
      if (file.type && file.type.startsWith('video/')) {
        previewHTML = `
          <video controls class="preview-video">
            <source src="${file.contentBase64}" type="${file.type}">
            Your browser does not support video playback.
          </video>
        `;
      } else {
        previewHTML = `<div class="preview-unsupported"><p>Invalid video file</p></div>`;
      }
    } else {
      previewHTML = `
        <div class="preview-unsupported">
          <div class="preview-icon">${getFileIcon(file.type)}</div>
          <h3>${file.name}</h3>
          <p>${formatFileSize(file.size)}</p>
          <p class="preview-note">Preview not available for this file type</p>
          <button class="uba-btn-primary" onclick="window.FilesManager.downloadFile('${file.id}')">Download File</button>
        </div>
      `;
    }
    
    content.innerHTML = previewHTML;
    
    // Set download button handler
    downloadBtn.onclick = () => downloadFile(fileId);
    
    modal.style.display = 'flex';
  }

  function closePreview() {
    const modal = document.getElementById('preview-modal');
    if (modal) modal.style.display = 'none';
  }

  function openRename(fileId) {
    if (!canRename()) {
      showNotification('You do not have permission to rename files', 'error');
      return;
    }
    
    const file = allFiles.find(f => f.id === fileId);
    if (!file) return;
    
    renameFileId = fileId;
    const modal = document.getElementById('rename-modal');
    const input = document.getElementById('rename-input');
    
    if (!modal || !input) return;
    
    input.value = file.name;
    modal.style.display = 'flex';
    input.focus();
    input.select();
  }

  function closeRename() {
    const modal = document.getElementById('rename-modal');
    if (modal) modal.style.display = 'none';
    renameFileId = null;
  }

  async function saveRename() {
    if (!renameFileId) return;
    
    const input = document.getElementById('rename-input');
    const newName = input.value.trim();
    
    if (!newName) {
      showNotification('Please enter a file name', 'error');
      return;
    }
    
    try {
      await updateFile(renameFileId, { name: newName });
      await loadFiles();
      renderFiles();
      closeRename();
      showNotification('File renamed successfully', 'success');
    } catch (error) {
      warn('Error renaming file:', error);
      showNotification('Failed to rename file', 'error');
    }
  }

  async function confirmDelete(fileId) {
    if (!canDelete()) {
      showNotification('You do not have permission to delete files', 'error');
      return;
    }
    
    const file = allFiles.find(f => f.id === fileId);
    if (!file) return;
    
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }
    
    try {
      await deleteFile(fileId);
      await loadFiles();
      renderFiles();
      showNotification('File deleted successfully', 'success');
    } catch (error) {
      warn('Error deleting file:', error);
      showNotification('Failed to delete file', 'error');
    }
  }

  // ===============================
  // Event Handlers
  // ===============================

  function handleFileSelection(files) {
    if (files.length === 0) return;
    
    if (!canUpload()) {
      showNotification('You do not have permission to upload files', 'error');
      return;
    }
    
    processAndUploadFiles(Array.from(files)).then(uploadedFiles => {
      if (uploadedFiles.length > 0) {
        loadFiles().then(() => {
          renderFiles();
          showNotification(`Successfully uploaded ${uploadedFiles.length} file(s)`, 'success');
        });
      }
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    handleFileSelection(files);
  }

  function handleCategoryClick(category) {
    currentCategory = category;
    
    // Update active state
    document.querySelectorAll('.files-category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
    
    renderFiles();
  }

  function handleSearch(query) {
    searchQuery = query;
    renderFiles();
  }

  function handleSort(sortValue) {
    currentSort = sortValue;
    renderFiles();
  }

  function setActiveSmartFilter(filter) {
    document.querySelectorAll('[data-smart-filter]').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-smart-filter') === filter);
    });
  }

  function handleSmartFilter(filter) {
    currentSmartFilter = filter;
    setActiveSmartFilter(filter);
    renderFiles();
  }

  function handleViewToggle(viewMode) {
    currentViewMode = viewMode;
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view-mode') === viewMode);
    });
    renderFiles();
  }

  async function handleRefreshFiles() {
    const refreshBtn = document.getElementById('refresh-files-btn');
    const originalLabel = refreshBtn ? refreshBtn.textContent : '';
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
    }
    
    try {
      await loadFiles();
      renderFiles();
      await updateStorageWidget();
      showNotification('Files refreshed');
    } catch (error) {
      warn('Error refreshing files:', error);
      showNotification('Unable to refresh files', 'error');
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalLabel || 'Refresh';
      }
    }
  }

  async function toggleFavorite(fileId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const file = allFiles.find(f => f.id === fileId);
    if (!file) return;

    const nextValue = !file.isFavorite;
    file.isFavorite = nextValue;
    renderFiles();

    try {
      await updateFile(fileId, { isFavorite: nextValue });
      showNotification(nextValue ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      file.isFavorite = !nextValue;
      renderFiles();
      warn('Favorite toggle failed:', error);
      showNotification('Could not update favorite', 'error');
    }
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `files-notification files-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 500;
      background: ${type === 'success' ? '#10b981' : '#dc2626'};
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // ===============================
  // Initialization
  // ===============================

  let initRetryCount = 0;
  const MAX_INIT_RETRIES = 50; // 5 seconds max wait time

  async function init() {
    log('Initializing Files Manager');
    
    try {
      // Wait for UBA to be ready
      if (!window.UBA || !window.UBA.data || !window.UBA.billing) {
        initRetryCount++;
        if (initRetryCount >= MAX_INIT_RETRIES) {
          warn('Failed to initialize Files Manager: UBA dependencies not available after', MAX_INIT_RETRIES, 'retries');
          return;
        }
        warn('UBA not ready, retrying...', initRetryCount, '/', MAX_INIT_RETRIES);
        setTimeout(init, 100);
        return;
      }
      
      // Get current user and role
      if (window.UBA && window.UBA.auth && typeof window.UBA.auth.getCurrentUser === 'function') {
        currentUser = window.UBA.auth.getCurrentUser();
      }
      
      if (window.Members && typeof window.Members.getCurrentUserRole === 'function') {
        currentRole = window.Members.getCurrentUserRole();
      }
      
      // Load files
      await loadFiles();
      renderFiles();
      await updateStorageWidget();
      
      // Set up file input
      const fileInput = document.getElementById('file-input');
      const uploadBtn = document.getElementById('upload-btn');
      const uploadArea = document.getElementById('upload-area');
      
      if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
          if (!canUpload()) {
            showNotification('You do not have permission to upload files', 'error');
            return;
          }
          fileInput.click();
        });
      }
      
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          handleFileSelection(e.target.files);
          e.target.value = ''; // Reset
        });
      }
      
      // Set up drag and drop
      if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
      }
      
      // Set up category buttons
      document.querySelectorAll('.files-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const category = btn.getAttribute('data-category');
          handleCategoryClick(category);
        });
      });
      
      // Set up search
      const searchInput = document.getElementById('search-files');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
      }
      
      // Set up sort
      const sortSelect = document.getElementById('sort-files');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => handleSort(e.target.value));
      }

      // Smart filters
      document.querySelectorAll('[data-smart-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
          const filter = chip.getAttribute('data-smart-filter');
          handleSmartFilter(filter);
        });
      });
      setActiveSmartFilter(currentSmartFilter);

      // View toggle
      document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-view-mode');
          handleViewToggle(mode);
        });
      });

      // Manual refresh
      const refreshFilesBtn = document.getElementById('refresh-files-btn');
      if (refreshFilesBtn) {
        refreshFilesBtn.addEventListener('click', handleRefreshFiles);
      }
      
      // Set up preview modal
      const previewCloseBtn = document.getElementById('preview-close-btn');
      const previewModal = document.getElementById('preview-modal');
      if (previewCloseBtn) {
        previewCloseBtn.addEventListener('click', closePreview);
      }
      if (previewModal) {
        previewModal.querySelector('.files-modal-overlay')?.addEventListener('click', closePreview);
      }
      
      // Set up rename modal
      const renameCloseBtn = document.getElementById('rename-close-btn');
      const renameCancelBtn = document.getElementById('rename-cancel-btn');
      const renameSaveBtn = document.getElementById('rename-save-btn');
      const renameModal = document.getElementById('rename-modal');
      const renameInput = document.getElementById('rename-input');
      
      if (renameCloseBtn) renameCloseBtn.addEventListener('click', closeRename);
      if (renameCancelBtn) renameCancelBtn.addEventListener('click', closeRename);
      if (renameSaveBtn) renameSaveBtn.addEventListener('click', saveRename);
      if (renameModal) {
        renameModal.querySelector('.files-modal-overlay')?.addEventListener('click', closeRename);
      }
      if (renameInput) {
        renameInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') saveRename();
        });
      }
      
      // Hide upload section if viewer
      if (!canUpload()) {
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
          uploadSection.style.display = 'none';
        }
      }
      
      log('Files Manager initialized');
    } catch (error) {
      warn('Error initializing Files Manager:', error);
    }
  }

  // ===============================
  // Public API
  // ===============================

  window.FilesManager = {
    init,
    loadFiles,
    renderFiles,
    downloadFile,
    openPreview,
    closePreview,
    openRename,
    closeRename,
    saveRename,
    confirmDelete,
    toggleFavorite
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  log('Files module loaded');
})();
