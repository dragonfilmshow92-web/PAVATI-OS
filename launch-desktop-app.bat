@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   Tioras Supermarket OS - Dedicated Desktop App
echo ========================================================

:: 1. Check if Server is running on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo Starting local background server...
    start /min "Tioras POS Server" node "%~dp0server\server.js"
    timeout /t 2 /nobreak >nul
) else (
    echo POS Server is already running.
)

:: 2. Determine Chromium Application executable (Edge or Chrome)
set BROWSER_EXE=
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
)

:: 3. Launch dedicated standalone desktop window
if defined BROWSER_EXE (
    echo Launching native desktop application window...
    start "" "%BROWSER_EXE%" --app="http://localhost:3000?mode=desktop" --window-size=1440,900 --user-data-dir="%~dp0.desktop-data"
) else (
    echo Opening default browser...
    start "" "http://localhost:3000"
)

endlocal
exit /b 0
