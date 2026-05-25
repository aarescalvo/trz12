@echo off
chcp 65001 >nul
title Printer Bridge v3.0 - Solemar Alimentaria

:: Ir al directorio del bridge
cd /d "%~dp0"

echo ============================================================
echo   PRINTER BRIDGE v3.0 (Python) - Solemar Alimentaria
echo ============================================================
echo.

:: Verificar Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python no encontrado. Ejecuta install.bat primero.
    pause
    exit /b 1
)

:: Verificar pywin32
python -c "import win32print" 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pywin32 no instalado. Ejecuta install.bat primero.
    pause
    exit /b 1
)

:: Iniciar el bridge
echo Iniciando Printer Bridge...
echo Para detener: presiona Ctrl+C
echo.
python index.py

:: Si se cierra con error, pausar para ver
if %ERRORLEVEL% neq 0 (
    echo.
    echo El bridge se detuvo con un error.
    pause
)
