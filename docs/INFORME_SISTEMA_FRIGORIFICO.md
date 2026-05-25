# INFORME COMPLETO - Sistema Frigorífico
## Análisis de Módulos y Simulación

---

## 1. FLUJO DE DATOS ENTRE MÓDULOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUJO PRINCIPAL                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. PESAJE CAMIONES                                                         │
│     ├─ Crea: PesajeCamion, Tropa, Animal[], TropaAnimalCantidad            │
│     └─ Estado inicial: RECIBIDO → EN_CORRAL (al cerrar pesaje)              │
│              ↓                                                               │
│  2. PESAJE INDIVIDUAL                                                       │
│     ├─ Crea: PesajeIndividual                                               │
│     ├─ Actualiza: Animal.pesoVivo, Animal.estado = PESADO                   │
│     └─ Actualiza: Tropa.pesoTotalIndividual, Tropa.estado = PESADO          │
│              ↓                                                               │
│  3. MOVIMIENTO DE HACIENDA                                                  │
│     ├─ Crea: MovimientoCorral                                               │
│     ├─ Actualiza: Animal.corralId                                           │
│     └─ Actualiza: Corral.stockBovinos/stockEquinos                          │
│              ↓                                                               │
│  4. LISTA DE FAENA                                                          │
│     ├─ Crea: ListaFaena, ListaFaenaTropa                                    │
│     ├─ Crea: AsignacionGarron (asocia animal a garrón)                      │
│     └─ Actualiza: Animal.estado = EN_FAENA, Tropa.estado = EN_FAENA         │
│              ↓                                                               │
│  5. ROMANEO                                                                 │
│     ├─ Crea: Romaneo, MediaRes[] (2 por animal)                             │
│     ├─ Actualiza: AsignacionGarron (tieneMediaDer/Izq, completado)          │
│     └─ Actualiza: Animal.estado = FAENADO                                   │
│              ↓                                                               │
│  6. INGRESO A CAJÓN ⚠️ (VER SECCIÓN 4)                                      │
│     ├─ Actualiza: MediaRes.camaraId                                         │
│     ├─ Crea/Actualiza: StockMediaRes                                        │
│     └─ Crea: MovimientoCamara                                               │
│              ↓                                                               │
│  7. VB ROMANEO                                                              │
│     ├─ Verifica: Romaneo (datos correctos)                                  │
│     └─ Actualiza: Romaneo.estado = CONFIRMADO                               │
│              ↓                                                               │
│  8. EXPEDICIÓN                                                              │
│     ├─ Crea: Factura, DetalleFactura                                        │
│     ├─ Actualiza: MediaRes.estado = DESPACHADO                              │
│     └─ Actualiza: StockMediaRes (descuento)                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. APIs POR MÓDULO

### 2.1 Pesaje de Camiones
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/pesaje-camion` | GET | Lista pesajes, próximo n° ticket |
| `/api/pesaje-camion` | POST | Crear pesaje + tropa + animales |
| `/api/pesaje-camion` | PUT | Actualizar tara (cerrar pesaje) |
| `/api/pesaje-camion?action=nextTropaCode` | GET | Previsualizar código de tropa |

**Modelos afectados:**
- `PesajeCamion`
- `Tropa`
- `TropaAnimalCantidad`
- `Animal`

### 2.2 Pesaje Individual
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/animales` | GET | Lista animales por tropa |
| `/api/animales` | POST | Crear animal con pesaje |
| `/api/animales` | PUT | Actualizar animal |
| `/api/animales/buscar` | GET | Buscar animal por número/tropa |

**Modelos afectados:**
- `Animal`
- `PesajeIndividual`

### 2.3 Movimiento de Hacienda
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/animales/mover` | POST | Mover animales entre corrales |
| `/api/animales/mover-cantidad` | POST | Mover cantidad sin IDs específicos |
| `/api/animales/baja` | POST | Registrar baja (muerte) |
| `/api/corrales/stock` | GET | Stock actual de corrales |
| `/api/corrales/animales` | GET | Animales en un corral |
| `/api/tropas/mover` | POST | Mover tropa completa |

**Modelos afectados:**
- `MovimientoCorral`
- `Animal`
- `Corral`

### 2.4 Lista de Faena
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/lista-faena` | GET | Listar listas de faena |
| `/api/lista-faena` | POST | Crear nueva lista |
| `/api/lista-faena` | PUT | Reabrir lista cerrada |
| `/api/lista-faena/cupos` | GET | Cupos de tropas disponibles |
| `/api/lista-faena/tropas` | GET | Tropas disponibles para faena |
| `/api/lista-faena/animales-hoy` | GET | Animales listos para hoy |
| `/api/lista-faena/asignar` | POST | Asignar animales a lista |
| `/api/lista-faena/garrones` | GET | Garrones asignados |
| `/api/lista-faena/cerrar` | POST | Cerrar lista de faena |

**Modelos afectados:**
- `ListaFaena`
- `ListaFaenaTropa`
- `AsignacionGarron`
- `Animal`

### 2.5 Romaneo
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/romaneo/pesar` | POST | Registrar peso de media res |
| `/api/romaneo/medias-dia` | GET | Medias pesadas hoy |
| `/api/romaneo/denticion` | POST | Actualizar dentición |
| `/api/romaneo/eliminar` | DELETE | Eliminar romaneo |
| `/api/romaneos` | GET | Lista de romaneos |
| `/api/romaneos-dia` | GET | Romaneos del día |

**Modelos afectados:**
- `Romaneo`
- `MediaRes`
- `AsignacionGarron`
- `StockMediaRes`
- `MovimientoCamara`

### 2.6 Ingreso a Cajón
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/ingreso-cajon` | GET | Tropas con medias pendientes de ingresar a cámara |
| `/api/ingreso-cajon?tipo=historial` | GET | Historial de ingresos |
| `/api/ingreso-cajon` | POST | Registrar ingreso a cámara |

**Modelos afectados:**
- `MediaRes`
- `StockMediaRes`
- `MovimientoCamara`

### 2.7 Stock Cámaras
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/stock-camaras` | GET | Stock actual por cámara |
| `/api/stock-camaras` | POST | Registrar movimiento |
| `/api/camaras` | GET/POST | CRUD de cámaras |

---

## 3. CÓDIGO DEL SCRIPT DE SIMULACIÓN

El script completo se encuentra en: `/scripts/simular-movimientos.ts`

**Ejecución:**
```bash
bun run scripts/simular-movimientos.ts
```

**Funcionalidades:**
1. ✅ Crea datos de prueba completos
2. ✅ Simula pesaje de camiones (crea tropa + animales)
3. ✅ Simula pesaje individual
4. ✅ Simula movimientos de hacienda
5. ✅ Simula lista de faena con asignación de garrones
6. ✅ Simula romaneo completo con medias reses
7. ✅ Simula ingreso a cámara
8. ✅ Valida consistencia de datos

---

## 4. ANÁLISIS DEL MÓDULO "INGRESO A CAJÓN"

### ¿Qué es exactamente?

**RESPUESTA: El módulo "Ingreso a Cajón" es DIFERENTE de "Ingreso a Cámara".**

#### Ingreso a Cajón (Componente actual)
- **Ubicación:** `/src/components/ingreso-cajon/index.tsx`
- **Función:** Asignación de garrones a animales antes de la faena
- **Momento:** Durante la faena, cuando los animales entran a la línea
- **Flujo:**
  1. El operador ve el próximo garrón disponible
  2. Ingresa el número de animal o busca por tropa
  3. Asigna el animal al garrón correspondiente
  4. Opcionalmente puede asignar "sin identificar"

#### Ingreso a Cámara (API actual)
- **Ubicación:** `/src/app/api/ingreso-cajon/route.ts`
- **Función:** Registrar el ingreso de medias reses a las cámaras frigoríficas
- **Momento:** Después del romaneo (pesaje de medias)
- **Flujo:**
  1. Busca romaneos con pesos registrados
  2. Verifica capacidad de cámara
  3. Genera códigos de barras para cada media
  4. Crea las MediaRes con cámara asignada
  5. Actualiza el StockMediaRes

### ⚠️ INCONSISTENCIA DETECTADA

**El nombre del módulo es confuso:**
- El componente de UI se llama "Ingreso a Cajón" pero es para asignación de garrones
- La API `/api/ingreso-cajon` es realmente para ingreso a cámara

**Recomendación:**
- Renombrar el componente a `AsignacionGarronesModule`
- Renombrar la API a `/api/ingreso-camara` o `/api/medias-res/ingreso`
- Usar "Cajón" solo para referirse al contenedor de exportación

---

## 5. ESTRUCTURA PROPUESTA: MOVIMIENTO DE CÁMARAS

El módulo de **Movimiento de Cámaras** no existe actualmente. Aquí está la propuesta completa:

### 5.1 Modelos de Datos (YA EXISTEN)

```prisma
// Ya existe en schema.prisma
model MovimientoCamara {
  id              String   @id @default(cuid())
  
  camaraOrigenId  String?
  camaraOrigen    Camara?  @relation("CamaraOrigen", fields: [camaraOrigenId], references: [id])
  camaraDestinoId String?
  camaraDestino   Camara?  @relation("CamaraDestino", fields: [camaraDestinoId], references: [id])
  
  producto        String?  // Qué se movió
  cantidad        Int?
  peso            Float?
  
  // Trazabilidad
  tropaCodigo     String?
  mediaResId      String?
  
  operadorId      String?
  operador        Operador? @relation(fields: [operadorId], references: [id])
  
  observaciones   String?
  fecha           DateTime @default(now())
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([fecha])
}

model StockMediaRes {
  id            String   @id @default(cuid())
  camaraId      String
  camara        Camara   @relation(fields: [camaraId], references: [id])
  
  tropaCodigo   String?
  especie       Especie
  
  cantidad      Int      @default(0)
  pesoTotal     Float    @default(0)
  
  fechaIngreso  DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([camaraId, tropaCodigo, especie])
}
```

### 5.2 API Propuesta

```typescript
// /api/movimiento-camaras/route.ts

// GET - Obtener stock actual y movimientos
interface StockCamaraResponse {
  camaras: {
    id: string
    nombre: string
    tipo: 'FAENA' | 'CUARTEO' | 'DEPOSITO'
    capacidad: number
    stockActual: {
      cantidad: number
      pesoTotal: number
      porEspecie: Record<string, { cantidad: number; peso: number }>
    }
    ocupacion: number // porcentaje
  }[]
  movimientosRecientes: MovimientoCamara[]
}

// POST - Registrar movimiento
interface MovimientoCamaraRequest {
  tipo: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA'
  
  // Para transferencia
  camaraOrigenId?: string
  camaraDestinoId?: string
  
  // Qué se mueve
  mediaResIds?: string[]        // IDs específicos de medias
  tropaCodigo?: string          // Por tropa
  cantidad?: number             // Cantidad a mover
  peso?: number                 // Peso (si es parcial)
  
  observaciones?: string
  operadorId: string
}
```

### 5.3 Componente Propuesto

```tsx
// /src/components/movimiento-camaras/index.tsx

interface MovimientoCamarasModuleProps {
  operador: Operador
}

// Características:
// 1. Vista de cámaras con stock actual (tipo kanban o cards)
// 2. Drag & drop para mover medias entre cámaras
// 3. Filtros por tropa, especie, fecha
// 4. Validación de capacidad antes de mover
// 5. Historial de movimientos
// 6. Alertas de stock bajo o sobrecapacidad
```

### 5.4 Funcionalidades Requeridas

| Funcionalidad | Descripción | Prioridad |
|--------------|-------------|-----------|
| Ver stock por cámara | Cantidad de medias, peso total, por tropa | Alta |
| Transferir medias | Mover entre cámaras con validación de capacidad | Alta |
| Buscar medias | Por código de barras, tropa, garrón | Alta |
| Historial movimientos | Ver todos los movimientos con filtros | Media |
| Alertas | Stock bajo, sobrecapacidad | Media |
| Impresión | Etiquetas al mover | Baja |

### 5.5 Reglas de Negocio

1. **Validación de Capacidad:**
   - Cámara tipo FAENA: capacidad en ganchos
   - Cámara tipo CUARTEO/DEPOSITO: capacidad en kg
   - No permitir movimiento si excede capacidad

2. **Trazabilidad:**
   - Mantener tropaCodigo en cada movimiento
   - Registrar mediaResId para movimientos individuales
   - Actualizar StockMediaRes en cada movimiento

3. **Estados:**
   - MediaRes.estado: EN_CAMARA → EN_CUARTEO → DESPACHADO
   - Actualizar automáticamente al mover

---

## 6. INCONSISTENCIAS ENCONTRADAS

### 6.1 Nomenclatura Confusa
| Término Actual | Debería Ser | Ubicación |
|----------------|-------------|-----------|
| Ingreso a Cajón | Asignación de Garrones | Componente UI |
| /api/ingreso-cajon | /api/ingreso-camara | API Route |

### 6.2 Estados de Tropa vs Animal
- `Tropa.estado` tiene valores: RECIBIDO, EN_CORRAL, EN_PESAJE, PESADO, LISTO_FAENA, EN_FAENA, FAENADO, DESPACHADO
- `Animal.estado` tiene valores: RECIBIDO, PESADO, EN_FAENA, FAENADO, EN_CAMARA, DESPACHADO, FALLECIDO
- **Inconsistencia:** No existe estado "EN_CAMARA" para tropa, pero sí para animal

### 6.3 Modelo Romaneo vs MediaRes
- `Romaneo` tiene `pesoMediaIzq` y `pesoMediaDer`
- `MediaRes` tiene `peso` individual
- **Redundancia:** Los datos se duplican, risk de inconsistencia si se actualizan por separado

### 6.4 Stock de Cámaras
- `StockMediaRes` se actualiza en romaneo/pesar pero no en movimientos posteriores
- **Falta:** Endpoint dedicado para actualizar stock al mover medias

### 6.5 VB Romaneo
- El componente usa datos mock (hardcoded)
- **Falta:** Integración con API real de romaneos

### 6.6 Expedición
- El componente usa datos mock
- **Falta:** Integración con MediaRes y Factura

---

## 7. SIGUIENTES PASOS RECOMENDADOS

### Alta Prioridad
1. **Renombrar módulos** para evitar confusión (Ingreso Cajón → Asignación Garrones)
2. **Crear módulo Movimiento de Cámaras** completo
3. **Integrar VB Romaneo** con API real
4. **Integrar Expedición** con API real

### Media Prioridad
5. **Unificar lógica de stock** de cámaras (centralizar en un servicio)
6. **Agregar validaciones** de capacidad en movimiento de hacienda
7. **Crear tests** para el flujo completo

### Baja Prioridad
8. **Optimizar consultas** (N+1 en algunos endpoints)
9. **Documentar APIs** con OpenAPI/Swagger
10. **Crear seed** con más variedad de datos

---

## 8. RESUMEN EJECUTIVO

| Aspecto | Estado | Observación |
|---------|--------|-------------|
| Pesaje Camiones | ✅ Completo | Funciona correctamente |
| Pesaje Individual | ✅ Completo | Funciona correctamente |
| Movimiento Hacienda | ✅ Completo | Funciona correctamente |
| Lista de Faena | ✅ Completo | Funciona correctamente |
| Romaneo | ✅ Completo | Funciona correctamente |
| Ingreso a Cajón | ⚠️ Confuso | Nombre incorrecto, es asignación de garrones |
| Ingreso a Cámara | ✅ API OK | Falta componente UI dedicado |
| VB Romaneo | ❌ Mock | Necesita integración real |
| Movimiento Cámaras | ❌ Falta | Propuesta incluida en este informe |
| Expedición | ❌ Mock | Necesita integración real |

---

*Informe generado automáticamente por análisis del sistema.*
*Fecha: ${new Date().toISOString()}*
