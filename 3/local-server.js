const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const WEBAPP_DIR = path.join(__dirname, 'webapp');
const CHARTING_LIB_DIR = path.join(WEBAPP_DIR, 'charting_library');

// Ensure directories exist
[WEBAPP_DIR, CHARTING_LIB_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

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

// Create server
const server = http.createServer(async (req, res) => {
    const url = req.url;

    // Skip favicon
    if (url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Determine file path
    let filePath = url === '/' ? 'index.html' : url;
    filePath = path.join(WEBAPP_DIR, filePath);

    // Security check
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(WEBAPP_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File doesn't exist
            console.log(`[Server] Not found: ${url}`);

            // For SPA routing, fall back to index.html for paths without extensions
            if (url !== '/' && !url.includes('.')) {
                const indexPath = path.join(WEBAPP_DIR, 'index.html');
                fs.access(indexPath, fs.constants.F_OK, (indexErr) => {
                    if (indexErr) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('File not found');
                        return;
                    }

                    // Serve index.html
                    fs.readFile(indexPath, (err, data) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal server error');
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(data);
                    });
                });
                return;
            }

            // Not found
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        // File exists - serve it
        console.log(`[Server] Serving: ${url}`);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, max-age=0',
                'X-Served-From': 'local'
            });
            res.end(data);
        });
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`TradingView Local Server`);
    console.log(`===============================================`);
    console.log(`Local: http://localhost:${PORT}/`);
    console.log(`Webapp Dir: ${WEBAPP_DIR}`);
    console.log(`Features:`);
    console.log(`• Simple static file server`);
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