@echo off
chcp 65001 >nul
title SOLEMAR ALIMENTARIA - Configuración de Cliente
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         SOLEMAR ALIMENTARIA - CONFIGURACIÓN DE CLIENTE         ║
echo ║                    Puesto de Trabajo                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Solicitar IP del servidor
echo Ingrese la dirección IP del servidor
echo (Ejemplo: 192.168.1.100)
echo.
set /p SERVER_IP="IP del Servidor: "

if "%SERVER_IP%"=="" (
    echo [ERROR] Debe ingresar la IP del servidor
    pause
    exit /b 1
)

:: Crear directorio de configuración
set "CONFIG_DIR=C:\SolemarAlimentaria"
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

:: Guardar configuración
echo {"serverIp":"%SERVER_IP%","port":3000} > "%CONFIG_DIR%\config.json"

echo.
echo [1/3] Verificando conexión con el servidor...
echo.

:: Probar conexión
ping -n 1 %SERVER_IP% >nul 2>&1
if %errorLevel% neq 0 (
    echo [ADVERTENCIA] No se puede hacer ping al servidor
    echo Verifique que el servidor esté encendido y conectado a la red
    echo.
) else (
    echo [OK] Servidor accesible
)

echo.
echo [2/3] Creando accesos directos...
echo.

:: Obtener el directorio del escritorio
set "DESKTOP=%USERPROFILE%\Desktop"

:: Crear archivo VBS para generar acceso directo
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut.vbs"
echo Set oUrlLink = WshShell.CreateShortcut("%DESKTOP%\Solemar Alimentaria.lnk") >> "%TEMP%\shortcut.vbs"
echo oUrlLink.TargetPath = "http://%SERVER_IP%:3000" >> "%TEMP%\shortcut.vbs"
echo oUrlLink.IconLocation = "shell32.dll,14" >> "%TEMP%\shortcut.vbs"
echo oUrlLink.Description = "Sistema de Gestión Frigorífica" >> "%TEMP%\shortcut.vbs"
echo oUrlLink.Save >> "%TEMP%\shortcut.vbs"

cscript //nologo "%TEMP%\shortcut.vbs"
del "%TEMP%\shortcut.vbs"

echo [OK] Acceso directo creado en el escritorio

echo.
echo [3/3] Creando acceso en menú inicio...
echo.

:: Crear acceso en menú inicio
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
if not exist "%STARTMENU%\Solemar Alimentaria" mkdir "%STARTMENU%\Solemar Alimentaria"

echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut2.vbs"
echo Set oUrlLink = WshShell.CreateShortcut("%STARTMENU%\Solemar Alimentaria\Solemar Alimentaria.lnk") >> "%TEMP%\shortcut2.vbs"
echo oUrlLink.TargetPath = "http://%SERVER_IP%:3000" >> "%TEMP%\shortcut2.vbs"
echo oUrlLink.IconLocation = "shell32.dll,14" >> "%TEMP%\shortcut2.vbs"
echo oUrlLink.Save >> "%TEMP%\shortcut2.vbs"

cscript //nologo "%TEMP%\shortcut2.vbs"
del "%TEMP%\shortcut2.vbs"

echo [OK] Acceso creado en Menú Inicio

echo.
echo ════════════════════════════════════════════════════════════════
echo   CONFIGURACIÓN COMPLETADA
echo ════════════════════════════════════════════════════════════════
echo.
echo   URL del sistema: http://%SERVER_IP%:3000
echo.
echo   Se ha creado un acceso directo en el escritorio llamado:
echo   "Solemar Alimentaria"
echo.
echo ════════════════════════════════════════════════════════════════
echo.

:: Preguntar si desea abrir el sistema
set /p OPEN_BROWSER="¿Desea abrir el sistema ahora? (S/N): "
if /i "%OPEN_BROWSER%"=="S" (
    start http://%SERVER_IP%:3000
)

echo.
echo Presione cualquier tecla para salir...
pause >nul
