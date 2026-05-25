@echo off
chcp 65001 >nul
title SOLEMAR ALIMENTARIA - Backup de Base de Datos
color 0B

:: Configuración
set "INSTALL_DIR=C:\SolemarAlimentaria"
set "BACKUP_DIR=C:\SolemarAlimentaria\backups"
set "DB_FILE=C:\SolemarAlimentaria\app\db\custom.db"

:: Crear directorio de backup si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Obtener fecha y hora
for /f "tokens=1-3 delims=/" %%a in ("%date:~-10,2%/%date:~-7,2%/%date:~-4,4%") do (
    set "YEAR=%%c"
    set "MONTH=%%a"
    set "DAY=%%b"
)
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set "HOUR=%%a"
    set "MINUTE=%%b"
)

:: Formatear hora (eliminar espacios)
set "HOUR=%HOUR: =0%"
set "MINUTE=%MINUTE: =0%"

:: Nombre del archivo de backup
set "BACKUP_FILE=%BACKUP_DIR%\solemar_%YEAR%%MONTH%%DAY%_%HOUR%%MINUTE%.db"

echo.
echo ════════════════════════════════════════════════════════════════
echo   SOLEMAR ALIMENTARIA - Sistema de Backup
echo ════════════════════════════════════════════════════════════════
echo.

:: Verificar que existe la base de datos
if not exist "%DB_FILE%" (
    echo [ERROR] No se encuentra la base de datos: %DB_FILE%
    pause
    exit /b 1
)

:: Crear backup
echo [1/4] Creando backup...
copy "%DB_FILE%" "%BACKUP_FILE%" >nul
if %errorLevel% neq 0 (
    echo [ERROR] No se pudo crear el backup
    pause
    exit /b 1
)
echo [OK] Backup creado: %BACKUP_FILE%

:: Verificar integridad del backup
echo.
echo [2/4] Verificando integridad...
if exist "%BACKUP_FILE%" (
    for %%A in ("%BACKUP_FILE%") do set "SIZE=%%~zA"
    if %SIZE% gtr 0 (
        echo [OK] Backup válido (%SIZE% bytes)
    ) else (
        echo [ERROR] Backup corrupto o vacío
        del "%BACKUP_FILE%"
        pause
        exit /b 1
    )
) else (
    echo [ERROR] No se encontró el archivo de backup
    pause
    exit /b 1
)

:: Limpiar backups antiguos (mantener últimos 30 días)
echo.
echo [3/4] Limpiando backups antiguos...
forfiles /p "%BACKUP_DIR%" /m *.db /d -30 /c "cmd /c del @path" 2>nul
echo [OK] Backups antiguos eliminados

:: Mostrar resumen
echo.
echo [4/4] Resumen de backups disponibles:
echo ════════════════════════════════════════════════════════════════
dir "%BACKUP_DIR%\*.db" /o-d /b 2>nul | findstr /n "." | findstr "^[1-5]:"
echo ...
echo.
echo Total de backups:
for /f %%i in ('dir "%BACKUP_DIR%\*.db" /b 2^>nul ^| find /c /v ""') do echo %%i backups en disco
echo ════════════════════════════════════════════════════════════════
echo.
echo [OK] Backup completado exitosamente!
echo.
pause
