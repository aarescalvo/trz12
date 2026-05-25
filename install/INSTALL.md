# GUIA DE INSTALACION - SISTEMA FRIGORIFICO TRZ5

## Version 3.14.1 - CICLO I + CICLO II + Facturacion

---

## INDICE

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalacion Rapida](#instalacion-rapida)
3. [Instalacion Detallada - Windows](#instalacion-detallada---windows)
4. [Instalacion Detallada - Linux](#instalacion-detallada---linux)
5. [Configuracion de PostgreSQL](#configuracion-de-postgresql)
6. [Configuracion Post-Instalacion](#configuracion-post-instalacion)
7. [Actualizacion del Sistema](#actualizacion-del-sistema)
8. [Backup y Restauracion](#backup-y-restauracion)
9. [Solucion de Problemas](#solucion-de-problemas)
10. [Configuracion de Hardware](#configuracion-de-hardware)

---

## REQUISITOS DEL SISTEMA

### Hardware

| Componente | Minimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 nucleos | 4 nucleos |
| RAM | 4 GB | 8 GB |
| Disco | 10 GB | 50 GB SSD |
| Red | 100 Mbps | 1 Gbps |

### Software

| Componente | Version | Notas |
|------------|---------|-------|
| Bun | 1.1+ | Runtime JavaScript |
| PostgreSQL | 14+ | Recomendado 16 |
| Git | 2.30+ | Para clonar/actualizar |

### Puertos de Red

| Puerto | Servicio | Notas |
|--------|----------|-------|
| 3000 | Aplicacion web | Puerto principal |
| 5432 | PostgreSQL | Base de datos |
| 9100 | Impresoras | ZPL/DPL (opcional) |

---

## INSTALACION RAPIDA

### Windows

```powershell
# 1. Instalar Bun (PowerShell como Admin)
powershell -c "irm bun.sh/install.ps1 | iex"

# 2. Cerrar y reabrir PowerShell

# 3. Clonar repositorio
git clone https://github.com/aarescalvo/trz5.git C:\TRZ5

# 4. Instalar dependencias
cd C:\TRZ5
bun install

# 5. Configurar base de datos
copy .env.example .env
notepad .env
# Configurar DATABASE_URL con datos de PostgreSQL

# 6. Inicializar base de datos
bun run db:generate
bun run db:push
bun run db:seed

# 7. Compilar y ejecutar
bun run build
npx next start
```

### Linux

```bash
# 1. Instalar Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 2. Clonar e instalar
git clone https://github.com/aarescalvo/trz5.git /opt/trz5
cd /opt/trz5
bun install

# 3. Configurar .env con PostgreSQL
cp .env.example .env
nano .env

# 4. Inicializar
bun run db:generate
bun run db:push
bun run db:seed

# 5. Compilar y ejecutar
bun run build
bun run start
```

---

## INSTALACION DETALLADA - WINDOWS

### Paso 1: Instalar Bun Runtime

1. Abrir **PowerShell como Administrador**
2. Ejecutar:
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```
3. **Cerrar y reabrir PowerShell** para que detecte el comando `bun`
4. Verificar:
   ```powershell
   bun --version
   ```

**Error comun:** `bun no se reconoce como comando`
```powershell
# Agregar al PATH manualmente
$env:Path += ";$env:USERPROFILE\.bun\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.bun\bin", "User")
# Cerrar y reabrir PowerShell
```

### Paso 2: Instalar Git

1. Descargar de https://git-scm.com
2. Instalar con opciones por defecto
3. Verificar:
   ```powershell
   git --version
   ```

### Paso 3: Instalar PostgreSQL

1. Descargar PostgreSQL 16 de https://www.postgresql.org/download/windows/
2. Ejecutar el instalador:
   - Contraseña del superusuario: **elegir y recordar** (ej: `postgres123`)
   - Puerto: **5432** (por defecto)
   - Locale: **Default**
3. Al finalizar, desmarcar "Launch Stack Builder" (no necesario)
4. Verificar que el servicio esta corriendo:
   ```powershell
   # Abrir services.msc y buscar PostgreSQL
   # O verificar en SQL Shell (psql):
   psql -U postgres
   # Escribir la contrasena elegida
   ```

### Paso 4: Crear la Base de Datos

```powershell
# Opcion A: Desde SQL Shell (psql)
# Abrir "SQL Shell (psql)" desde el menu Inicio
# Conectar con: postgres / tu_password / localhost / 5432 / postgres
CREATE DATABASE trz5;
\q

# Opcion B: Desde PowerShell
psql -U postgres -c "CREATE DATABASE trz5;"
```

### Paso 5: Clonar el Repositorio

```powershell
cd C:\
git clone https://github.com/aarescalvo/trz5.git C:\TRZ5
cd C:\TRZ5
```

### Paso 6: Instalar Dependencias

```powershell
bun install
```

**Error comun:** `Network error`
```powershell
# Verificar conexion
Test-NetConnection registry.npmjs.org -Port 443
# Si hay proxy corporativo:
$env:HTTP_PROXY = "http://proxy:puerto"
$env:HTTPS_PROXY = "http://proxy:puerto"
```

### Paso 7: Configurar Variables de Entorno

```powershell
# Crear archivo .env
copy .env.example .env
notepad .env
```

Contenido del `.env`:
```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/trz5"

# Autenticacion
NEXTAUTH_SECRET="generar-un-texto-aleatorio-seguro-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Entorno
NODE_ENV="production"
```

**Importante:** Reemplazar `TU_PASSWORD` con la contrasena elegida en el Paso 3.

### Paso 8: Inicializar Base de Datos

```powershell
# Generar cliente Prisma
bun run db:generate

# Crear todas las tablas
bun run db:push

# Cargar datos iniciales (operadores, configuracion)
bun run db:seed
```

**Error comun:** `Can't reach database server`
```powershell
# Verificar que PostgreSQL esta corriendo
Get-Service -Name postgresql*
# Si no esta, iniciarlo
Start-Service postgresql-x64-16

# Verificar que la base de datos existe
psql -U postgres -c "\l" | findstr trz5
```

### Paso 9: Compilar el Proyecto

```powershell
bun run build
```

**Error comun:** `Build failed`
```powershell
# Limpiar y reconstruir
Remove-Item -Recurse -Force .next
bun install
bun run db:generate
bun run build
```

### Paso 10: Iniciar el Sistema

```powershell
# Opcion A: Con bun (desarrollo)
bun run dev

# Opcion B: Con next start (produccion - RECOMENDADO)
npx next start
```

**Acceder al sistema:** Abrir navegador en `http://localhost:3000`

### Paso 11: Crear Servicio de Windows (Opcional - Recomendado)

Para que el sistema inicie automaticamente con Windows:

**Opcion A: Usando NSSM**

```powershell
# Descargar NSSM
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "nssm.zip"
Expand-Archive "nssm.zip" -DestinationPath "C:\temp"
Copy-Item "C:\temp\nssm-2.24\win64\nssm.exe" "C:\TRZ5\"

# Crear servicio
C:\TRZ5\nssm.exe install TRZ5 "C:\Users\$env:USERNAME\.bun\bin\bun.exe" ".next\standalone\server.js"
C:\TRZ5\nssm.exe set TRZ5 AppDirectory "C:\TRZ5"
C:\TRZ5\nssm.exe set TRZ5 AppStdout "C:\TRZ5\logs\app.log"
C:\TRZ5\nssm.exe set TRZ5 AppStderr "C:\TRZ5\logs\error.log"
C:\TRZ5\nssm.exe set TRZ5 Start SERVICE_AUTO_START

# Iniciar servicio
Start-Service TRZ5
```

**Opcion B: Usando los scripts .bat incluidos**

Doble click en `iniciar-servidor.bat` para iniciar, `detener-servidor.bat` para detener.

### Paso 12: Configurar Firewall

```powershell
# Crear regla de firewall para el puerto 3000
New-NetFirewallRule -DisplayName "TRZ5 - Puerto 3000" `
    -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## INSTALACION DETALLADA - LINUX

### Paso 1: Preparar el Sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip postgresql postgresql-contrib
```

### Paso 2: Instalar Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

### Paso 3: Configurar PostgreSQL

```bash
# Iniciar servicio
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Crear usuario y base de datos
sudo -u postgres createuser -s $USER
sudo -u postgres createdb trz5

# Para acceder sin contrasena local (peer auth):
sudo -u postgres psql -c "ALTER USER $USER WITH PASSWORD 'tu_password';"
```

### Paso 4: Clonar e Instalar

```bash
git clone https://github.com/aarescalvo/trz5.git /opt/trz5
cd /opt/trz5
bun install
```

### Paso 5: Configurar .env

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/trz5"
NEXTAUTH_SECRET="generar-un-texto-aleatorio-seguro"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
```

### Paso 6: Inicializar Base de Datos

```bash
bun run db:generate
bun run db:push
bun run db:seed
```

### Paso 7: Compilar

```bash
bun run build
```

### Paso 8: Crear Servicio del Sistema

```bash
sudo nano /etc/systemd/system/trz5.service
```

Contenido:
```ini
[Unit]
Description=Sistema Frigorifico TRZ5
After=network.target postgresql.service

[Service]
Type=simple
User=trz5
WorkingDirectory=/opt/trz5
Environment="NODE_ENV=production"
ExecStart=/home/trz5/.bun/bin/bun .next/standalone/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/trz5/app.log
StandardError=append:/var/log/trz5/error.log

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable trz5
sudo systemctl start trz5
sudo systemctl status trz5
```

### Paso 9: Configurar Firewall

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

### Paso 10: Configurar Nginx (Opcional)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/trz5
```

```nginx
server {
    listen 80;
    server_name frigorifico.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/trz5 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## CONFIGURACION DE POSTGRESQL

### Parametros Recomendados para Produccion

Editar `postgresql.conf`:

```
# Memoria (ajustar segun RAM disponible)
shared_buffers = 2GB          # 25% de RAM
effective_cache_size = 6GB    # 75% de RAM
work_mem = 64MB
maintenance_work_mem = 512MB

# Conexiones
max_connections = 100

# WAL
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_min_duration_statement = 500
log_checkpoints = on
log_connections = on
log_disconnections = on
```

### Backup Automatico con pg_dump

```bash
# Crear script de backup
cat > /opt/trz5/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/trz5"
mkdir -p $BACKUP_DIR
pg_dump -U $USER -d trz5 -F c -f $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M).backup
# Mantener solo ultimos 30 backups
ls -t $BACKUP_DIR/*.backup | tail -n +31 | xargs -r rm
EOF

chmod +x /opt/trz5/backup.sh
```

```bash
# Programar con cron (diario a las 2 AM)
crontab -e
# Agregar:
0 2 * * * /opt/trz5/backup.sh
```

---

## CONFIGURACION POST-INSTALACION

### 1. Cambiar Credenciales por Defecto

Acceder al sistema con admin / admin123, luego ir a **Configuracion > Operadores** y cambiar la contrasena del administrador.

### 2. Configurar Datos del Frigorifico

Ir a **Configuracion > Frigorifico** y completar:
- Nombre del establecimiento
- Numero de establecimiento SENASA
- CUIT
- Direccion

### 3. Configurar Corrales y Camaras

Ir a **Configuracion > Corrales** y **Configuracion > Camaras** para crear las estructuras fisicas del frigorifico.

### 4. Configurar Tipificadores

Ir a **Configuracion > Tipificadores** y agregar los matriculados habilitados.

### 5. Configurar Clientes

Ir a **Configuracion > Clientes** y crear:
- Productores (propietarios de hacienda)
- Usuarios de Faena (matarifes)

### 6. Configurar Permisos de Operadores

Ir a **Configuracion > Operadores** y asignar los 16 permisos disponibles segun el rol de cada operador. Los permisos se organizan en:
- **CICLO I:** Pesaje Camiones, Pesaje Individual, Movimiento Hacienda, Lista Faena, Ingreso Cajon, Romaneo
- **Subproductos:** Menudencias
- **Stock:** Stock Camaras, Trazabilidad
- **CICLO II:** Cuarteo, Desposte, Empaque, Expedicion C2
- **Reportes:** Reportes, Dashboard Financiero
- **Administracion:** Facturacion
- **Sistema:** Configuracion

### 7. Configurar Balanzas y Puestos de Trabajo

Ir a **Configuracion > Balanzas** para configurar:
- Balanzas con conexion serial o TCP
- Puestos de trabajo con impresoras de rotulos y scanners

---

## ACTUALIZACION DEL SISTEMA

### Windows

```powershell
cd C:\TRZ5
git pull origin master
bun install
bun run db:generate
bun run db:push
bun run build
# Luego reiniciar el servidor
```

### Linux

```bash
cd /opt/trz5
git pull origin master
bun install
bun run db:generate
bun run db:push
bun run build
sudo systemctl restart trz5
```

---

## BACKUP Y RESTAURACION

### Backup Manual

**Windows:**
```powershell
pg_dump -U postgres -d trz5 -F c -f C:\backups\backup_20260417.backup
```

**Linux:**
```bash
pg_dump -U $USER -d trz5 -F c -f /var/backups/trz5_$(date +%Y%m%d).backup
```

### Restaurar Backup

**Windows:**
```powershell
# Detener el sistema primero
pg_restore -U postgres -d trz5 -c C:\backups\backup_20260417.backup
```

**Linux:**
```bash
sudo systemctl stop trz5
pg_restore -U $USER -d trz5 -c /var/backups/trz5_20260417.backup
sudo systemctl start trz5
```

### Backup desde la API

El sistema incluye una API de backup accesible solo para administradores:
- `GET /api/sistema/backup` - Listar backups existentes
- `POST /api/sistema/backup` - Crear backup manual
- `PUT /api/sistema/backup` - Restaurar desde un backup

---

## CONFIGURACION DE HARDWARE

### Balanzas

El sistema soporta balanzas con conexion:
- **Serial (RS232):** Configurar puerto COM, baudRate, dataBits, parity
- **TCP/IP:** Configurar IP y puerto
- **Simulada:** Para testing y desarrollo

Protocolos soportados: Generico, Toledo, Mettler, Ohaus, Digi, Adam

### Impresoras de Rotulos

Modelos soportados:
- **Zebra ZT410** (300 DPI) - Formato ZPL
- **Zebra ZT230** (203 DPI) - Formato ZPL
- **Datamax Mark II** (203 DPI) - Formato DPL

Tipos de rotulos disponibles:
- Pesaje Individual (10x5 cm)
- Media Res (8x12 cm)
- Menudencia (6x8 cm)
- Caja C2 (personalizable)

### Puestos de Trabajo

Cada puesto puede configurarse con:
- Balanza asignada
- Impresora de rotulos (IP + puerto)
- Impresora de tickets (IP + puerto)
- Scanner de codigo de barras (puerto)

---

## SOLUCION DE PROBLEMAS

### Error: `Port 3000 already in use`
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -i :3000
kill -9 <PID>
```

### Error: `Can't reach database server`
```powershell
# Verificar que PostgreSQL esta corriendo
Get-Service -Name postgresql*
Start-Service postgresql-x64-16

# Verificar credenciales en .env
notepad .env
```

### Error: `Cannot find module`
```powershell
cd C:\TRZ5
bun install
bun run db:generate
bun run build
```

### Error: `Prisma Client could not be generated`
```powershell
bunx prisma generate
bun run db:push
```

### Error: `Out of memory`
```powershell
# Aumentar memoria para Node/Bun
$env:NODE_OPTIONS = "--max-old-space-size=4096"
bun run build
```

### Error: `Database connection timeout`
```powershell
# Verificar que PostgreSQL acepta conexiones
psql -U postgres -d trz5 -c "SELECT 1;"

# Verificar pg_hba.conf para conexiones locales
# En Windows: C:\Program Files\PostgreSQL\16\data\pg_hba.conf
```

### Error: `Permission denied` (Linux)
```bash
sudo chown -R $(whoami):$(whoami) /opt/trz5
sudo chown -R $(whoami):$(whoami) /var/log/trz5
```

---

## SOPORTE TECNICO

- **Repositorio:** https://github.com/aarescalvo/trz5
- **Issues:** https://github.com/aarescalvo/trz5/issues

---

## LICENCIA

Software propietario - Uso interno
Todos los derechos reservados.
