@echo off
chcp 65001 >nul
setlocal
title TrazaSole
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - INICIAR SEGUNDO PLANO
echo ========================================
echo.

tasklist /FI "IMAGENAME eq bun.exe" 2>NUL | find /I "bun.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo [INFO] Servidor ya esta ejecutandose
    echo [URL] http://localhost:3000
    pause
    exit /b 0
)

echo [INFO] Iniciando servidor minimizado...
start /min cmd /c "title TrazaSole - Servidor && npx next dev -p 3000"
timeout /t 6 /nobreak >nul

echo.
echo [OK] Servidor iniciado
echo [URL] http://localhost:3000
echo.
echo Presiona una tecla para cerrar esta ventana...
pause >nul