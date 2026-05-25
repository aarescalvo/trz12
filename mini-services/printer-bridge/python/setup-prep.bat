@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ============================================================
:: setup-prep.bat - Prepara Windows 7 para Printer Bridge
:: Verifica e instala prerequisitos: SP1, KB2999226, Python
:: ============================================================

title Preparar Windows 7 - Printer Bridge

echo.
echo ============================================================
echo   PREPARACION DE WINDOWS 7
echo   Printer Bridge v3.0 - Solemar Alimentaria
echo ============================================================
echo.
echo Este script verifica los prerequisitos necesarios para
echo instalar el Printer Bridge en su PC con Windows 7.
echo.

:: ----------------------------------------------------------
:: 1. Diagnostico del sistema
:: ----------------------------------------------------------
echo ============================================================
echo  DIAGNOSTICO DEL SISTEMA
echo ============================================================
echo.

:: Version de Windows
echo [OS]       :
ver | findstr /i "6.1"
echo.

:: Arquitectura
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    echo [ARCH]     : 64-bit ^(instalar Python amd64^)
) else (
    echo [ARCH]     : 32-bit ^(instalar Python x86^)
)
echo.

:: Service Pack
echo [SP1]      :
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v CSDVersion 2>nul | findstr /i "Service Pack 1" >nul
if %ERRORLEVEL% equ 0 (
    echo             OK: Service Pack 1 INSTALADO
    set SP1_OK=1
) else (
    echo             FALTA: Service Pack 1 NO INSTALADO
    set SP1_OK=0
)
echo.

:: KB2999226
echo [KB2999226] :
set KB_FOUND=0
for /f "tokens=*" %%a in ('wmic qfe get HotFixID 2^>nul ^| findstr /i "KB2999226"') do set KB_FOUND=1
if "%KB_FOUND%"=="1" (
    echo             OK: KB2999226 INSTALADO
    set KB_OK=1
) else (
    echo             FALTA: KB2999226 NO INSTALADO
    set KB_OK=0
)
echo.

:: Python
echo [PYTHON]   :
set PYTHON_OK=0
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=2" %%v in ('python --version 2^>^&1') do (
        echo             OK: Encontrado %%v
        set PYTHON_OK=1
    )
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        for /f "tokens=2" %%v in ('py --version 2^>^&1') do (
            echo             OK: Encontrado via py launcher: %%v
            set PYTHON_OK=1
        )
    ) else (
        echo             FALTA: Python NO INSTALADO
    )
)
echo.

:: pywin32
echo [PYWIN32]  :
if "%PYTHON_OK%"=="1" (
    python -c "import win32print" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo             OK: pywin32 instalado
        set PYWIN32_OK=1
    ) else (
        echo             FALTA: pywin32 NO instalado
        set PYWIN32_OK=0
    )
) else (
    echo             --- Requiere Python primero
    set PYWIN32_OK=0
)
echo.

:: Impresoras
echo [IMPRESORAS]:
if "%PYTHON_OK%"=="1" (
    if "%PYWIN32_OK%"=="1" (
        python -c "import win32print; ps=[x[2] for x in win32print.EnumPrinters(5,None,2)]; [print('             OK: '+p) for p in ps] if ps else print('             FALTA: No se detectaron impresoras')" 2>nul
    ) else (
        echo             --- Requiere pywin32 primero
    )
) else (
    echo             --- Requiere Python primero
)
echo.

:: ----------------------------------------------------------
:: 2. Resumen
:: ----------------------------------------------------------
echo ============================================================
echo  RESUMEN DE REQUISITOS
echo ============================================================
echo.

set ALL_OK=1
if "%SP1_OK%"=="0" (
    echo  [ ] FALTA: Service Pack 1
    set ALL_OK=0
) else (
    echo  [X] OK: Service Pack 1
)
if "%KB_OK%"=="0" (
    echo  [ ] FALTA: KB2999226 ^(Universal C Runtime^)
    set ALL_OK=0
) else (
    echo  [X] OK: KB2999226
)
if "%PYTHON_OK%"=="0" (
    echo  [ ] FALTA: Python 3.8.10
    set ALL_OK=0
) else (
    echo  [X] OK: Python
)
if "%PYWIN32_OK%"=="0" (
    echo  [ ] FALTA: pywin32
    set ALL_OK=0
) else (
    echo  [X] OK: pywin32
)

echo.

if "%ALL_OK%"=="1" (
    echo ============================================================
    echo   Todos los requisitos estan cumplidos!
    echo ============================================================
    echo.
    echo   Puede ejecutar install.bat para instalar el Printer Bridge.
    echo.
    pause
    exit /b 0
)

echo ============================================================
echo  INSTRUCCIONES PARA INSTALAR REQUISITOS
echo ============================================================
echo.

if "%SP1_OK%"=="0" (
    echo ----------------------------------------------------------
    echo  PASO 1: INSTALAR SERVICE PACK 1
    echo ----------------------------------------------------------
    echo.
    echo  Opcion A - Windows Update:
    echo    1. Click Inicio ^> Todos los Programas
    echo    2. Abrir "Windows Update"
    echo    3. Click "Buscar actualizaciones"
    echo    4. Instalar TODAS las actualizaciones
    echo    5. Reiniciar la PC
    echo    6. Volver a ejecutar Windows Update hasta que no queden
    echo       actualizaciones pendientes
    echo.
    echo  Opcion B - Descarga directa de SP1:
    echo    https://www.microsoft.com/es-es/download/details.aspx?id=5842
    echo    ^(descargar Windows6.1-KB976932-...-X86.exe para 32-bit
    echo     o -X64.exe para 64-bit^)
    echo.
)

if "%KB_OK%"=="0" (
    echo ----------------------------------------------------------
    echo  PASO 2: INSTALAR KB2999226
    echo ----------------------------------------------------------
    echo.
    echo  Este parche instala el Universal C Runtime necesario
    echo  para que Python 3.5+ funcione en Windows 7.
    echo.
    echo  Opcion A - Windows Update:
    echo    Buscar "KB2999226" en Windows Update
    echo    ^(generalmente aparece despues de instalar SP1^)
    echo.
    echo  Opcion B - Descarga directa:
    echo    32-bit: https://www.microsoft.com/es-es/download/details.aspx?id=48234
    echo    Buscar: Windows6.1-KB2999226-x86.msu
    echo.
    echo    64-bit: https://www.microsoft.com/es-es/download/details.aspx?id=48234
    echo    Buscar: Windows6.1-KB2999226-x64.msu
    echo.
    echo  Opcion C - Paquete acumulativo ^(RECOMENDADO^):
    echo    Instalar el Convenience Rollup KB3125574 que incluye
    echo    KB2999226 y muchas mas actualizaciones:
    echo    https://support.microsoft.com/es-es/kb/3125574
    echo    o buscar KB3125574 en: https://catalog.update.microsoft.com
    echo.
)

if "%PYTHON_OK%"=="0" (
    echo ----------------------------------------------------------
    echo  PASO 3: INSTALAR PYTHON 3.8.10
    echo ----------------------------------------------------------
    echo.
    echo  IMPORTANTE: Solo Python 3.8.x funciona en Windows 7
    echo  Python 3.9 y superior NO son compatibles con Win7.
    echo.
    echo  Descarga:
    echo  https://www.python.org/ftp/python/3.8.10/
    echo.
    echo  Si Windows 7 es 32-bit: python-3.8.10.exe
    echo  Si Windows 7 es 64-bit: python-3.8.10-amd64.exe
    echo.
    echo  AL INSTALAR, MARCAR:
    echo    [X] Add Python 3.8 to PATH
    echo.
    echo  Si el setup falla con "setup failed":
    echo  - Asegurese de tener SP1 instalado ^(Paso 1^)
    echo  - Asegurese de tener KB2999226 instalado ^(Paso 2^)
    echo  - Reinicie la PC y vuelva a intentar
    echo.
)

if "%PYWIN32_OK%"=="0" (
    echo ----------------------------------------------------------
    echo  PASO 4: INSTALAR PYWIN32
    echo ----------------------------------------------------------
    echo.
    echo  Se instala automaticamente con install.bat:
    echo    pip install pywin32
    echo.
    echo  O manualmente:
    echo    python -m pip install pywin32
    echo.
)

echo.
echo ============================================================
echo  CONSEJOS PARA WINDOWS UPDATE EN WIN7
echo ============================================================
echo.
echo Si Windows Update NO funciona ^(se cuelga, da error, etc.^):
echo.
echo 1. Primero instale SP1 manualmente ^(ver Paso 1^)
echo 2. Luego instale el Convenience Rollup KB3125574
echo    ^(ver Paso 2, Opcion C^)
echo    Esto instala KB2999226 y muchas mas actualizaciones
echo 3. Reinicie la PC
echo 4. Vuelva a ejecutar setup-prep.bat para verificar
echo.
echo Si tiene problemas con Windows Update:
echo   - Ejecute: sfc /scannow
echo   - Ejecute: dism /online /cleanup-image /restorehealth
echo   - Desactive antivirus temporalmente durante las updates
echo.
echo Si los sitios de Microsoft no cargan en su navegador:
echo   - Descargue los archivos desde otra PC con internet
echo   - Copie los .exe / .msu a esta PC via pendrive
echo   - Instale los archivos haciendo doble click
echo.
echo ============================================================
echo.

pause
