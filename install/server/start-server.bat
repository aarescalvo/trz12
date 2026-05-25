@echo off
chcp 65001 >nul
title SOLEMAR ALIMENTARIA - Servidor
color 0A

set "APP_DIR=C:\SolemarAlimentaria\app"
set "LOG_DIR=C:\SolemarAlimentaria\logs"

:: Crear directorio de logs si no existe
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo.
echo ════════════════════════════════════════════════════════════════
echo   SOLEMAR ALIMENTARIA - Iniciando Servidor
echo ════════════════════════════════════════════════════════════════
echo.

:: Verificar que existe la aplicación
if not exist "%APP_DIR%\package.json" (
    echo [ERROR] No se encuentra la aplicación en: %APP_DIR%
    echo.
    echo Por favor, copie la carpeta 'app' con el código fuente.
    pause
    exit /b 1
)

:: Cambiar al directorio de la aplicación
cd /d "%APP_DIR%"

:: Verificar si existe node_modules
if not exist "%APP_DIR%\node_modules" (
    echo [INFO] Instalando dependencias...
    echo.
    call npm install
    echo.
)

:: Mostrar información
echo [INFO] Iniciando servidor...
echo [INFO] Directorio: %APP_DIR%
echo [INFO] Logs: %LOG_DIR%\server.log
echo.
echo ════════════════════════════════════════════════════════════════
echo   SERVIDOR ACTIVO - NO CERRAR ESTA VENTANA
echo ════════════════════════════════════════════════════════════════
echo.
echo   Acceso local:    http://localhost:3000
echo   Acceso red:      http://[IP-SERVIDOR]:3000
echo.
echo   Presione Ctrl+C para detener el servidor
echo ════════════════════════════════════════════════════════════════
echo.

:: Iniciar el servidor
call npm run dev
