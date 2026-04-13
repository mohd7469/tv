const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const ROOT_DIR = '3';

const mimeTypes = {
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
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Handle root path
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(ROOT_DIR, filePath);

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');

    fs.readFile(normalizedPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end(`Server error: ${err.code}`);
            }
            return;
        }

        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving files from ${ROOT_DIR}/`);
    console.log(`Open http://localhost:${PORT}/ in your browser to test the clone.`);

    // Try to open browser automatically (optional)
    const { platform } = process;
    let openCommand;

    if (platform === 'win32') {
        openCommand = `start http://localhost:${PORT}`;
    } else if (platform === 'darwin') {
        openCommand = `open http://localhost:${PORT}`;
    } else {
        openCommand = `xdg-open http://localhost:${PORT}`;
    }

    exec(openCommand, (err) => {
        if (err) {
            console.log(`Could not open browser automatically. Please open http://localhost:${PORT} manually.`);
        }
    });
});