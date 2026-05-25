# WORKLOG - MÓDULO PESAJE CAMIONES

---

## Especificaciones Funcionales

### Tipos de Operación
- **INGRESO_HACIENDA**: Recepción de animales
- **EGRESO**: Salida de productos

### Flujo de Ingreso
```
1. Seleccionar transportista
2. Ingresar patentes (camión + acoplado)
3. Ingresar conductor
4. Seleccionar productor (Cliente)
5. Seleccionar usuario de faena (Cliente)
6. Ingresar DTE y guía
7. Contar animales por tipo (TO, VA, VQ, etc.)
8. Pesaje bruto (camión + carga)
9. Pesaje tara (camión vacío)
10. Calcular peso neto
11. Asignar corral disponible
12. Crear tropa con código automático
```

### Código de Tropa
```
Formato: {ESPECIE}{AÑO}{SECUENCIAL}
B20260001 = Bovino año 2026, tropa 001
E20260001 = Equino año 2026, tropa 001
```

---

## Historial de Cambios

### 2026-03-07 - Modularización
- **Directorio**: `/src/components/pesaje-camiones/`
- Archivos creados:
  - `index.tsx` (700 líneas) - Componente principal
  - `QuickAddDialog.tsx` - Diálogo agregar rápido
  - `TipoAnimalCounterGrid.tsx` - Grid de conteo
  - `usePesajeCamiones.ts` - Hook personalizado
  - `types.ts` - Tipos TypeScript
  - `constants.ts` - Constantes

### 2026-03-07 - Fix error compiling
- Problema: Next.js 16 params Promise
- Solución: async/await en todos los save operations

---

## Pendientes

- [ ] Conexión con balanza camiones RS232
- [ ] Impresión de ticket de pesaje
- [ ] Edición de pesajes cerrados (solo supervisor)

---

## APIs del Módulo

### GET /api/pesaje-camion
Lista pesajes con filtros

### POST /api/pesaje-camion
Crear pesaje:
```json
{
  "tipoOperacion": "INGRESO_HACIENDA",
  "transportistaId": "...",
  "patenteCamion": "AB123CD",
  "patenteAcoplado": "EF456GH",
  "conductor": "Juan Pérez",
  "productorId": "...",
  "usuarioFaenaId": "...",
  "dte": "12345678",
  "guia": "87654321",
  "animales": {
    "TO": 5,
    "VA": 10,
    "VQ": 3
  },
  "pesoBruto": 15000,
  "pesoTara": 5000,
  "corralId": "..."
}
```

### PUT /api/pesaje-camion
Actualizar pesaje existente

---

## Archivos Relacionados

```
/src/components/pesaje-camiones/       # Módulo modularizado
/src/app/api/pesaje-camion/route.ts   # API
/prisma/schema.prisma                  # Modelo PesajeCamion, Tropa
```
