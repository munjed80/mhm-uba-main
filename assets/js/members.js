// members.js — Workspace Members & Roles Management for MHM UBA
// Provides complete member invitation, role management, and permission enforcement
(function () {
  'use strict';

  // Role definitions with permissions
  const ROLES = {
    owner: {
      name: 'Owner',
      permissions: {
        manageMembers: true,
        manageWorkspace: true,
        deleteWorkspace: true,
        manageSettings: true,
        manageClients: true,
        manageTasks: true,
        manageInvoices: true,
        manageExpenses: true,
        manageAutomations: true,
        manageFiles: true,
        manageProjects: true,
        manageLeads: true,
        viewReports: true,
        createData: true,
        editData: true,
        deleteData: true,
        viewData: true
      }
    },
    admin: {
      name: 'Admin',
      permissions: {
        manageMembers: true,
        manageWorkspace: false,
        deleteWorkspace: false,
        manageSettings: true,
        manageClients: true,
        manageTasks: true,
        manageInvoices: true,
        manageExpenses: true,
        manageAutomations: true,
        manageFiles: true,
        manageProjects: true,
        manageLeads: true,
        viewReports: true,
        createData: true,
        editData: true,
        deleteData: true,
        viewData: true
      }
    },
    editor: {
      name: 'Editor',
      permissions: {
        manageMembers: false,
        manageWorkspace: false,
        deleteWorkspace: false,
        manageSettings: false,
        manageClients: true,
        manageTasks: true,
        manageInvoices: true,
        manageExpenses: true,
        manageAutomations: false,
        manageFiles: true,
        manageProjects: true,
        manageLeads: true,
        viewReports: true,
        createData: true,
        editData: true,
        deleteData: true,
        viewData: true
      }
    },
    viewer: {
      name: 'Viewer',
      permissions: {
        manageMembers: false,
        manageWorkspace: false,
        deleteWorkspace: false,
        manageSettings: false,
        manageClients: false,
        manageTasks: false,
        manageInvoices: false,
        manageExpenses: false,
        manageAutomations: false,
        manageFiles: false,
        manageProjects: false,
        manageLeads: false,
        viewReports: true,
        createData: false,
        editData: false,
        deleteData: false,
        viewData: true
      }
    }
  };

  // State
  let currentWorkspace = null;
  let currentUser = null;
  let workspaceMembers = [];

  // ===============================
  // Utilities
  // ===============================

  function log(...args) {
    console.log('[Members]', ...args);
  }

  function warn(...args) {
    console.warn('[Members]', ...args);
  }

  function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('members-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `uba-settings-status uba-status-${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  function generateId(prefix = 'member') {
    if (window.crypto && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  // ===============================
  // Member Management
  // ===============================

  async function getWorkspaceMembers(workspaceId) {
    try {
      if (!workspaceId) {
        warn('No workspace ID provided');
        return [];
      }

      // Get workspace data
      const workspace = await window.UBA.workspace.get(workspaceId);
      if (!workspace) {
        warn('Workspace not found:', workspaceId);
        return [];
      }

      // Return members array (default to empty if not exists)
      return workspace.members || [];
    } catch (error) {
      warn('Error getting workspace members:', error);
      return [];
    }
  }

  async function saveWorkspaceMembers(workspaceId, members) {
    try {
      if (!workspaceId || !members) {
        warn('Invalid workspace ID or members');
        return false;
      }

      // Update workspace with new members list
      await window.UBA.workspace.update(workspaceId, {
        members: members
      });

      log('Workspace members saved:', members.length);
      return true;
    } catch (error) {
      warn('Error saving workspace members:', error);
      return false;
    }
  }

  async function inviteMember(email, name, role = 'editor') {
    try {
      // Validation
      if (!email || !email.includes('@')) {
        showStatus('Please enter a valid email address', 'error');
        return null;
      }

      if (!ROLES[role]) {
        showStatus('Invalid role specified', 'error');
        return null;
      }

      // Get current workspace
      currentWorkspace = window.UBA.workspace.getCurrent();
      if (!currentWorkspace) {
        showStatus('No active workspace', 'error');
        return null;
      }

      // Get current members
      const members = await getWorkspaceMembers(currentWorkspace.id);

      // Check if member already exists
      const existingMember = members.find(m => m.email.toLowerCase() === email.toLowerCase());
      if (existingMember) {
        showStatus('This user is already a member of this workspace', 'error');
        return null;
      }

      // Create new member
      const newMember = {
        id: generateId('member'),
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split('@')[0],
        role: role,
        status: 'pending', // pending or active
        joinedAt: nowISO(),
        invitedBy: currentUser?.id || 'unknown'
      };

      // Add to members list
      members.push(newMember);

      // Save to workspace
      await saveWorkspaceMembers(currentWorkspace.id, members);

      log('Member invited:', newMember);
      showStatus(`Invitation sent to ${email}`, 'success');

      return newMember;
    } catch (error) {
      warn('Error inviting member:', error);
      showStatus('Failed to invite member', 'error');
      return null;
    }
  }

  async function updateMemberRole(memberId, newRole) {
    try {
      if (!ROLES[newRole]) {
        showStatus('Invalid role', 'error');
        return false;
      }

      currentWorkspace = window.UBA.workspace.getCurrent();
      if (!currentWorkspace) return false;

      const members = await getWorkspaceMembers(currentWorkspace.id);
      const memberIndex = members.findIndex(m => m.id === memberId);

      if (memberIndex === -1) {
        showStatus('Member not found', 'error');
        return false;
      }

      // Prevent changing owner role
      if (members[memberIndex].role === 'owner') {
        showStatus('Cannot change owner role', 'error');
        return false;
      }

      // Update role
      members[memberIndex].role = newRole;
      members[memberIndex].updatedAt = nowISO();

      await saveWorkspaceMembers(currentWorkspace.id, members);

      log('Member role updated:', memberId, newRole);
      showStatus(`Role updated to ${ROLES[newRole].name}`, 'success');

      return true;
    } catch (error) {
      warn('Error updating member role:', error);
      showStatus('Failed to update role', 'error');
      return false;
    }
  }

  async function removeMember(memberId) {
    try {
      currentWorkspace = window.UBA.workspace.getCurrent();
      if (!currentWorkspace) return false;

      const members = await getWorkspaceMembers(currentWorkspace.id);
      const member = members.find(m => m.id === memberId);

      if (!member) {
        showStatus('Member not found', 'error');
        return false;
      }

      // Prevent removing owner
      if (member.role === 'owner') {
        showStatus('Cannot remove workspace owner', 'error');
        return false;
      }

      // Confirm removal
      const confirmed = confirm(`Are you sure you want to remove ${member.name || member.email} from this workspace?`);
      if (!confirmed) return false;

      // Remove member
      const updatedMembers = members.filter(m => m.id !== memberId);
      await saveWorkspaceMembers(currentWorkspace.id, updatedMembers);

      log('Member removed:', memberId);
      showStatus(`${member.name || member.email} removed from workspace`, 'success');

      return true;
    } catch (error) {
      warn('Error removing member:', error);
      showStatus('Failed to remove member', 'error');
      return false;
    }
  }

  async function resendInvitation(memberId) {
    try {
      currentWorkspace = window.UBA.workspace.getCurrent();
      if (!currentWorkspace) return false;

      const members = await getWorkspaceMembers(currentWorkspace.id);
      const member = members.find(m => m.id === memberId);

      if (!member) {
        showStatus('Member not found', 'error');
        return false;
      }

      // In local mode, just show success message
      log('Invitation resent (mock):', member.email);
      showStatus(`Invitation resent to ${member.email}`, 'success');

      return true;
    } catch (error) {
      warn('Error resending invitation:', error);
      showStatus('Failed to resend invitation', 'error');
      return false;
    }
  }

  // ===============================
  // Permission Checking
  // ===============================

  function hasPermission(permission) {
    if (!currentUser) return false;

    // Get current user's role in workspace
    const userMember = workspaceMembers.find(m => m.email === currentUser.email);
    if (!userMember) {
      // If user not in members list, check if they're the owner
      if (currentWorkspace && currentWorkspace.ownerUserId === currentUser.id) {
        return ROLES.owner.permissions[permission] || false;
      }
      return false;
    }

    const role = ROLES[userMember.role];
    if (!role) return false;

    return role.permissions[permission] || false;
  }

  function getCurrentUserRole() {
    if (!currentUser || !currentWorkspace) return null;

    // Check if user is workspace owner
    if (currentWorkspace.ownerUserId === currentUser.id) {
      return 'owner';
    }

    // Find user in members list
    const userMember = workspaceMembers.find(m => m.email === currentUser.email);
    return userMember ? userMember.role : null;
  }

  function canManageMembers() {
    return hasPermission('manageMembers');
  }

  function canAccessSettings() {
    return hasPermission('manageSettings');
  }

  // ===============================
  // UI Rendering
  // ===============================

  async function renderMembersList() {
    const container = document.getElementById('members-list-container');
    if (!container) return;

    try {
      currentWorkspace = window.UBA.workspace.getCurrent();
      currentUser = window.UBA.auth?.getCurrentUser();

      if (!currentWorkspace) {
        container.innerHTML = '<p style="color: var(--muted);">No active workspace</p>';
        return;
      }

      workspaceMembers = await getWorkspaceMembers(currentWorkspace.id);

      // Add owner if not in members list
      const ownerInMembers = workspaceMembers.find(m => m.role === 'owner');
      if (!ownerInMembers && currentWorkspace.ownerUserId) {
        // Find owner user
        const ownerUser = await window.UBA.auth.getUser?.(currentWorkspace.ownerUserId) || currentUser;
        workspaceMembers.unshift({
          id: `owner-${currentWorkspace.ownerUserId}`,
          email: ownerUser?.email || 'owner@workspace',
          name: ownerUser?.name || 'Workspace Owner',
          role: 'owner',
          status: 'active',
          joinedAt: currentWorkspace.createdAt || nowISO()
        });
      }

      if (workspaceMembers.length === 0) {
        container.innerHTML = '<p style="color: var(--muted);">No members yet. Invite team members to collaborate.</p>';
        return;
      }

      const currentUserRole = getCurrentUserRole();
      const canManage = canManageMembers();

      container.innerHTML = workspaceMembers.map(member => {
        const roleInfo = ROLES[member.role] || { name: member.role };
        const isCurrentUser = member.email === currentUser?.email;
        const canEdit = canManage && member.role !== 'owner' && !isCurrentUser;

        return `
          <div class="member-item ${member.status === 'pending' ? 'pending' : ''}">
            <div class="member-avatar">
              ${member.name ? member.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div class="member-info">
              <div class="member-name">
                ${escapeHtml(member.name || member.email)}
                ${isCurrentUser ? '<span class="member-badge-you">You</span>' : ''}
              </div>
              <div class="member-email">${escapeHtml(member.email)}</div>
              <div class="member-meta">
                <span class="member-role-badge role-${member.role}">${roleInfo.name}</span>
                ${member.status === 'pending' ? '<span class="member-status-badge">Pending</span>' : ''}
                <span class="member-joined">Joined ${formatDate(member.joinedAt)}</span>
              </div>
            </div>
            <div class="member-actions">
              ${canEdit ? `
                <select class="member-role-select" onchange="window.Members.updateMemberRole('${member.id}', this.value)">
                  <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
                  <option value="editor" ${member.role === 'editor' ? 'selected' : ''}>Editor</option>
                  <option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                </select>
              ` : `
                <span class="member-role-display">${roleInfo.name}</span>
              `}
              ${member.status === 'pending' && canManage ? `
                <button class="uba-btn-sm uba-btn-ghost" onclick="window.Members.resendInvitation('${member.id}')">
                  Resend
                </button>
              ` : ''}
              ${canEdit ? `
                <button class="uba-btn-sm uba-btn-ghost member-remove-btn" onclick="window.Members.removeMember('${member.id}')">
                  Remove
                </button>
              ` : ''}
              <button class="uba-btn-sm uba-btn-ghost" onclick="window.Members.viewPermissions('${member.role}')">
                View Permissions
              </button>
            </div>
          </div>
        `;
      }).join('');

      log('Members list rendered:', workspaceMembers.length, 'members');
    } catch (error) {
      warn('Error rendering members list:', error);
      container.innerHTML = '<p style="color: var(--error);">Failed to load members</p>';
    }
  }

  function viewPermissions(role) {
    const roleInfo = ROLES[role];
    if (!roleInfo) return;

    const permissionsList = Object.entries(roleInfo.permissions)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        const icon = value ? '✅' : '❌';
        return `${icon} ${label}`;
      })
      .join('\n');

    alert(`Permissions for ${roleInfo.name}:\n\n${permissionsList}`);
  }

  function formatDate(isoString) {
    if (!isoString) return 'Unknown';
    
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===============================
  // Event Handlers
  // ===============================

  function attachEventHandlers() {
    // Invite member button
    const inviteBtn = document.getElementById('invite-member-btn');
    if (inviteBtn) {
      inviteBtn.addEventListener('click', async () => {
        const email = document.getElementById('invite-email')?.value.trim();
        const name = document.getElementById('invite-name')?.value.trim();
        const role = document.getElementById('invite-role')?.value || 'editor';

        if (!email) {
          showStatus('Please enter an email address', 'error');
          return;
        }

        const newMember = await inviteMember(email, name, role);
        if (newMember) {
          // Clear form
          if (document.getElementById('invite-email')) document.getElementById('invite-email').value = '';
          if (document.getElementById('invite-name')) document.getElementById('invite-name').value = '';
          if (document.getElementById('invite-role')) document.getElementById('invite-role').value = 'editor';

          // Refresh list
          await renderMembersList();
        }
      });
    }

    log('Event handlers attached');
  }

  // ===============================
  // Permission Enforcement
  // ===============================

  function enforceUIPermissions() {
    currentUser = window.UBA.auth?.getCurrentUser();
    currentWorkspace = window.UBA.workspace.getCurrent();

    if (!currentUser || !currentWorkspace) return;

    const role = getCurrentUserRole();
    if (!role) return;

    log('Enforcing UI permissions for role:', role);

    // Hide/disable elements based on permissions
    const permissionMap = {
      '.settings-section': 'manageSettings',
      '.workspace-delete-btn': 'deleteWorkspace',
      '.automation-section': 'manageAutomations',
      '.client-create-btn': 'createData',
      '.task-create-btn': 'createData',
      '.invoice-create-btn': 'createData'
    };

    Object.entries(permissionMap).forEach(([selector, permission]) => {
      const elements = document.querySelectorAll(selector);
      const hasAccess = hasPermission(permission);

      elements.forEach(el => {
        if (!hasAccess) {
          el.style.display = 'none';
          el.setAttribute('data-permission-denied', permission);
        }
      });
    });

    // Show role badge in header if not owner
    if (role !== 'owner') {
      const userLabel = document.getElementById('uba-user-label');
      if (userLabel && !userLabel.querySelector('.role-badge')) {
        const badge = document.createElement('span');
        badge.className = 'role-badge';
        badge.textContent = ROLES[role]?.name || role;
        badge.style.cssText = 'font-size: 11px; padding: 2px 6px; background: var(--accent); color: var(--bg); border-radius: 4px; margin-left: 6px;';
        userLabel.appendChild(badge);
      }
    }
  }

  // ===============================
  // Initialization
  // ===============================

  async function init() {
    log('Initializing Members module');

    try {
      // Wait for UBA to be ready
      if (!window.UBA || !window.UBA.workspace || !window.UBA.auth) {
        warn('UBA not ready, retrying...');
        setTimeout(init, 100);
        return;
      }

      currentWorkspace = window.UBA.workspace.getCurrent();
      currentUser = window.UBA.auth.getCurrentUser();

      // Render members list if container exists
      if (document.getElementById('members-list-container')) {
        await renderMembersList();
      }

      // Attach event handlers
      attachEventHandlers();

      // Enforce permissions on current page
      enforceUIPermissions();

      log('Members module initialized');
    } catch (error) {
      warn('Error initializing Members module:', error);
    }
  }

  // ===============================
  // Public API
  // ===============================

  window.Members = {
    init,
    inviteMember,
    updateMemberRole,
    removeMember,
    resendInvitation,
    viewPermissions,
    getWorkspaceMembers,
    hasPermission,
    getCurrentUserRole,
    canManageMembers,
    canAccessSettings,
    enforceUIPermissions,
    renderMembersList,
    ROLES
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  log('Members module loaded');
})();
