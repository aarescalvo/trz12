# Guía Rápida de Migración SQLite → PostgreSQL

## Checklist Pre-Migración

- [ ] Backup completo de SQLite realizado
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos creada
- [ ] Credenciales preparadas

---

## Pasos Rápidos

### 1. Backup SQLite
```bash
mkdir -p backups/pre-migration
cp prisma/dev.db backups/pre-migration/dev.db
bun run db:export
```

### 2. Instalar PostgreSQL
**Windows:** Descargar de https://www.postgresql.org/download/windows/

**Linux:**
```bash
sudo apt install postgresql-16
sudo systemctl start postgresql
```

### 3. Crear base de datos
```sql
CREATE USER frigorifico WITH PASSWORD 'tu_password';
CREATE DATABASE frigorifico OWNER frigorifico;
GRANT ALL PRIVILEGES ON DATABASE frigorifico TO frigorifico;
\c frigorifico
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 4. Configurar proyecto
```bash
# Actualizar .env
DATABASE_URL="postgresql://frigorifico:tu_password@localhost:5432/frigorifico?schema=public"

# Usar schema PostgreSQL
cp prisma/schema-postgres.prisma prisma/schema.prisma

# Crear tablas
bun run db:generate
bun run db:push
```

### 5. Migrar datos
```bash
bun run db:import backups/migration-data/data-export-XXX.json
```

---

## Comandos Útiles

```bash
bun run db:test      # Test de conexión
bun run db:export    # Exportar SQLite a JSON
bun run db:import    # Importar JSON a PostgreSQL

# PostgreSQL directo
psql -U frigorifico -d frigorifico -c "\dt"           # Listar tablas
psql -U frigorifico -d frigorifico -c "SELECT count(*) FROM Tropa"  # Contar
```

---

## Rollback (volver a SQLite)

```bash
# Restaurar base de datos
cp backups/pre-migration/dev.db prisma/dev.db

# Restaurar schema
cp prisma/schema-sqlite-backup.prisma prisma/schema.prisma

# Actualizar .env
DATABASE_URL="file:./dev.db"

# Regenerar cliente
bun run db:generate
```

---

## Errores Comunes

| Error | Solución |
|-------|----------|
| Can't reach database | Verificar PostgreSQL corriendo |
| Authentication failed | Verificar usuario/password |
| Database doesn't exist | CREATE DATABASE |
| UUID extension not found | CREATE EXTENSION uuid-ossp |

---

## Contacto Soporte

Enviar:
1. Sistema operativo
2. Versión PostgreSQL
3. Error completo del log
4. Resultado de `psql -c "\dt"`
