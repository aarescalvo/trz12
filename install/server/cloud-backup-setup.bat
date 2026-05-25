@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title ☁️ Configurador de Backup en la Nube - Solemar Alimentaria

:: ============================================
:: CONFIGURADOR DE BACKUP EN LA NUBE
:: Solemar Alimentaria S.A.
:: ============================================

color 0E
cls

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║     ☁️ CONFIGURADOR DE BACKUP EN LA NUBE                     ║
echo  ║              Solemar Alimentaria S.A.                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo  ⚠️  Este script requiere permisos de administrador.
    echo  Por favor, haga clic derecho y "Ejecutar como administrador".
    pause
    exit /b 1
)

:: Verificar que existe la instalación
if not exist "C:\SolemarAlimentaria\app\db\custom.db" (
    echo  ❌ No se encontró la instalación de Solemar Alimentaria.
    echo  Ejecute primero install-server.bat
    pause
    exit /b 1
)

:: ============================================
:: PASO 1: SELECCIONAR SERVICIO DE NUBE
:: ============================================

echo  ☁️ Seleccione el SERVICIO DE ALMACENAMIENTO EN LA NUBE:
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  [1] Google Drive   - Requiere app de escritorio instalada  ║
echo  ║  [2] OneDrive       - Incluido en Windows 10/11             ║
echo  ║  [3] Dropbox        - Requiere app de escritorio instalada  ║
echo  ║  [4] Carpeta de Red - NAS o servidor en la red              ║
echo  ║  [5] FTP            - Servidor FTP externo                  ║
echo  ║  [6] Ninguno        - Desactivar backup en la nube          ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set /p cloud_select="  Ingrese número [1-6]: "

if "%cloud_select%"=="1" (
    set "cloud_service=GOOGLE_DRIVE"
    set "cloud_name=Google Drive"
    set "default_path=%USERPROFILE%\Google Drive\SolemarAlimentaria"
)
if "%cloud_select%"=="2" (
    set "cloud_service=ONEDRIVE"
    set "cloud_name=OneDrive"
    set "default_path=%USERPROFILE%\OneDrive\SolemarAlimentaria"
)
if "%cloud_select%"=="3" (
    set "cloud_service=DROPBOX"
    set "cloud_name=Dropbox"
    set "default_path=%USERPROFILE%\Dropbox\SolemarAlimentaria"
)
if "%cloud_select%"=="4" (
    set "cloud_service=NETWORK_SHARE"
    set "cloud_name=Carpeta de Red"
    set "default_path=\\SERVIDOR\backups\SolemarAlimentaria"
)
if "%cloud_select%"=="5" (
    set "cloud_service=FTP"
    set "cloud_name=FTP"
    set "default_path=ftp://servidor.com/backups"
)
if "%cloud_select%"=="6" (
    echo.
    echo  ⚠️  Backup en la nube desactivado.
    echo  Los backups locales seguirán funcionando normalmente.
    pause
    exit /b 0
)

if not defined cloud_service (
    echo  ❌ Opción inválida.
    pause
    exit /b 1
)

echo.
echo  ✅ Servicio seleccionado: %cloud_name%
echo.

:: ============================================
:: PASO 2: CONFIGURAR RUTA DE BACKUP
:: ============================================

echo  📁 CONFIGURACIÓN DE RUTA
echo  ════════════════════════════════════════════════════════════════
echo.
echo  Ruta por defecto: %default_path%
echo.

set /p custom_path="  Ingrese ruta personalizada (Enter para usar por defecto): "

if "%custom_path%"=="" (
    set "backup_path=%default_path%"
) else (
    set "backup_path=%custom_path%"
)

echo.
echo  ✅ Ruta de backup: %backup_path%
echo.

:: ============================================
:: PASO 3: CONFIGURACIÓN FTP (si aplica)
:: ============================================

if "%cloud_service%"=="FTP" (
    echo  🔐 CONFIGURACIÓN FTP
    echo  ════════════════════════════════════════════════════════════════
    echo.
    
    set /p ftp_server="  Servidor FTP (ej: ftp.miservidor.com): "
    set /p ftp_user="  Usuario FTP: "
    set /p ftp_pass="  Contraseña FTP: "
    set /p ftp_port="  Puerto [default 21]: "
    
    if "%ftp_port%"=="" set "ftp_port=21"
    
    echo.
    echo  ✅ Configuración FTP guardada
    echo.

    :: Crear archivo de credenciales FTP encriptado
    set "ftp_config=C:\SolemarAlimentaria\config\ftp_config.txt"
    (
        echo server=%ftp_server%
        echo user=%ftp_user%
        echo password=%ftp_pass%
        echo port=%ftp_port%
    ) > "%ftp_config%"
    
    echo  ⚠️  NOTA: Las credenciales FTP se guardan sin encriptar.
    echo  Asegúrese de proteger el archivo: %ftp_config%
    echo.
)

:: ============================================
:: PASO 4: CONFIGURACIÓN DE FRECUENCIA
:: ============================================

echo  ⏰ FRECUENCIA DE BACKUP
echo  ════════════════════════════════════════════════════════════════
echo.
echo  [1] Cada hora      - Máxima seguridad
echo  [2] Cada 4 horas   - Alta frecuencia
echo  [3] Cada 12 horas  - Frecuencia media
echo  [4] Diario         - RECOMENDADO
echo  [5] Semanal        - Baja frecuencia
echo.

set /p freq_select="  Seleccione frecuencia [1-5]: "

if "%freq_select%"=="1" set "frequency=HOURLY" & set "cron=0 * * * *"
if "%freq_select%"=="2" set "frequency=EVERY_4_HOURS" & set "cron=0 */4 * * *"
if "%freq_select%"=="3" set "frequency=EVERY_12_HOURS" & set "cron=0 */12 * * *"
if "%freq_select%"=="4" set "frequency=DAILY" & set="0 23 * * *"
if "%freq_select%"=="5" set "frequency=WEEKLY" & set="0 23 * * 0"

if not defined frequency (
    echo  ❌ Opción inválida.
    pause
    exit /b 1
)

echo.
echo  ✅ Frecuencia: %frequency%
echo.

:: ============================================
:: PASO 5: CONFIGURACIÓN DE RETENCIÓN
:: ============================================

echo  📦 RETENCIÓN DE BACKUPS
echo  ════════════════════════════════════════════════════════════════
echo.
echo  ¿Cuántos backups mantener en la nube?
echo.
echo  [1] 7 días
echo  [2] 14 días
echo  [3] 30 días (RECOMENDADO)
echo  [4] 60 días
echo  [5] 90 días
echo.

set /p retain_select="  Seleccione [1-5]: "

if "%retain_select%"=="1" set "retention=7"
if "%retain_select%"=="2" set "retention=14"
if "%retain_select%"=="3" set "retention=30"
if "%retain_select%"=="4" set "retention=60"
if "%retain_select%"=="5" set="90"

if not defined retention set "retention=30"

echo.
echo  ✅ Retención: %retention% días
echo.

:: ============================================
:: PASO 6: VERIFICAR CONEXIÓN
:: ============================================

echo  🔍 VERIFICANDO CONEXIÓN...
echo  ════════════════════════════════════════════════════════════════
echo.

if "%cloud_service%"=="GOOGLE_DRIVE" (
    if exist "%USERPROFILE%\Google Drive" (
        echo  ✅ Google Drive detectado y sincronizado.
    ) else (
        echo  ❌ Google Drive no encontrado.
        echo  Instale la aplicación de escritorio de Google Drive.
        pause
        exit /b 1
    )
)

if "%cloud_service%"=="ONEDRIVE" (
    if exist "%USERPROFILE%\OneDrive" (
        echo  ✅ OneDrive detectado y sincronizado.
    ) else (
        echo  ❌ OneDrive no encontrado.
        echo  Configure OneDrive en Windows.
        pause
        exit /b 1
    )
)

if "%cloud_service%"=="DROPBOX" (
    if exist "%USERPROFILE%\Dropbox" (
        echo  ✅ Dropbox detectado y sincronizado.
    ) else (
        echo  ❌ Dropbox no encontrado.
        echo  Instale la aplicación de escritorio de Dropbox.
        pause
        exit /b 1
    )
)

if "%cloud_service%"=="NETWORK_SHARE" (
    :: Intentar crear carpeta de prueba
    if not exist "%backup_path%" (
        mkdir "%backup_path%" 2>nul
        if !errorlevel! neq 0 (
            echo  ❌ No se puede acceder a la carpeta de red.
            echo  Verifique que la ruta sea correcta y tenga permisos.
            pause
            exit /b 1
        )
    )
    echo  ✅ Carpeta de red accesible.
)

echo.

:: ============================================
:: PASO 7: CREAR CARPETA DE BACKUP
:: ============================================

echo  📁 Creando estructura de carpetas...

if not exist "%backup_path%" mkdir "%backup_path%" 2>nul

if exist "%backup_path%" (
    echo  ✅ Carpeta de backup creada: %backup_path%
) else (
    echo  ❌ No se pudo crear la carpeta de backup.
    pause
    exit /b 1
)

echo.

:: ============================================
:: PASO 8: CREAR SCRIPT DE BACKUP
:: ============================================

echo  📝 Creando script de backup automático...

set "cloud_backup_script=C:\SolemarAlimentaria\cloud-backup.bat"

(
echo @echo off
echo chcp 65001 ^>nul
echo.
echo :: Script de Backup en la Nube - Solemar Alimentaria
echo :: Generado automáticamente: %date% %time%
echo.
echo set "db_path=C:\SolemarAlimentaria\app\db\custom.db"
echo set "backup_path=%backup_path%"
echo set "date_stamp=%%date:~6,4%%%%date:~3,2%%%%date:~0,2%%"
echo set "time_stamp=%%time:~0,2%%%%time:~3,2%%"
echo set "time_stamp=%%time_stamp: =0%%"
echo set "backup_file=solemar_%%date_stamp%%_%%time_stamp%%.db"
echo.
echo :: Crear backup
echo echo %%date%% %%time%% - Iniciando backup en la nube... ^>^> "C:\SolemarAlimentaria\logs\cloud-backup.log"
echo.
echo if exist "%%db_path%%" ^(
echo     copy "%%db_path%%" "%%backup_path%%\%%backup_file%%" ^>nul
echo     echo %%date%% %%time%% - Backup creado: %%backup_file%% ^>^> "C:\SolemarAlimentaria\logs\cloud-backup.log"
echo ^) else ^(
echo     echo %%date%% %%time%% - ERROR: Base de datos no encontrada ^>^> "C:\SolemarAlimentaria\logs\cloud-backup.log"
echo ^)
echo.
echo :: Limpiar backups antiguos (mantener últimos %retention% días)
echo forfiles /p "%%backup_path%%" /m *.db /d -%retention% /c "cmd /c del @path" 2^>nul
echo.
echo echo Backup en la nube completado.
) > "%cloud_backup_script%"

echo  ✅ Script creado: %cloud_backup_script%
echo.

:: ============================================
:: PASO 9: CONFIGURAR TAREA PROGRAMADA
:: ============================================

echo  ⏰ Configurando tarea programada de Windows...
echo.

:: Eliminar tarea existente si existe
schtasks /delete /tn "SolemarAlimentaria_CloudBackup" /f >nul 2>&1

:: Crear nueva tarea según frecuencia
if "%frequency%"=="HOURLY" (
    schtasks /create /tn "SolemarAlimentaria_CloudBackup" /tr "%cloud_backup_script%" /sc hourly /mo 1 /st 00:00 /rl HIGHEST /f >nul 2>&1
)
if "%frequency%"=="EVERY_4_HOURS" (
    schtasks /create /tn "SolemarAlimentaria_CloudBackup" /tr "%cloud_backup_script%" /sc hourly /mo 4 /st 00:00 /rl HIGHEST /f >nul 2>&1
)
if "%frequency%"=="EVERY_12_HOURS" (
    schtasks /create /tn "SolemarAlimentaria_CloudBackup" /tr "%cloud_backup_script%" /sc hourly /mo 12 /st 00:00 /rl HIGHEST /f >nul 2>&1
)
if "%frequency%"=="DAILY" (
    schtasks /create /tn "SolemarAlimentaria_CloudBackup" /tr "%cloud_backup_script%" /sc daily /st 23:00 /rl HIGHEST /f >nul 2>&1
)
if "%frequency%"=="WEEKLY" (
    schtasks /create /tn "SolemarAlimentaria_CloudBackup" /tr "%cloud_backup_script%" /sc weekly /d SUN /st 23:00 /rl HIGHEST /f >nul 2>&1
)

if %errorlevel% equ 0 (
    echo  ✅ Tarea programada creada correctamente.
) else (
    echo  ⚠️  No se pudo crear la tarea programada.
    echo  Puede ejecutar el backup manualmente: %cloud_backup_script%
)

echo.

:: ============================================
:: PASO 10: GUARDAR CONFIGURACIÓN
:: ============================================

echo  💾 Guardando configuración...

set "configfile=C:\SolemarAlimentaria\config\cloud_backup.json"

(
echo {
echo   "servicio": "%cloud_service%",
echo   "nombre_servicio": "%cloud_name%",
echo   "ruta_backup": "%backup_path%",
echo   "frecuencia": "%frequency%",
echo   "retencion_dias": %retention%,
echo   "script_path": "%cloud_backup_script%",
echo   "fecha_configuracion": "%date% %time%"
echo }
) > "%configfile%"

echo  ✅ Configuración guardada: %configfile%
echo.

:: ============================================
:: PASO 11: PROBAR BACKUP
:: ============================================

echo  🧪 ¿Desea ejecutar un backup de PRUEBA ahora? [S/N]: 
set /p test_backup="  "

if /i "%test_backup%"=="S" (
    echo.
    echo  Ejecutando backup de prueba...
    call "%cloud_backup_script%"
    
    if exist "%backup_path%\solemar_*.db" (
        echo  ✅ Backup de prueba exitoso.
        dir "%backup_path%\solemar_*.db" /b
    ) else (
        echo  ❌ Error en el backup de prueba.
    )
)

echo.

:: ============================================
:: RESUMEN FINAL
:: ============================================

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  📋 RESUMEN DE CONFIGURACIÓN                                ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║  Servicio:     %-30s ║ "%cloud_name%"
echo  ║  Ruta:         %-30s ║ "%backup_path%"
echo  ║  Frecuencia:   %-30s ║ "%frequency%"
echo  ║  Retención:    %-30s ║ "%retention% días"
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

echo  ════════════════════════════════════════════════════════════════
echo  ✅ CONFIGURACIÓN DE BACKUP EN LA NUBE COMPLETADA
echo  ════════════════════════════════════════════════════════════════
echo.
echo  📝 Información importante:
echo  • Los backups se almacenan en: %backup_path%
echo  • Backup local sigue funcionando en: C:\SolemarAlimentaria\backups\
echo  • Para backup manual: %cloud_backup_script%
echo  • Logs: C:\SolemarAlimentaria\logs\cloud-backup.log
echo.
echo  💡 Consejo: Verifique periódicamente que los archivos
echo  se estén sincronizando correctamente con la nube.
echo.
pause
