@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   Tioras Supermarket POS - Counter Kiosk Mode
echo ========================================================

netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    start /min "Tioras POS Server" node "%~dp0server\server.js"
    timeout /t 2 /nobreak >nul
)

set BROWSER_EXE=
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
)

if defined BROWSER_EXE (
    start "" "%BROWSER_EXE%" --kiosk --app="http://localhost:3000?mode=desktop" --user-data-dir="%~dp0.desktop-data"
) else (
    start "" "http://localhost:3000?mode=desktop"
)

endlocal
exit /b 0
