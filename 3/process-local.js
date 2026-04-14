const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = 'webapp';
const CHARTING_LIB_DIR = path.join(OUTPUT_DIR, 'charting_library');

async function processForLocalPaths() {
    console.log('Processing files for local path mapping...');

    // Read index.html
    const indexPath = path.join(OUTPUT_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.log('index.html not found');
        return;
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    // Replace absolute URLs with relative paths
    const replacements = [
        {
            pattern: /https?:\/\/trading-terminal\.tradingview-widget\.com\//g,
            replacement: './'
        },
        {
            pattern: /https?:\/\/trading-terminal\.tradingview-widget\.com\/charting_library\//g,
            replacement: './charting_library/'
        },
        {
            pattern: /https?:\/\/[^/]*\.tradingview-widget\.com\//g,
            replacement: './charting_library/'
        },
        {
            pattern: /https?:\/\/s3\.tradingview\.com\//g,
            replacement: './charting_library/'
        },
        {
            pattern: /https?:\/\/[^/]*\.tradingview\.com\//g,
            replacement: './charting_library/'
        }
    ];

    let changes = 0;
    for (const { pattern, replacement } of replacements) {
        const matches = html.match(pattern);
        if (matches) {
            html = html.replace(pattern, replacement);
            changes += matches.length;
        }
    }

    // Write back the processed HTML
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`Processed index.html: ${changes} replacements made`);

    // Process JS files in charting_library directory
    const jsFiles = await findFiles(CHARTING_LIB_DIR, '.js');
    const cssFiles = await findFiles(CHARTING_LIB_DIR, '.css');
    const htmlFiles = await findFiles(CHARTING_LIB_DIR, '.html');

    const allFiles = [...jsFiles, ...cssFiles, ...htmlFiles];

    console.log(`Processing ${allFiles.length} files for local paths...`);

    let totalFileChanges = 0;
    for (const file of allFiles) {
        try {
            let content = fs.readFileSync(file, 'utf8');
            let fileChanges = 0;
            let modified = false;

            for (const { pattern, replacement } of replacements) {
                const matches = content.match(pattern);
                if (matches) {
                    content = content.replace(pattern, replacement);
                    fileChanges += matches.length;
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(file, content, 'utf8');
                totalFileChanges += fileChanges;
                console.log(`Processed: ${path.relative(CHARTING_LIB_DIR, file)} (${fileChanges} changes)`);
            }
        } catch (error) {
            // Skip binary or large files
            if (error.code !== 'ENOENT') {
                console.log(`Skipping ${file}: ${error.message}`);
            }
        }
    }

    console.log(`\nLocal path mapping completed:`);
    console.log(`- Index.html: ${changes} replacements`);
    console.log(`- Other files: ${totalFileChanges} replacements across ${allFiles.length} files`);

    // Create a simple server test file
    createTestServer();
}

async function findFiles(dir, extension) {
    const files = [];

    function walk(currentPath) {
        try {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(currentPath, item.name);

                if (item.isDirectory()) {
                    walk(fullPath);
                } else if (item.isFile() && item.name.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    walk(dir);
    return files;
}

function createTestServer() {
    const serverContent = `const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const WEBAPP_DIR = path.join(__dirname, 'webapp');

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

const server = http.createServer((req, res) => {
    let filePath = path.join(WEBAPP_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(WEBAPP_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Default to index.html if file doesn't exist
    if (!fs.existsSync(filePath)) {
        filePath = path.join(WEBAPP_DIR, 'index.html');
    }
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

server.listen(PORT, () => {
    console.log(\`Local server running at http://localhost:\${PORT}/\`);
    console.log(\`Serving files from \${WEBAPP_DIR}\`);
});`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'local-server.js'), serverContent);
    console.log(`Created local-server.js in ${OUTPUT_DIR}`);
}

// Run the processing
processForLocalPaths().catch(error => {
    console.error('Processing failed:', error);
});