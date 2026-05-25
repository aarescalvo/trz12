@echo off
setlocal enabledelayedexpansion
title TrazaSole - Restaurar Base de Datos
cd /d "%~dp0.."

echo ========================================
echo   TRAZASOLE - Restaurar Base de Datos
echo ========================================
echo.

if not exist "backups\database" (
    echo [ERROR] No hay backups de base de datos
    pause
    exit /b 1
)

echo Backups disponibles:
echo.
set IDX=0
for /f "delims=" %%f in ('dir /b /o-d "backups\database\*" 2^>nul') do (
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
echo [ADVERTENCIA] Esto reemplazara la base de datos
echo Backup: %BACKUP_FILE%
echo.
set /p CONFIRMAR "Confirmar? (S/N): "

if /i not "%CONFIRMAR%"=="S" (
    echo Cancelado.
    pause
    exit /b 0
)

echo.
echo Deteniendo servidor...
taskkill /F /IM bun.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo Restaurando...

if "%BACKUP_FILE:~-2%"=="db" (
    echo [INFO] Restaurando SQLite...
    if exist "prisma\dev.db" copy "prisma\dev.db" "prisma\dev.db.pre-restore" >nul
    copy "backups\database\%BACKUP_FILE%" "prisma\dev.db" >nul
) else if "%BACKUP_FILE:~-3%"=="sql" (
    echo [INFO] Restaurando PostgreSQL...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="DATABASE_URL" set DB_URL=%%b
    )
    psql "%DB_URL%" < "backups\database\%BACKUP_FILE%" 2>nul
) else (
    echo [ERROR] Formato no reconocido
    pause
    exit /b 1
)

echo.
echo Base de datos restaurada.
echo Ejecute: 1-iniciar-server.bat
echo.
pause
