@echo off
chcp 65001 >nul
title TrazaSole - Iniciando Servidor
cd /d "%~dp0.."
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║         TRAZASOLE v3.7.24 - INICIANDO SERVIDOR         ║
echo ╠════════════════════════════════════════════════════════╣
echo ║  Presiona Ctrl+C para detener el servidor              ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo [INFO] Verificando si ya hay un servidor corriendo...
tasklist /FI "IMAGENAME eq bun.exe" 2>NUL | find /I /N "bun.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [ADVERTENCIA] Ya hay procesos bun ejecutandose.
    echo [INFO] Puedes usar "detener-servidor.bat" para detenerlos primero.
    echo.
)
echo [INFO] Iniciando servidor en puerto 3000...
echo [INFO] Espera a ver "Ready" para acceder al sistema.
echo.
echo ════════════════════════════════════════════════════════════
echo.
bun run dev
