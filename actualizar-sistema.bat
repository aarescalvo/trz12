@echo off
chcp 65001 >nul
title Actualizar Sistema TrazaSole

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║         ACTUALIZADOR DE SISTEMA TRAZASOLE                ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Este script descargará las últimas actualizaciones      ║
echo ║  desde GitHub y reiniciará el servidor.                  ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Verificar si estamos en la carpeta correcta
if not exist "package.json" (
    echo [ERROR] No se encuentra package.json
    echo Asegúrese de ejecutar este script desde la carpeta del sistema.
    pause
    exit /b 1
)

echo [PASO 1/5] Deteniendo servidor si está corriendo...
taskkill /F /IM bun.exe 2>nul
timeout /t 2 >nul
echo              Servidor detenido.
echo.

echo [PASO 2/5] Descargando actualizaciones desde GitHub...
git fetch origin
git pull origin master
if errorlevel 1 (
    echo [ADVERTENCIA] Hubo un problema al descargar actualizaciones.
    echo               Posible conflicto o sin conexión a internet.
    echo.
    choice /C SN /M "¿Desea continuar de todas formas?"
    if errorlevel 2 exit /b 1
)
echo              Actualizaciones descargadas.
echo.

echo [PASO 3/5] Actualizando base de datos...
bun run db:push
if errorlevel 1 (
    echo [ERROR] Hubo un problema al actualizar la base de datos.
    pause
    exit /b 1
)
echo              Base de datos actualizada.
echo.

echo [PASO 4/5] Instalando dependencias si hay cambios...
bun install
echo              Dependencias verificadas.
echo.

echo [PASO 5/5] Iniciando servidor...
echo.
echo ══════════════════════════════════════════════════════════
echo   SERVIDOR INICIADO - Abrir en navegador: http://localhost:3000
echo ══════════════════════════════════════════════════════════
echo.
echo   Presione Ctrl+C para detener el servidor.
echo.

start "" cmd /c "bun run dev"
timeout /t 3 >nul
echo.
echo [LISTO] Sistema actualizado y funcionando.
echo.
