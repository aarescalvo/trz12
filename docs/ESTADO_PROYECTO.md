# 📋 ESTADO DEL PROYECTO - SOLEMAR ALIMENTARIA

> **⚠️ CRÍTICO**: Este archivo debe actualizarse al final de CADA sesión de trabajo.
> **Última actualización**: 2026-03-09

---

## 🔗 REPOSITORIOS Y BACKUPS

| Tipo | URL | Estado |
|------|-----|--------|
| **GitHub** | https://github.com/aarescalvo/903 | ✅ Actualizado |
| **Google Drive** | https://drive.google.com/drive/folders/1PvCRIW5jiHKBg-xJLeVhZI9E7YqxFepF | ✅ Configurado |
| **Backup Local** | `/home/z/my-project/backups/` | ✅ Activo |

---

## 🔒 LO QUE YA ESTÁ HECHO (NO TOCAR SIN CONFIRMAR)

### ✅ Módulos Completos y Probados (26 módulos)

| # | Módulo | Archivo Frontend | Archivo API | Estado |
|---|--------|------------------|-------------|--------|
| 1 | Dashboard | `page.tsx` | `/api/dashboard` | ✅ OK |
| 2 | Pesaje Camiones | `pesaje-camiones/index.tsx` | `/api/pesaje-camion` | ✅ OK |
| 3 | Pesaje Individual | `pesaje-individual-module.tsx` | `/api/pesaje-individual` | ✅ OK |
| 4 | Movimiento Hacienda | `movimiento-hacienda-module.tsx` | `/api/tropas` | ✅ OK |
| 5 | Lista de Faena | `lista-faena/index.tsx` | `/api/lista-faena` | ✅ OK |
| 6 | VB Romaneo | `vb-romaneo/index.tsx` | `/api/garrones` | ✅ OK |
| 7 | Romaneo | `romaneo/index.tsx` | `/api/romaneo` | ✅ OK |
| 8 | Cuarteo | `cuarteo/index.tsx` | `/api/cuarteo` | ✅ OK |
| 9 | Ingreso Despostada | `ingreso-despostada/index.tsx` | `/api/ingreso-despostada` | ✅ OK |
| 10 | Movimiento Despostada | `movimiento-despostada/index.tsx` | `/api/movimiento-despostada` | ✅ OK |
| 11 | Empaque | `empaque/index.tsx` | `/api/empaque` | ✅ OK |
| 12 | Ingreso Cajón | `ingreso-cajon/index.tsx` | `/api/ingreso-cajon` | ✅ OK |
| 13 | Menudencias | `menudencias/index.tsx` | `/api/menudencias` | ✅ OK |
| 14 | Cueros | `cueros/index.tsx` | `/api/cueros` | ✅ OK |
| 15 | Grasa Dressing | `grasa-dressing/index.tsx` | `/api/grasa-dressing` | ✅ OK |
| 16 | Rendering | `rendering/index.tsx` | `/api/rendering` | ✅ OK |
| 17 | Insumos | `insumos/index.tsx` | `/api/insumos` | ✅ OK |
| 18 | Stock Cámaras | `stock-camaras/index.tsx` | `/api/stock-camaras` | ✅ OK |
| 19 | Expedición | `expedicion/index.tsx` | `/api/expedicion` | ✅ OK |
| 20 | Reportes | `reportes/index.tsx` | `/api/reportes` | ✅ OK |
| 21 | Planilla 01 | `planilla-01/index.tsx` | `/api/planilla01` | ✅ OK |
| 22 | Configuración | `configuracion/index.tsx` | Varios | ✅ OK |
| 23 | Rótulos | `configuracion-rotulos/index.tsx` | `/api/configuracion-rotulos` | ✅ OK |
| 24 | Facturación | `facturacion/index.tsx` | `/api/facturacion` | ✅ OK |
| 25 | CCIR | `cumplimiento-regulatorio/ccir.tsx` | `/api/ccir` | ✅ OK |
| 26 | Declaración Jurada | `cumplimiento-regulatorio/declaracion-jurada.tsx` | `/api/declaracion-jurada` | ✅ OK |

---

## 🎯 CONFIGURACIÓN DEL MENÚ (NO MODIFICAR SIN PEDIR)

El menú tiene **8 secciones** con los siguientes módulos:

### 1. OPERACIONES (6 módulos)
- Dashboard
- Pesaje Camiones
- Pesaje Individual
- Movimiento Hacienda
- Lista de Faena
- VB Romaneo

### 2. ROMANEO (2 módulos)
- Romaneo (visualización)
- Planilla 01

### 3. DESPOSTE (4 módulos)
- Cuarteo
- Ingreso a Despostada
- Movimiento Despostada
- Empaque

### 4. SUBPRODUCTOS (5 módulos)
- Ingreso a Cajón
- Menudencias
- Cueros
- Grasa Dressing
- Rendering

### 5. STOCK (2 módulos)
- Stock Cámaras
- Insumos

### 6. DESPACHO (2 módulos)
- Expedición
- Facturación

### 7. REPORTES (1 módulo)
- Reportes

### 8. CONFIGURACIÓN (1 módulo con 8 tabs)
- Frigorífico
- Corrales
- Cámaras
- Tipificadores
- Productos
- Clientes (Productores + Usuarios Faena)
- Transportistas
- Operadores (usuarios del sistema)

---

## 📝 CAMBIOS RECIENTES (últimas 3 sesiones)

### Sesión: 2026-03-09 (actual)
**Cambios:**
1. Creado sistema de backup para Google Drive
   - Script `scripts/backup.sh` para crear backup comprimido
   - Script `scripts/upload_gdrive.py` para subir automáticamente
   - Carpeta Google Drive configurada
2. Subido proyecto a GitHub nuevo repositorio
3. Creado archivo ESTADO_PROYECTO.md para tracking

**Archivos creados:**
- `scripts/backup.sh`
- `scripts/upload_gdrive.py`
- `scripts/README_BACKUP.md`
- `ESTADO_PROYECTO.md`

**Commits:**
- `9206ac7` feat: Configure Google Drive backup with user's folder ID
- `1853b31` feat: Add Google Drive backup system

---

### Sesión: 2026-03-04
**Cambios:**
1. Corregido error de hidratación en Operadores (Switch dentro de Button)
2. Agregados campos a Clientes/Usuarios Faena:
   - DNI
   - Localidad, Provincia, Código Postal
   - Contacto alternativo
   - Datos de facturación completos
   - Número de matrícula (para matarifes)
3. Actualizado schema Prisma con nuevos campos en modelo Cliente

**Archivos modificados:**
- `src/components/configuracion/operadores.tsx`
- `src/components/configuracion/clientes.tsx`
- `src/app/api/clientes/route.ts`
- `prisma/schema.prisma`

**Commit:** `b8c0d61` fix: Hydration error in Operadores, add complete client fields

---

## ⚠️ ERRORES CONOCIDOS Y CORREGIDOS

| Fecha | Error | Solución | Archivo |
|-------|-------|----------|---------|
| 2026-03-09 | Sin backup automático | Creado sistema de backup | `scripts/backup.sh` |
| 2026-03-04 | Switch dentro de Button (hidratación) | Separar Switch de Button | `configuracion/operadores.tsx` |
| 2026-03-04 | Clientes sin campos de facturación | Agregar campos completos | `configuracion/clientes.tsx` |

---

## 🚧 PENDIENTES

### Alta Prioridad
- [ ] Configurar credenciales Google Drive API en máquina local
- [ ] Probar módulo Clientes con nuevos campos

### Media Prioridad
- [ ] Implementar impresión real de rótulos (Datamax/Zebra)
- [ ] Sistema de auditoría automática
- [ ] Dashboard con gráficos

### Baja Prioridad
- [ ] Backup automático programado (cron)
- [ ] Búsqueda global

---

## 📌 REGLAS IMPORTANTES

### No olvidar:
1. **Usuarios** = Matarifes (personas que faenan, con matrícula)
2. **Operadores** = Usuarios del sistema (con login/PIN)
3. **Clientes** = Pueden ser Productores y/o Usuarios Faena
4. **SelectItem** nunca puede tener `value=""` → usar `value="TODOS"`
5. **Switch** nunca puede estar dentro de **Button**

### Antes de modificar:
1. Leer `FLUJOS.md` para entender el proceso
2. Verificar que el archivo no esté en uso en otro lugar
3. Confirmar con el usuario si el cambio es significativo

---

## 📋 RUTINA DE CADA SESIÓN

### Al EMPEZAR:
```
1. Leer ESTADO_PROYECTO.md ← ESTE ARCHIVO
2. Leer FLUJOS.md (para entender el negocio)
3. Ver el último commit: git log --oneline -5
4. Ver estado: git status
```

### Al TERMINAR:
```
1. Actualizar ESTADO_PROYECTO.md con lo hecho
2. Actualizar worklog.md
3. git add -A && git commit -m "mensaje descriptivo"
4. git push origin master
5. bash scripts/backup.sh (crear backup)
```

### Antes de CAMBIOS GRANDES:
```
1. CONFIRMAR con el usuario
2. Verificar que no afecte otros módulos
3. Crear backup antes de cambios críticos
```

---

## 🔧 COMANDOS ÚTILES

```bash
# Backup
bash scripts/backup.sh                    # Crear backup
python3 scripts/upload_gdrive.py          # Subir a Google Drive

# Git
git status                                # Ver cambios
git log --oneline -5                      # Últimos commits
git add -A && git commit -m "mensaje"     # Commit
git push origin master                    # Subir a GitHub

# Desarrollo
bun run dev                               # Iniciar servidor
bun run lint                              # Verificar código
bun run db:push                           # Actualizar base de datos
```
