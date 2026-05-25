# 📖 Manual de Usuario - Sistema Frigorífico

## Solemar Alimentaria - CICLO I

---

## 🔐 Inicio de Sesión

### Métodos de Acceso

| Método | Uso |
|--------|-----|
| **Usuario + Contraseña** | Acceso completo, escritorio |
| **PIN (4-6 dígitos)** | Acceso rápido, pantallas táctiles |

### Usuarios Predefinidos

| Usuario | Contraseña | PIN | Permisos |
|---------|------------|-----|----------|
| admin | admin123 | 1234 | Todos los módulos |
| supervisor | super123 | 2222 | Operativos + Reportes |
| balanza | balanza123 | 1111 | Solo pesaje |

---

## 📋 Flujo de Trabajo Principal

### 1️⃣ Recepción de Hacienda (Pesaje Camiones)

```
Camión llega → Pesaje Bruto → Verificar DTE → Asignar Corral → Pesaje Tara → Tropa Creada
```

**Pasos:**
1. Ir a **Pesaje Camiones**
2. Clic en **"Nuevo Pesaje"**
3. Seleccionar tipo: INGRESO HACIENDA
4. Ingresar datos del camión:
   - Patente chasis (obligatorio)
   - Patente acoplado
   - Nombre del chofer
   - DNI del chofer
5. Seleccionar transportista
6. Ingresar peso bruto (pesar camión con animales)
7. Completar datos de la tropa:
   - Usuario de faena (quién faena)
   - Productor (opcional)
   - DTE (Documento de Tránsito)
   - Guía de tránsito
   - Tipos y cantidad de animales
8. Clic en **"Crear Tropa"**
9. El sistema asigna corral automáticamente
10. Cuando el camión descarga, hacer **Tara** (peso vacío)

---

### 2️⃣ Pesaje Individual

```
Animales en corral → Pesaje uno por uno → Estado: PESADO
```

**Pasos:**
1. Ir a **Pesaje Individual**
2. Seleccionar tropa de la lista
3. Para cada animal:
   - Ingresar número o escanear caravana
   - El sistema muestra el peso (si hay balanza conectada)
   - Confirmar peso
4. Al terminar todos los animales, la tropa queda **PESADA**

---

### 3️⃣ Lista de Faena

```
Tropas pesadas → Crear lista del día → Asignar garrones → Faena
```

**Pasos:**
1. Ir a **Lista de Faena**
2. Seleccionar fecha (hoy por defecto)
3. Agregar tropas a la lista
4. Indicar cantidad de animales de cada tropa
5. Clic en **"Asignar Garrones"**
6. El sistema asigna números correlativos
7. Imprimir lista para la playa de faena

---

### 4️⃣ Romaneo (Pesaje de Medias Reses)

```
Animal faenado → Media res izquierda → Media res derecha → Rinde automático
```

**Pasos:**
1. Ir a **Romaneo**
2. Ingresar número de garrón
3. Registrar:
   - Peso media izquierda
   - Peso media derecha
   - Tipificación (A, B, C)
   - Número de dientes
   - Tipificador
4. El sistema calcula **RINDE** automáticamente:
   ```
   Rinde = (Peso Media Izq + Peso Media Der) / Peso Vivo × 100
   ```
5. Las medias reses quedan en stock de cámara

---

### 5️⃣ Despacho de Mercadería

```
Cliente solicita → Armar despacho → Orden de carga → Pesaje salida → Entrega
```

**Pasos:**
1. Ir a **Despacho**
2. Clic en **"Nuevo Despacho"**
3. Seleccionar cliente
4. Agregar productos desde el stock:
   - Seleccionar cámara
   - Clic en + para agregar cantidad
   - Los productos pasan al panel derecho
5. Completar datos de transporte:
   - Patentes
   - Chofer
   - DNI
6. Completar documentos:
   - Remito N°
   - Factura N°
   - Precintos
   - PTR (si corresponde)
7. Registrar temperaturas
8. **Guardar Despacho**
9. Generar **Orden de Carga** (imprimible)
10. Cuando el camión está listo, hacer **Pesaje de Salida**

---

## 📊 Reportes Disponibles

### Reporte de Faena
- Animales faenados por día
- Kilos producidos
- Rendimiento promedio

### Reporte de Rendimiento
- Por tropa
- Por productor
- Por tipo de animal

### Reporte de Stock
- Stock por cámara
- Stock por cliente
- Antigüedad de stock

---

## ⚙️ Configuración

### Operadores
- Crear usuarios
- Asignar permisos por módulo
- Establecer PIN de acceso rápido

### Corrales
- Definir capacidad
- Ver ocupación actual

### Cámaras
- Tipos: Faena, Cuarteo, Depósito
- Capacidad en ganchos o KG

### Clientes
- Productores
- Usuarios de faena
- Datos de contacto

### Productos
- Catálogo por especie
- Códigos para rótulos
- Días de conservación

---

## ❓ Preguntas Frecuentes

### ¿Cómo cambio mi contraseña?
1. Ir a Configuración → Operadores
2. Buscar tu usuario
3. Clic en editar
4. Ingresar nueva contraseña

### ¿Qué hago si se bloquea el sistema?
1. Presionar F5 para recargar
2. Si persiste, cerrar navegador y volver a abrir
3. Verificar conexión de red

### ¿Cómo imprimo un ticket?
1. En Pesaje Camiones, buscar el pesaje
2. Clic en "Ver Ticket"
3. Clic en "Imprimir"

### ¿Puedo anular una tropa?
Sí, ir a la tropa y cambiar estado a ANULADO. Esto revierte el stock de corral.

### ¿Cómo veo el historial de cambios?
En Configuración → Auditoría se registran todas las acciones.

---

## 📞 Soporte Técnico

- **GitHub Issues**: https://github.com/aarescalvo/trz5/issues
- **Administrador del sistema**: Consultar internamente

---

*Manual de Usuario v1.0 - Marzo 2026*
