@echo off
chcp 65001 >nul
title Printer Bridge v2.0 - Solemar Alimentaria
cd /d "C:\SolemarAlimentaria\printer-bridge"

if not exist "index.js" (
    echo ERROR: No encuentro index.js
    echo Ejecuta install.ps1 primero.
    pause
    exit /b 1
)

if not exist "print-helper.ps1" (
    echo ERROR: No encuentro print-helper.ps1
    echo Ejecuta install.ps1 primero.
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org/ ^(version LTS^)
    pause
    exit /b 1
)

echo Iniciando Printer Bridge...
echo Presiona Ctrl+C para detener.
echo.
node index.js
pause
