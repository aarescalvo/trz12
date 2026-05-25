@echo off
REM Iniciar servidor TrazaSole en segundo plano
echo Iniciando TrazaSole en segundo plano...
echo El servidor estara disponible en http://localhost:3000
echo.
echo Para detener el servidor, ejecute detener-servidor.bat
echo.

REM Iniciar bun dev de forma silenciosa
start "TrazaSole Server" /min cmd /c "bun run dev"

echo Servidor iniciado correctamente.
timeout /t 2 >nul
