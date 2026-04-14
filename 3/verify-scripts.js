const fs = require('fs-extra');
const path = require('path');
const http = require('http');

const WEBAPP_DIR = 'webapp';

console.log('Verifying all script files in index.html...\n');

// Read index.html
const indexPath = path.join(WEBAPP_DIR, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// Extract all script tags
const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
const scripts = [];
let match;
while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
}

console.log(`Found ${scripts.length} script tags:\n`);

// Check each script
let allValid = true;
for (const scriptSrc of scripts) {
    console.log(`Checking: ${scriptSrc}`);
    
    // Check if file exists locally
    const localPath = path.join(WEBAPP_DIR, scriptSrc);
    const exists = fs.existsSync(localPath);
    
    if (exists) {
        const stats = fs.statSync(localPath);
        console.log(`  ✓ File exists (${stats.size} bytes)`);
        
        // Check if it's a valid JS file (not HTML)
        const content = fs.readFileSync(localPath, 'utf8', 0, 100);
        if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
            console.log(`  ✗ File appears to be HTML, not JavaScript`);
            allValid = false;
        }
    } else {
        console.log(`  ✗ File does not exist locally`);
        allValid = false;
        
        // Try to find it in charting_library directory
        const altPath = path.join(WEBAPP_DIR, 'charting_library', scriptSrc);
        if (fs.existsSync(altPath)) {
            console.log(`  → Found at: charting_library/${scriptSrc}`);
            console.log(`  → Consider updating index.html path`);
        }
    }
    console.log();
}

// Also check for dynamically loaded bundles
console.log('Checking for bundle files in charting_library/bundles/...');
const bundlesDir = path.join(WEBAPP_DIR, 'charting_library', 'bundles');
if (fs.existsSync(bundlesDir)) {
    const bundleFiles = fs.readdirSync(bundlesDir).filter(f => f.endsWith('.js'));
    console.log(`Found ${bundleFiles.length} bundle files`);
    
    // Check a few random bundles
    const sampleBundles = bundleFiles.slice(0, 5);
    console.log('Sample bundles:');
    sampleBundles.forEach(bundle => {
        const bundlePath = path.join(bundlesDir, bundle);
        const stats = fs.statSync(bundlePath);
        console.log(`  ${bundle}: ${stats.size} bytes`);
    });
}

// Test server accessibility
console.log('\nTesting server accessibility for key scripts...');
const testPaths = [
    '/charting_library/broker-sample/dist/bundle.js',
    '/charting_library/charting_library.standalone.js',
    '/charting_library/external-embedding/embed-widget-tradingview-datafeed.js'
];

function testServer(path) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: 'GET',
            timeout: 2000
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    isHtml: data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html'),
                    length: data.length
                });
            });
        });
        
        req.on('error', () => resolve({ error: true }));
        req.on('timeout', () => resolve({ timeout: true }));
        req.end();
    });
}

(async () => {
    for (const testPath of testPaths) {
        const result = await testServer(testPath);
        if (result.error) {
            console.log(`  ${testPath}: Server error (make sure server is running)`);
        } else if (result.timeout) {
            console.log(`  ${testPath}: Timeout`);
        } else if (result.status === 200 && !result.isHtml) {
            console.log(`  ${testPath}: ✓ Accessible (${result.length} bytes)`);
        } else if (result.isHtml) {
            console.log(`  ${testPath}: ✗ Returns HTML (likely 404)`);
            allValid = false;
        } else {
            console.log(`  ${testPath}: Status ${result.status}`);
        }
    }
    
    console.log('\n=== Verification Summary ===');
    if (allValid) {
        console.log('✓ All scripts appear to be correctly configured');
        console.log('Note: Some dynamic bundles may still load at runtime');
    } else {
        console.log('✗ Some script issues detected');
        console.log('Recommendations:');
        console.log('1. Check browser console for specific error URLs');
        console.log('2. Update paths in index.html if files are in charting_library/');
        console.log('3. Ensure server is running from correct directory');
    }
    
    console.log('\nTo fix path issues, you may need to:');
    console.log('1. Update additional script src attributes in index.html');
    console.log('2. Run the path mapping script again: node process-local.js');
    console.log('3. Restart server after changes');
})();