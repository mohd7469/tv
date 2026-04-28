const express = require('express');
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const app = express();
    const PORT = 0; // Automatically finds an available port
    app.use(express.static(__dirname));

    // 1. Start a temporary internal server
    const server = app.listen(PORT, async () => {
        const actualPort = server.address().port;
        const targetUrl = `http://localhost:${actualPort}`;
        
        console.log(`[Node] Virtual Environment started on internal port ${actualPort}`);
        console.log(`[Node] Launching strictly headless environment...`);

        const browser = await chromium.launch({
            headless: true, // No browser window will open
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // 2. Redirect browser logs to terminal
        page.on('console', msg => {
            const text = msg.text();
            // Suppress some noisy TradingView logs if needed, but show data for debugging
            if (text.includes('Payload:')) {
                console.log(`[Browser Data Trigger] ${text}`);
            } else {
                console.log(`[Browser] ${text}`);
            }
        });

        // 3. Expose function to capture data
        await page.exposeFunction('sendDataToNode', (detail) => {
            const timestamp = new Date().toLocaleTimeString();
            try {
                const data = JSON.parse(detail);
                console.log(`\n\x1b[32m[${timestamp}] SUCCESS: Captured Candle Update for ${data.symbol}\x1b[0m`);
                console.log(JSON.stringify(data, null, 2));
            } catch (e) {
                console.log(`[${timestamp}] Captured Raw Data:`, detail);
            }
        });

        // 4. Inject Event Listener
        await page.addInitScript(() => {
            window.addEventListener('candleUpdates', (event) => {
                window.sendDataToNode(event.detail);
            });
        });

        // 5. Load the page through the internal server
        try {
            console.log(`[Node] Loading chart from ${targetUrl}...`);
            await page.goto(targetUrl, { waitUntil: 'networkidle' });
            console.log(`[Node] Page loaded. Waiting for TradingView to initialize and start streaming...`);
            
            // Keep the browser running to wait for data
            // We can add a timeout or check for a specific element if needed
            await page.waitForSelector('#tv_chart_container');
            console.log(`[Node] Chart container detected. Waiting for first tick...`);

        } catch (err) {
            console.error(`[Node] Failed to load virtual environment:`, err.message);
        }

        // Graceful Exit
        process.on('SIGINT', async () => {
            console.log("\n[Node] Closing Virtual Environment...");
            await browser.close();
            server.close();
            process.exit();
        });
    });
})();
