# SISTEMA FRIGORÍFICO - SOLEMAR ALIMENTARIA
## Guía de Instalación, Uso y Solución de Problemas

**Versión:** 3.1.7  
**Última actualización:** Marzo 2026

---

## 📋 ÍNDICE

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación](#instalación)
3. [Scripts de Inicio/Detención](#scripts-de-iniciodetención)
4. [Actualización del Sistema](#actualización-del-sistema)
5. [Backup de Base de Datos](#backup-de-base-de-datos)
6. [Solución de Problemas](#solución-de-problemas)
7. [Comandos Útiles](#comandos-útiles)
8. [Repositorios GitHub](#repositorios-github)

---

## 🖥️ REQUISITOS DEL SISTEMA

### Desarrollo (SQLite)
- Windows 10/11 o Linux
- Node.js 18+ o Bun
- 4GB RAM mínimo

### Producción (PostgreSQL)
- Windows 10/11 Server o Linux Server
- PostgreSQL 14+
- Node.js 18+ o Bun
- 8GB RAM mínimo

---

## 📦 INSTALACIÓN

### Primera Instalación (Producción)

```powershell
# 1. Clonar repositorio
git clone https://github.com/aarescalvo/trz5.git
cd trz5

# 2. Instalar Bun si no está instalado
# Ver: https://bun.sh

# 3. Instalar dependencias
bun install

# 4. Crear archivo .env
notepad .env
```

### Contenido del archivo .env (PostgreSQL)

```env
DATABASE_URL="postgresql://postgres:1810@localhost:5432/trz5?schema=public"
```

### Continuar instalación

```powershell
# 5. Sincronizar base de datos
bun run db:push

# 6. Iniciar servidor
.\iniciar-servidor.bat
```

### Acceso al Sistema

- **URL:** http://localhost:3000
- **Usuario:** admin
- **Password:** admin123

---

## 🚀 SCRIPTS DE INICIO/DETENCIÓN

### iniciar-servidor.bat

```batch
@echo off
echo ====================================
echo   SOLEMAR ALIMENTARIA
echo   Iniciando servidor...
echo ====================================
echo.

cd /d "%~dp0"

:: Verificar si ya está corriendo
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [ADVERTENCIA] El puerto 3000 ya está en uso
    echo Ejecuta primero: detener-servidor.bat
    pause
    exit /b 1
)

:: Iniciar servidor
echo [1/1] Iniciando servidor en puerto 3000...
start "" cmd /c "bun run dev"
timeout /t 3 /nobreak >nul

echo.
echo ====================================
echo   Servidor iniciado!
echo   URL: http://localhost:3000
echo ====================================
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause >nul
start http://localhost:3000
```

### detener-servidor.bat

```batch
@echo off
echo ====================================
echo   Deteniendo servidor...
echo ====================================
echo.

echo [1/2] Terminando procesos bun.exe...
taskkill /F /IM bun.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Procesos bun terminados
) else (
    echo [INFO] No hay procesos bun ejecutándose
)

echo.
echo [2/2] Terminando procesos node.exe...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Procesos node terminados
) else (
    echo [INFO] No hay procesos node ejecutándose
)

echo.
echo ====================================
echo   Servidor detenido
echo ====================================
pause
```

---

## 🔄 ACTUALIZACIÓN DEL SISTEMA

### actualizar-sistema.bat

```batch
@echo off
echo ====================================
echo   Actualizando sistema...
echo ====================================
echo.

cd /d "%~dp0"

echo [1/3] Descargando actualizaciones...
git fetch origin
git stash
git pull origin master

echo.
echo [2/3] Instalando dependencias...
bun install

echo.
echo [3/3] Sincronizando base de datos...
bun run db:push

echo.
echo ====================================
echo   Sistema actualizado!
echo ====================================
pause
```

### reiniciar-actualizado.bat

```batch
@echo off
echo ====================================
echo   REINICIAR Y ACTUALIZAR SISTEMA
echo ====================================
echo.

cd /d "%~dp0"

:: Paso 1: Detener servicios
echo [1/6] Deteniendo servicios...
taskkill /F /IM bun.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

:: Paso 2: Stash y Pull
echo [2/6] Descargando actualizaciones...
git stash
git pull origin master

:: Paso 3: Restaurar PostgreSQL
echo [3/6] Configurando PostgreSQL...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"sqlite\"', 'provider = \"postgresql\"' | Set-Content prisma\schema.prisma"

:: Paso 4: Instalar y sincronizar
echo [4/6] Instalando dependencias...
bun install

echo [5/6] Sincronizando base de datos...
bun run db:push

:: Paso 5: Iniciar servidor
echo [6/6] Iniciando servidor...
start "" cmd /c "bun run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Sistema actualizado y listo!
echo   Servidor: http://localhost:3000
echo ========================================
echo.
echo Presiona Ctrl+C para detener el servidor
pause
```

---

## 💾 BACKUP DE BASE DE DATOS

### backup-sistema.bat

```batch
@echo off
setlocal enabledelayedexpansion

:: Configuración
set PG_BIN=C:\Program Files\PostgreSQL\16\bin
set PG_USER=postgres
set PG_PASS=1810
set PG_DB=trz5
set BACKUP_DIR=backups

:: Crear carpeta de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Obtener fecha y hora
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set FECHA=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%

:: Obtener versión del package.json
for /f "tokens=2 delims=:," %%a in ('findstr "version" package.json') do (
    set VERSION=%%a
    set VERSION=!VERSION:"=!
    set VERSION=!VERSION: =!
    goto :got_version
)
:got_version

:: Nombre del archivo
set BACKUP_FILE=%BACKUP_DIR%\backup_%FECHA%_v%VERSION%.sql

echo ====================================
echo   BACKUP DE BASE DE DATOS
echo ====================================
echo.
echo Base de datos: %PG_DB%
echo Archivo: %BACKUP_FILE%
echo.

:: Establecer contraseña y ejecutar pg_dump
set PGPASSWORD=%PG_PASS%
"%PG_BIN%\pg_dump.exe" -U %PG_USER% -h localhost -d %PG_DB% -F p -f "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo [OK] Backup creado exitosamente!
) else (
    echo [ERROR] No se pudo crear el backup
)

echo.
echo ====================================
echo   Backups existentes:
echo ====================================
dir /b /o-d "%BACKUP_DIR%\*.sql" 2>nul

echo.
pause
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Puerto 3000 ya está en uso"

**Causa:** Ya hay un servidor ejecutándose en el puerto 3000.

**Solución:**
```powershell
# Opción 1: Ejecutar script de detención
.\detener-servidor.bat

# Opción 2: Manual
taskkill /F /IM bun.exe
taskkill /F /IM node.exe
```

---

### Error: "El término no se reconoce como nombre de un cmdlet"

**Causa:** No estás en la carpeta correcta del proyecto.

**Solución:**
```powershell
# Ir a la carpeta del proyecto
cd C:\TRZ5

# Luego ejecutar el script
.\iniciar-servidor.bat
```

---

### Error: "git pull error - local changes would be overwritten"

**Causa:** Hay cambios locales que conflictúan con el repositorio.

**Solución:**
```powershell
# Guardar cambios locales
git stash

# Descargar actualizaciones
git pull origin master

# Restaurar cambios si es necesario
git stash pop
```

---

### Error: "Prisma Client is not configured for PostgreSQL"

**Causa:** El schema está configurado para SQLite en lugar de PostgreSQL.

**Solución:**
```powershell
# Editar schema.prisma
notepad prisma\schema.prisma

# Cambiar la línea:
# provider = "sqlite"
# Por:
# provider = "postgresql"

# Sincronizar base de datos
bun run db:push
```

---

### Error: "Can't reach database server"

**Causa:** PostgreSQL no está ejecutándose o las credenciales son incorrectas.

**Solución:**
```powershell
# Verificar que PostgreSQL esté corriendo
# Servicios de Windows -> postgresql-x64-16 -> Iniciar

# Verificar credenciales en .env
notepad .env
```

---

### Error: "Cannot find module"

**Causa:** Dependencias no instaladas.

**Solución:**
```powershell
bun install
```

---

### Error: "Migration failed"

**Causa:** Conflictos en la base de datos.

**Solución:**
```powershell
# Forzar sincronización (¡CUIDADO: puede perder datos!)
bun run db:push --force-reset

# O restaurar desde backup
```

---

## ⌨️ COMANDOS ÚTILES

### Desarrollo

```powershell
# Iniciar servidor de desarrollo
bun run dev

# Verificar errores de código
bun run lint

# Compilar para producción
bun run build

# Iniciar en modo producción
bun run start
```

### Base de datos

```powershell
# Sincronizar schema con BD
bun run db:push

# Generar Prisma Client
bun run db:generate

# Crear migración
bun run db:migrate

# Resetear BD (¡PELIGRO!)
bun run db:reset

# Poblar con datos iniciales
bun run db:seed
```

### Git

```powershell
# Ver estado de cambios
git status

# Agregar todos los cambios
git add -A

# Crear commit
git commit -m "v3.1.7 - Descripción del cambio"

# Subir a desarrollo
git push origin master

# Subir a producción
git push trz5 master

# Subir a AMBOS (recomendado)
git push origin master && git push trz5 master
```

---

## 🌐 REPOSITORIOS GITHUB

| Repositorio | Uso | Base de Datos | URL |
|-------------|-----|---------------|-----|
| `trz5` | Desarrollo / Producción | PostgreSQL | https://github.com/aarescalvo/trz5 |

### Configurar remotos

```powershell
# Agregar ambos remotos
git remote add origin https://github.com/aarescalvo/trz5.git
git remote add trz5 https://github.com/aarescalvo/trz5.git

# Verificar remotos
git remote -v
```

---

## 📝 CHECKLIST DE ACTUALIZACIÓN

Al actualizar el sistema en producción, verificar:

- [ ] Ejecutar `.\detener-servidor.bat`
- [ ] Ejecutar `.\reiniciar-actualizado.bat`
- [ ] Verificar que el servidor inicie correctamente
- [ ] Probar acceso en http://localhost:3000
- [ ] Verificar login con admin/admin123
- [ ] Probar funciones principales

---

## 📞 SOPORTE

Si los problemas persisten:

1. Revisar los logs en `dev.log`
2. Verificar que PostgreSQL esté ejecutándose
3. Verificar credenciales en `.env`
4. Restaurar desde backup si es necesario

---

**Sistema Frigorífico - Solemar Alimentaria**  
Versión 3.1.7
