@echo off
chcp 65001 >nul
title SOLEMAR ALIMENTARIA - Detener Servidor
color 0C

echo.
echo ════════════════════════════════════════════════════════════════
echo   SOLEMAR ALIMENTARIA - Deteniendo Servidor
echo ════════════════════════════════════════════════════════════════
echo.

:: Detener proceso de Node/Bun en puerto 3000
echo [INFO] Buscando procesos en puerto 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Deteniendo proceso %%a...
    taskkill /F /PID %%a 2>nul
)

:: Detener tarea programada si existe
schtasks /end /tn "SolemarAlimentaria" 2>nul

echo.
echo [OK] Servidor detenido
echo.
pause
