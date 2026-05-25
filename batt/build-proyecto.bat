@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Build
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - COMPILAR PROYECTO
echo ========================================
echo.

echo [INFO] Compilando proyecto...
echo.

npm run build

if %ERRORLEVEL% equ 0 (
    echo.
    echo [OK] Compilacion exitosa
) else (
    echo.
    echo [ERROR] Error en compilacion
)

echo.
pause