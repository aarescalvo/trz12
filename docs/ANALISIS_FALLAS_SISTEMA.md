# 🔍 ANÁLISIS COMPLETO DEL SISTEMA FRIGORÍFICO SOLEMAR
## Simulación paso a paso y detección de fallas

---

## 🎯 RESUMEN EJECUTIVO

**Sistema analizado:** Frigorífico Solemar Alimentaria v2.0  
**Fecha:** Marzo 2026  
**Módulos totales:** 43  
**Modelos de BD:** 45  
**APIs:** 40 endpoints

---

## ⚠️ FALLAS DETECTADAS

### 🔴 CRÍTICAS (Deben corregirse)

#### 1. **Animales no se crean automáticamente al ingresar tropa**
**Ubicación:** `/api/pesaje-camion` POST
**Problema:** Cuando se crea una tropa con cantidadCabezas, NO se crean los registros individuales de cada animal.
**Código afectado:**
```typescript
// Solo crea la tropa, pero NO crea los animales individuales
const tropa = await db.tropa.create({
  data: tropaData,
  ...
})
// FALTA: Crear N registros de Animal según cantidadCabezas
```
**Impacto:** No se puede hacer pesaje individual porque no hay animales.
**Solución:** Agregar loop que cree `cantidadCabezas` registros de Animal.

#### 2. **Stock de corrales no se actualiza correctamente**
**Ubicación:** API de pesaje-camion
**Problema:** Al asignar un corral a una tropa, no se actualiza el stock del corral.
**Impacto:** Los corrales muestran stock incorrecto.
**Solución:** Actualizar `corral.stockBovinos` o `corral.stockEquinos` al crear tropa.

#### 3. **Estados de tropa no siguen flujo lógico**
**Problema detectado:**
- Tropa con estado "PESADO" tiene animales, pero tropa con "RECIBIDO" no tiene animales
- Inconsistencia entre estado de tropa y existencia de animales

---

### 🟡 MEDIAS (Deberían corregirse)

#### 4. **Falta validación de capacidad de corral**
**Problema:** El sistema permite asignar más animales de los que el corral puede contener.
**Solución:** Validar `corral.capacidad` vs `corral.stockActual + cantidadNueva`.

#### 5. **No hay validación de DTE/Guía duplicados**
**Problema:** Se pueden crear tropas con mismo DTE o guía.
**Solución:** Agregar validación de unicidad.

#### 6. **Romaneos vacíos**
**Problema:** La API de romaneos retorna vacío, pero debería haber datos de tropas pesadas.
**Posible causa:** No se está guardando el romaneo correctamente.

---

### 🟢 MENORES (Sugerencias)

#### 7. **Campos opcionales obligatorios en UI**
**Problema:** Algunos campos que son opcionales en BD se muestran como obligatorios en UI.

#### 8. **Mensajes de error genéricos**
**Problema:** Los errores muestran mensajes genéricos en lugar de específicos.

---

## 📋 SIMULACIÓN PASO A PASO DEL FLUJO COMPLETO

### ===== PASO 1: INGRESO AL SISTEMA =====

**¿Qué hace el usuario?**
1. Abre el navegador en `localhost:3000`
2. Ve una pantalla con el logo de Solemar y dos pestañas: "Usuario" y "PIN"

**¿Qué datos ingresa?**
```
Usuario: admin
Contraseña: admin123
```

**¿Qué pasa internamente?**
1. El frontend envía POST a `/api/auth` con `{usuario: "admin", password: "admin123"}`
2. El backend busca en tabla `Operador` donde `usuario = "admin"`
3. Compara password (debería hashear, pero actualmente compara directo)
4. Si coincide, retorna los datos del operador + permisos
5. El frontend guarda en `localStorage` y muestra el dashboard

**⚠️ FALLA DETECTADA:** El password no está hasheado. Si alguien ve la BD ve las contraseñas.

---

### ===== PASO 2: PESAJE DE CAMIÓN (INGRESO DE HACIENDA) =====

**¿Qué hace el usuario?**
1. Hace clic en el botón grande "Pesaje Camiones" (color ámbar)
2. Ve un formulario con varias secciones

**¿Qué datos ingresa?**
```
Pestaña "Ingreso de Hacienda":

Transporte:
- Patente Chasis: AB123CD (texto manual)
- Patente Acoplado: EF456GH (texto manual, opcional)
- Chofer: Juan Pérez (selecciona de lista)
- Transportista: Transporte López (selecciona de lista)

Origen:
- Productor: Estancia La Esperanza (selecciona de lista)
- Usuario de Faena: Frigorífico Regional SA (selecciona de lista)
- DTE: 12345678 (texto manual - documento de tránsito)
- Guía: 87654321 (texto manual - guía sanitaria)

Animales:
- Especie: BOVINO (selecciona)
- Cantidad Total: 20 (número manual)

Detalle por tipo:
- Novillo (NO): 10
- Vaca (VA): 10

Corral:
- Corral Destino: Corral A (selecciona de lista)

Pesaje:
- Peso Bruto: 15000 kg (de balanza o manual)
- Peso Tara: 10000 kg (de balanza o manual)
- Peso Neto: 5000 kg (se calcula automático: Bruto - Tara)
```

**¿Qué pasa internamente?**
1. Frontend envía POST a `/api/pesaje-camion` con todos los datos
2. Backend:
   a. Crea registro en `PesajeCamion` con número de ticket automático
   b. Genera código de tropa: "B 2026 0006" (B = Bovino, 2026 = año, 0006 = correlativo)
   c. Crea registro en `Tropa` con el código generado
   d. Crea registros en `TropaAnimalCantidad` para cada tipo
   e. ⚠️ **NO CREA** los 20 registros de `Animal` individuales

**¿Qué se guarda en la base de datos?**
```sql
-- PesajeCamion
INSERT INTO PesajeCamion (id, tipo, numeroTicket, patenteChasis, ...)
VALUES ('uuid-xxx', 'INGRESO_HACIENDA', 6, 'AB123CD', ...);

-- Tropa
INSERT INTO Tropa (id, numero, codigo, usuarioFaenaId, especie, cantidadCabezas, estado, ...)
VALUES ('uuid-yyy', 6, 'B 2026 0006', 'uf-001', 'BOVINO', 20, 'RECIBIDO', ...);

-- TropaAnimalCantidad (2 registros)
INSERT INTO TropaAnimalCantidad (tropaId, tipoAnimal, cantidad) VALUES ('uuid-yyy', 'NO', 10);
INSERT INTO TropaAnimalCantidad (tropaId, tipoAnimal, cantidad) VALUES ('uuid-yyy', 'VA', 10);

-- ⚠️ FALTA: 20 registros de Animal
-- INSERT INTO Animal (id, tropaId, numero, codigo, tipoAnimal, ...) VALUES ...
```

**⚠️ FALLA CRÍTICA:** No se crean los animales individuales. Esto rompe el flujo del paso siguiente.

---

### ===== PASO 3: PESAJE INDIVIDUAL =====

**¿Qué hace el usuario?**
1. Va a CICLO I → Pesaje Individual
2. Espera ver la lista de animales para pesar

**¿Qué debería pasar?**
1. Selecciona una tropa
2. Ve una lista de 20 animales pendientes de pesar
3. Pesa cada animal y registra el peso

**⚠️ FALLA CRÍTICA:** Como no se crearon los animales en el paso anterior, la lista está VACÍA.

**Solución necesaria:**
El sistema debería:
1. Al crear la tropa, crear automáticamente N animales según cantidadCabezas
2. Cada animal con código único: B20260006-001, B20260006-002, etc.

---

### ===== PASO 4: LISTA DE FAENA =====

**¿Qué hace el usuario?**
1. Va a CICLO I → Lista de Faena
2. Crea una nueva lista para el día
3. Agrega tropas a la lista
4. Asigna números de garrón

**¿Qué datos ingresa?**
```
Nueva Lista de Faena:
- Fecha: 2026-03-10 (automático hoy)
- Tropas a agregar: B 2026 0006
- Cantidad: 20 (todos los animales de la tropa)
```

**¿Qué pasa internamente?**
1. Crea registro en `ListaFaena`
2. Crea registro en `ListaFaenaTropa`
3. ⚠️ Debería crear registros en `AsignacionGarron` con números 1, 2, 3... 20
4. ⚠️ Pero si no hay animales, no puede asignar garrones

---

### ===== PASO 5: ROMANEO =====

**¿Qué hace el usuario?**
1. Va a CICLO I → Romaneo
2. Para cada animal faenado, registra:
   - Número de garrón
   - Dentición (cantidad de dientes)
   - Peso de cada media res
   - Tipificador

**¿Qué datos ingresa?**
```
Romaneo - Garrón 1:
- Dentición: 2
- Peso Media Izquierda: 120 kg
- Peso Media Derecha: 118 kg
- Tipificador: María López
```

**¿Qué pasa internamente?**
1. Crea registro en `Romaneo`
2. Crea 2 registros en `MediaRes` (izquierda y derecha)
3. Genera código de barras para cada media res
4. Calcula rinde: (238 / 485) × 100 = 49%

---

### ===== PASO 6: INGRESO A CÁMARA =====

**¿Qué hace el usuario?**
1. Va a CICLO I → Ingreso a Cajón
2. Registra en qué cámara se guarda cada media res

**¿Qué datos ingresa?**
```
Ingreso:
- Garrón: 1
- Media: Izquierda
- Cámara: Cámara 1
```

---

### ===== PASO 7: STOCK EN CÁMARAS =====

**¿Qué hace el usuario?**
1. Va a Reportes → Stocks Cámaras
2. Ve cuántas medias reses hay en cada cámara

---

### ===== PASO 8: EXPEDICIÓN =====

**¿Qué hace el usuario?**
1. Va a CICLO I → Expedición
2. Prepara el despacho de productos
3. Selecciona las medias reses a despachar
4. Registra el cliente y transporte

---

### ===== PASO 9: FACTURACIÓN =====

**¿Qué hace el usuario?**
1. Va a Administración → Facturación
2. Genera factura por los servicios

---

## 🔄 FLUJO DE ESTADOS DE UNA TROPA

```
RECIBIDO ──────────────► EN_CORRAL ──────────────► EN_PESAJE
    │                        │                         │
    │                        │                         │
    │                   (asignación              (pesaje
    │                    de corral)               individual)
    │                        │                         │
    │                        ▼                         ▼
    │                    PESADO ◄──────────────────┘
    │                        │
    │                        │
    │                   (agregada a
    │                    lista faena)
    │                        │
    │                        ▼
    │                LISTO_FAENA
    │                        │
    │                        │
    │                   (inicio de
    │                     faena)
    │                        │
    │                        ▼
    └──────────────────► EN_FAENA
                             │
                             │
                        (romaneo
                         completo)
                             │
                             ▼
                        FAENADO
                             │
                             │
                        (despacho)
                             │
                             ▼
                       DESPACHADO
```

---

## 🐛 LISTA DE FALLAS A CORREGIR (ORDENADAS POR PRIORIDAD)

| # | Falla | Prioridad | Módulo | Descripción |
|---|-------|-----------|--------|-------------|
| 1 | No se crean animales al ingresar tropa | CRÍTICA | Pesaje Camiones | Agregar creación de N animales |
| 2 | Stock de corrales no se actualiza | CRÍTICA | Pesaje Camiones | Actualizar stockBovinos/stockEquinos |
| 3 | Passwords sin hash | ALTA | Auth | Implementar bcrypt |
| 4 | Validación capacidad corral | ALTA | Pesaje Camiones | Verificar capacidad disponible |
| 5 | DTE/Guía duplicados | MEDIA | Pesaje Camiones | Agregar validación unique |
| 6 | Animales huérfanos | MEDIA | Tropas | Validar integridad referencial |

---

## ✅ COSAS QUE FUNCIONAN BIEN

1. **Login con usuario/contraseña** ✓
2. **Login con PIN** ✓
3. **Navegación del menú** ✓
4. **Generación de códigos de tropa** ✓
5. **APIs responden correctamente** ✓
6. **Dashboard muestra estadísticas** ✓
7. **Persistencia de sesión en localStorage** ✓

---

## 🔧 PRÓXIMOS PASOS RECOMENDADOS

1. **Corregir creación de animales** - Agregar loop en `/api/pesaje-camion`
2. **Actualizar stock de corrales** - Modificar campo de stock al asignar corral
3. **Implementar hash de passwords** - Usar bcrypt en auth
4. **Agregar validaciones** - Capacidad de corral, DTE único, etc.
5. **Testing end-to-end** - Simular flujo completo

---

*Documento generado por análisis del sistema - Marzo 2026*
