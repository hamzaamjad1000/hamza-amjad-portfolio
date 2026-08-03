// API Configuration - Auto-detect backend URL
function getApiUrl() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If we're on ngrok (contains 'ngrok'), use ngrok backend with HTTPS
    if (hostname.includes('ngrok')) {
        return `https://${hostname}/api`;
    }
    
    // If we're on localhost or 127.0.0.1, use HTTP for development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://127.0.0.1:8000/api';
    }
    
    // Use HTTPS protocol for production security
    const secureProtocol = protocol === 'http:' ? 'https:' : protocol;
    return `${secureProtocol}//${hostname}:8000/api`;
}

const API_URL = getApiUrl();

// Log API URL for debugging
console.log('API URL:', API_URL);

