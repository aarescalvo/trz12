# INFORME COMPLETO: Facturación Electrónica para Frigoríficos en Argentina

## ÍNDICE
1. [Tipos de Comprobantes AFIP](#1-tipos-de-comprobantes-afip)
2. [Requisitos para Facturación de Productos Cárnicos](#2-requisitos-para-facturación-de-productos-cárnicos)
3. [Regímenes Especiales para Frigoríficos](#3-regímenes-especiales-para-frigoríficos)
4. [Datos Obligatorios en Facturas](#4-datos-obligatorios-en-facturas)
5. [Integración con AFIP (WebServices)](#5-integración-con-afip-webservices)
6. [Puntos de Venta y Numeración](#6-puntos-de-venta-y-numeración)
7. [Alícuotas de IVA para Productos Cárnicos](#7-alícuotas-de-iva-para-productos-cárnicos)
8. [Retenciones y Percepciones Aplicables](#8-retenciones-y-percepciones-aplicables)
9. [Comprobantes Asociados (Remitos, Guías)](#9-comprobantes-asociados-remitos-guías)
10. [Normativas SENASA Relacionadas](#10-normativas-senasa-relacionadas)
11. [Recomendaciones para Implementación](#11-recomendaciones-para-implementación)

---

## 1. TIPOS DE COMPROBANTES AFIP

### 1.1 Factura A
**Destinatarios:** Responsables Inscriptos en IVA

**Características:**
- Discrimina IVA (permite cómputo de crédito fiscal)
- Requiere CUIT del comprador
- Código de comprobante: 01
- Es el comprobante más utilizado en operaciones B2B entre empresas

**Datos adicionales obligatorios:**
- Razón social completa del comprador
- Domicilio comercial
- Condición frente al IVA
- Condición de venta (contado/cuenta corriente)

### 1.2 Factura B
**Destinatarios:** Consumidores Finales, Responsables Monotributo, Exentos, No Alcanzados

**Características:**
- No discrimina IVA (IVA incluido en el precio)
- Código de comprobante: 06
- Para montos menores a $10.000 no es obligatorio identificar al comprador
- Para montos mayores, se requiere nombre, domicilio y documento

### 1.3 Factura C
**Destinatarios:** Emitida por Responsables Monotributo

**Características:**
- Código de comprobante: 11
- Sin discriminación de IVA
- Solo pueden emitirla monotributistas
- Aplica para ventas a cualquier categoría de contribuyente

### 1.4 Factura E
**Destinatarios:** Exportaciones

**Características:**
- Código de comprobante: 19
- Para exportaciones de productos cárnicos
- Requiere datos del comprador extranjero
- Exento de IVA
- Requiere permiso de embarque asociado

### 1.5 Factura M
**Destinatarios:** Responsables Inscriptos en IVA (operaciones con agentes de percepción)

**Características:**
- Código de comprobante: 51
- Similar a Factura A pero con percepciones incorporadas
- Aplica cuando el vendedor es agente de percepción

### 1.6 Otros Comprobantes Relevantes

| Código | Comprobante | Uso |
|--------|-------------|-----|
| 02 | Nota de Débito A | Incrementos de factura A |
| 03 | Nota de Crédito A | Devoluciones/descuentos sobre A |
| 07 | Nota de Débito B | Incrementos de factura B |
| 08 | Nota de Crédito B | Devoluciones/descuentos sobre B |
| 12 | Nota de Débito C | Incrementos de factura C |
| 13 | Nota de Crédito C | Devoluciones/descuentos sobre C |
| 20 | Nota de Crédito E | Devoluciones de exportación |
| 21 | Nota de Débito E | Incrementos de exportación |
| 33 | Recibo | Comprobante de pago |

---

## 2. REQUISITOS PARA FACTURACIÓN DE PRODUCTOS CÁRNICOS

### 2.1 Descripción de Productos
La descripción de los productos cárnicos debe incluir:

```
Ejemplo de descripción correcta:
- "Corte vacuno - Vacío - Media res - 130 kg"
- "Carne bovina - Bola de lomo - Trozos - 50 kg"
- "Menudencias - Hígado bovino - Entero - 20 kg"
```

**Datos obligatorios:**
- Especie (bovina, porcina, ovina, etc.)
- Corte o categoría de faena
- Presentación (media res, cuarto, trozos, etc.)
- Peso expresado en kilogramos
- Grado de tipificación (en caso de corresponder)

### 2.2 Trazabilidad
Los frigoríficos deben mantener información de trazabilidad:

- **Número de tropa:** Identificación del lote de animales
- **Fecha de faena:** Obligatoria para trazabilidad
- **Número de DTA/DT-e:** Documento de Tránsito Animal electrónico
- **Establecimiento de origen:** RENSPA del establecimiento
- **Número de certificado SENASA:** Habilitación del frigorífico

### 2.3 Código de Barras/Identificación
- Utilización de código GTIN cuando corresponda
- Identificación de unidades logísticas (SSCC)
- Codificación de acuerdo a GS1 Argentina

---

## 3. REGÍMENES ESPECIALES PARA FRIGORÍFICOS

### 3.1 Régimen de Trazabilidad de Carnes (Res. Gral. AFIP 2475/08)

**Alcance:**
- Frigoríficos exportadores e inscritos en SENASA
- Operaciones de compra-venta de ganado y carne

**Obligaciones:**
- Informar operaciones de compra de ganado
- Registrar movimientos de stock
- Declarar ventas de carne y subproductos
- Sistema: "Registro de Trazabilidad de Ganado Bovino"

### 3.2 Régimen de Facturación para Exportadores de Carne (Res. Gral. AFIP 2784/10)

**Requisitos:**
- Inscripción previa en el registro de exportadores
- Emisión de Factura E con datos específicos
- Asociar permisos de embarque
- Informar destinos y países

### 3.3 Régimen Especial de Emisión de Comprobantes (Res. Gral. AFIP 1415/03)

**Aplicable a:**
- Faena de hacienda propia
- Faena de hacienda ajena
- Venta de carne y subproductos

### 3.4 Código de Actividad (CLAE)
Los frigoríficos deben registrar en AFIP:
- **101130:** Faena de ganado bovino
- **101120:** Faena de ganado porcino
- **461300:** Venta al por mayor de carnes

### 3.5 Exenciones Específicas
- Carnes para consumo escolar (programas sociales)
- Donaciones a bancos de alimentos
- Operaciones interprovinciales con tratamiento especial

---

## 4. DATOS OBLIGATORIOS EN FACTURAS

### 4.1 Datos del Emisor (Frigorífico)

```
RAZÓN SOCIAL: Frigorífico Ejemplo S.A.
CUIT: 30-12345678-9
DIRECCIÓN COMERCIAL: Calle Principal 123, Zona Industrial
INICIO DE ACTIVIDADES: 01/01/2000
INGRESOS BRUTOS: Convenio Multilateral - N° 123-123456
CONDICIÓN IVA: Responsable Inscripto
CLAES: 101130 / 461300
HABILITACIÓN SENASA: N° 1234-AB
```

### 4.2 Datos del Receptor

**Para Factura A:**
- CUIT (obligatorio)
- Razón social
- Domicilio comercial
- Condición frente al IVA

**Para Factura B (monto > $10.000):**
- Nombre y apellido / Razón social
- Domicilio
- N° de documento (CUIT, DNI, etc.)

### 4.3 Datos de la Operación

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| Fecha de emisión | Día/mes/año | Sí |
| Punto de venta | Número asignado por AFIP | Sí |
| Número de comprobante | Secuencial por punto de venta | Sí |
| Código de moneda | PES (pesos) / USD (dólares) | Sí |
| Cotización moneda | Si es distinta a pesos | Condicional |
| Importes netos | Sin IVA | Sí |
| Alícuotas IVA | 0%, 10.5%, 21%, 27% | Sí |
| Importe IVA | Por cada alícuota | Sí |
| Percepciones | Si corresponde | Condicional |
| Total | Importe final | Sí |

### 4.4 Datos Específicos para Productos Cárnicos

**Información adicional recomendada:**

```
DATOS DE TRAZABILIDAD:
├── Número de DTA/DT-e: [número]
├── Fecha de faena: [fecha]
├── Establecimiento origen: [nombre y RENSPA]
├── Número de tropa: [identificación]
└── Certificado SENASA: [número]
```

### 4.5 Período de Facturación

- **Fecha de inicio de actividades:** Debe figurar en todos los comprobantes
- **Período fiscal:** Mes en que se realiza la operación
- **Fecha de vencimiento:** Para operaciones en cuenta corriente

---

## 5. INTEGRACIÓN CON AFIP (WEBSERVICES)

### 5.1 WebServices Principales

#### WSFEv1 (Factura Electrónica Mercado Interno)
**Uso:** Facturación estándar A, B, C, M

**Métodos principales:**
```xml
FECAESolicitar - Solicitar CAE
FECompConsultar - Consultar comprobante
FEParamGetTiposCbte - Tipos de comprobantes
FEParamGetTiposDoc - Tipos de documentos
FEParamGetTiposIva - Alícuotas de IVA
FEParamGetTiposMonedas - Monedas habilitadas
FEParamGetTiposTributos - Tributos
FEParamGetCotizacion - Cotización moneda extranjera
```

#### WSFEXv1 (Factura Electrónica Exportación)
**Uso:** Factura E y comprobantes de exportación

**Métodos principales:**
```xml
FEXAuthorize - Autorizar factura exportación
FEXGetCMP - Consultar comprobante
FEXGetPARAM_Ctz - Cotización moneda
FEXGetPARAM_Incoterms - Incoterms habilitados
FEXGetPARAM_Paises - Países habilitados
```

#### WSMTXCA (Factura Electrónica con Detalle)
**Uso:** Facturas con detalle de productos

**Características:**
- Permite informar detalle de ítems
- Código de producto, descripción, cantidad
- Precio unitario e importe por ítem

### 5.2 Flujo de Autorización

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE FACTURACIÓN                     │
├─────────────────────────────────────────────────────────────┤
│  1. Generar comprobante en sistema interno                  │
│           ↓                                                 │
│  2. Autenticar con AFIP (WSAA - Login)                     │
│           ↓                                                 │
│  3. Solicitar CAE (WSFEv1/WSFEXv1)                         │
│           ↓                                                 │
│  4. Recibir CAE + Fecha vencimiento                        │
│           ↓                                                 │
│  5. Almacenar comprobante autorizado                        │
│           ↓                                                 │
│  6. Emitir PDF/enviar por email                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Autenticación (WSAA)

**Requisitos:**
- Certificado digital (obtenido en AFIP)
- Clave privada
- Entorno: Testing (homologación) o Production

**Ejemplo de solicitud de Token:**
```python
# Pseudocódigo
certificado = "certificado_afip.crt"
clave_privada = "clave_privada.key"
service = "wsfe"  # o "wsfex"

# Obtener Ticket de Acceso (TA)
ta = wsaa_autenticar(service, certificado, clave_privada)
token = ta['token']
sign = ta['sign']
```

### 5.4 Solicitud de CAE

**Datos mínimos requeridos:**
```json
{
  "FeCabReq": {
    "CantReg": 1,
    "PtoVta": 1,
    "CbteTipo": 1
  },
  "FeDetReq": {
    "FECAEDetRequest": {
      "Concepto": 1,
      "DocTipo": 80,
      "DocNro": 20123456789,
      "CbteDesde": 1,
      "CbteHasta": 1,
      "CbteFch": "20240115",
      "ImpTotal": 121000.00,
      "ImpTotConc": 0,
      "ImpNeto": 100000.00,
      "ImpOpEx": 0,
      "ImpIVA": 21000.00,
      "ImpTrib": 0,
      "FchServDesde": null,
      "FchServHasta": null,
      "FchVtoPago": null,
      "MonId": "PES",
      "MonCotiz": 1,
      "Iva": {
        "AlicIva": [
          {
            "Id": 5,
            "BaseImp": 100000.00,
            "Importe": 21000.00
          }
        ]
      }
    }
  }
}
```

### 5.5 Códigos de Concepto

| Código | Descripción |
|--------|-------------|
| 1 | Productos (bienes) |
| 2 | Servicios |
| 3 | Productos y servicios |

### 5.6 Códigos de Documento

| Código | Tipo |
|--------|------|
| 80 | CUIT |
| 86 | CUIL |
| 87 | CDI |
| 89 | LE |
| 90 | LC |
| 91 | CI Extranjera |
| 92 | En trámite |
| 93 | Acta nacimiento |
| 94 | Pasaporte |
| 95 | CI Policía Federal |
| 96 | CI Policía Provincial |
| 99 | Sin identificar/Consumidor final |

---

## 6. PUNTOS DE VENTA Y NUMERACIÓN

### 6.1 Tipos de Puntos de Venta

| Tipo | Código | Características |
|------|--------|-----------------|
| Tradicional | 0001-9998 | Numeración manual, en desuso |
| Electrónico | 0001-9998 | Para facturación electrónica |
| Web | 0001-9998 | Portal AFIP |
| Mobile | 0001-9998 | Aplicación móvil AFIP |

### 6.2 Configuración de Puntos de Venta para Frigoríficos

**Estructura recomendada:**

```
Punto de Venta 0001: Ventas mayoristas (Factura A/B)
Punto de Venta 0002: Ventas minoristas (Factura B/C)
Punto de Venta 0003: Exportaciones (Factura E)
Punto de Venta 0004: Notas de crédito/débito
Punto de Venta 0005: Faena de hacienda ajena
```

### 6.3 Numeración de Comprobantes

**Formato:** `0001-00000001` (Punto de venta - Número correlativo)

**Reglas:**
- Numeración correlativa por punto de venta
- Por tipo de comprobante
- No pueden existir saltos
- Numeración mensual o anual según régimen

### 6.4 Rango de Numeración

- **Mínimo:** 00000001
- **Máximo:** 99999999
- Al agotarse, se habilita nuevo punto de venta o CAEA

### 6.5 CAEA (Código de Autorización Electrónico Anticipado)

**Uso:** Para volúmenes altos de facturación

**Características:**
- Se solicita por quincena
- Permite emitir sin consultar AFIP por cada comprobante
- Plazo de uso: quincena correspondiente
- Informe de comprobantes emitidos: hasta 10 días después

---

## 7. ALÍCUOTAS DE IVA PARA PRODUCTOS CÁRNICOS

### 7.1 Alícuotas Generales

| Producto | Alícuota IVA | Código AFIP |
|----------|--------------|-------------|
| Carnes frescas bovinas | 10.5% | 4 |
| Carnes frescas porcinas | 10.5% | 4 |
| Carnes frescas ovinas | 10.5% | 4 |
| Carnes procesadas/elaboradas | 21% | 5 |
| Menudencias y achuras | 10.5% | 4 |
| Fiambres y embutidos | 21% | 5 |
| Productos con valor agregado | 21% | 5 |

### 7.2 Tabla de Códigos AFIP para IVA

| Código | Alícuota | Descripción |
|--------|----------|-------------|
| 3 | 0% | Operaciones exentas |
| 4 | 10.5% | Tasa reducida |
| 5 | 21% | Tasa general |
| 6 | 27% | Tasa adicional |
| 7 | 0% | No alcanzado |
| 8 | 0% | Exportaciones |
| 9 | 10.5% | Tasa reducida (otro) |

### 7.3 Exenciones de IVA

**Productos exentos:**
- Carnes para programas sociales
- Carnes con destino a exportación
- Faena de hacienda propia para autoconsumo

### 7.4 Determinación de la Alícuota

```python
# Lógica de determinación de IVA
def determinar_alicuota_iva(producto, destino):
    # Carnes frescas sin procesar
    if producto.tipo == "CARNE_FRESCA" and not producto.elaborado:
        return 10.5
    
    # Productos elaborados/procesados
    if producto.elaborado or producto.tipo in ["FIAMBRE", "EMBUTIDO"]:
        return 21
    
    # Exportaciones
    if destino == "EXPORTACION":
        return 0  # Exento
    
    # Otros casos
    return 21
```

---

## 8. RETENCIONES Y PERCEPCIONES APLICABLES

### 8.1 Retención de IVA (Régimen General)

**Normativa:** Res. Gral. AFIP 2854/10

**Base de cálculo:** Importe de la operación (sin IVA)

**Alícuotas:**
| Situación del comprador | Alícuota |
|-------------------------|----------|
| Responsable Inscripto | 10.5% s/ precio neto |
| No categorizado | 100% del IVA |

**Momento de retención:** Al momento del pago

### 8.2 Retención de Ganancias

**Normativa:** Res. Gral. AFIP 830/00

**Alícuotas aplicables a frigoríficos:**

| Operación | Alícuota |
|-----------|----------|
| Compra de ganado a productor | 6% |
| Compra de ganado a intermediario | 28% |
| Venta a consumidor final | N/A |

**Mínimo no sujeto a retención:**
- Según tabla vigente de ganancias

### 8.3 Percepción de IVA

**Agentes de percepción:**
- Grandes contribuyentes (Categoría A)
- Frigoríficos con facturación superior a $XX

**Alícuotas:**
- 3% sobre base imponible (responsables inscriptos)
- 10.5% o 21% sobre base (no inscriptos)

### 8.4 Percepción de Ingresos Brutos

**Según jurisdicción:**

| Provincia | Alícuota típica |
|-----------|-----------------|
| CABA | 3% - 5% |
| Buenos Aires | 3.5% - 5% |
| Córdoba | 3% - 5% |
| Santa Fe | 3% - 4% |
| Otras | Según normativa local |

### 8.5 Retención de OSS (Obra Social)

**Régimen:** Ley 23660

**Alícuota:** 4% sobre remuneraciones del personal

### 8.6 Tabla Resumen de Retenciones/Percepciones

```
┌──────────────────────────────────────────────────────────────────────┐
│              RETENCIONES/PERCEPCIONES PARA FRIGORÍFICOS              │
├──────────────────┬────────────┬─────────────┬───────────────────────┤
│ Impuesto         │ Alícuota   │ Base        │ Observaciones         │
├──────────────────┼────────────┼─────────────┼───────────────────────┤
│ IVA (retención)  │ 10.5%      │ Precio neto │ Compras a productor   │
│ IVA (percepción) │ 3%         │ Precio neto │ Ventas si es agente   │
│ Ganancias        │ 6% / 28%   │ Precio neto │ Según tipo vendedor   │
│ IIBB (percepción)│ 3-5%       │ Total       │ Según convenio        │
│ Aporte SS        │ 12%        │ Remunerac.  │ Empleador             │
│ OSS              │ 4%         │ Remunerac.  │ Empleador             │
└──────────────────┴────────────┴─────────────┴───────────────────────┘
```

---

## 9. COMPROBANTES ASOCIADOS (REMITOS, GUÍAS)

### 9.1 Remito (Código 901)

**Uso:** Documento que acompaña el transporte de mercaderías

**Datos obligatorios:**
- Origen y destino de la mercadería
- Detalle de productos transportados
- Cantidad y peso
- Número de matrícula del transporte

**Formato:**
```
┌─────────────────────────────────────────────────────────┐
│                      REMITO N° 0001-00000001            │
├─────────────────────────────────────────────────────────┤
│ Origen: Frigorífico XXX - Planta Industrial             │
│ Destino: Supermercado YYY - Local Central               │
│ Fecha: 15/01/2024                                       │
│ Transporte: Transportes ABC                             │
│ Dominio: AB 123 CD                                      │
├─────────────────────────────────────────────────────────┤
│ Cant. │ Descripción              │ Peso (kg) │ Observ. │
├───────┼──────────────────────────┼───────────┼─────────┤
│   2   │ Media res - Vacío        │    260    │         │
│   5   │ Bola de lomo             │    150    │         │
│  10   │ Nalga                    │    200    │         │
├───────┴──────────────────────────┴───────────┴─────────┤
│ Total: 610 kg                                           │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Guía de Tránsito (DT-e / DTA)

**Documento de Tránsito Animal electrónico**

**Emisor:** SENASA (sistema SITRAN)

**Datos requeridos:**
- Origen: RENSPA del establecimiento
- Destino: RENSPA del establecimiento destino
- Cantidad de animales
- Especie y categoría
- Datos del transportista

**Proceso:**
```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESO DT-e                             │
├─────────────────────────────────────────────────────────────┤
│  1. Veterinario aprueba movimiento                          │
│           ↓                                                 │
│  2. Sistema SITRAN genera DT-e                              │
│           ↓                                                 │
│  3. Se imprime/vincula al transporte                        │
│           ↓                                                 │
│  4. En destino, se confirma recepción                       │
│           ↓                                                 │
│  5. Sistema cierra el tránsito                              │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Certificado de Faena

**Emisor:** SENASA (inspección veterinaria)

**Contenido:**
- Fecha de faena
- Cantidad de animales faenados
- Resultado de inspección sanitaria
- Habilitación para consumo

### 9.4 Relación entre Comprobantes

```
┌───────────────────────────────────────────────────────────────┐
│           CADENA DE COMPROBANTES                              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  [DT-e] ──► [Recepción] ──► [Faena] ──► [Cert. Faena]        │
│     │                                      │                  │
│     ▼                                      ▼                  │
│  [Remito] ◄─────────────────────── [Remito Salida]           │
│     │                                      │                  │
│     │                                      ▼                  │
│     │                              [Factura A/B]              │
│     │                                      │                  │
│     └──────────────► [Liquidación] ◄───────┘                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 9.5 Liquidación de Faena

**Para faena de hacienda ajena:**

- Tipo de comprobante: Liquidación
- Desglose de:
  - Precio de la hacienda
  - Gastos de faena
  - Impuestos y retenciones
  - Neto a pagar/cobrar

---

## 10. NORMATIVAS SENASA RELACIONADAS

### 10.1 Habilitación de Establecimientos

**Resolución SENASA 423/08**
- Requisitos para habilitación de frigoríficos
- Categorías: Exportación, Tránsito Federal, Provincial
- Condiciones edilicias y equipamiento

### 10.2 Control de Faena

**Resolución SENASA 424/08**
- Procedimientos de inspección ante y post mortem
- Criterios de rechazo y decomiso
- Registro de operaciones

### 10.3 Trazabilidad

**Resolución SENASA 426/08**
- Sistema de identificación de animales (caravana)
- Registro de movimientos
- Base de datos nacional

### 10.4 Documentos de Tránsito

**Resolución SENASA 128/12**
- Implementación del DT-e (Documento de Tránsito electrónico)
- Sistema SITRAN
- Procedimientos de emisión y cierre

### 10.5 Certificaciones para Exportación

**Requisitos según país destino:**

| País/Región | Requisitos específicos |
|-------------|----------------------|
| Unión Europea | Protocolo UE-Argentina |
| China | Certificación específica SENECA |
| Chile | Protocolo bilateral |
| Brasil | GATT/Protocolo Mercosur |
| Otros | Según exigencias específicas |

### 10.6 Control de Residuos

**Programa CREI (Control de Residuos e Insumos)**

- Análisis de residuos de medicamentos
- Control de plaguicidas
- Monitoreo de contaminantes

### 10.7 Identificación de Productos

**Etiquetas y rotulado:**

```
┌─────────────────────────────────────────────────────┐
│         INFORMACIÓN OBLIGATORIA EN ETIQUETAS        │
├─────────────────────────────────────────────────────┤
│ • Denominación del producto                         │
│ • Lista de ingredientes (si aplica)                 │
│ • Contenido neto                                    │
│ • Identificación del origen (planta, país)          │
│ • Número de habilitación SENASA                     │
│ • Fecha de elaboración/vencimiento                  │
│ • Condiciones de conservación                       │
│ • Lote de producción                                │
│ • Instrucciones de uso (si aplica)                  │
│ • Datos del responsable                             │
└─────────────────────────────────────────────────────┘
```

### 10.8 Sistema de Alertas

**Renspa de origen y destino:**
- Validación automática en sistema AFIP
- Bloqueo de operaciones con establecimientos suspendidos
- Alertas por incumplimientos sanitarios

---

## 11. RECOMENDACIONES PARA IMPLEMENTACIÓN

### 11.1 Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                    MÓDULO DE FACTURACIÓN                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Maestro   │    │   Maestro   │    │   Maestro   │          │
│  │  Productos  │    │  Clientes   │    │ Proveedores │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                   │                 │
│         ▼                  ▼                   ▼                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MOTOR DE FACTURACIÓN                  │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │    │
│  │  │ Factura │ │ Notas   │ │ Remitos │ │ Liquidación │   │    │
│  │  │   A/B/C │ │ Créd/Deb│ │         │ │    Faena    │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  INTEGRACIÓN AFIP                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │    │
│  │  │  WSFEv1 │ │ WSFEXv1 │ │ WSMTXCA │ │    WSAA     │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  COMPROBANTES AUTORIZADOS                │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │    │
│  │  │   PDF   │ │  Email  │ │  PDF    │ │   Backup    │   │    │
│  │  │         │ │         │ │ Físico  │ │   Legal     │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 11.2 Base de Datos - Tablas Principales

```sql
-- Tabla de Facturas
CREATE TABLE facturas (
    id BIGSERIAL PRIMARY KEY,
    punto_venta INT NOT NULL,
    numero_factura BIGINT NOT NULL,
    tipo_comprobante INT NOT NULL, -- 1=A, 6=B, 11=C
    cae VARCHAR(14),
    cae_vencimiento DATE,
    cliente_id BIGINT,
    fecha_emision DATE NOT NULL,
    fecha_servicio_desde DATE,
    fecha_servicio_hasta DATE,
    concepto INT NOT NULL, -- 1=producto, 2=servicio
    moneda VARCHAR(3) DEFAULT 'PES',
    cotizacion DECIMAL(10,4) DEFAULT 1,
    importe_neto DECIMAL(15,2),
    importe_iva DECIMAL(15,2),
    importe_total DECIMAL(15,2),
    -- Trazabilidad
    dta_numero VARCHAR(50),
    tropa_numero VARCHAR(50),
    fecha_faena DATE,
    senasa_habilitacion VARCHAR(20),
    -- Estado
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(punto_venta, numero_factura, tipo_comprobante)
);

-- Tabla de Items de Factura
CREATE TABLE factura_items (
    id BIGSERIAL PRIMARY KEY,
    factura_id BIGINT REFERENCES facturas(id),
    producto_id BIGINT,
    descripcion VARCHAR(500) NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    unidad_medida VARCHAR(10),
    precio_unitario DECIMAL(15,4),
    importe_neto DECIMAL(15,2),
    alicuota_iva DECIMAL(5,2),
    importe_iva DECIMAL(15,2),
    -- Datos de trazabilidad
    lote VARCHAR(50),
    peso_kg DECIMAL(10,3),
    corte_tipo VARCHAR(50)
);

-- Tabla de Retenciones/Percepciones
CREATE TABLE factura_tributos (
    id BIGSERIAL PRIMARY KEY,
    factura_id BIGINT REFERENCES facturas(id),
    tributo_id INT NOT NULL, -- código AFIP
    descripcion VARCHAR(100),
    base_imponible DECIMAL(15,2),
    alicuota DECIMAL(5,2),
    importe DECIMAL(15,2)
);

-- Tabla de Remitos
CREATE TABLE remitos (
    id BIGSERIAL PRIMARY KEY,
    punto_venta INT NOT NULL,
    numero_remito BIGINT NOT NULL,
    factura_id BIGINT REFERENCES facturas(id),
    cliente_id BIGINT,
    -- Origen/Destino
    direccion_origen VARCHAR(200),
    direccion_destino VARCHAR(200),
    -- Transporte
    transportista_id BIGINT,
    dominio_vehiculo VARCHAR(20),
    chofer_nombre VARCHAR(100),
    chofer_dni VARCHAR(20),
    -- Fechas
    fecha_emision DATE NOT NULL,
    fecha_salida DATETIME,
    fecha_llegada DATETIME,
    -- Estado
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    UNIQUE(punto_venta, numero_remito)
);
```

### 11.3 Flujos de Trabajo Principales

#### Flujo 1: Venta de Carne al Mayorista

```
1. Cliente realiza pedido
2. Sistema verifica:
   - Condición fiscal del cliente (determina tipo factura)
   - Líneas de crédito habilitadas
   - Bonificaciones aplicables
3. Se genera factura:
   - Consulta stock disponible
   - Aplica precios vigentes
   - Calcula IVA según tipo de producto
   - Aplica percepciones si corresponde
4. Solicita CAE a AFIP
5. Genera remito asociado
6. Imprime/envía comprobantes
```

#### Flujo 2: Faena de Hacienda Ajena

```
1. Recepción de animales con DT-e
2. Faena y control sanitario
3. Pesaje y clasificación
4. Generación de liquidación:
   - Precio de la hacienda
   - Gastos de faena
   - Retenciones aplicables
5. Emisión de factura por servicio de faena
6. Entrega de carne o venta por cuenta de terceros
```

#### Flujo 3: Exportación

```
1. Pedido de exportación
2. Verificación de habilitaciones SENASA
3. Preparación de mercadería
4. Emisión de Factura E:
   - Datos del comprador extranjero
   - Incoterms
   - Puerto de destino
5. Asociación con permiso de embarque
6. Documentación SENASA:
   - Certificado sanitario
   - Certificado de origen
7. Despacho aduanero
```

### 11.4 Consideraciones Técnicas

**Seguridad:**
- Certificados digitales AFIP con protección
- Backup automático de comprobantes
- Logs de auditoría

**Rendimiento:**
- Pool de conexiones AFIP
- Cache de parámetros (alícuotas, códigos)
- Procesamiento batch para volúmenes altos

**Cumplimiento:**
- Respaldo de comprobantes por 10 años
- Disponibilidad para fiscalización
- Generación de reportes regulatorios

### 11.5 Integraciones Recomendadas

```
┌─────────────────────────────────────────────────────────┐
│                SISTEMAS A INTEGRAR                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AFIP                                                   │
│  ├── WSAA (autenticación)                              │
│  ├── WSFEv1 (facturas mercado interno)                 │
│  ├── WSFEXv1 (exportaciones)                           │
│  ├── WSMTXCA (facturas con detalle)                    │
│  └── WSBFEv1 (bono fiscal)                             │
│                                                         │
│  SENASA                                                 │
│  ├── SITRAN (trazabilidad animal)                      │
│  └── SIFCO (faena y control)                           │
│                                                         │
│  Bancos                                                 │
│  ├── Cobros electrónicos                               │
│  └── Retenciones automáticas                           │
│                                                         │
│  ERP/Contabilidad                                       │
│  ├── Asientos automáticos                              │
│  ├── Cuenta corriente                                  │
│  └── Reportes impositivos                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ANEXO A: TABLAS DE REFERENCIA

### A.1 Códigos de Comprobantes AFIP

| Código | Descripción |
|--------|-------------|
| 1 | Factura A |
| 2 | Nota de Débito A |
| 3 | Nota de Crédito A |
| 4 | Recibo A |
| 5 | Nota de Venta al contado A |
| 6 | Factura B |
| 7 | Nota de Débito B |
| 8 | Nota de Crédito B |
| 9 | Recibo B |
| 10 | Nota de Venta al contado B |
| 11 | Factura C |
| 12 | Nota de Débito C |
| 13 | Nota de Crédito C |
| 15 | Recibo C |
| 19 | Factura E |
| 20 | Nota de Crédito E |
| 21 | Nota de Débito E |
| 51 | Factura M |
| 52 | Nota de Débito M |
| 53 | Nota de Crédito M |
| 201 | Factura de Crédito electrónica A |
| 202 | Factura de Crédito electrónica B |
| 206 | Factura de Crédito electrónica C |

### A.2 Códigos de Alícuotas IVA

| Código | Alícuota | Descripción |
|--------|----------|-------------|
| 1 | 0% | No gravado |
| 2 | 0% | Exento |
| 3 | 0% | 0% |
| 4 | 10.5% | 10.5% |
| 5 | 21% | 21% |
| 6 | 27% | 27% |
| 7 | 0% | No alcanzado |
| 8 | 0% | Exportación |
| 9 | 10.5% | Reducida |

### A.3 Códigos de Moneda

| Código | Moneda |
|--------|--------|
| PES | Peso Argentino |
| DOL | Dólar Estadounidense |
| 002 | Dólar Libre EEUU |
| 012 | Franco Francés |
| 014 | Franco Suizo |
| 019 | Libra Esterlina |
| 030 | Yen |
| 033 | Corona Danesa |
| 060 | Euro |

### A.4 Códigos de Tributos

| Código | Descripción |
|--------|-------------|
| 1 | Impuestos nacionales |
| 2 | Impuestos provinciales |
| 3 | Impuestos municipales |
| 4 | Impuestos Internos |
| 5 | IVA |
| 6 | Otros |
| 7 | Percepción IVA |
| 8 | Percepción IIBB |
| 9 | Percepción Ganancias |
| 10 | Percepción de otros impuestos |

---

## ANEXO B: REFERENCIAS NORMATIVAS

### B.1 Resoluciones Generales AFIP

| Resolución | Tema |
|------------|------|
| RG 1415/03 | Régimen de emisión de comprobantes |
| RG 2485/08 | Factura electrónica obligatoria |
| RG 2784/10 | Régimen exportadores |
| RG 2854/10 | Retención IVA |
| RG 2904/10 | Factura electrónica mercado interno |
| RG 3571/14 | Factura electrónica servicios |
| RG 3669/14 | Factura electrónica vendedores |
| RG 3749/15 | Factura electrónica monotributo |
| RG 4004-E/17 | Factura electrónica general |
| RG 4109-E/17 | Factura electrónica codeudores |
| RG 4292/18 | Régimen especial electrónico |
| RG 4490/19 | Factura de crédito electrónica |
| RG 4620/19 | Contribuyentes automatizados |

### B.2 Resoluciones SENASA

| Resolución | Tema |
|------------|------|
| Res. 423/08 | Habilitación establecimientos |
| Res. 424/08 | Control de faena |
| Res. 426/08 | Trazabilidad animal |
| Res. 128/12 | DT-e electrónico |
| Res. 734/11 | Identificación individual |
| Res. 40-E/15 | Exportación carnes |

### B.3 Otras Normativas

- **Ley 25.063:** Impuesto a las Ganancias
- **Ley 23.349:** IVA
- **Ley 23.654:** Impuestos Internos
- **Código Alimentario Argentino:** Cap. VI (Carnes y derivados)

---

## ANEXO C: CONTACTOS Y RECURSOS

### C.1 Sitios Oficiales

- **AFIP:** www.afip.gob.ar
- **SENASA:** www.senasa.gob.ar
- **SITRAN:** sitran.senasa.gob.ar
- **Portal de facturación AFIP:** www.afip.gob.ar/fe

### C.2 Servicios Web AFIP

- **Testing:** https://wswhomo.afip.gov.ar/
- **Producción:** https://servicios1.afip.gov.ar/

### C.3 WSDL de Servicios

```
WSFEv1 (Testing):
https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL

WSFEXv1 (Testing):
https://wswhomo.afip.gov.ar/wsfexv1/service.asmx?WSDL

WSMTXCA (Testing):
https://wswhomo.afip.gov.ar/wsmtxca/services/MTXCAService?wsdl

WSAA (Testing):
https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl
```

---

**Documento preparado para implementación de sistema de facturación electrónica**
**Versión:** 1.0
**Fecha:** Enero 2024
**Nota:** Verificar actualizaciones normativas periódicamente
