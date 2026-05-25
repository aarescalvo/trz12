# WORKLOG - MÓDULO ROMANEO

---

## Especificaciones Funcionales

### Proceso de Pesaje
- **2 etapas**: Primero MEDIA DER, luego MEDIA IZQ
- **Garrones secuenciales**: El operador no elige, se ofrecen en orden
- **Tipificador único**: Se configura al inicio de cada faena

### Siglas Disponibles
| Sigla | Significado | Parte de la media |
|-------|-------------|-------------------|
| A | Asado | Costillar |
| T | Trasero | Cuartos traseros |
| D | Delantero | Cuartos delanteros |

### Rótulos por Animal (6 total)
```
MEDIA DERECHA: A-DER, T-DER, D-DER
MEDIA IZQUIERDA: A-IZQ, T-IZQ, D-IZQ
```

### Código de Barras
```
Formato: {tropa}-{garron}-{sigla}-{lado}-{kg}
Ejemplo: B20260059-001-A-DER-80.8
```

### Decomiso
- Checkbox por media (DER/IZQ)
- Decomiso total: ambas medias
- Input manual de KG decomisados

---

## Historial de Cambios

### 2026-03-07 - Rediseño completo
- **Archivo**: `/src/components/romaneo/index.tsx` (616 líneas)
- **API**: `/src/app/api/romaneo/route.ts` - GET, POST, PUT
- **API nueva**: `/src/app/api/romaneo/tropa/route.ts` - GET tropas en faena

**Cambios realizados:**
1. Layout de 3 paneles (Tropa info | Pesaje | Próximos)
2. Selección secuencial de garrones
3. Pesaje en 2 etapas (DER → IZQ)
4. Checkboxes de decomiso por media
5. Guardado de tipificador por faena
6. Generación de código de barras

**Estados de garrón:**
- PENDIENTE: Sin pesar
- SOLO_DER: Solo media derecha pesada
- SOLO_IZQ: Solo media izquierda pesada
- COMPLETO: Ambas medias pesadas
- DECOMISO: Animal decomisado

---

## Pendientes

- [ ] Conexión con balanza RS232
- [ ] Impresión de rótulos físicos
- [ ] Reimpresión de rótulos
- [ ] Historial de romaneos por tropa

---

## APIs del Módulo

### GET /api/romaneo/tropa
Lista tropas en EN_FAENA con garrones y estados

### GET /api/romaneo
- Lista todos los romaneos
- Buscar por garrón: `?garron=001`
- Buscar por tropa: `?tropaId=xxx` o `?tropaCodigo=B20260059`

### POST /api/romaneo
Crear nuevo romaneo (cuando no existe)

### PUT /api/romaneo
Actualizar romaneo existente

---

## Archivos Relacionados

```
/src/components/romaneo/index.tsx    # UI principal
/src/app/api/romaneo/route.ts        # API principal
/src/app/api/romaneo/tropa/route.ts  # API de tropas
/prisma/schema.prisma                # Modelo Romaneo, MediaRes
```
