@echo off
chcp 65001 >nul
title TrazaSole - Deteniendo Servidor
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║         TRAZASOLE v3.7.24 - DETENIENDO SERVIDOR        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo [INFO] Buscando procesos de bun y node...
echo.

REM Matar procesos bun
tasklist /FI "IMAGENAME eq bun.exe" 2>NUL | find /I /N "bun.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [ACCION] Deteniendo procesos bun.exe...
    taskkill /F /IM bun.exe >NUL 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo [OK] Procesos bun.exe detenidos.
    ) else (
        echo [ERROR] No se pudieron detener los procesos bun.exe.
    )
) else (
    echo [INFO] No hay procesos bun.exe ejecutandose.
)

echo.

REM Matar procesos node (por si acaso)
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [ACCION] Deteniendo procesos node.exe...
    taskkill /F /IM node.exe >NUL 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo [OK] Procesos node.exe detenidos.
    ) else (
        echo [ERROR] No se pudieron detener los procesos node.exe.
    )
) else (
    echo [INFO] No hay procesos node.exe ejecutandose.
)

echo.
echo ════════════════════════════════════════════════════════════
echo [LISTO] Servidor detenido completamente.
echo ════════════════════════════════════════════════════════════
echo.
pause
