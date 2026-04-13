const { chromium } = require('playwright');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        console.log('Playwright browser launched successfully');
        await browser.close();
        console.log('Test passed');
    } catch (error) {
        console.error('Error:', error.message);
        console.log('Trying to install browsers...');
        const { execSync } = require('child_process');
        execSync('npx playwright install chromium', { stdio: 'inherit' });
    }
})();