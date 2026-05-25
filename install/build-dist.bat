@echo off
chcp 65001 >nul
title SOLEMAR ALIMENTARIA - Empaquetar Distribución
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     SOLEMAR ALIMENTARIA - EMPAQUETAR DISTRIBUCIÓN              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set "PROJECT_DIR=%~dp0.."
set "DIST_DIR=%PROJECT_DIR%\dist"
set "DATE=%date:~-4,4%%date:~-7,2%%date:~-10,2%"

:: Crear estructura de distribución
echo [1/4] Creando estructura de carpetas...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\server\app"
mkdir "%DIST_DIR%\server\app\db"
mkdir "%DIST_DIR%\server\backups"
mkdir "%DIST_DIR%\server\logs"
mkdir "%DIST_DIR%\client"

echo [OK] Estructura creada

echo.
echo [2/4] Copiando archivos del servidor...

:: Copiar código de la aplicación
xcopy "%PROJECT_DIR%\src" "%DIST_DIR%\server\app\src" /E /I /Y
xcopy "%PROJECT_DIR%\prisma" "%DIST_DIR%\server\app\prisma" /E /I /Y
xcopy "%PROJECT_DIR%\public" "%DIST_DIR%\server\app\public" /E /I /Y

:: Copiar archivos de configuración
copy "%PROJECT_DIR%\package.json" "%DIST_DIR%\server\app\" >nul
copy "%PROJECT_DIR%\package-lock.json" "%DIST_DIR%\server\app\" >nul 2>nul
copy "%PROJECT_DIR%\bun.lock" "%DIST_DIR%\server\app\" >nul 2>nul
copy "%PROJECT_DIR%\next.config.ts" "%DIST_DIR%\server\app\" >nul
copy "%PROJECT_DIR%\tsconfig.json" "%DIST_DIR%\server\app\" >nul
copy "%PROJECT_DIR%\tailwind.config.ts" "%DIST_DIR%\server\app\" >nul
copy "%PROJECT_DIR%\postcss.config.mjs" "%DIST_DIR%\server\app\" >nul
copy "%PROJECT_DIR%\components.json" "%DIST_DIR%\server\app\" >nul
copy "%PROJECT_DIR%\.env" "%DIST_DIR%\server\app\" >nul
copy "%PROJECT_DIR%\.env.example" "%DIST_DIR%\server\app\" >nul

:: Copiar base de datos si existe
if exist "%PROJECT_DIR%\db\custom.db" (
    copy "%PROJECT_DIR%\db\custom.db" "%DIST_DIR%\server\app\db\" >nul
    echo [OK] Base de datos incluida
) else (
    echo [ADVERTENCIA] No se encontró base de datos
)

:: Copiar scripts de instalación del servidor
copy "%PROJECT_DIR%\install\server\*.bat" "%DIST_DIR%\server\" >nul

echo [OK] Archivos del servidor copiados

echo.
echo [3/4] Copiando archivos de cliente...

copy "%PROJECT_DIR%\install\client\*.bat" "%DIST_DIR%\client\" >nul

echo [OK] Archivos de cliente copiados

echo.
echo [4/4] Copiando documentación...

copy "%PROJECT_DIR%\install\INSTALL.md" "%DIST_DIR%\" >nul
copy "%PROJECT_DIR%\install\README.md" "%DIST_DIR%\" >nul
copy "%PROJECT_DIR%\PROMPT_AI.md" "%DIST_DIR%\" >nul

echo [OK] Documentación copiada

:: Crear archivo de instrucciones
echo. > "%DIST_DIR%\INSTRUCCIONES.txt"
echo ════════════════════════════════════════════════════════════════ >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo SOLEMAR ALIMENTARIA - Sistema de Gestión Frigorífica >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo Fecha de distribución: %DATE% >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo ════════════════════════════════════════════════════════════════ >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo. >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo CONTENIDO: >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo. >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo server\  - Archivos para instalar en el SERVIDOR >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo   ├── install-server.bat  - Ejecutar COMO ADMINISTRADOR >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo   ├── start-server.bat    - Iniciar el servidor >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo   ├── stop-server.bat     - Detener el servidor >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo   ├── backup.bat          - Backup manual >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo   ├── update.bat          - Actualizar sistema >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo   └── app\                - Código fuente de la aplicación >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo. >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo client\ - Archivos para instalar en cada PUESTO CLIENTE >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo   └── install-client.bat  - Configura acceso al servidor >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo. >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo ════════════════════════════════════════════════════════════════ >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo INSTALACIÓN RÁPIDA: >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo ════════════════════════════════════════════════════════════════ >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo. >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo 1. SERVIDOR: >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo    - Copiar carpeta "server" a C:\SolemarAlimentaria\ >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo    - Ejecutar install-server.bat como ADMINISTRADOR >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo    - Ejecutar start-server.bat para iniciar >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo. >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo 2. CLIENTES: >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo    - Ejecutar install-client.bat en cada PC >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo    - Ingresar IP del servidor (ej: 192.168.1.100) >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo. >> "%DIST_DIR%\INSTRUCCIONES.txt"
echo ════════════════════════════════════════════════════════════════ >> "%DIST_DIR%\INSTRUCCIONES.txt"

echo.
echo ════════════════════════════════════════════════════════════════
echo   DISTRIBUCIÓN CREADA EXITOSAMENTE
echo ════════════════════════════════════════════════════════════════
echo.
echo   Ubicación: %DIST_DIR%
echo.
echo   Para distribuir: Comprimir la carpeta "dist" a ZIP
echo.
pause
