const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const WEBAPP_DIR = path.join(__dirname, 'webapp');
const CHARTING_LIB_DIR = path.join(WEBAPP_DIR, 'charting_library');

// Ensure directories exist
[WEBAPP_DIR, CHARTING_LIB_DIR].forEach(dir => {
    if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.wasm': 'application/wasm',
    '.map': 'application/json',
    '.txt': 'text/plain',
    '.xml': 'application/xml'
};

// Helper to determine content type
function getContentType(url) {
    const ext = path.extname(url).toLowerCase();
    if (MIME_TYPES[ext]) {
        return MIME_TYPES[ext];
    }
    return 'application/octet-stream';
}

// Static file serving for webapp directory
app.use(express.static(WEBAPP_DIR, {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath);
        if (MIME_TYPES[ext]) {
            res.setHeader('Content-Type', MIME_TYPES[ext]);
        }
        res.setHeader('Cache-Control', 'no-cache, max-age=0');
    }
}));

// Custom middleware to handle SPA routing and proper MIME types
app.use(async (req, res, next) => {
    const urlPath = req.path;

    // Skip favicon and other non-essential requests
    if (urlPath === '/favicon.ico') {
        res.status(204).end();
        return;
    }

    // Determine local file path
    let localPath = urlPath === '/' ? 'index.html' : urlPath;
    let filePath = path.join(WEBAPP_DIR, localPath);

    // Security check
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(WEBAPP_DIR)) {
        res.status(403).send('Forbidden');
        return;
    }

    try {
        // Check if file exists locally
        await fs.access(filePath);

        // Serve local file
        console.log(`[Server] Serving: ${urlPath}`);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-cache, max-age=0');
        res.setHeader('X-Served-From', 'local');

        const content = await fs.readFile(filePath);
        res.send(content);
        return;
    } catch (err) {
        // File doesn't exist locally
        console.log(`[Server] Not found: ${urlPath}`);

        // For SPA routing, fall back to index.html for paths without extensions
        if (urlPath !== '/' && !urlPath.includes('.')) {
            const indexPath = path.join(WEBAPP_DIR, 'index.html');
            try {
                await fs.access(indexPath);
                const content = await fs.readFile(indexPath);
                res.setHeader('Content-Type', 'text/html');
                res.send(content);
                return;
            } catch (indexErr) {
                // index.html also doesn't exist
                res.status(404).send('File not found');
                return;
            }
        }

        // Not found
        res.status(404).send('File not found');
        return;
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`TradingView Local Server (Express)`);
    console.log(`===============================================`);
    console.log(`Local: http://localhost:${PORT}/`);
    console.log(`Webapp Dir: ${WEBAPP_DIR}`);
    console.log(`Features:`);
    console.log(`• Express-based static file server`);
    console.log(`• Serves local files from ${WEBAPP_DIR}`);
    console.log(`• SPA routing support (falls back to index.html)`);
    console.log(`• No auto-healing - files must be manually downloaded`);
    console.log(`===============================================`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down...');
    server.close(() => {
        console.log('[Server] Closed');
        process.exit(0);
    });
});

module.exports = app;