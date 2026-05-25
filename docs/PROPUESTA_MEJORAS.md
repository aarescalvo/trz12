# 📊 PROPUESTA DE MEJORAS - MÓDULOS ADICIONALES
## Sistema de Gestión Frigorífica - Solemar Alimentaria

---

## 📋 RESUMEN EJECUTIVO

Esta propuesta incluye los siguientes módulos para completar la gestión integral del frigorífico:

| Módulo | Estado Actual | Prioridad |
|--------|---------------|-----------|
| Facturación Avanzada | Básico | ALTA |
| Formas de Pago y Cajas | No existe | ALTA |
| Insumos y Materiales | No existe | ALTA |
| Centros de Costo | No existe | MEDIA |
| Balances y Rendimientos | No existe | ALTA |
| Stock de Materiales | No existe | ALTA |
| Consumos vs Producción | No existe | ALTA |

---

## 1. 💰 FACTURACIÓN AVANZADA

### Estado Actual
- Modelo `Factura` básico con detalles
- Estados: PENDIENTE, EMITIDA, PAGADA, ANULADA
- Sin formas de pago
- Sin centros de costo
- Sin seguimiento de cobranzas

### Mejoras Propuestas

```
┌─────────────────────────────────────────────────────────────────┐
│                    FACTURACIÓN AVANZADA                          │
├─────────────────────────────────────────────────────────────────┤
│  • Múltiples formas de pago por factura                          │
│  • Facturas de servicio de faena                                 │
│  • Facturas de venta de productos                                │
│  • Notas de crédito y débito                                     │
│  • Recibos de cobranza                                           │
│  • Cuentas corrientes por cliente                                │
│  • Centros de costo por área                                     │
│  • Facturación electrónica AFIP                                  │
│  • Impresión de comprobantes                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 📦 INSUMOS Y MATERIALES

### Modelo Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE INSUMOS                            │
├─────────────────────────────────────────────────────────────────┤
│  CATEGORÍAS:                                                     │
│  • Empaques (bolsas, film, bandejas)                            │
│  • Etiquetas (rótulos, códigos de barras)                       │
│  • Insumos de faena (cuchillos, sierras, repuestos)             │
│  • Higiene y seguridad (guantes, delantales)                    │
│  • Combustibles y lubricantes                                    │
│  • Material de oficina                                           │
│                                                                  │
│  FUNCIONALIDADES:                                                │
│  • Catálogo de insumos con proveedores                           │
│  • Stock mínimo y máximo                                         │
│  • Alertas de reposición                                         │
│  • Órdenes de compra                                             │
│  • Recepción de mercadería                                       │
│  • Control de vencimientos                                       │
│  • Trazabilidad de lotes                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Tablas Nuevas

| Tabla | Descripción |
|-------|-------------|
| `Insumo` | Catálogo de insumos/materiales |
| `CategoriaInsumo` | Categorías de clasificación |
| `StockInsumo` | Stock actual por depósito |
| `MovimientoInsumo` | Entradas y salidas |
| `OrdenCompra` | Pedidos a proveedores |
| `DetalleOrdenCompra` | Items de la orden |

---

## 3. 🏢 CENTROS DE COSTO

### Modelo Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                    CENTROS DE COSTO                              │
├─────────────────────────────────────────────────────────────────┤
│  ESTRUCTURA:                                                     │
│  • Faena (playa, romaneo, menudencias)                          │
│  • Desposte (corte, empaquetado)                                 │
│  • Cámaras (frío, almacenamiento)                               │
│  • Administración (facturación, contabilidad)                   │
│  • Logística (transporte, distribución)                          │
│  • Mantenimiento (taller, servicios)                            │
│                                                                  │
│  FUNCIONALIDADES:                                                │
│  • Asignación de costos por área                                 │
│  • Consumo de insumos por centro                                 │
│  • Horas hombre por centro                                       │
│  • Rendimiento por centro                                        │
│  • Presupuestos mensuales                                        │
│  • Desviaciones y alertas                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Tablas Nuevas

| Tabla | Descripción |
|-------|-------------|
| `CentroCosto` | Definición de centros |
| `PresupuestoCentro` | Presupuesto mensual |
| `ConsumoCentro` | Consumo real |
| `AsignacionPersonal` | Personal por centro |

---

## 4. 💵 FORMAS DE PAGO Y CAJAS

### Modelo Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE CAJAS Y PAGOS                      │
├─────────────────────────────────────────────────────────────────┤
│  FORMAS DE PAGO:                                                 │
│  • Efectivo                                                      │
│  • Cheque (diferido/al día)                                      │
│  • Transferencia bancaria                                        │
│  • Tarjeta de crédito/débito                                     │
│  • Retención                                                     │
│  • Compensación                                                  │
│                                                                  │
│  CAJAS:                                                          │
│  • Caja general                                                  │
│  • Cajas por puesto                                              │
│  • Arqueos de caja                                               │
│  • Rendiciones diarias                                           │
│                                                                  │
│  BANCOS:                                                         │
│  • Cuentas bancarias                                             │
│  • Conciliación bancaria                                         │
│  • Chequeras                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Tablas Nuevas

| Tabla | Descripción |
|-------|-------------|
| `FormaPago` | Tipos de forma de pago |
| `Caja` | Cajas de la empresa |
| `MovimientoCaja` | Entradas y salidas |
| `ArqueoCaja` | Control de caja |
| `CuentaBancaria` | Cuentas bancarias |
| `Cheque` | Gestión de cheques |
| `Pago` | Registro de pagos recibidos |
| `PagoFactura` | Aplicación de pagos a facturas |

---

## 5. 📊 BALANCES Y RENDIMIENTOS

### Modelo Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                    BALANCES Y RENDIMIENTOS                       │
├─────────────────────────────────────────────────────────────────┤
│  BALANCE DE FAENA:                                               │
│  • Peso vivo entrada                                             │
│  • Peso faena salida (medias)                                    │
│  • Rendimiento por tropa                                         │
│  • Rendimiento por tipo de animal                                │
│  • Rendimiento histórico                                         │
│                                                                  │
│  BALANCE DE INSUMOS:                                             │
│  • Consumo vs producción                                         │
│  • Costo por kg producido                                        │
│  • Eficiencia de uso                                             │
│                                                                  │
│  BALANCE FINANCIERO:                                             │
│  • Ingresos por faena                                            │
│  • Ingresos por venta                                            │
│  • Costos operativos                                             │
│  • Margen de ganancia                                            │
│                                                                  │
│  INDICADORES:                                                    │
│  • KPIs por área                                                 │
│  • Comparativos mensuales                                        │
│  • Tendencias                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Tablas Nuevas

| Tabla | Descripción |
|-------|-------------|
| `BalanceFaena` | Balance por tropa/día |
| `RendimientoHistorico` | Histórico de rendimientos |
| `BalanceInsumos` | Consumo por período |
| `Indicador` | Definición de KPIs |
| `ValorIndicador` | Valores por período |

---

## 6. 📦 STOCK DE MATERIALES

### Modelo Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                    STOCK DE MATERIALES                           │
├─────────────────────────────────────────────────────────────────┤
│  CONTROL DE STOCK:                                               │
│  • Stock por depósito                                            │
│  • Stock por lote                                                │
│  • Stock mínimo/máximo                                           │
│  • Alertas de stock bajo                                         │
│  • Valorización de inventario                                    │
│                                                                  │
│  MOVIMIENTOS:                                                    │
│  • Entradas (compras, devoluciones)                              │
│  • Salidas (consumo, pérdidas)                                   │
│  • Transferencias entre depósitos                                │
│  • Ajustes de inventario                                         │
│                                                                  │
│  AUDITORÍA:                                                      │
│  • Inventarios físicos                                           │
│  • Diferencias                                                   │
│  • Ajustes autorizados                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Tablas Nuevas

| Tabla | Descripción |
|-------|-------------|
| `Deposito` | Depósitos/almacenes |
| `StockInsumo` | Stock actual |
| `LoteInsumo` | Lotes de insumos |
| `MovimientoStock` | Movimientos de stock |
| `Inventario` | Inventarios físicos |
| `DetalleInventario` | Items del inventario |

---

## 7. 🔄 CONSUMOS VS PRODUCCIÓN

### Modelo Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSUMOS VS PRODUCCIÓN                        │
├─────────────────────────────────────────────────────────────────┤
│  CONSUMO DE INSUMOS POR PRODUCCIÓN:                              │
│  • Bolsas utilizadas por kg de producto                          │
│  • Etiquetas consumidas por faena                                │
│  • Film utilizado por corte                                      │
│  • Insumos de limpieza por área                                  │
│                                                                  │
│  ESTÁNDARES DE CONSUMO:                                          │
│  • Consumo teórico por unidad producida                          │
│  • Desviaciones                                                  │
│  • Alertas de exceso de consumo                                  │
│                                                                  │
│  COSTOS:                                                         │
│  • Costo de insumo por kg producido                              │
│  • Costo por cabeza faenada                                      │
│  • Costo por media res                                           │
│  • Comparativo con estándar                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Tablas Nuevas

| Tabla | Descripción |
|-------|-------------|
| `ConsumoProduccion` | Registro de consumo |
| `EstandarConsumo` | Consumo estándar |
| `DesviacionConsumo` | Desviaciones detectadas |

---

## 📊 DIAGRAMA DE INTEGRACIÓN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA INTEGRADO                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │ TROPAS   │───▶│ FAENA    │───▶│ ROMANEO  │───▶│ STOCK    │            │
│   └──────────┘    └──────────┘    └──────────┘    │ MEDIAS   │            │
│         │              │              │          └──────────┘            │
│         │              │              │               │                    │
│         ▼              ▼              ▼               ▼                    │
│   ┌──────────────────────────────────────────────────────────────┐        │
│   │                    BALANCE DE FAENA                           │        │
│   │  Peso Vivo → Faena → Medias → Rendimiento → Costos          │        │
│   └──────────────────────────────────────────────────────────────┘        │
│                              │                                              │
│   ┌──────────┐              │              ┌──────────┐                    │
│   │ INSUMOS  │◀─────────────┴─────────────▶│ FACTURA- │                    │
│   │ STOCK    │                             │ CIÓN     │                    │
│   └──────────┘                             └──────────┘                    │
│         │                                        │                          │
│         ▼                                        ▼                          │
│   ┌──────────────────┐                  ┌──────────────────┐              │
│   │ CENTROS DE COSTO │◀────────────────▶│ FORMAS DE PAGO   │              │
│   └──────────────────┘                  └──────────────────┘              │
│         │                                        │                          │
│         ▼                                        ▼                          │
│   ┌──────────────────────────────────────────────────────────────┐        │
│   │                    CONSUMO VS PRODUCCIÓN                      │        │
│   │   Insumos utilizados → Producción → Costos → Rendimiento     │        │
│   └──────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ MODELOS DE BASE DE DATOS A CREAR

### Resumen de Nuevos Modelos

```
1. INSUMOS Y MATERIALES
   ├── CategoriaInsumo
   ├── Insumo
   ├── Deposito
   ├── StockInsumo
   ├── LoteInsumo
   ├── MovimientoStock
   ├── OrdenCompra
   ├── DetalleOrdenCompra
   └── RecepcionCompra

2. CENTROS DE COSTO
   ├── CentroCosto
   ├── PresupuestoCentro
   ├── ConsumoCentro
   └── AsignacionPersonal

3. FORMAS DE PAGO Y CAJAS
   ├── FormaPago
   ├── Caja
   ├── MovimientoCaja
   ├── ArqueoCaja
   ├── CuentaBancaria
   ├── Cheque
   ├── Pago
   └── PagoFactura

4. BALANCES Y RENDIMIENTOS
   ├── BalanceFaena
   ├── RendimientoHistorico
   ├── BalanceInsumos
   ├── Indicador
   └── ValorIndicador

5. CONSUMOS VS PRODUCCIÓN
   ├── ConsumoProduccion
   ├── EstandarConsumo
   └── DesviacionConsumo

6. INVENTARIOS
   ├── Inventario
   └── DetalleInventario

7. NOTAS DE CRÉDITO/DÉBITO
   ├── NotaCredito
   ├── NotaDebito
   └── DetalleNota
```

---

## ✅ PRÓXIMOS PASOS

1. ~~**Aprobar modelo de datos** - Revisar y validar los modelos propuestos~~ ✅ COMPLETADO
2. ~~**Implementar modelos** - Crear en schema.prisma~~ ✅ COMPLETADO
3. ~~**Ejecutar migración** - Aplicar cambios a la base de datos~~ ✅ COMPLETADO
4. **Crear APIs** - Endpoints para cada módulo ⏳ PENDIENTE
5. **Desarrollar interfaces** - Componentes de UI ⏳ PENDIENTE
6. **Integrar con sistema actual** - Conectar con módulos existentes ⏳ PENDIENTE

---

## 📊 ESTADO DE IMPLEMENTACIÓN

| Módulo | Modelos | Base de Datos | API | UI |
|--------|---------|---------------|-----|-----|
| Insumos y Materiales | ✅ | ✅ | ⏳ | ⏳ |
| Centros de Costo | ✅ | ✅ | ⏳ | ⏳ |
| Formas de Pago y Cajas | ✅ | ✅ | ⏳ | ⏳ |
| Balances y Rendimientos | ✅ | ✅ | ⏳ | ⏳ |
| Consumo de Insumos | ✅ | ✅ | ⏳ | ⏳ |
| Notas Crédito/Débito | ✅ | ✅ | ⏳ | ⏳ |
| Inventarios | ✅ | ✅ | ⏳ | ⏳ |
| Órdenes de Compra | ✅ | ✅ | ⏳ | ⏳ |

---

*Documento actualizado: Marzo 2026*
*Sistema: Solemar Alimentaria - Gestión Frigorífica*
