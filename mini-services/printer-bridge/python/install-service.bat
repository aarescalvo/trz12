@echo off
chcp 65001 >nul
title Printer Bridge - Instalar Servicio Windows
echo ============================================================
echo   PRINTER BRIDGE v3.0 - Instalar como Servicio Windows
echo ============================================================
echo.
echo   Esto permite que el bridge inicie automaticamente
echo   con Windows, sin necesidad de iniciar sesion.
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Necesitas ejecutar esto como Administrador.
    echo.
    echo   Click derecho en install-service.bat
    echo   - Ejecutar como administrador
    echo.
    pause
    exit /b 1
)

:: Verificar que esta instalado
set INSTALL_DIR=C:\SolemarAlimentaria\printer-bridge
if not exist "%INSTALL_DIR%\index.py" (
    echo [ERROR] No se encontro el bridge en %INSTALL_DIR%
    echo   Ejecuta install.bat primero.
    pause
    exit /b 1
)

:: Crear wrapper para el servicio
set WRAPPER=%INSTALL_DIR%\service-wrapper.vbs
echo Set objShell = CreateObject("WScript.Shell") > "%WRAPPER%"
echo objShell.CurrentDirectory = "%INSTALL_DIR%" >> "%WRAPPER%"
echo objShell.Run "python index.py", 0, False >> "%WRAPPER%"
echo [OK] Wrapper creado.

:: Crear script de inicio como servicio con nssm o con schtasks
:: Usamos Task Scheduler como alternativa (no necesita NSSM)
echo.
echo Configurando inicio automatico con el Programador de Tareas...

:: Crear tarea programada
schtasks /create /tn "PrinterBridgeSolemar" /tr "wscript.exe \"%WRAPPER%\"" /sc onstart /ru SYSTEM /rl highest /f >nul 2>&1

if %ERRORLEVEL% equ 0 (
    echo [OK] Tarea programada creada: PrinterBridgeSolemar
    echo     Se iniciara automaticamente al arrancar Windows.
    echo.
    echo   Para iniciar manualmente ahora:
    echo     schtasks /run /tn "PrinterBridgeSolemar"
    echo.
    echo   Para detener:
    echo     taskkill /F /IM python.exe
    echo.
    echo   Para desinstalar:
    echo     schtasks /delete /tn "PrinterBridgeSolemar" /f
    echo     Ejecuta uninstall-service.bat
) else (
    echo [ERROR] No se pudo crear la tarea programada.
    echo.
    echo   Alternativa manual:
    echo   1. Abrir Programador de Tareas (taskschd.msc)
    echo   2. Crear tarea basica
    echo   3. Nombre: PrinterBridgeSolemar
    echo   4. Desencadenador: Al iniciar sesion
    echo   5. Accion: Iniciar programa: wscript.exe
    echo   6. Argumentos: "%WRAPPER%"
)

echo.
echo ============================================================
echo   SERVICIO CONFIGURADO
echo ============================================================
echo.

pause
