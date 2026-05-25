# Sistema de Gestion Frigorifica - Produccion4Z

Sistema integral para la gestion de faena, romaneo, desposte y procesamiento de carne bovina y equina. Desarrollado para frigorificos con operacion completa de Ciclo I (recepcion y faena) y Ciclo II (desposte, empaque y expedicion).

**Version:** 3.18.0 | **Ultima actualizacion:** Abril 2026

---

## Características Principales

### CICLO I - Recepcion y Faena

| Modulo | Descripcion |
|--------|-------------|
| **Pesaje Camiones** | Pesaje bruto/tara de camiones, creacion automatica de tropas y animales |
| **Pesaje Individual** | Pesaje de animales individuales con seleccion rapida de raza y tipo |
| **Movimiento de Hacienda** | Gestion de corrales, movimiento de animales entre corrales |
| **Lista de Faena** | Planificacion diaria de animales a faenar, asignacion de garrones |
| **Ingreso a Cajon** | Asignacion de garrones con control de correlatividad |
| **Romaneo** | Pesaje de medias reses con calculo automatico de rinde |
| **VB Romaneo** | Verificacion y aprobacion de romaneos por supervisor |
| **Expedicion** | Gestion de despachos de medias reses con control FIFO |

### CICLO II - Desposte, Empaque y Expedicion

| Modulo | Descripcion |
|--------|-------------|
| **Cuarteo** | Cuarteo de medias con tipos de cuarto dinamicos y calculo de merma de oreo |
| **Ingreso Desposte C2** | Ingreso de cuartos a linea de desposte con seleccion multiple |
| **Produccion / Desposte** | Produccion de cajas con control de masa en tiempo real, auto-descuento BOM |
| **Subproductos C2** | Pesaje rapido de hueso, grasa, incomestible y recortes |
| **Degradacion** | Trimming, golpeado, decomiso y aprovechamiento con reasignacion de producto |
| **Empaque** | Empaque de cajas con generacion de codigo GS1-128 y fechas de vencimiento |
| **Expedicion C2** | Despacho de cajas con pallets y control de temperatura |

### Subproductos

| Modulo | Descripcion |
|--------|-------------|
| **Menudencias** | Gestion completa de menudencias con tipos personalizados |
| **Cueros** | Control de cueros con peso y estado |
| **Rendering** | Grasa, desperdicios y fondo digestor con registro de pesaje |

### Stocks y Reportes

| Modulo | Descripcion |
|--------|-------------|
| **Stocks Corrales** | Vista de stock por corral con ocupacion |
| **Stock Camaras / Cajas** | Stock unificado de medias reses y cajas C2 por camara |
| **Planilla 01** | Planilla oficial SENASA |
| **Rindes por Tropa** | Analisis de rindes detallado por tropa |
| **Busqueda por Filtro** | Busqueda general en todo el sistema |
| **Reportes SENASA** | Generacion de reportes para SENASA |
| **Reportes SIGICA** | Generacion de reportes SIGICA (solo reportes, sin integracion real) |
| **Reportes Gerenciales** | Reportes ejecutivos con KPIs y graficos |
| **Dashboard Ejecutivo** | KPIs en tiempo real, alertas de stock critico y facturas vencidas |
| **Dashboard Financiero** | Metricas financieras, facturacion por cliente, indicadores de cobro |

### Administracion y Facturacion

| Modulo | Descripcion |
|--------|-------------|
| **Facturacion** | Facturacion completa con notas de credito/debito, cheques, arqueos |
| **Cuenta Corriente** | Cuentas corrientes por cliente con pagos y saldos |
| **Despachos** | Gestion de expediciones y remitos |
| **Tarifas y Precios** | Precios por servicio, por cliente, historicos y sugeridos |
| **Proveedores** | Gestion de proveedores con ordenes de compra |

### Trazabilidad y Calidad

| Modulo | Descripcion |
|--------|-------------|
| **Trazabilidad** | Trazabilidad completa de tropa a producto final |
| **CCIR / Declaracion Jurada** | Documentacion regulatoria |
| **Calidad - Reclamos** | Registro y seguimiento de reclamos de calidad |
| **Calidad - Novedades** | Registro de novedades de calidad |

### Configuracion del Sistema

| Modulo | Descripcion |
|--------|-------------|
| **Operadores** | Gestion de usuarios con 16 permisos individuales por modulo |
| **Productos y Subproductos** | Catalogo de productos con configuracion de precios |
| **Corrales y Camaras** | Configuracion de estructuras fisicas |
| **Balanzas y Puestos de Trabajo** | Configuracion de balanzas (serial/TCP) y puestos con impresoras |
| **Rotulos ZPL/DPL** | Diseno de etiquetas para Zebra ZT410/ZT230 y Datamax Mark II |
| **Codigo de Barras** | Configuracion de formatos de codigo de barras por tipo de producto |
| **C2 Maestros** | Rubros, tipos de cuarto, productos de desposte, BOM (Bill of Materials) |

---

## Seguridad

- **Autenticacion**: Login con usuario/password o PIN numerico
- **Rate Limiting**: Proteccion contra fuerza bruta (10 intentos / 15 min, bloqueo 5 min)
- **Autorizacion por permisos**: 16 permisos individuales asignables por operador
- **Roles**: ADMINISTRADOR (acceso completo), SUPERVISOR, OPERADOR
- **Proteccion API**: 97.8% de rutas API protegidas con verificacion de permisos
- **Middleware**: Verificacion de autenticacion y permisos en cada request
- **Auditoria**: Registro de todas las acciones criticas del sistema
- **Validacion de rol Admin**: Rutas criticas requieren rol ADMINISTRADOR

---

## Tecnologias

| Tecnologia | Version | Uso |
|------------|---------|-----|
| **Next.js** | 16 | Framework fullstack (App Router) |
| **React** | 19 | Interfaz de usuario |
| **TypeScript** | 5 | Lenguaje principal |
| **Prisma ORM** | 6 | ORM para base de datos |
| **PostgreSQL** | 16+ | Base de datos en produccion |
| **SQLite** | - | Base de datos en desarrollo |
| **Tailwind CSS** | 4 | Estilos |
| **shadcn/ui** | - | Componentes UI |
| **Zustand** | 5 | Estado global |
| **TanStack Query** | 5 | Cache y fetching de datos |
| **Recharts** | 2 | Graficos y visualizaciones |
| **Bun** | - | Runtime y gestor de paquetes |

---

## Instalacion

### Requisitos Previos

| Componente | Minimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 nucleos | 4 nucleos |
| RAM | 4 GB | 8 GB |
| Disco | 10 GB | 50 GB SSD |
| Sistema | Windows 10+ / Ubuntu 20.04+ | Windows 11 / Ubuntu 22.04 |
| Runtime | Bun 1.1+ | Ultima version |

### Instalacion con PostgreSQL (Produccion)

```bash
# 1. Clonar el repositorio
git clone https://github.com/aarescalvo/trz5.git
cd trz5

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los datos de tu PostgreSQL:
# DATABASE_URL="postgresql://usuario:password@localhost:5432/trz5"

# 4. Generar cliente Prisma y crear tablas
bun run db:generate
bun run db:push
bun run db:seed

# 5. Compilar para produccion
bun run build

# 6. Iniciar servidor
npx next start
```

### Instalacion con SQLite (Desarrollo)

```bash
# 1. Clonar e instalar
git clone https://github.com/aarescalvo/trz5.git
cd trz5
bun install

# 2. Configurar .env (SQLite por defecto)
# DATABASE_URL="file:./dev.db"

# 3. Inicializar base de datos
bun run db:generate
bun run db:push
bun run db:seed

# 4. Iniciar en modo desarrollo
bun run dev
```

### Credenciales por Defecto

| Usuario | Password | PIN | Rol |
|---------|----------|-----|-----|
| admin | admin123 | 1234 | Administrador |
| supervisor | super123 | 2222 | Supervisor |
| balanza | balanza123 | 1111 | Operador |

**IMPORTANTE:** Cambiar estas credenciales en produccion desde Configuracion > Operadores.

### Acceso

Abrir navegador en `http://localhost:3000`

---

## Instalacion en Windows (PC de Produccion)

La PC de produccion usa Windows con PowerShell. No usar `&&` en comandos, ejecutar uno por uno.

### Paso a Paso

```powershell
# 1. Abrir PowerShell como Administrador

# 2. Instalar Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# 3. Cerrar y reabrir PowerShell

# 4. Instalar Git (si no esta)
# Descargar de https://git-scm.com

# 5. Clonar repositorio
git clone https://github.com/aarescalvo/trz5.git C:\TRZ5

# 6. Entrar al directorio
cd C:\TRZ5

# 7. Instalar dependencias
bun install

# 8. Configurar .env (editar con datos de PostgreSQL)
copy .env.example .env
notepad .env

# 9. Generar cliente y crear tablas
bun run db:generate
bun run db:push
bun run db:seed

# 10. Compilar
bun run build

# 11. Iniciar servidor
npx next start
```

### Scripts .bat Disponibles

| Script | Funcion |
|--------|---------|
| `iniciar-servidor.bat` | Inicia el servidor con doble click |
| `detener-servidor.bat` | Detiene procesos bun/node |
| `actualizar-sistema.bat` | Descarga actualizaciones desde GitHub |
| `backup-sistema.bat` | Crea backup de PostgreSQL con pg_dump |

---

## Estructura del Proyecto

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # APIs REST (~314 endpoints)
│   │   ├── auth/              # Autenticacion (login, PIN, supervisor)
│   │   ├── dashboard/         # Dashboards operativos y ejecutivos
│   │   ├── dashboard-financiero/  # Dashboard financiero
│   │   ├── romaneo/           # Romaneo y pesaje de medias
│   │   ├── facturacion/       # Facturacion y cuenta corriente
│   │   ├── c2-*/              # APIs Ciclo II (desposte, empaque, expedicion)
│   │   ├── reportes*/         # Reportes SENASA, SIGICA, gerenciales
│   │   └── ...                # Demas APIs
│   ├── page.tsx               # Pagina principal (SPA)
│   ├── layout.tsx             # Layout con proveedores
│   └── globals.css            # Estilos globales
├── components/                 # Componentes React
│   ├── ui/                    # Componentes base (shadcn/ui)
│   ├── pesaje-camiones/       # Modulo Pesaje Camiones
│   ├── romaneo/               # Modulo Romaneo
│   ├── facturacion/           # Modulo Facturacion
│   ├── dashboard-financiero/  # Dashboard Financiero
│   ├── cuarteo/               # Modulo Cuarteo C2
│   ├── c2-produccion/         # Produccion C2
│   ├── c2-subproductos/       # Subproductos C2
│   ├── empaque/               # Empaque C2
│   ├── expedicion-unificada/  # Expedicion unificada
│   ├── stock-unificada/       # Stock unificado
│   ├── config-operadores/     # Gestion de operadores y permisos
│   ├── config-rotulos/        # Configuracion de rotulos ZPL/DPL
│   ├── config-balanzas/       # Configuracion de balanzas y puestos
│   └── ...                    # Demas modulos
├── lib/                        # Utilidades y configuracion
│   ├── db.ts                  # Cliente Prisma
│   ├── auth-helpers.ts        # Funciones de autenticacion y permisos
│   ├── rate-limit.ts          # Rate limiting contra fuerza bruta
│   ├── cache.ts               # Sistema de cache en memoria
│   ├── logger.ts              # Logs estructurados
│   ├── backup.ts              # Backup automatico
│   └── validations.ts         # Esquemas de validacion Zod
├── stores/                     # Estado global (Zustand)
│   └── appStore.ts            # Store principal
├── prisma/                     # Base de datos
│   ├── schema.prisma          # Esquema (50+ modelos)
│   └── seed.ts                # Datos iniciales
└── types/                      # Tipos TypeScript
```

---

## Permisos del Sistema (16 modulos)

| Permiso | Modulo | Grupo |
|---------|--------|-------|
| `puedePesajeCamiones` | Pesaje Camiones | CICLO I |
| `puedePesajeIndividual` | Pesaje Individual | CICLO I |
| `puedeMovimientoHacienda` | Movimiento de Hacienda | CICLO I |
| `puedeListaFaena` | Lista de Faena | CICLO I |
| `puedeIngresoCajon` | Ingreso a Cajon | CICLO I |
| `puedeRomaneo` | Romaneo / VB Romaneo | CICLO I |
| `puedeMenudencias` | Menudencias | Subproductos |
| `puedeStock` | Stock, Camaras, Trazabilidad | Stock |
| `puedeCuarteo` | Cuarteo | CICLO II |
| `puedeDesposte` | Desposte, Produccion C2 | CICLO II |
| `puedeEmpaque` | Empaque | CICLO II |
| `puedeExpedicionC2` | Expedicion C2, Pallets | CICLO II |
| `puedeReportes` | Reportes, Dashboard, SENASA, SIGICA | Reportes |
| `puedeDashboardFinanciero` | Dashboard Financiero | Reportes |
| `puedeFacturacion` | Facturacion, Precios, Clientes | Administracion |
| `puedeConfiguracion` | Configuracion general, Operadores | Sistema |

> El rol ADMINISTRADOR tiene acceso automatico a todos los modulos sin necesidad de permisos individuales.

---

## Comandos Disponibles

| Comando | Descripcion |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo (puerto 3000) |
| `bun run build` | Compilar para produccion |
| `bun run start` | Iniciar servidor de produccion (standalone) |
| `bun run db:generate` | Generar cliente Prisma |
| `bun run db:push` | Sincronizar esquema con base de datos |
| `bun run db:seed` | Cargar datos iniciales |
| `bun run db:migrate` | Crear migracion |
| `bun run lint` | Verificar codigo con ESLint |

---

## Actualizacion del Sistema

```bash
# Desde la raiz del proyecto
git pull origin master
bun install
bun run db:generate
bun run db:push
bun run build

# Luego reiniciar el servidor
```

En Windows:
```powershell
git pull origin master
bun install
bun run db:generate
bun run db:push
bun run build
npx next start
```

---

## Backup

### Con pg_dump (PostgreSQL)

```bash
# Backup manual
pg_dump -U usuario -d trz5 -F c -f backup_$(date +%Y%m%d).backup

# Restaurar
pg_restore -U usuario -d trz5 backup_20260417.backup
```

### Desde la API del sistema

El sistema incluye una API de backup accesible solo para administradores:
- `GET /api/sistema/backup` - Listar backups
- `POST /api/sistema/backup` - Crear backup manual
- `PUT /api/sistema/backup` - Restaurar backup

---

## Licencia

Uso interno - Sistema de Gestion Frigorifica
