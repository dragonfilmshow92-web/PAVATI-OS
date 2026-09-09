@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================================
echo   MCT POS - Enterprise Retail Desktop Launcher
echo ========================================================

:: 1. Ensure server is running on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting MCT POS background server...
    start "MCT POS Server Daemon" /min node "%~dp0server\server.js"
    
    :: Wait up to 10 seconds for port 3000 to become active
    set /a retries=0
    :WAIT_LOOP
    timeout /t 1 /nobreak >nul 2>&1
    netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
    if %errorlevel% neq 0 (
        set /a retries+=1
        if !retries! lss 10 goto WAIT_LOOP
    )
) else (
    echo POS Server is active on port 3000.
)

:: 2. Clean up any stale lockfile from previous crashes
if exist "%~dp0.desktop-data\lockfile" del /f /q "%~dp0.desktop-data\lockfile" >nul 2>&1

:: 3. Locate browser executable (Chrome or Edge)
set "BROWSER_EXE="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
)

:: 4. Launch standalone POS app window (without locked profile constraints)
if defined BROWSER_EXE (
    echo Launching native desktop application window...
    start "" "%BROWSER_EXE%" --app="http://localhost:3000" --window-size=1440,900
) else (
    echo Opening default system browser...
    start "" "http://localhost:3000"
)

endlocal
exit /b 0
