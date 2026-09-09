@echo off
title Push Tioras Fashions Studio to GitHub
cd /d "%~dp0"
echo ========================================================
echo   Pushing Tioras Fashions Studio POS to GitHub...
echo ========================================================
echo.
git push origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESS! Pushed to https://github.com/tyoras9686-ui/Tioras-Fashions-Studio
    echo ========================================================
) else (
    echo ========================================================
    echo   Push failed or requires login.
    echo ========================================================
)
pause
