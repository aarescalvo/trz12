@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Produccion
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - INICIAR PRODUCCION
echo ========================================
echo.

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo [WARN] Servidor ya esta ejecutandose
    pause
    exit /b 0
)

echo [INFO] Verificando construccion...
if not exist ".next" (
    echo [INFO] Build no existe, compilando...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Fallo la compilacion
        pause
        exit /b 1
    )
)

echo [INFO] Iniciando en modo produccion...
echo [URL] http://localhost:3000
echo.

npm run start

echo.
echo [INFO] Servidor detenido
pause