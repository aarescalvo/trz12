@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║           SISTEMA FRIGORÍFICO SOLEMAR - INFORMACIÓN             ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

set INSTALL_DIR=C:\SolemarFrigorifico
set CONFIG_FILE=%INSTALL_DIR%\config\sistema.conf

:: Valores por defecto
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=solemar_frigorifico
set DB_USER=solemar_user
set APP_PORT=3000
set GITHUB_REPO=https://github.com/aarescalvo/153

:: Leer configuración
if exist "%CONFIG_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%CONFIG_FILE%") do (
        set "line=%%a"
        if "!line:~0,1!" neq "#" (
            if "%%a"=="DB_HOST" set DB_HOST=%%~b
            if "%%a"=="DB_PORT" set DB_PORT=%%~b
            if "%%a"=="DB_NAME" set DB_NAME=%%~b
            if "%%a"=="DB_USER" set DB_USER=%%~b
            if "%%a"=="APP_PORT" set APP_PORT=%%~b
            if "%%a"=="GITHUB_REPO_URL" set GITHUB_REPO=%%~b
        )
    )
)

:: Obtener IP del servidor
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set SERVER_IP=%%a
    goto :got_ip
)
:got_ip
set SERVER_IP=%SERVER_IP: =%

:: Obtener versión
set VERSION=desconocida
if exist "%INSTALL_DIR%\app\.commit" (
    set /p VERSION=<"%INSTALL_DIR%\app\.commit"
)

:: Verificar servicios
set PG_STATUS=Detenido
set APP_STATUS=Detenido

sc query postgresql-x64-16 >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%a in ('sc query postgresql-x64-16 ^| findstr STATE') do set PG_STATUS=%%a
)

sc query SolemarFrigorifico >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%a in ('sc query SolemarFrigorifico ^| findstr STATE') do set APP_STATUS=%%a
)

:: Mostrar información
echo   ═══════════════════════════════════════════════════════════════
echo   ACCESO AL SISTEMA
echo   ═══════════════════════════════════════════════════════════════
echo.
echo   URL Local:        http://localhost:%APP_PORT%
echo   URL Red:          http://%SERVER_IP%:%APP_PORT%
echo.
echo   Usuario:          admin
echo   Contraseña:       admin123
echo.
echo   ═══════════════════════════════════════════════════════════════
echo   BASE DE DATOS
echo   ═══════════════════════════════════════════════════════════════
echo.
echo   Host:             %DB_HOST%
echo   Puerto:           %DB_PORT%
echo   Base de datos:    %DB_NAME%
echo   Usuario:          %DB_USER%
echo.
echo   ═══════════════════════════════════════════════════════════════
echo   ESTADO DE SERVICIOS
echo   ═══════════════════════════════════════════════════════════════
echo.
echo   PostgreSQL:       %PG_STATUS%
echo   Aplicación:       %APP_STATUS%
echo.
echo   ═══════════════════════════════════════════════════════════════
echo   SISTEMA
echo   ═══════════════════════════════════════════════════════════════
echo.
echo   Versión:          %VERSION%
echo   Repositorio:      %GITHUB_REPO%
echo   Directorio:       %INSTALL_DIR%
echo.
echo   ═══════════════════════════════════════════════════════════════
echo   SCRIPTS DISPONIBLES
echo   ═══════════════════════════════════════════════════════════════
echo.
echo   %INSTALL_DIR%\iniciar.bat          - Iniciar aplicación
echo   %INSTALL_DIR%\respaldar.bat        - Crear respaldo
echo   %INSTALL_DIR%\actualizar.bat       - Actualizar sistema
echo   %INSTALL_DIR%\diagnostico.ps1      - Diagnóstico completo
echo   %INSTALL_DIR%\cambiar-repositorio.ps1 - Cambiar repo de actualizaciones
echo.
echo   ═══════════════════════════════════════════════════════════════
echo.

pause
