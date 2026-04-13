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

async function run() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept network requests
  page.on('request', (request) => {
    const url = request.url();
    // Skip data URLs and blob URLs
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return;
    }
    console.log(`Request: ${url}`);
  });

  page.on('response', async (response) => {
    const url = response.url();
    const request = response.request();
    const method = request.method();
    
    // Skip non-GET requests and data URLs
    if (method !== 'GET' || url.startsWith('data:') || url.startsWith('blob:')) {
      return;
    }

    try {
      const status = response.status();
      if (status >= 200 && status < 300) {
        const headers = response.headers();
        const contentType = headers['content-type'] || '';
        
        // Determine file extension from content-type or URL
        let extension = '.bin';
        if (contentType.includes('text/html')) extension = '.html';
        else if (contentType.includes('text/css')) extension = '.css';
        else if (contentType.includes('javascript')) extension = '.js';
        else if (contentType.includes('json')) extension = '.json';
        else if (contentType.includes('image/png')) extension = '.png';
        else if (contentType.includes('image/jpeg')) extension = '.jpg';
        else if (contentType.includes('image/svg+xml')) extension = '.svg';
        else if (contentType.includes('font/woff')) extension = '.woff';
        else if (contentType.includes('font/woff2')) extension = '.woff2';
        else if (contentType.includes('font/ttf')) extension = '.ttf';
        
        // Parse URL to get path
        const urlObj = new URL(url);
        let filePath = urlObj.pathname;
        
        // If root path, use index.html
        if (filePath === '/' || filePath === '') {
          filePath = '/index.html';
        }
        
        // Remove leading slash
        if (filePath.startsWith('/')) {
          filePath = filePath.substring(1);
        }
        
        // If no extension in path, add determined extension
        if (!path.extname(filePath)) {
          filePath += extension;
        }
        
        // Ensure filePath is within output directory
        const fullPath = path.join(OUTPUT_DIR, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Get response body
        const buffer = await response.body();
        
        // Save file
        fs.writeFileSync(fullPath, buffer);
        console.log(`Saved: ${filePath} (${buffer.length} bytes)`);
        
        // Store mapping for later path updates
        capturedResources.set(url, {
          localPath: filePath,
          contentType,
          size: buffer.length
        });
      }
    } catch (error) {
      console.error(`Error processing ${url}:`, error.message);
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
  
  console.log('Page loaded. Interacting to trigger lazy-loaded resources...');
  
  // Wait a bit for initial load
  await page.waitForTimeout(5000);
  
  // Try to interact with the page to trigger more loads
  // Click on various elements that might trigger lazy loading
  try {
    // Try to find and click chart elements
    await page.mouse.click(500, 300);
    await page.waitForTimeout(1000);
    
    // Try to open watchlist if exists
    const watchlistButton = await page.$('[data-name="watchlist"]');
    if (watchlistButton) {
      await watchlistButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Try to change timeframe
    const timeframeButton = await page.$('[data-name="timeframes"]');
    if (timeframeButton) {
      await timeframeButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.log('Interaction error (expected):', error.message);
  }
  
  // Wait for any additional network activity
  await page.waitForTimeout(10000);
  
  console.log(`Captured ${capturedResources.size} resources`);
  
  // Save resource mapping
  const mappingPath = path.join(OUTPUT_DIR, 'resource-mapping.json');
  const mapping = Array.from(capturedResources.entries()).reduce((obj, [url, data]) => {
    obj[url] = data;
    return obj;
  }, {});
  
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`Resource mapping saved to ${mappingPath}`);
  
  await browser.close();
  console.log('Done!');
}

run().catch(console.error);