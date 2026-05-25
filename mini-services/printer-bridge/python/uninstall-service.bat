@echo off
chcp 65001 >nul
title Printer Bridge - Desinstalar Servicio Windows
echo ============================================================
echo   PRINTER BRIDGE v3.0 - Desinstalar Servicio
echo ============================================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Necesitas ejecutar esto como Administrador.
    echo   Click derecho - Ejecutar como administrador
    pause
    exit /b 1
)

:: Detener procesos Python
echo Deteniendo procesos del bridge...
taskkill /F /FI "WINDOWTITLE eq Printer Bridge*" >nul 2>&1

:: Eliminar tarea programada
schtasks /query /tn "PrinterBridgeSolemar" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    schtasks /delete /tn "PrinterBridgeSolemar" /f >nul 2>&1
    echo [OK] Tarea programada eliminada.
) else (
    echo [INFO] No hay tarea programada para eliminar.
)

:: Limpiar wrapper
if exist "C:\SolemarAlimentaria\printer-bridge\service-wrapper.vbs" (
    del /F "C:\SolemarAlimentaria\printer-bridge\service-wrapper.vbs"
    echo [OK] Wrapper eliminado.
)

echo.
echo [OK] Servicio desinstalado.
echo.
echo   Los archivos del bridge no fueron eliminados.
echo   Para reinstalar: ejecuta install-service.bat como Administrador.
echo.

pause
