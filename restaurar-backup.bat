@echo off
title TrazaSole - Restaurar Backup
setlocal enabledelayedexpansion

:: Configuracion
set "TRAZASOLE_DIR=C:\TrazaSole"
set "BACKUP_DIR=C:\TrazaSole\backups"
set "PG_DIR=C:\Program Files\PostgreSQL\16\bin"
set "DB_NAME=trazasole"
set "DB_USER=postgres"
set "DB_PASS=1810"

echo ========================================
echo   TRAZASOLE - Restaurar Backup
echo ========================================
echo.

:: Verificar que existe la carpeta de backups
if not exist "%BACKUP_DIR%" (
    echo [ERROR] No hay backups disponibles
    echo Carpeta no encontrada: %BACKUP_DIR%
    pause
    exit /b 1
)

:: Listar backups disponibles
echo Backups disponibles:
echo.
set "count=0"
for /d %%d in ("%BACKUP_DIR%\backup_*") do (
    set /a count+=1
    set "backup_!count!=%%~nxd"
    echo [!count!] %%~nxd
)

if %count% equ 0 (
    echo No hay backups disponibles.
    pause
    exit /b 1
)

echo.
set /p "opcion=Selecciona el numero de backup a restaurar: "

if not defined backup_%opcion% (
    echo [ERROR] Opcion invalida
    pause
    exit /b 1
)

set "BACKUP_NAME=!backup_%opcion%!"
set "BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

echo.
echo Has seleccionado: %BACKUP_NAME%
echo.
set /p "confirmar=Confirmar restauracion? (S/N): "

if /i not "%confirmar%"=="S" (
    echo Operacion cancelada.
    pause
    exit /b 0
)

:: Detener servidor
echo.
echo [1/3] Deteniendo servidor...
taskkill /F /IM bun.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Restaurar base de datos
echo.
echo [2/3] Restaurando base de datos...
set "PGPASSWORD=%DB_PASS%"

if exist "%BACKUP_PATH%\base_datos.backup" (
    "%PG_DIR%\pg_restore.exe" -U %DB_USER% -h localhost -d %DB_NAME% -c --if-exists "%BACKUP_PATH%\base_datos.backup" >nul 2>&1
    echo      Base de datos restaurada.
) else if exist "%BACKUP_PATH%\dev.db" (
    copy "%BACKUP_PATH%\dev.db" "%TRAZASOLE_DIR%\prisma\dev.db" >nul
    echo      Base de datos SQLite restaurada.
) else (
    echo      [ERROR] No se encontro archivo de base de datos
)

:: Restaurar configuracion
echo.
echo [3/3] Restaurando configuracion...
if exist "%BACKUP_PATH%\.env" (
    copy "%BACKUP_PATH%\.env" "%TRAZASOLE_DIR%\.env" >nul
    echo      .env restaurado
)
if exist "%BACKUP_PATH%\schema.prisma" (
    copy "%BACKUP_PATH%\schema.prisma" "%TRAZASOLE_DIR%\prisma\schema.prisma" >nul
    echo      schema.prisma restaurado
)

echo.
echo ========================================
echo   Restauracion completada!
echo ========================================
echo.
echo Reinicia el servidor con iniciar-servidor.bat
echo.
pause
