@echo off
title TrazaSole - Detener Servidor
echo ========================================
echo   TRAZASOLE - Deteniendo Servidor
echo ========================================
echo.

REM Matar procesos de bun
tasklist /FI "IMAGENAME eq bun.exe" 2>NUL | find /I "bun.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo Deteniendo bun.exe...
    taskkill /F /IM bun.exe >NUL 2>&1
    echo [OK] bun.exe detenido
) else (
    echo [INFO] No hay procesos bun.exe
)

REM Matar procesos de node
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo Deteniendo node.exe...
    taskkill /F /IM node.exe >NUL 2>&1
    echo [OK] node.exe detenido
) else (
    echo [INFO] No hay procesos node.exe
)

echo.
echo ========================================
echo   Servidor detenido correctamente
echo ========================================
echo.
pause
