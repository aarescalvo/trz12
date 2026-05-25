# Módulo: Rotulos/Labels Mejoras

## Prioridad: ALTA

## Descripción
Editor visual avanzado para diseñar y gestionar etiquetas ZPL/DPL para impresoras Zebra y Datamax.

## Funcionalidades

### Editor Visual
- **Arrastrar y Soltar**: Posicionamiento visual de elementos en la etiqueta
- **Tipos de Elementos**:
  - Texto (fijo o variable)
  - Código de barras (CODE128, CODE39, EAN-13, etc.)
  - Código QR
  - Líneas y rectángulos
  - Imágenes
- **Vista Previa en Tiempo Real**: Visualización del resultado antes de imprimir

### Gestión de Plantillas
- Crear, editar, duplicar y eliminar plantillas
- Organizar por tipo (Media Res, Cuarto, Menudencia, etc.)
- Establecer plantilla por defecto para cada tipo

### Configuración de Impresora
- Soporte para Zebra (ZPL) y Datamax (DPL)
- Modelos soportados:
  - Zebra: ZT410, ZT230, ZD420, ZD620, GK420
  - Datamax: Mark II, I-4208, I-4212, I-4406
- Configuración automática de DPI según modelo

### Variables Disponibles
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{NUMERO}}` | Número de animal | 15 |
| `{{TROPA}}` | Código de tropa | B 2026 0012 |
| `{{TIPO}}` | Tipo de animal | VA |
| `{{PESO}}` | Peso | 452 |
| `{{CODIGO}}` | Código completo | B20260012-015 |
| `{{RAZA}}` | Raza | Angus |
| `{{FECHA}}` | Fecha actual | 20/03/2026 |
| `{{FECHA_VENC}}` | Fecha vencimiento | 19/04/2026 |
| `{{GARRON}}` | Número de garrón | 42 |
| `{{LADO}}` | Lado (I/D) | I |
| `{{SIGLA}}` | Sigla | A |
| `{{USUARIO_FAENA}}` | Usuario faena | Juan Pérez |
| `{{MATRICULA}}` | Matrícula | 12345 |
| `{{CODIGO_BARRAS}}` | Código de barras | B202600120151 |

## Dependencias
- `@/components/ui/*` - Componentes de UI (Card, Button, Input, etc.)
- `lucide-react` - Iconos
- `sonner` - Notificaciones toast

## Modelos Prisma Utilizados
- `Rotulo` - Plantillas de rótulos
- `RotuloElemento` - Elementos de cada rótulo

## APIs Utilizadas
- `GET /api/rotulos` - Listar rótulos
- `POST /api/rotulos` - Crear rótulo
- `PUT /api/rotulos` - Actualizar rótulo
- `DELETE /api/rotulos` - Eliminar rótulo
- `POST /api/rotulos/imprimir` - Imprimir etiqueta
- `POST /api/rotulos/importar` - Importar archivo ZPL/DPL

## Cómo Implementar

1. **Agregar al menú de navegación**:
```typescript
// En page.tsx, NAV_GROUPS
{ id: 'configRotulosMejoras', label: 'Diseñador Etiquetas', icon: Tag, permiso: 'puedeConfiguracion' }
```

2. **Agregar import**:
```typescript
import { RotulosMejorasModule } from '@/modules-pending/rotulos-mejoras'
```

3. **Agregar caso en switch**:
```typescript
case 'configRotulosMejoras':
  return wrapModule('configRotulosMejoras', <RotulosMejorasModule operador={operador} />)
```

## Mejoras Futuras
- [ ] Editor de arrastrar y soltar completo
- [ ] Importación de archivos .lbl (Zebra Designer)
- [ ] Galería de plantillas predefinidas
- [ ] Historial de cambios
- [ ] Aprobación de plantillas por supervisor
- [ ] Integración con productos para auto-asignación

## Estado
- **Creado**: Pendiente de implementación
- **Versión**: 3.7.17
