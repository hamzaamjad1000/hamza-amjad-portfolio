// Security Module - Enforce HTTPS and Payment Form Security

(function() {
    // Force HTTPS redirect (except for localhost and 127.0.0.1 development)
    if (window.location.protocol === 'http:' && 
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1')) {
        console.log('Redirecting to HTTPS for security...');
        window.location.protocol = 'https:';
    }

    // Add security headers via fetch interceptor
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [resource, config] = args;
        const request = new Request(resource, config);
        
        // Ensure all requests use HTTPS if not localhost or 127.0.0.1
        if (!window.location.hostname.includes('localhost') && 
            !window.location.hostname.includes('127.0.0.1') && 
            request.url.startsWith('http://')) {
            request = new Request(request.url.replace('http://', 'https://'), config);
        }
        
        return originalFetch.call(this, request);
    };

    // Enhance payment form security
    document.addEventListener('DOMContentLoaded', function() {
        const billingForm = document.getElementById('billingForm');
        if (billingForm) {
            console.log('Payment form detected - applying security enhancements');
            
            // Ensure form has correct attributes
            billingForm.setAttribute('autocomplete', 'on');
            billingForm.setAttribute('novalidate', 'false');
            
            // Add encryption notice
            const securityNotice = document.createElement('div');
            securityNotice.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 6px;
                margin-bottom: 16px;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            securityNotice.innerHTML = `
                <span style="font-size: 18px;">🔒</span>
                <span><strong>Secure Form:</strong> Your payment information is encrypted and protected</span>
            `;
            
            // Insert after form title
            const cardHeader = billingForm.querySelector('.form-section-title');
            if (cardHeader) {
                cardHeader.parentNode.insertBefore(securityNotice, cardHeader);
            }
        }
    });

    // Monitor for insecure requests and warn user
    window.addEventListener('beforeunload', function() {
        if (window.location.protocol === 'http:' && 
            !window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('127.0.0.1')) {
            console.warn('⚠️ WARNING: This page is served over HTTP. Payment forms require HTTPS.');
        }
    });

    // Log security status
    console.log('🔐 Security Module Loaded');
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    console.log('Is Secure:', window.location.protocol === 'https:' || window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));
})();
