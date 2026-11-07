@echo off
title Caricamento EventiVDA su GitHub
chcp 65001 >nul
echo ========================================================
echo   CARICAMENTO SU GITHUB: davidgra81/EventiVDA
echo ========================================================
echo.
git add -A
git diff-index --quiet HEAD || git commit -m "chore: sync EventiVDA updates"
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   SUCCESSO! I file sono stati caricati su GitHub!
    echo   Repository: https://github.com/davidgra81/EventiVDA
    echo ========================================================
) else (
    echo ========================================================
    echo   Non e stato possibile completare il push automaticamente.
    echo ========================================================
)
echo.
pause
