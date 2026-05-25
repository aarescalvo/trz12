@echo off
setlocal
title TrazaSole - Detener

echo.
echo ========================================
echo  TRAZASOLE - DETENER SERVIDOR
echo ========================================
echo.

set CONTADOR=0

tasklist /FI "IMAGENAME eq bun.exe" 2>NUL | find /I "bun.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo [INFO] Deteniendo procesos bun.exe...
    taskkill /F /IM bun.exe >nul 2>&1
    set /a CONTADOR+=1
)

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo [INFO] Deteniendo procesos node.exe...
    taskkill /F /IM node.exe >nul 2>&1
    set /a CONTADOR+=1
)

if %CONTADOR% gtr 0 (
    echo.
    echo [OK] %CONTADOR% proceso(s) detenido(s)
) else (
    echo [INFO] No habia procesos para detener
)

echo.
echo ========================================
echo  SERVIDOR DETENIDO
echo ========================================
echo.
pause