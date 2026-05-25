# Paquete de Instalacion - Sistema Frigorifico Produccion4Z

## Version 3.14.1 - CICLO I + CICLO II + Facturacion + Reportes

---

## Contenido de este Paquete

```
install/
├── src/                    # Codigo fuente de la aplicacion
│   ├── app/               # Paginas y API routes (Next.js App Router)
│   │   ├── api/           # Endpoints de la API (~314 endpoints)
│   │   ├── layout.tsx     # Layout principal
│   │   ├── page.tsx       # Pagina principal (SPA)
│   │   └── globals.css    # Estilos globales
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes UI (shadcn/ui)
│   │   └── ...           # Modulos del sistema
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilidades y configuracion
├── prisma/               # Esquema de base de datos
│   ├── schema.prisma     # Definicion de modelos (50+ modelos)
│   ├── seed.ts           # Datos iniciales
│   └── seed-test.ts      # Datos de prueba
├── public/               # Archivos estaticos
│   ├── logo.png         # Logo de la empresa
│   └── logo.svg
├── scripts/              # Scripts de utilidad
├── server/               # Scripts de servidor Windows
│   ├── install-server.bat
│   ├── start-server.bat
│   ├── stop-server.bat
│   ├── update.bat
│   └── backup.bat
├── client/               # Scripts de configuracion de clientes
│   ├── install-client.bat
│   ├── config-balanza.bat
│   ├── config-impresora.bat
│   └── config-puesto.bat
├── install.sh            # Instalador para Linux/macOS
├── install.ps1           # Instalador para Windows
├── INSTALL.md            # Guia detallada de instalacion
├── .env.example          # Plantilla de configuracion
├── package.json          # Dependencias del proyecto
├── tsconfig.json         # Configuracion TypeScript
├── next.config.ts        # Configuracion Next.js
└── INSTRUCCIONES-INSTALACION.txt  # Instrucciones adicionales
```

---

## Instalacion Rapida

### Windows (PowerShell como Administrador)
```powershell
# 1. Instalar Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# 2. Cerrar y reabrir PowerShell, luego:
cd C:\TRZ5
bun install
copy .env.example .env
# Editar .env con datos de PostgreSQL
notepad .env

# 3. Inicializar
bun run db:generate
bun run db:push
bun run db:seed

# 4. Compilar y ejecutar
bun run build
npx next start
```

### Linux / macOS
```bash
chmod +x install.sh
sudo ./install.sh
```

---

## Documentacion Completa

Para instrucciones detalladas paso a paso, solucion de problemas y configuracion avanzada, consultar:
**[INSTALL.md](./INSTALL.md)**

---

## Credenciales por Defecto

| Usuario | Password | PIN | Rol |
|---------|----------|-----|-----|
| admin | admin123 | 1234 | Administrador |
| supervisor | super123 | 2222 | Supervisor |
| balanza | balanza123 | 1111 | Operador |

**IMPORTANTE:** Cambiar estas credenciales despues de la primera instalacion.

---

## Requisitos

| Componente | Minimo | Recomendado |
|------------|--------|-------------|
| Sistema Operativo | Windows 10 / Ubuntu 20.04 | Windows 11 / Ubuntu 22.04 |
| CPU | 2 nucleos | 4 nucleos |
| RAM | 4 GB | 8 GB |
| Disco | 10 GB | 50 GB SSD |
| PostgreSQL | 14 | 16+ |
| Bun | 1.1+ | Ultima version |
| Puerto | 3000 disponible | - |

---

## Modulos del Sistema

### CICLO I - Recepcion y Faena
- Pesaje Camiones
- Pesaje Individual
- Movimiento de Hacienda
- Lista de Faena
- Ingreso a Cajon
- Romaneo
- VB Romaneo
- Expedicion

### CICLO II - Desposte, Empaque y Expedicion
- Cuarteo (tipos dinamicos, merma de oreo)
- Ingreso Desposte C2
- Produccion / Desposte (control de masa, BOM)
- Subproductos C2
- Degradacion (trimming, golpeado, decomiso)
- Empaque (GS1-128, vencimientos automaticos)
- Expedicion C2 (pallets, temperatura)

### Subproductos
- Menudencias
- Cueros
- Rendering

### Reportes
- Stocks Corrales
- Stock Camaras / Cajas
- Planilla 01 (SENASA)
- Rindes por Tropa
- Reportes SENASA
- Reportes SIGICA
- Reportes Gerenciales
- Dashboard Ejecutivo
- Dashboard Financiero

### Administracion
- Facturacion (notas, cheques, arqueos)
- Cuenta Corriente
- Tarifas y Precios
- Proveedores

### Configuracion
- Operadores (16 permisos individuales)
- Productos y Subproductos
- Balanzas y Puestos de Trabajo
- Rotulos ZPL/DPL (Zebra, Datamax)
- Codigo de Barras
- C2 Maestros (rubros, tipos cuarto, BOM)

---

## Seguridad

- Rate limiting: 10 intentos / 15 min, bloqueo 5 min
- 16 permisos individuales por operador
- 97.8% de rutas API protegidas
- Auditoria de acciones criticas
- Validacion de rol ADMINISTRADOR en rutas criticas

---

## Soporte

- **Repositorio:** https://github.com/aarescalvo/trz5
- **Issues:** https://github.com/aarescalvo/trz5/issues

---

## Licencia

Software propietario - Uso interno
Todos los derechos reservados.
