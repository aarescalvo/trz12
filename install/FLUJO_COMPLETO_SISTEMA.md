# 📋 FLUJO COMPLETO DEL SISTEMA FRIGORÍFICO SOLEMAR
## Guía paso a paso para entender el programa

---

## 🎯 INTRODUCCIÓN AL SISTEMA

### ¿Qué es este sistema?
Es un software para gestionar un **frigorífico** (matadero), donde:
- Entran **animales vivos** (vacas, caballos)
- Se los **procesa** (faena)
- Salen **productos cárnicos** (cortes, menudencias)

### Conceptos básicos que necesitas saber:

| Término | Significado |
|---------|-------------|
| **Tropa** | Grupo de animales que llegan juntos en un mismo camión |
| **Corral** | Lugar donde se alojan los animales vivos |
| **Faena** | Proceso de sacrificar y procesar un animal |
| **Romaneo** | Pesaje y clasificación de las medias reses |
| **Garrón** | Número identificatorio que se asigna a cada animal durante la faena |
| **Media Res** | Cada mitad de la res después de faenada |
| **Cámara** | Cuarto frío donde se guarda la carne |
| **Usuario de Faena** | El dueño de los animales (matarife/productor) |

---

## 🔄 FLUJO GENERAL DEL SISTEMA

```
ENTRADA                    PROCESO                    SALIDA
────────                   ───────                    ──────
Camión con animales  →     Faena diaria       →     Productos cárnicos
                           ↓
                      Medias reses en cámaras
```

---

## 📝 PASO 1: INGRESO AL SISTEMA (LOGIN)

### ¿Dónde se introducen los datos?
- **Pantalla de Login** (primera pantalla que aparece)

### ¿Qué datos se ingresan?
1. **Usuario** (texto): Nombre del operador (ej: "admin")
2. **Contraseña** (texto oculto): Clave de acceso (ej: "admin123")

### ¿Qué pasa después?
- Si es correcto → Entra al Dashboard (pantalla principal)
- Si es incorrecto → Muestra error "Usuario o contraseña incorrectos"

### Datos de prueba por defecto:
```
Usuario: admin
Contraseña: admin123
```

---

## 📝 PASO 2: DASHBOARD (PANTALLA PRINCIPAL)

### ¿Qué muestra?
- **Tarjetas con números**:
  - Total de tropas
  - Total de pesajes de camiones
  - Animales en corrales
  - Faenas del día

### ¿Dónde están los datos?
- No se ingresan datos aquí
- Solo **muestra información** de lo que hay en el sistema

---

## 📝 PASO 3: PESAJE DE CAMIONES (ENTRADA DE ANIMALES)

### ¿Qué es este módulo?
Es donde se registra la **llegada de un camión con animales**.

### ¿Dónde se accede?
- Botón grande **"Pesaje Camiones"** al principio del menú lateral

### ¿Qué datos se ingresan?

#### Pestaña "Ingreso de Hacienda":

**1. Datos del Transporte:**
| Campo | Tipo | Ejemplo | ¿De dónde sale? |
|-------|------|---------|-----------------|
| Patente Chasis | Texto | "AB123CD" | Escrito manualmente |
| Patente Acoplado | Texto | "EF456GH" | Escrito manualmente |
| Chofer | Select | "Juan Pérez" | De lista de transportistas |
| Transportista | Select | "Transporte López" | De lista de transportistas |

**2. Datos del Origen:**
| Campo | Tipo | Ejemplo | ¿De dónde sale? |
|-------|------|---------|-----------------|
| Productor | Select | "Estancia Santa María" | De lista de clientes (esProductor=true) |
| Usuario de Faena | Select | "Juan Matarife" | De lista de clientes (esUsuarioFaena=true) |
| DTE | Texto | "12345678" | Número del documento de tránsito |
| Guía | Texto | "87654321" | Número de la guía sanitaria |

**3. Datos de los Animales:**
| Campo | Tipo | Ejemplo | ¿De dónde sale? |
|-------|------|---------|-----------------|
| Especie | Select | "BOVINO" o "EQUINO" | Selección |
| Cantidad Total | Número | 25 | Cuenta manual |

**4. Detalle por tipo de animal (grilla):**
- Se ingresa cuántos animales hay de cada tipo:
  - TO (Toro): cantidad
  - VA (Vaca): cantidad
  - VQ (Vaquillona): cantidad
  - NO (Novillo): cantidad
  - NT (Novillito): cantidad
  - MEJ (Mejor): cantidad

**5. Asignación de Corral:**
| Campo | Tipo | Ejemplo | ¿De dónde sale? |
|-------|------|---------|-----------------|
| Corral Destino | Select | "D1" | De lista de corrales disponibles |

**6. Pesaje del Camión:**
| Campo | Tipo | Ejemplo | ¿De dónde sale? |
|-------|------|---------|-----------------|
| Peso Bruto | Número | 45000 | Se lee de la balanza |
| Peso Tara | Número | 15000 | Se lee de la balanza |
| Peso Neto | Auto | 30000 | Se calcula: Bruto - Tara |

### ¿Qué pasa al guardar?
1. Se crea un **ticket de pesaje** con número automático
2. Se crea una **Tropa** con código automático (ej: "B 2026 0001")
3. Se crean los **registros de animales** individuales
4. Se actualiza el **stock del corral**

### Flujo de estados de la Tropa:
```
RECIBIDO → EN_CORRAL → EN_PESAJE → PESADO → LISTO_FAENA → EN_FAENA → FAENADO → DESPACHADO
```

---

## 📝 PASO 4: MOVIMIENTO DE HACIENDA

### ¿Qué es?
Mover animales entre corrales.

### ¿Qué datos se ingresan?
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Corral Origen | Select | "D1" |
| Corral Destino | Select | "D2" |
| Cantidad | Número | 5 |
| Especie | Select | "BOVINO" |
| Observaciones | Texto | "Animales para faena mañana" |

### ¿Qué pasa al guardar?
- Se resta del stock del corral origen
- Se suma al stock del corral destino
- Se registra el movimiento en el historial

---

## 📝 PASO 5: PESAJE INDIVIDUAL

### ¿Qué es?
Pesar cada animal **uno por uno** antes de la faena.

### ¿Qué datos se ingresan?
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Tropa | Select | "B 2026 0001" |
| Número de Animal | Número | 1 |
| Caravana | Texto | "CAR001" (opcional) |
| Peso Vivo | Número | 450 (kg) |

### ¿Qué pasa al guardar?
- Se actualiza el peso del animal
- El estado del animal cambia a "PESADO"
- Se puede ver el peso total de la tropa

---

## 📝 PASO 6: LISTA DE FAENA

### ¿Qué es?
La lista de animales que se van a faenar **ese día**.

### ¿Qué datos se ingresan?

**1. Crear Lista de Faena:**
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Fecha | Fecha | "2026-01-15" |
| Cantidad Total | Auto | Se calcula de las tropas |

**2. Agregar Tropas a la Lista:**
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Tropa | Select | "B 2026 0001" |
| Cantidad | Número | 10 (animales de esta tropa) |

**3. Asignar Garrones:**
- Cada animal recibe un número de garrón correlativo (1, 2, 3...)
- El garrón identifica al animal durante toda la faena

### ¿Qué pasa al cerrar la lista?
- Estado cambia a "CERRADA"
- No se pueden agregar más tropas
- Los animales pasan a estado "EN_FAENA"

---

## 📝 PASO 7: ROMANEO (Pesaje de Medias Reses)

### ¿Qué es?
Después de faenar, cada animal se divide en **dos medias reses**. 
Se pesan y clasifican.

### ¿Qué datos se ingresan?

**Para cada animal (garrón):**
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Garrón | Número | 1 |
| Dentición | Número | 2 (cantidad de dientes) |
| Peso Media Izquierda | Número | 120 kg |
| Peso Media Derecha | Número | 118 kg |
| Tipificador | Select | "María López" |
| Observaciones | Texto | Opcional |

### ¿Qué se calcula automáticamente?
- **Peso Total**: Izquierda + Derecha = 238 kg
- **Rinde**: (Peso Total / Peso Vivo) × 100 = 52.8%

### ¿Qué pasa al guardar?
- Se crean 2 registros de **MediaRes** (izquierda y derecha)
- Se generan **códigos de barras** para cada media
- Se actualiza el stock de la cámara

---

## 📝 PASO 8: INGRESO A CAJÓN / CÁMARA

### ¿Qué es?
Registrar en qué cámara frigorífica se guarda cada media res.

### ¿Qué datos se ingresan?
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Garrón | Número | 1 |
| Media | Select | "Izquierda" o "Derecha" |
| Cámara | Select | "Cámara 1" |
| Fecha/Hora | Auto | Fecha actual |

### ¿Qué pasa al guardar?
- La media res queda ubicada en una cámara
- Se actualiza el stock de la cámara

---

## 📝 PASO 9: STOCK EN CÁMARAS

### ¿Qué es?
Ver cuántas medias reses hay en cada cámara.

### ¿Qué datos se muestran?
| Cámara | Cantidad | Peso Total |
|--------|----------|------------|
| Cámara 1 | 45 | 5,400 kg |
| Cámara 2 | 30 | 3,600 kg |

---

## 📝 PASO 10: EXPEDICIÓN (Salida de Productos)

### ¿Qué es?
Registrar la salida de productos hacia el cliente.

### ¿Qué datos se ingresan?
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Cliente | Select | "Juan Matarife" |
| Destino | Texto | "Buenos Aires" |
| Remito | Texto | "REM-0001" |
| Patente | Texto | "AB123CD" |
| Productos | Lista | Medias reses seleccionadas |

### ¿Qué pasa al guardar?
- Las medias reses pasan a estado "DESPACHADO"
- Se descuentan del stock de la cámara

---

## 📝 PASO 11: FACTURACIÓN

### ¿Qué es?
Generar facturas por los servicios prestados.

### ¿Qué datos se ingresan?
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Cliente | Select | "Juan Matarife" |
| Tipo | Select | "Factura A" |
| Punto de Venta | Número | 1 |
| Fecha | Fecha | "2026-01-15" |
| Detalles | Lista | Productos y precios |

---

## 🔄 RESUMEN DEL FLUJO COMPLETO

```
1. LOGIN → Ingresar usuario y contraseña

2. PESAJE CAMIÓN → Llega camión con animales
   ↓
   Se crea TROPA con código único
   ↓
   Animales van al CORRAL

3. PESAJE INDIVIDUAL → Pesar cada animal

4. LISTA DE FAENA → Programar qué animales se faenan hoy
   ↓
   Asignar GARRONES (números identificatorios)

5. ROMANEO → Faenar y pesar medias reses
   ↓
   Se crean 2 MEDIAS RESES por animal
   ↓
   Se generan CÓDIGOS DE BARRAS

6. CÁMARA → Guardar medias reses en cámara fría

7. EXPEDICIÓN → Despachar productos al cliente

8. FACTURACIÓN → Facturar servicios
```

---

## ⚠️ POSIBLES PUNTOS DE FALLA A VERIFICAR

1. **¿Qué pasa si no hay corrales disponibles?**
2. **¿Qué pasa si el pesaje individual no coincide con la tropa?**
3. **¿Qué pasa si se intenta faenar más animales de los que hay?**
4. **¿Qué pasa si el rinde es muy bajo?** (¿hay alertas?)
5. **¿Se puede deshacer una lista de faena cerrada?**
6. **¿Qué pasa si se pierde la conexión a la base de datos?**

---

*Documento generado para testing del sistema - Enero 2026*
