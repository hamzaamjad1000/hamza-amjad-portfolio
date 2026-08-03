// Navbar Authentication Check
// Shows profile menu on all pages when user is signed in

let profileMenuOpen = false;
let mobileMenuOpen = false;
let mobileNavBackdrop = null;

function resolveProfileImage(profileImage) {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) return profileImage;
    if (typeof API_URL !== 'undefined') {
        return `${API_URL.replace('/api', '')}${profileImage}`;
    }
    return profileImage;
}

function initializeNavbar() {
    const authToken = localStorage.getItem('authToken');
    const userProfile = localStorage.getItem('userProfile');
    
    const connectBtn = document.querySelector('.hire-btn');
    const headerActions = document.querySelector('.header-actions');
    
    if (!connectBtn || !headerActions) return;
    
    if (authToken && userProfile) {
        let profile = {};
        try {
            profile = JSON.parse(userProfile);
        } catch(e) {
            console.error('Failed to parse user profile');
        }
        
        connectBtn.style.display = 'none';
        createProfileMenu(headerActions, profile);
    } else {
        connectBtn.style.display = 'inline-flex';
        connectBtn.textContent = 'Connect';
        connectBtn.href = 'connect.html';
        connectBtn.onclick = null;
        connectBtn.classList.remove('signed-in');
        
        const profileMenu = document.getElementById('userProfileSummary');
        if (profileMenu) {
            profileMenu.remove();
        }
    }
}

function createProfileMenu(headerActions, profile) {
    let profileMenu = document.getElementById('userProfileSummary');
    
    if (!profileMenu) {
        profileMenu = document.createElement('div');
        profileMenu.id = 'userProfileSummary';
        profileMenu.className = 'user-profile-summary';
        
        const themeToggle = headerActions.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.parentNode.insertBefore(profileMenu, themeToggle.nextSibling);
        } else {
            headerActions.appendChild(profileMenu);
        }
    }
    
    const profileName = profile.name || profile.username || 'User';
    const avatarUrl = resolveProfileImage(profile.profile_image);
    const avatarMarkup = avatarUrl
        ? `<img src="${avatarUrl}" alt="${profileName}" />`
        : profileName.charAt(0).toUpperCase();
    
    profileMenu.innerHTML = `
        <div class="profile-avatar${avatarUrl ? ' has-image' : ''}">
            ${avatarMarkup}
        </div>
        <span class="profile-name-text">${profileName}</span>
        <span class="profile-caret" aria-hidden="true">▾</span>
        
        <div id="profileDropdown" class="profile-dropdown">
            <a href="dashboard.html" class="dropdown-item">Dashboard</a>
            <a href="dashboard-profile.html" class="dropdown-item">Profile Settings</a>
            <div class="dropdown-divider"></div>
            <button onclick="logout()" class="dropdown-item logout-btn">Terminate Session</button>
        </div>
    `;
    
    profileMenu.onclick = toggleProfileMenu;
}

function toggleProfileMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    if (!dropdown) return;
    
    profileMenuOpen = !profileMenuOpen;
    dropdown.style.display = profileMenuOpen ? 'block' : 'none';
}

function closeProfileMenu() {
    profileMenuOpen = false;
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('pendingSignupEmail');
    localStorage.removeItem('verifiedEmail');
    closeProfileMenu();
    window.location.href = 'index.html';
}

function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    if (!mobileMenuToggle || !nav) return;

    // Add "Menu" label to toggle button for better mobile usability
    if (!mobileMenuToggle.querySelector('.menu-label')) {
        const label = document.createElement('span');
        label.className = 'menu-label';
        label.textContent = 'MENU';
        mobileMenuToggle.appendChild(label);
    }

    // Official Banner Accordion
    const bannerButton = document.getElementById('usaBannerButton');
    const bannerContent = document.getElementById('usaBannerContent');
    
    if (bannerButton && bannerContent) {
        bannerButton.addEventListener('click', () => {
            const isExpanded = bannerButton.getAttribute('aria-expanded') === 'true';
            bannerButton.setAttribute('aria-expanded', !isExpanded);
            bannerContent.hidden = isExpanded;
        });
    }

    // Create backdrop if it doesn't exist
    if (!mobileNavBackdrop) {
        mobileNavBackdrop = document.createElement('div');
        mobileNavBackdrop.className = 'mobile-nav-backdrop';
        mobileNavBackdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(mobileNavBackdrop);
    }

    mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });

    mobileNavBackdrop.addEventListener('click', closeMobileMenu);

    // Handle nav link clicks
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeProfileMenu();
        }
    });

    // Close on resize if switching to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    if (mobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    
    mobileMenuOpen = true;
    mobileMenuToggle.classList.add('active');
    nav.classList.add('active');
    mobileNavBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Accessibility
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    
    if (!mobileMenuOpen) return;
    
    mobileMenuOpen = false;
    mobileMenuToggle.classList.remove('active');
    nav.classList.remove('active');
    mobileNavBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    
    // Accessibility
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
}

// Global click listener to close dropdowns
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-profile-summary')) {
        closeProfileMenu();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    setupMobileMenu();
});

window.addEventListener('storage', () => {
    setTimeout(initializeNavbar, 100);
});
