@echo off
chcp 65001 >nul
title SOLEMAR ALIMENTARIA - Actualización del Sistema
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         SOLEMAR ALIMENTARIA - ACTUALIZACIÓN DEL SISTEMA        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set "APP_DIR=C:\SolemarAlimentaria\app"
set "BACKUP_DIR=C:\SolemarAlimentaria\backups"
set "UPDATE_DIR=C:\SolemarAlimentaria\update"

:: Verificar que existe la carpeta de actualización
if not exist "%UPDATE_DIR%" (
    echo [ERROR] No se encuentra la carpeta de actualización
    echo.
    echo Cree la carpeta: %UPDATE_DIR%
    echo Y copie los nuevos archivos del sistema ahí
    pause
    exit /b 1
)

echo [ADVERTENCIA] Este proceso:
echo   1. Detendrá el servidor
echo   2. Creará un backup de la base de datos
echo   3. Actualizará los archivos del sistema
echo   4. Reiniciará el servidor
echo.
set /p CONFIRM="¿Desea continuar? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo.
    echo Actualización cancelada
    pause
    exit /b 0
)

echo.
echo ════════════════════════════════════════════════════════════════
echo   INICIANDO ACTUALIZACIÓN
echo ════════════════════════════════════════════════════════════════
echo.

:: Paso 1: Detener servidor
echo [1/5] Deteniendo servidor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)
echo [OK] Servidor detenido

:: Paso 2: Crear backup
echo.
echo [2/5] Creando backup de la base de datos...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
set "DATE=%date:~-4,4%%date:~-7,2%%date:~-10,2%"
set "TIME=%time:~0,2%%time:~3,2%"
set "TIME=%TIME: =0%"
set "BACKUP_FILE=%BACKUP_DIR%\pre_update_%DATE%_%TIME%.db"

if exist "%APP_DIR%\db\custom.db" (
    copy "%APP_DIR%\db\custom.db" "%BACKUP_FILE%" >nul
    echo [OK] Backup creado: %BACKUP_FILE%
) else (
    echo [ADVERTENCIA] No se encontró base de datos para respaldar
)

:: Paso 3: Copiar archivos nuevos (excepto db y .env)
echo.
echo [3/5] Actualizando archivos del sistema...
xcopy "%UPDATE_DIR%\*" "%APP_DIR%\" /E /Y /I /EXCLUDE:exclude.txt 2>nul
if %errorLevel% neq 0 (
    :: Si no hay archivo exclude, copiar todo excepto db
    robocopy "%UPDATE_DIR%" "%APP_DIR%" /E /XD db /XF .env /NFL /NDL /NJH /NJS
)
echo [OK] Archivos actualizados

:: Paso 4: Instalar dependencias si es necesario
echo.
echo [4/5] Verificando dependencias...
cd /d "%APP_DIR%"
if exist package.json (
    if defined BUN (
        bun install
    ) else (
        npm install
    )
)
echo [OK] Dependencias verificadas

:: Paso 5: Iniciar servidor
echo.
echo [5/5] Reiniciando servidor...
start "" "%APP_DIR%\..\start-server.bat"
echo [OK] Servidor iniciado

echo.
echo ════════════════════════════════════════════════════════════════
echo   ACTUALIZACIÓN COMPLETADA
echo ════════════════════════════════════════════════════════════════
echo.
echo El sistema ha sido actualizado exitosamente.
echo Backup previo guardado en: %BACKUP_FILE%
echo.
pause
