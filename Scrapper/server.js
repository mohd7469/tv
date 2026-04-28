const express = require('express');
const path = require('path');
const { chromium } = require('playwright');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let browser;
let page;

const server = app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Initializing Playwright Virtual Environment...");
    
    try {
        browser = await chromium.launch({
            headless: false, // Show the browser window
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const context = await browser.newContext();
        page = await context.newPage();

        // Redirect browser console logs to Node.js
        page.on('console', msg => console.log('[Browser]', msg.text()));

        // Expose a function to the browser to send data back to Node
        await page.exposeFunction('sendDataToNode', (data) => {
            console.log("\x1b[32m%s\x1b[0m", ">>> Node.js Captured Candle Update:");
            try {
                const parsed = JSON.parse(data);
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log(data);
            }
        });

        // Inject a listener into the page to catch the 'candleUpdates' event
        // In Playwright, we use addInitScript instead of evaluateOnNewDocument
        await page.addInitScript(() => {
            window.addEventListener('candleUpdates', (event) => {
                // Call the exposed Node.js function
                window.sendDataToNode(event.detail);
            });
        });

        // Navigate to the local server
        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
        
        console.log("Playwright virtual environment is now running and listening for events.");
    } catch (err) {
        console.error("Failed to launch Playwright virtual environment:", err);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log("Shutting down...");
    if (browser) await browser.close();
    server.close();
    process.exit();
});
