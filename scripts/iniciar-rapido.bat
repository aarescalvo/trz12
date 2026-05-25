@echo off
chcp 65001 >nul
echo ========================================
echo   TRAZASOLE v3.7.28 - INICIO RAPIDO
echo ========================================
echo.

cd /d "%~dp0.."

:: Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo [ERROR] No se encontro package.json
    pause
    exit /b 1
)

:: Limpiar cache de Next.js si existe y es muy grande
if exist ".next\cache" (
    echo [1/3] Limpiando cache antiguo...
    rmdir /s /q ".next\cache" 2>nul
)

:: Verificar node_modules
if not exist "node_modules" (
    echo [1/3] Instalando dependencias...
    bun install
) else (
    echo [1/3] Dependencias OK
)

:: Iniciar servidor
echo [2/3] Iniciando servidor Next.js...
echo.
echo ========================================
echo   El servidor iniciara en segundos
echo   Primera vez: ~30-60 segundos
echo   Siguientes: ~10-20 segundos
echo ========================================
echo.
echo [3/3] Servidor corriendo en: http://localhost:3000
echo       Presione Ctrl+C para detener
echo.

:: Iniciar con bun (mas rapido que npm)
bun run dev
