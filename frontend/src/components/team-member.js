// API_URL is set in config.js (loads before this file)
// This file uses the global API_URL variable

let currentUser = null;
let assignedClients = [];
let availableClients = [];
let pendingRequests = [];

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
        if (user.user_type !== 'team_member' && user.user_type !== 'admin') {
            // Redirect to appropriate dashboard for non-team users
            window.location.href = './dashboard.html';
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
    await loadAssignedClients();
    await loadAvailableClients();
    await loadPendingRequests();
    updateStats();
    
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
            document.getElementById('sidebarName').textContent = currentUser.name || 'Team Member';
        }
    } catch (e) {
        console.error('Error parsing user profile:', e);
    }
}

// Load assigned clients
async function loadAssignedClients() {
    try {
        const response = await fetch(`${API_URL}/api/users/team/assigned-clients/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        assignedClients = data.clients || [];
        
        renderAssignedClients();
    } catch (error) {
        console.error('Error loading assigned clients:', error);
        const clientsList = document.getElementById('clientsList');
        if (clientsList) {
            clientsList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: red;">Error loading assigned clients</div>';
        }
    }
}

// Render assigned clients
function renderAssignedClients() {
    const clientsList = document.getElementById('clientsList');
    
    if (assignedClients.length === 0) {
        clientsList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted-color);">You have no assigned clients yet.</div>';
        return;
    }
    
    clientsList.innerHTML = assignedClients.map(client => `
        <div class="client-card">
            <h3>${client.name || 'Unnamed Client'}</h3>
            <div class="client-info">
                <p><strong>Email:</strong> ${client.email || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="client-status status-active">Active</span></p>
                ${client.description ? `<p><strong>Description:</strong> ${client.description}</p>` : ''}
            </div>
            <div class="client-actions">
                <button class="action-btn view-btn" onclick="viewClientDetails('${client.id}', '${client.name}')">View Details</button>
            </div>
        </div>
    `).join('');
}

// Load available clients
async function loadAvailableClients() {
    try {
        const response = await fetch(`${API_URL}/api/users/admin/clients/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const allClients = data.clients || [];
        
        // Filter out already assigned clients
        availableClients = allClients.filter(client => 
            !assignedClients.some(assigned => assigned.id === client.id)
        );
        
        renderAvailableClients();
    } catch (error) {
        console.error('Error loading available clients:', error);
        document.getElementById('availableClientsBody').innerHTML = 
            '<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Error loading available clients</td></tr>';
    }
}

// Render available clients
function renderAvailableClients() {
    const tbody = document.getElementById('availableClientsBody');
    
    if (availableClients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--muted-color);">No additional clients available to request</td></tr>';
        return;
    }
    
    tbody.innerHTML = availableClients.map(client => {
        const hasRequest = pendingRequests.some(req => req.client.id === client.id);
        return `
            <tr>
                <td>${client.name || 'Unnamed'}</td>
                <td>${client.email || 'N/A'}</td>
                <td>${hasRequest ? '<span class="client-status status-pending">Requested</span>' : '<span class="client-status status-active">Available</span>'}</td>
                <td>
                    ${hasRequest ? 
                        '<button class="action-btn request-btn" disabled>Already Requested</button>' :
                        `<button class="action-btn request-btn" onclick="requestAccess('${client.id}')">Request Access</button>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

// Load pending requests
async function loadPendingRequests() {
    try {
        const response = await fetch(`${API_URL}/api/users/team/request-access/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        pendingRequests = data.requests || [];
        
        renderPendingRequests();
    } catch (error) {
        console.error('Error loading pending requests:', error);
        document.getElementById('pendingRequestsBody').innerHTML = 
            '<tr><td colspan="3" style="text-align: center; padding: 20px; color: red;">Error loading pending requests</td></tr>';
    }
}

// Render pending requests
function renderPendingRequests() {
    const tbody = document.getElementById('pendingRequestsBody');
    
    if (pendingRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: var(--muted-color);">No pending requests</td></tr>';
        return;
    }
    
    tbody.innerHTML = pendingRequests.map(request => `
        <tr>
            <td>${request.client?.name || 'Unknown Client'}</td>
            <td><span class="client-status status-pending">${request.status}</span></td>
            <td>${new Date(request.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Update stats
function updateStats() {
    document.getElementById('totalClients').textContent = assignedClients.length;
    document.getElementById('pendingRequests').textContent = pendingRequests.length;
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
    const mobileMenuToggle = document.getElementById('teamMenuToggle') || document.getElementById('dashboardMenuToggle') || document.getElementById('mobileMenuToggle');
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
function openClientDetailModal() {
    document.getElementById('clientDetailModal').classList.add('active');
}

function closeClientDetailModal() {
    document.getElementById('clientDetailModal').classList.remove('active');
}

// View client details
async function viewClientDetails(clientId, clientName) {
    openClientDetailModal();
    
    try {
        const response = await fetch(`${API_URL}/api/users/team/client/${clientId}/`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const client = data.client;
        
        document.getElementById('clientDetailName').textContent = client.name;
        document.getElementById('clientDetailContent').innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${client.email || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">Active</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${client.phone || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Company</div>
                    <div class="detail-value">${client.company || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${client.location || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Member Since</div>
                    <div class="detail-value">${new Date(client.date_joined).toLocaleDateString()}</div>
                </div>
            </div>
            ${client.description ? `
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: var(--text-color);">Description</h4>
                    <p style="color: var(--muted-color); margin: 0;">${client.description}</p>
                </div>
            ` : ''}
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn-primary" onclick="editClientData('${clientId}')">Edit Details</button>
                <button class="btn-secondary" onclick="closeClientDetailModal()">Close</button>
            </div>
        `;
    } catch (error) {
        console.error('Error loading client details:', error);
        document.getElementById('clientDetailContent').innerHTML = 
            '<p style="color: red; text-align: center;">Error loading client details</p>';
    }
}

// Request access
async function requestAccess(clientId) {
    try {
        const response = await fetch(`${API_URL}/api/users/team/request-access/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert('Error requesting access: ' + (error.detail || 'Unknown error'));
            return;
        }
        
        alert('Access request submitted successfully!');
        await loadAvailableClients();
        await loadPendingRequests();
        updateStats();
    } catch (error) {
        console.error('Error requesting access:', error);
        alert('Error requesting access');
    }
}

// Edit client data
function editClientData(clientId) {
    alert('Edit functionality coming soon for client: ' + clientId);
}
