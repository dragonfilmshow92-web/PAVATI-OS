@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================================
echo   PAVATI OS - Counter Kiosk Mode
echo ========================================================

:: 1. Ensure server is running on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PAVATI OS background server...
    start "PAVATI OS Server Daemon" /min node "%~dp0server\server.js"
    
    set /a retries=0
    :WAIT_KIOSK
    timeout /t 1 /nobreak >nul 2>&1
    netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
    if %errorlevel% neq 0 (
        set /a retries+=1
        if !retries! lss 10 goto WAIT_KIOSK
    )
)

:: 2. Locate browser executable
set "BROWSER_EXE="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if defined BROWSER_EXE (
    start "" "%BROWSER_EXE%" --kiosk --app="http://localhost:3000"
) else (
    start "" "http://localhost:3000"
)

endlocal
exit /b 0
