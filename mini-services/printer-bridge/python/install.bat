@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

title Printer Bridge v3.0 - Instalador Python - Solemar Alimentaria
echo ============================================================
echo   PRINTER BRIDGE v3.0 (PYTHON) - Solemar Alimentaria
echo   Instalador para Windows 7
echo ============================================================
echo.

:: ============================================================
:: PASO 1: Verificar Windows 7 Service Pack 1
:: ============================================================
echo [1/6] Verificando Windows 7 Service Pack 1...

ver | findstr /i "6.1" >nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Este instalador es para Windows 7.
    echo         Sistema detectado:
    ver
    echo.
    echo         El Printer Bridge requiere Windows 7 SP1 o superior.
    pause
    exit /b 1
)

reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v CSDVersion 2>nul | findstr /i "Service Pack 1" >nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================================
    echo   ERROR: Windows 7 Service Pack 1 NO ESTA INSTALADO
    echo ============================================================
    echo.
    echo   Python 3.8.10 REQUIERE Service Pack 1 para instalarse.
    echo.
    echo   Para instalar SP1:
    echo   1. Abri "Windows Update" (Inicio ^> Todos los programas ^> Windows Update)
    echo   2. Hace clic en "Buscar actualizaciones"
    echo   3. Instala TODAS las actualizaciones disponibles
    echo   4. Reinicia la PC
    echo   5. Vuelve a ejecutar este instalador
    echo.
    echo   Si Windows Update no funciona, descarga SP1 manualmente:
    echo   https://www.microsoft.com/es-es/download/details.aspx?id=5842
    echo.
    echo   Despues de SP1, ejecuta setup-prep.bat para verificar
    echo   que todos los prerequisitos estan OK.
    echo ============================================================
    echo.
    pause
    exit /b 1
)
echo       OK: Service Pack 1 instalado.

:: ============================================================
:: PASO 2: Verificar KB2999226 (Universal C Runtime)
:: ============================================================
echo.
echo [2/6] Verificando KB2999226 (Universal C Runtime)...

set KB_FOUND=0
for /f "tokens=*" %%a in ('wmic qfe get HotFixID 2^>nul ^| findstr /i "KB2999226"') do (
    set KB_FOUND=1
)

if "%KB_FOUND%"=="0" (
    echo.
    echo ============================================================
    echo   ADVERTENCIA: KB2999226 no encontrado
    echo ============================================================
    echo.
    echo   Este parche es necesario para que Python 3.8+ funcione.
    echo   (Universal C Runtime Update para Windows 7 SP1)
    echo.
    echo   Opcion A - Via Windows Update:
    echo     Buscar actualizaciones e instalar KB2999226
    echo     (suele aparecer despues de instalar SP1)
    echo.
    echo   Opcion B - Descarga directa:
    echo     https://www.microsoft.com/es-es/download/details.aspx?id=48234
    echo     Buscar: Windows6.1-KB2999226-x86.msu (32-bit)
    echo             Windows6.1-KB2999226-x64.msu (64-bit)
    echo.
    echo   Opcion C - Paquete acumulativo (recomendado):
    echo     Instalar el Convenience Rollup KB3125574 que incluye KB2999226
    echo     https://support.microsoft.com/es-es/kb/3125574
    echo     o buscar en: https://catalog.update.microsoft.com
    echo     Buscar: KB3125574
    echo.
    echo ============================================================
    echo.
    echo   Desea continuar de todos modos? El setup de Python puede fallar.
    echo.
    set /p CONTINUE="   Continuar? (s/N): "
    if /i not "!CONTINUE!"=="s" (
        echo.
        echo   Instalacion cancelada. Instale los prerequisitos y vuelva a ejecutar.
        echo   Tambien puede ejecutar setup-prep.bat para ver estado completo.
        echo.
        pause
        exit /b 1
    )
    echo       Continuando sin KB2999226...
) else (
    echo       OK: KB2999226 instalado.
)

:: ============================================================
:: PASO 3: Verificar Python
:: ============================================================
echo.
echo [3/6] Verificando Python 3.8...

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================================
    echo   ERROR: Python no esta instalado
    echo ============================================================
    echo.
    echo   Windows 7 requiere Python 3.8.10 (ultima version compatible).
    echo.
    echo   PASOS PARA INSTALAR:
    echo   1. Desde otra PC con internet, descarga:
    echo      https://www.python.org/ftp/python/3.8.10/
    echo.
    echo      Si Windows 7 es 32-bit: python-3.8.10.exe
    echo      Si Windows 7 es 64-bit: python-3.8.10-amd64.exe
    echo.
    echo   2. Copia el archivo a esta PC (pendrive, red, etc.)
    echo   3. Ejecuta python-3.8.10.exe
    echo   4. IMPORTANTE: Marca "Add Python 3.8 to PATH" en el instalador
    echo   5. Click en "Install Now"
    echo   6. Cuando termine, volve a ejecutar este install.bat
    echo.
    echo   Si el setup de Python falla con error de C Runtime:
    echo   - Instale primero Windows 7 SP1 (ver arriba)
    echo   - Instale KB2999226 (ver arriba)
    echo   - Reinicie la PC e intente de nuevo
    echo.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

:: Verificar version de Python (3.8+)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo       Python encontrado: %PYVER%

python -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Python %PYVER% no es compatible.
    echo   Se requiere Python 3.8 o superior para Windows 7.
    echo   Descarga: https://www.python.org/ftp/python/3.8.10/python-3.8.10.exe
    echo.
    pause
    exit /b 1
)

:: Aviso si es 3.9+ (puede tener problemas en Win7)
python -c "import sys; sys.exit(1 if sys.version_info >= (3, 9) else 0)" 2>nul
if %ERRORLEVEL% equ 0 (
    echo.
    echo   [AVISO] Python %PYVER% puede no ser completamente compatible con Windows 7.
    echo            Se recomienda Python 3.8.10.
    echo.
)
echo.

:: ============================================================
:: PASO 4: Verificar pywin32
:: ============================================================
echo [4/6] Verificando pywin32...

python -c "import win32print; print('OK: pywin32 instalado')" 2>nul
if %ERRORLEVEL% neq 0 (
    echo       pywin32 no esta instalado. Instalando...

    pip install pywin32 2>nul

    if %ERRORLEVEL% neq 0 (
        python -m pip install pywin32 2>nul

        if %ERRORLEVEL% neq 0 (
            echo.
            echo [ERROR] No se pudo instalar pywin32 automaticamente.
            echo.
            echo   Opcion 1 - Con internet:
            echo     pip install pywin32
            echo.
            echo   Opcion 2 - Sin internet (Windows 7):
            echo     1. Desde otra PC, descarga el .whl desde:
            echo        https://github.com/mhammond/pywin32/releases
            echo     2. Busca el archivo para Python 3.8, Windows 7, 32-bit:
            echo        pywin32-301.win32-py3.8.exe
            echo     3. Copialo y ejecuta en esta PC
            echo.
            pause
            exit /b 1
        )
    )

    python -c "import win32print; print('OK: pywin32 instalado correctamente')" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] pywin32 no se pudo verificar. Intenta reiniciar.
        pause
        exit /b 1
    )
) else (
    echo       OK: pywin32 instalado.
)
echo.

:: ============================================================
:: PASO 5: Copiar archivos
:: ============================================================
echo [5/6] Copiando archivos...

set INSTALL_DIR=C:\SolemarAlimentaria\printer-bridge

if not exist "C:\SolemarAlimentaria" mkdir "C:\SolemarAlimentaria"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\temp" mkdir "%INSTALL_DIR%\temp"

copy /Y "%~dp0index.py" "%INSTALL_DIR%\index.py" >nul 2>&1
copy /Y "%~dp0requirements.txt" "%INSTALL_DIR%\requirements.txt" >nul 2>&1
copy /Y "%~dp0start.bat" "%INSTALL_DIR%\start.bat" >nul 2>&1
copy /Y "%~dp0install-service.bat" "%INSTALL_DIR%\install-service.bat" >nul 2>&1
copy /Y "%~dp0uninstall-service.bat" "%INSTALL_DIR%\uninstall-service.bat" >nul 2>&1
copy /Y "%~dp0setup-prep.bat" "%INSTALL_DIR%\setup-prep.bat" >nul 2>&1
copy /Y "%~dp0README.md" "%INSTALL_DIR%\README.md" >nul 2>&1
copy /Y "%~dp0INSTRUCTIVO-INSTALACION.md" "%INSTALL_DIR%\INSTRUCTIVO-INSTALACION.md" >nul 2>&1
echo       Archivos copiados a %INSTALL_DIR%
echo.

:: ============================================================
:: PASO 6: Mostrar impresoras y configurar
:: ============================================================
echo [6/6] Detectando impresoras...
echo.

python -c "
import sys
try:
    import win32print
    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    printers = []
    for (f, desc, name, *_) in win32print.EnumPrinters(flags, None, 2):
        printers.append((name, desc))
    if printers:
        for i, (name, desc) in enumerate(printers):
            print('  [{}] {} ({})'.format(i, name, desc))
    else:
        print('  No se encontraron impresoras.')
        print('  Verifica que la Datamax este conectada por USB.')
except ImportError:
    print('  ERROR: pywin32 no disponible')
except Exception as e:
    print('  ERROR: {}'.format(e))
"
echo.

:: Pedir nombre de impresora
echo ============================================================
echo   CONFIGURACION
echo ============================================================
echo.
echo Escribi el nombre EXACTO de la impresora Datamax tal como aparece arriba.
echo.
set /p PRINTER_NAME="Nombre de la impresora: "

if "%PRINTER_NAME%"=="" (
    echo [ERROR] No ingresaste un nombre.
    pause
    exit /b 1
)

:: Guardar configuracion
echo {"printerName":"%PRINTER_NAME%","tcpPort":9100,"httpPort":9101,"logLevel":"info","autoStart":true,"copyCount":1} > "%INSTALL_DIR%\printer-config.json"
echo.
echo [OK] Configuracion guardada.
echo.

:: ============================================================
:: Firewall
:: ============================================================
echo Configurando firewall...

netsh advfirewall firewall show rule name="Printer Bridge TCP 9100" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    netsh advfirewall firewall add rule name="Printer Bridge TCP 9100" dir=in action=allow protocol=TCP localport=9100 >nul 2>&1
    echo       Puerto TCP 9100 abierto.
) else (
    echo       Puerto TCP 9100 ya estaba abierto.
)

netsh advfirewall firewall show rule name="Printer Bridge TCP 9101" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    netsh advfirewall firewall add rule name="Printer Bridge TCP 9101" dir=in action=allow protocol=TCP localport=9101 >nul 2>&1
    echo       Puerto HTTP 9101 abierto.
) else (
    echo       Puerto HTTP 9101 ya estaba abierto.
)
echo.

:: Obtener IP local
set LOCAL_IP=desconocida
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo.
echo   Impresora:   %PRINTER_NAME%
echo   Puerto TCP:  9100 (recibe datos de TrazAlan)
echo   Panel Web:   http://%LOCAL_IP%:9101
echo   Archivos:    %INSTALL_DIR%
echo.
echo   PROXIMOS PASOS:
echo   1. Ejecuta start.bat para iniciar el bridge
echo   2. Abri http://localhost:9101 en el navegador
echo   3. Hace clic en "Imprimir prueba"
echo   4. En TrazAlan configurar impresora con:
echo      IP: %LOCAL_IP%
echo      Puerto: 9100
echo      Marca: DATAMAX
echo      Modelo: Mark II
echo.
echo ============================================================
echo.
echo   Para iniciar el bridge como servicio de Windows (auto-inicio):
echo   Ejecuta install-service.bat como Administrador.
echo.

pause
