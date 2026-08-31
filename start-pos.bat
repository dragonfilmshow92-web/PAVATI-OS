@echo off
setlocal
cd /d "%~dp0"
title Tioras Supermarket OS & Retail POS Launcher

echo ========================================================
echo   Tioras Supermarket OS & Retail POS Desktop Suite
echo ========================================================
echo.
echo [1] Launch Dedicated Standalone Desktop App (Recommended)
echo [2] Launch Fullscreen Supermarket Kiosk Mode (Cash Register)
echo [3] Launch in Default Web Browser
echo.

set /p choice="Enter choice [1, 2, or 3] (Default: 1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    call "%~dp0launch-desktop-app.bat"
) else if "%choice%"=="2" (
    call "%~dp0launch-kiosk-app.bat"
) else (
    netstat -ano | findstr :3000 | findstr LISTENING >nul
    if %errorlevel% neq 0 (
        start /min "Tioras POS Server" node "%~dp0server\server.js"
        timeout /t 2 /nobreak >nul
    )
    start "" "http://localhost:3000"
)

endlocal
exit /b 0
