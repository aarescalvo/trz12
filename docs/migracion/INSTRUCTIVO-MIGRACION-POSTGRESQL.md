# Instructivo de Migración: SQLite → PostgreSQL

## Sistema Frigorífico v2.2.0

---

## 📋 RESUMEN EJECUTIVO

Este documento detalla el proceso para migrar el sistema de SQLite a PostgreSQL, incluyendo:
- Instalación de PostgreSQL
- Backup de la versión SQLite actual
- Migración de datos
- Errores esperados y soluciones
- Procedimiento de corrección remota

---

## 🛡️ PASO 0: BACKUP DE SQLITE (OBLIGATORIO)

### En el servidor de producción:

```bash
# 1. Detener el servidor
pm2 stop trz5  # o el proceso que esté corriendo

# 2. Crear carpeta de backup
mkdir -p /opt/trz5/backups/pre-postgresql

# 3. Copiar base de datos SQLite
cp /opt/trz5/prisma/dev.db /opt/trz5/backups/pre-postgresql/dev.db.backup

# 4. Copiar toda la carpeta del proyecto como backup
tar -czvf /opt/trz5/backups/pre-postgresql/trz5-sqlite-v2.2.0.tar.gz \
  /opt/trz5 \
  --exclude='node_modules' \
  --exclude='.next'

# 5. Verificar backup
ls -la /opt/trz5/backups/pre-postgresql/

# 6. Guardar versión de trabajo actual
echo "v2.2.0-sqlite-$(date +%Y%m%d)" > /opt/trz5/backups/pre-postgresql/VERSION
```

### Desde GitHub (alternativa):
```bash
# Clonar la última versión SQLite
git clone https://github.com/aarescalvo/trz5.git trz5-sqlite-v2.2.0
```

---

## 📥 PASO 1: INSTALACIÓN DE POSTGRESQL

### Windows Server

1. **Descargar PostgreSQL**
   - Ir a: https://www.postgresql.org/download/windows/
   - Descargar versión 16.x (64-bit)
   - Ejecutar instalador como Administrador

2. **Durante la instalación:**
   - Componentes: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Directorio de datos: `C:\Program Files\PostgreSQL\16\data`
   - Puerto: `5432` (por defecto)
   - Contraseña superusuario: **GUARDAR EN LUGAR SEGURO**
   - Locale: `Spanish_Argentina.1252` o `en_US.UTF-8`

3. **Verificar instalación:**
```cmd
# Abrir SQL Shell (psql)
Server [localhost]: ENTER
Database [postgres]: ENTER
Port [5432]: ENTER
Username [postgres]: ENTER
Password: <tu_contraseña>

# Debería aparecer:
postgres=#
```

### Ubuntu/Debian Linux

```bash
# 1. Agregar repositorio oficial
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# 2. Instalar PostgreSQL 16
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16

# 3. Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Verificar
sudo systemctl status postgresql

# 5. Cambiar contraseña
sudo -u postgres psql
postgres=# ALTER USER postgres PASSWORD 'tu_contraseña_segura';
postgres=# \q
```

### Docker (recomendado para desarrollo)

```bash
# Crear contenedor PostgreSQL
docker run -d \
  --name trz5-postgres \
  -e POSTGRES_USER=trz5 \
  -e POSTGRES_PASSWORD=tu_contraseña_segura \
  -e POSTGRES_DB=trz5 \
  -p 5432:5432 \
  -v trz5-pgdata:/var/lib/postgresql/data \
  postgres:16

# Verificar
docker ps | grep postgres
```

---

## 🔧 PASO 2: CREAR BASE DE DATOS Y USUARIO

```sql
-- Conectar como postgres
psql -U postgres

-- Crear usuario para el sistema
CREATE USER trz5 WITH PASSWORD 'tu_contraseña_segura';

-- Crear base de datos
CREATE DATABASE trz5 OWNER trz5;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE trz5 TO trz5;

-- Conectar a la base de datos
\c trz5

-- Extensión necesaria para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Salir
\q
```

---

## 📦 PASO 3: MODIFICAR PROYECTO

### 3.1 Usar schema PostgreSQL preparado

```bash
# El archivo ya está listo
cp prisma/schema-postgres.prisma prisma/schema.prisma
```

### 3.2 Actualizar .env

```bash
# Crear nuevo archivo .env
DATABASE_URL="postgresql://trz5:tu_contraseña_segura@localhost:5432/trz5?schema=public"
```

---

## 🚀 PASO 4: MIGRAR DATOS

### Paso completo automatizado:

```bash
# 1. Exportar datos de SQLite
bun run db:export

# 2. Configurar .env con PostgreSQL
# (Editar archivo .env)

# 3. Generar cliente Prisma
bun run db:generate

# 4. Crear tablas
bun run db:push

# 5. Importar datos
bun run db:import backups/migration-data/data-export-XXXXX.json
```

---

## ⚠️ ERRORES ESPERADOS Y SOLUCIONES

### Error 1: "Can't reach database server"
```
Error: P1001: Can't reach database server at `localhost:5432`
```
**Solución:** Verificar que PostgreSQL esté corriendo
```bash
sudo systemctl status postgresql  # Linux
net start postgresql-x64-16      # Windows
```

### Error 2: "Authentication failed"
```
Error: P1000: Authentication failed
```
**Solución:** Verificar usuario y contraseña en .env

### Error 3: "Database doesn't exist"
```
Error: P1003: Database `trz5` doesn't exist
```
**Solución:** `CREATE DATABASE trz5;`

### Error 4: "UUID extension not found"
```
Error: extension "uuid-ossp" must be installed
```
**Solución:** 
```sql
\c trz5
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error 5: "Column cannot be null"
**Solución:** Los campos obligatorios deben tener valor. Limpiar datos antes de migrar.

---

## 🔄 PROCEDIMIENTO DE CORRECCIÓN REMOTA

Si hay errores en producción:

1. **Detectas el error** → Me envías el mensaje completo
2. **Corrijo archivos** → Modifico schema, scripts, etc.
3. **Copias archivos** → Solo los modificados
4. **Reinicias** → `pm2 restart trz5`

### Archivos que puedo modificar remotamente:
- `prisma/schema.prisma`
- `scripts/import-to-postgres.ts`
- `.env`
- `src/lib/db.ts`

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

```bash
# 1. Test de conexión
bun run db:test

# 2. Verificar tablas
psql -U trz5 -d trz5 -c "\dt"

# 3. Verificar datos
psql -U trz5 -d trz5 -c "SELECT count(*) FROM Tropa"

# 4. Iniciar servidor
bun run dev

# 5. Verificar en navegador
```

---

## 📞 INFORMACIÓN A ENVIAR SI HAY ERRORES

1. Sistema operativo
2. Versión de PostgreSQL (`psql --version`)
3. Error completo del log
4. Contenido de `.env` (SIN contraseñas)
5. Resultado de `\dt` en psql
