// API_URL is set in config.js (loads before this file)
// This file uses the global API_URL variable

let currentUser = null;
let currentAccessFilter = 'pending';
let allAccessRequests = [];

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initializeDashboard();
    setupEventListeners();
    startSystemClock();
});

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userProfile = localStorage.getItem('userProfile');
    
    if (!token || !userProfile) {
        window.location.href = './connect.html';
        return false;
    }
    
    try {
        const user = JSON.parse(userProfile);
        if (user.user_type !== 'admin') {
            // Redirect to appropriate dashboard based on user type
            if (user.user_type === 'team_member') {
                window.location.href = './team-member.html';
            } else {
                window.location.href = './dashboard.html';
            }
            return false;
        }
    } catch (e) {
        window.location.href = './connect.html';
        return false;
    }
    
    return true;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Initialize Dashboard
async function initializeDashboard() {
    await fetchUserProfile();
    await loadClientsData();
    await loadTeamMembersData();
    await loadAccessRequests();
    await loadActivityLog();
    
    // Set initial section
    switchSection('overview');
}

// System Clock
function startSystemClock() {
    const timeDisplay = document.getElementById('utcTime');
    if (!timeDisplay) return;
    
    setInterval(() => {
        const now = new Date();
        const utcString = now.toUTCString().split(' ')[4];
        timeDisplay.textContent = `UTC: ${utcString}`;
    }, 1000);
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
            currentUser = JSON.parse(userProfile);
            document.getElementById('sidebarName').textContent = currentUser.name || 'Admin';
        }
    } catch (e) {
        console.error('Error parsing user profile:', e);
    }
}

// Load all clients
async function loadClientsData() {
    try {
        const response = await fetch(`${API_URL}/api/users/admin/clients/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const clients = data.clients || [];
        
        const tbody = document.getElementById('clientsTableBody');
        if (clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--muted-color);">No clients found</td></tr>';
            return;
        }
        
        tbody.innerHTML = clients.map(client => `
            <tr>
                <td><strong>${client.name || 'N/A'}</strong></td>
                <td>${client.email || 'N/A'}</td>
                <td><span class="status-badge status-active">Active</span></td>
                <td>${new Date(client.date_joined).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editClient('${client.id}')">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteClient('${client.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Populate assign client select
        const assignSelect = document.getElementById('assignClientSelect');
        assignSelect.innerHTML = '<option value="">-- Select a Client --</option>' + 
            clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading clients:', error);
        document.getElementById('clientsTableBody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Error loading clients</td></tr>';
    }
}

// Load all team members
async function loadTeamMembersData() {
    try {
        const response = await fetch(`${API_URL}/api/users/admin/team-members/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const teamMembers = data.team_members || [];
        
        const tbody = document.getElementById('teamMembersTableBody');
        if (teamMembers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--muted-color);">No team members found</td></tr>';
            return;
        }
        
        tbody.innerHTML = teamMembers.map(member => `
            <tr>
                <td><strong>${member.user?.name || 'N/A'}</strong></td>
                <td>${member.user?.email || 'N/A'}</td>
                <td>${member.department || 'N/A'}</td>
                <td><span class="status-badge ${member.status === 'active' ? 'status-active' : 'status-inactive'}">${member.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="assignClientToTeamMember('${member.id}')">Assign Client</button>
                        <button class="action-btn delete-btn" onclick="deleteTeamMember('${member.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading team members:', error);
        document.getElementById('teamMembersTableBody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Error loading team members</td></tr>';
    }
}

// Load access requests
async function loadAccessRequests() {
    try {
        const response = await fetch(`${API_URL}/api/users/admin/access-requests/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        allAccessRequests = data.access_requests || [];
        
        renderAccessRequests();
    } catch (error) {
        console.error('Error loading access requests:', error);
        document.getElementById('accessRequestsTableBody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Error loading access requests</td></tr>';
    }
}

// Render access requests with filter
function renderAccessRequests() {
    const filtered = allAccessRequests.filter(req => req.status === currentAccessFilter);
    const tbody = document.getElementById('accessRequestsTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--muted-color);">No ${currentAccessFilter} requests found</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(request => `
        <tr>
            <td>${request.team_member?.user?.name || 'N/A'}</td>
            <td>${request.client?.name || 'N/A'}</td>
            <td><span class="status-badge ${request.status === 'pending' ? '' : request.status === 'approved' ? 'status-active' : 'status-inactive'}">${request.status}</span></td>
            <td>${new Date(request.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    ${request.status === 'pending' ? `
                        <button class="action-btn approve-btn" onclick="approveAccessRequest('${request.id}')">Approve</button>
                        <button class="action-btn deny-btn" onclick="denyAccessRequest('${request.id}')">Deny</button>
                    ` : `
                        <button class="action-btn delete-btn" onclick="deleteAccessRequest('${request.id}')">Delete</button>
                    `}
                </td>
            </tr>
    `).join('');
}

// Filter access requests
function filterAccessRequests(status) {
    currentAccessFilter = status;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderAccessRequests();
}

// Load activity log
async function loadActivityLog() {
    try {
        const response = await fetch(`${API_URL}/api/users/admin/activity-log/all/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const logs = data.activity_log || [];
        
        const activityDiv = document.getElementById('activityLog');
        if (logs.length === 0) {
            activityDiv.innerHTML = '<p style="text-align: center; color: var(--muted-color); padding: 40px;">No activity log entries</p>';
            return;
        }
        
        activityDiv.innerHTML = logs.map(log => `
            <div style="padding: 15px; border-bottom: 1px solid var(--border-color); font-size: 14px;">
                <div style="color: var(--text-color); font-weight: 600; margin-bottom: 5px;">
                    ${log.actor?.name || 'Unknown'} - ${log.action}
                </div>
                <div style="color: var(--muted-color); font-size: 12px; margin-bottom: 5px;">
                    Client: ${log.client?.name || 'N/A'}
                </div>
                ${log.changes ? `<div style="color: var(--muted-color); font-size: 12px;">Changes: ${log.changes}</div>` : ''}
                <div style="color: var(--muted-color); font-size: 11px; margin-top: 5px;">
                    ${new Date(log.created_at).toLocaleString()}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activity log:', error);
        document.getElementById('activityLog').innerHTML = 
            '<p style="text-align: center; color: red; padding: 40px;">Error loading activity log</p>';
    }
}

// Section switching
function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    
    // Show selected section
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
        sectionEl.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.section === section) {
            el.classList.add('active');
        }
    });
}

// Event listeners setup
function setupEventListeners() {
    const mobileMenuToggle = document.getElementById('adminMenuToggle') || document.getElementById('dashboardMenuToggle') || document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    let sidebarBackdrop = document.querySelector('.dashboard-sidebar-backdrop');

    if (!sidebarBackdrop) {
        sidebarBackdrop = document.createElement('div');
        sidebarBackdrop.className = 'dashboard-sidebar-backdrop';
        document.body.appendChild(sidebarBackdrop);
    }

    const closeSidebar = () => {
        if (!mobileMenuToggle || !sidebar) return;
        mobileMenuToggle.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        sidebar.classList.remove('open');
        document.body.style.overflow = '';
        document.body.classList.remove('sidebar-open');
        sidebarBackdrop.classList.remove('active');
    };

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            sidebar?.classList.toggle('open');
            const open = sidebar?.classList.contains('open');
            mobileMenuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.style.overflow = open ? 'hidden' : '';
            document.body.classList.toggle('sidebar-open', !!open);
            sidebarBackdrop.classList.toggle('active', !!open);
        });
    }

    sidebarBackdrop.addEventListener('click', closeSidebar);

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(item.dataset.section);
            closeSidebar();
        });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSidebar();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    window.location.href = './connect.html';
}

// Theme toggle
function toggleTheme() {
    const isDark = document.documentElement.className === 'dark-mode';
    if (isDark) {
        document.documentElement.className = '';
        document.body.className = '';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.className = 'dark-mode';
        document.body.className = 'dark-mode';
        localStorage.setItem('theme', 'dark');
    }
}

// Modal functions
function openAddClientModal() {
    document.getElementById('addClientModal').classList.add('active');
}

function closeAddClientModal() {
    document.getElementById('addClientModal').classList.remove('active');
    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientPassword').value = '';
}

function openAddTeamMemberModal() {
    document.getElementById('addTeamMemberModal').classList.add('active');
}

function closeAddTeamMemberModal() {
    document.getElementById('addTeamMemberModal').classList.remove('active');
    document.getElementById('teamName').value = '';
    document.getElementById('teamEmail').value = '';
    document.getElementById('teamDepartment').value = '';
    document.getElementById('teamPassword').value = '';
}

function openAssignClientModal() {
    document.getElementById('assignClientModal').classList.add('active');
}

function closeAssignClientModal() {
    document.getElementById('assignClientModal').classList.remove('active');
}

// Form handlers
async function handleAddClient(event) {
    event.preventDefault();
    
    const name = document.getElementById('clientName').value;
    const email = document.getElementById('clientEmail').value;
    const password = document.getElementById('clientPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/api/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                user_type: 'client'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert('Error creating client: ' + (error.detail || 'Unknown error'));
            return;
        }
        
        alert('Client created successfully!');
        closeAddClientModal();
        await loadClientsData();
    } catch (error) {
        console.error('Error creating client:', error);
        alert('Error creating client');
    }
}

async function handleAddTeamMember(event) {
    event.preventDefault();
    
    const name = document.getElementById('teamName').value;
    const email = document.getElementById('teamEmail').value;
    const department = document.getElementById('teamDepartment').value;
    const password = document.getElementById('teamPassword').value;
    
    try {
        // Create user account
        const userResponse = await fetch(`${API_URL}/api/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                user_type: 'team_member'
            })
        });
        
        if (!userResponse.ok) {
            const error = await userResponse.json();
            alert('Error creating team member: ' + (error.detail || 'Unknown error'));
            return;
        }
        
        const userData = await userResponse.json();
        
        // Create team member record
        const teamResponse = await fetch(`${API_URL}/api/users/admin/team-members/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userData.user_id,
                department,
                status: 'active'
            })
        });
        
        if (!teamResponse.ok) {
            const error = await teamResponse.json();
            alert('Error creating team member record: ' + (error.detail || 'Unknown error'));
            return;
        }
        
        alert('Team member created successfully!');
        closeAddTeamMemberModal();
        await loadTeamMembersData();
    } catch (error) {
        console.error('Error creating team member:', error);
        alert('Error creating team member');
    }
}

async function handleAssignClient(event) {
    event.preventDefault();
    
    const clientId = document.getElementById('assignClientSelect').value;
    const teamMemberId = event.target.dataset.teamMemberId;
    
    if (!clientId) {
        alert('Please select a client');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/users/admin/assign-client/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                team_member_id: teamMemberId,
                client_id: clientId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert('Error assigning client: ' + (error.detail || 'Unknown error'));
            return;
        }
        
        alert('Client assigned successfully!');
        closeAssignClientModal();
        await loadTeamMembersData();
    } catch (error) {
        console.error('Error assigning client:', error);
        alert('Error assigning client');
    }
}

// Action functions
async function approveAccessRequest(requestId) {
    try {
        const response = await fetch(`${API_URL}/api/users/admin/access-requests/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request_id: requestId,
                action: 'approve'
            })
        });
        
        if (!response.ok) throw new Error('Failed to approve request');
        
        alert('Request approved!');
        await loadAccessRequests();
    } catch (error) {
        console.error('Error approving request:', error);
        alert('Error approving request');
    }
}

async function denyAccessRequest(requestId) {
    try {
        const response = await fetch(`${API_URL}/api/users/admin/access-requests/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request_id: requestId,
                action: 'deny'
            })
        });
        
        if (!response.ok) throw new Error('Failed to deny request');
        
        alert('Request denied!');
        await loadAccessRequests();
    } catch (error) {
        console.error('Error denying request:', error);
        alert('Error denying request');
    }
}

function assignClientToTeamMember(teamMemberId) {
    document.getElementById('assignClientModal').dataset.teamMemberId = teamMemberId;
    openAssignClientModal();
}

function editClient(clientId) {
    alert('Edit functionality coming soon for client: ' + clientId);
}

function deleteClient(clientId) {
    if (confirm('Are you sure you want to delete this client?')) {
        alert('Delete functionality coming soon for client: ' + clientId);
    }
}

function deleteTeamMember(teamMemberId) {
    if (confirm('Are you sure you want to delete this team member?')) {
        alert('Delete functionality coming soon for team member: ' + teamMemberId);
    }
}

function deleteAccessRequest(requestId) {
    if (confirm('Are you sure you want to delete this request?')) {
        alert('Delete functionality coming soon for request: ' + requestId);
    }
}
