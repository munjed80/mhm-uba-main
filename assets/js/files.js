// files.js — comprehensive local file manager
(function () {
  
  // File management utilities
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileType(mimeType) {
    if (!mimeType) return 'other';
    const mainType = mimeType.split('/')[0];
    return ['image', 'audio', 'video', 'text', 'application'].includes(mainType) 
      ? mainType 
      : 'document';
  }

  function getFileIcon(mimeType) {
    const type = getFileType(mimeType);
    const iconMap = {
      image: '🖼️',
      audio: '🎵',
      video: '🎥',
      text: '📝',
      application: '📋',
      document: '📄',
      other: '📎'
    };
    return iconMap[type] || '📎';
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // File storage functions
  function saveFileToStore(fileData) {
    const store = window.ubaStore;
    if (store && store.files && typeof store.files.create === 'function') {
      return store.files.create(fileData);
    }
    return null;
  }

  function getAllFiles() {
    const store = window.ubaStore;
    if (store && store.files && typeof store.files.getAll === 'function') {
      return store.files.getAll();
    }
    return [];
  }

  function deleteFile(fileId) {
    const store = window.ubaStore;
    if (store && store.files && typeof store.files.delete === 'function') {
      store.files.delete(fileId);
      return true;
    }
    return false;
  }

  // File processing functions
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function processFiles(files) {
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    uploadProgress.style.display = 'block';
    
    const processedFiles = [];
    const total = files.length;
    
    for (let i = 0; i < total; i++) {
      const file = files[i];
      const progress = ((i + 1) / total) * 100;
      
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `Processing ${i + 1} of ${total}...`;
      
      try {
        // Read file content as base64
        const content = await readFileAsBase64(file);
        
        // Create file data object
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          mimeType: file.type,
          content: content,
          uploadedAt: Date.now(),
          lastModified: file.lastModified
        };
        
        // Save to store
        const savedFile = saveFileToStore(fileData);
        if (savedFile) {
          processedFiles.push(savedFile);
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }
    
    uploadProgress.style.display = 'none';
    return processedFiles;
  }

  // Download functionality
  function downloadFile(fileData) {
    try {
      // Create a blob from the base64 content
      const base64Content = fileData.content.split(',')[1];
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileData.type });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileData.name;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  }

  // Render functions
  function renderFilesList(filteredFiles = null) {
    const files = filteredFiles || getAllFiles();
    const table = document.getElementById('files-table');
    const emptyState = document.getElementById('empty-state');
    const filesCount = document.getElementById('files-count');
    
    // Update count
    if (filesCount) {
      filesCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;
    }
    
    if (files.length === 0) {
      table.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    table.innerHTML = files.map(file => `
      <tr>
        <td>
          <div class="files-name-cell">
            <span class="files-icon">${getFileIcon(file.mimeType)}</span>
            <span class="files-name">${file.name}</span>
          </div>
        </td>
        <td>${formatFileSize(file.size)}</td>
        <td>
          <span class="files-type-badge">${getFileType(file.mimeType)}</span>
        </td>
        <td>${formatDate(file.uploadedAt)}</td>
        <td>
          <div class="files-actions">
            <button class="uba-btn-link" onclick="downloadFileById('${file.id}')">
              📥 Download
            </button>
            <button class="uba-btn-link files-delete-btn" onclick="confirmDeleteFile('${file.id}')">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function filterFiles() {
    const searchTerm = document.getElementById('search-files').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const allFiles = getAllFiles();
    
    const filtered = allFiles.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm);
      const matchesType = !typeFilter || getFileType(file.mimeType) === typeFilter;
      return matchesSearch && matchesType;
    });
    
    renderFilesList(filtered);
  }

  // Event handlers
  function handleFileSelection(files) {
    if (files.length === 0) return;
    
    processFiles(Array.from(files)).then(processedFiles => {
      if (processedFiles.length > 0) {
        renderFilesList();
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'files-success-message';
        successMsg.textContent = `Successfully uploaded ${processedFiles.length} file(s)`;
        successMsg.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 1000;
          background: var(--good); color: white; padding: 12px 20px;
          border-radius: 8px; font-weight: 500;
        `;
        
        document.body.appendChild(successMsg);
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      }
    });
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('files-drag-over');
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('files-drag-over');
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('files-drag-over');
    
    const files = event.dataTransfer.files;
    handleFileSelection(files);
  }

  // Global functions (needed for onclick handlers)
  window.downloadFileById = function(fileId) {
    const files = getAllFiles();
    const file = files.find(f => f.id === fileId);
    if (file) {
      downloadFile(file);
    }
  };

  window.confirmDeleteFile = function(fileId) {
    const files = getAllFiles();
    const file = files.find(f => f.id === fileId);
    if (file && confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteFile(fileId);
      renderFilesList();
    }
  };

  // Main initialization function
  function initFilesPage() {
    // Initialize store if needed
    const store = window.ubaStore;
    if (store && store.files) {
      // Ensure files collection exists
      store.ensureSeed('files', []);
    }

    // Set up file input
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadArea = document.getElementById('upload-area');
    
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files);
        e.target.value = ''; // Reset input
      });
    }
    
    // Set up drag and drop
    if (uploadArea) {
      uploadArea.addEventListener('dragover', handleDragOver);
      uploadArea.addEventListener('dragleave', handleDragLeave);
      uploadArea.addEventListener('drop', handleDrop);
      uploadArea.addEventListener('click', () => fileInput.click());
    }
    
    // Set up search and filter
    const searchInput = document.getElementById('search-files');
    const typeFilter = document.getElementById('filter-type');
    
    if (searchInput) {
      searchInput.addEventListener('input', filterFiles);
    }
    
    if (typeFilter) {
      typeFilter.addEventListener('change', filterFiles);
    }
    
    // Initial render
    renderFilesList();
  }

  window.initFilesPage = initFilesPage;
})();
