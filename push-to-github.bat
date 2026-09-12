@echo off
title Push PAVATI OS to GitHub
cd /d "%~dp0"
echo ========================================================
echo   Pushing PAVATI OS POS to GitHub...
echo ========================================================
echo.
git push origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESS! Pushed to https://github.com/dragonfilmshow92-web/PAVATI-OS
    echo ========================================================
) else (
    echo ========================================================
    echo   Push failed or requires login.
    echo ========================================================
)
pause
