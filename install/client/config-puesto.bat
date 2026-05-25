@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 💻 Configurador de Puesto de Trabajo - Solemar Alimentaria

:: ============================================
:: CONFIGURADOR COMPLETO DE PUESTO DE TRABAJO
:: Solemar Alimentaria S.A.
:: ============================================

color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║     💻 CONFIGURADOR DE PUESTO DE TRABAJO                    ║
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

:: ============================================
:: PASO 1: CONFIGURAR CONEXIÓN AL SERVIDOR
:: ============================================

echo  🌐 CONFIGURACIÓN DE CONEXIÓN AL SERVIDOR
echo  ════════════════════════════════════════════════════════════════
echo.

set /p server_ip="  Ingrese IP del servidor [default: 192.168.1.100]: "
if "%server_ip%"=="" set "server_ip=192.168.1.100"

echo.
echo  Verificando conexión a %server_ip%...

ping -n 1 %server_ip% >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Servidor accesible.
) else (
    echo  ⚠️  No se puede hacer ping al servidor. Verifique la red.
    set /p continuar="  ¿Desea continuar de todas formas? [S/N]: "
    if /i not "!continuar!"=="S" exit /b 1
)

echo.

:: ============================================
:: PASO 2: SELECCIONAR TIPO DE PUESTO
:: ============================================

echo  📍 SELECCIONE EL TIPO DE PUESTO DE TRABAJO
echo  ════════════════════════════════════════════════════════════════
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  [1] Balanza Camiones - Pesaje de entrada/salida            ║
echo  ║      → Requiere: Balanza RS232 + Impresora tickets          ║
echo  ║                                                              ║
echo  ║  [2] Pesaje Individual - Pesaje de animales                  ║
echo  ║      → Requiere: Balanza RS232                               ║
echo  ║                                                              ║
echo  ║  [3] Ingreso Cajón - Registro de medias en cajones          ║
echo  ║      → Requiere: Sin hardware especial                       ║
echo  ║                                                              ║
echo  ║  [4] Romaneo - Pesaje y etiquetado de medias                ║
echo  ║      → Requiere: Balanza RS232 + Impresora etiquetas        ║
echo  ║                                                              ║
echo  ║  [5] Facturación - Emisión de facturas y remitos            ║
echo  ║      → Requiere: Impresora láser/térmica                     ║
echo  ║                                                              ║
echo  ║  [6] Configuración - Administración del sistema             ║
echo  ║      → Requiere: Sin hardware especial                       ║
echo  ║                                                              ║
echo  ║  [7] Supervisión - Dashboard y monitoreo                     ║
echo  ║      → Requiere: Sin hardware especial                       ║
echo  ║                                                              ║
echo  ║  [8] Reportes - Generación de reportes oficiales            ║
echo  ║      → Requiere: Impresora láser                             ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set /p puesto_select="  Ingrese número de puesto [1-8]: "

:: Configurar según selección
if "%puesto_select%"=="1" (
    set "puesto_id=balanza_camiones"
    set "puesto_nombre=Balanza Camiones"
    set "requiere_balanza=SI"
    set "requiere_impresora=SI"
    set "modulos=pesaje_camiones,ingresos,egresos"
)
if "%puesto_select%"=="2" (
    set "puesto_id=pesaje_individual"
    set "puesto_nombre=Pesaje Individual"
    set "requiere_balanza=SI"
    set "requiere_impresora=NO"
    set "modulos=pesaje_individual,ingresos"
)
if "%puesto_select%"=="3" (
    set "puesto_id=ingreso_cajon"
    set "puesto_nombre=Ingreso Cajón"
    set "requiere_balanza=NO"
    set "requiere_impresora=NO"
    set "modulos=ingreso_cajon,stock"
)
if "%puesto_select%"=="4" (
    set "puesto_id=romaneo"
    set "puesto_nombre=Romaneo"
    set "requiere_balanza=SI"
    set "requiere_impresora=SI"
    set "modulos=romaneo,etiquetado,medias"
)
if "%puesto_select%"=="5" (
    set "puesto_id=facturacion"
    set "puesto_nombre=Facturación"
    set "requiere_balanza=NO"
    set "requiere_impresora=SI"
    set "modulos=facturacion,remitos,despachos"
)
if "%puesto_select%"=="6" (
    set "puesto_id=configuracion"
    set "puesto_nombre=Configuración"
    set "requiere_balanza=NO"
    set "requiere_impresora=NO"
    set "modulos=configuracion,usuarios,parametros"
)
if "%puesto_select%"=="7" (
    set "puesto_id=supervision"
    set "puesto_nombre=Supervisión"
    set "requiere_balanza=NO"
    set "requiere_impresora=NO"
    set "modulos=dashboard,reportes,alertas"
)
if "%puesto_select%"=="8" (
    set "puesto_id=reportes"
    set "puesto_nombre=Reportes"
    set "requiere_balanza=NO"
    set "requiere_impresora=SI"
    set "modulos=reportes,estadisticas,exportacion"
)

if not defined puesto_nombre (
    echo  ❌ Opción inválida.
    pause
    exit /b 1
)

echo.
echo  ✅ Puesto seleccionado: %puesto_nombre%
echo.

:: ============================================
:: PASO 3: CREAR ACCESO DIRECTO
:: ============================================

echo  🔗 CREANDO ACCESO DIRECTO...
echo  ════════════════════════════════════════════════════════════════
echo.

set "url_file=%USERPROFILE%\Desktop\Solemar Alimentaria - %puesto_nombre%.url"

(
echo [InternetShortcut]
echo URL=http://%server_ip%:3000
echo IconFile=C:\SolemarAlimentaria\icon.ico
echo IconIndex=0
) > "%url_file%"

echo  ✅ Acceso directo creado en el escritorio.
echo.

:: ============================================
:: PASO 4: CONFIGURAR BALANZA (si requiere)
:: ============================================

if "%requiere_balanza%"=="SI" (
    echo.
    echo  ════════════════════════════════════════════════════════════════
    echo  ⚖️ CONFIGURACIÓN DE BALANZA
    echo  ════════════════════════════════════════════════════════════════
    echo.
    
    echo  📡 Detectando puertos COM disponibles...
    echo.
    
    set /a comcount=0
    for /f "tokens=2,3 skip=1" %%a in ('reg query "HKLM\HARDWARE\DEVICEMAP\SERIALCOMM" 2^>nul') do (
        set /a comcount+=1
        echo  [!comcount!] %%b
        set "com!comcount!=%%b"
    )
    
    if %comcount% equ 0 (
        echo  ⚠️  No se detectaron puertos COM.
        echo  Verifique que la balanza esté conectada.
        set /p skip_balanza="  ¿Continuar sin configurar balanza? [S/N]: "
        if /i "!skip_balanza!"=="S" (
            set "balanza_configurada=NO"
        ) else (
            exit /b 1
        )
    ) else (
        echo.
        set /p com_select="  Seleccione número de puerto COM: "
        
        if defined com!com_select! (
            set "puerto_com=!com%com_select%!"
            echo  Puerto seleccionado: !puerto_com!
            
            :: Configuración rápida (valores estándar)
            echo.
            echo  Configurando comunicación serial estándar (9600,8,N,1)...
            mode !puerto_com!: BAUD=9600 PARITY=N DATA=8 STOP=1 >nul 2>&1
            
            set "balanza_configurada=SI"
            set "balanza_puerto=!puerto_com!"
        )
    )
)

echo.

:: ============================================
:: PASO 5: CONFIGURAR IMPRESORA (si requiere)
:: ============================================

if "%requiere_impresora%"=="SI" (
    echo.
    echo  ════════════════════════════════════════════════════════════════
    echo  🖨️ CONFIGURACIÓN DE IMPRESORA
    echo  ════════════════════════════════════════════════════════════════
    echo.
    
    echo  Impresoras instaladas:
    echo.
    
    set /a idx=0
    for /f "skip=3 tokens=1" %%p in ('powershell -Command "Get-Printer | Select-Object Name" 2^>nul') do (
        set /a idx+=1
        echo  [!idx!] %%p
        set "printer_name!idx!=%%p"
    )
    
    if %idx% equ 0 (
        echo  ⚠️  No se detectaron impresoras.
        echo  Instale las impresoras necesarias.
        set /p skip_printer="  ¿Continuar sin configurar impresora? [S/N]: "
        if /i "!skip_printer!"=="S" (
            set "impresora_configurada=NO"
        ) else (
            exit /b 1
        )
    ) else (
        echo.
        set /p printer_select="  Seleccione número de impresora: "
        
        if defined printer_name%printer_select% (
            set "impresora=!printer_name%printer_select%!"
            echo  Impresora seleccionada: !impresora!
            
            :: Preguntar si establecer como por defecto
            set /p set_default="  ¿Establecer como impresora por defecto? [S/N]: "
            if /i "!set_default!"=="S" (
                powershell -Command "(New-Object -ComObject WScript.Network).SetDefaultPrinter('!impresora!')" 2>nul
                echo  ✅ Impresora establecida como por defecto.
            )
            
            set "impresora_configurada=SI"
        )
    )
)

echo.

:: ============================================
:: PASO 6: GUARDAR CONFIGURACIÓN DEL PUESTO
:: ============================================

echo  💾 GUARDANDO CONFIGURACIÓN...
echo  ════════════════════════════════════════════════════════════════
echo.

:: Crear directorio de configuración
if not exist "C:\SolemarAlimentaria\config" mkdir "C:\SolemarAlimentaria\config"

set "configfile=C:\SolemarAlimentaria\config\puesto.json"

(
echo {
echo   "puesto_id": "%puesto_id%",
echo   "puesto_nombre": "%puesto_nombre%",
echo   "servidor_ip": "%server_ip%",
echo   "servidor_puerto": 3000,
echo   "url_sistema": "http://%server_ip%:3000",
echo   "modulos_permitidos": "%modulos%",
if "%requiere_balanza%"=="SI" (
echo   "balanza": {
echo     "requerida": true,
echo     "configurada": "%balanza_configurada%",
if "%balanza_configurada%"=="SI" (
echo     "puerto_com": "%balanza_puerto%",
)
echo     "baudios": 9600,
echo     "protocolo": "CONTINUO"
echo   },
)
if "%requiere_impresora%"=="SI" (
echo   "impresora": {
echo     "requerida": true,
echo     "configurada": "%impresora_configurada%",
if "%impresora_configurada%"=="SI" (
echo     "nombre": "%impresora%",
)
echo     "tipo": "AUTOMATICO"
echo   },
)
echo   "fecha_configuracion": "%date% %time%"
echo }
) > "%configfile%"

echo  ✅ Configuración guardada: %configfile%
echo.

:: ============================================
:: PASO 7: ABRIR NAVEGADOR
:: ============================================

echo  🌐 ¿Desea abrir el sistema ahora? [S/N]: 
set /p abrir="  "

if /i "%abrir%"=="S" (
    start http://%server_ip%:3000
)

echo.

:: ============================================
:: RESUMEN FINAL
:: ============================================

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  📋 RESUMEN DE CONFIGURACIÓN                                ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║  Puesto:        %-30s ║ "%puesto_nombre%"
echo  ║  Servidor:      %-30s ║ "%server_ip%:3000"
echo  ║  Módulos:       %-30s ║ "%modulos%"
if "%requiere_balanza%"=="SI" (
echo  ║  Balanza:       %-30s ║ "%balanza_configurada%"
)
if "%requiere_impresora%"=="SI" (
echo  ║  Impresora:     %-30s ║ "%impresora_configurada%"
)
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

echo  ════════════════════════════════════════════════════════════════
echo  ✅ CONFIGURACIÓN DE PUESTO COMPLETADA
echo  ════════════════════════════════════════════════════════════════
echo.
echo  📝 El acceso directo se creó en el escritorio.
echo  📝 La configuración se guardó en: %configfile%
echo.
echo  💡 Para cambios futuros, ejecute este script nuevamente.
echo.
pause
