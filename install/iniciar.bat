@echo off
title Solemar Alimentaria - Inicio Rapido
cls
echo.
echo ============================================
echo    SOLEMAR ALIMENTARIA - FRIGORIFICO
echo    Sistema de Gestion Frigorifica v2.0
echo    Repositorio: github.com/aarescalvo/123
echo ============================================
echo.
echo Iniciando sistema...
echo Por favor espere...
echo.

cd /d "%~dp0"

:: Verificar si Bun esta instalado
where bun >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Bun no esta instalado
    echo.
    echo Por favor ejecute install-windows.ps1 primero:
    echo   Set-ExecutionPolicy Bypass -Scope Process -Force
    echo   .\install-windows.ps1
    echo.
    echo O instale Bun desde: https://bun.sh
    echo.
    pause
    exit /b 1
)

:: Verificar si estamos en la carpeta correcta
if not exist "package.json" (
    if exist "..\package.json" (
        cd ..
    ) else (
        echo [ERROR] No se encontro package.json
        echo Asegurese de ejecutar este script desde la carpeta de instalacion.
        echo.
        pause
        exit /b 1
    )
)

:: Verificar si existe node_modules
if not exist "node_modules" (
    echo [INFO] Instalando dependencias por primera vez...
    echo.
    call bun install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error instalando dependencias
        echo.
        pause
        exit /b 1
    )
    echo.
)

:: Verificar si existe la base de datos
if not exist "Data\db\solemar.db" (
    if not exist "db\solemar.db" (
        echo [INFO] Configurando base de datos por primera vez...
        echo.
        if not exist "Data\db" mkdir Data\db
        call bun run db:generate
        call bun run db:push
        call bun run db:seed
        if %ERRORLEVEL% NEQ 0 (
            echo [WARN] Error configurando base de datos, intentando continuar...
        )
        echo.
    )
)

:: Verificar si existe .next (build)
if not exist ".next" (
    echo [INFO] Compilando aplicacion por primera vez...
    echo.
    call bun run build
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] Error compilando, intentando iniciar de todos modos...
    )
    echo.
)

echo.
echo ============================================
echo    SISTEMA INICIADO CORRECTAMENTE
echo ============================================
echo.
echo  Abra su navegador en: http://localhost:3000
echo.
echo  Credenciales por defecto:
echo    Usuario: admin
echo    Password: admin123
echo    PIN: 1234
echo.
echo  Presione Ctrl+C para detener el servidor
echo ============================================
echo.

:: Abrir navegador automaticamente
start http://localhost:3000

:: Iniciar el servidor
bun run start

pause
