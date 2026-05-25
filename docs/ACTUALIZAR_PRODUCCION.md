# Guía de Actualización - PC de Producción

## Pasos para actualizar desde GitHub

### 1. Verificar conexión a PostgreSQL
```powershell
# Asegurarse de que PostgreSQL esté corriendo
# Verificar que el .env tenga la URL correcta de PostgreSQL
cat .env
# Debe mostrar: DATABASE_URL="postgresql://frigo_user:1810@localhost:5432/frigorifico"
```

### 2. Actualizar código desde GitHub
```powershell
# Opción A: Si no hay cambios locales
git fetch produccion
git reset --hard produccion/main

# Opción B: Si hay cambios locales que quieres conservar
git stash
git pull produccion main
git stash pop
```

### 3. Verificar y corregir schema de base de datos
```powershell
# Abrir prisma/schema.prisma y verificar que el provider sea postgresql
# Debe decir: provider = "postgresql"
# Si dice "sqlite", cambiarlo a "postgresql"
```

### 4. Sincronizar base de datos
```powershell
bun run db:push
```

### 5. Limpiar caché del navegador
- Presionar `Ctrl + Shift + R` para recargar sin caché
- O abrir DevTools (F12) → Network → Disable cache

### 6. Verificar que no haya errores
- Abrir DevTools (F12) → Console
- Si hay errores rojos, copiar y reportar

## Problema de Pantalla Gris

Si aparece la pantalla gris:

1. **Verificar consola del navegador (F12)** - buscar errores en rojo
2. **Limpiar caché** - `Ctrl + Shift + R` o `Ctrl + F5`
3. **Verificar conexión a DB** - `bun run db:push` debe completar sin errores
4. **Verificar .env** - debe tener PostgreSQL URL, no SQLite
5. **Verificar schema.prisma** - provider debe ser "postgresql"

## Configuración de Git Remotes

Verificar que los remotes estén configurados:
```powershell
git remote -v
```

Debe mostrar:
```
desarrollo   https://github.com/usuario/desarrollo1.git (fetch)
desarrollo   https://github.com/usuario/desarrollo1.git (push)
produccion   https://github.com/usuario/produccion1.git (fetch)
produccion   https://github.com/usuario/produccion1.git (push)
```

Si falta un remote:
```powershell
git remote add produccion https://github.com/usuario/produccion1.git
```

## Notas Importantes

- **Desarrollo** usa SQLite (base de datos local)
- **Producción** usa PostgreSQL (servidor de base de datos)
- El schema.prisma debe coincidir con la base de datos en uso
- El .env debe tener la URL de conexión correcta

---
Versión: 3.7.24
Última actualización: Enero 2025
