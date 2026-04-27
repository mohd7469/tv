const { chromium } = require('playwright');
const path = require('path');

/**
 * Playwright Scanner Script
 * Listens for 'candleUpdates' events from index.html and logs them in Node.js.
 */
(async () => {
    try {
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // Resolve absolute path to local index.html
        const absolutePath = path.resolve(__dirname, 'index.html');
        const fileUrl = `file://${absolutePath.replace(/\\/g, '/')}`;

        // Capture browser console logs
        page.on('console', (msg) => {
            console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
        });

        // Handle browser-side crashes/errors
        page.on('pageerror', (err) => {
            console.error('[BROWSER CRITICAL ERROR]', err.stack || err.message);
        });

        // Expose function to receive event data from the browser
        await page.exposeFunction('handleCandleUpdate', (detail) => {
            try {
                // Ensure data is parsed if it arrived as a string
                const data = typeof detail === 'string' ? JSON.parse(detail) : detail;
                
                console.log('[BACKEND EVENT] candleUpdates received:', new Date().toISOString());
                console.dir(data, { depth: null, colors: true });
            } catch (error) {
                console.error('[BACKEND ERROR] Failed to parse event detail:', error.message);
                console.error('[BACKEND ERROR] Raw detail:', detail);
            }
        });

        // Inject listener before page loads
        await page.addInitScript(() => {
            window.addEventListener('candleUpdates', (event) => {
                if (typeof window.handleCandleUpdate === 'function') {
                    // detail might already be an object or a JSON string
                    window.handleCandleUpdate(event.detail);
                }
            });
        });

        console.log(`[BACKEND] Navigating to: ${fileUrl}`);

        const response = await page.goto(fileUrl, {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        if (!response || !response.ok()) {
            const status = response ? response.status() : 'UNKNOWN';
            throw new Error(`Failed to load index.html (Status: ${status})`);
        }

        console.log('[BACKEND] Scanner successfully initialized. Listening for real-time events...');

        // Keep process alive
        process.on('SIGINT', async () => {
            console.log('\n[BACKEND] Shutting down scanner...');
            await browser.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('[BACKEND FATAL ERROR]', error);
        process.exit(1);
    }
})();
