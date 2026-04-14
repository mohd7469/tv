// Error mitigation for TradingView clone
window.addEventListener('error', function(e) {
    // Suppress common errors that don't affect rendering
    const suppressedPatterns = [
        'WebSocket',
        'datafeed',
        'network error',
        'Failed to fetch',
        'net::ERR_INTERNET_DISCONNECTED'
    ];
    
    const errorMsg = e.message.toLowerCase();
    for (const pattern of suppressedPatterns) {
        if (errorMsg.includes(pattern.toLowerCase())) {
            e.preventDefault();
            console.warn('[Suppressed error]:', e.message);
            return;
        }
    }
});

// Override console.error to filter out common TradingView errors
const originalConsoleError = console.error;
console.error = function(...args) {
    const errorMsg = args.join(' ').toLowerCase();
    const ignoredErrors = [
        'websocket',
        'datafeed',
        'network',
        'failed to load',
        'cross origin',
        'cors'
    ];
    
    for (const ignored of ignoredErrors) {
        if (errorMsg.includes(ignored)) {
            console.warn('[Filtered error]:', ...args);
            return;
        }
    }
    
    originalConsoleError.apply(console, args);
};

console.log('TradingView error mitigation enabled');