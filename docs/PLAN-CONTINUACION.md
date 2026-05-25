# TrazaSole - Plan de Continuacion y Prevencion de Errores

## Version Estable: 3.7.15

---

## Analisis de Problemas Anteriores

### Causas de los Errores
1. **TailwindCSS v4**: Nueva sintaxis `@import "tailwindcss"` causaba errores de resolucion en Windows
2. **Turbopack (Next.js 16)**: Por defecto en Next.js 16, causa crashes en Windows con `aggregation_update.rs`
3. **Modificaciones CSS sin prueba previa**: Cambios visuales no deseados

---

## Reglas de Trabajo Para Evitar Problemas

### 1. ANTES de Modificar Archivos Criticos
```
❌ NO modificar sin autorizacion:
   - src/app/globals.css
   - tailwind.config.ts
   - postcss.config.mjs
   - next.config.ts

✅ SIEMPRE:
   - Preguntar antes de tocar configuracion de estilos
   - Probar cambios visuales en desarrollo primero
   - Hacer backup antes de cambios importantes
```

### 2. Flujo de Trabajo Seguro
```
1. Hacer backup (backup-sistema.bat)
2. Implementar modulo/feature
3. Probar en desarrollo
4. Si hay errores CSS/Tailwind → NO cambiar config
5. Commit con version incremental (3.7.x → 3.7.y)
6. Push a desarrollo1 primero
7. Si funciona → Push a produccion1
```

### 3. Control de Versiones
```
Version formato: 3.MAJOR.MINOR

- MINOR (+1): Nuevas features, correcciones
- MAJOR (+1): Cambios estructurales (requiere autorizacion)

Ejemplo: 3.7.15 → 3.7.16 (nuevo modulo)
```

---

## Modulos Pendientes (Prioridad)

### ALTA PRIORIDAD
1. **Rotulos/Labels** - Mejoras en disenador de etiquetas
2. **Auditoria por Operador** - Registro de acciones por usuario

### MEDIA PRIORIDAD
3. **Historial de Precios** - Servicios y productos
4. **Reportes Gerenciales** - Mejoras

### BAJA PRIORIDAD
5. **Mejoras UI** - Solo si el usuario lo solicita

---

## Procedimiento Para Cada Modulo

### Paso 1: Preparacion
```powershell
cd C:\TrazaSole
.\backup-sistema.bat
```

### Paso 2: Desarrollo
- Implementar solo el modulo solicitado
- NO tocar archivos de configuracion
- NO modificar estilos globales

### Paso 3: Prueba
- Verificar que la visual no cambio
- Verificar que no hay errores en consola
- Verificar que el login funciona

### Paso 4: Commit y Push
```bash
git add -A
git commit -m "v3.7.16 - Modulo X implementado"
git push origin master
```

---

## Contacto Ante Errores

Si aparece algun error:
1. NO intentar arreglar inmediatamente
2. Documentar el error exacto
3. Consultar antes de hacer cambios
4. Si es necesario, revertir a v3.7.15 (version estable conocida)

---

## Backup de Emergencia

Para volver a la version estable:
```powershell
cd C:\TrazaSole
git fetch origin
git reset --hard v3.7.15
bun install
```

---

**Fecha de creacion**: 2025-01-XX
**Ultima version estable verificada**: 3.7.15
