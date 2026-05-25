@echo off
setlocal enabledelayedexpansion
title TrazaSole - Backup Sistema
color 0B

:: Configuracion
set "INSTALL_DIR=%~dp0.."
set "BACKUP_DIR=%INSTALL_DIR%\backups\sistema"
set "MAX_BACKUPS=50"

echo.
echo ========================================
echo   TRAZASOLE - Backup del Sistema
echo ========================================
echo.

cd /d "%INSTALL_DIR%"

:: Crear carpeta de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Obtener version del package.json
set VERSION=unknown
if exist "package.json" (
    for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json 2^>nul') do (
        set VERSION=%%a
        set VERSION=!VERSION:"=!
    )
)

:: Obtener fecha y hora (metodo compatible)
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set FECHA=%%a-%%b-%%c
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set HORA=%%a-%%b
set FECHA=%FECHA:/=-%
set HORA=%HORA::=-%

:: Metodo alternativo si lo anterior falla
if "%FECHA%"=="" (
    for /f %%i in ('powershell -Command "Get-Date -Format yyyy-MM-dd"') do set FECHA=%%i
)
if "%HORA%"=="" (
    for /f %%i in ('powershell -Command "Get-Date -Format HH-mm"') do set HORA=%%i
)

set TIMESTAMP=%FECHA%_%HORA%

:: Nombre del backup
set BACKUP_NAME=trazasole_v%VERSION%_%TIMESTAMP%
set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_NAME%.zip

echo [INFO] Version: %VERSION%
echo [INFO] Fecha: %FECHA% - Hora: %HORA%
echo.
echo [1/3] Creando backup...
echo       Archivo: %BACKUP_NAME%.zip
echo.

:: Crear backup usando PowerShell (mas compatible)
powershell -ExecutionPolicy Bypass -Command "$exclude = @('backups', 'node_modules', '.next', '.git'); $items = Get-ChildItem -Path '.' | Where-Object { $exclude -notcontains $_.Name }; if ($items) { Compress-Archive -Path $items.FullName -DestinationPath '%BACKUP_FILE%' -Force; Write-Host '[OK] Backup creado' } else { Write-Host '[ERROR] No hay archivos'; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo crear el backup
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Backup creado exitosamente!
echo.

:: Limpiar backups antiguos
echo [2/3] Limpiando backups antiguos...

set BACKUP_COUNT=0
for /f %%i in ('dir "%BACKUP_DIR%\*.zip" /b 2^>nul ^| find /c /v ""') do set BACKUP_COUNT=%%i

echo [INFO] Hay %BACKUP_COUNT% backups

if %BACKUP_COUNT% gtr %MAX_BACKUPS% (
    set /a EXCESS=%BACKUP_COUNT%-%MAX_BACKUPS%
    echo [INFO] Eliminando %EXCESS% backups antiguos...
    
    for /f "skip=%MAX_BACKUPS% delims=" %%f in ('dir "%BACKUP_DIR%\*.zip" /o-d /b 2^>nul') do (
        del "%BACKUP_DIR%\%%f" 2>nul
        echo [ELIMINADO] %%f
    )
)

echo.
echo [3/3] Backups disponibles:
echo ----------------------------------------
dir "%BACKUP_DIR%\*.zip" /o-d /b 2>nul | findstr /n "." | findstr "^[1-5]:"
echo ...
for /f %%i in ('dir "%BACKUP_DIR%\*.zip" /b 2^>nul ^| find /c /v ""') do echo Total: %%i backups
echo ----------------------------------------
echo.
echo [OK] Backup completado!
echo.
pause
