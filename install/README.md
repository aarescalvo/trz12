# Sistema de Gestion Frigorifica - Produccion4Z

Sistema integral de gestion para frigorificos desarrollado en Next.js 16 + TypeScript + Bun. Incluye Ciclo I (recepcion y faena), Ciclo II (desposte, empaque y expedicion), facturacion completa y reportes.

**Version:** 3.14.1 | **Repositorio:** https://github.com/aarescalvo/trz5

---

## Instalacion Rapida

### Windows 11 (Produccion)

#### Opcion A: Instalacion Paso a Paso (Recomendado)

1. **Instalar Bun** - Abrir PowerShell como Administrador:
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

2. **Cerrar y reabrir PowerShell**

3. **Instalar Git** (si no esta) - Descargar de https://git-scm.com

4. **Instalar PostgreSQL 16** - Descargar de https://www.postgresql.org/download/windows/
   - Durante la instalacion, recordar la contrasena del usuario `postgres`
   - Puerto por defecto: 5432

5. **Crear la base de datos:**
   ```powershell
   # Abrir psql (SQL Shell) y ejecutar:
   CREATE DATABASE trz5;
   ```

6. **Clonar e instalar el sistema:**
   ```powershell
   cd C:\
   git clone https://github.com/aarescalvo/trz5.git C:\TRZ5
   cd C:\TRZ5
   bun install
   ```

7. **Configurar variables de entorno:**
   ```powershell
   copy .env.example .env
   notepad .env
   ```
   
   Contenido del `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/trz5"
   NEXTAUTH_SECRET="cualquier-texto-seguro-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

8. **Inicializar la base de datos:**
   ```powershell
   bun run db:generate
   bun run db:push
   bun run db:seed
   ```

9. **Compilar y ejecutar:**
   ```powershell
   bun run build
   npx next start
   ```

10. **Acceder al sistema:** Abrir navegador en `http://localhost:3000`

#### Opcion B: Instalador Automatico

1. Descargar desde GitHub: https://github.com/aarescalvo/trz5
2. Extraer el contenido del ZIP en `C:\TRZ5`
3. Abrir PowerShell como **Administrador**
4. Ejecutar:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   cd C:\TRZ5\install
   .\install-windows.ps1
   ```
5. Abrir navegador en `http://localhost:3000`

### Linux / macOS

```bash
# 1. Instalar Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 2. Instalar PostgreSQL (Ubuntu/Debian)
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser -s $USER
sudo -u postgres createdb trz5

# 3. Clonar e instalar
git clone https://github.com/aarescalvo/trz5.git
cd trz5
bun install

# 4. Configurar .env
cp .env.example .env
# Editar DATABASE_URL con datos de PostgreSQL

# 5. Inicializar base de datos
bun run db:generate
bun run db:push
bun run db:seed

# 6. Compilar y ejecutar
bun run build
bun run start
```

---

## Requisitos

| Componente | Minimo | Recomendado |
|------------|--------|-------------|
| Sistema Operativo | Windows 10 / Ubuntu 20.04 | Windows 11 / Ubuntu 22.04 |
| CPU | 2 nucleos | 4 nucleos |
| RAM | 4 GB | 8 GB |
| Disco | 10 GB | 50 GB SSD |
| PostgreSQL | 14 | 16+ |
| Bun | 1.1+ | Ultima version |
| Puerto | 3000 disponible | - |

---

## Credenciales por Defecto

| Usuario | Password | PIN | Rol |
|---------|----------|-----|-----|
| admin | admin123 | 1234 | Administrador |
| supervisor | super123 | 2222 | Supervisor |
| balanza | balanza123 | 1111 | Operador |

**IMPORTANTE:** Cambiar estas credenciales en produccion desde Configuracion > Operadores.

---

## Modulos del Sistema

### CICLO I - Recepcion y Faena
- Pesaje Camiones (ingreso hacienda, particular, salida mercaderia)
- Pesaje Individual (con seleccion rapida de raza y tipo)
- Movimiento de Hacienda (corrales, movimiento entre corrales)
- Lista de Faena (planificacion diaria, asignacion de garrones)
- Ingreso a Cajon
- Romaneo (pesaje de medias, calculo automatico de rinde)
- VB Romaneo (verificacion y aprobacion)
- Expedicion (despachos de medias reses, FIFO)

### CICLO II - Desposte, Empaque y Expedicion
- Cuarteo (tipos dinamicos, merma de oreo)
- Ingreso Desposte C2 (seleccion multiple, historial)
- Produccion / Desposte (control de masa, auto-descuento BOM)
- Subproductos C2 (hueso, grasa, incomestible, recortes)
- Degradacion (trimming, golpeado, decomiso, aprovechamiento)
- Empaque (GS1-128, fechas de vencimiento automaticas)
- Expedicion C2 (pallets, control de temperatura)

### Subproductos
- Menudencias (con tipos personalizados)
- Cueros
- Rendering (grasa, desperdicios, fondo digestor)

### Stocks y Reportes
- Stocks Corrales
- Stock Camaras / Cajas (unificado C1 + C2)
- Planilla 01 (SENASA)
- Rindes por Tropa
- Busqueda por Filtro
- Reportes SENASA
- Reportes SIGICA
- Reportes Gerenciales
- Dashboard Ejecutivo (KPIs, alertas)
- Dashboard Financiero (metricas financieras, facturacion por cliente)

### Administracion y Facturacion
- Facturacion (notas de credito/debito, cheques, arqueos)
- Cuenta Corriente
- Despachos y Remitos
- Tarifas y Precios (por servicio, por cliente, historicos)
- Proveedores y Ordenes de Compra

### Trazabilidad y Calidad
- Trazabilidad completa
- CCIR / Declaracion Jurada
- Calidad - Reclamos y Novedades

### Configuracion
- Operadores (16 permisos individuales)
- Productos y Subproductos
- Corrales y Camaras
- Balanzas y Puestos de Trabajo
- Rotulos ZPL/DPL (Zebra ZT410/ZT230, Datamax Mark II)
- Codigo de Barras
- C2 Maestros (rubros, tipos de cuarto, productos desposte, BOM)

---

## Seguridad

- Autenticacion con usuario/password o PIN
- Rate limiting: 10 intentos / 15 min, bloqueo 5 min
- 16 permisos individuales por operador
- 97.8% de rutas API protegidas
- Auditoria de acciones criticas
- Rol ADMINISTRADOR con acceso completo automatico

---

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Compilar para produccion |
| `bun run start` | Iniciar en produccion (standalone) |
| `npx next start` | Iniciar en produccion (Windows) |
| `bun run db:generate` | Generar cliente Prisma |
| `bun run db:push` | Sincronizar base de datos |
| `bun run db:seed` | Cargar datos iniciales |
| `bun run lint` | Verificar codigo |

---

## Scripts .bat (Windows)

| Script | Descripcion |
|--------|-------------|
| `iniciar-servidor.bat` | Inicia el sistema |
| `detener-servidor.bat` | Detiene el sistema |
| `actualizar-sistema.bat` | Descarga actualizaciones |
| `backup-sistema.bat` | Crea backup de PostgreSQL |

---

## Actualizacion

```powershell
# Windows
cd C:\TRZ5
git pull origin master
bun install
bun run db:generate
bun run db:push
bun run build
# Luego reiniciar el servidor
```

```bash
# Linux
cd /opt/trz5
git pull origin master
bun install
bun run db:generate
bun run db:push
bun run build
sudo systemctl restart trz5
```

---

## Backup

```powershell
# Windows - Backup manual con pg_dump
pg_dump -U postgres -d trz5 -F c -f C:\backups\backup_20260417.backup

# Windows - Restaurar
pg_restore -U postgres -d trz5 C:\backups\backup_20260417.backup
```

```bash
# Linux - Backup manual
pg_dump -U $USER -d trz5 -F c -f /var/backups/trz5_$(date +%Y%m%d).backup
```

Tambien disponible desde la API del sistema (solo admin):
- `GET /api/sistema/backup` - Listar backups
- `POST /api/sistema/backup` - Crear backup

---

## Solucion de Problemas

### Error: "bun no se reconoce"
```powershell
# Instalar Bun
powershell -c "irm bun.sh/install.ps1 | iex"
# Cerrar y reabrir PowerShell
```

### Error: "Port 3000 is already in use"
```powershell
# Ver proceso que usa el puerto
netstat -ano | findstr :3000
# Matar proceso
taskkill /PID [numero] /F
```

### Error: "Cannot find module"
```powershell
cd C:\TRZ5
bun install
bun run db:generate
bun run build
```

### Error: "Prisma Client could not be generated"
```powershell
bunx prisma generate
bun run db:push
```

### Error: "Connection refused" (PostgreSQL)
1. Verificar que PostgreSQL esta ejecutandose: `services.msc` > buscar PostgreSQL
2. Verificar credenciales en `.env`
3. Verificar que la base de datos existe: `psql -U postgres -l`

---

## Soporte

- **Repositorio:** https://github.com/aarescalvo/trz5
- **Issues:** https://github.com/aarescalvo/trz5/issues

---

**Sistema de Gestion Frigorifica** v3.14.1
