@echo off
chcp 65001 >nul
title Printer Bridge - Instalador - Solemar Alimentaria
echo ============================================================
echo   PRINTER BRIDGE v2.0 - Solemar Alimentaria
echo   Instalador para Windows
echo ============================================================
echo.

:: Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo.
    echo Descargalo de: https://nodejs.org/
    echo Elegi la version LTS ^(Recommended for Most Users^)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

:: Crear carpeta
set INSTALL_DIR=C:\SolemarAlimentaria\printer-bridge
echo Instalando en: %INSTALL_DIR%
echo.

if not exist "C:\SolemarAlimentaria" mkdir "C:\SolemarAlimentaria"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\temp" mkdir "%INSTALL_DIR%\temp"

:: Copiar archivos
echo Copiando archivos...
copy /Y "%~dp0index.js" "%INSTALL_DIR%\index.js" >nul 2>&1
copy /Y "%~dp0print-helper.ps1" "%INSTALL_DIR%\print-helper.ps1" >nul 2>&1
copy /Y "%~dp0package.json" "%INSTALL_DIR%\package.json" >nul 2>&1
copy /Y "%~dp0start.bat" "%INSTALL_DIR%\start.bat" >nul 2>&1

echo [OK] Archivos copiados.
echo.

:: NO necesita npm install! v2.0 usa PowerShell nativo.

:: Mostrar impresoras
echo Detectando impresoras...
powershell -NoProfile -Command "Get-Printer | Select-Object Name, PortName, DriverName | Format-Table -AutoSize"
echo.

:: Preguntar impresora
echo ============================================================
echo   CONFIGURACION
echo ============================================================
echo.
echo Escribi el nombre EXACTO de la impresora tal como aparece arriba.
echo.
set /p PRINTER_NAME="Nombre de la impresora: "

if "%PRINTER_NAME%"=="" (
    echo [ERROR] No ingresaste un nombre.
    pause
    exit /b 1
)

:: Guardar config
echo {"printerName":"%PRINTER_NAME%","tcpPort":9100,"httpPort":9101,"logLevel":"info","autoStart":true} > "%INSTALL_DIR%\printer-config.json"

echo.
echo [OK] Configuracion guardada.
echo.

:: Firewall
echo ============================================================
echo   CONFIGURACION DEL FIREWALL
echo ============================================================
echo.
netsh advfirewall firewall add rule name="Printer Bridge TCP 9100" dir=in action=allow protocol=TCP localport=9100
netsh advfirewall firewall add rule name="Printer Bridge TCP 9101" dir=in action=allow protocol=TCP localport=9101
echo.
echo [OK] Puertos abiertos.
echo.

:: IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo.
echo   Impresora: %PRINTER_NAME%
echo   Puerto TCP: 9100
echo   Panel Web:  http://%LOCAL_IP%:9101
echo.
echo   Archivos en: %INSTALL_DIR%
echo.
echo   PROXIMOS PASOS:
echo   1. Ejecuta start.bat para iniciar el bridge
echo   2. Abri http://localhost:9101 en el navegador
echo   3. Hace clic en "Imprimir prueba"
echo   4. En el sistema configurar impresora con IP: %LOCAL_IP%
echo.
echo ============================================================

pause
