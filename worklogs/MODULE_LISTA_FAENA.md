# WORKLOG - MÓDULO LISTA DE FAENA

---

## Especificaciones Funcionales

### Flujo
```
1. Crear lista de faena (fecha, número automático)
2. Agregar tropas EN_CORRAL a la lista
3. Asignar garrones secuenciales a cada animal
4. Cerrar lista → Tropas pasan a EN_FAENA
5. Romaneo pesa los garrones asignados
```

### Estados de ListaFaena
- ABIERTA: Agregando tropas
- EN_PROCESO: Asignando garrones
- CERRADA: Lista completa, lista para romaneo
- ANULADA: Cancelada

### Asignación de Garrones
```
Garrones secuenciales: 001, 002, 003...
Un garrón por animal
El orden respeta el orden de las tropas agregadas
```

---

## Historial de Cambios

### 2026-03-07 - Funcionalidad completa
- **Archivo**: `/src/components/lista-faena/index.tsx` (604 líneas)
- Crear lista de faena
- Agregar/quitar tropas
- Asignar garrones automáticamente
- Cerrar lista

---

## APIs del Módulo

### GET /api/lista-faena
Listar listas de faena

### POST /api/lista-faena
Crear nueva lista

### GET /api/lista-faena/tropas
Tropas disponibles (EN_CORRAL)

### POST /api/lista-faena/tropas
Agregar tropa a lista

### POST /api/lista-faena/asignar
Asignar garrones a animales

### POST /api/lista-faena/cerrar
Cerrar lista de faena

---

## Archivos Relacionados

```
/src/components/lista-faena/index.tsx
/src/app/api/lista-faena/route.ts
/src/app/api/lista-faena/tropas/route.ts
/src/app/api/lista-faena/asignar/route.ts
/src/app/api/lista-faena/cerrar/route.ts
/prisma/schema.prisma  # ListaFaena, ListaFaenaTropa, AsignacionGarron
```
