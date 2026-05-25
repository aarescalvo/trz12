@echo off
title TrazaSole - Iniciar en Segundo Plano
cd /d "%~dp0.."
echo ========================================
echo   TRAZASOLE - Iniciar en Segundo Plano
echo ========================================
echo.

tasklist /FI "IMAGENAME eq bun.exe" 2>NUL | find /I /N "bun.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [ADVERTENCIA] Ya hay un servidor corriendo
    pause
    exit /b 1
)

echo Iniciando servidor en segundo plano...
start /B "" cmd /c "bun run dev > servidor.log 2>&1"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Servidor iniciado en segundo plano
echo   Puerto: 3000
echo   Log: servidor.log
echo ========================================
echo.
pause
