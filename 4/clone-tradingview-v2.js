const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const TARGET_URL = 'https://trading-terminal.tradingview-widget.com/';
const OUTPUT_DIR = '3';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Map to store captured resources
const capturedResources = new Map();

// Function to normalize path
function normalizePath(urlPath) {
    // Remove query parameters and hash
    let cleanPath = urlPath.split('?')[0].split('#')[0];

    // Remove leading slash
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }

    // If empty path, use index.html
    if (cleanPath === '') {
        cleanPath = 'index.html';
    }

    // Ensure HTML files have .html extension
    if (cleanPath.endsWith('/')) {
        cleanPath += 'index.html';
    } else if (!path.extname(cleanPath) && !cleanPath.includes('.')) {
        // If no extension and not a dot in path, assume it's a directory
        cleanPath += '/index.html';
    }

    return cleanPath;
}

// Function to determine local path from URL
function getLocalPath(url) {
    try {
        const urlObj = new URL(url);
        let filePath = urlObj.pathname;

        // Special handling for TradingView charting library
        if (filePath.includes('charting_library')) {
            // Keep the charting_library path as is
            return normalizePath(filePath);
        }

        // For root domain files, place in appropriate subdirectories
        if (urlObj.hostname === 'trading-terminal.tradingview-widget.com') {
            return normalizePath(filePath);
        }

        // For external CDN resources, create a cdn directory
        const hostname = urlObj.hostname.replace(/\./g, '_');
        return path.join('cdn', hostname, normalizePath(filePath));
    } catch (error) {
        // If URL parsing fails, generate a safe filename
        const safeName = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
        return path.join('unknown', safeName + '.bin');
    }
}

async function run() {
    console.log('Starting browser...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // Set up request interception to capture all resources
    await page.route('**/*', async (route, request) => {
        const url = request.url();

        // Allow the request to proceed
        await route.continue();
    });

    // Capture all responses
    page.on('response', async (response) => {
        const url = response.url();
        const status = response.status();

        // Skip non-successful responses and data URLs
        if (status < 200 || status >= 300 || url.startsWith('data:') || url.startsWith('blob:')) {
            return;
        }

        // Skip large binary files for now (over 10MB)
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0');
        if (contentLength > 10 * 1024 * 1024) {
            console.log(`Skipping large file: ${url} (${contentLength} bytes)`);
            return;
        }

        try {
            const buffer = await response.body();
            const localPath = getLocalPath(url);
            const fullPath = path.join(OUTPUT_DIR, localPath);
            const dir = path.dirname(fullPath);

            // Create directory if it doesn't exist
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Save file
            fs.writeFileSync(fullPath, buffer);

            // Store resource info
            capturedResources.set(url, {
                localPath,
                status,
                contentType: headers['content-type'] || 'unknown',
                size: buffer.length,
                timestamp: new Date().toISOString()
            });

            console.log(`✓ Saved: ${localPath} (${buffer.length} bytes)`);
        } catch (error) {
            console.error(`✗ Error saving ${url}:`, error.message);
        }
    });

    console.log(`Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, {
        waitUntil: 'networkidle',
        timeout: 120000
    });

    console.log('Page loaded. Waiting for additional resources...');
    await page.waitForTimeout(10000);

    // Interact with the page to trigger lazy loading
    console.log('Interacting with page to trigger lazy loading...');

    try {
        // Click on various UI elements
        await page.mouse.click(400, 200);
        await page.waitForTimeout(1000);

        // Try to find and click chart elements
        await page.mouse.click(600, 300);
        await page.waitForTimeout(1000);

        // Try to open timeframe selector
        const timeframeSelectors = [
            '[data-name="time-button"]',
            '.timeframe-selector',
            '.tv-button[data-name="timeframes"]',
            'button:has-text("1D")',
            'button:has-text("1H")'
        ];

        for (const selector of timeframeSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    await page.waitForTimeout(2000);
                    break;
                }
            } catch (e) {
                // Ignore errors
            }
        }

        // Try to open symbol search
        const symbolSearchSelectors = [
            '[data-name="symbol-search"]',
            '.searchInput',
            'input[placeholder*="Search"]'
        ];

        for (const selector of symbolSearchSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    await page.waitForTimeout(1000);
                    await page.keyboard.type('BTC');
                    await page.waitForTimeout(2000);
                    break;
                }
            } catch (e) {
                // Ignore errors
            }
        }
    } catch (error) {
        console.log('Interaction errors (expected):', error.message);
    }

    // Wait for any additional network activity
    console.log('Waiting for final resources...');
    await page.waitForTimeout(15000);

    console.log(`\nTotal resources captured: ${capturedResources.size}`);

    // Save resource mapping
    const mappingPath = path.join(OUTPUT_DIR, 'resource-mapping.json');
    const mapping = Array.from(capturedResources.entries()).reduce((obj, [url, data]) => {
        obj[url] = data;
        return obj;
    }, {});

    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`Resource mapping saved to ${mappingPath}`);

    // Generate a simple index.html if not captured
    const indexPath = path.join(OUTPUT_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.log('Generating fallback index.html...');
        const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
    <title>TradingView Terminal Clone</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 5px 0; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>TradingView Terminal Clone</h1>
    <p>Cloned from: <a href="${TARGET_URL}">${TARGET_URL}</a></p>
    <p>Total resources captured: ${capturedResources.size}</p>
    <h2>Captured Files:</h2>
    <ul>
        ${Array.from(capturedResources.values())
                .slice(0, 50)
                .map(r => `<li><a href="${r.localPath}">${r.localPath}</a> (${r.size} bytes)</li>`)
                .join('\n        ')}
    </ul>
    ${capturedResources.size > 50 ? `<p>... and ${capturedResources.size - 50} more files</p>` : ''}
</body>
</html>`;
        fs.writeFileSync(indexPath, fallbackHtml);
        console.log(`Fallback index.html created at ${indexPath}`);
    }

    await browser.close();
    console.log('\nDone! Clone completed successfully.');
}

// Run with error handling
run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});