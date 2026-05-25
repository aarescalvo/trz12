@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Logs
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - VER LOGS
echo ========================================
echo.

if exist "dev.log" (
    echo Mostrando ultimas 50 lineas de dev.log:
    echo.
    type dev.log | findstr /n "." | findstr /R "^5[0-9]:\|^[0-4][0-9]:"
) else (
    echo [INFO] No existe archivo dev.log
    echo [INFO] Los logs se crean al ejecutar el servidor
)

echo.
pause