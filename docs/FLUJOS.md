# SOLEMAR ALIMENTARIA - Flujos del Sistema

> **IMPORTANTE**: Este documento define cómo funciona cada proceso. Antes de modificar cualquier módulo, leer este archivo.
> **MODO**: El módulo de Pesaje debe poder trabajar OFFLINE.

---

## 1. MÓDULO DE PESAJE DE CAMIONES

### 1.1 INGRESO DE HACIENDA

**Flujo completo:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. LLEGA CAMIÓN CON HACIENDA                               │
│     - Presenta documentación: DTE y Guía (OBLIGATORIOS)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. SE PESA BRUTO (camión + animales)                       │
│     - Se registran datos del vehículo y documentación       │
│     - Se asigna NÚMERO DE TROPA en este momento             │
│     - Una tropa = Un DTE/Guía                               │
│     - Si hay múltiples tropas → múltiples pesajes           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. REGISTRO DE DATOS                                       │
│     ✓ Patentes (chasis y acoplado)                          │
│     ✓ Nombre del chofer                                     │
│     ✓ Empresa transportista                                 │
│     ✓ Cantidad de animales POR TIPO según especie           │
│     ✓ Proveedor de hacienda                                 │
│     ✓ Usuario de faena (a quién se le carga)                │
│     ✓ Corral asignado (OPCIONAL - puede asignarse después)  │
│     ✓ DTE y Guía (OBLIGATORIOS)                             │
│     ✓ Peso BRUTO                                            │
│     ✓ Número de tropa asignado automáticamente             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. DESCARGA EN CORRAL                                      │
│     - Se descargan los animales en el corral asignado       │
│     - Si no hay corral, se asigna después                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. SE PESA TARA (camión vacío)                             │
│     - Se obtiene peso neto = Bruto - Tara                   │
│     - Se IMPRIME AUTOMÁTICAMENTE el ticket (2 copias)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  6. TICKET IMPRESO (2 COPIAS)                               │
│     ┌─────────────────────────────────────────────┐         │
│     │  DATOS DEL TICKET:                          │         │
│     │  - Fecha y hora                             │         │
│     │  - Operador                                 │         │
│     │  - Nombre del chofer                        │         │
│     │  - Número de tropa                          │         │
│     │  - Proveedor                                │         │
│     │  - Usuario de faena                         │         │
│     │  - Tipos de animales y cantidades           │         │
│     │  - Patentes (chasis y acoplado)             │         │
│     │  - DTE y Guía                               │         │
│     │  - KG Brutos                                │         │
│     │  - KG Tara                                  │         │
│     │  - KG Neto                                  │         │
│     │  - Firma de conformidad del chofer          │         │
│     └─────────────────────────────────────────────┘         │
│                                                             │
│  OPCIONES: Reimprimir / "Eliminar" (libera n° tropa)        │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.2 PESAJE PARTICULAR

**Flujo:** Camión puede ingresar vacío/cargado, pesar tara y bruto en orden indistinto.

**Datos:** Patentes, chofer, observaciones

**Ticket:** Fecha, hora, KG, chofer, transporte, observaciones

---

### 1.3 SALIDA DE MERCADERÍA

**Flujo:** Tara (vacío) → Carga con precintos → Bruto (cargado)

**Datos:** Patentes, chofer, transportista, remito (opcional), factura (opcional), números de precinto, observaciones (tipo mercadería)

---

## 2. MÓDULO DE MOVIMIENTO DE HACIENDA

- Visualización de tropas por estado
- Stock por corral
- Edición de datos (Supervisor/Admin): cantidades, tipos, eliminar tropa
- Movimiento parcial entre corrales (con aviso si supera capacidad o mezcla especies)
- Bajas por muerte: N° animal, KG, causa, descuento automático

---

## 3. MÓDULO DE PESAJE INDIVIDUAL

- Día siguiente a recepción, previo a faena
- Se pesan TODOS los animales
- Datos: caravana (trae), tipo (operador), raza (operador), peso
- Numeración correlativa desde 1 por tropa
- Rótulo: Datamax 5x10cm con Tropa simplificada, Año, N° Animal (2 dig), KG, código barras Code128

---

## 4. MÓDULO DE LISTA DE FAENA

**Flujo completo:**

```
┌─────────────────────────────────────────────────────────────┐
│  CREACIÓN DE LISTA DE FAENA (una por día)                   │
├─────────────────────────────────────────────────────────────┤
│  - Indica qué se va a faenar en el día                      │
│  - Cantidad de animales por tropa que ingresan a faena      │
│  - De qué corrales se retiran los animales                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  ASIGNACIÓN DE GARRÓN                                       │
├─────────────────────────────────────────────────────────────┤
│  Número de garrón: CORRELATIVO POR LISTADO DE FAENA         │
│  (empieza en 1 cada día)                                    │
│                                                             │
│  Formas de asignar:                                         │
│  1. MANUAL: Operador ingresa número de animal/tropa         │
│  2. AUTOMÁTICA: Lectura de chip/caravana                    │
│     → Sistema asocia: Garrón X → Animal Y de Tropa Z        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  MODIFICACIÓN POST-FAENA                                    │
├─────────────────────────────────────────────────────────────┤
│  - Cambiar orden de ingresos                                │
│  - Cambiar número de ANIMAL de la tropa                     │
│  - NUNCA cambiar número de GARRÓN                           │
│  - Modificar y eliminar asignaciones                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  CIERRE DE FAENA                                            │
├─────────────────────────────────────────────────────────────┤
│  - Stocks de medias y corrales DESPUÉS de cerrar faena      │
│  - Requiere autorización de SUPERVISOR                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. MÓDULO DE ROMANEO

**Flujo completo:**

```
┌─────────────────────────────────────────────────────────────┐
│  PESAJE DE MEDIAS RESES                                     │
├─────────────────────────────────────────────────────────────┤
│  - Se pesan las 2 medias reses                              │
│  - Se identifican por número de garrón                      │
│  - Tipificador registra datos                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  DATOS REGISTRADOS EN ROMANEO                               │
├─────────────────────────────────────────────────────────────┤
│  ✓ Número de garrón                                         │
│  ✓ Tropa de origen                                          │
│  ✓ Número de animal                                         │
│  ✓ KG peso vivo (inicio)                                    │
│  ✓ Tipo de animal                                           │
│  ✓ Cantidad de DIENTES (lo registra el tipificador)         │
│  ✓ KG media res izquierda                                   │
│  ✓ KG media res derecha                                     │
│  ✓ KG total de la res                                       │
│  ✓ Número de TIPIFICADOR (matrícula)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  IMPRESIÓN DE RÓTULOS (6 por animal)                        │
├─────────────────────────────────────────────────────────────┤
│  MEDIA IZQUIERDA: 3 rótulos (A, T, D)                       │
│  MEDIA DERECHA: 3 rótulos (A, T, D)                         │
│                                                             │
│  Cada rótulo tiene SIGLA diferente, resto igual             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  ENVÍO AUTOMÁTICO DE ROMANEO                                │
├─────────────────────────────────────────────────────────────┤
│  - Después de CONFIRMAR datos de romaneo por SUPERVISOR     │
│  - Se envía automáticamente por EMAIL al usuario de faena   │
└─────────────────────────────────────────────────────────────┘
```

**DATOS DEL RÓTULO DE MEDIA RES:**

```
┌─────────────────────────────────────────────┐
│  [LOGO FRIGORÍFICO - logo.png]              │
│                                             │
│  DATOS DEL FRIGORÍFICO:                     │
│  - Nombre: Solemar Alimentaria              │
│  - Dirección                                │
│  - N° Establecimiento Oficial               │
│  - CUIT                                     │
│  - N° Matrícula                             │
│                                             │
│  DATOS DEL USUARIO:                         │
│  - Usuario de faena                         │
│                                             │
│  DATOS DEL PRODUCTO:                        │
│  - Media Res (producto de configuración)    │
│  - KG                                       │
│  - Tipo de animal                           │
│  - DENTICIÓN                                │
│  - N° TIPIFICADOR (matrícula)               │
│  - Temperatura de conservación              │
│                                             │
│  FECHAS:                                    │
│  - Fecha de faena                           │
│  - Fecha de vencimiento                     │
│                                             │
│  NÚMERO DE TROPA                            │
│                                             │
│  SIGLA: A / T / D                           │
│  MEDIA: IZQ / DER                           │
│                                             │
│  CÓDIGO DE BARRAS                           │
└─────────────────────────────────────────────┘
```

**SIGLAS DE MEDIA RES:**
| Sigla | Significado |
|-------|-------------|
| A | Asado |
| T | Trasero |
| D | Delantero |

---

## 6. MÓDULO DE MENUDENCIAS

**Flujo:**

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN DE MENUDENCIAS (Administrador)               │
├─────────────────────────────────────────────────────────────┤
│  - Crear tipos de menudencias                               │
│  - Alta/baja de tipos                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  POST-FAENA: INGRESO A CÁMARA                               │
├─────────────────────────────────────────────────────────────┤
│  - Se guardan en cámara de menudencias                      │
│  - Se refrigeran hasta el día siguiente                     │
│  - Se registran KG/cantidad por TROPA                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  DÍA SIGUIENTE: ELABORACIÓN                                 │
├─────────────────────────────────────────────────────────────┤
│  - Se elaboran, guardan en bolsas                           │
│  - Se vuelven a pesar                                       │
│  - Se registra operador de elaboración                      │
│  - Se imprime RÓTULO DE MENUDENCIAS                         │
└─────────────────────────────────────────────────────────────┘
```

**DATOS DEL RÓTULO DE MENUDENCIAS:**

```
┌─────────────────────────────────────────────┐
│  [LOGO FRIGORÍFICO]                         │
│  DATOS DEL FRIGORÍFICO                      │
│  DATOS DEL USUARIO                          │
│  TIPO DE MENUDENCIA                         │
│  KG                                         │
│  N° DE BOLSA                                │
│  FECHA FAENA                                │
│  FECHA ELABORACIÓN                          │
│  FECHA VENCIMIENTO                          │
│  CÓDIGO DE BARRAS                           │
└─────────────────────────────────────────────┘
```

---

## 7. MÓDULO DE CUARTEO

**Flujo completo:**

```
┌─────────────────────────────────────────────────────────────┐
│  DEFINICIÓN DE CUARTEO                                      │
├─────────────────────────────────────────────────────────────┤
│  - Proceso de separar las medias reses en CUARTOS           │
│  - Se registra el peso de cada cuarto                       │
│  - Los cuartos son CONFIGURABLES (no fijos)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  CUARTOS POR DEFECTO                                        │
├─────────────────────────────────────────────────────────────┤
│  1. DELANTERO                                               │
│  2. TRASERO                                                 │
│  3. ASADO                                                   │
│                                                             │
│  NOTA: Se pueden crear OTROS CUARTOS según necesidad        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PROCESO                                                    │
├─────────────────────────────────────────────────────────────┤
│  - Cada media res tiene una LETRA y código de barras        │
│  - En sistema se cambian los KG de ese cuarto               │
│  - Se pueden imprimir RÓTULOS de cuartos                    │
│  - Se asignan nuevos valores para el rótulo                 │
└─────────────────────────────────────────────────────────────┘
```

**DATOS DEL RÓTULO DE CUARTO:**

```
┌─────────────────────────────────────────────┐
│  [MISMO FORMATO QUE RÓTULO DE MEDIA RES]    │
│                                             │
│  - Logo frigorífico                         │
│  - Datos del frigorífico                    │
│  - Datos del usuario                        │
│  - Producto (CUARTO)                        │
│  - KG ACTUALIZADOS (del cuarto)             │
│  - Tipo de animal                           │
│  - Dentición                                │
│  - N° Tipificador (matrícula)               │
│  - Temperatura de conservación              │
│  - Fecha de faena                           │
│  - Fecha de vencimiento                     │
│  - Número de tropa                          │
│  - Sigla del cuarto                         │
│  - Código de barras                         │
└─────────────────────────────────────────────┘
```

**TRAZABILIDAD:**
- La vinculación del cuarto con la media res original puede ser cualquier método
- Requisito: el dato debe ser TRAZABLE
- Se mantiene el número de tropa como nexo principal

---

## 8. MÓDULO DE PRODUCTO TERMINADO

**Tipos de rubro:**

```
┌─────────────────────────────────────────────────────────────┐
│  RUBROS DE PRODUCTO TERMINADO                               │
├─────────────────────────────────────────────────────────────┤
│  - Carne bovina con hueso enfriada                          │
│  - Carne equina sin hueso al vacío                          │
│  - Menudencias bovinas congeladas                            │
│  - Menudencias bovinas enfriadas al vacío                    │
│  - Carne equina con hueso                                    │
│  - Carne bovina con hueso                                    │
│  - (y otros que se creen necesario)                          │
└─────────────────────────────────────────────────────────────┘
```

**TRAZABILIDAD COMPLETA:**

```
┌─────────────────────────────────────────────────────────────┐
│  CADENA DE TRAZABILIDAD                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PESAJE ──→ TROPA ──→ FAENA ──→ TROPA (se mantiene)         │
│                                        │                    │
│                                        ↓                    │
│                              DESPACHO / DESPOSTE            │
│                                        │                    │
│                                        ↓                    │
│                              N° LOTE DE PRODUCCIÓN          │
│                                                             │
│  EN BOVINO: El número de tropa se mantiene HASTA EL FINAL   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**RÓTULOS DE PRODUCTO TERMINADO:**

```
┌─────────────────────────────────────────────┐
│  ENVASE PRIMARIO:                           │
│  [LOGO FRIGORÍFICO]                         │
│  DATOS DEL FRIGORÍFICO                      │
│  USUARIO (si corresponde)                   │
│  DATOS DEL PRODUCTO                         │
│  FECHA FAENA                                │
│  FECHA ELABORACIÓN                          │
│  FECHA VENCIMIENTO                          │
│  MODALIDAD DE CONSERVACIÓN                  │
│  (SIN código de barras)                     │
├─────────────────────────────────────────────┤
│  ENVASE SECUNDARIO:                         │
│  (Mismos datos que primario)                │
│  + CÓDIGO DE BARRAS (EAN-128)               │
├─────────────────────────────────────────────┤
│  UN SOLO ENVASE:                            │
│  (Todos los datos + código de barras)       │
└─────────────────────────────────────────────┘
```

**USO DE ENVASES:**
- Depende del TIPO DE PRODUCTO
- Se define en la configuración del producto

---

## 9. MÓDULO DE STOCK CÁMARAS

**Tipos de Cámaras:**

| Tipo | Capacidad | Ingreso |
|------|-----------|---------|
| Faena | Ganchos | Automático post-faena |
| Cuarteo/Desposte | KG | Manual |
| Depósito | KG | Manual |

**Movimientos de Cámara:**

```
┌─────────────────────────────────────────────────────────────┐
│  REGISTRO DE MOVIMIENTOS                                    │
├─────────────────────────────────────────────────────────────┤
│  ✓ Qué se movió                                             │
│  ✓ A dónde se movió                                         │
│  ✓ Quién lo hizo                                            │
│  ✓ Fecha y hora                                             │
│  ✓ Cantidad/KG (movimientos parciales permitidos)           │
└─────────────────────────────────────────────────────────────┘
```

- Descuento automático con despachos
- Reportes de stock y movimientos

---

## 10. MÓDULO DE CONFIGURACIÓN

### 10.1 DATOS DEL FRIGORÍFICO

```
┌─────────────────────────────────────────────────────────────┐
│  DATOS DEL FRIGORÍFICO (para rótulos)                       │
├─────────────────────────────────────────────────────────────┤
│  ✓ Nombre: Solemar Alimentaria                              │
│  ✓ Dirección                                                 │
│  ✓ Número de Establecimiento Oficial                        │
│  ✓ CUIT                                                      │
│  ✓ Número de Matrícula                                       │
│  ✓ Logo (logo.png)                                           │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 GESTIÓN DE CORRALES

- Nombre, capacidad, observaciones
- Editar con clave admin
- Eliminar solo si está vacío

### 10.3 CONFIGURACIÓN DE NÚMERO DE TROPA

- Por especie: último número usado, próximo número
- Admin puede modificar

### 10.4 GESTIÓN DE CÁMARAS

- Nombre, tipo (Faena/Cuarteo/Depósito), capacidad (ganchos/KG), observaciones

### 10.5 GESTIÓN DE MENUDENCIAS

- Nombre del producto, activo/inactivo, observaciones

### 10.6 GESTIÓN DE TIPIFICADORES

```
┌─────────────────────────────────────────────────────────────┐
│  CREAR/EDITAR TIPIFICADOR (Administrador)                   │
├─────────────────────────────────────────────────────────────┤
│  ✓ Nombre                                                   │
│  ✓ Apellido                                                 │
│  ✓ Número de tipificador                                    │
│  ✓ Número de matrícula (se usa en rótulos)                  │
│  ✓ Activo/Inactivo                                          │
└─────────────────────────────────────────────────────────────┘
```

**DEFINICIÓN:**
- Un tipificador es un EMPLEADO del frigorífico
- Tiene una MATRÍCULA profesional
- Se crea en Configuración → Tipificadores

### 10.7 GESTIÓN DE PRODUCTOS

**⚠️ IMPORTANTE: SEPARACIÓN POR ESPECIE**

```
┌─────────────────────────────────────────────────────────────┐
│  LAS TABLAS DE PRODUCTOS SON SEPARADAS POR ESPECIE          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⛔ BAJO NINGUNA CIRCUNSTANCIA SE MEZCLAN LAS ESPECIES      │
│                                                             │
│  MOTIVO: Un corte puede tener el mismo nombre en ambas     │
│  especies, pero son productos DIFERENTES                   │
│                                                             │
│  ESTO ES BÁSICO DE TRAZABILIDAD                             │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ TABLA PRODUCTOS     │    │ TABLA PRODUCTOS     │        │
│  │ BOVINOS             │    │ EQUINOS             │        │
│  └─────────────────────┘    └─────────────────────┘        │
│         ↓                            ↓                      │
│    Especie: BOVINO             Especie: EQUINO             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**CAMPOS DE PRODUCTO:**

```
┌─────────────────────────────────────────────────────────────┐
│  CREAR/EDITAR PRODUCTO (por ESPECIE)                        │
├─────────────────────────────────────────────────────────────┤
│  ✓ Número de registro del producto                          │
│  ✓ Nombre                                                   │
│  ✓ Nombre para reportes                                     │
│  ✓ En qué reportes aparece                                  │
│  ✓ Tara                                                     │
│  ✓ Días de conservación                                     │
│  ✓ Tipificación (requiere/no requiere)                      │
│  ✓ Tipo de rótulo a generar                                 │
│  ✓ Precio                                                   │
│  ✓ Temperatura de conservación                              │
│  ✓ ESPECIE (BOVINO / EQUINO - obligatorio)                  │
└─────────────────────────────────────────────────────────────┘
```

**PREGUNTAS PENDIENTES:**
- [ ] ¿Me podés compartir el archivo Excel con la tabla de productos completa?
- [ ] ¿Qué otros campos tienen los productos?

### 10.8 GESTIÓN DE OPERADORES

- Nombre, usuario (obligatorio), contraseña (obligatorio), PIN (opcional)
- Rol: Operador / Supervisor / Administrador
- Permisos detallados por módulo

---

## 11. REPORTES

### 11.1 RENDIMIENTO POR TROPA

```
┌─────────────────────────────────────────────────────────────┐
│  REPORTE DE RENDIMIENTO POR TROPA                           │
├─────────────────────────────────────────────────────────────┤
│  CABECERA:                                                  │
│  - Datos del usuario de faena                               │
│  - Datos del proveedor de hacienda                          │
│  - Número de ticket                                         │
│  - Número de tropa                                          │
│                                                             │
│  DETALLE EN COLUMNAS:                                       │
│  ┌─────┬──────┬──────┬───────┬──────┬───────┬───────┬──────┬───────┬───────┐
│  │Garr │N°Anim│Tipo  │Tipo   │Raza  │KG     │KG     │KG     │KG     │Rinde  │
│  │     │      │Animal│Siglas │      │Ingreso│Media  │Media  │Total  │Indiv. │
│  │     │      │      │       │      │       │Izq    │Der    │Media  │       │
│  ├─────┼──────┼──────┼───────┼──────┼───────┼───────┼───────┼───────┼───────┤
│  │  1  │  4   │TO    │TORO   │ANGUS │ 450   │ 112   │ 115   │ 227   │ 50.4% │
│  │  2  │  1   │VA    │VACA   │HEREF │ 380   │  95   │  98   │ 193   │ 50.8% │
│  │ ... │      │      │       │      │       │       │       │       │       │
│  └─────┴──────┴──────┴───────┴──────┴───────┴───────┴───────┴───────┴───────┘
│                                                             │
│  SUBTOTALES al final de cada columna                        │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 OTROS REPORTES

- Stock de corrales
- Movimientos de corrales
- Stock de cámaras
- Movimientos de cámara
- Rendimiento por animal
- Producción diaria
- Despachos

### 11.3 EXPORTACIÓN

- **PDF**: Para archivo
- **Excel**: Para archivo y manipulación de datos

### 11.4 ENVÍO AUTOMÁTICO

```
┌─────────────────────────────────────────────────────────────┐
│  ENVÍO AUTOMÁTICO DE ROMANEOS                               │
├─────────────────────────────────────────────────────────────┤
│  - Después que SUPERVISOR confirma datos de romaneo         │
│  - Se envía automáticamente por EMAIL                       │
│  - Destinatario: Usuario de faena (su email registrado)     │
│  - Formato: PDF adjunto                                     │
└─────────────────────────────────────────────────────────────┘
```

**CONFIGURACIÓN DE EMAIL:**

```
┌─────────────────────────────────────────────────────────────┐
│  SERVIDOR DE CORREO                                         │
├─────────────────────────────────────────────────────────────┤
│  Proveedor: Microsoft Outlook                               │
│  Dominio: @solemar.com.ar                                   │
│  Credenciales: Del proveedor de internet                    │
│                                                             │
│  Configuración SMTP:                                        │
│  - Host: smtp.office365.com (a confirmar)                   │
│  - Puerto: 587 (TLS)                                        │
│  - Usuario: usuario@solemar.com.ar                          │
│  - Contraseña: [configurar en sistema]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. DEFINICIONES IMPORTANTES

### Tipos de Animal

**BOVINO:**
| Código | Siglas | Descripción |
|--------|--------|-------------|
| TO | TORO | Toro |
| VA | VACA | Vaca |
| VQ | VAQU | Vaquillona |
| MEJ | MEJ  | Torito/Mej |
| NO  | NOVI | Novillo |
| NT  | NOVT | Novillito |

**EQUINO:**
| Código | Siglas | Descripción |
|--------|--------|-------------|
| PADRILLO | PADR | Padrillo |
| POTRILLO | POTR | Potrillo/Potranca |
| YEGUA | YEGU | Yegua |
| CABALLO | CAB  | Caballo |
| BURRO | BURR | Burro |
| MULA | MULA | Mula |

### Código de Tropa
Formato: `[LETRA] [AÑO] [SECUENCIAL]`
Ejemplo: `B 2026 0001`

### Código Simplificado
Formato: `[LETRA][SECUENCIAL]`
Ejemplo: `B0001`

### Garrón
Soporte para colgar animal en faena. Numeración correlativa por día.

---

## 13. SISTEMA DE CODIFICACIÓN DE PRODUCTOS

### 13.1 CICLO I vs CICLO II

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CICLO I                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  - Faena de animales                                                        │
│  - Producción de medias reses                                               │
│  - Despacho de medias reses                                                 │
│                                                                             │
│  Rótulos: Media Res (6 por animal: A/T/D × IZQ/DER)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CICLO II                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  - Elaboración de medias reses en:                                          │
│    • Cuartos anatómicos                                                     │
│    • Cortes anatómicos                                                      │
│  - Modalidades de presentación:                                             │
│    • Enfriado                                                               │
│    • Congelado                                                              │
│    • Al vacío                                                               │
│    • Atmósfera natural                                                      │
│  - Despacho como cortes                                                     │
│                                                                             │
│  Rótulos: Producto Terminado con código EAN-128 (24 dígitos)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 ESTRUCTURA DEL CÓDIGO EAN-128 (24 dígitos)

**Uso:** Solo para productos de **CICLO II** en el envase secundario.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CÓDIGO DE PRODUCTO (24 DÍGITOS)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PARTE FIJA (10 dígitos)              PARTE VARIABLE (14 dígitos)           │
│  ┌─────────────────────────────┐       ┌─────────────────────────────────┐  │
│  │ Se configura al CREAR       │       │ Se genera al PRODUCIR           │  │
│  │ el producto                 │       │                                 │  │
│  │                             │       │ FECHA PRODUCCIÓN │ 6 dígitos    │  │
│  │ ARTÍCULO    │ 3 dígitos     │       │ LOTE             │ 6 dígitos    │  │
│  │ ESPECIE     │ 1 dígito      │       │ UNIDADES         │ 2 dígitos    │  │
│  │ TIPIFICACIÓN│ 2 dígitos     │       └─────────────────────────────────┘  │
│  │ TIPO TRABAJO│ 1 dígito      │                                         │
│  │ TRANSPORTE  │ 1 dígito      │       ┌─────────────────────────────────┐  │
│  │ DESTINO     │ 2 dígitos     │       │ PESO NETO        │ 5 dígitos    │  │
│  └─────────────────────────────┘       │ NUMERADOR CAJA   │ 4 dígitos    │  │
│                                        │ PESO BRUTO       │ 4 dígitos    │  │
│                                        └─────────────────────────────────┘  │
│                                                                             │
│  ⚠️ EN EL RÓTULO SOLO SE COLOCA LA PARTE VARIABLE                          │
│  La parte fija se define una vez al crear el producto                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.3 PARTE FIJA DEL CÓDIGO (Configuración)

Se define al crear/editar el producto. Incluye:

| Campo | Dígitos | Descripción |
|-------|---------|-------------|
| Artículo | 3 | Código del producto (ej: .001 lomo) |
| Especie | 1 | 1=equino, 6=bovino, etc. |
| Tipificación | 2 | Solo para equinos |
| Tipo Trabajo | 1 | Terminación interna |
| Transporte | 1 | Medio de transporte |
| Destino | 2 | País de destino |

### 13.4 PARTE VARIABLE DEL CÓDULO (Rótulo)

**Se genera automáticamente al producir cada lote:**

| Campo | Dígitos | Origen |
|-------|---------|--------|
| Fecha Producción | 6 | Fecha de elaboración |
| Lote | 6 | Número de lote de producción |
| Unidades | 2 | Cantidad de unidades en la caja |
| Peso Neto | 5 | KG netos (sin tara) |
| Numerador Caja | 4 | Número correlativo de caja |
| Peso Bruto | 4 | KG brutos (con tara) |

### 13.5 TABLAS DE REFERENCIA (EDITABLES)

**Especies:**
| Código | Especie |
|--------|---------|
| 0 | todas |
| 1 | equino |
| 2 | caballo |
| 3 | potro |
| 4 | burro |
| 5 | equino LAND L |
| 6 | BOVINO |

**Transporte:**
| Código | Tipo |
|--------|------|
| 0 | no definido |
| 1 | BARCO enfriado |
| 2 | BARCO congelado |
| 3 | BARCO salado |
| 4 | AVION enfriado |
| 5 | AVION congelado |
| 6 | CAMION enfriado |
| 7 | CAMION congelado |
| 8 | INTERNO |

**Destino:**
| Código | País |
|--------|------|
| .00 | cualquiera |
| .01 | Italia |
| .02 | Francia |
| .03 | España |
| .04 | Bélgica |
| .05 | Rusia |
| .06 | Suiza |
| .07 | Austria |
| .08 | Japón |
| .09 | Kazajistán |
| .10 | Japón IMI |

**NOTA:** Estas tablas son EDITABLES. Se pueden agregar nuevos valores según necesidad.

---

## 14. PREGUNTAS PENDIENTES

### Configuración Email:
- [ ] Confirmar datos exactos del servidor SMTP (host, puerto)

---

## 15. HISTORIAL DE CAMBIOS

| Fecha | Módulo | Cambio |
|-------|--------|--------|
| 2025-01 | FLUJOS.md | Documento creado con todos los flujos |
| 2025-01 | FLUJOS.md | Definido Tipificador: empleado con matrícula |
| 2025-01 | FLUJOS.md | Definido Denticción: la registra tipificador |
| 2025-01 | FLUJOS.md | Definido Gestión de Productos por especie |
| 2025-01 | FLUJOS.md | Definido Cuarteo: separar en 3 cuartos |
| 2025-01 | FLUJOS.md | Definido Producto Terminado con rubros |
| 2025-01 | FLUJOS.md | Definido rótulos con envase primario/secundario |
| 2025-01 | FLUJOS.md | Definido Movimientos de Cámara |
| 2025-01 | FLUJOS.md | Definido Reporte de Rendimiento por Tropa |
| 2025-01 | FLUJOS.md | Definido Exportación PDF/Excel |
| 2025-01 | FLUJOS.md | Definido Envío automático de romaneos por email |
| 2025-01 | FLUJOS.md | Definido Datos del Frigorífico para rótulos |
| 2025-01 | FLUJOS.md | Cuarteo: 3 cuartos por defecto (Delantero/Trasero/Asado), configurables |
| 2025-01 | FLUJOS.md | Rótulo de Cuarteo: igual que Media Res con KG actualizados |
| 2025-01 | FLUJOS.md | Trazabilidad: cadena completa Pesaje→Tropa→Faena→Lote |
| 2025-01 | FLUJOS.md | Productos: TABLAS SEPARADAS POR ESPECIE (NUNCA mezclar) |
| 2025-01 | FLUJOS.md | Email: Microsoft Outlook con @solemar.com.ar |
| 2025-01 | FLUJOS.md | Sistema Codificación: código 24 dígitos para EAN-128 (Ciclo II) |
| 2025-01 | FLUJOS.md | Tablas: Artículos (106+), Especies (agregar BOVINO=6), Tipificación |
| 2025-01 | FLUJOS.md | Tablas: Tipo Trabajo, Transporte, Destino |
| 2025-01 | FLUJOS.md | CICLO I: Faena, medias reses, despacho |
| 2025-01 | FLUJOS.md | CICLO II: Cuartos, cortes, enfriado/congelado/vacío, despacho |
| 2025-01 | FLUJOS.md | Código EAN-128: Parte FIJA (configuración) + Parte VARIABLE (rótulo) |

---

*Este documento debe actualizarse con cada cambio importante al sistema.*
*NO ELIMINAR NUNCA - Solo agregar y completar.*
