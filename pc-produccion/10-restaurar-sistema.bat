@echo off
setlocal enabledelayedexpansion
title TrazaSole - Restaurar Sistema
cd /d "%~dp0.."

echo ========================================
echo   TRAZASOLE - Restaurar Sistema
echo ========================================
echo.

if not exist "backups\sistema" (
    echo [ERROR] No hay backups de sistema
    pause
    exit /b 1
)

echo Backups disponibles:
echo.
set IDX=0
for /f "delims=" %%f in ('dir /b /o-d "backups\sistema\*.zip" 2^>nul') do (
    set /a IDX+=1
    echo   [!IDX!] %%f
    set BACKUP_!IDX!=%%f
)

if %IDX% equ 0 (
    echo [ERROR] No hay backups
    pause
    exit /b 1
)

echo.
set /p SELECCION="Seleccione numero: "

if not defined BACKUP_%SELECCION% (
    echo [ERROR] Seleccion invalida
    pause
    exit /b 1
)

set BACKUP_FILE=!BACKUP_%SELECCION%!

echo.
echo [ADVERTENCIA] Esto reemplazara archivos
echo Backup: %BACKUP_FILE%
echo.
set /p CONFIRMAR "Confirmar? (S/N): "

if /i not "%CONFIRMAR%"=="S" (
    echo Cancelado.
    pause
    exit /b 0
)

echo.
echo [1/3] Deteniendo servidor...
taskkill /F /IM bun.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo [2/3] Restaurando archivos...
powershell -Command "Expand-Archive -Path 'backups\sistema\%BACKUP_FILE%' -DestinationPath '.' -Force"

echo [3/3] Reinstalando dependencias...
bun install

echo.
echo Sistema restaurado.
echo Ejecute: 1-iniciar-server.bat
echo.
pause
