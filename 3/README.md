# TradingView Terminal Auto-Healing Clone

A pixel-perfect, local-first clone of TradingView Terminal with auto-healing capabilities. This project creates an offline-capable clone that automatically fetches missing resources from the live TradingView site.

## Features

- **Auto-Healing Middleware**: Express server that proxies missing files from `https://trading-terminal.tradingview-widget.com/`
- **Local Cache**: Automatically saves fetched files to `webapp/charting_library/` for offline use
- **Smart Mirroring**: Playwright script that interacts with the UI to trigger dynamic bundle loading
- **Zero-Error Goal**: Ensures the final `webapp` folder runs completely standalone without 404 errors
- **Express-Based**: Modern, maintainable server architecture with proper middleware

## Project Structure

```
tradingview/
├── webapp/                          # Local clone (generated)
│   ├── index.html                   # Main entry point
│   └── charting_library/            # TradingView library files
│       ├── bundles/                 # Dynamic bundles
│       ├── static/                  # Static assets
│       └── charting_library.standalone.js
├── local-server-express.js          # Express auto-healing server
├── autoheal-mirror.js               # Playwright mirroring script
├── test-autoheal-express.js         # Test suite
├── verify-offline-express.js        # Offline verification
├── package.json
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Auto-Healing Server

```bash
npm start
# Server runs on http://localhost:8080
```

### 3. Run the Mirroring Script

```bash
npm run autoheal-mirror
```

This will:
- Launch a browser controlled by Playwright
- Navigate to the local server
- Click UI elements to trigger dynamic bundle requests
- Save all missing files locally via the auto-healing middleware

### 4. Verify Offline Capability

```bash
npm run verify-offline
```

## Complete Workflow

For a full clone in one command:

```bash
npm run full-clone
```

Or manually:

```bash
# Terminal 1: Start the server
npm start

# Terminal 2: Run the mirror (interact with UI)
npm run autoheal-mirror

# Terminal 3: Test offline capability
npm run verify-offline
```

## How It Works

### Auto-Healing Middleware (`local-server-express.js`)

1. **Request Interception**: All HTTP requests are intercepted by Express middleware
2. **Local Check**: Server first checks if the file exists in `webapp/` directory
3. **Auto-Heal**: If file is missing, it fetches from `https://trading-terminal.tradingview-widget.com/[path]`
4. **Save Locally**: Fetched file is saved to the correct hierarchical path in `webapp/charting_library/`
5. **Serve**: File is served to the browser (transparently)

### Mirroring Script (`autoheal-mirror.js`)

1. **Browser Automation**: Uses Playwright to control a Chromium browser
2. **Network Interception**: Captures all resource requests (JS, CSS, images, fonts, etc.)
3. **UI Interaction**: Automatically clicks TradingView UI elements (indicators, settings, timeframes, etc.)
4. **Trigger Loading**: Each interaction triggers dynamic bundle requests
5. **Auto-Save**: Missing resources are fetched and saved via the auto-healing server

## Advanced Usage

### Development Mode

```bash
npm run dev
# Uses nodemon for auto-restart on file changes
```

### Testing

```bash
npm test
# Runs the auto-healing test suite
```

### Manual Testing

1. Start server: `npm start`
2. Open browser to: `http://localhost:8080`
3. Interact with TradingView terminal manually
4. All missing files will be auto-healed and saved

## Offline Deployment

Once the mirroring is complete:

1. **Stop the server**: `Ctrl+C` in the server terminal
2. **Serve statically**: Use any static file server:
   ```bash
   npx serve webapp
   # or
   python -m http.server 8000 --directory webapp
   ```
3. **Open**: Navigate to `http://localhost:8000` (or whatever port)

The TradingView terminal should work completely offline with zero network requests.

## Troubleshooting

### Common Issues

1. **Server not starting**: Check if port 8080 is already in use
2. **Playwright browser issues**: Run `npx playwright install` to ensure browsers are installed
3. **Missing files**: Run the mirroring script multiple times to capture all dynamic bundles
4. **CORS errors**: The auto-healing server includes proper CORS headers

### File Types Captured

- JavaScript (`.js`, `.mjs`)
- CSS (`.css`)
- Images (`.png`, `.jpg`, `.svg`, `.gif`)
- Fonts (`.woff`, `.woff2`, `.ttf`, `.eot`, `.otf`)
- WebAssembly (`.wasm`)
- JSON (`.json`)
- Source maps (`.map`)

## Performance Tips

1. **First Run**: May be slow as it downloads all initial resources
2. **Subsequent Runs**: Much faster as files are served from local cache
3. **Disk Space**: TradingView terminal requires ~100-200MB for full clone
4. **Memory**: Playwright browser uses significant RAM; close other applications

## License

MIT

## Disclaimer

This project is for educational and development purposes only. TradingView is a trademark of TradingView, Inc. Use in accordance with TradingView's terms of service.