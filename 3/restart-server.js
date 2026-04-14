const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Restarting Auto-Healing Server...');

// Kill any existing node processes on port 8080
const killCommand = process.platform === 'win32'
    ? 'taskkill /F /IM node.exe 2>nul'
    : 'pkill -f "node.*local-server" 2>/dev/null';

const killProcess = spawn(killCommand, { shell: true });
killProcess.on('close', () => {
    console.log('Previous server stopped');

    // Wait a moment
    setTimeout(() => {
        console.log('Starting new server...');

        const serverProcess = spawn('node', ['local-server.js'], {
            stdio: 'inherit',
            shell: true
        });

        serverProcess.on('error', (err) => {
            console.error('Failed to start server:', err);
        });

        console.log('Server started on http://localhost:8080/');
        console.log('Press Ctrl+C to stop the server');

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\nShutting down server...');
            serverProcess.kill('SIGINT');
            process.exit(0);
        });
    }, 1000);
});