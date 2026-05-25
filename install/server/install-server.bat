@echo off
chcp 65001 >nul
title SOLEMAR ALIMENTARIA - Instalador del Servidor
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         SOLEMAR ALIMENTARIA - INSTALADOR SERVIDOR              ║
echo ║                    Sistema de Gestión Frigorífica              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este instalador requiere permisos de administrador.
    echo Clic derecho en este archivo y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

:: Configurar variables
set "INSTALL_DIR=C:\SolemarAlimentaria"
set "BACKUP_DIR=C:\SolemarAlimentaria\backups"
set "DATA_DIR=C:\SolemarAlimentaria\data"

echo [1/8] Verificando requisitos del sistema...
echo.

:: Verificar si existe Bun o instalar Node.js
where bun >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Bun ya está instalado
    set "RUNTIME=bun"
) else (
    where node >nul 2>&1
    if %errorLevel% equ 0 (
        echo [OK] Node.js ya está instalado
        set "RUNTIME=node"
    ) else (
        echo [INFO] Instalando Node.js...
        :: Descargar Node.js LTS
        powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'}"
        msiexec /i "%TEMP%\nodejs.msi" /qn
        set "RUNTIME=node"
    )
)

echo.
echo [2/8] Creando estructura de directorios...
echo.

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"

echo [OK] Directorios creados:
echo      - %INSTALL_DIR%
echo      - %BACKUP_DIR%
echo      - %DATA_DIR%

echo.
echo [3/8] Configurando dirección IP fija...
echo.

:: Mostrar adaptadores de red disponibles
echo Adaptadores de red disponibles:
ipconfig | findstr /i "Ethernet Wi-Fi adaptador"
echo.

set /p CONFIGURE_IP="¿Desea configurar IP fija? (S/N): "
if /i "%CONFIGURE_IP%"=="S" (
    set /p IP_ADDRESS="Ingrese la IP deseada (ej: 192.168.1.100): "
    set /p GATEWAY="Ingrese el Gateway (ej: 192.168.1.1): "
    set /p DNS="Ingrese DNS (ej: 8.8.8.8): "

    echo.
    echo [INFO] Configurando IP fija...
    netsh interface ip set address "Ethernet" static %IP_ADDRESS% 255.255.255.0 %GATEWAY%
    netsh interface ip set dns "Ethernet" static %DNS%

    echo [OK] IP configurada: %IP_ADDRESS%
)

echo.
echo [4/8] Copiando archivos de la aplicación...
echo.

:: Crear archivo de configuración de red
echo { > "%INSTALL_DIR%\config.json"
echo   "serverIp": "%IP_ADDRESS%", >> "%INSTALL_DIR%\config.json"
echo   "port": 3000, >> "%INSTALL_DIR%\config.json"
echo   "backupDir": "%BACKUP_DIR:\=\\%", >> "%INSTALL_DIR%\config.json"
echo   "dataDir": "%DATA_DIR:\=\\%" >> "%INSTALL_DIR%\config.json"
echo } >> "%INSTALL_DIR%\config.json"

echo [OK] Archivos de configuración creados

echo.
echo [5/8] Configurando firewall de Windows...
echo.

:: Permitir puerto 3000 en el firewall
netsh advfirewall firewall add rule name="Solemar Alimentaria - Puerto 3000" dir=in action=allow protocol=tcp localport=3000
netsh advfirewall firewall add rule name="Solemar Alimentaria - Puerto 3000" dir=out action=allow protocol=tcp localport=3000

echo [OK] Firewall configurado (puerto 3000 abierto)

echo.
echo [6/8] Creando script de inicio automático...
echo.

:: Crear script de inicio
echo @echo off > "%INSTALL_DIR%\start-server.bat"
echo cd /d "%INSTALL_DIR%\app" >> "%INSTALL_DIR%\start-server.bat"
echo echo Iniciando servidor Solemar Alimentaria... >> "%INSTALL_DIR%\start-server.bat"
echo echo Presione Ctrl+C para detener >> "%INSTALL_DIR%\start-server.bat"
echo bun run dev ^> "%INSTALL_DIR%\logs\server.log" 2^>^&1 >> "%INSTALL_DIR%\start-server.bat"

:: Crear servicio de Windows usando NSSM (si está disponible) o tarea programada
echo Creando tarea de inicio automático...
schtasks /create /tn "SolemarAlimentaria" /tr "\"%INSTALL_DIR%\start-server.bat\"" /sc onstart /ru SYSTEM /rl HIGHEST /f

echo [OK] Tarea de inicio automático creada

echo.
echo [7/8] Configurando backups automáticos...
echo.

:: Crear script de backup
echo @echo off > "%INSTALL_DIR%\backup.bat"
echo chcp 65001 ^>nul >> "%INSTALL_DIR%\backup.bat"
echo set "BACKUP_DIR=%BACKUP_DIR%" >> "%INSTALL_DIR%\backup.bat"
echo set "DATA_DIR=%DATA_DIR%" >> "%INSTALL_DIR%\backup.bat"
echo set "DATE=%%date:~-4,4%%%%date:~-7,2%%%%date:~-10,2%%" >> "%INSTALL_DIR%\backup.bat"
echo set "TIME=%%time:~0,2%%%%time:~3,2%%" >> "%INSTALL_DIR%\backup.bat"
echo set "TIME=%%TIME: =0%%" >> "%INSTALL_DIR%\backup.bat"
echo set "BACKUP_FILE=%%BACKUP_DIR%%\backup_%%DATE%%_%%TIME%%.db" >> "%INSTALL_DIR%\backup.bat"
echo. >> "%INSTALL_DIR%\backup.bat"
echo echo Creando backup: %%BACKUP_FILE%% >> "%INSTALL_DIR%\backup.bat"
echo copy "%%DATA_DIR%%\custom.db" "%%BACKUP_FILE%%" ^>nul >> "%INSTALL_DIR%\backup.bat"
echo echo Backup completado >> "%INSTALL_DIR%\backup.bat"
echo. >> "%INSTALL_DIR%\backup.bat"
echo :: Eliminar backups anteriores a 30 dias >> "%INSTALL_DIR%\backup.bat"
echo forfiles /p "%%BACKUP_DIR%%" /m *.db /d -30 /c "cmd /c del @path" 2^>nul >> "%INSTALL_DIR%\backup.bat"

:: Crear tarea programada para backup diario a las 23:00
schtasks /create /tn "SolemarAlimentaria_Backup" /tr "\"%INSTALL_DIR%\backup.bat\"" /sc daily /st 23:00 /ru SYSTEM /f

echo [OK] Backup automático configurado (diario a las 23:00)

echo.
echo [8/8] Creando accesos directos...
echo.

:: Crear acceso directo en el escritorio
powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Solemar Servidor.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-server.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Iniciar servidor Solemar Alimentaria'; $Shortcut.Save()}"

powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Solemar Backup Manual.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\backup.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Backup manual de la base de datos'; $Shortcut.Save()}"

echo [OK] Accesos directos creados

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              INSTALACIÓN COMPLETADA EXITOSAMENTE               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Resumen de la instalación:
echo ══════════════════════════════════════════════════════════════════
echo.
echo   📁 Directorio de instalación: %INSTALL_DIR%
echo   📁 Directorio de backups:     %BACKUP_DIR%
echo   📁 Directorio de datos:       %DATA_DIR%
echo   🌐 IP del servidor:           %IP_ADDRESS%
echo   🔌 Puerto:                    3000
echo.
echo   URL de acceso desde clientes: http://%IP_ADDRESS%:3000
echo.
echo ══════════════════════════════════════════════════════════════════
echo.
echo Próximos pasos:
echo   1. Copie la carpeta 'app' con el código fuente a %INSTALL_DIR%\app
echo   2. Ejecute "Solemar Servidor" desde el escritorio
echo   3. En cada PC cliente, configure el acceso a http://%IP_ADDRESS%:3000
echo.
echo Presione cualquier tecla para salir...
pause >nul
