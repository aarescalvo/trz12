@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 🖨️ Configurador de Impresora - Solemar Alimentaria

:: ============================================
:: CONFIGURADOR DE IMPRESORA POR PUESTO
:: Solemar Alimentaria S.A.
:: ============================================

color 0B
cls

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║     🖨️ CONFIGURADOR DE IMPRESORA POR PUESTO                 ║
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
:: PASO 1: DETECTAR IMPRESORAS INSTALADAS
:: ============================================

echo  🔍 Detectando impresoras instaladas...
echo.

set /a printer_count=0

:: Usar PowerShell para obtener impresoras de forma más confiable
powershell -Command "Get-Printer | Select-Object Name, PortName, DriverName | Format-Table -AutoSize" 2>nul

echo.
echo  ════════════════════════════════════════════════════════════════
echo.

:: Guardar lista de impresoras en array
for /f "skip=3 tokens=1" %%p in ('powershell -Command "Get-Printer | Select-Object Name" 2^>nul') do (
    set /a printer_count+=1
    set "printer!printer_count!=%%p"
)

if %printer_count% equ 0 (
    echo  ⚠️  No se detectaron impresoras instaladas.
    echo.
    echo  Por favor, instale las impresoras necesarias antes de continuar.
    echo  Use Panel de Control → Dispositivos e Impresoras → Agregar impresora
    echo.
    pause
    exit /b 1
)

echo  Se detectaron %printer_count% impresoras.
echo.

:: ============================================
:: PASO 2: SELECCIONAR PUESTO DE TRABAJO
:: ============================================

echo  📍 Seleccione el PUESTO DE TRABAJO:
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  [1] Balanza Camiones - Imprime tickets de pesaje           ║
echo  ║  [2] Romaneo - Imprime rótulos/etiquetas de medias          ║
echo  ║  [3] Facturación - Imprime facturas y remitos               ║
echo  ║  [4] Reportes - Imprime reportes oficiales                  ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set /p puesto_select="  Ingrese número de puesto [1-4]: "

if "%puesto_select%"=="1" (
    set "puesto_id=balanza_camiones"
    set "puesto_nombre=Balanza Camiones"
    set "tipo_default=TICKET"
    set "descripcion=Tickets de pesaje de camiones"
)
if "%puesto_select%"=="2" (
    set "puesto_id=romaneo"
    set "puesto_nombre=Romaneo"
    set "tipo_default=ETIQUETA"
    set "descripcion=Rótulos y etiquetas de medias"
)
if "%puesto_select%"=="3" (
    set "puesto_id=facturacion"
    set "puesto_nombre=Facturación"
    set "tipo_default=FACTURA"
    set "descripcion=Facturas y remitos"
)
if "%puesto_select%"=="4" (
    set "puesto_id=reportes"
    set "puesto_nombre=Reportes"
    set "tipo_default=REPORTE"
    set "descripcion=Reportes oficiales"
)

if not defined puesto_nombre (
    echo  ❌ Opción inválida.
    pause
    exit /b 1
)

echo.
echo  ✅ Puesto seleccionado: %puesto_nombre% - %descripcion%
echo.

:: ============================================
:: PASO 3: SELECCIONAR IMPRESORA
:: ============================================

echo  🖨️ Seleccione la IMPRESORA para este puesto:
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  #   Nombre de la Impresora                                  ║
echo  ╠══════════════════════════════════════════════════════════════╣

set /a idx=0
for /f "skip=3 tokens=1" %%p in ('powershell -Command "Get-Printer | Select-Object Name" 2^>nul') do (
    set /a idx+=1
    echo  ║  [!idx!]  %%p
    set "printer_name!idx!=%%p"
)

echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set /p printer_select="  Ingrese número de impresora [1-%idx%]: "

if not defined printer_name%printer_select% (
    echo  ❌ Selección inválida.
    pause
    exit /b 1
)

set "impresora=!printer_name%printer_select%!"
echo.
echo  ✅ Impresora seleccionada: %impresora%
echo.

:: ============================================
:: PASO 4: TIPO DE IMPRESORA
:: ============================================

echo  📋 TIPO DE IMPRESORA:
echo.
echo  [1] TÉRMICA ETIQUETAS - Para rótulos (Zebra, Datamax, etc.)
echo  [2] TÉRMICA TICKETS   - Para tickets de pesaje (Epson TM, etc.)
echo  [3] LÁSER              - Para facturas y reportes
echo  [4] INYECCIÓN TINTA    - Para reportes color
echo  [5] MATRICIAL          - Para formularios continuos
echo.

set /p tipo_select="  Seleccione tipo [1-5]: "

if "%tipo_select%"=="1" set "tipo_impresion=TERMICA_ETIQUETAS"
if "%tipo_select%"=="2" set "tipo_impresion=TERMICA_TICKETS"
if "%tipo_select%"=="3" set "tipo_impresion=LASER"
if "%tipo_select%"=="4" set "tipo_impresion=INYECCION"
if "%tipo_select%"=="5" set "tipo_impresion=MATRICIAL"

if not defined tipo_impresion (
    echo  ❌ Tipo inválido.
    pause
    exit /b 1
)

echo  ✅ Tipo: %tipo_impresion%
echo.

:: ============================================
:: PASO 5: CONFIGURACIÓN DE ETIQUETA (si térmica)
:: ============================================

if "%tipo_impresion%"=="TERMICA_ETIQUETAS" (
    echo  📏 CONFIGURACIÓN DE ETIQUETA:
    echo.
    
    set /p ancho="  Ancho de etiqueta (mm) [default 100]: "
    if "%ancho%"=="" set "ancho=100"
    
    set /p alto="  Alto de etiqueta (mm) [default 50]: "
    if "%alto%"=="" set "alto=50"
    
    set /p dpi="  Resolución DPI [203/300, default 203]: "
    if "%dpi%"=="" set "dpi=203"
    
    echo.
    echo  ✅ Etiqueta: %ancho% x %alto% mm @ %dpi% DPI
    echo.
)

:: ============================================
:: PASO 6: ESTABLECER COMO IMPRESORA POR DEFECTO
:: ============================================

echo  ⭐ ¿Establecer como impresora POR DEFECTO del sistema? [S/N]: 
set /p set_default="  "

if /i "%set_default%"=="S" (
    echo.
    echo  Configurando como impresora por defecto...
    
    :: Usar PowerShell para cambiar impresora por defecto
    powershell -Command "(New-Object -ComObject WScript.Network).SetDefaultPrinter('%impresora%')" 2>nul
    
    if !errorlevel! equ 0 (
        echo  ✅ Impresora establecida como por defecto del sistema.
    ) else (
        echo  ⚠️  No se pudo establecer como impresora por defecto.
    )
    echo.
)

:: ============================================
:: PASO 7: PRUEBA DE IMPRESIÓN
:: ============================================

echo  🖨️ ¿Desea imprimir una PÁGINA DE PRUEBA? [S/N]: 
set /p test_print="  "

if /i "%test_print%"=="S" (
    echo.
    echo  Enviando página de prueba...
    
    :: Crear archivo de prueba
    set "testfile=%temp%\test_print_solemar.txt"
    (
        echo ================================================================
        echo         PRUEBA DE IMPRESIÓN - SOLEMAR ALIMENTARIA
        echo ================================================================
        echo.
        echo Puesto: %puesto_nombre%
        echo Impresora: %impresora%
        echo Tipo: %tipo_impresion%
        echo Fecha: %date% %time%
        echo.
        echo ================================================================
        echo Si puede leer este mensaje, la impresora está configurada
        echo correctamente para el sistema.
        echo ================================================================
    ) > "%testfile%"
    
    :: Imprimir usando notepad
    notepad /p "%testfile%" >nul 2>&1
    
    echo  ✅ Página de prueba enviada.
    timeout /t 3 >nul
    del "%testfile%" >nul 2>&1
)

echo.

:: ============================================
:: PASO 8: GUARDAR CONFIGURACIÓN
:: ============================================

echo  💾 Guardando configuración...

:: Crear directorio de configuración si no existe
if not exist "C:\SolemarAlimentaria\config" mkdir "C:\SolemarAlimentaria\config"

:: Crear archivo de configuración JSON
set "configfile=C:\SolemarAlimentaria\config\impresora_%puesto_id%.json"

(
echo {
echo   "puesto_id": "%puesto_id%",
echo   "puesto_nombre": "%puesto_nombre%",
echo   "impresora": "%impresora%",
echo   "tipo": "%tipo_impresion%",
if "%tipo_impresion%"=="TERMICA_ETIQUETAS" (
echo   "configuracion_etiqueta": {
echo     "ancho_mm": %ancho%,
echo     "alto_mm": %alto%,
echo     "dpi": %dpi%
echo   },
)
echo   "es_default": %set_default%,
echo   "fecha_configuracion": "%date% %time%"
echo }
) > "%configfile%"

echo  ✅ Configuración guardada: %configfile%
echo.

:: ============================================
:: RESUMEN FINAL
:: ============================================

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  📋 RESUMEN DE CONFIGURACIÓN                                ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║  Puesto:       %-30s ║ "%puesto_nombre%"
echo  ║  Impresora:    %-30s ║ "%impresora%"
echo  ║  Tipo:         %-30s ║ "%tipo_impresion%"
if "%tipo_impresion%"=="TERMICA_ETIQUETAS" (
echo  ║  Etiqueta:     %-30s ║ "%ancho%x%alto%mm @ %dpi%DPI"
)
echo  ║  Por defecto:  %-30s ║ "%set_default%"
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

echo  ════════════════════════════════════════════════════════════════
echo  ✅ CONFIGURACIÓN DE IMPRESORA COMPLETADA
echo  ════════════════════════════════════════════════════════════════
echo.
echo  📝 Próximos pasos:
echo  1. En el sistema web, vaya a Configuración → Impresoras
echo  2. Registre esta impresora con los datos configurados
echo  3. Asocie la impresora al puesto de trabajo correspondiente
echo.
pause
