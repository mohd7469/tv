const fs = require('fs');
const path = require('path');

const INDEX_FILE = '3/index.html';
const CDN_BASE = './cdn';

// Mapping of remote URLs to local paths
const urlMappings = [
    {
        remote: 'https://s3.tradingview.com/external-embedding/embed-widget-tradingview-datafeed.js',
        local: `${CDN_BASE}/s3_tradingview_com/external-embedding/embed-widget-tradingview-datafeed.js`
    },
    {
        remote: 'https://demo-feed-data.tradingview.com/tv_news',
        local: `${CDN_BASE}/demo-feed-data_tradingview_com/tv_news/index.html`
    },
    // Keep charts_storage_url as remote since it's an API
    // Keep other remote URLs as they are for now
];

function updateFile() {
    console.log(`Reading ${INDEX_FILE}...`);
    let content = fs.readFileSync(INDEX_FILE, 'utf8');
    let updated = false;

    // Apply mappings
    for (const mapping of urlMappings) {
        if (content.includes(mapping.remote)) {
            console.log(`Replacing: ${mapping.remote}`);
            console.log(`     With: ${mapping.local}`);
            content = content.replace(new RegExp(mapping.remote, 'g'), mapping.local);
            updated = true;
        }
    }

    // Also update any other remote URLs that have been captured
    // Look for https:// and http:// in src and href attributes
    const remoteUrlRegex = /(src|href)=["'](https?:\/\/[^"']+)["']/g;
    let match;
    const remoteUrls = new Set();

    while ((match = remoteUrlRegex.exec(content)) !== null) {
        remoteUrls.add(match[2]);
    }

    console.log(`\nFound ${remoteUrls.size} remote URLs in the file:`);
    for (const url of remoteUrls) {
        console.log(`  - ${url}`);
    }

    if (updated) {
        fs.writeFileSync(INDEX_FILE, content);
        console.log(`\nUpdated ${INDEX_FILE} with local paths.`);
    } else {
        console.log(`\nNo changes made to ${INDEX_FILE}.`);
    }

    return updated;
}

// Run the update
try {
    updateFile();
    console.log('\nPath update completed.');
} catch (error) {
    console.error('Error updating paths:', error);
    process.exit(1);
}