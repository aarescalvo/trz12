# PROPUESTA DE MEJORAS: Módulo de Facturación para Frigorífico

## 📊 ANÁLISIS DEL ESTADO ACTUAL

### ✅ Funcionalidades EXISTENTES

| Funcionalidad | Estado | Observación |
|---------------|--------|-------------|
| Crear facturas | ✅ OK | Funciona correctamente |
| Editar facturas | ✅ OK | Permite modificar items |
| Pagos parciales | ✅ OK | Modelo PagoFactura implementado |
| Detalle de items | ✅ OK | DetalleFactura con tipoProducto |
| Histórico de precios | ✅ OK | HistoricoPrecio + API |
| Estados básicos | ✅ OK | PENDIENTE, EMITIDA, PAGADA, ANULADA |
| Trazabilidad básica | ⚠️ PARCIAL | Solo tropaCodigo, garron |

### ❌ Funcionalidades FALTANTES (Requeridas AFIP/SENASA)

| Funcionalidad | Prioridad | Complejidad |
|---------------|-----------|-------------|
| Integración AFIP (CAE) | 🔴 CRÍTICA | Alta |
| Tipos de comprobante (A/B/C/E/M) | 🔴 CRÍTICA | Media |
| Puntos de venta | 🔴 CRÍTICA | Media |
| Alícuotas IVA diferenciadas | 🔴 CRÍTICA | Media |
| Retenciones/Percepciones | 🟠 ALTA | Alta |
| Notas de Crédito/Débito | 🟠 ALTA | Media |
| Remitos asociados | 🟠 ALTA | Media |
| Datos SENASA (DT-e) | 🟡 MEDIA | Alta |
| Factura E (exportación) | 🟡 MEDIA | Alta |
| Liquidación de faena | 🟡 MEDIA | Alta |
| CAEA (alto volumen) | 🟢 BAJA | Media |
| Factura de Crédito Electrónica | 🟢 BAJA | Alta |

---

## 🎯 PROPUESTA DE MEJORAS POR ETAPAS

### ETAPA 1: Cumplimiento AFIP Básico (CRÍTICO)

#### 1.1 Tipos de Comprobante
**Modelo Prisma actualizado:**
```prisma
enum TipoComprobante {
  FACTURA_A       // 01 - RI a RI
  FACTURA_B       // 06 - RI a CF/Monotributo
  FACTURA_C       // 11 - Monotributo
  FACTURA_E       // 19 - Exportación
  FACTURA_M       // 51 - Con percepciones
  NOTA_DEBITO_A   // 02
  NOTA_CREDITO_A  // 03
  NOTA_DEBITO_B   // 07
  NOTA_CREDITO_B  // 08
  NOTA_DEBITO_C   // 12
  NOTA_CREDITO_C  // 13
}

model Factura {
  // ... campos existentes ...
  
  // NUEVOS CAMPOS AFIP
  tipoComprobante   TipoComprobante @default(FACTURA_B)
  puntoVenta        Int             @default(1)
  cae               String?         // Código Autorización Electrónico
  caeVencimiento    DateTime?       // Vencimiento del CAE
  numeroAfip        Int?            // Número correlativo AFIP
  
  // Determinación automática de tipo
  clienteCondicionIva String?       // RI, CF, MT, EX (del cliente)
}
```

#### 1.2 Alícuotas IVA Diferenciadas
**Modelo:**
```prisma
enum AlicuotaIVA {
  CERO           // 0% - Exento
  DIEZ_CINCO     // 10.5% - Carnes frescas
  VEINTIUNO      // 21% - Productos elaborados
  VEINTISIETE    // 27% - Servicios especiales
}

model DetalleFactura {
  // ... campos existentes ...
  
  alicuotaIVA      AlicuotaIVA @default(DIEZ_CINCO)
  codigoIVA_AFIP   Int         @default(4)  // Código AFIP: 4=10.5%
}
```

**Lógica de determinación automática:**
```typescript
function determinarAlicuotaIVA(producto: Producto, destino: string): AlicuotaIVA {
  // Exportación = Exento
  if (destino === 'EXPORTACION') return AlicuotaIVA.CERO
  
  // Carnes frescas sin elaborar = 10.5%
  if (producto.tipo === 'CARNE_FRESCA' && !producto.elaborado) return AlicuotaIVA.DIEZ_CINCO
  
  // Fiambres, embutidos, elaborados = 21%
  if (producto.elaborado || ['FIAMBRE', 'EMBUTIDO'].includes(producto.tipo)) {
    return AlicuotaIVA.VEINTIUNO
  }
  
  // Default para servicios
  return AlicuotaIVA.VEINTIUNO
}
```

#### 1.3 Configuración AFIP
**Nuevo modelo:**
```prisma
model ConfiguracionAFIP {
  id                    String   @id @default(cuid())
  
  // Certificados
  certificadoPath       String?  // Ruta al certificado .crt
  clavePrivadaPath      String?  // Ruta a la clave privada .key
  
  // Entorno
  entorno               String   @default("testing") // testing | production
  
  // CUIT y razón social
  cuit                  String?
  razonSocial           String?
  inicioActividades     DateTime?
  
  // Puntos de venta habilitados
  puntosVenta           String?  // JSON array: [1, 2, 3]
  
  // Credenciales WSAA
  wsaaUrl               String?  // URL del WSAA
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### 1.4 Integración WSAA + WSFEv1
**Nuevo servicio:**
```typescript
// src/lib/afip/facturacion-electronica.ts

import { db } from '@/lib/db'

export class FacturacionElectronica {
  
  // Autenticación con AFIP
  async autenticar(servicio: 'wsfe' | 'wsfex'): Promise<TokenAFIP> {
    // 1. Leer certificado y clave privada
    // 2. Generar TRA (Ticket de Requerimiento de Acceso)
    // 3. Firmar con clave privada
    // 4. Enviar a WSAA
    // 5. Recibir Token y Sign
  }
  
  // Solicitar CAE para factura
  async solicitarCAE(factura: Factura): Promise<RespuestaCAE> {
    // 1. Autenticar con WSAA
    // 2. Construir请求 FECAESolicitar
    // 3. Enviar a WSFEv1
    // 4. Recibir CAE + Vencimiento
  }
  
  // Determinar tipo de comprobante según cliente
  determinarTipoComprobante(cliente: Cliente): TipoComprobante {
    if (cliente.condicionIva === 'RI') return TipoComprobante.FACTURA_A
    if (cliente.condicionIva === 'MT') return TipoComprobante.FACTURA_B
    if (cliente.condicionIva === 'CF') return TipoComprobante.FACTURA_B
    if (cliente.condicionIva === 'EX') return TipoComprobante.FACTURA_B
    return TipoComprobante.FACTURA_B
  }
}
```

---

### ETAPA 2: Retenciones y Percepciones

#### 2.1 Modelo de Tributos
```prisma
model FacturaTributo {
  id            String      @id @default(cuid())
  facturaId     String
  factura       Factura     @relation(fields: [facturaId], references: [id])
  
  // Tipo de tributo (código AFIP)
  tributoId     Int         // 1=Nacional, 7=Percep.IVA, 8=Percep.IIBB, 9=Percep.Gan
  descripcion   String
  
  // Cálculo
  baseImponible Float       @default(0)
  alicuota      Float       @default(0)
  importe       Float       @default(0)
  
  createdAt     DateTime    @default(now())
}

// Extender Factura
model Factura {
  // ... existente ...
  tributos      FacturaTributo[]
  importeTributos Float     @default(0)  // Suma de tributos
}
```

#### 2.2 Configuración de Retenciones
```prisma
model ConfiguracionRetencion {
  id              String   @id @default(cuid())
  
  tipo            String   // IVA, GANANCIAS, IIBB
  descripcion     String
  
  // Alícuotas según situación
  alicuotaProductor   Float @default(0.06)    // 6% compra a productor
  alicuotaIntermediario Float @default(0.28)  // 28% compra a intermediario
  
  // Mínimo no sujeto
  minimoNoSujeto  Float    @default(0)
  
  activo          Boolean  @default(true)
  createdAt       DateTime @default(now())
}
```

#### 2.3 Cálculo automático de retenciones
```typescript
function calcularRetenciones(factura: Factura, proveedor: Cliente): Retencion[] {
  const retenciones: Retencion[] = []
  
  // Retención de Ganancias (compra de ganado)
  if (factura.tipoComprobante === 'COMPRA_GANADO') {
    const alicuota = proveedor.esProductor ? 0.06 : 0.28
    const retencion = factura.subtotal * alicuota
    retenciones.push({
      tipo: 'GANANCIAS',
      baseImponible: factura.subtotal,
      alicuota,
      importe: retencion
    })
  }
  
  // Retención de IVA
  if (proveedor.condicionIva === 'RI') {
    const retencionIVA = factura.subtotal * 0.105 // 10.5%
    retenciones.push({
      tipo: 'IVA',
      baseImponible: factura.subtotal,
      alicuota: 0.105,
      importe: retencionIVA
    })
  }
  
  return retenciones
}
```

---

### ETAPA 3: Comprobantes Asociados

#### 3.1 Remitos
```prisma
model Remito {
  id              String   @id @default(cuid())
  numero          Int      @unique
  puntoVenta      Int      @default(1)
  
  // Origen/Destino
  direccionOrigen  String
  direccionDestino String
  
  // Fechas
  fechaEmision    DateTime @default(now())
  fechaSalida     DateTime?
  fechaLlegada    DateTime?
  
  // Transporte
  transportistaId String?
  transportista   Transportista? @relation(fields: [transportistaId], references: [id])
  dominioVehiculo String?
  choferNombre    String?
  choferDni       String?
  
  // Asociación con factura
  facturaId       String?
  factura         Factura? @relation(fields: [facturaId], references: [id])
  
  // Estado
  estado          String   @default('PENDIENTE') // PENDIENTE, EN_TRANSITO, ENTREGADO
  
  // Items del remito
  items           RemitoItem[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model RemitoItem {
  id          String   @id @default(cuid())
  remitoId    String
  remito      Remito   @relation(fields: [remitoId], references: [id])
  
  descripcion String
  cantidad    Int
  pesoKg      Float?
  
  createdAt   DateTime @default(now())
}
```

#### 3.2 Notas de Crédito/Débito
```prisma
model NotaCreditoDebito {
  id              String   @id @default(cuid())
  tipo            String   // CREDITO, DEBITO
  tipoComprobante Int      // 02, 03, 07, 08, etc.
  
  // Referencia a factura original
  facturaId       String
  factura         Factura  @relation(fields: [facturaId], references: [id])
  
  // Datos
  numero          Int
  puntoVenta      Int      @default(1)
  fecha           DateTime @default(now())
  
  // Motivo
  motivo          String   // DEVOLUCION, DESCUENTO, ERROR, etc.
  descripcion     String?
  
  // CAE
  cae             String?
  caeVencimiento  DateTime?
  
  // Totales
  subtotal        Float    @default(0)
  iva             Float    @default(0)
  total           Float    @default(0)
  
  createdAt       DateTime @default(now())
}
```

---

### ETAPA 4: Datos SENASA y Trazabilidad

#### 4.1 Extender DetalleFactura con trazabilidad
```prisma
model DetalleFactura {
  // ... campos existentes ...
  
  // Trazabilidad SENASA (NUEVOS)
  dteNumero        String?   // Documento de Tránsito electrónico
  rensaOrigen      String?   // RENSPA del establecimiento origen
  fechaFaena       DateTime? // Fecha de faena
  tropaId          String?   // ID de la tropa
  tropa            Tropa?    @relation(fields: [tropaId], references: [id])
  senasaHabilitacion String? // N° habilitación SENASA
  
  // Identificación del animal/producto
  numeroAnimal     Int?      // Número dentro de la tropa
  garron           Int?      // Número de garrón
  mediaResId       String?   // ID de media res si aplica
  mediaRes         MediaRes? @relation(fields: [mediaResId], references: [id])
  
  // Código de barras del producto
  codigoBarras     String?   // Código GTIN o interno
}
```

#### 4.2 Certificados SENASA en factura
```prisma
model FacturaCertificado {
  id              String   @id @default(cuid())
  facturaId       String
  factura         Factura  @relation(fields: [facturaId], references: [id])
  
  tipo            String   // FAENA, SANITARIO, ORIGEN, EXPORTACION
  numero          String
  fechaEmision    DateTime
  
  // Para exportación
  paisDestino     String?
  puertoDestino   String?
  permisoEmbarque String?
  
  createdAt       DateTime @default(now())
}
```

---

### ETAPA 5: Liquidación de Faena

#### 5.1 Modelo para faena de hacienda ajena
```prisma
model LiquidacionFaena {
  id              String   @id @default(cuid())
  numero          Int      @unique
  fecha           DateTime @default(now())
  
  // Cliente (dueño de la hacienda)
  clienteId       String
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  
  // Tropa faenada
  tropaId         String
  tropa           Tropa    @relation(fields: [tropaId], references: [id])
  
  // Datos de la faena
  cantidadCabezas Int
  pesoTotalVivo   Float    // KG peso vivo total
  pesoTotalFaena  Float    // KG carne obtenida
  rinde           Float    // Porcentaje de rendimiento
  
  // Valores
  precioKgVivo    Float    // Precio por KG vivo
  valorHacienda   Float    // Valor total de la hacienda
  
  // Gastos
  gastosFaena     Float    @default(0)
  gastosTransporte Float   @default(0)
  otrosGastos     Float    @default(0)
  
  // Retenciones
  retencionGanancias Float @default(0)
  retencionIVA    Float    @default(0)
  
  // Totales
  subtotal        Float    @default(0)
  totalRetenciones Float   @default(0)
  netoPagar       Float    @default(0)
  
  // Estado
  estado          String   @default('PENDIENTE') // PENDIENTE, PAGADA, ANULADA
  
  // Factura asociada
  facturaId       String?
  factura         Factura? @relation(fields: [facturaId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## 🖥️ MEJORAS EN LA INTERFAZ DE USUARIO

### Pantalla de Facturación Mejorada

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FACTURACIÓN ELECTRÓNICA                                          v3.4.0 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ Total   │ │ Pendien.│ │ Emitidas│ │ Con CAE │ │ Anuladas│            │
│ │   156   │ │    23   │ │    89   │ │    44   │ │    0    │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ NUEVA FACTURA                                                      │  │
│ ├───────────────────────────────────────────────────────────────────┤  │
│ │ Cliente: [Carnicería Don José ▼]     Condición: [RI ▼]            │  │
│ │ CUIT: 27-34567890-3                  IVA: Responsable Inscripto   │  │
│ │                                                                     │  │
│ │ Tipo Comprobante: [FACTURA A ▼]      Pto.Vta: [0001 ▼]            │  │
│ │                                                                     │  │
│ │ ────────────────────────────────────────────────────────────────  │  │
│ │ ITEMS                                                              │  │
│ │ ┌─────┬────────────────┬──────┬─────┬────────┬────────┬────────┐ │  │
│ │ │Tipo │ Descripción    │ Cant │ Unid│ P.Unit. │ % IVA  │ Subtotal│ │  │
│ │ ├─────┼────────────────┼──────┼─────┼────────┼────────┼────────┤ │  │
│ │ │MR   │ Media Res Bovin│  2   │ KG  │ 4500.00│ 10.5%  │ 9,000  │ │  │
│ │ │CD   │ Cuarto Delant. │  4   │ KG  │ 5200.00│ 10.5%  │ 20,800 │ │  │
│ │ │FI   │ Fiambre        │  10  │ KG  │ 8500.00│ 21.0%  │ 85,000 │ │  │
│ │ └─────┴────────────────┴──────┴─────┴────────┴────────┴────────┘ │  │
│ │                                              [+ Agregar Item]     │  │
│ │                                                                     │  │
│ │ ────────────────────────────────────────────────────────────────  │  │
│ │ TRAZABILIDAD SENASA                                                │  │
│ │ DT-e: [DT-2024-0001234]    Tropa: [B 2024 0045]   Fecha: [15/01]  │  │
│ │                                                                     │  │
│ │ ────────────────────────────────────────────────────────────────  │  │
│ │ TOTALES                              PERCEPCIONES/RETENCIONES      │  │
│ │ Subtotal Neto:    $114,800.00        Percep. IVA:    $3,444.00    │  │
│ │ IVA 10.5%:        $10,290.00         Percep. IIBB:   $5,740.00    │  │
│ │ IVA 21%:          $17,850.00                                        │  │
│ │ ────────────────────────           ────────────────────────────  │  │
│ │ TOTAL:           $152,124.00         Total Tributos: $9,184.00    │  │
│ │                                                                     │  │
│ │ ────────────────────────────────────────────────────────────────  │  │
│ │ [Cancelar]  [Guardar Borrador]  [Solicitar CAE a AFIP]             │  │
│ │                                                                     │  │
│ │ ✅ CAE: 71234567890123  Vence: 25/01/2024                          │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Cumplimiento AFIP Básico (2-3 semanas)
- [ ] Agregar tipos de comprobante al modelo
- [ ] Implementar puntos de venta
- [ ] Alícuotas IVA diferenciadas por producto
- [ ] Configuración AFIP (certificados, CUIT, etc.)
- [ ] Integración WSAA (autenticación)
- [ ] Integración WSFEv1 (solicitud de CAE)
- [ ] UI para seleccionar tipo comprobante

### Fase 2: Retenciones y Percepciones (1-2 semanas)
- [ ] Modelo FacturaTributo
- [ ] Configuración de retenciones
- [ ] Cálculo automático según cliente
- [ ] UI para visualizar/editar retenciones
- [ ] Reporte de retenciones practicadas

### Fase 3: Comprobantes Asociados (1-2 semanas)
- [ ] Modelo Remito
- [ ] Generación automática desde factura
- [ ] Modelo NotaCreditoDebito
- [ ] Solicitud CAE para notas
- [ ] Asociación factura-remito

### Fase 4: SENASA y Trazabilidad (1-2 semanas)
- [ ] Extender DetalleFactura con campos SENASA
- [ ] Vinculación con tropas
- [ ] Certificados de faena
- [ ] Validaciones de habilitación

### Fase 5: Liquidación de Faena (1 semana)
- [ ] Modelo LiquidacionFaena
- [ ] Cálculo de rendimiento
- [ ] Retenciones automáticas
- [ ] Generación de factura de servicio

---

## 📊 ESTIMACIÓN DE ESFUERZO

| Fase | Tiempo | Prioridad | Complejidad |
|------|--------|-----------|-------------|
| Fase 1: AFIP | 2-3 sem | 🔴 CRÍTICA | Alta |
| Fase 2: Retenciones | 1-2 sem | 🟠 ALTA | Media |
| Fase 3: Remitos/Notas | 1-2 sem | 🟠 ALTA | Media |
| Fase 4: SENASA | 1-2 sem | 🟡 MEDIA | Media |
| Fase 5: Liquidación | 1 sem | 🟡 MEDIA | Media |
| **TOTAL** | **6-10 sem** | | |

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Certificados AFIP**: Se deben obtener los certificados digitales en AFIP antes de implementar
2. **Testing obligatorio**: AFIP requiere pruebas en ambiente de homologación
3. **Backup legal**: Los comprobantes deben conservarse por 10 años
4. **Puntos de venta**: Deben estar habilitados previamente en AFIP
5. **Habilitación SENASA**: El frigorífico debe tener habilitación vigente

---

**¿Desea comenzar con la implementación de alguna fase específica?**
