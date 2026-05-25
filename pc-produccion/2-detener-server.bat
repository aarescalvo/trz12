@echo off
title TrazaSole - Detener Servidor
echo ========================================
echo   TRAZASOLE - Deteniendo Servidor
echo ========================================
echo.

taskkill /F /IM bun.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Procesos Bun detenidos
) else (
    echo [INFO] No habia procesos Bun activos
)

taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Procesos Node detenidos
) else (
    echo [INFO] No habia procesos Node activos
)

echo.
echo Servidor detenido.
echo.
pause
