// API_URL is set in config.js (loads before this file)
// This file uses the global API_URL variable
const GOOGLE_CLIENT_ID = '693099174316-8837e2rfpbii1qs9tltvnf9cst25onl0.apps.googleusercontent.com';

// Track selected user type
let selectedUserType = 'client';

console.log('📝 connect.js loaded');

// Switch to Member Login
function switchToMemberLogin() {
    const prevType = selectedUserType;
    selectedUserType = 'team_member';
    document.getElementById('signin-card').classList.add('hidden');
    document.getElementById('signup-card').classList.add('hidden');
    document.getElementById('member-login-card').classList.remove('hidden');

    // Only blink the info pane when switching from a client/user to team member
    if (prevType === 'client') {
        const infoPane = document.querySelector('.auth-info-pane');
        if (infoPane) {
            infoPane.classList.add('blink');
            // Remove the blink class after the animation finishes (matches CSS duration)
            setTimeout(() => infoPane.classList.remove('blink'), 700);
        }
    }
}

// Wait for Google SDK to load with proper error handling
let googleInitAttempts = 0;
const MAX_GOOGLE_INIT_ATTEMPTS = 100; // 10 seconds max wait

function initializeGoogleAuth() {
    googleInitAttempts++;
    
    // Check if Google is already loaded
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        console.log('✅ Google SDK detected, initializing auth');
        setupGoogleAuth();
        return;
    }
    
    if (googleInitAttempts > MAX_GOOGLE_INIT_ATTEMPTS) {
        console.error('❌ Google SDK failed to load after 10 seconds');
        renderGoogleFallbackButtons();
        return;
    }
    
    // If not loaded, wait and retry
    setTimeout(initializeGoogleAuth, 100);
}

function renderGoogleFallbackButtons() {
    const googleSigninBtn = document.getElementById('google-signin-button');
    const googleSignupBtn = document.getElementById('google-signup-button');
    
    if (googleSigninBtn) renderGoogleFallback(googleSigninBtn, 'Sign in with Google');
    if (googleSignupBtn) renderGoogleFallback(googleSignupBtn, 'Sign up with Google');
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOMContentLoaded fired - starting Google auth init');
        initializeGoogleAuth();
        setupFormHandlers();
    });
} else {
    console.log('📄 DOM already ready - starting Google auth init immediately');
    initializeGoogleAuth();
    setupFormHandlers();
}

// Switch to Sign Up
function switchToSignup() {
    document.getElementById('signin-card').classList.add('hidden');
    document.getElementById('signup-card').classList.remove('hidden');
    document.getElementById('signup-step-1').classList.remove('hidden');
    document.getElementById('signup-step-2').classList.add('hidden');
    document.getElementById('signup-step-3').classList.add('hidden');
    document.getElementById('signup-step-success').classList.add('hidden');
    
    // Ensure member login is hidden when switching
    const memberLogin = document.getElementById('member-login-card');
    if (memberLogin) memberLogin.classList.add('hidden');
    
    // Update form header based on user type
    const typeLabel = selectedUserType === 'admin' ? 'ADMIN' : selectedUserType === 'team_member' ? 'TEAM MEMBER' : 'CLIENT';
    const stepElements = document.querySelectorAll('#signup-card .form-header p');
    if (stepElements[0]) {
        stepElements[0].textContent = `Step 1 of 3: Email Verification (${typeLabel})`;
    }
}

// Switch to Sign In
function switchToSignin() {
    document.getElementById('signin-card').classList.remove('hidden');
    document.getElementById('signup-card').classList.add('hidden');
    const memberLogin = document.getElementById('member-login-card');
    if (memberLogin) memberLogin.classList.add('hidden');
}

// Go back to Sign In (from success)
function backToSignIn() {
    document.getElementById('signin-card').classList.remove('hidden');
    document.getElementById('signup-card').classList.add('hidden');
    const memberLogin = document.getElementById('member-login-card');
    if (memberLogin) memberLogin.classList.add('hidden');
}

function setupGoogleAuth() {
    const googleSigninBtn = document.getElementById('google-signin-button');
    const googleSignupBtn = document.getElementById('google-signup-button');
    
    // Check if Google API is loaded
    const isGoogleLoaded = typeof google !== 'undefined' && google.accounts && google.accounts.id;
    
    if (!isGoogleLoaded) {
        console.error('❌ Google Sign-In SDK not loaded');
        return;
    }
    
    try {
        console.log('🔄 Initializing Google Sign-In...');
        
        // Initialize Google Sign-In once with proper config
        google.accounts.id.initialize({ 
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            itp_support: true
        });
        
        // Render Sign In Button with explicit parent
        if (googleSigninBtn) {
            try {
                // Clear any existing content
                googleSigninBtn.innerHTML = '';
                
                google.accounts.id.renderButton(googleSigninBtn, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    logo_alignment: 'left',
                    text: 'signin_with'
                });
                console.log('✅ Sign In button rendered');
            } catch (err) {
                console.error('❌ Error rendering Sign In button:', err);
                renderGoogleFallback(googleSigninBtn, 'Sign in with Google');
            }
        }
        
        // Render Sign Up Button separately
        if (googleSignupBtn) {
            try {
                // Clear any existing content
                googleSignupBtn.innerHTML = '';
                
                google.accounts.id.renderButton(googleSignupBtn, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    logo_alignment: 'left',
                    text: 'signup_with'
                });
                console.log('✅ Sign Up button rendered');
            } catch (err) {
                console.error('❌ Error rendering Sign Up button:', err);
                renderGoogleFallback(googleSignupBtn, 'Sign up with Google');
            }
        }
        
        console.log('✅ Google Sign-In initialized successfully');
        
    } catch (e) {
        console.error('❌ Google Auth Error:', e);
        if (googleSigninBtn) renderGoogleFallback(googleSigninBtn, 'Sign in with Google');
        if (googleSignupBtn) renderGoogleFallback(googleSignupBtn, 'Sign up with Google');
    }
}

function renderGoogleFallback(container, text) {
    container.innerHTML = `
        <button type="button" class="google-fallback-btn" onclick="showPopup('INFO', 'To enable Google Sign-in: Add your Google Client ID to the connect.js file', 'info')">
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>${text}</span>
        </button>
    `;
}

function setupFormHandlers() {
    document.getElementById('signin-form')?.addEventListener('submit', handleSignIn);
    document.getElementById('member-signin-form')?.addEventListener('submit', handleMemberSignIn);
    document.getElementById('signup-email-form')?.addEventListener('submit', handleSignUpEmail);
    document.getElementById('email-verify-form')?.addEventListener('submit', handleEmailVerify);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignUpPassword);
    document.getElementById('resend-code-btn')?.addEventListener('click', handleResendCode);
    
    // Setup password toggle buttons
    setupPasswordToggle();
}

function setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find the password input in the same container
            const container = btn.closest('.password-input-container');
            const input = container.querySelector('input[type="password"], input[type="text"]');
            const eyeIcon = btn.querySelector('.eye-icon');
            const eyeOffIcon = btn.querySelector('.eye-off-icon');
            
            if (!input) return;
            
            // Toggle input type
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            }
        });
    });
}

async function handleSignIn(e) {
    e.preventDefault();
    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!username || !password) {
        showPopup('ERROR', 'Please enter both email/username and password.', 'danger');
        return;
    }

    showPopup('AUTH', 'Verifying credentials...', 'info');

    try {
        const response = await fetch(`${API_URL}/auth/signin/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username_or_email: username,
                password: password,
                user_type: selectedUserType,
            }),
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userProfile', JSON.stringify(data.user));
            showPopup('SUCCESS', 'Sign in successful! Redirecting...', 'success');
            
            // Route to appropriate dashboard based on user type
            const user = data.user;
            let redirectUrl = './dashboard.html';
            
            if (user.user_type === 'admin') {
                redirectUrl = './team-member.html';
            } else if (user.user_type === 'team_member') {
                redirectUrl = './team-member.html';
            } else {
                redirectUrl = './dashboard.html';
            }
            
            setTimeout(() => window.location.href = redirectUrl, 1500);
        } else {
            showPopup('ERROR', 'Credentials not matched. Please check your email/username and password.', 'danger');
        }
    } catch (error) {
        showPopup('ERROR', 'Network error. Please try again.', 'danger');
        console.error('Sign in error:', error);
    }
}

// Handle Member Sign In
async function handleMemberSignIn(e) {
    e.preventDefault();
    const username = document.getElementById('member-username').value.trim();
    const password = document.getElementById('member-password').value;

    if (!username || !password) {
        showPopup('ERROR', 'Please enter both email/username and password.', 'danger');
        return;
    }

    showPopup('AUTH', 'Verifying credentials...', 'info');

    try {
        const response = await fetch(`${API_URL}/auth/signin/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username_or_email: username,
                password: password,
            }),
        });

        const data = await response.json();
        if (data.success) {
            const user = data.user;
            
            // Check if user is admin or team member
            if (user.user_type !== 'admin' && user.user_type !== 'team_member') {
                showPopup('ERROR', 'This account is not a member/admin account. Please use Client Login.', 'danger');
                return;
            }
            
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userProfile', JSON.stringify(user));
            showPopup('SUCCESS', 'Sign in successful! Redirecting...', 'success');
            
            // Route to appropriate dashboard based on user type
            let redirectUrl = './dashboard.html';
            
            if (user.user_type === 'admin') {
                redirectUrl = './team-member.html';
            } else if (user.user_type === 'team_member') {
                redirectUrl = './team-member.html';
            }
            
            setTimeout(() => window.location.href = redirectUrl, 1500);
        } else {
            showPopup('ERROR', 'Credentials not matched. Please check your email/username and password.', 'danger');
        }
    } catch (error) {
        showPopup('ERROR', 'Network error. Please try again.', 'danger');
        console.error('Member sign in error:', error);
    }
}

// STEP 1: Handle Email Submission for Signup
async function handleSignUpEmail(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showPopup('ERROR', 'Please enter a valid email address.', 'danger');
        return;
    }

    showPopup('AUTH', 'Checking email...', 'info');

    try {
        const response = await fetch(`${API_URL}/auth/check-email/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email }),
        });

        const data = await response.json();
        
        if (data.available || data.success) {
            // Email is available, send verification code
            localStorage.setItem('pendingSignupEmail', email);
            
            showPopup('SUCCESS', 'Sending verification code to your email...', 'success');
            
            // Send verification code
            const sendResponse = await fetch(`${API_URL}/auth/send-verification/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });

            setTimeout(() => {
                // Switch to email verification step
                document.getElementById('signup-step-1').classList.add('hidden');
                document.getElementById('signup-step-2').classList.remove('hidden');
            }, 1500);
        } else {
            showPopup('ERROR', data.message || 'Email already registered. Please sign in or use another email.', 'danger');
        }
    } catch (error) {
        showPopup('ERROR', 'Failed to check email. Please try again.', 'danger');
        console.error('Email check error:', error);
    }
}

// STEP 2: Handle Email Verification Code
async function handleEmailVerify(e) {
    e.preventDefault();
    const email = localStorage.getItem('pendingSignupEmail');
    const code = document.getElementById('verification-code').value.trim();

    if (!email || !code) {
        showPopup('ERROR', 'Please enter the verification code.', 'danger');
        return;
    }

    if (code.length !== 6 || isNaN(code)) {
        showPopup('ERROR', 'Verification code must be 6 digits.', 'danger');
        return;
    }

    showPopup('AUTH', 'Verifying code...', 'info');

    try {
        const response = await fetch(`${API_URL}/auth/verify-email/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, code: code }),
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('verifiedEmail', email);
            showPopup('SUCCESS', 'Email verified! Now set your password.', 'success');
            
            setTimeout(() => {
                // Switch to password setup step
                document.getElementById('signup-step-2').classList.add('hidden');
                document.getElementById('signup-step-3').classList.remove('hidden');
            }, 1500);
        } else {
            showPopup('ERROR', data.message || 'Invalid verification code.', 'danger');
        }
    } catch (error) {
        showPopup('ERROR', 'Verification failed. Please try again.', 'danger');
        console.error('Verification error:', error);
    }
}

// STEP 3: Handle Password Setup and Account Creation
async function handleSignUpPassword(e) {
    e.preventDefault();
    const email = localStorage.getItem('verifiedEmail');
    const name = document.getElementById('signup-name').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;

    // Validation
    if (!name || !username || !password || !confirmPassword) {
        showPopup('ERROR', 'Please fill in all fields.', 'danger');
        return;
    }

    if (password.length < 8) {
        showPopup('ERROR', 'Password must be at least 8 characters.', 'danger');
        return;
    }

    if (password !== confirmPassword) {
        showPopup('ERROR', 'Passwords do not match.', 'danger');
        return;
    }

    if (!termsChecked) {
        showPopup('ERROR', 'Please accept the Terms and Conditions.', 'danger');
        return;
    }

    showPopup('AUTH', 'Creating your account...', 'info');

    try {
        const formData = {
            name: name,
            username: username,
            email: email,
            password: password,
            confirm_password: confirmPassword,
            user_type: selectedUserType,
        };

        const response = await fetch(`${API_URL}/auth/signup/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await response.json();
        
        if (data.success) {
            showPopup('SUCCESS', 'Account created successfully!', 'success');
            
            // Clear stored data
            localStorage.removeItem('pendingSignupEmail');
            localStorage.removeItem('verifiedEmail');
            
            setTimeout(() => {
                // Show success message
                document.getElementById('signup-step-3').classList.add('hidden');
                document.getElementById('signup-step-success').classList.remove('hidden');
            }, 1500);
        } else {
            showPopup('ERROR', data.message || 'Account creation failed.', 'danger');
        }
    } catch (error) {
        showPopup('ERROR', 'Network error. Please try again.', 'danger');
        console.error('Signup error:', error);
    }
}

async function handleResendCode() {
    const email = localStorage.getItem('pendingSignupEmail');
    if (!email) {
        showPopup('ERROR', 'No pending verification found.', 'danger');
        return;
    }

    showPopup('AUTH', 'Sending new verification code...', 'info');

    try {
        const response = await fetch(`${API_URL}/auth/resend-verification/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (data.success) {
            showPopup('SUCCESS', 'New code sent to your email!', 'success');
            document.getElementById('verification-code').value = '';
        } else {
            showPopup('ERROR', data.message || 'Failed to resend code.', 'danger');
        }
    } catch (error) {
        showPopup('ERROR', 'Network error. Please try again.', 'danger');
    }
}

// Helper function to switch to sign in
function switchToSignIn() {
    document.querySelectorAll('.auth-form-wrapper').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('signin').classList.add('active');
    document.querySelector('[data-tab="signin"]')?.classList.add('active');
}

// Popup Utility
function showPopup(title, message, type) {
    const popup = document.getElementById('messagePopup');
    const titleEl = document.getElementById('popupTitle');
    const msgEl = document.getElementById('popupMessage');
    const iconEl = document.getElementById('popupIcon');
    
    titleEl.textContent = title;
    msgEl.textContent = message;
    
    if (type === 'danger') {
        iconEl.textContent = '✗';
        iconEl.style.backgroundColor = '#ef4444';
    } else if (type === 'info') {
        iconEl.textContent = 'ℹ';
        iconEl.style.backgroundColor = '#0ea5e9';
    } else {
        iconEl.textContent = '✓';
        iconEl.style.backgroundColor = '#10b981';
    }
    
    popup.classList.add('active');
    setTimeout(() => popup.classList.remove('active'), 5000);
}

function closePopup() {
    document.getElementById('messagePopup').classList.remove('active');
}

// Terms and Conditions Modal Functions
function openTermsModal(event) {
    event.preventDefault();
    const modal = document.getElementById('termsModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function acceptTerms() {
    const termsCheckbox = document.getElementById('terms-checkbox');
    termsCheckbox.checked = true;
    closeTermsModal();
    showPopup('SUCCESS', 'Terms and Conditions accepted!', 'success');
}

// Close modal when clicking outside the modal content
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeTermsModal();
            }
        });
    }
});

// Google OAuth Handlers
async function handleGoogleSignIn(response) {
    if (!response.credential) {
        showPopup('ERROR', 'Google sign-in failed. Please try again.', 'danger');
        return;
    }

    // Check which form is currently visible
    const signupCardHidden = document.getElementById('signup-card').classList.contains('hidden');
    
    // If signup form is visible, use signup handler
    if (!signupCardHidden) {
        handleGoogleSignUp(response);
        return;
    }
    
    // Otherwise use signin handler
    showPopup('AUTH', 'Signing in with Google...', 'info');

    try {
        const apiResponse = await fetch(`${API_URL}/auth/google-signin/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }),
        });

        const data = await apiResponse.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userProfile', JSON.stringify(data.user));
            showPopup('SUCCESS', 'Google sign in successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = './dashboard.html', 1500);
        } else {
            showPopup('ERROR', data.message || 'Google sign-in failed. Please sign up first.', 'danger');
            console.error('Google signin response:', data);
        }
    } catch (error) {
        showPopup('ERROR', 'Network error during Google sign-in. Make sure backend is running.', 'danger');
        console.error('Google sign-in error:', error);
    }
}

async function handleGoogleSignUp(response) {
    if (!response.credential) {
        showPopup('ERROR', 'Google sign-up failed. Please try again.', 'danger');
        return;
    }

    showPopup('AUTH', 'Creating account with Google...', 'info');

    try {
        // Decode the JWT to get user info (without verification, for demo)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const userInfo = JSON.parse(jsonPayload);

        // Use email as username if not provided
        const username = userInfo.email.split('@')[0] + Math.random().toString(36).substr(2, 5);

        const apiResponse = await fetch(`${API_URL}/auth/google-signup/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: response.credential,
                username: username,
            }),
        });

        const data = await apiResponse.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userProfile', JSON.stringify(data.user));
            showPopup('SUCCESS', 'Account created! Redirecting...', 'success');
            setTimeout(() => window.location.href = './dashboard.html', 1500);
        } else {
            showPopup('ERROR', data.message || 'Google sign-up failed. Please try email/password instead.', 'danger');
            console.error('Google signup response:', data);
        }
    } catch (error) {
        showPopup('ERROR', 'Error processing Google sign-up. Make sure backend is running.', 'danger');
        console.error('Google sign-up error:', error);
    }
}

