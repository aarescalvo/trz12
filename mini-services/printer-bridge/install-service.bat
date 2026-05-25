@echo off
title Printer Bridge - Instalar como Servicio de Windows
echo ============================================================
echo   INSTALAR PRINTER BRIDGE COMO SERVICIO
echo   (Se inicia automaticamente con Windows)
echo ============================================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Necesitas ejecutar esto como ADMINISTRADOR.
    echo Clic derecho -^> "Ejecutar como administrador"
    pause
    exit /b 1
)

:: Verificar que Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no está instalado.
    pause
    exit /b 1
)

set INSTALL_DIR=C:\SolemarAlimentaria\printer-bridge

if not exist "%INSTALL_DIR%\index.ts" (
    echo [ERROR] Printer Bridge no está instalado.
    echo Ejecuta install.bat primero.
    pause
    exit /b 1
)

:: Instalar node-windows globalmente para crear el servicio
echo Instalando node-windows...
call npm install -g node-windows
echo.

:: Crear script de servicio
echo Creando servicio...

echo const Service = require('node-windows').Service; > "%INSTALL_DIR%\create-service.js"
echo const svc = new Service({ >> "%INSTALL_DIR%\create-service.js"
echo   name: 'PrinterBridge', >> "%INSTALL_DIR%\create-service.js"
echo   description: 'Bridge TCP 9100 to USB Printer - Solemar Alimentaria', >> "%INSTALL_DIR%\create-service.js"
echo   script: '%INSTALL_DIR:\=/%/index.js', >> "%INSTALL_DIR%\create-service.js"
echo   nodeOptions: ['--harmony', '--max-old-space-size=4096'], >> "%INSTALL_DIR%\create-service.js"
echo   workingDirectory: '%INSTALL_DIR:\=/%', >> "%INSTALL_DIR%\create-service.js"
echo   wait: 2, >> "%INSTALL_DIR%\create-service.js"
echo   grow: 0.5, >> "%INSTALL_DIR%\create-service.js"
echo }); >> "%INSTALL_DIR%\create-service.js"
echo svc.on('install', function() { console.log('Servicio instalado'); svc.start(); }); >> "%INSTALL_DIR%\create-service.js"
echo svc.on('alreadyinstalled', function() { console.log('Servicio ya existe. Reiniciando...'); svc.start(); }); >> "%INSTALL_DIR%\create-service.js"
echo svc.on('start', function() { console.log('Servicio iniciado'); }); >> "%INSTALL_DIR%\create-service.js"
echo svc.on('error', function(e) { console.error('Error:', e); }); >> "%INSTALL_DIR%\create-service.js"
echo svc.install(); >> "%INSTALL_DIR%\create-service.js"

:: Ejecutar
cd /d "%INSTALL_DIR%"
node create-service.js

echo.
echo ============================================================
echo   SERVICIO INSTALADO
echo ============================================================
echo.
echo   El Printer Bridge se iniciará automáticamente con Windows.
echo   Para detenerlo: net stop PrinterBridge
echo   Para iniciarlo: net start PrinterBridge
echo.

pause
