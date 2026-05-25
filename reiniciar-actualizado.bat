@echo off
title TrazaSole - Actualizar y Reiniciar
echo ========================================
echo   TRAZASOLE - Actualizar y Reiniciar
echo ========================================
echo.
cd /d "C:\TrazaSole"

echo [1/6] Deteniendo servidor actual...
taskkill /F /IM bun.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo      Servidor detenido.

echo.
echo [2/6] Guardando cambios locales (schema.prisma)...
git stash push -m "temp_schema_backup" -- prisma/schema.prisma 2>nul
if %ERRORLEVEL% equ 0 (
    echo      Cambios guardados temporalmente.
) else (
    echo      No hay cambios locales para guardar.
)

echo.
echo [3/6] Descargando actualizaciones de GitHub...
git pull origin master
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ALERTA] No se pudieron descargar actualizaciones
    echo         Posible conflicto o sin conexion
    echo         Intentando recuperar cambios locales...
    git stash pop >nul 2>&1
) else (
    echo      Actualizaciones descargadas.
)

echo.
echo [4/6] Restaurando configuracion PostgreSQL...
REM Asegurar que el provider sea postgresql
powershell -Command "(Get-Content 'prisma/schema.prisma') -replace 'provider = \"sqlite\"', 'provider = \"postgresql\"' | Set-Content 'prisma/schema.prisma'"
echo      Schema configurado para PostgreSQL.

echo.
echo [5/6] Instalando dependencias y sincronizando BD...
bun install >nul 2>&1
bun run db:push >nul 2>&1
bun run db:generate >nul 2>&1
echo      Sistema listo.

echo.
echo [6/6] Iniciando servidor...
echo.
echo ========================================
echo   Sistema actualizado y listo!
echo   Servidor: http://localhost:3000
echo ========================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
timeout /t 3 /nobreak >nul
bun run dev
