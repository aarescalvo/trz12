@echo off
REM Detener servidor TrazaSole
echo Deteniendo TrazaSole...

REM Matar procesos de bun y node relacionados con TrazaSole
taskkill /f /im bun.exe 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq TrazaSole*" 2>nul

echo Servidor detenido.
timeout /t 2 >nul
