@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Listar Backups
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - LISTAR BACKUPS
echo ========================================
echo.

if not exist "backups\batt" (
    echo [INFO] No hay carpeta de backups
    echo [INFO] Crea un backup primero
    pause
    exit /b 0
)

echo Backups en carpeta batt:
echo.
dir "backups\batt" /b /o-d

echo.
set COUNT=0
for /f %%a in ('dir /b /o-d "backups\batt\backup_*" 2^>NUL ^| find /c /v ""') do set COUNT=%%a
echo Total: %COUNT% backup(s)

if %COUNT% gtr 0 (
    echo.
    for /f "delims=" %%f in ('dir /b "backups\batt\backup_*" 2^>NUL') do (
        if exist "backups\batt\%%f\info.txt" (
            echo.
            echo === %%f ===
            type "backups\batt\%%f\info.txt"
        )
    )
)

echo.
pause