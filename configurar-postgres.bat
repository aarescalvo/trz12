@echo off
title TrazaSole - Configurar PostgreSQL
echo ========================================
echo   TRAZASOLE - Configurar PostgreSQL
echo ========================================
echo.
cd /d "C:\TrazaSole"

echo Cambiando schema a PostgreSQL...
(Get-Content prisma/schema.prisma) -replace 'provider = "sqlite"', 'provider = "postgresql"' | Set-Content prisma/schema.prisma

echo Generando cliente Prisma...
bun run db:generate

echo.
echo ========================================
echo   Configuracion completada
echo ========================================
echo.
pause
