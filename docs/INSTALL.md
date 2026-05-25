# Guia de Instalacion - Sistema de Gestion Frigorifica v3.17.0

## Requisitos del Sistema

### Para Desarrollo
- **Bun**: v1.1+ (recomendado como runtime y gestor de paquetes)
- **Git**: Para clonar el repositorio
- **Sistema Operativo**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **RAM**: 4 GB minimo (8 GB recomendado)
- **Disco**: 10 GB libres

### Para Produccion (Servidor)
- **CPU**: 4 nucleos minimo (Intel Core i5 o superior)
- **RAM**: 8 GB minimo (16 GB recomendado)
- **Disco**: 50 GB SSD minimo
- **Red**: IP fija en la LAN
- **Base de datos**: PostgreSQL 16+
- **Sistema Operativo**: Windows Server 2019+ o Ubuntu Server 20.04+

---

## Instalacion Rapida (Desarrollo con SQLite)

### 1. Instalar Bun
```powershell
# Windows (PowerShell como Administrador)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS / Linux
curl -fsSL https://bun.sh/install | bash
```
Cierre y vuelva a abrir la terminal despues de instalar.

### 2. Clonar repositorio
```bash
git clone https://github.com/aarescalvo/trz5.git
cd trz5
```

### 3. Instalar dependencias
```bash
bun install
```
Si hay errores, intente: `bun install --force`

### 4. Configurar base de datos (SQLite por defecto)
```bash
# El archivo .env ya incluye DATABASE_URL="file:./dev.db" para SQLite
cp .env.example .env

# Generar cliente Prisma y crear tablas
bun run db:generate
bun run db:push

# Cargar datos iniciales (operadores, etc.)
bun run db:seed
```

### 5. Iniciar servidor de desarrollo
```bash
bun run dev
```

### 6. Acceder al sistema
Abrir navegador en: `http://localhost:3000`

**Credenciales por defecto:**

| Usuario | Password | PIN | Rol |
|---------|----------|-----|-----|
| admin | admin123 | 1234 | Administrador |
| supervisor | super123 | 2222 | Supervisor |
| balanza | balanza123 | 1111 | Operador |

**IMPORTANTE:** Cambie estas credenciales en produccion desde Configuracion > Operadores.

---

## Instalacion en Produccion (PostgreSQL)

### Opcion A: Windows (PC de Produccion)

#### Paso 1: Instalar PostgreSQL 16
1. Descargar desde https://www.postgresql.org/download/windows/
2. Ejecutar instalador
3. Puerto: 5432 (por defecto)
4. Elegir contrasena segura para superuser (postgres)

#### Paso 2: Crear base de datos
```sql
-- Abrir pgAdmin o psql y ejecutar:
CREATE DATABASE trz5;
```

#### Paso 3: Clonar y configurar
```powershell
# Clonar repositorio
git clone https://github.com/aarescalvo/trz5.git C:\TRZ5
cd C:\TRZ5

# Instalar dependencias
bun install

# Configurar .env
copy .env.example .env
notepad .env
```

Editar `.env` con:
```
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/trz5"
```

#### Paso 4: Inicializar base de datos
```powershell
bun run db:generate
bun run db:push
bun run db:seed
```

#### Paso 5: Compilar e iniciar
```powershell
bun run build
npx next start
```

#### Paso 6: Configurar como servicio (opcional con NSSM)
```powershell
# Instalar NSSM
choco install nssm

# Crear servicio
nssm install TRZ5 "C:\Program Files\nodejs\node.exe" "C:\TRZ5\node_modules\next\dist\bin\next" "start"
nssm set TRZ5 AppDirectory "C:\TRZ5"
nssm set TRZ5 DisplayName "Sistema Frigorifico TRZ5"
nssm set TRZ5 Start SERVICE_AUTO_START
nssm start TRZ5
```

### Opcion B: Linux (Ubuntu Server)

#### Paso 1: Instalar dependencias
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y postgresql-16 git

# Instalar Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### Paso 2: Crear base de datos
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE trz5;
CREATE USER trz5_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE trz5 TO trz5_user;
\q
```

#### Paso 3: Clonar y configurar
```bash
git clone https://github.com/aarescalvo/trz5.git /opt/trz5
cd /opt/trz5
bun install
```

Editar `.env`:
```
DATABASE_URL="postgresql://trz5_user:tu_password_seguro@localhost:5432/trz5"
```

#### Paso 4: Inicializar
```bash
bun run db:generate
bun run db:push
bun run db:seed
bun run build
```

#### Paso 5: Configurar servicio systemd
```bash
sudo nano /etc/systemd/system/trz5.service
```
```ini
[Unit]
Description=Sistema Frigorifico TRZ5
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/trz5
ExecStart=/home/$USER/.bun/bin/bun run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable trz5
sudo systemctl start trz5
sudo systemctl status trz5
```

---

## Acceso Multi-PC (Red Local)

Las computadoras de la red acceden al sistema via navegador:

1. **Obtener IP del servidor:**
```powershell
# Windows
ipconfig
# Anotar la IPv4 (ej: 192.168.1.100)
```

2. **Desde PCs cliente**, abrir navegador en: `http://192.168.1.100:3000`

3. **Firewall** (si no responde):
```powershell
# Windows - abrir puerto 3000
netsh advfirewall firewall add rule name="TRZ5" dir=in action=allow protocol=TCP localport=3000
```
```bash
# Linux
sudo ufw allow 3000/tcp
```

---

## Scripts .bat Disponibles (Windows)

| Script | Funcion |
|--------|---------|
| `iniciar-servidor.bat` | Inicia el servidor con doble click |
| `detener-servidor.bat` | Detiene procesos bun/node |
| `iniciar-servidor-silencioso.bat` | Inicia sin ventana visible |
| `detener-servidor-silencioso.bat` | Detiene sin ventana visible |
| `actualizar-sistema.bat` | Descarga actualizaciones desde GitHub |
| `reiniciar-actualizado.bat` | Detiene + Actualiza + Inicia |
| `backup-sistema.bat` | Crea backup de PostgreSQL con pg_dump |
| `backup-database.bat` | Backup completo de base de datos |
| `backup-version.bat` | Backup con version en nombre |
| `restaurar-backup.bat` | Restaurar backup desde archivo |
| `restore-backup.bat` | Restaurar backup alternativo |
| `configurar-postgres.bat` | Asistente de configuracion PostgreSQL |

---

## Actualizaciones

### Desde terminal
```bash
cd C:\TRZ5
git pull origin master
bun install
bun run db:generate
bun run db:push
bun run build
# Reiniciar servidor
```

### Con scripts .bat
1. Doble click en `actualizar-sistema.bat` (o `reiniciar-actualizado.bat`)
2. El script descarga cambios, actualiza dependencias y reinicia

---

## Backups

### Backup manual (PostgreSQL)
```bash
pg_dump -U postgres -d trz5 -F c -f backup_YYYYMMDD.backup
```

### Restaurar backup
```bash
pg_restore -U postgres -d trz5 backup_YYYYMMDD.backup
```

### Backup con scripts .bat
- Doble click en `backup-sistema.bat`
- Los backups se guardan en la carpeta `backups/`
- Formato: `backup_YYYY-MM-DD_HH-MM_vX.X.X.sql`

### API de backup (desde el sistema)
El sistema incluye API accesible solo para administradores:
- `GET /api/sistema/backup` - Listar backups
- `POST /api/sistema/backup` - Crear backup manual
- `PUT /api/sistema/backup` - Restaurar backup

---

## Solucion de Problemas

| Problema | Solucion |
|----------|----------|
| "bun no se reconoce" | Cierre y reabra la terminal/PowerShell |
| "Cannot find module" | `rm -rf node_modules && bun install` |
| "Port 3000 already in use" | Cerrar otro programa en puerto 3000 |
| Pantalla en blanco | `rm -rf .next && bun run dev` (dev) o `bun run build` (prod) |
| Error de conexion a BD | Verificar que PostgreSQL este corriendo y `.env` sea correcto |
| "prisma generate" falla | Verificar DATABASE_URL en `.env` y que PostgreSQL este accesible |
| Lint con errores | `bun run lint` para ver detalles |

---

## Comandos Disponibles

| Comando | Descripcion |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo (puerto 3000) |
| `bun run build` | Compilar para produccion |
| `bun run start` | Servidor de produccion (standalone) |
| `bun run db:generate` | Generar cliente Prisma |
| `bun run db:push` | Sincronizar esquema con BD |
| `bun run db:seed` | Cargar datos iniciales |
| `bun run lint` | Verificar codigo con ESLint |

---

## Repositorio

- **GitHub**: https://github.com/aarescalvo/trz5
- **Branch**: master
- **Issues**: https://github.com/aarescalvo/trz5/issues
