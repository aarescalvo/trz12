# 📖 PROMPT AI - SOLEMAR ALIMENTARIA S.A.
## Sistema de Gestión Frigorífica

---

## 🏢 IDENTIDAD DEL PROYECTO

**Empresa:** Solemar Alimentaria S.A.
**Ubicación:** Argentina
**Rubro:** Frigorífico - Faena y procesamiento de carne bovina y equina
**Sistema:** ZAISOLEWEB - Sistema Integral de Gestión Frigorífica

---

## 🛠️ STACK TECNOLÓGICO

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | Next.js | 16.1.3 (App Router) |
| Lenguaje | TypeScript | 5.x |
| Base de Datos | SQLite | via Prisma ORM |
| ORM | Prisma Client | 6.19.2 |
| UI Components | shadcn/ui | New York style |
| Iconos | Lucide React | - |
| Estilos | Tailwind CSS | 4.x |
| Runtime | Bun | - |
| Puerto | 3000 | - |

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Entry point (580 líneas)
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Estilos globales
│   │   └── api/                     # API Routes (31 endpoints)
│   │       ├── auth/                # Autenticación
│   │       ├── dashboard/           # Dashboard stats
│   │       ├── tropas/              # Gestión de tropas
│   │       ├── animales/            # Gestión de animales
│   │       ├── operadores/          # Operadores del sistema
│   │       ├── clientes/            # Clientes/Productores
│   │       ├── transportistas/      # Empresas de transporte
│   │       ├── corrales/            # Corrales de hacienda
│   │       ├── camaras/             # Cámaras frigoríficas
│   │       ├── pesaje-camion/       # Pesaje de camiones
│   │       ├── lista-faena/         # Lista de faena diaria
│   │       ├── romaneo/             # Romaneo/pesaje de medias
│   │       ├── ingresreso-cajon/    # Ingreso a cajón
│   │       ├── menudencias/         # Menudencias
│   │       ├── stock-camaras/       # Stock en cámaras
│   │       ├── stock/               # Gestión de stock
│   │       ├── reportes/            # Reportes
│   │       ├── facturacion/         # Facturación
│   │       ├── ccir/                # Certificados CCIR
│   │       ├── declaracion-jurada/  # Declaraciones juradas
│   │       └── auditoria/           # Logs de auditoría
│   │
│   ├── components/
│   │   ├── ui/                      # 50+ componentes shadcn/ui
│   │   ├── pesaje-camiones/         # Módulo pesaje (modularizado)
│   │   │   ├── index.tsx            # Componente principal
│   │   │   ├── QuickAddDialog.tsx   # Diálogo agregar rápido
│   │   │   ├── TipoAnimalCounterGrid.tsx
│   │   │   ├── usePesajeCamiones.ts # Hook personalizado
│   │   │   ├── types.ts             # Tipos TypeScript
│   │   │   └── constants.ts         # Constantes
│   │   ├── romaneo/                 # Módulo Romaneo (616 líneas)
│   │   ├── lista-faena/             # Módulo Lista Faena (604 líneas)
│   │   ├── ingresreso-cajon/        # Módulo Ingreso Cajón (795 líneas)
│   │   ├── menudencias/             # Módulo Menudencias (526 líneas)
│   │   ├── stock-camaras/           # Módulo Stock Cámaras (708 líneas)
│   │   ├── reportes/                # Módulo Reportes (308 líneas)
│   │   ├── facturacion/             # Módulo Facturación (787 líneas)
│   │   ├── cumplimiento-regulatorio/
│   │   │   ├── ccir.tsx             # Certificados CCIR (745 líneas)
│   │   │   └── declaracion-jurada.tsx # DDJJ (833 líneas)
│   │   └── configuracion/           # Módulo Configuración
│   │       ├── index.tsx            # Wrapper con tabs
│   │       ├── operadores.tsx       # Gestión operadores (543 líneas)
│   │       ├── clientes.tsx         # Gestión clientes (411 líneas)
│   │       ├── transportistas.tsx   # Transportistas
│   │       ├── corrales.tsx         # Config. corrales (328 líneas)
│   │       ├── camaras.tsx          # Config. cámaras (331 líneas)
│   │       ├── tipificadores.tsx    # Tipificadores (350 líneas)
│   │       ├── productos.tsx        # Productos (564 líneas)
│   │       └── config-frigorifico.tsx # Config. empresa
│   │
│   └── lib/
│       ├── db.ts                    # Prisma client singleton
│       └── utils.ts                 # Utilidades (cn, etc.)
│
├── prisma/
│   └── schema.prisma                # Esquema de base de datos
│
├── db/
│   └── custom.db                    # Base de datos SQLite
│
├── upload/                          # Archivos subidos por usuario
│
├── worklog.md                       # Log de trabajo por sesión
├── PROMPT_AI.md                     # Este archivo
└── package.json
```

---

## 📊 MODELO DE DATOS (Prisma)

### 🔑 Entidades Principales (27 modelos)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE OPERACIÓN                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente ──┬──► Tropa ◄──┬──► Animal                           │
│            │              │                                     │
│  Transportista            │                                     │
│       │                   │                                     │
│       ▼                   ▼                                     │
│  PesajeCamion ──────► ListaFaena ──► AsignacionGarron          │
│                               │                                 │
│                               ▼                                 │
│                           Romaneo ◄─── Tipificador             │
│                               │                                 │
│                               ▼                                 │
│                          MediaRes ──► StockMediaRes            │
│                               │                                 │
│                               ▼                                 │
│                    MovimientoCamara ◄── Camara                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Modelos Detallados

#### ConfiguracionFrigorifico
```prisma
- id, razonSocial, nombreFantasia, cuit
- direccion, localidad, provincia, codigoPostal
- telefono, email, sitioWeb
- senasaNumeroHabilitacion, senasaFechaVencimiento
- logo (base64)
- emailRemitente, servidorSMTP, puertoSMTP
- usuarioSMTP, passwordSMTP, usarTLS
```

#### Operador
```prisma
- id, nombre, usuario, password, pin, rol
- email, activo
- Permisos granulares (12 flags):
  - puedePesajeCamiones, puedePesajeIndividual
  - puedeMovimientoHacienda, puedeListaFaena
  - puedeRomaneo, puedeIngresoCajon
  - puedeMenudencias, puedeStock
  - puedeReportes, puedeCCIR
  - puedeFacturacion, puedeConfiguracion
```

#### Cliente
```prisma
- id, nombre, cuit, direccion, telefono, email
- esProductor, esUsuarioFaena
- Relaciones: Tropa (productor), Tropa (usuarioFaena), Factura
```

#### Tropa (Lote de animales)
```prisma
- id, numero, codigo, codigoSimplificado
- productorId, usuarioFaenaId, especie
- dte, guia, cantidadCabezas
- corralId, estado (8 estados)
- pesoBruto, pesoTara, pesoNeto, pesoTotalIndividual
- observaciones, fechaRecepcion
- Campos de facturación:
  - kgGancho, rinde, precioServicioKg
  - montoServicioFaena, montoServicioDesposte
  - totalOperacion, fechaFaena, fechaFactura
  - fechaPago, numeroFactura, montoFactura
  - montoDepositado, estadoPago
```

#### Animal
```prisma
- id, tropaId, numero, codigo, caravana
- tipoAnimal (12 tipos), raza, pesoVivo
- estado (7 estados)
- corralId, fechaBaja, motivoBaja, pesoBaja
```

#### PesajeCamion
```prisma
- id, numero, fecha, transportistaId
- patenteCamion, patenteAcoplado, conductor
- pesoBruto, pesoTara, pesoNeto
- tipoOperacion (INGRESO/EGRESO)
- estado (ABIERTO/CERRADO/ANULADO)
- observaciones, operadorId
```

#### ListaFaena
```prisma
- id, fecha, numero
- cantidadBovinos, cantidadEquinos
- estado (ABIERTA/EN_PROCESO/CERRADA/ANULADA)
- operadorId, observaciones
```

#### Romaneo (Pesaje de medias)
```prisma
- id, garron, tropaId, tropaCodigo
- pesoDer, pesoIzq, pesoTotal
- decomisoDer, decomisoIzq, kgDecomiso
- siglaDer, siglaIzq (A=Asado, T=Trasero, D=Delantero)
- observaciones, tipificadorId, operadorId
- estado (PENDIENTE/CONFIRMADO/ANULADO)
- fecha
```

#### MediaRes
```prisma
- id, romaneoId, lado (DER/IZQ)
- peso, sigla (A/T/D)
- codigoBarras, estado
- camaraId, posicion
```

#### Camara (Cámaras frigoríficas)
```prisma
- id, nombre, tipo (FAENA/CUARTEO/DEPOSITO)
- capacidad (animales o pallets)
- temperatura, ubicacion, activa
```

#### Corral
```prisma
- id, nombre, capacidad
- stockBovinos, stockEquinos
- tipo (DESCANSO/OBSERVACION/AISLAMIENTO)
```

### Enums del Sistema

```typescript
enum Especie { BOVINO, EQUINO }

enum TipoAnimal {
  TO    // Ternero
  VA    // Vaquillona
  VQ    // Vaca
  MEJ   // Mejorador
  NO    // Novillo
  NT    // Novillito
  PO    // Potro (equino)
  MU    // Mula (equino)
  BU    // Burro (equino)
  YU    // Yegua (equino)
  GA    // Gelding (equino)
  PS    // Pony (equino)
}

enum EstadoTropa {
  RECIBIDO           // Ingresó al frigorífico
  EN_CORRAL          // En corral de descanso
  EN_OBSERVACION     // En corral de observación
  EN_FAENA           // En proceso de faena
  FAENADO            // Faena completada
  DESPOSTADO         // Despostado
  DESPACHADO         // Enviado al cliente
  ANULADO            // Anulado
}

enum EstadoListaFaena {
  ABIERTA
  EN_PROCESO
  CERRADA
  ANULADA
}

enum EstadoRomaneo {
  PENDIENTE
  CONFIRMADO
  ANULADO
}

enum TipoCamara {
  FAENA      // Medias res recién faenadas
  CUARTEO    // En proceso de cuarteo
  DEPOSITO   // Producto terminado
}

enum TipoRotulo {
  BOVINO_MEDIA_RES
  BOVINO_CUARTO
  BOVINO_CAJA
  EQUINO_MEDIA_RES
  EQUINO_CUARTO
  EQUINO_CAJA
}

enum RolOperador {
  OPERADOR
  SUPERVISOR
  ADMINISTRADOR
}
```

---

## 🔄 FLUJO DE TRABAJO OPERATIVO

### 1. RECEPCIÓN DE HACIENDA
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Cliente   │────►│  Transporte  │────►│  Pesaje     │
│  (Productor)│     │              │     │  Camión     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                        ┌───────────────────────▼──────────────────────┐
                        │ CREAR: PesajeCamion (tipo=INGRESO)           │
                        │ CREAR: Tropa con código B2026XXXX            │
                        │ CREAR: Animales según cantidad y tipo        │
                        │ ASIGNAR: Corral disponible                   │
                        │ ESTADO: Tropa → EN_CORRAL                    │
                        └──────────────────────────────────────────────┘
```

### 2. PESAJE INDIVIDUAL
```
┌─────────────┐     ┌──────────────┐
│   Tropa     │────►│ Pesaje       │
│   en Corral │     │ Individual   │
└─────────────┘     └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Actualizar   │
                    │ pesoVivo     │
                    │ por animal   │
                    └──────────────┘
```

### 3. LISTA DE FAENA
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Tropas     │────►│  Crear       │────►│  Asignar    │
│  EN_CORRAL  │     │  ListaFaena  │     │  Garrones   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                        ┌───────────────────────▼──────────────────────┐
                        │ ESTADO: Tropa → EN_FAENA                      │
                        │ CREAR: AsignacionGarron por animal            │
                        │ GARRONES: Secuenciales 001, 002, 003...       │
                        │ CERRAR: Estado → CERRADA                      │
                        └───────────────────────────────────────────────┘
```

### 4. ROMANEO (Pesaje de medias res)
```
┌──────────────────────────────────────────────────────────────────┐
│                      PROCESO DE ROMANEO                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Seleccionar Tropa en faena                                  │
│  2. Se ofrece GARRÓN secuencial (no elección del operador)      │
│  3. Pesaje en 2 ETAPAS:                                         │
│     ┌─────────────┐         ┌─────────────┐                     │
│     │  ETAPA 1    │────────►│  ETAPA 2    │                     │
│     │  MEDIA DER  │         │  MEDIA IZQ  │                     │
│     │  - KG       │         │  - KG       │                     │
│     │  - Sigla    │         │  - Sigla    │                     │
│     └─────────────┘         └─────────────┘                     │
│                                                                  │
│  4. Siglas disponibles:                                         │
│     A = Asado (costillar)                                       │
│     T = Trasero (cuartos traseros)                              │
│     D = Delantero (cuartos delanteros)                          │
│                                                                  │
│  5. Generación de 6 RÓTULOS por animal:                         │
│     ┌────────────────────────────────────────────┐              │
│     │ MEDIA DER: A-DER, T-DER, D-DER            │              │
│     │ MEDIA IZQ: A-IZQ, T-IZQ, D-IZQ            │              │
│     └────────────────────────────────────────────┘              │
│                                                                  │
│  6. Código de barras: {tropa}-{garron}-{sigla}-{lado}-{kg}      │
│     Ejemplo: B20260059-001-A-DER-80.8                           │
│                                                                  │
│  7. DECOMISO:                                                    │
│     - Checkbox por media (DER/IZQ)                              │
│     - Si decomiso total: ambas medias                           │
│     - Input manual de KG decomisados                            │
│                                                                  │
│  8. TIPIFICADOR: Único por faena, se guarda al inicio           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5. INGRESO A CAJÓN
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  MediaRes   │────►│  Seleccionar │────►│  Asignar    │
│  pendiente  │     │  Cámara      │     │  Posición   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                        ┌───────────────────────▼──────────────────────┐
                        │ ACTUALIZAR: MediaRes.camaraId, posicion      │
                        │ ACTUALIZAR: MediaRes.estado → EN_CAMARA      │
                        │ CREAR: MovimientoCamara                      │
                        │ ACTUALIZAR: StockMediaRes                    │
                        └──────────────────────────────────────────────┘
```

### 6. STOCK Y DESPACHO
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Stock      │────►│  Remito      │────►│  Despacho   │
│  en Cámara  │     │              │     │  al Cliente │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                        ┌───────────────────────▼──────────────────────┐
                        │ ACTUALIZAR: MediaRes.estado → DESPACHADO     │
                        │ CREAR: MovimientoCamara (EGRESO)             │
                        │ ACTUALIZAR: StockMediaRes (descontar)        │
                        │ ESTADO: Tropa → DESPACHADO (si completo)     │
                        └──────────────────────────────────────────────┘
```

---

## 🖨️ CÓDIGOS DE BARRAS Y RÓTULOS

### Formato de Código de Barras
```
{CODIGO_TROPA}-{GARRON}-{SIGLA}-{LADO}-{PESO}

Ejemplo: B20260059-001-A-DER-80.8

Componentes:
- B20260059: Código de tropa (B=BOVINO, E=EQUINO)
- 001: Número de garrón (3 dígitos)
- A: Sigla (A=Asado, T=Trasero, D=Delantero)
- DER: Lado (DER=Derecho, IZQ=Izquierdo)
- 80.8: Peso en kg con 1 decimal
```

### Rótulos por Animal (6 por animal completo)
```
┌────────────────────────────────────────────────────────┐
│ ANIMAL COMPLETO (ej: garrón 001)                      │
├────────────────────────────────────────────────────────┤
│ MEDIA DERECHA:                                         │
│   - Rótulo A-DER (Asado derecho)                       │
│   - Rótulo T-DER (Trasero derecho)                     │
│   - Rótulo D-DER (Delantero derecho)                   │
│                                                        │
│ MEDIA IZQUIERDA:                                       │
│   - Rótulo A-IZQ (Asado izquierdo)                     │
│   - Rótulo T-IZQ (Trasero izquierdo)                   │
│   - Rótulo D-IZQ (Delantero izquierdo)                 │
└────────────────────────────────────────────────────────┘
```

---

## 📋 MÓDULOS DEL SISTEMA

### Módulos Operativos (11)

| # | Módulo | Archivo | Líneas | Estado |
|---|--------|---------|--------|--------|
| 1 | Dashboard | page.tsx | 580 | ✅ Operativo |
| 2 | Pesaje Camiones | pesaje-camiones/index.tsx | 700 | ✅ Operativo |
| 3 | Pesaje Individual | pesaje-individual-module.tsx | - | ✅ Operativo |
| 4 | Movimiento Hacienda | movimiento-hacienda-module.tsx | - | ✅ Operativo |
| 5 | Lista de Faena | lista-faena/index.tsx | 604 | ✅ Operativo |
| 6 | Romaneo | romaneo/index.tsx | 616 | ✅ Operativo |
| 7 | Ingreso a Cajón | ingresreso-cajon/index.tsx | 795 | ✅ Operativo |
| 8 | Menudencias | menudencias/index.tsx | 526 | ✅ Operativo |
| 9 | Stock Cámaras | stock-camaras/index.tsx | 708 | ✅ Operativo |
| 10 | Reportes | reportes/index.tsx | 308 | ✅ Operativo |
| 11 | Configuración | configuracion/*.tsx | ~2800 | ✅ Operativo |

### Módulos Pendientes/En Desarrollo

| # | Módulo | Archivo | Líneas | Estado |
|---|--------|---------|--------|--------|
| 12 | Facturación | facturacion/index.tsx | 787 | ⚠️ En desarrollo |
| 13 | CCIR | ccir.tsx | 745 | ⚠️ En desarrollo |
| 14 | Declaración Jurada | declaracion-jurada.tsx | 833 | ⚠️ En desarrollo |

---

## 🔌 API ENDPOINTS (31 rutas)

### Autenticación
```
POST   /api/auth          # Login con usuario/password
DELETE /api/auth          # Logout
```

### Dashboard
```
GET    /api/dashboard     # Estadísticas del dashboard
```

### Gestión de Entidades
```
GET    /api/tropas        # Listar tropas (con filtros)
PUT    /api/tropas        # Actualizar tropa
GET    /api/tropas/[id]   # Obtener tropa específica
DELETE /api/tropas/[id]   # Eliminar tropa
POST   /api/tropas/mover  # Mover tropa entre corrales

GET    /api/animales      # Listar animales
POST   /api/animales      # Crear animal
POST   /api/animales/baja # Dar baja animal

GET    /api/operadores    # Listar operadores
POST   /api/operadores    # Crear operador
PUT    /api/operadores    # Actualizar operador

GET    /api/clientes      # Listar clientes
POST   /api/clientes      # Crear cliente
PUT    /api/clientes      # Actualizar cliente

GET    /api/transportistas # Listar transportistas
POST   /api/transportistas # Crear transportista

GET    /api/corrales      # Listar corrales
POST   /api/corrales      # Crear corral
PUT    /api/corrales      # Actualizar corral
GET    /api/corrales/stock # Stock por corral

GET    /api/camaras       # Listar cámaras
POST   /api/camaras       # Crear cámara
PUT    /api/camaras       # Actualizar cámara
```

### Operaciones
```
GET    /api/pesaje-camion # Listar pesajes
POST   /api/pesaje-camion # Crear pesaje (INGRESO/EGRESO)
PUT    /api/pesaje-camion # Actualizar pesaje

GET    /api/lista-faena   # Listar listas de faena
POST   /api/lista-faena   # Crear lista de faena
GET    /api/lista-faena/tropas # Tropas disponibles
POST   /api/lista-faena/tropas # Agregar tropa a lista
POST   /api/lista-faena/asignar # Asignar garrones
POST   /api/lista-faena/cerrar  # Cerrar lista

GET    /api/romaneo       # Listar romaneos
POST   /api/romaneo       # Crear romaneo
PUT    /api/romaneo       # Actualizar romaneo
GET    /api/romaneo/tropa # Tropas en faena con garrones

GET    /api/ingreso-cajon # Listar ingresos
POST   /api/ingreso-cajon # Crear ingreso

GET    /api/menudencias   # Listar menudencias
POST   /api/menudencias   # Registrar menudencia

GET    /api/stock         # Stock general
POST   /api/stock         # Movimiento de stock
GET    /api/stock-camaras # Stock por cámara
```

### Regulatorios y Facturación
```
GET    /api/ccir          # Listar CCIR
POST   /api/ccir          # Crear CCIR
PUT    /api/ccir          # Actualizar CCIR
DELETE /api/ccir          # Eliminar CCIR

GET    /api/declaracion-jurada # Listar DDJJ
POST   /api/declaracion-jurada # Crear DDJJ
PUT    /api/declaracion-jurada # Actualizar DDJJ
DELETE /api/declaracion-jurada # Eliminar DDJJ

GET    /api/facturacion   # Listar facturas
POST   /api/facturacion   # Crear factura
PUT    /api/facturacion   # Actualizar factura
DELETE /api/facturacion   # Eliminar factura
```

### Reportes y Auditoría
```
GET    /api/reportes      # Reportes generales
GET    /api/reportes/stock # Reporte de stock
GET    /api/reportes/rendimiento # Rendimiento
GET    /api/reportes/faena # Reporte de faena
GET    /api/reportes/produccion # Producción

GET    /api/auditoria     # Logs de auditoría
```

---

## 🏭 INFRAESTRUCTURA DEL FRIGORÍFICO

### Corrales (12 totales)
```
CORRALES DE DESCANSO (10): D1-D10
- Capacidad: 20 animales cada uno
- Total: 200 animales

CORRAL DE OBSERVACIÓN (1):
- Capacidad: 20 animales

CORRAL DE AISLAMIENTO (1):
- Capacidad: 10 animales
```

### Cámaras Frigoríficas (14 totales)
```
CÁMARAS DE FAENA (3):
- Cámara 1: 90 animales
- Cámara 2: 77 animales
- Cámara 3: 30 animales
- Total: 197 animales

CÁMARAS DE DESPOSTADA (2):
- Cámara 4: 75 animales
- Cámara 5: 75 animales
- Total: 150 animales

DEPÓSITOS (9):
- Cámara 7: 6 pallets
- Depósito 1-4: 60 pallets cada uno
- Túnel 1-2: 8 pallets cada uno
- Contenedor 1-2: 19 pallets cada uno
```

---

## 🔐 SISTEMA DE PERMISOS

### Niveles de Acceso
```typescript
enum NivelPermiso {
  NINGUNO    = 0  // Sin acceso al módulo
  OPERADOR   = 1  // Puede operar, no configurar
  SUPERVISOR = 2  // Acceso completo + auditoría
}
```

### Módulos Configurables
```typescript
const MODULOS_PERMISOS = [
  'pesajeCamiones',
  'pesajeIndividual',
  'movimientoHacienda',
  'listaFaena',
  'romaneo',
  'ingresoCajon',
  'menudencias',
  'stock',
  'reportes',
  'ccir',
  'facturacion',
  'configuracion'
];
```

### Modelo PermisoModulo
```prisma
model PermisoModulo {
  id          String   @id @default(cuid())
  operadorId  String
  modulo      String   // Nombre del módulo
  nivel       Int      @default(0) // 0=Ninguno, 1=Operador, 2=Supervisor
  operador    Operador @relation(fields: [operadorId], references: [id])
}
```

---

## 📌 CONSIDERACIONES TÉCNICAS IMPORTANTES

### Next.js 16 - Params como Promise
```typescript
// ❌ INCORRECTO (versiones anteriores)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
}

// ✅ CORRECTO (Next.js 16)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Prisma Client Singleton
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
  log: ['query'], // ⚠️ Desactivar en producción
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### Autenticación
```typescript
// Login con usuario/password
POST /api/auth
Body: { usuario: string, password: string }

// Login rápido con PIN
POST /api/auth
Body: { pin: string }

// Logout
DELETE /api/auth
```

---

## 🚨 ERRORES CONOCIDOS Y SOLUCIONES

### 1. Base de datos readonly
```
Error: attempt to write a readonly database
Solución: chmod 777 /home/z/my-project/db/custom.db
```

### 2. Cache de Next.js corrupto
```
Error: ENOENT fallback-build-manifest.json
Solución: rm -rf .next && touch next.config.ts
```

### 3. Token GitHub expirado
```
Error: Authentication failed
Solución: Generar nuevo token clásico con permiso 'repo'
```

---

## 📝 WORKFLOW DE DESARROLLO (4 TAREAS)

El usuario ha establecido un workflow obligatorio que debe ejecutarse al final de cada sesión:

```
┌────────────────────────────────────────────────────────────┐
│                    LAS 4 TAREAS                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  TAREA 1: Leer worklog                                     │
│  → Estado actual del proyecto                              │
│  → Tareas pendientes                                       │
│  → Últimos cambios realizados                              │
│                                                            │
│  TAREA 2: Investigar errores                               │
│  → Identificar causa raíz                                  │
│  → Analizar logs (dev.log)                                 │
│  → Revisar código afectado                                 │
│                                                            │
│  TAREA 3: Corregir                                         │
│  → Implementar fix                                         │
│  → Validar funcionamiento                                  │
│  → Actualizar documentación                                │
│                                                            │
│  TAREA 4: Guardar en GitHub                                │
│  → git add .                                               │
│  → git commit -m "mensaje descriptivo"                     │
│  → git push origin master                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 MEJORAS PENDIENTES

### Críticas
- [ ] Dividir `page.tsx` (580 líneas) en rutas separadas
- [ ] Modularizar componentes > 600 líneas
- [ ] Desactivar `log: ['query']` en producción

### Importantes
- [ ] Implementar paginación en APIs
- [ ] Crear componentes UI compartidos
- [ ] Extraer tipos TypeScript a directorio compartido
- [ ] Agregar React Query o SWR

### Deseables
- [ ] Lazy loading de módulos
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Tests automatizados

---

## 📞 INFORMACIÓN DE CONTACTO

**Repositorio GitHub:** https://github.com/aarescalvo/zaisoleweb

---

*Documento generado automáticamente - Última actualización: Marzo 2026*
