const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8080;
const WEBAPP_DIR = __dirname; // Serve from current directory
const ORIGIN_BASE = 'https://trading-terminal.tradingview-widget.com';

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
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
    '.eot': 'application/vnd.ms-fontobject'
};

// Helper to determine content type from extension or response headers
function getContentType(url, headers) {
    const ext = path.extname(url);
    if (MIME_TYPES[ext]) {
        return MIME_TYPES[ext];
    }
    const contentType = headers['content-type'];
    if (contentType) {
        return contentType.split(';')[0];
    }
    return 'application/octet-stream';
}

// Fetch file from origin server
function fetchFromOrigin(url, callback) {
    const targetUrl = url.startsWith('http') ? url : ORIGIN_BASE + url;
    console.log(`[Proxy] Fetching: ${targetUrl}`);

    const parsedUrl = new URL(targetUrl);
    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        }
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (originRes) => {
        const chunks = [];
        originRes.on('data', (chunk) => chunks.push(chunk));
        originRes.on('end', () => {
            const buffer = Buffer.concat(chunks);
            callback(null, {
                statusCode: originRes.statusCode,
                headers: originRes.headers,
                data: buffer
            });
        });
    });

    req.on('error', (err) => {
        console.error(`[Proxy] Fetch error for ${targetUrl}:`, err.message);
        callback(err);
    });

    req.setTimeout(10000, () => {
        req.destroy();
        callback(new Error('Timeout'));
    });

    req.end();
}

// Save file locally
function saveFileLocally(url, data) {
    // Remove leading slash and create safe path
    let filePath = url.replace(/^\//, '');

    // Ensure path is within charting_library directory
    if (!filePath.startsWith('charting_library/')) {
        filePath = 'charting_library/' + filePath;
    }

    const fullPath = path.join(WEBAPP_DIR, filePath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Save the file
    fs.writeFileSync(fullPath, data);
    console.log(`[Proxy] Saved: ${filePath} (${data.length} bytes)`);

    return fullPath;
}

// Main request handler with Proxy-and-Save middleware
const server = http.createServer((req, res) => {
    // Remove query parameters
    const url = req.url.split('?')[0];

    // Skip favicon and other non-essential requests
    if (url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    let filePath = path.join(WEBAPP_DIR, url === '/' ? 'index.html' : url);

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(WEBAPP_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Check if file exists locally
    fs.exists(filePath, (exists) => {
        if (exists) {
            // File exists locally - serve it
            serveFile(filePath, res);
            return;
        }

        // File doesn't exist locally - Proxy-and-Save middleware
        console.log(`[Proxy] Local file not found: ${url}`);

        // Determine if this is a file we should proxy
        const ext = path.extname(url);
        const shouldProxy = ['.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf', '.eot'].includes(ext) ||
            url.includes('bundle') ||
            url.includes('charting_library');

        if (!shouldProxy) {
            // Not a proxy-able file, fall back to index.html for SPA routing
            if (url !== '/') {
                filePath = path.join(WEBAPP_DIR, 'index.html');
                fs.exists(filePath, (indexExists) => {
                    if (!indexExists) {
                        res.writeHead(404);
                        res.end('File not found');
                        return;
                    }
                    serveFile(filePath, res);
                });
            } else {
                res.writeHead(404);
                res.end('File not found');
            }
            return;
        }

        // Fetch from origin server
        fetchFromOrigin(url, (err, result) => {
            if (err || !result || result.statusCode !== 200) {
                console.log(`[Proxy] Failed to fetch ${url} from origin, serving placeholder`);

                // Determine appropriate content type for placeholder
                const contentType = getContentType(url, {});

                // Serve a safe placeholder based on file type
                if (ext === '.js') {
                    res.writeHead(200, {
                        'Content-Type': 'application/javascript',
                        'Cache-Control': 'no-cache'
                    });
                    res.end(`// Placeholder for ${url}\nconsole.warn("File not available:", "${url}");\nexport {};`);
                } else if (ext === '.css') {
                    res.writeHead(200, {
                        'Content-Type': 'text/css',
                        'Cache-Control': 'no-cache'
                    });
                    res.end(`/* Placeholder CSS for ${url} */`);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                }
                return;
            }

            // Check if response is HTML despite 200 status (e.g., error page)
            const dataStr = result.data.toString('utf8', 0, 100).toLowerCase();
            const isHtml = dataStr.includes('<!doctype') || dataStr.includes('<html') ||
                (dataStr.includes('<') && dataStr.includes('>') &&
                    (dataStr.includes('body') || dataStr.includes('head') || dataStr.includes('title')));

            if (isHtml) {
                console.log(`[Proxy] Origin returned HTML instead of expected content for ${url}, serving placeholder`);

                // Serve a safe placeholder based on file type
                if (ext === '.js') {
                    res.writeHead(200, {
                        'Content-Type': 'application/javascript',
                        'Cache-Control': 'no-cache'
                    });
                    res.end(`// Placeholder for ${url}\nconsole.warn("File not available:", "${url}");\nexport {};`);
                } else if (ext === '.css') {
                    res.writeHead(200, {
                        'Content-Type': 'text/css',
                        'Cache-Control': 'no-cache'
                    });
                    res.end(`/* Placeholder CSS for ${url} */`);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                }
                return;
            }

            // Successfully fetched from origin - save locally
            try {
                const savedPath = saveFileLocally(url, result.data);

                // Serve the fetched content with original headers
                const contentType = getContentType(url, result.headers);
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-cache',
                    'X-Proxy-Source': 'origin'
                });
                res.end(result.data);
            } catch (saveErr) {
                console.error(`[Proxy] Error saving file:`, saveErr.message);
                // Still serve the content even if save fails
                const contentType = getContentType(url, result.headers);
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-cache'
                });
                res.end(result.data);
            }
        });
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Server error: ' + err.code);
            return;
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        res.end(content, 'utf8');
    });
}

server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`TradingView Clone Server with Proxy-and-Save`);
    console.log(`========================================`);
    console.log(`Local: http://localhost:${PORT}/`);
    console.log(`Serving from: ${WEBAPP_DIR}`);
    console.log(`Origin: ${ORIGIN_BASE}`);
    console.log(`Features:`);
    console.log(`• Serves local files from webapp/`);
    console.log(`• Proxies missing files from TradingView server`);
    console.log(`• Automatically saves fetched files locally`);
    console.log(`• Next request will use local copy`);
    console.log(`========================================`);
});