@echo off
echo Stopping any existing server on port 8080...
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo Port 8080 is in use. Please close the application manually.
    pause
    exit /b 1
)

echo Starting TradingView clone server...
node local-server.js
