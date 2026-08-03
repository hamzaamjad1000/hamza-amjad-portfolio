/* ==========================================
   AUTHENTICATION STATUS CHECK
   ========================================== */
function updateAuthButton() {
    const hireBtn = document.querySelector('.hire-btn');
    
    if (!hireBtn) return;
    
    const authToken = localStorage.getItem('authToken');
    const userProfile = localStorage.getItem('userProfile');
    
    if (authToken && userProfile) {
        // User is authenticated
        try {
            const user = JSON.parse(userProfile);
            
            // Update button on header
            hireBtn.innerHTML = `<span class="btn-badge">✓</span> <span>${user.name}</span>`;
                        hireBtn.href = './dashboard.html';
            hireBtn.classList.add('authenticated');
            hireBtn.style.background = 'linear-gradient(135deg, #002147 0%, #003d7a 100%)';
            
            hireBtn.title = `Dashboard - ${user.email}`;
        } catch (e) {
            // Invalid JSON, clear auth
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
        }
    } else {
        // User is not authenticated
        hireBtn.innerHTML = 'Connect';
        hireBtn.href = 'connect.html';
        hireBtn.classList.remove('authenticated');
        hireBtn.style.background = '';
        
        hireBtn.style.boxShadow = '';
        hireBtn.title = 'Connect with us';
    }
}

// Update on every page load and periodically
window.addEventListener('load', updateAuthButton);
// Also check every 2 seconds if auth state changed (from other tabs/windows)
setInterval(updateAuthButton, 2000);
updateAuthButton();

/* ==========================================
   DARK MODE TOGGLE
   ========================================== */
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
}

// Toggle dark mode
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateHeaderBackground();
});

// Apply theme immediately to avoid flashing
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
} else {
    body.classList.remove('dark-mode');
}

/* ==========================================
   SMOOTH SCROLL & NAVIGATION
   ========================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

/* ==========================================
   SCROLL ANIMATIONS
   ========================================== */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply scroll animations to sections and cards
document.querySelectorAll('section:not(.no-animate), .skill-card:not(.no-animate), .project-card:not(.no-animate), .exp-card:not(.no-animate), .edu-card:not(.no-animate), .timeline-content:not(.no-animate)').forEach(el => {
    // Check if element is already in viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
        // If already in view, show it immediately without animation delay
        el.classList.add('visible');
    } else {
        el.classList.add('scroll-animate');
        observer.observe(el);
    }
});

/* ==========================================
   HEADER SCROLL EFFECT
   ========================================== */
const header = document.querySelector('.header');

function updateHeaderBackground() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const isDarkMode = body.classList.contains('dark-mode');
    
    if (scrollTop > 50) {
        header.style.background = isDarkMode ? 'rgba(5, 7, 10, 0.95)' : 'rgba(253, 253, 253, 0.95)';
    } else {
        header.style.background = isDarkMode ? 'rgba(5, 7, 10, 0.7)' : 'rgba(253, 253, 253, 0.7)';
    }
}

window.addEventListener('scroll', updateHeaderBackground);
updateHeaderBackground(); // Initialize on load

/* ==========================================
   ACTIVE NAV LINK HIGHLIGHT
   ========================================== */
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = header.offsetHeight;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 10;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

/* ==========================================
   TERMINAL TYPING ANIMATION
   ========================================== */
async function typeTerminalLines() {
    const terminalBody = document.querySelector('.terminal-body');
    if (!terminalBody) return;

    const lines = [
        { text: ' hamza.init()', type: 'prompt' },
        { text: ' [OK] Core systems initialized.', type: 'status' },
        { text: ' hamza.loadSkills()', type: 'prompt' },
        { text: ' [OK] AI, Full-Stack, Backend loaded.', type: 'status' },
        { text: ' hamza.status', type: 'prompt' },
        { text: ' "Ready for project deployment."', type: 'intense' }
    ];

    terminalBody.innerHTML = '';
    const cursor = document.createElement('div');
    cursor.className = 'terminal-cursor';
    terminalBody.appendChild(cursor);

    for (const line of lines) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'terminal-line ' + (line.type === 'intense' ? 'intense' : '');
        
        const prefix = document.createElement('span');
        prefix.className = line.type === 'prompt' ? 'prompt' : (line.type === 'status' ? 'status' : '');
        prefix.textContent = line.type === 'prompt' ? '>' : (line.type === 'status' ? '' : '');
        
        lineDiv.appendChild(prefix);
        const textNode = document.createTextNode('');
        lineDiv.appendChild(textNode);
        
        terminalBody.insertBefore(lineDiv, cursor);

        // Type the text
        for (let i = 0; i < line.text.length; i++) {
            textNode.textContent += line.text[i];
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

/* ==========================================
   PARALLAX EFFECT
   ========================================== */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let parallaxTicking = false;

window.addEventListener('scroll', () => {
    if (prefersReducedMotion || window.innerWidth <= 1024) return;
    if (parallaxTicking) return;

    parallaxTicking = true;
    window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        document.querySelectorAll('.hero-background').forEach(element => {
            element.style.transform = `translateY(${scrolled * 0.45}px)`;
        });
        parallaxTicking = false;
    });
}, { passive: true });

/* ==========================================
   CONTACT FORM HANDLING
   ========================================== */
// API_URL is set in config.js (loads before this file)
// This file uses the global API_URL variable

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const formMessage = document.getElementById('formMessage');
        const originalText = submitBtn.textContent;
        
        // Reset message
        if (formMessage) {
            formMessage.textContent = 'CONNECTING TO SECURE_SERVER...';
            formMessage.style.color = 'var(--accent-official)';
        }

        const messageVal = document.getElementById('message').value;
        
        submitBtn.textContent = 'TRANSMITTING...';
        submitBtn.disabled = true;
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: messageVal
        };

        try {
            const response = await fetch(`${API_URL}/contact/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Success
                submitBtn.textContent = 'MESSAGE_SENT // ✓';
                submitBtn.style.background = '#10b981'; // Green
                submitBtn.style.borderColor = '#10b981';
                
                if (formMessage) {
                    formMessage.textContent = data.message || 'SUCCESS: MESSAGE RECEIVED BY SYSTEM.';
                    formMessage.style.color = '#10b981';
                }
                
                this.reset();
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    submitBtn.style.borderColor = '';
                    if (formMessage) formMessage.textContent = '';
                }, 5000);
            } else {
                // Backend error
                throw new Error(data.message || 'TRANSMISSION_FAILED');
            }
        } catch (error) {
            console.error('Contact Form Error:', error);
            submitBtn.textContent = 'RETRY_TRANSMISSION';
            submitBtn.disabled = false;
            submitBtn.style.background = '#ef4444'; // Red
            submitBtn.style.borderColor = '#ef4444';
            
            if (formMessage) {
                formMessage.textContent = `ERROR: ${error.message}`;
                formMessage.style.color = '#ef4444';
            }

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.style.borderColor = '';
            }, 5000);
        }
    });
}

/* ==========================================
   MOUSE FOLLOW EFFECT (SUBTLE)
   ========================================== */
const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;
if (supportsFinePointer && window.innerWidth > 1024) {
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth) - 0.5;
        const mouseY = (e.clientY / window.innerHeight) - 0.5;

        document.querySelectorAll('.project-card').forEach(card => {
            card.style.transform = `perspective(1000px) rotateY(${mouseX * 2}deg) rotateX(${-mouseY * 2}deg)`;
        });
    });
}

/* ==========================================
   SECURITY BADGE ENHANCEMENT
   ========================================== */
const securityBadge = document.querySelector('.security-badge');
if (securityBadge) {
    securityBadge.addEventListener('mouseenter', () => {
        const dot = securityBadge.querySelector('.security-dot');
        dot.style.animation = 'blink 0.2s infinite';
        const originalText = securityBadge.textContent;
        securityBadge.lastChild.textContent = ' SCANNING...';
        
        setTimeout(() => {
            dot.style.animation = 'blink 2s infinite';
            securityBadge.lastChild.textContent = ' LEVEL: PUBLIC';
        }, 1500);
    });
}

/* ==========================================
   PAGE INITIALIZATION
   ========================================== */
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    
    // Start terminal animation
    typeTerminalLines();

    // Typewriter effect for hero subtitle
    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                subtitle.textContent += text[i];
                i++;
                setTimeout(type, 50);
            }
        }
        setTimeout(type, 1000);
    }

    // Ripple effect
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', createRipple);
    });
});

function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// Global styles for ripples and animations
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    @keyframes ripple-animation { to { transform: scale(4); opacity: 0; } }
    body { opacity: 0; transition: opacity 0.5s ease; }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

console.log('Hamza Amjad Portfolio - Bureau Mode Active ✓');
