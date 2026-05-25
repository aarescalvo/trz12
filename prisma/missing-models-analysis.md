# Missing Prisma Models Analysis

## Executive Summary

**79 models were listed as "missing."** After thorough analysis of the existing schema (`schema.prisma`), **72 of the 79 already exist** under their PascalCase names. Prisma Client converts PascalCase model names to camelCase, so `db.arqueoCaja` maps to model `ArqueoCaja` in the schema.

**Only 7 models are truly missing** from the schema and need to be added. Additionally, 1 implicit model (`LineaAsientoContable`) is referenced but has no standalone model definition.

---

## Section 1: Models That Already Exist (72 models)

These models are already defined in `schema.prisma`. The codebase references them in camelCase (Prisma Client convention), but they exist in PascalCase in the schema.

| # | camelCase (code reference) | PascalCase (schema model) | Schema Line ~ |
|---|---|---|---|
| 1 | `aFIPConfig` | `AFIPConfig` | 4651 |
| 2 | `arqueoCaja` | `ArqueoCaja` | 3738 |
| 3 | `articulo` | `Articulo` | 3846 |
| 4 | `autorizacionReporte` | `AutorizacionReporte` | 4626 |
| 5 | `balanceFaena` | `BalanceFaena` | 4418 |
| 6 | `balanceInsumos` | `BalanceInsumos` | 5036 |
| 7 | `caja` | `Caja` | 3692 |
| 8 | `categoriaInsumo` | `CategoriaInsumo` | 3835 |
| 9 | `centroCosto` | `CentroCosto` | 4957 |
| 10 | `cheque` | `Cheque` | 3667 |
| 11 | `conciliacionBancaria` | `ConciliacionBancaria` | 4369 |
| 12 | `configBalanza` | `ConfigBalanza` | 3924 |
| 13 | `configuracionBackup` | `ConfiguracionBackup` | 3958 |
| 14 | `configuracionRotulo` | `ConfiguracionRotulo` | 3989 |
| 15 | `configuracionSIGICA` | `ConfiguracionSIGICA` | 4661 |
| 16 | `configuracionSeguridad` | `ConfiguracionSeguridad` | 4503 |
| 17 | `consumoCentro` | `ConsumoCentro` | 4979 |
| 18 | `consumoInsumo` | `ConsumoInsumo` | 4996 |
| 19 | `costoFaena` | `CostoFaena` | 4905 |
| 20 | `costoFaenaAplicado` | `CostoFaenaAplicado` | 4925 |
| 21 | `cotizacion` | `Cotizacion` | 3614 |
| 22 | `cuentaBancaria` | `CuentaBancaria` | 3646 |
| 23 | `deposito` | `Deposito` | 3762 |
| 24 | `detalleConciliacion` | `DetalleConciliacion` | 4394 |
| 25 | `detalleInventario` | `DetalleInventario` | 4883 |
| 26 | `detalleNotaCredito` | `DetalleNotaCredito` | 4343 |
| 27 | `detalleNotaDebito` | `DetalleNotaDebito` | 4355 |
| 28 | `detalleOrdenCompra` | `DetalleOrdenCompra` | 4208 |
| 29 | `envioSIGICA` | `EnvioSIGICA` | 4674 |
| 30 | `flujoFaena` | `FlujoFaena` | 4444 |
| 31 | `formaPago` | `FormaPago` | 3628 |
| 32 | `historialBackup` | `HistorialBackup` | 3975 |
| 33 | `historicoPrecio` | `HistoricoPrecio` | 4163 |
| 34 | `historicoPrecioProducto` | `HistoricoPrecioProducto` | 4107 |
| 35 | `impresora` | `Impresora` | 3885 |
| 36 | `indicador` | `Indicador` | 4464 |
| 37 | `ingresoTercero` | `IngresoTercero` | 4717 |
| 38 | `intentoLogin` | `IntentoLogin` | 4544 |
| 39 | `inventario` | `Inventario` | 4860 |
| 40 | `ipBloqueada` | `IpBloqueada` | 4557 |
| 41 | `moneda` | `Moneda` | 3601 |
| 42 | `movimientoCaja` | `MovimientoCaja` | 3707 |
| 43 | `movimientoInsumo` | `MovimientoInsumo` | 3804 |
| 44 | `notaCredito` | `NotaCredito` | 4289 |
| 45 | `notaDebito` | `NotaDebito` | 4316 |
| 46 | `novedadCalidad` | `NovedadCalidad` | 4599 |
| 47 | `observacionUsuario` | `ObservacionUsuario` | 4009 |
| 48 | `ordenCarga` | `OrdenCarga` | 5081 |
| 49 | `ordenCompra` | `OrdenCompra` | 4182 |
| 50 | `pago` | `Pago` | 4261 |
| 51 | `pesajeInterno` | `PesajeInterno` | 4745 |
| 52 | `precioCliente` | `PrecioCliente` | 4126 |
| 53 | `precioRendering` | `PrecioRendering` | 4145 |
| 54 | `presupuestoCentro` | `PresupuestoCentro` | 5021 |
| 55 | `productoVendible` | `ProductoVendible` | 4050 |
| 56 | `productorConsignatario` | `ProductorConsignatario` | 4030 |
| 57 | `raza` | `Raza` | 3860 |
| 58 | `recepcionCompra` | `RecepcionCompra` | 4226 |
| 59 | `rendimientoHistorico` | `RendimientoHistorico` | 4837 |
| 60 | `reporteAutomatico` | `ReporteAutomatico` | 4817 |
| 61 | `resumenCostosFaena` | `ResumenCostosFaena` | 4942 |
| 62 | `rindeFaena` | `RindeFaena` | 4767 |
| 63 | `sesion` | `Sesion` | 4526 |
| 64 | `sesionRomaneo` | `SesionRomaneo` | 4798 |
| 65 | `stockCamara` | `StockCamara` | 5103 |
| 66 | `stockCamaraSIGICA` | `StockCamaraSIGICA` | 4698 |
| 67 | `stockInsumo` | `StockInsumo` | 3782 |
| 68 | `subproductoIncomestible` | `SubproductoIncomestible` | 5055 |
| 69 | `terminal` | `Terminal` | 3907 |
| 70 | `tipoTrabajo` | `TipoTrabajo` | 3872 |
| 71 | `usuarioCalidad` | `UsuarioCalidad` | 4574 |
| 72 | `valorIndicador` | `ValorIndicador` | 4484 |

---

## Section 2: Truly Missing Models (7 models + 1 implicit)

### 2.1 ActividadOperador

**Source:** `src/lib/actividad.ts`

**Fields inferred from `db.actividadOperador.create()`:**
- `operadorId` (String, required) — FK to Operador
- `tipo` (String, required) — LOGIN, LOGOUT, CREAR, MODIFICAR, ELIMINAR, etc.
- `modulo` (String, required) — auth, dashboard, pesajeCamiones, romaneo, etc.
- `descripcion` (String, required)
- `entidad` (String, optional)
- `entidadId` (String, optional)
- `datos` (String/Json, optional) — JSON stringified
- `ip` (String, optional)
- `userAgent` (String, optional)
- `sessionId` (String, optional)

```prisma
// ==================== ACTIVIDAD DE OPERADORES ====================

model ActividadOperador {
  id            String   @id @default(cuid())
  operadorId    String?
  operador      Operador? @relation(fields: [operadorId], references: [id])
  tipo          String                // LOGIN, LOGOUT, CREAR, MODIFICAR, ELIMINAR, etc.
  modulo        String                // auth, dashboard, pesajeCamiones, romaneo, etc.
  descripcion   String
  entidad       String?
  entidadId     String?
  datos         String?               // JSON stringified
  ip            String?
  userAgent     String?
  sessionId     String?
  fecha         DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([operadorId])
  @@index([tipo])
  @@index([modulo])
  @@index([fecha])
}
```

---

### 2.2 AsientoContable + LineaAsientoContable (implicit)

**Source:** `src/app/api/contabilidad/asientos/route.ts`

**AsientoContable fields:**
- `tipoOrigen` (String, optional, default "AJUSTE")
- `origenId` (String, optional)
- `origenDetalle` (String, optional)
- `descripcion` (String, required)
- `estado` (String, optional) — filtered in GET
- `fecha` (DateTime, optional) — filtered in GET
- `lineas` (relation to LineaAsientoContable)

**LineaAsientoContable fields** (created inline):
- `codigoCuenta` (String)
- `nombreCuenta` (String)
- `debe` (Float)
- `haber` (Float)
- `auxiliarCodigo` (String, optional)
- `auxiliarNombre` (String, optional)
- `orden` (Int)

```prisma
// ==================== CONTABILIDAD ====================

model AsientoContable {
  id              String   @id @default(cuid())
  tipoOrigen      String   @default("AJUSTE")  // AJUSTE, FACTURA, PAGO, etc.
  origenId        String?
  origenDetalle   String?
  descripcion     String
  estado          String   @default("BORRADOR")  // BORRADOR, CONFIRMADO, ANULADO
  fecha           DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  lineas          LineaAsientoContable[]

  @@index([estado])
  @@index([fecha])
  @@index([tipoOrigen])
}

model LineaAsientoContable {
  id                String            @id @default(cuid())
  asientoContableId String
  asientoContable   AsientoContable   @relation(fields: [asientoContableId], references: [id], onDelete: Cascade)
  codigoCuenta      String
  nombreCuenta      String
  debe              Float             @default(0)
  haber             Float             @default(0)
  auxiliarCodigo    String?
  auxiliarNombre    String?
  orden             Int               @default(0)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([asientoContableId])
}
```

---

### 2.3 ConfiguracionBalanza

**Source:** `src/app/api/balanza/configuracion/route.ts`

**Note:** This is different from the existing `ConfigBalanza` model. The code uses `db.configuracionBalanza` (not `db.configBalanza`). The `ConfigBalanza` model exists at line 3924, but the code references `configuracionBalanza`.

**Fields inferred:**
- `nombre` (String, required)
- `puerto` (String, default "COM1")
- `baudRate` (Int, default 9600)
- `dataBits` (Int, default 8)
- `parity` (String, default "none")
- `stopBits` (Int, default 1)
- `protocolo` (String, default "TOLEDO")
- `activa` (Boolean, default true)
- `ultimoTest` (DateTime, optional) — set when testing connection

```prisma
// ==================== CONFIGURACIÓN BALANZA (legacy) ====================

model ConfiguracionBalanza {
  id              String   @id @default(cuid())
  nombre          String   @default("Balanza Principal")
  puerto          String   @default("COM1")
  baudRate        Int      @default(9600)
  dataBits        Int      @default(8)
  parity          String   @default("none")
  stopBits        Int      @default(1)
  protocolo       String   @default("TOLEDO")
  activa          Boolean  @default(true)
  ultimoTest      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([activa])
}
```

**⚠️ IMPORTANT NOTE:** This model overlaps significantly with the existing `ConfigBalanza` model (line 3924). Consider renaming `ConfigBalanza` to `ConfiguracionBalanza` OR updating the API routes to use `db.configBalanza` instead. Recommended: rename the existing model.

---

### 2.4 FacturaServicio

**Source:** `src/app/api/facturacion/detalle/route.ts`, `src/app/api/facturacion/resumen/route.ts`

**Note:** This is a separate billing model for faena services, distinct from the existing `Factura` model. It tracks service-specific billing (faena service, despostada service, menudencia sales, etc.).

**Fields inferred:**
- `clienteId` (String, required) — FK to Cliente
- `cliente` (relation to Cliente, included with `tipoFacturacion`)
- `fecha` (DateTime, required)
- `numero` (String, optional)
- `estado` (String, default "PENDIENTE") — PENDIENTE, PAGADA, ANULADA
- `subtotal` (Float, default 0)
- `iva` (Float, default 0)
- `total` (Float, default 0)
- `detalles` (relation to DetalleFacturaServicio)
- `operadorId` (String, optional) — likely present

```prisma
// ==================== FACTURA SERVICIO FAENA ====================

model FacturaServicio {
  id              String   @id @default(cuid())
  numero          String?
  clienteId       String
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  fecha           DateTime @default(now())
  estado          String   @default("PENDIENTE")  // PENDIENTE, PAGADA, ANULADA
  subtotal        Float    @default(0)
  iva             Float    @default(0)
  total           Float    @default(0)
  observaciones   String?
  operadorId      String?
  operador        Operador? @relation(fields: [operadorId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  detalles        DetalleFacturaServicio[]

  @@index([clienteId])
  @@index([estado])
  @@index([fecha])
}
```

---

### 2.5 DetalleFacturaServicio

**Source:** `src/app/api/facturacion/detalle/route.ts`

**Fields inferred from `db.detalleFacturaServicio.create()`:**
- `facturaId` (String, required) — FK to FacturaServicio
- `factura` (relation to FacturaServicio)
- `tropaId` (String, optional) — FK to Tropa
- `tropa` (relation to Tropa)
- `tropaCodigo` (String, optional)
- `cantidadAnimales` (Int)
- `kgGancho` (Float, default 0)
- `servicioFaena` (Float, default 0)
- `servicioDespostada` (Float, default 0)
- `ventaMenudencia` (Float, default 0)
- `ventaHueso` (Float, default 0)
- `ventaGrasa` (Float, default 0)
- `ventaCuero` (Float, default 0)
- `subtotal` (Float, default 0)

```prisma
// ==================== DETALLE FACTURA SERVICIO ====================

model DetalleFacturaServicio {
  id                  String            @id @default(cuid())
  facturaId           String
  factura             FacturaServicio   @relation(fields: [facturaId], references: [id], onDelete: Cascade)
  tropaId             String?
  tropa               Tropa?            @relation(fields: [tropaId], references: [id])
  tropaCodigo         String?
  cantidadAnimales    Int               @default(0)
  kgGancho            Float             @default(0)
  servicioFaena       Float             @default(0)
  servicioDespostada  Float             @default(0)
  ventaMenudencia     Float             @default(0)
  ventaHueso          Float             @default(0)
  ventaGrasa          Float             @default(0)
  ventaCuero          Float             @default(0)
  subtotal            Float             @default(0)
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([facturaId])
  @@index([tropaId])
  @@unique([tropaId], name: "detalleFacturaServicio_tropa_unique")
}
```

---

### 2.6 GarronAsignado

**Source:** `src/app/api/admin/exportar/route.ts`

**Note:** This is referenced in export as `db.garronAsignado.findMany()`. It may be an alias for `AsignacionGarron` or a simplified view. Based on the existing `AsignacionGarron` model, this likely needs the same fields. However, since the code references it by a different name, a separate model is needed.

**Fields inferred from existing `AsignacionGarron` pattern:**
- `listaFaenaId` (String, optional)
- `garron` (Int)
- `animalId` (String, optional, unique)
- `tropaCodigo` (String, optional)
- `animalNumero` (Int, optional)
- `tipoAnimal` (String, optional)
- `pesoVivo` (Float, optional)
- `completado` (Boolean, default false)
- `horaIngreso` (DateTime, default now)
- `operadorId` (String, optional)

```prisma
// ==================== GARRÓN ASIGNADO (export) ====================
// Aliases the data from AsignacionGarron for export/legacy compatibility
// Consider using a view or updating export code to use AsignacionGarron directly

model GarronAsignado {
  id              String   @id @default(cuid())
  listaFaenaId    String?
  garron          Int
  animalId        String?  @unique
  tropaCodigo     String?
  animalNumero    Int?
  tipoAnimal      String?
  pesoVivo        Float?
  completado      Boolean  @default(false)
  horaIngreso     DateTime @default(now())
  operadorId      String?
  fecha           DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([garron])
  @@index([horaIngreso])
}
```

**⚠️ IMPORTANT NOTE:** This model is very similar to `AsignacionGarron` (line 773). The recommended approach is to update `src/app/api/admin/exportar/route.ts` to use `db.asignacionGarron.findMany()` instead of `db.garronAsignado.findMany()`. If that's not feasible, keep this model.

---

### 2.7 PlanCuenta

**Source:** `src/app/api/contabilidad/plan-cuentas/route.ts`

**Fields inferred:**
- `codigo` (String, required)
- `nombre` (String, required)
- `tipo` (String, required) — ACTIVO, PASIVO, PATRIMONIO, RESULTADO
- `imputable` (Boolean, default true)
- `padreId` (String, optional) — self-referencing for hierarchy
- `activo` (Boolean, default true) — used in WHERE filter

```prisma
// ==================== PLAN DE CUENTAS CONTABLE ====================

model PlanCuenta {
  id            String      @id @default(cuid())
  codigo        String
  nombre        String
  tipo          String      // ACTIVO, PASIVO, PATRIMONIO, RESULTADO
  imputable     Boolean     @default(true)
  activo        Boolean     @default(true)
  padreId       String?
  padre         PlanCuenta? @relation("PlanCuentaJerarquia", fields: [padreId], references: [id])
  hijos         PlanCuenta[] @relation("PlanCuentaJerarquia")

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([codigo])
  @@index([tipo])
  @@index([padreId])
  @@index([activo])
}
```

---

## Section 3: Complete Schema Blocks to Append

Below is the combined block of all 8 new models (7 missing + 1 implicit `LineaAsientoContable`). Copy and append this to `prisma/schema.prisma`:

```prisma
// ====================================================================================
// MISSING MODELS — Generated from codebase analysis
// These models are referenced in API routes but were missing from the schema.
// ====================================================================================

// ==================== ACTIVIDAD DE OPERADORES ====================

model ActividadOperador {
  id            String   @id @default(cuid())
  operadorId    String?
  operador      Operador? @relation(fields: [operadorId], references: [id])
  tipo          String                // LOGIN, LOGOUT, CREAR, MODIFICAR, ELIMINAR, etc.
  modulo        String                // auth, dashboard, pesajeCamiones, romaneo, etc.
  descripcion   String
  entidad       String?
  entidadId     String?
  datos         String?               // JSON stringified
  ip            String?
  userAgent     String?
  sessionId     String?
  fecha         DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([operadorId])
  @@index([tipo])
  @@index([modulo])
  @@index([fecha])
}

// ==================== CONTABILIDAD ====================

model AsientoContable {
  id              String   @id @default(cuid())
  tipoOrigen      String   @default("AJUSTE")  // AJUSTE, FACTURA, PAGO, etc.
  origenId        String?
  origenDetalle   String?
  descripcion     String
  estado          String   @default("BORRADOR")  // BORRADOR, CONFIRMADO, ANULADO
  fecha           DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  lineas          LineaAsientoContable[]

  @@index([estado])
  @@index([fecha])
  @@index([tipoOrigen])
}

model LineaAsientoContable {
  id                String            @id @default(cuid())
  asientoContableId String
  asientoContable   AsientoContable   @relation(fields: [asientoContableId], references: [id], onDelete: Cascade)
  codigoCuenta      String
  nombreCuenta      String
  debe              Float             @default(0)
  haber             Float             @default(0)
  auxiliarCodigo    String?
  auxiliarNombre    String?
  orden             Int               @default(0)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([asientoContableId])
}

// ==================== PLAN DE CUENTAS CONTABLE ====================

model PlanCuenta {
  id            String      @id @default(cuid())
  codigo        String
  nombre        String
  tipo          String      // ACTIVO, PASIVO, PATRIMONIO, RESULTADO
  imputable     Boolean     @default(true)
  activo        Boolean     @default(true)
  padreId       String?
  padre         PlanCuenta? @relation("PlanCuentaJerarquia", fields: [padreId], references: [id])
  hijos         PlanCuenta[] @relation("PlanCuentaJerarquia")

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([codigo])
  @@index([tipo])
  @@index([padreId])
  @@index([activo])
}

// ==================== CONFIGURACIÓN BALANZA (legacy API) ====================

model ConfiguracionBalanza {
  id              String   @id @default(cuid())
  nombre          String   @default("Balanza Principal")
  puerto          String   @default("COM1")
  baudRate        Int      @default(9600)
  dataBits        Int      @default(8)
  parity          String   @default("none")
  stopBits        Int      @default(1)
  protocolo       String   @default("TOLEDO")
  activa          Boolean  @default(true)
  ultimoTest      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([activa])
}

// ==================== FACTURA SERVICIO FAENA ====================

model FacturaServicio {
  id              String   @id @default(cuid())
  numero          String?
  clienteId       String
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  fecha           DateTime @default(now())
  estado          String   @default("PENDIENTE")  // PENDIENTE, PAGADA, ANULADA
  subtotal        Float    @default(0)
  iva             Float    @default(0)
  total           Float    @default(0)
  observaciones   String?
  operadorId      String?
  operador        Operador? @relation(fields: [operadorId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  detalles        DetalleFacturaServicio[]

  @@index([clienteId])
  @@index([estado])
  @@index([fecha])
}

// ==================== DETALLE FACTURA SERVICIO ====================

model DetalleFacturaServicio {
  id                  String            @id @default(cuid())
  facturaId           String
  factura             FacturaServicio   @relation(fields: [facturaId], references: [id], onDelete: Cascade)
  tropaId             String?
  tropa               Tropa?            @relation(fields: [tropaId], references: [id])
  tropaCodigo         String?
  cantidadAnimales    Int               @default(0)
  kgGancho            Float             @default(0)
  servicioFaena       Float             @default(0)
  servicioDespostada  Float             @default(0)
  ventaMenudencia     Float             @default(0)
  ventaHueso          Float             @default(0)
  ventaGrasa          Float             @default(0)
  ventaCuero          Float             @default(0)
  subtotal            Float             @default(0)
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([facturaId])
  @@index([tropaId])
  @@unique([tropaId], name: "detalleFacturaServicio_tropa_unique")
}

// ==================== GARRÓN ASIGNADO (export view) ====================

model GarronAsignado {
  id              String   @id @default(cuid())
  listaFaenaId    String?
  garron          Int
  animalId        String?  @unique
  tropaCodigo     String?
  animalNumero    Int?
  tipoAnimal      String?
  pesoVivo        Float?
  completado      Boolean  @default(false)
  horaIngreso     DateTime @default(now())
  operadorId      String?
  fecha           DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([garron])
  @@index([horaIngreso])
}
```

---

## Section 4: Required Changes to Existing Models

### 4.1 Cliente model — add relation fields for FacturaServicio

The `FacturaServicio` model references `Cliente` and uses `tipoFacturacion` field from it. This field does NOT exist on the current `Cliente` model. Either:
- Add `tipoFacturacion String?` to the `Cliente` model, OR
- Remove that field reference from the API code

### 4.2 Operador model — add reverse relations

Add these reverse relations to the existing `Operador` model:

```prisma
  actividades         ActividadOperador[]
  facturasServicio    FacturaServicio[]
```

### 4.3 Tropa model — add reverse relation

Add this reverse relation to the existing `Tropa` model:

```prisma
  detallesFacturaServicio  DetalleFacturaServicio[]
```

### 4.4 ConfigBalanza vs ConfiguracionBalanza (RECOMMENDATION)

**Two models exist with similar purpose:**
- `ConfigBalanza` (line 3924) — full-featured balanza config
- `ConfiguracionBalanza` (missing, used by `src/app/api/balanza/configuracion/route.ts` and `src/app/api/balanza/lectura/route.ts`)

**Recommendation:** Rename `ConfigBalanza` to `ConfiguracionBalanza` in the schema and update any code referencing `db.configBalanza`. This eliminates the duplicate.

---

## Section 5: Summary

| Category | Count | Action |
|---|---|---|
| Already exist (camelCase→PascalCase) | 72 | No action needed |
| Truly missing models | 7 | Add to schema |
| Implicit related model (LineaAsientoContable) | 1 | Add to schema |
| Duplicate models to consolidate | 1 (ConfigBalanza ↔ ConfiguracionBalanza) | Rename recommended |
| Existing models needing new relations | 3 (Operador, Cliente, Tropa) | Add reverse relation fields |

**Total new models to add: 8**
**Total new relation fields on existing models: ~4**
