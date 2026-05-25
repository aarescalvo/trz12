@echo off
title Printer Bridge - Desinstalar Servicio
echo ============================================================
echo   DESINSTALAR SERVICIO PRINTER BRIDGE
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

set INSTALL_DIR=C:\SolemarAlimentaria\printer-bridge

:: Detener servicio si está corriendo
net stop PrinterBridge >nul 2>&1

:: Desinstalar
echo Desinstalando servicio...
echo const Service = require('node-windows').Service; > "%INSTALL_DIR%\remove-service.js"
echo const svc = new Service({ >> "%INSTALL_DIR%\remove-service.js"
echo   name: 'PrinterBridge', >> "%INSTALL_DIR%\remove-service.js"
echo }); >> "%INSTALL_DIR%\remove-service.js"
echo svc.on('uninstall', function() { console.log('Servicio desinstalado'); }); >> "%INSTALL_DIR%\remove-service.js"
echo svc.uninstall(); >> "%INSTALL_DIR%\remove-service.js"

cd /d "%INSTALL_DIR%"
node remove-service.js

echo.
echo [OK] Servicio desinstalado.
echo Los archivos quedan en %INSTALL_DIR% por si los necesitás.
echo Para eliminar todo, borrá esa carpeta manualmente.
echo.

pause
