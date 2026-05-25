@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title ⚖️ Configurador de Balanza - Solemar Alimentaria

:: ============================================
:: CONFIGURADOR DE BALANZA POR PUERTO COM
:: Solemar Alimentaria S.A.
:: ============================================

color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║     ⚖️ CONFIGURADOR DE BALANZA - PUERTO COM                 ║
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
:: PASO 1: DETECTAR PUERTOS COM DISPONIBLES
:: ============================================

echo  📡 Detectando puertos COM disponibles...
echo.

:: Crear archivo temporal para listar puertos
set "tempfile=%temp%\comports.txt"
reg query "HKLM\HARDWARE\DEVICEMAP\SERIALCOMM" >"%tempfile%" 2>&1

set /a comcount=0
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PUERTOS COM DETECTADOS:                                    ║
echo  ╠══════════════════════════════════════════════════════════════╣

for /f "tokens=2,3 skip=1" %%a in ('type "%tempfile%"') do (
    set /a comcount+=1
    echo  ║  [!comcount!] %%b - %%a                            ║
    set "com!comcount!=%%b"
    set "dev!comcount!=%%a"
)

if %comcount% equ 0 (
    echo  ║  ⚠️  No se detectaron puertos COM                        ║
    echo  ║  Verifique que la balanza esté conectada                 ║
    echo  ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo  Presione cualquier tecla para salir...
    pause >nul
    exit /b 1
)

echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: ============================================
:: PASO 2: SELECCIONAR PUESTO DE TRABAJO
:: ============================================

echo  📍 Seleccione el PUESTO DE TRABAJO:
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  [1] Balanza Camiones - Entrada/Salida de tropas           ║
echo  ║  [2] Pesaje Individual - Pesaje de animales                 ║
echo  ║  [3] Romaneo - Pesaje de medias/reses                       ║
echo  ║  [4] Calibración - Solo pruebas técnicas                    ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set /p puesto="  Ingrese número de puesto [1-4]: "

if "%puesto%"=="1" set "puesto_nombre=Balanza Camiones"
if "%puesto%"=="2" set "puesto_nombre=Pesaje Individual"
if "%puesto%"=="3" set "puesto_nombre=Romaneo"
if "%puesto%"=="4" set "puesto_nombre=Calibracion"

if not defined puesto_nombre (
    echo  ❌ Opción inválida.
    pause
    exit /b 1
)

echo.
echo  ✅ Puesto seleccionado: %puesto_nombre%
echo.

:: ============================================
:: PASO 3: SELECCIONAR PUERTO COM
:: ============================================

set /p com_select="  Seleccione número de puerto COM [1-%comcount%]: "

if not defined com!com_select! (
    echo  ❌ Selección inválida.
    pause
    exit /b 1
)

set "puerto_com=!com%com_select%!"
echo.
echo  ✅ Puerto seleccionado: %puerto_com%
echo.

:: ============================================
:: PASO 4: CONFIGURACIÓN DE COMUNICACIÓN
:: ============================================

echo  🔧 CONFIGURACIÓN DE COMUNICACIÓN SERIAL
echo  ════════════════════════════════════════════════════════════════
echo.

:: Velocidad (Baudios)
echo  Velocidad de transmisión (Baudios):
echo  [1] 4800   - Balanzas antiguas
echo  [2] 9600   - Estándar (RECOMENDADO)
echo  [3] 19200  - Alta velocidad
echo  [4] 38400  - Muy alta velocidad
echo.
set /p baud_select="  Seleccione [1-4, default 2]: "

if "%baud_select%"=="" set "baud_select=2"
if "%baud_select%"=="1" set "baudios=4800"
if "%baud_select%"=="2" set "baudios=9600"
if "%baud_select%"=="3" set "baudios=19200"
if "%baud_select%"=="4" set "baudios=38400"

echo  ✅ Baudios: %baudios%
echo.

:: Bits de datos
echo  Bits de datos:
echo  [1] 7 bits
echo  [2] 8 bits (RECOMENDADO)
echo.
set /p data_select="  Seleccione [1-2, default 2]: "

if "%data_select%"=="" set "data_select=2"
if "%data_select%"=="1" set "databits=7"
if "%data_select%"=="2" set "databits=8"

echo  ✅ Data bits: %databits%
echo.

:: Paridad
echo  Paridad:
echo  [1] None - Sin paridad (RECOMENDADO)
echo  [2] Even - Paridad par
echo  [3] Odd  - Paridad impar
echo.
set /p par_select="  Seleccione [1-3, default 1]: "

if "%par_select%"=="" set "par_select=1"
if "%par_select%"=="1" set "paridad=N"
if "%par_select%"=="2" set "paridad=E"
if "%par_select%"=="3" set "paridad=O"

echo  ✅ Paridad: %paridad%
echo.

:: Bits de parada
echo  Bits de parada:
echo  [1] 1 bit (RECOMENDADO)
echo  [2] 2 bits
echo.
set /p stop_select="  Seleccione [1-2, default 1]: "

if "%stop_select%"=="" set "stop_select=1"
if "%stop_select%"=="1" set "stopbits=1"
if "%stop_select%"=="2" set "stopbits=2"

echo  ✅ Stop bits: %stopbits%
echo.

:: ============================================
:: PASO 5: CONFIGURACIÓN DE PROTOCOLO
:: ============================================

echo  📡 PROTOCOLO DE LECTURA
echo  ════════════════════════════════════════════════════════════════
echo.
echo  [1] CONTINUO    - La balanza envía peso constantemente
echo  [2] BAJO_DEMANDA - El sistema solicita el peso
echo  [3] STABLE      - Solo envía cuando el peso es estable
echo.
set /p proto_select="  Seleccione protocolo [1-3, default 1]: "

if "%proto_select%"=="" set "proto_select=1"
if "%proto_select%"=="1" set "protocolo=CONTINUO"
if "%proto_select%"=="2" set "protocolo=BAJO_DEMANDA"
if "%proto_select%"=="3" set "protocolo=STABLE"

echo  ✅ Protocolo: %protocolo%
echo.

:: Decimales
echo  Cantidad de decimales del peso:
echo  [1] 0 decimales - Solo kilos enteros
echo  [2] 1 decimal   - Ej: 450.5 kg (RECOMENDADO)
echo  [3] 2 decimales - Ej: 450.55 kg
echo.
set /p dec_select="  Seleccione [1-3, default 2]: "

if "%dec_select%"=="" set "dec_select=2"
if "%dec_select%"=="1" set "decimales=0"
if "%dec_select%"=="2" set "decimales=1"
if "%dec_select%"=="3" set "decimales=2"

echo  ✅ Decimales: %decimales%
echo.

:: ============================================
:: PASO 6: IDENTIFICACIÓN DE BALANZA
:: ============================================

echo  🏷️ IDENTIFICACIÓN DE LA BALANZA
echo  ════════════════════════════════════════════════════════════════
echo.

set /p marca="  Marca de la balanza (ej: Toledo, Mettler): "
set /p modelo="  Modelo (ej: 9091, Tiger): "
set /p capacidad="  Capacidad máxima (kg, ej: 60000): "

if "%marca%"=="" set "marca=Desconocida"
if "%modelo%"=="" set "modelo=Desconocido"
if "%capacidad%"=="" set "capacidad=0"

echo.

:: ============================================
:: PASO 7: RESUMEN Y CONFIRMACIÓN
:: ============================================

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  📋 RESUMEN DE CONFIGURACIÓN                                ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║  Puesto:      %-30s ║ "%puesto_nombre%"
echo  ║  Puerto COM:  %-30s ║ "%puerto_com%"
echo  ║  Marca:       %-30s ║ "%marca%"
echo  ║  Modelo:      %-30s ║ "%modelo%"
echo  ║  Capacidad:   %-30s ║ "%capacidad% kg"
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║  Baudios:     %-30s ║ "%baudios%"
echo  ║  Data Bits:   %-30s ║ "%databits%"
echo  ║  Paridad:     %-30s ║ "%paridad%"
echo  ║  Stop Bits:   %-30s ║ "%stopbits%"
echo  ║  Protocolo:   %-30s ║ "%protocolo%"
echo  ║  Decimales:   %-30s ║ "%decimales%"
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set /p confirmar="  ¿Guardar configuración? [S/N]: "
if /i not "%confirmar%"=="S" (
    echo  ❌ Configuración cancelada.
    pause
    exit /b 0
)

:: ============================================
:: PASO 8: GUARDAR CONFIGURACIÓN
:: ============================================

echo.
echo  💾 Guardando configuración...

:: Crear directorio de configuración si no existe
if not exist "C:\SolemarAlimentaria\config" mkdir "C:\SolemarAlimentaria\config"

:: Crear archivo de configuración JSON
set "configfile=C:\SolemarAlimentaria\config\balanza_%puesto_nombre: =_%.json"

(
echo {
echo   "puesto": "%puesto_nombre%",
echo   "puerto_com": "%puerto_com%",
echo   "marca": "%marca%",
echo   "modelo": "%modelo%",
echo   "capacidad_kg": %capacidad%,
echo   "configuracion_serial": {
echo     "baudios": %baudios%,
echo     "data_bits": %databits%,
echo     "paridad": "%paridad%",
echo     "stop_bits": %stopbits%
echo   },
echo   "protocolo": "%protocolo%",
echo   "decimales": %decimales%,
echo   "fecha_configuracion": "%date% %time%"
echo }
) > "%configfile%"

echo  ✅ Configuración guardada: %configfile%
echo.

:: ============================================
:: PASO 9: PROBAR CONEXIÓN
:: ============================================

echo  🔌 ¿Desea probar la conexión con la balanza? [S/N]: 
set /p probar="  "

if /i "%probar%"=="S" (
    echo.
    echo  📡 Configurando puerto %puerto_com%...
    mode %puerto_com%: BAUD=%baudios% PARITY=%paridad% DATA=%databits% STOP=%stopbits% >nul 2>&1
    
    if %errorlevel% equ 0 (
        echo  ✅ Puerto %puerto_com% configurado correctamente.
        echo.
        echo  📖 La balanza debería estar enviando datos.
        echo  En el sistema web, vaya a:
        echo  Configuración → Balanzas → Nueva Balanza
        echo.
        echo  Ingrese los siguientes datos:
        echo  - Nombre: Balanza %puesto_nombre%
        echo  - Puerto: %puerto_com%
        echo  - Baudios: %baudios%
        echo  - Protocolo: %protocolo%
    ) else (
        echo  ❌ Error al configurar puerto. Verifique conexiones.
    )
)

echo.
echo  ════════════════════════════════════════════════════════════════
echo  ✅ CONFIGURACIÓN DE BALANZA COMPLETADA
echo  ════════════════════════════════════════════════════════════════
echo.
echo  📝 Próximos pasos:
echo  1. En el sistema web, vaya a Configuración → Balanzas
echo  2. Cree una nueva balanza con los datos configurados
echo  3. Seleccione esta balanza como activa para el puesto
echo.
pause
