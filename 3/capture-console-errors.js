#!/usr/bin/env node
/**
 * Script to capture and analyze console errors from TradingView terminal
 * Uses Playwright to open the page and log all console messages
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:8080/';
const OUTPUT_FILE = 'console-errors-analysis.json';

async function captureConsoleErrors() {
    console.log('🚀 Launching browser to capture console errors...');
    console.log(`📡 Connecting to: ${SERVER_URL}`);

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Arrays to store captured messages
    const consoleMessages = [];
    const errors = [];
    const warnings = [];
    const logs = [];

    // Capture all console messages
    page.on('console', msg => {
        const message = {
            type: msg.type(),
            text: msg.text(),
            location: msg.location(),
            timestamp: new Date().toISOString()
        };

        consoleMessages.push(message);

        // Categorize
        if (msg.type() === 'error') {
            errors.push(message);
            console.log(`❌ ERROR: ${msg.text()}`);
        } else if (msg.type() === 'warning') {
            warnings.push(message);
            console.log(`⚠️  WARNING: ${msg.text()}`);
        } else {
            logs.push(message);
            console.log(`📝 ${msg.type().toUpperCase()}: ${msg.text()}`);
        }
    });

    // Capture page errors
    page.on('pageerror', error => {
        const pageError = {
            type: 'pageerror',
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        consoleMessages.push(pageError);
        errors.push(pageError);
        console.log(`🔥 PAGE ERROR: ${error.name}: ${error.message}`);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
        const failedRequest = {
            type: 'requestfailed',
            url: request.url(),
            failure: request.failure()?.errorText || 'Unknown',
            method: request.method(),
            timestamp: new Date().toISOString()
        };
        consoleMessages.push(failedRequest);
        errors.push(failedRequest);
        console.log(`🌐 FAILED REQUEST: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    try {
        console.log('🌐 Navigating to page...');
        await page.goto(SERVER_URL, { waitUntil: 'networkidle', timeout: 30000 });

        console.log('⏳ Waiting for page to load (10 seconds)...');
        await page.waitForTimeout(10000);

        // Try to interact with the page to trigger more errors
        console.log('🖱️  Simulating user interactions...');
        try {
            // Click on various elements to trigger lazy loading
            await page.mouse.click(100, 100);
            await page.waitForTimeout(1000);

            // Try to find and click chart elements
            await page.mouse.click(500, 300);
            await page.waitForTimeout(1000);

            // Scroll to trigger more loading
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(2000);
        } catch (interactionError) {
            console.log('⚠️  Interaction error (expected):', interactionError.message);
        }

        // Take a screenshot for visual verification
        const screenshotPath = 'page-screenshot.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);

    } catch (error) {
        console.error('❌ Navigation error:', error.message);
    }

    // Save all captured data
    const analysis = {
        timestamp: new Date().toISOString(),
        url: SERVER_URL,
        summary: {
            totalMessages: consoleMessages.length,
            errors: errors.length,
            warnings: warnings.length,
            logs: logs.length
        },
        errors: errors,
        warnings: warnings,
        logs: logs,
        allMessages: consoleMessages
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(analysis, null, 2));
    console.log(`\n📊 ANALYSIS COMPLETE:`);
    console.log(`   Total messages: ${consoleMessages.length}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Logs: ${logs.length}`);
    console.log(`\n📁 Detailed analysis saved to: ${OUTPUT_FILE}`);

    // Display top errors
    if (errors.length > 0) {
        console.log('\n🔴 TOP ERRORS:');
        errors.slice(0, 10).forEach((error, i) => {
            console.log(`   ${i + 1}. ${error.type}: ${error.message || error.text}`);
        });
    }

    // Generate error categories
    const errorCategories = categorizeErrors(errors);
    console.log('\n📋 ERROR CATEGORIES:');
    Object.entries(errorCategories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} errors`);
    });

    // Generate fix recommendations
    const recommendations = generateFixRecommendations(errorCategories, errors);
    console.log('\n🔧 RECOMMENDED FIXES:');
    recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
    });

    await browser.close();

    // Save recommendations to file
    const recommendationsFile = 'error-fix-recommendations.md';
    fs.writeFileSync(recommendationsFile, generateMarkdownReport(analysis, errorCategories, recommendations));
    console.log(`\n📝 Fix recommendations saved to: ${recommendationsFile}`);
}

function categorizeErrors(errors) {
    const categories = {
        'Network/404': 0,
        'JavaScript Syntax': 0,
        'WebSocket': 0,
        'CORS': 0,
        'Resource Failed': 0,
        'Datafeed/API': 0,
        'Other': 0
    };

    errors.forEach(error => {
        const text = (error.message || error.text || '').toLowerCase();

        if (text.includes('404') || text.includes('not found') || text.includes('failed to load')) {
            categories['Network/404']++;
        } else if (text.includes('syntax') || text.includes('unexpected')) {
            categories['JavaScript Syntax']++;
        } else if (text.includes('websocket')) {
            categories['WebSocket']++;
        } else if (text.includes('cors') || text.includes('cross-origin')) {
            categories['CORS']++;
        } else if (text.includes('failed') && text.includes('request')) {
            categories['Resource Failed']++;
        } else if (text.includes('datafeed') || text.includes('api')) {
            categories['Datafeed/API']++;
        } else {
            categories['Other']++;
        }
    });

    return categories;
}

function generateFixRecommendations(categories, errors) {
    const recommendations = [];

    if (categories['Network/404'] > 0) {
        recommendations.push('Add missing files to proxy configuration or ensure they exist locally');
    }

    if (categories['JavaScript Syntax'] > 0) {
        recommendations.push('Fix JavaScript syntax errors in bundled files or ensure proper file encoding');
    }

    if (categories['WebSocket'] > 0) {
        recommendations.push('Implement WebSocket stub or mock for offline functionality');
    }

    if (categories['CORS'] > 0) {
        recommendations.push('Add CORS headers to local-server.js for cross-origin requests');
    }

    if (categories['Resource Failed'] > 0) {
        recommendations.push('Check network requests and ensure all required resources are available');
    }

    if (categories['Datafeed/API'] > 0) {
        recommendations.push('Implement mock datafeed API for chart data');
    }

    // Specific error patterns
    const uniqueErrors = new Set();
    errors.forEach(error => {
        const text = error.message || error.text || '';
        if (text.includes('Unexpected') && text.includes('at bundle.js')) {
            uniqueErrors.add('Fix bundle.js syntax error - likely HTML being served as JS');
        }
        if (text.includes('charting_library')) {
            uniqueErrors.add('Ensure all charting_library files are properly mirrored');
        }
    });

    uniqueErrors.forEach(rec => recommendations.push(rec));

    return recommendations;
}

function generateMarkdownReport(analysis, categories, recommendations) {
    return `# Console Error Analysis Report
Generated: ${new Date().toISOString()}
URL: ${analysis.url}

## Summary
- Total Messages: ${analysis.summary.totalMessages}
- Errors: ${analysis.summary.errors}
- Warnings: ${analysis.summary.warnings}
- Logs: ${analysis.summary.logs}

## Error Categories
${Object.entries(categories).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}

## Top Errors
${analysis.errors.slice(0, 10).map((err, i) => `${i + 1}. **${err.type}**: ${err.message || err.text || JSON.stringify(err)}`).join('\n')}

## Recommended Fixes
${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Detailed Error Log
\`\`\`json
${JSON.stringify(analysis.errors, null, 2)}
\`\`\`
`;
}

// Run the capture
captureConsoleErrors().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});