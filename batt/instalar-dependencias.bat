@echo off
chcp 65001 >nul
title TrazaSole - Instalar Dependencias
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - INSTALAR DEPENDENCIAS
echo ========================================
echo.

echo [INFO] Detectando gestor de paquetes...

where bun >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [DETECTADO] Bun encontrado - usando bun
    echo.
    goto USAR_BUN
)

where npm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [DETECTADO] NPM encontrado
    echo.
    goto USAR_NPM
)

echo [ERROR] No se encontro bun ni npm
echo [SOLUCION] Instala Node.js desde https://nodejs.org
pause
exit /b 1

:USAR_BUN
echo [1/3] Limpiando...
if exist "node_modules" rmdir /s /q "node_modules" 2>nul
echo [OK]

echo.
echo [2/3] Instalando con bun...
echo [INFO] Esto puede tomar varios minutos...
echo.
bun install

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Fallo bun install
    echo [INFO] Intentando con npm...
    goto USAR_NPM
)

echo.
echo [3/3] Generando Prisma...
npx prisma generate

echo.
echo ========================================
echo  COMPLETADO
echo ========================================
echo.
pause
exit /b 0

:USAR_NPM
echo [1/3] Limpiando...
if exist "node_modules" rmdir /s /q "node_modules" 2>nul
del /q "package-lock.json" 2>nul
echo [OK]

echo.
echo [2/3] Instalando con npm (legacy-peer-deps)...
echo [INFO] Esto puede tomar varios minutos...
echo.
call npm install --legacy-peer-deps

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Fallo la instalacion
    pause
    exit /b 1
)

echo.
echo [3/3] Generando Prisma...
npx prisma generate

echo.
echo ========================================
echo  COMPLETADO
echo ========================================
echo.
echo Ahora podes ejecutar: iniciar-servidor.bat
echo.
pause