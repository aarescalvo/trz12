@echo off
chcp 65001 >nul
title Instalador Frigorifico Solemar - Windows 10/11

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║         FRIGORIFICO SOLEMAR - INSTALADOR WINDOWS               ║
echo ║                    Version 1.0.0                                ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este instalador requiere permisos de administrador.
    echo.
    echo Por favor, haga clic derecho sobre este archivo y seleccione:
    echo "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

:: Crear directorio de instalacion
set INSTALL_DIR=C:\FrigorificoSolemar
echo [1/8] Creando directorio de instalacion...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\data" mkdir "%INSTALL_DIR%\data"
if not exist "%INSTALL_DIR%\backups" mkdir "%INSTALL_DIR%\backups"

:: Verificar si Bun ya esta instalado
echo [2/8] Verificando dependencias...
where bun >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Bun ya esta instalado
) else (
    echo [INSTALANDO] Bun runtime...
    powershell -Command "irm bun.sh/install.ps1 | iex"
    if %errorLevel% neq 0 (
        echo [ERROR] No se pudo instalar Bun automaticamente.
        echo Por favor instale Bun manualmente desde: https://bun.sh
        pause
        exit /b 1
    )
)

:: Copiar archivos del programa
echo [3/8] Copiando archivos del programa...
xcopy /E /I /Y "%~dp0..\*" "%INSTALL_DIR%\app\" >nul 2>&1

:: Crear archivo de configuracion
echo [4/8] Creando configuracion...
(
echo DATABASE_URL="file:%INSTALL_DIR%\data\frigorifico.db"
echo NODE_ENV=production
) > "%INSTALL_DIR%\app\.env"

:: Instalar dependencias
echo [5/8] Instalando dependencias (esto puede tardar varios minutos)...
cd /d "%INSTALL_DIR%\app"
bun install --production 2>nul
if %errorLevel% neq 0 (
    echo [ERROR] Error al instalar dependencias.
    pause
    exit /b 1
)

:: Inicializar base de datos
echo [6/8] Inicializando base de datos...
cd /d "%INSTALL_DIR%\app"
bun run db:push 2>nul
if %errorLevel% neq 0 (
    echo [ERROR] Error al crear la base de datos.
    pause
    exit /b 1
)

bun run db:seed 2>nul
if %errorLevel% neq 0 (
    echo [WARNING] Error al cargar datos iniciales. Intentelo manualmente despues.
)

:: Crear acceso directo en el escritorio
echo [7/8] Creando accesos directos...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%USERPROFILE%\Desktop\Frigorifico Solemar.lnk'); $s.TargetPath = '%INSTALL_DIR%\iniciar.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'Sistema de Gestion Frigorifica'; $s.Save()"

:: Crear script de inicio
(
echo @echo off
echo cd /d "%INSTALL_DIR%\app"
echo start http://localhost:3000
echo bun run dev
echo pause
) > "%INSTALL_DIR%\iniciar.bat"

:: Crear script de detencion
(
echo @echo off
echo taskkill /F /IM bun.exe 2>nul
echo taskkill /F /IM node.exe 2>nul
echo echo Sistema detenido correctamente.
echo pause
) > "%INSTALL_DIR%\detener.bat"

:: Crear script de respaldo
(
echo @echo off
echo set FECHA=%%date:~-4,4%%%%date:~-7,2%%%%date:~-10,2%%
echo set HORA=%%time:~0,2%%%%time:~3,2%%
echo set HORA=%%HORA: =0%%
echo copy "%INSTALL_DIR%\data\frigorifico.db" "%INSTALL_DIR%\backups\backup_%%FECHA%_%%HORA%%.db"
echo echo Respaldo creado correctamente.
echo pause
) > "%INSTALL_DIR%\respaldar.bat"

:: Crear script de desinstalacion
(
echo @echo off
echo echo Desinstalando Frigorifico Solemar...
echo taskkill /F /IM bun.exe 2>nul
echo rmdir /S /Q "%INSTALL_DIR%\app" 2>nul
echo del "%USERPROFILE%\Desktop\Frigorifico Solemar.lnk" 2>nul
echo echo Desinstalacion completada.
echo pause
) > "%INSTALL_DIR%\desinstalar.bat"

:: Crear firewall rule
echo [8/8] Configurando firewall de Windows...
netsh advfirewall firewall add rule name="Frigorifico Solemar" dir=in action=allow protocol=tcp localport=3000 >nul 2>&1

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║              INSTALACION COMPLETADA EXITOSAMENTE                ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo El sistema se ha instalado en: %INSTALL_DIR%
echo.
echo ACCESOS DIRECTOS CREADOS:
echo   - Escritorio: "Frigorifico Solemar"
echo.
echo ARCHIVOS IMPORTANTES:
echo   - Iniciar sistema: %INSTALL_DIR%\iniciar.bat
echo   - Detener sistema: %INSTALL_DIR%\detener.bat
echo   - Hacer respaldo: %INSTALL_DIR%\respaldar.bat
echo   - Desinstalar: %INSTALL_DIR%\desinstalar.bat
echo.
echo CREDENCIALES POR DEFECTO:
echo   - Usuario: admin
echo   - Password: admin123
echo   - PIN: 1234
echo.
echo PRESIONE CUALQUIER TECLA PARA INICIAR EL SISTEMA...
pause >nul

:: Iniciar el sistema
cd /d "%INSTALL_DIR%\app"
start http://localhost:3000
bun run dev
