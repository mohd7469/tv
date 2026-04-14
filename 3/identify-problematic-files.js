#!/usr/bin/env node
/**
 * Identify which specific files are causing JavaScript syntax errors
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const WEBAPP_DIR = path.join(__dirname, 'webapp');
const SERVER_URL = 'http://localhost:8080/';

async function checkFileContent(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check if file contains HTML (common cause of syntax errors)
        const isHtml = content.trim().toLowerCase().startsWith('<!doctype html>') ||
            content.includes('<html') ||
            content.includes('</html>');

        // Check if file is empty or very small
        const isEmpty = content.trim().length === 0;

        // Check for common JavaScript syntax issues
        const hasSyntaxIssue = content.includes('�') ||
            content.includes('��') ||
            (content.includes('<') && content.includes('>') && content.includes('body'));

        return {
            exists: true,
            size: fs.statSync(filePath).size,
            isHtml,
            isEmpty,
            hasSyntaxIssue,
            first100Chars: content.substring(0, 100).replace(/\n/g, '\\n')
        };
    } catch (err) {
        return {
            exists: false,
            error: err.message
        };
    }
}

async function testFileRequest(fileUrl) {
    return new Promise((resolve) => {
        const req = http.get(fileUrl, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const content = Buffer.concat(chunks).toString('utf8');
                resolve({
                    status: res.statusCode,
                    contentType: res.headers['content-type'],
                    isHtml: content.toLowerCase().includes('<html'),
                    size: content.length,
                    sample: content.substring(0, 200).replace(/\n/g, '\\n')
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                error: err.message,
                status: 0
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                error: 'Timeout',
                status: 0
            });
        });
    });
}

async function analyzeProblematicFiles() {
    console.log('🔍 Analyzing problematic files...\n');

    // Common problematic files based on TradingView structure
    const criticalFiles = [
        '/charting_library/charting_library.standalone.js',
        '/charting_library/broker-sample/dist/bundle.js',
        '/charting_library/bundles/runtime.d6871abde1090b0329fe.js',
        '/charting_library/bundles/library.e2f8b3a016c9e1a0b7a5.js',
        '/charting_library/bundles/trading.d818fc89cf23b9916d5b.js',
        '/charting_library/static/bundles/embed/embed_tradingview_datafeed.9e2dc8a846a5be7044d9.js'
    ];

    // Check recently proxied files that might have issues
    const bundlesDir = path.join(WEBAPP_DIR, 'charting_library', 'bundles');
    let recentBundles = [];
    if (fs.existsSync(bundlesDir)) {
        const files = fs.readdirSync(bundlesDir);
        recentBundles = files
            .filter(f => f.endsWith('.js'))
            .slice(0, 10)
            .map(f => `/charting_library/bundles/${f}`);
    }

    const filesToCheck = [...criticalFiles, ...recentBundles];

    console.log('📋 Checking critical files:');
    for (const filePath of filesToCheck) {
        const localPath = path.join(WEBAPP_DIR, filePath.replace(/^\//, ''));
        const fileInfo = await checkFileContent(localPath);

        console.log(`\n${filePath}:`);
        if (!fileInfo.exists) {
            console.log(`  ❌ File does not exist locally`);

            // Test if server can serve it
            const serverResponse = await testFileRequest(SERVER_URL + filePath.replace(/^\//, ''));
            console.log(`  Server response: HTTP ${serverResponse.status}`);
            if (serverResponse.status === 200) {
                console.log(`  Content-Type: ${serverResponse.contentType}`);
                console.log(`  Is HTML: ${serverResponse.isHtml}`);
                if (serverResponse.isHtml) {
                    console.log(`  ⚠️  WARNING: Server returning HTML for JS file!`);
                }
            }
        } else {
            console.log(`  ✅ Exists (${fileInfo.size} bytes)`);
            if (fileInfo.isHtml) {
                console.log(`  ❌ PROBLEM: File contains HTML instead of JavaScript`);
            }
            if (fileInfo.isEmpty) {
                console.log(`  ⚠️  File is empty or very small`);
            }
            if (fileInfo.hasSyntaxIssue) {
                console.log(`  ⚠️  File has syntax issues (special characters)`);
            }
            console.log(`  Preview: ${fileInfo.first100Chars}`);
        }
    }

    // Check for common error patterns
    console.log('\n🔧 Common issues to fix:');

    // 1. Check if bundle.js is actually HTML
    const bundlePath = path.join(WEBAPP_DIR, 'charting_library', 'broker-sample', 'dist', 'bundle.js');
    if (fs.existsSync(bundlePath)) {
        const content = fs.readFileSync(bundlePath, 'utf8');
        if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
            console.log('  1. broker-sample/dist/bundle.js contains HTML - needs replacement');
        }
    }

    // 2. Check server responses for JS files
    console.log('  2. Test server responses for missing JS files');

    // 3. Check error mitigation script
    const errorScriptPath = path.join(WEBAPP_DIR, 'error-mitigation.js');
    if (fs.existsSync(errorScriptPath)) {
        console.log('  3. Error mitigation script exists');
    }

    // Generate fix recommendations
    console.log('\n🎯 RECOMMENDED ACTIONS:');
    console.log('  1. Check all .js files for HTML content');
    console.log('  2. Ensure proxy returns proper JS content, not HTML 404 pages');
    console.log('  3. Update error-mitigation.js to catch syntax errors');
    console.log('  4. Verify all critical TradingView bundles are present');

    // Create a test to verify fixes
    console.log('\n🧪 Test command to verify fixes:');
    console.log('  node -c webapp/charting_library/broker-sample/dist/bundle.js');
}

// Run analysis
analyzeProblematicFiles().catch(err => {
    console.error('Analysis error:', err);
    process.exit(1);
});