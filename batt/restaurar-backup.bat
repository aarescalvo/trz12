@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title TrazaSole - Restaurar
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - RESTAURAR BACKUP
echo ========================================
echo.

echo Backups disponibles:
echo.

if not exist "backups\batt" (
    echo [ERROR] No existe carpeta backups\batt
    pause
    exit /b 1
)

set COUNT=0
for /f "delims=" %%f in ('dir /b /o-d "backups\batt\backup_*" 2^>NUL') do (
    set /a COUNT+=1
    set "DIR_!COUNT!=%%f"
    echo [!COUNT!] %%f
)

if %COUNT%==0 (
    echo [ERROR] No hay backups disponibles
    pause
    exit /b 1
)

echo.
echo Total: %COUNT% backup(s)
echo.
set /p SEL="Ingresa numero de backup a restaurar (0=cancelar): "

if "%SEL%"=="0" exit /b 0
if %SEL% LSS 1 (
    echo [ERROR] Numero invalido
    pause
    exit /b 1
)
if %SEL% GTR %COUNT% (
    echo [ERROR] Numero invalido
    pause
    exit /b 1
)

set "BACKUP_NAME=!DIR_%SEL%!"
set "BACKUP_PATH=backups\batt\%BACKUP_NAME%"

echo.
echo [ADVERTENCIA] Esto reemplazara archivos actuales
echo Backup: %BACKUP_NAME%
set /p CONF="Continuar? (S/N): "
if /i not "%CONF%"=="S" (
    echo [CANCELADO]
    pause
    exit /b 0
)

echo.
echo [1/4] Deteniendo servidor...
taskkill /F /IM bun.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Restaurando archivos src...
if exist "%BACKUP_PATH%\src" (
    rmdir /s /q "src" 2>nul
    xcopy "%BACKUP_PATH%\src" "src" /E /I /Q /Y >nul 2>&1
)

echo [3/4] Restaurando prisma...
if exist "%BACKUP_PATH%\prisma" (
    xcopy "%BACKUP_PATH%\prisma" "prisma" /E /I /Q /Y >nul 2>&1
)

echo [4/4] Restaurando base de datos...
set PGPASSWORD=1810
if exist "%BACKUP_PATH%\database.sql" (
    if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
        "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -p 5432 -U frigo_user -d frigorifico -f "%BACKUP_PATH%\database.sql" >nul 2>&1
        echo [OK] Base de datos restaurada
    )
)

echo.
echo ========================================
echo  RESTAURACION COMPLETADA
echo ========================================
echo.
pause