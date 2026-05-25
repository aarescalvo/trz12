@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║     INSTALADOR AUTOMATICO - SISTEMA FRIGORIFICO SOLEMAR         ║
echo ║              Windows Server con PostgreSQL                       ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Este instalador descargara e instalara automaticamente:
echo   - Node.js v20 LTS
echo   - PostgreSQL 16
echo   - Sistema Frigorifico Solemar
echo.
echo NOTA: Este proceso puede tardar 15-30 minutos dependiendo de su
echo conexion a internet y velocidad del servidor.
echo.
pause

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Este instalador requiere permisos de administrador.
    echo Haga clic derecho y seleccione "Ejecutar como administrador".
    echo.
    pause
    exit /b 1
)

:: Verificar si PowerShell está disponible
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PowerShell no esta disponible en este sistema.
    echo.
    pause
    exit /b 1
)

:: Ejecutar el script de PowerShell
echo.
echo Iniciando instalacion automatica...
echo.

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0install-auto.ps1"

echo.
echo Instalacion finalizada.
pause
