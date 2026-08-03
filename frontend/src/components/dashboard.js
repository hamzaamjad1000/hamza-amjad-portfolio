// API_URL is set in config.js (loads before this file)
// This file uses the global API_URL variable

// State management
let currentUser = null;
let currentProjects = [];
let activeProjectId = null;

const DASHBOARD_PAGES = {
    overview: 'dashboard.html',
    projects: 'dashboard-projects.html',
    'new-project': 'dashboard-new-project.html',
    profile: 'dashboard-profile.html',
    settings: 'dashboard-settings.html'
};

function setTextIfExists(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initializeDashboard();
    initializeNavbar(); // Initialize navbar dropdown menu
    setupEventListeners();
    startSystemClock();
});

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = './connect.html';
        return false;
    }
    return true;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function updateStoredProfile(updates) {
    if (!updates) return;
    let storedProfile = {};
    try {
        storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (error) {
        console.error('Failed to parse stored profile:', error);
    }
    const mergedProfile = { ...storedProfile, ...updates };
    localStorage.setItem('userProfile', JSON.stringify(mergedProfile));
    window.dispatchEvent(new Event('storage'));
}

// Initialize Dashboard
async function initializeDashboard() {
    await fetchUserProfile();
    await fetchDashboardSummary();
    await fetchProjects();
    
    // Initial section
    const urlParams = new URLSearchParams(window.location.search);
    let section = urlParams.get('section');
    if (!section) {
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id.endsWith('-section')) {
            section = activeSection.id.replace('-section', '');
        } else {
            section = 'overview';
        }
    }
    switchSection(section);
}

// System Clock
function startSystemClock() {
    const timeDisplay = document.getElementById('utcTime');
    if (!timeDisplay) return;
    
    setInterval(() => {
        const now = new Date();
        timeDisplay.textContent = 'UTC: ' + now.toISOString().replace('T', ' ').substring(11, 19);
    }, 1000);
}

// Fetch User Profile
async function fetchUserProfile() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/users/profile/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateStoredProfile(currentUser);
            updateProfileUI();
        } else {
            // Handle error or redirect to login
            console.error('Failed to fetch profile:', data.message);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Update UI with User Data
function updateProfileUI() {
    if (!currentUser) return;
    updateStoredProfile(currentUser);
    
    // Header & Sidebar
    setTextIfExists('signedInName', currentUser.name || currentUser.username || 'User');
    setTextIfExists('sidebarName', currentUser.name || currentUser.username || 'User');
    setTextIfExists('sidebarEmail', currentUser.email || '');
    setTextIfExists('sidebarRole', currentUser.role || 'Verified Client');
    
    // Profile Section
    setTextIfExists('profileDisplayName', currentUser.name || currentUser.username || 'User');
    setTextIfExists('profileDisplayEmail', currentUser.email || 'client@example.com');
    if (currentUser.id) {
        setTextIfExists('profileUserId', `USR-${String(currentUser.id).substring(0, 8).toUpperCase()}`);
    }
    
    // Profile Form
    const profileName = document.getElementById('profileName');
    if (profileName) profileName.value = currentUser.name || '';
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) profileEmail.value = currentUser.email || '';
    const profilePhone = document.getElementById('profilePhone');
    if (profilePhone) profilePhone.value = currentUser.contact_number || '';
    const profileLocation = document.getElementById('profileLocation');
    if (profileLocation) profileLocation.value = currentUser.location || '';
    const profileCompany = document.getElementById('profileCompany');
    if (profileCompany) profileCompany.value = currentUser.company || '';
    const profileRole = document.getElementById('profileRole');
    if (profileRole) profileRole.value = currentUser.role || '';
    const profileAddress = document.getElementById('profileAddress');
    if (profileAddress) profileAddress.value = currentUser.address || '';
    const profileBio = document.getElementById('profileBio');
    if (profileBio) profileBio.value = currentUser.bio || '';
    
    // Settings
    const paymentInfo = document.getElementById('paymentInfo');
    if (paymentInfo) paymentInfo.value = currentUser.payment_info || '';
    
    // Avatars - Show each user's own profile image
    // If no image, show empty avatar only for that user
    if (currentUser.profile_image) {
        const avatarUrl = currentUser.profile_image.startsWith('http')
            ? currentUser.profile_image
            : `${API_URL.replace('/api', '')}${currentUser.profile_image}`;
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar) headerAvatar.src = avatarUrl;
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
        const profileDisplayImg = document.getElementById('profileDisplayImg');
        if (profileDisplayImg) profileDisplayImg.src = avatarUrl;
    } else {
        // Only show empty avatar if user has NO profile image
        setDefaultAvatars();
    }
}

// Set default avatar emojis for new users
function setDefaultAvatars() {
    const defaultAvatarElements = [
        document.getElementById('headerAvatar'),
        document.getElementById('sidebarAvatar'),
        document.getElementById('profileDisplayImg')
    ];
    
    defaultAvatarElements.forEach(el => {
        if (el) {
            // Create a canvas with emoji avatar
            const canvas = document.createElement('canvas');
            canvas.width = 140;
            canvas.height = 140;
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw emoji
            ctx.font = '80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👤', canvas.width / 2, canvas.height / 2);
            
            // Set image
            el.src = canvas.toDataURL();
        }
    });
}

// Fetch Dashboard Summary
async function fetchDashboardSummary() {
    try {
        const totalProjectsEl = document.getElementById('statTotalProjects');
        if (!totalProjectsEl) {
            return;
        }

        const token = getAuthToken();
        const response = await fetch(`${API_URL}/projects/summary/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        totalProjectsEl.textContent = data.total_projects || 0;
        const completedEl = document.getElementById('statCompleted');
        const inProgressEl = document.getElementById('statInProgress');
        const totalBudgetEl = document.getElementById('statTotalBudget');
        if (completedEl) completedEl.textContent = data.completed_projects || 0;
        if (inProgressEl) inProgressEl.textContent = data.in_progress || 0;
        if (totalBudgetEl) totalBudgetEl.textContent = `$${(data.total_budget || 0).toLocaleString()}`;
        
        const progress = data.average_progress || 0;
        const overallProgressEl = document.getElementById('overallProgress');
        const overallProgressTextEl = document.getElementById('overallProgressText');
        if (overallProgressEl) overallProgressEl.style.width = `${progress}%`;
        if (overallProgressTextEl) overallProgressTextEl.textContent = `${progress}% Complete`;
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
}

// Fetch Projects
async function fetchProjects() {
    try {
        console.log('Fetching projects from API...');
        const token = getAuthToken();
        
        if (!token) {
            console.error('No authentication token found');
            showPopup('ERROR', 'Authentication required', 'error');
            return;
        }
        
        console.log('API URL:', `${API_URL}/projects/`);
        
        const response = await fetch(`${API_URL}/projects/`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            showPopup('ERROR', `Failed to fetch projects: ${response.status}`, 'error');
            return;
        }
        
        const projects = await response.json();
        console.log('Projects received:', projects);
        console.log('Number of projects:', Array.isArray(projects) ? projects.length : 'Not an array');
        
        // Handle both array and object response
        if (Array.isArray(projects)) {
            currentProjects = projects;
        } else if (projects && typeof projects === 'object') {
            // In case API returns {results: []} or similar
            currentProjects = projects.results || projects.data || Object.values(projects).flat();
        } else {
            currentProjects = [];
        }
        
        console.log('Current projects set to:', currentProjects);
        renderProjects();
        renderRecentActivity();
    } catch (error) {
        console.error('Error fetching projects:', error);
        showPopup('ERROR', 'Error loading projects: ' + error.message, 'error');
    }
}

// Render Projects Grid
function renderProjects() {
    console.log('renderProjects() called');
    const list = document.getElementById('projectsList');
    if (!list) {
        console.error('Projects list element not found');
        return;
    }
    
    console.log('Current projects:', currentProjects);
    
    if (!currentProjects || currentProjects.length === 0) {
        console.log('No projects to display');
        list.innerHTML = '<p class="empty-state">No active projects in the database. Initialize a new project to begin.</p>';
        return;
    }
    
    try {
        list.innerHTML = currentProjects.map(project => {
            const statusClass = (project.status || 'pending').toLowerCase().replace(/ /g, '_');
            const progressPercent = project.progress || project.completion_percentage || 0;
            const currentPhase = project.current_phase || project.phase || 'Analysis';
            const timeline = project.timeline || project.deadline || new Date();
            const description = project.description || 'No description';
            
            return `
                <div class="project-card dossier-card" onclick="viewProjectDetails('${project.id}')">
                    <div class="project-header">
                        <div class="project-id-badge">${project.id.substring(0, 4).toUpperCase()}</div>
                        <span class="status-indicator status-${statusClass}"></span>
                    </div>
                    <h3>📄 ${project.name}</h3>
                    <p class="desc">${description.substring(0, 120)}${description.length > 120 ? '...' : ''}</p>
                    <div class="project-progress">
                        <div class="progress-header">
                            <span class="progress-label">${progressPercent}% Complete</span>
                            <span class="progress-phase">${currentPhase}</span>
                        </div>
                        <div class="progress-bar-large" style="height: 6px;">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    <div class="project-card-footer">
                        <span class="project-timeline">📅 ${new Date(timeline).toLocaleDateString()}</span>
                        <span class="status-badge status-${statusClass}">${(project.status || 'PENDING').replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('Projects rendered successfully');
    } catch (error) {
        console.error('Error rendering projects:', error);
        list.innerHTML = `<p class="empty-state">Error rendering projects: ${error.message}</p>`;
    }
}

// Render Recent Activity (Mock data + real project updates)
function renderRecentActivity() {
    const list = document.getElementById('recentActivityList');
    if (!list) return;
    
    // For now, use real projects as "recent activity" or combined with mock
    const activities = [];
    
    currentProjects.slice(0, 3).forEach(p => {
        activities.push({
            icon: '🚀',
            title: `Project "${p.name}" initialized`,
            time: new Date(p.created_at).toLocaleString()
        });
        
        if (p.progress > 0) {
            activities.push({
                icon: '🛠️',
                title: `Development progress updated on ${p.name}`,
                time: new Date(p.updated_at).toLocaleString()
            });
        }
    });
    
    if (activities.length === 0) {
        list.innerHTML = '<p class="empty-state">No recent activities detected.</p>';
        return;
    }
    
    list.innerHTML = activities.sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0, 5).map(act => `
        <div class="activity-item">
            <div class="activity-icon">${act.icon}</div>
            <div class="activity-info">
                <p>${act.title}</p>
                <span class="activity-time">${act.time}</span>
            </div>
        </div>
    `).join('');
}

// View Project Details
async function viewProjectDetails(projectId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/projects/${projectId}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const project = await response.json();
        activeProjectId = projectId;
        
        // Fill Modal
        document.getElementById('modalProjectId').textContent = `PRJ-${project.id.substring(0, 8).toUpperCase()}`;
        document.getElementById('modalProjectName').textContent = project.name;
        document.getElementById('modalStatus').textContent = project.status.replace('_', ' ').toUpperCase();
        document.getElementById('modalStatus').className = `status-badge status-${project.status}`;
        document.getElementById('modalCurrentPhase').textContent = project.current_phase || 'Analysis';
        document.getElementById('modalProgress').style.width = `${project.progress}%`;
        document.getElementById('modalProgressText').textContent = `${project.progress}%`;
        document.getElementById('modalDescription').textContent = project.description;
        document.getElementById('modalTimeline').textContent = new Date(project.timeline).toLocaleDateString();
        document.getElementById('modalBudget').textContent = `$${parseFloat(project.budget).toLocaleString()}`;
        
        // Render Phases
        const phasesList = document.getElementById('modalPhasesList');
        if (project.phases && project.phases.length > 0) {
            phasesList.innerHTML = project.phases.map(phase => `
                <div class="phase-item ${phase.status}">
                    <div class="phase-marker"></div>
                    <div class="phase-content">
                        <h4>${phase.name}</h4>
                        <p>${phase.description || ''}</p>
                        <span class="phase-status-tag">${phase.status}</span>
                    </div>
                </div>
            `).join('');
        } else {
            // Default phases if none exist
            phasesList.innerHTML = `
                <div class="phase-item completed">
                    <div class="phase-marker"></div>
                    <div class="phase-content">
                        <h4>Discovery & Planning</h4>
                        <p>Project requirements analysis and system architecture design.</p>
                        <span class="phase-status-tag">COMPLETED</span>
                    </div>
                </div>
                <div class="phase-item active">
                    <div class="phase-marker"></div>
                    <div class="phase-content">
                        <h4>Development Cycle</h4>
                        <p>Active implementation of core features and UI components.</p>
                        <span class="phase-status-tag">ACTIVE</span>
                    </div>
                </div>
                <div class="phase-item pending">
                    <div class="phase-marker"></div>
                    <div class="phase-content">
                        <h4>Security Audit & QA</h4>
                        <p>Comprehensive testing and vulnerability assessment.</p>
                        <span class="phase-status-tag">PENDING</span>
                    </div>
                </div>
            `;
        }
        
        // Render Activities
        const activityLog = document.getElementById('modalActivityLog');
        if (project.activities && project.activities.length > 0) {
            activityLog.innerHTML = project.activities.map(act => `
                <div class="log-item">
                    <span class="log-time">${new Date(act.timestamp).toLocaleString()}</span>
                    <span class="log-type">[${act.activity_type}]</span>
                    <p class="log-desc">${act.description}</p>
                </div>
            `).join('');
        } else {
            activityLog.innerHTML = '<p class="empty-state">No detailed activity logs recorded for this project.</p>';
        }
        
        // Show Modal
        document.getElementById('projectModal').classList.add('active');
        switchModalTab('overview');
        
        // Populate specs form for editing
        populateSpecsForm(project);
        
    } catch (error) {
        console.error('Error viewing project:', error);
        showPopup('ERROR', 'Failed to retrieve project data.', 'danger');
    }
}

// Switch Modal Tabs
function switchModalTab(tabId) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`modal-tab-${tabId}`).classList.add('active');
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
}

// Switch Section
function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.hidden = true;
    });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
        section.classList.add('active');
        section.hidden = false;
        document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
    } else {
        const targetPage = DASHBOARD_PAGES[sectionId] || DASHBOARD_PAGES.overview;
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== targetPage) {
            window.location.href = targetPage;
        }
        return;
    }
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners
function setupEventListeners() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('dashboardMenuToggle') || document.getElementById('mobileMenuToggle');
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
    
    // Close sidebar when nav item is clicked on mobile
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(item.dataset.section);
            
            // Close mobile sidebar
            closeSidebar();
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
    
    // Modal Tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => switchModalTab(tab.dataset.tab));
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userProfile');
        window.location.href = './connect.html';
    });
    
    // Profile Form
    document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
    
    // Project Form
    document.getElementById('projectForm')?.addEventListener('submit', handleProjectInitiation);
    
    // Avatar Upload
    document.getElementById('profileUpload')?.addEventListener('change', handleAvatarUpload);

    // Billing Info Update
    document.querySelector('.btn-small.btn-primary')?.addEventListener('click', handleBillingUpdate);
    
    // File Upload Drop Zone
    setupFileUploadDropZone();
}

// Setup File Upload Drop Zone
function setupFileUploadDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('projectFiles');
    const fileList = document.getElementById('fileList');
    
    if (!dropZone || !fileInput) return;
    
    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '#e8f4f8';
        dropZone.style.borderColor = '#0ea5e9';
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '';
        dropZone.style.borderColor = '';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '';
        dropZone.style.borderColor = '';
        
        const files = e.dataTransfer.files;
        fileInput.files = files;
        updateFilePreview(files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        updateFilePreview(e.target.files);
    });
}

// Update File Preview
function updateFilePreview(files) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    fileList.innerHTML = '';
    
    if (files.length === 0) {
        fileList.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No files selected</p>';
        return;
    }
    
    Array.from(files).forEach((file, index) => {
        const fileExt = file.name.split('.').pop().toUpperCase();
        let icon = '📄';
        
        if (['JPG', 'PNG', 'GIF', 'BMP', 'WEBP'].includes(fileExt)) {
            icon = '🖼️';
        } else if (['PDF'].includes(fileExt)) {
            icon = '📕';
        } else if (['DOCX', 'DOC', 'TXT'].includes(fileExt)) {
            icon = '📝';
        } else if (['ZIP', 'RAR', '7Z'].includes(fileExt)) {
            icon = '📦';
        } else if (['XLSX', 'XLS', 'CSV'].includes(fileExt)) {
            icon = '📊';
        }
        
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        const filePreview = document.createElement('div');
        filePreview.className = 'file-preview-item';
        filePreview.style.cssText = `
            padding: 10px;
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
        `;
        filePreview.innerHTML = `
            <span style="font-size: 1.5rem;">${icon}</span>
            <div style="flex: 1; min-width: 0;">
                <div style="word-break: break-word; font-weight: 500;">${file.name}</div>
                <div style="font-size: 0.8rem; color: #666;">${fileSize} MB</div>
            </div>
            <button type="button" onclick="removeFile(${index})" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
        `;
        fileList.appendChild(filePreview);
    });
}

// Remove File from preview
function removeFile(index) {
    const fileInput = document.getElementById('projectFiles');
    const dataTransfer = new DataTransfer();
    const files = fileInput.files;
    
    for (let i = 0; i < files.length; i++) {
        if (i !== index) {
            dataTransfer.items.add(files[i]);
        }
    }
    
    fileInput.files = dataTransfer.files;
    updateFilePreview(fileInput.files);
}

// Handle Profile Update
async function handleProfileUpdate(e) {
    e.preventDefault();
    const token = getAuthToken();
    
    const formData = {
        name: document.getElementById('profileName').value,
        contact_number: document.getElementById('profilePhone').value,
        location: document.getElementById('profileLocation').value,
        company: document.getElementById('profileCompany').value,
        role: document.getElementById('profileRole').value,
        address: document.getElementById('profileAddress').value,
        bio: document.getElementById('profileBio').value,
    };
    
    try {
        const response = await fetch(`${API_URL}/users/profile/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateProfileUI();
            showPopup('SUCCESS', 'Profile protocols updated.', 'success');
        } else {
            showPopup('ERROR', data.message || 'Update failed.', 'danger');
        }
    } catch (error) {
        console.error('Update error:', error);
        showPopup('ERROR', 'System connection failed.', 'danger');
    }
}

// Handle Billing Update
async function handleBillingUpdate() {
    console.log('handleBillingUpdate() called');
    
    try {
        const token = getAuthToken();
        if (!token) {
            showPopup('ERROR', 'Authentication required', 'error');
            return;
        }
        
        // Get billing information from form
        const cardholderName = document.getElementById('cardholderName')?.value.trim() || '';
        const cardNumber = document.getElementById('cardNumber')?.value.trim() || '';
        const expiryDate = document.getElementById('expiryDate')?.value.trim() || '';
        const cvv = document.getElementById('cvv')?.value.trim() || '';
        const billingAddress = document.getElementById('billingAddress')?.value.trim() || '';
        
        // Basic validation
        if (!cardholderName || !cardNumber) {
            showPopup('ERROR', 'Cardholder name and card number are required', 'error');
            return;
        }
        
        console.log('Saving billing information...');
        showPopup('INFO', 'Saving billing information...', 'info');
        
        // Prepare payment info object
        const payment_info = {
            cardholder_name: cardholderName,
            card_number: cardNumber,
            expiry_date: expiryDate,
            cvv: cvv,
            billing_address: billingAddress
        };
        
        const response = await fetch(`${API_URL}/users/profile/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ payment_info })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (data.success || response.ok) {
            if (data.user) {
                currentUser = data.user;
            }
            showPopup('SUCCESS', '✓ Billing protocols updated successfully!', 'success');
        } else {
            showPopup('ERROR', '✗ Failed to update billing information', 'error');
        }
    } catch (error) {
        console.error('Billing update error:', error);
        showPopup('ERROR', '✗ Network transmission error', 'error');
    }
}

// Alias for updateBillingInfo function
function updateBillingInfo() {
    handleBillingUpdate();
}

// Handle Project Initiation (Form Submission)
async function handleProjectInitiation(e) {
    e.preventDefault();
    await addNewProject();
}

// Add New Project - Direct button handler
async function addNewProject() {
    console.log('addNewProject() called');
    
    // Get form values
    const projectName = document.getElementById('projectName')?.value.trim();
    const projectDescription = document.getElementById('projectDescription')?.value.trim();
    const projectTimeline = document.getElementById('projectTimeline')?.value.trim();
    const projectBudget = document.getElementById('projectBudget')?.value.trim();
    const projectFiles = document.getElementById('projectFiles')?.files;
    
    // Validation
    if (!projectName) {
        showPopup('ERROR', 'Project name is required', 'error');
        return;
    }
    if (!projectDescription) {
        showPopup('ERROR', 'Technical specifications are required', 'error');
        return;
    }
    if (!projectTimeline) {
        showPopup('ERROR', 'Estimated deadline is required', 'error');
        return;
    }
    if (!projectBudget) {
        showPopup('ERROR', 'Allocated budget is required', 'error');
        return;
    }
    
    console.log('Form values:', {
        name: projectName,
        description: projectDescription,
        timeline: projectTimeline,
        budget: projectBudget,
        filesCount: projectFiles?.length || 0
    });
    
    try {
        showPopup('INFO', 'Creating new project...', 'info');
        
        const token = getAuthToken();
        if (!token) {
            showPopup('ERROR', 'Authentication token not found', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('name', projectName);
        formData.append('description', projectDescription);
        formData.append('timeline', projectTimeline);
        formData.append('budget', projectBudget);
        
        // Add files if selected
        if (projectFiles && projectFiles.length > 0) {
            for (let i = 0; i < projectFiles.length; i++) {
                formData.append('files', projectFiles[i]);
            }
            console.log(`Adding ${projectFiles.length} file(s) to project`);
        }
        
        console.log('API URL:', `${API_URL}/projects/`);
        
        const response = await fetch(`${API_URL}/projects/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            showPopup('SUCCESS', '✓ Project deployment initiated successfully!', 'success');
            
            // Reset form
            document.getElementById('projectForm')?.reset();
            document.getElementById('fileList').innerHTML = '';
            
            // Refresh data and redirect
            setTimeout(async () => {
                await fetchProjects();
                await fetchDashboardSummary();
                switchSection('projects');
            }, 1500);
        } else {
            const errorMsg = responseData.message || responseData.error || 'Failed to create project';
            showPopup('ERROR', '✗ ' + errorMsg, 'error');
            console.error('API Error:', responseData);
        }
    } catch (error) {
        console.error('Project creation error:', error);
        showPopup('ERROR', '✗ Error: ' + error.message, 'error');
    }
}

// Popups
function showPopup(title, message, type) {
    const popup = document.getElementById('messagePopup');
    const titleEl = document.getElementById('popupTitle');
    const msgEl = document.getElementById('popupMessage');
    const iconEl = document.getElementById('popupIcon');
    
    titleEl.textContent = title;
    msgEl.textContent = message;
    
    if (type === 'danger' || type === 'error') {
        popup.querySelector('.popup-content').style.borderLeftColor = '#ef4444';
        iconEl.textContent = '✗';
        iconEl.style.backgroundColor = '#ef4444';
    } else if (type === 'info') {
        popup.querySelector('.popup-content').style.borderLeftColor = '#3b82f6';
        iconEl.textContent = 'ℹ';
        iconEl.style.backgroundColor = '#3b82f6';
    } else {
        // success or default
        popup.querySelector('.popup-content').style.borderLeftColor = '#10b981';
        iconEl.textContent = '✓';
        iconEl.style.backgroundColor = '#10b981';
    }
    
    popup.classList.add('active');
    setTimeout(closePopup, 5000);
}

function closePopup() {
    document.getElementById('messagePopup').classList.remove('active');
}

// ============================================
// UPDATE SPECS MODAL FUNCTIONS
// ============================================

function openUpdateSpecsModal() {
    if (!activeProjectId) {
        showPopup('ERROR', 'No project selected', 'error');
        return;
    }
    
    const project = currentProjects.find(p => p.id === activeProjectId);
    if (!project) {
        showPopup('ERROR', 'Project not found', 'error');
        return;
    }
    
    // Populate form with current project data
    document.getElementById('specsProjectName').value = project.name || '';
    document.getElementById('specsDescription').value = project.description || '';
    document.getElementById('specsBudget').value = project.budget || '';
    document.getElementById('specsDeadline').value = project.deadline || '';
    document.getElementById('specsStatus').value = project.status || '';
    document.getElementById('specsCurrentPhase').value = project.current_phase || '';
    document.getElementById('specsProgress').value = (project.completion_percentage || 0) + '%';
    document.getElementById('specsRequirements').value = project.technical_requirements || '';
    document.getElementById('specsNotes').value = project.notes || '';
    
    document.getElementById('updateSpecsModal').classList.add('active');
}

function closeUpdateSpecsModal() {
    document.getElementById('updateSpecsModal').classList.remove('active');
}

// Save Specifications - Direct button handler
async function saveSpecifications() {
    console.log('saveSpecifications() called');
    
    const projectId = activeProjectId;
    if (!projectId) {
        showPopup('ERROR', 'No project selected', 'error');
        return;
    }
    
    // Get form values
    const projectName = document.getElementById('specsProjectName').value.trim();
    const description = document.getElementById('specsDescription').value.trim();
    const budget = document.getElementById('specsBudget').value.trim();
    const deadline = document.getElementById('specsDeadline').value.trim();
    const requirements = document.getElementById('specsRequirements').value.trim();
    const notes = document.getElementById('specsNotes').value.trim();
    
    // Validation
    if (!projectName) {
        showPopup('ERROR', 'Project name is required', 'error');
        return;
    }
    
    console.log('Saving specs for project:', projectId);
    console.log('Data:', { projectName, description, budget, deadline, requirements, notes });
    
    try {
        showPopup('INFO', 'Saving project specifications...', 'info');
        
        const payload = {
            name: projectName,
            description: description,
            budget: budget ? parseFloat(budget) : 0,
            deadline: deadline,
            technical_requirements: requirements,
            notes: notes
        };
        
        console.log('API URL:', `${API_URL}/projects/${projectId}/`);
        console.log('Payload:', payload);
        
        const response = await fetch(`${API_URL}/projects/${projectId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status);
        
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            showPopup('SUCCESS', '✓ Project specifications updated successfully!', 'success');
            
            // Refresh projects and close modal
            setTimeout(() => {
                closeUpdateSpecsModal();
                fetchProjects();
                fetchDashboardSummary();
            }, 1500);
        } else {
            const errorMsg = responseData.message || responseData.error || 'Failed to update project';
            showPopup('ERROR', '✗ ' + errorMsg, 'error');
            console.error('API Error:', responseData);
        }
    } catch (error) {
        console.error('Exception:', error);
        showPopup('ERROR', '✗ Error: ' + error.message, 'error');
    }
}

// Reset Specifications Form
function resetSpecsForm() {
    console.log('resetSpecsForm() called');
    
    // Get the form element
    const form = document.getElementById('specsUpdateForm');
    
    if (form) {
        // Clear all input fields
        document.getElementById('specsProjectName').value = '';
        document.getElementById('specsDescription').value = '';
        document.getElementById('specsBudget').value = '';
        document.getElementById('specsDeadline').value = '';
        document.getElementById('specsRequirements').value = '';
        document.getElementById('specsNotes').value = '';
        
        // Show feedback
        showPopup('INFO', '✓ Form has been cleared', 'info');
        console.log('Form reset successfully');
    } else {
        showPopup('ERROR', 'Form not found', 'error');
    }
}

// ============================================
// MODAL FILE UPLOAD FUNCTIONS
// ============================================

// Setup Modal File Upload Drop Zone
function setupModalFileUpload() {
    const dropZone = document.getElementById('modalDropZone');
    const fileInput = document.getElementById('modalProjectFiles');
    const fileList = document.getElementById('modalFileList');
    
    if (!dropZone || !fileInput) return;
    
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#0ea5e9';
        dropZone.style.backgroundColor = 'rgba(14, 165, 233, 0.15)';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '';
        dropZone.style.backgroundColor = '';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        updateModalFilePreview(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        updateModalFilePreview(e.target.files);
    });
}

// Update Modal File Preview
function updateModalFilePreview(files) {
    const fileList = document.getElementById('modalFileList');
    if (!fileList) return;
    
    fileList.innerHTML = '';
    
    if (files.length === 0) {
        fileList.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No files selected</p>';
        return;
    }
    
    Array.from(files).forEach((file, index) => {
        const fileExt = file.name.split('.').pop().toUpperCase();
        let icon = '📄';
        
        if (['JPG', 'PNG', 'GIF', 'BMP', 'WEBP'].includes(fileExt)) {
            icon = '🖼️';
        } else if (['PDF'].includes(fileExt)) {
            icon = '📕';
        } else if (['DOCX', 'DOC', 'TXT'].includes(fileExt)) {
            icon = '📝';
        } else if (['ZIP', 'RAR', '7Z'].includes(fileExt)) {
            icon = '📦';
        } else if (['XLSX', 'XLS', 'CSV'].includes(fileExt)) {
            icon = '📊';
        } else if (['PPTX', 'PPT'].includes(fileExt)) {
            icon = '📊';
        }
        
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-size">${fileSize} MB</div>
            <div class="file-actions">
                <button type="button" class="file-action-btn" onclick="removeModalFile(${index})" title="Delete">✕</button>
            </div>
        `;
        fileList.appendChild(fileItem);
    });
}

// Remove Modal File
function removeModalFile(index) {
    const fileInput = document.getElementById('modalProjectFiles');
    const dataTransfer = new DataTransfer();
    const files = fileInput.files;
    
    for (let i = 0; i < files.length; i++) {
        if (i !== index) {
            dataTransfer.items.add(files[i]);
        }
    }
    
    fileInput.files = dataTransfer.files;
    updateModalFilePreview(fileInput.files);
}

// Add Cloud File
async function addCloudFile() {
    const url = document.getElementById('cloudFileUrl').value;
    if (!url.trim()) {
        showPopup('ERROR', 'Please enter a valid cloud file URL.', 'danger');
        return;
    }
    
    const cloudFileList = document.getElementById('cloudFileList');
    if (!cloudFileList) return;
    
    // Extract filename from URL or use generic name
    const fileName = url.split('/').pop() || 'cloud-file';
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-icon">☁️</div>
        <div class="file-name" title="${fileName}">${fileName}</div>
        <div class="file-size">Cloud</div>
        <div class="file-actions">
            <button type="button" class="file-action-btn" onclick="this.parentElement.parentElement.remove()" title="Remove">✕</button>
        </div>
    `;
    fileItem.dataset.cloudUrl = url;
    
    cloudFileList.appendChild(fileItem);
    document.getElementById('cloudFileUrl').value = '';
    showPopup('SUCCESS', 'Cloud file added to project.', 'success');
}

// Upload Files to Server
async function uploadFilesToServer() {
    const token = getAuthToken();
    
    if (!activeProjectId) {
        showPopup('ERROR', 'No project selected.', 'danger');
        return;
    }
    
    const fileInput = document.getElementById('modalProjectFiles');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showPopup('WARNING', 'No files selected to upload.', 'danger');
        return;
    }
    
    try {
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
        
        const response = await fetch(`${API_URL}/projects/${activeProjectId}/upload-files/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            showPopup('SUCCESS', `${files.length} file(s) uploaded successfully!`, 'success');
            fileInput.value = ''; // Clear input
            updateModalFilePreview(fileInput.files);
            await fetchProjects(); // Refresh project data
        } else {
            showPopup('ERROR', 'Failed to upload files.', 'danger');
        }
    } catch (error) {
        console.error('File upload error:', error);
        showPopup('ERROR', 'Error uploading files.', 'danger');
    }
}

// Initialize modal file upload when modal opens
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        setupModalFileUpload();
    }, 500);
});

// Populate specs form when project modal is opened
function populateSpecsForm(project) {
    if (!project) return;
    
    document.getElementById('specsProjectName').value = project.name || '';
    document.getElementById('specsDescription').value = project.description || '';
    document.getElementById('specsBudget').value = project.budget || 0;
    
    if (project.timeline) {
        const date = new Date(project.timeline);
        document.getElementById('specsDeadline').value = date.toISOString().split('T')[0];
    }
    
    document.getElementById('specsRequirements').value = project.technical_requirements || '';
    document.getElementById('specsNotes').value = project.notes || '';
    
    // Set read-only admin fields
    document.getElementById('specsStatus').value = (project.status || 'planning').replace('_', ' ').toUpperCase();
    document.getElementById('specsCurrentPhase').value = project.current_phase || 'N/A';
    document.getElementById('specsProgress').value = (project.progress || 0) + '%';
}

// ============================================
// PROFILE IMAGE UPLOAD
// ============================================

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (event) => {
        const profileDisplayImg = document.getElementById('profileDisplayImg');
        if (profileDisplayImg) profileDisplayImg.src = event.target.result;
        
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar) headerAvatar.src = event.target.result;
        
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarAvatar) sidebarAvatar.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('profile_image', file);
    
    try {
        const response = await fetch(`${API_URL}/users/profile/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const data = await response.json();
        if (response.ok && (data.success || data.user || data.profile_image)) {
            const updatedProfile = data.user || data;
            currentUser = { ...currentUser, ...updatedProfile };
            updateStoredProfile(currentUser);
            updateProfileUI();
            showPopup('SUCCESS', 'Profile picture updated successfully!', 'success');
        } else {
            const errorMsg = data.message || data.detail || data.error || 'Failed to update profile picture.';
            showPopup('ERROR', errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        showPopup('ERROR', 'Error uploading profile picture.', 'danger');
    }
}

// ============================================
// BILLING INFORMATION UPDATE
// ============================================

async function updateBillingInfo() {
    const token = getAuthToken();
    
    const billingData = {
        cardholder_name: document.getElementById('cardholderName').value,
        card_number: document.getElementById('cardNumber').value,
        expiry_date: document.getElementById('expiryDate').value,
        billing_address: document.getElementById('billingAddress').value,
        auto_renewal: document.querySelector('input[type="checkbox"][id*="autoRenewal"]')?.checked,
        invoice_delivery: document.querySelector('input[type="checkbox"][id*="invoiceDelivery"]')?.checked,
        payment_reminders: document.querySelector('input[type="checkbox"][id*="paymentReminders"]')?.checked
    };
    
    try {
        const response = await fetch(`${API_URL}/billing/update/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billingData)
        });
        
        if (response.ok) {
            showPopup('SUCCESS', 'Billing information updated successfully!', 'success');
        } else {
            showPopup('ERROR', 'Failed to update billing information.', 'danger');
        }
    } catch (error) {
        console.error('Billing update error:', error);
        showPopup('ERROR', 'Error updating billing information.', 'danger');
    }
}

// ============================================
// CHANGE PASSWORD
// ============================================

function openChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('active');
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('active');
    document.getElementById('changePasswordForm').reset();
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (newPassword !== confirmPassword) {
        showPopup('ERROR', 'New passwords do not match!', 'danger');
        return;
    }
    
    if (newPassword.length < 8) {
        showPopup('ERROR', 'Password must be at least 8 characters long.', 'danger');
        return;
    }
    
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        showPopup('ERROR', 'Password must contain uppercase, lowercase, and numbers.', 'danger');
        return;
    }
    
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${API_URL}/auth/change-password/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (response.ok) {
            showPopup('SUCCESS', 'Password changed successfully!', 'success');
            closeChangePasswordModal();
        } else {
            const error = await response.json();
            showPopup('ERROR', error.detail || 'Failed to change password.', 'danger');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showPopup('ERROR', 'Error changing password.', 'danger');
    }
}

// Setup change password form
document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
});
