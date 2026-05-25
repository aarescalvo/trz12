# 🚨 REGLAS OBLIGATORIAS - SISTEMA TRZ5

## 📦 Repositorios GitHub

| Repositorio | Uso | Base de Datos | Remote |
|-------------|-----|---------------|--------|
| `trz5` | Desarrollo / Producción | PostgreSQL | `origin` |

## 🔄 AL FINALIZAR CADA SESIÓN

### 1. Verificar versión en package.json
```json
{
  "version": "X.Y.Z"
}
```

### 2. Actualizar worklog.md
- Agregar Task ID secuencial
- Documentar cambios realizados
- Incluir archivos modificados

### 3. Ejecutar SIEMPRE estos comandos:

```bash
# Commit con versión
git add -A
git commit -m "vX.Y.Z - Descripción del cambio"

# PUSH A AMBOS REPOSITORIOS (OBLIGATORIO)
git push origin master          # trz5 (desarrollo)
git push trz5 master       # trz5 (producción)
```

### 4. Verificar en GitHub
- https://github.com/aarescalvo/trz5
- https://github.com/aarescalvo/trz5

---

## ⚠️ COMANDOS GIT CONFIGURADOS

```bash
# Configurar remotos (solo una vez)
git remote add origin https://github.com/aarescalvo/trz5.git
git remote add trz5 https://github.com/aarescalvo/trz5.git

# Verificar remotos
git remote -v

# Push a ambos (EJECUTAR SIEMPRE)
git push origin master && git push trz5 master
```

---

## 📋 CHECKLIST FINAL

| # | Tarea | Comando/Acción |
|---|-------|----------------|
| 1 | ¿Versión actualizada? | Editar `package.json` |
| 2 | ¿Worklog actualizado? | Editar `worklog.md` |
| 3 | ¿Lint sin errores? | `bun run lint` |
| 4 | ¿Commit con versión? | `git commit -m "vX.Y.Z - ..."` |
| 5 | ¿Push a trz5? | `git push origin master` |
| 6 | ¿Push a trz5? | `git push trz5 master` |
| 7 | ¿Verificar en GitHub? | Ambos repos actualizados |

---

## 🏷️ Versionado

- **Major (X.0.0)**: Cambios grandes, nuevos módulos
- **Minor (0.X.0)**: Nuevas funcionalidades
- **Patch (0.0.X)**: Bug fixes, mejoras menores

**Versión actual: 3.0.2**
