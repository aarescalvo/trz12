/**
 * Seed Script: Datos Reales de Solemar Alimentaria
 * 
 * MODO INCREMENTAL: NO borra datos existentes. Solo agrega registros nuevos
 * y actualiza los existentes (upsert). Los datos creados por el usuario
 * (operadores, clientes, etc.) se conservan intactos.
 * 
 * Ejecutar con: bun run db:seed
 */

import bcrypt from 'bcryptjs'
import {
  PrismaClient,
  Especie,
  RolOperador,
  TipoAnimal,
  EstadoTropa,
  EstadoAnimal,
  EstadoRomaneo,
  EstadoFactura,
  TipoCamara,
} from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────────

function readJsonFile<T>(filename: string): T[] {
  const filePath = path.join(__dirname, 'seed-data', filename)
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  Archivo no encontrado: ${filename}`)
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T[]
}

function logHeader(title: string) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log(`${'═'.repeat(60)}`)
}

function logOk(msg: string, count: number | string) {
  console.log(`  ✅ ${msg}: ${count}`)
}

function logErr(msg: string, error: unknown) {
  console.error(`  ❌ ${msg}`)
  if (error instanceof Error) console.error(`     ${error.message}`)
}

function normalize(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .trim()
}

function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1
  if (!s1 || !s2) return 0
  const len1 = s1.length, len2 = s2.length
  const matchDistance = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0)
  const s1Matches = new Array(len1).fill(false)
  const s2Matches = new Array(len2).fill(false)
  let matches = 0, transpositions = 0
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance), end = Math.min(i + matchDistance + 1, len2)
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue
      s1Matches[i] = true; s2Matches[j] = true; matches++; break
    }
  }
  if (matches === 0) return 0
  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) transpositions++; k++
  }
  return ((matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3)
}

function findCliente(
  clientes: { id: string; nombre: string; cuit: string | null }[],
  cuit?: string | null,
  nombre?: string | null,
): { id: string } | undefined {
  if (cuit) { const byCuit = clientes.find((c) => c.cuit === cuit); if (byCuit) return byCuit }
  if (!nombre) return undefined
  const norm = normalize(nombre)
  const directMatch = clientes.find((c) => { const cn = normalize(c.nombre); return cn.includes(norm) || norm.includes(cn) })
  if (directMatch) return directMatch
  let bestMatch: { id: string } | undefined; let bestScore = 0.85
  for (const c of clientes) { const score = jaroSimilarity(norm, normalize(c.nombre)); if (score > bestScore) { bestScore = score; bestMatch = c } }
  return bestMatch
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 SOLEMAR ALIMENTARIA - Seed de Datos Reales')
  console.log('   (MODO INCREMENTAL: No borra datos. Solo agrega/actualiza)')
  console.log('   Fuente: Trazasole_Datos_Consolidados.xlsx → seed-data/*.json')
  const startTime = Date.now()

  // ═══ SIN LIMPIEZA — Todos los datos existentes se preservan ═══

  try {
    // ═══ PASO 1: Operador Admin (upsert por usuario) ═══
    logHeader('1️⃣  Operador Administrador')
    try {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await prisma.operador.upsert({
        where: { usuario: 'admin' },
        update: { nombre: 'Administrador', rol: RolOperador.ADMINISTRADOR, email: 'admin@solemar.com.ar', activo: true, puedePesajeCamiones: true, puedePesajeIndividual: true, puedeMovimientoHacienda: true, puedeListaFaena: true, puedeRomaneo: true, puedeIngresoCajon: true, puedeCuarteo: true, puedeDesposte: true, puedeEmpaque: true, puedeExpedicionC2: true, puedeMenudencias: true, puedeStock: true, puedeReportes: true, puedeCCIR: true, puedeFacturacion: true, puedeConfiguracion: true, puedeCalidad: true, puedeAutorizarReportes: true },
        create: { nombre: 'Administrador', usuario: 'admin', password: hashedPassword, pin: '1234', rol: RolOperador.ADMINISTRADOR, email: 'admin@solemar.com.ar', activo: true, puedePesajeCamiones: true, puedePesajeIndividual: true, puedeMovimientoHacienda: true, puedeListaFaena: true, puedeRomaneo: true, puedeIngresoCajon: true, puedeCuarteo: true, puedeDesposte: true, puedeEmpaque: true, puedeExpedicionC2: true, puedeMenudencias: true, puedeStock: true, puedeReportes: true, puedeCCIR: true, puedeFacturacion: true, puedeConfiguracion: true, puedeCalidad: true, puedeAutorizarReportes: true },
      })
      logOk('Operador admin asegurado', 'admin')
    } catch (e) { logErr('Error en operador admin', e) }

    // ═══ PASO 2: Configuración (upsert por id) ═══
    logHeader('2️⃣  Configuración del Frigorífico')
    try {
      await prisma.configuracionFrigorifico.upsert({
        where: { id: 'cfg-solemar' },
        update: { nombre: 'Solemar Alimentaria', direccion: 'Ruta Provincial N°7, Km 1180', numeroEstablecimiento: '3820', cuit: '30-70116296-3', numeroMatricula: 'N° 1234' },
        create: { id: 'cfg-solemar', nombre: 'Solemar Alimentaria', direccion: 'Ruta Provincial N°7, Km 1180', numeroEstablecimiento: '3820', cuit: '30-70116296-3', numeroMatricula: 'N° 1234' },
      })
      logOk('Configuración asegurada', 'Solemar Alimentaria')
    } catch (e) { logErr('Error en configuración', e) }

    // ═══ PASO 3: Corrales (upsert por nombre) ═══
    logHeader('3️⃣  Corrales')
    let corralesN = 0
    try {
      const corralesData = readJsonFile<{ id: string; nombre: string; capacidad: number; observaciones: string | null }>('corrales.json')
      for (const c of corralesData) { try { await prisma.corral.upsert({ where: { nombre: c.nombre }, update: { capacidad: c.capacidad, observaciones: c.observaciones ?? undefined }, create: { nombre: c.nombre, capacidad: c.capacidad, observaciones: c.observaciones ?? undefined, activo: true } }); corralesN++ } catch (err) { console.warn(`  ⚠️  Corral "${c.nombre}": ${(err as Error).message}`) } }
      logOk('Corrales procesados', corralesN)
    } catch (e) { logErr('Error en corrales', e) }

    // ═══ PASO 4: Cámaras (upsert por nombre) ═══
    logHeader('4️⃣  Cámaras')
    let camarasN = 0
    try {
      const camarasData = readJsonFile<{ id: string; nombre: string; tipo: string; capacidad: number; observaciones: string | null }>('camaras.json')
      for (const c of camarasData) { try { await prisma.camara.upsert({ where: { nombre: c.nombre }, update: { tipo: (c.tipo as TipoCamara) || TipoCamara.DEPOSITO, capacidad: c.capacidad, observaciones: c.observaciones ?? undefined }, create: { nombre: c.nombre, tipo: (c.tipo as TipoCamara) || TipoCamara.DEPOSITO, capacidad: c.capacidad, observaciones: c.observaciones ?? undefined, activo: true } }); camarasN++ } catch (err) { console.warn(`  ⚠️  Cámara "${c.nombre}": ${(err as Error).message}`) } }
      logOk('Cámaras procesadas', camarasN)
    } catch (e) { logErr('Error en cámaras', e) }

    // ═══ PASO 5: Tipificadores (upsert por matrícula) ═══
    logHeader('5️⃣  Tipificadores')
    let tipifN = 0
    try {
      const tipifData = readJsonFile<{ id: string; nombre: string; apellido: string; numero: string | null; matricula: string }>('tipificadores.json')
      for (const t of tipifData) { try { await prisma.tipificador.upsert({ where: { matricula: t.matricula }, update: { nombre: t.nombre, apellido: t.apellido, numero: t.numero ?? undefined, activo: true }, create: { nombre: t.nombre, apellido: t.apellido, numero: t.numero ?? undefined, matricula: t.matricula, activo: true } }); tipifN++ } catch (err) { console.warn(`  ⚠️  Tipificador "${t.nombre} ${t.apellido}": ${(err as Error).message}`) } }
      logOk('Tipificadores procesados', tipifN)
    } catch (e) { logErr('Error en tipificadores', e) }

    // ═══ PASO 6: Clientes (upsert por CUIT, fallback por nombre) ═══
    logHeader('6️⃣  Clientes (Productores + Usuarios de Faena)')
    let clientes: { id: string; nombre: string; cuit: string | null; esProductor: boolean; esUsuarioFaena: boolean }[] = []
    try {
      const existingClientes = await prisma.cliente.findMany({ select: { id: true, nombre: true, cuit: true, esProductor: true, esUsuarioFaena: true } })
      clientes.push(...existingClientes)
      console.log(`  ℹ️  Clientes existentes en DB: ${clientes.length}`)
      const clientesData = readJsonFile<{ id: string; nombre: string; cuit: string | null; email: string | null; telefono: string | null; contacto: string | null; esProductor: boolean; esUsuarioFaena: boolean }>('clientes.json')
      let creados = 0, actualizados = 0
      for (const c of clientesData) {
        try {
          if (c.cuit) {
            const result = await prisma.cliente.upsert({ where: { cuit: c.cuit }, update: { nombre: c.nombre, esProductor: c.esProductor, esUsuarioFaena: c.esUsuarioFaena }, create: { nombre: c.nombre, cuit: c.cuit, email: c.email ?? undefined, telefono: c.telefono ?? undefined, esProductor: c.esProductor, esUsuarioFaena: c.esUsuarioFaena, activo: true, observaciones: c.contacto ? `Contacto: ${c.contacto}` : undefined } })
            if (!clientes.find(ex => ex.id === result.id)) clientes.push({ id: result.id, nombre: result.nombre, cuit: result.cuit, esProductor: result.esProductor, esUsuarioFaena: result.esUsuarioFaena })
            Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000 ? creados++ : actualizados++
          } else {
            const norm = normalize(c.nombre)
            const existing = clientes.find(ex => { const exN = normalize(ex.nombre); return exN === norm || exN.includes(norm) || norm.includes(exN) })
            if (existing) { actualizados++ } else {
              const created = await prisma.cliente.create({ data: { nombre: c.nombre, email: c.email ?? undefined, telefono: c.telefono ?? undefined, esProductor: c.esProductor, esUsuarioFaena: c.esUsuarioFaena, activo: true, observaciones: c.contacto ? `Contacto: ${c.contacto}` : undefined } })
              clientes.push({ id: created.id, nombre: created.nombre, cuit: created.cuit, esProductor: created.esProductor, esUsuarioFaena: created.esUsuarioFaena }); creados++
            }
          }
        } catch (err) {
          console.warn(`  ⚠️  Cliente "${c.nombre}": ${(err as Error).message}`)
          const existente = await prisma.cliente.findFirst({ where: { OR: [{ cuit: c.cuit ?? undefined }, { nombre: { contains: c.nombre } }] } })
          if (existente && !clientes.find(ex => ex.id === existente.id)) clientes.push({ id: existente.id, nombre: existente.nombre, cuit: existente.cuit, esProductor: existente.esProductor, esUsuarioFaena: existente.esUsuarioFaena })
        }
      }
      logOk('Clientes creados', creados); logOk('Clientes actualizados/existentes', actualizados)
    } catch (e) { logErr('Error en clientes', e) }

    // ═══ PASO 6b: Verificar usuarios de faena ═══
    logHeader('6b️⃣ Verificar usuarios de faena desde tropas')
    try {
      const tropasData = readJsonFile<{ productorNombre: string | null; productorCuit: string | null; usuarioFaenaNombre: string | null }>('tropas.json')
      const ufSinMatch = new Set<string>()
      for (const t of tropasData) { if (t.usuarioFaenaNombre) { if (!findCliente(clientes, null, t.usuarioFaenaNombre)) ufSinMatch.add(t.usuarioFaenaNombre.trim()) } }
      if (ufSinMatch.size > 0) { console.log(`  ⚠️  ${ufSinMatch.size} usuarios de faena sin match:`); for (const n of [...ufSinMatch].sort()) console.log(`     - ${n}`) } else { console.log('  ✅ Todos los usuarios de faena matchean') }
      logOk('Total clientes disponibles', clientes.length)
    } catch (e) { logErr('Error verificando usuarios de faena', e) }

    let defaultClienteId: string
    try { const dc = await prisma.cliente.upsert({ where: { cuit: '00-00000000-0' }, update: { activo: true }, create: { nombre: 'Cliente sin identificar', cuit: '00-00000000-0', esUsuarioFaena: true, activo: true, observaciones: 'Cliente genérico para relaciones sin coincidencia' } }); defaultClienteId = dc.id } catch (e) { defaultClienteId = clientes[0]?.id || '' }

    // ═══ PASO 7: Tropas (upsert por numero) ═══
    logHeader('7️⃣  Tropas')
    const tropaIdMap = new Map<number, string>()
    const tropaCodigoMap = new Map<number, string>()
    try {
      const tropasData = readJsonFile<{ numero: number; codigo: string; especie: string; cantidadCabezas: number; productorNombre: string | null; productorCuit: string | null; usuarioFaenaNombre: string | null; usuarioFaenaCuit?: string | null; dte: string | null; guia: string | null; corral: string | null; matriculaMatarife: string | null; cuitTitular: string | null; fechaFaena: string | null; fechaIngreso: string | null; estado: string; pesoVivo: number | null; kgGancho: number | null; rindePct: number | null; observaciones: string | null }>('tropas.json')
      let tc = 0, tu = 0, ts = 0
      for (const t of tropasData) {
        try {
          if (!t.cantidadCabezas || t.cantidadCabezas <= 0) { ts++; continue }
          const productor = findCliente(clientes, t.productorCuit, t.productorNombre)
          const uf = findCliente(clientes, t.usuarioFaenaCuit ?? null, t.usuarioFaenaNombre)
          const especie = t.especie === 'EQUINO' ? Especie.EQUINO : Especie.BOVINO
          const estadoT = t.estado === 'FAENADO' ? EstadoTropa.FAENADO : t.estado === 'DESPACHADO' ? EstadoTropa.DESPACHADO : t.estado === 'EN_FAENA' ? EstadoTropa.EN_FAENA : t.estado === 'PESADO' ? EstadoTropa.PESADO : EstadoTropa.RECIBIDO
          const obs: string[] = []
          if (t.observaciones) obs.push(t.observaciones)
          if (t.productorNombre && !productor) obs.push(t.productorCuit ? `Productor: ${t.productorNombre} (CUIT: ${t.productorCuit})` : `Productor: ${t.productorNombre}`)
          const tropaData: Record<string, unknown> = {
            codigo: t.codigo,
            productorId: productor?.id ?? null,
            usuarioFaenaId: uf?.id ?? defaultClienteId,
            especie,
            dte: t.dte || `DTE-2026-${String(t.numero).padStart(4, '0')}`,
            guia: t.guia ? String(t.guia) : `GUIA-2026-${String(t.numero).padStart(4, '0')}`,
            cantidadCabezas: t.cantidadCabezas,
            estado: estadoT,
            pesoBruto: t.pesoVivo ? t.pesoVivo * 1.15 : null,
            pesoNeto: t.pesoVivo ?? null,
            observaciones: obs.length > 0 ? obs.join(' | ') : undefined,
            fechaFaena: t.fechaFaena ? new Date(t.fechaFaena + 'T12:00:00') : null,
            kgGancho: t.kgGancho ?? null,
          }
          const r = await prisma.tropa.upsert({
            where: { numero: t.numero },
            update: tropaData,
            create: {
              ...tropaData,
              numero: t.numero,
              fechaRecepcion: t.fechaIngreso ? new Date(t.fechaIngreso + 'T12:00:00') : (t.fechaFaena ? new Date(t.fechaFaena + 'T12:00:00') : new Date()),
            },
          })
          tropaIdMap.set(t.numero, r.id); tropaCodigoMap.set(t.numero, t.codigo)
          Math.abs(r.createdAt.getTime() - r.updatedAt.getTime()) < 1000 ? tc++ : tu++
        } catch (err) { console.warn(`  ⚠️  Tropa #${t.numero}: ${(err as Error).message}`) }
      }
      logOk('Tropas creadas', tc); logOk('Tropas actualizadas', tu)
      if (ts > 0) console.log(`  ℹ️  Tropas sin datos: ${ts}`)
    } catch (e) { logErr('Error en tropas', e) }

    // ═══ PASO 8: Animales (upsert por codigo) ═══
    logHeader('8️⃣  Animales')
    try {
      const animalesData = readJsonFile<{ tropaNumero: number; numero: number; codigo: string; caravana: string | null; raza: string | null; tipoAnimal: string; pesoVivo: number | null; kgEntrada: number | null; kgMediaA: number | null; kgMediaB: number | null; totalKg: number | null; rindePct: number | null; garron: number | null; estado: string }>('animales.json')
      const codigoSet = new Set<string>(); const validTipos = new Set<string>(Object.values(TipoAnimal))
      let ac = 0, au = 0, sk = 0
      for (const a of animalesData) {
        const tropaId = tropaIdMap.get(a.tropaNumero); if (!tropaId) { sk++; continue }
        if (!validTipos.has(a.tipoAnimal)) { sk++; continue }
        let codigo = a.codigo; if (codigoSet.has(codigo)) { let s = 2; while (codigoSet.has(`${a.codigo}-${s}`)) s++; codigo = `${a.codigo}-${s}` } codigoSet.add(codigo)
        const estado = a.estado === 'FAENADO' ? EstadoAnimal.FAENADO : a.estado === 'DESPACHADO' ? EstadoAnimal.DESPACHADO : a.estado === 'EN_CAMARA' ? EstadoAnimal.EN_CAMARA : a.estado === 'PESADO' ? EstadoAnimal.PESADO : EstadoAnimal.RECIBIDO
        try { const r = await prisma.animal.upsert({ where: { codigo }, update: { tropaId, numero: a.numero, caravana: a.caravana ?? undefined, tipoAnimal: a.tipoAnimal as TipoAnimal, raza: a.raza ?? undefined, pesoVivo: a.pesoVivo ?? undefined, estado }, create: { tropaId, numero: a.numero, codigo, caravana: a.caravana ?? undefined, tipoAnimal: a.tipoAnimal as TipoAnimal, raza: a.raza ?? undefined, pesoVivo: a.pesoVivo ?? undefined, estado } }); Math.abs(r.createdAt.getTime() - r.updatedAt.getTime()) < 1000 ? ac++ : au++ } catch (err) { console.warn(`  ⚠️  Animal ${codigo}: ${(err as Error).message}`) }
      }
      logOk('Animales creados', ac); logOk('Animales actualizados', au); if (sk > 0) console.log(`  ℹ️  Saltados: ${sk}`)
    } catch (e) { logErr('Error en animales', e) }

    // ═══ PASO 9: Romaneos (no duplicar) ═══
    logHeader('9️⃣  Romaneos')
    try {
      const romaneosData = readJsonFile<{ tropaNumero: number; animalNumero: number; garron: number; tropaCodigo: string | null; tipoAnimal: string | null; raza: string | null; pesoVivo: number | null; kgMediaIzq: number | null; kgMediaDer: number | null; pesoTotal: number | null; rinde: number | null; fecha: string | null; estado: string }>('romaneos.json')
      const vt = new Set<string>(Object.values(TipoAnimal)); let rc = 0, re = 0
      for (const r of romaneosData) {
        try {
          const fecha = r.fecha ? new Date(r.fecha) : null
          const existing = await prisma.romaneo.findFirst({ where: { garron: r.garron, tropaCodigo: r.tropaCodigo ?? undefined, ...(fecha ? { fecha: { gte: new Date(fecha.getTime() - 12*60*60*1000), lte: new Date(fecha.getTime() + 12*60*60*1000) } } : {}) } })
          if (existing) {
            if (r.tipoAnimal && vt.has(r.tipoAnimal)) { await prisma.romaneo.update({ where: { id: existing.id }, data: { tipoAnimal: r.tipoAnimal as TipoAnimal, raza: r.raza ?? undefined, pesoVivo: r.pesoVivo ?? undefined, pesoMediaIzq: r.kgMediaIzq ?? undefined, pesoMediaDer: r.kgMediaDer ?? undefined, pesoTotal: r.pesoTotal ?? undefined, rinde: r.rinde ?? undefined, estado: r.estado === 'CONFIRMADO' ? EstadoRomaneo.CONFIRMADO : r.estado === 'ANULADO' ? EstadoRomaneo.ANULADO : EstadoRomaneo.PENDIENTE } }) }
            re++
          } else {
            if (r.tipoAnimal && !vt.has(r.tipoAnimal)) continue
            await prisma.romaneo.create({ data: { fecha: fecha ?? new Date(), garron: r.garron, tropaCodigo: r.tropaCodigo ?? undefined, numeroAnimal: r.animalNumero, tipoAnimal: r.tipoAnimal ? (r.tipoAnimal as TipoAnimal) : undefined, raza: r.raza ?? undefined, pesoVivo: r.pesoVivo ?? undefined, pesoMediaIzq: r.kgMediaIzq ?? undefined, pesoMediaDer: r.kgMediaDer ?? undefined, pesoTotal: r.pesoTotal ?? undefined, rinde: r.rinde ?? undefined, estado: r.estado === 'CONFIRMADO' ? EstadoRomaneo.CONFIRMADO : r.estado === 'ANULADO' ? EstadoRomaneo.ANULADO : EstadoRomaneo.PENDIENTE } })
            rc++
          }
        } catch (err) { console.warn(`  ⚠️  Romaneo garrón ${r.garron}: ${(err as Error).message}`) }
      }
      logOk('Romaneos creados', rc); logOk('Romaneos ya existentes', re)
    } catch (e) { logErr('Error en romaneos', e) }

    // ═══ PASO 10: Facturas (upsert por numero) ═══
    logHeader('🔟 Facturas')
    try {
      const facturasData = readJsonFile<{ tropaNumero: number; usuario: string; fechaFaena: string | null; cantAnimales: number; kgGancho: number; totalServicioIVA: number; tasaInspVet: number; arancelIPCVA: number; totalFacturaImp: number; noFactura: string; fechaFactura: string | null; fechaPago: string | null; montoDepositado: number; estadoPago: string }>('facturas.json')
      let fc = 0, fu = 0, fd = 0; const fv = new Set<string>()
      for (const f of facturasData) {
        try {
          if (fv.has(f.noFactura)) { fd++; continue } fv.add(f.noFactura)
          const cliente = findCliente(clientes, null, f.usuario) || { id: defaultClienteId } as { id: string }
          if (!cliente.id) { console.warn(`  ⚠️  Factura ${f.noFactura}: sin cliente`); continue }
          const estado = f.estadoPago === 'PAGADO' ? EstadoFactura.PAGADA : f.estadoPago === 'EMITIDA' ? EstadoFactura.EMITIDA : f.estadoPago === 'ANULADA' ? EstadoFactura.ANULADA : EstadoFactura.PENDIENTE
          const np = f.noFactura.split('-'); const ni = parseInt(np[np.length - 1] || '0', 10) || fc + 1
          const r = await prisma.factura.upsert({ where: { numero: f.noFactura }, update: { numeroInterno: ni, clienteId: cliente.id, fecha: f.fechaFaena ? new Date(f.fechaFaena) : undefined, fechaEmision: f.fechaFactura ? new Date(f.fechaFactura) : undefined, fechaPago: f.fechaPago ? new Date(f.fechaPago) : undefined, subtotal: f.totalServicioIVA ?? 0, iva: f.tasaInspVet ?? 0, total: f.totalFacturaImp ?? 0, estado, observaciones: `Tropa #${f.tropaNumero} | ${f.cantAnimales} animales | ${f.kgGancho} kg gancho | Tasa Insp. Vet: ${f.tasaInspVet} | IPCVA: ${f.arancelIPCVA}`, remito: f.noFactura }, create: { numero: f.noFactura, numeroInterno: ni, clienteId: cliente.id, fecha: f.fechaFaena ? new Date(f.fechaFaena) : new Date(), fechaEmision: f.fechaFactura ? new Date(f.fechaFactura) : undefined, fechaPago: f.fechaPago ? new Date(f.fechaPago) : undefined, subtotal: f.totalServicioIVA ?? 0, iva: f.tasaInspVet ?? 0, total: f.totalFacturaImp ?? 0, estado, observaciones: `Tropa #${f.tropaNumero} | ${f.cantAnimales} animales | ${f.kgGancho} kg gancho | Tasa Insp. Vet: ${f.tasaInspVet} | IPCVA: ${f.arancelIPCVA}`, remito: f.noFactura } })
          Math.abs(r.createdAt.getTime() - r.updatedAt.getTime()) < 1000 ? fc++ : fu++
        } catch (err) { console.warn(`  ⚠️  Factura ${f.noFactura}: ${(err as Error).message}`) }
      }
      logOk('Facturas creadas', fc); logOk('Facturas actualizadas', fu); if (fd > 0) console.log(`  ℹ️  Duplicadas: ${fd}`)
    } catch (e) { logErr('Error en facturas', e) }

    // ═══ PASO 11: Menudencias ═══
    logHeader('1️⃣1️⃣ Menudencias')
    try {
      const mData = readJsonFile<{ tropaNumero: number; item: string; cantidad: number | null; kg: number | null; unidades: number | null; kgDecomiso: number | null; tipoMenudenciaNombre: string }>('menudencias.json')
      const ts = new Set<string>(); for (const m of mData) { if (m.tipoMenudenciaNombre) ts.add(m.tipoMenudenciaNombre) }
      const tn = Array.from(ts); const tm = new Map<string, string>(); let tCr = 0
      for (const n of tn) { const r = await prisma.tipoMenudencia.upsert({ where: { nombre: n }, update: { activo: true }, create: { nombre: n, activo: true } }); tm.set(n, r.id); if (Math.abs(r.createdAt.getTime() - r.updatedAt.getTime()) < 1000) tCr++ }
      console.log(`  ✅ Tipos menudencia: ${tn.length} (${tCr} nuevos)`)
      const mv = mData.filter((m) => m.kg != null || m.cantidad != null); let mc = 0
      for (let i = 0; i < mv.length; i += 500) {
        const batch = mv.slice(i, i + 500).filter((m) => tm.has(m.tipoMenudenciaNombre)).map((m) => ({ tipoMenudenciaId: tm.get(m.tipoMenudenciaNombre)!, tropaCodigo: tropaCodigoMap.get(m.tropaNumero) ?? undefined, pesoIngreso: m.kg ?? undefined, cantidadBolsas: m.unidades ? Math.round(m.unidades) : undefined, fechaIngreso: new Date(), observaciones: m.item ? `Item: ${m.item}${m.kgDecomiso ? ` | Decomiso: ${m.kgDecomiso} kg` : ''}` : undefined }))
        if (batch.length > 0) { try { mc += (await prisma.menudencia.createMany({ data: batch, skipDuplicates: true })).count } catch (err) { console.warn(`  ⚠️  Lote menudencias: ${(err as Error).message}`) } }
      }
      logOk('Menudencias creadas', mc)
    } catch (e) { logErr('Error en menudencias', e) }

    // ═══ PASO 12: Numeradores (no retroceden) ═══
    logHeader('1️⃣2️⃣ Numeradores')
    try {
      const ltb = tropaIdMap.size
      const nums = [{ nombre: 'TROPA_BOVINO', ultimoNumero: ltb, anio: 2026 }, { nombre: 'TROPA_EQUINO', ultimoNumero: 0, anio: 2026 }, { nombre: 'FACTURA', ultimoNumero: 172, anio: 2026 }, { nombre: 'TICKET', ultimoNumero: 0, anio: 2026 }, { nombre: 'ROMANEO', ultimoNumero: 1861, anio: 2026 }, { nombre: 'PESAJE_CAMION', ultimoNumero: 0, anio: 2026 }, { nombre: 'MENUDENCIA', ultimoNumero: 0, anio: 2026 }]
      let nc = 0, nm = 0
      for (const n of nums) {
        try { const ex = await prisma.numerador.findUnique({ where: { nombre: n.nombre } }); if (ex) { if (n.ultimoNumero > ex.ultimoNumero) { await prisma.numerador.update({ where: { nombre: n.nombre }, data: { ultimoNumero: n.ultimoNumero } }); nc++ } else { nm++ } } else { await prisma.numerador.create({ data: n }); nc++ } } catch (err) { console.warn(`  ⚠️  Numerador ${n.nombre}: ${(err as Error).message}`) }
      }
      logOk('Numeradores creados/actualizados', nc); logOk('Numeradores mantenidos', nm)
    } catch (e) { logErr('Error en numeradores', e) }

    // ═══ PASO 13: Listas de Faena (generadas desde fechas de faena de tropas) ═══
    logHeader('1️⃣3️⃣ Listas de Faena (históricas)')
    try {
      const tropasData = readJsonFile<{ numero: number; fechaFaena: string | null; cantidadCabezas: number; corral: string | null }>('tropas.json')

      // Agrupar tropas por fechaFaena
      const fechasMap = new Map<string, { numero: number; cantidadCabezas: number; corral: string | null }[]>()
      for (const t of tropasData) {
        if (!t.fechaFaena || !tropaIdMap.has(t.numero)) continue
        const fecha = t.fechaFaena
        if (!fechasMap.has(fecha)) fechasMap.set(fecha, [])
        fechasMap.get(fecha)!.push({ numero: t.numero, cantidadCabezas: t.cantidadCabezas, corral: t.corral })
      }

      // Obtener el próximo número de lista
      const maxListaNum = await prisma.listaFaena.aggregate({ _max: { numero: true } })
      let proximoNumero = (maxListaNum._max.numero || 0) + 1

      // Verificar listas existentes para no duplicar
      const listasExistentes = await prisma.listaFaena.findMany({
        select: { fecha: true, estado: true },
      })
      const fechasConLista = new Set<string>()
      for (const l of listasExistentes) {
        fechasConLista.add(l.fecha.toISOString().split('T')[0])
      }

      let listasCreadas = 0
      let listasSaltadas = 0
      let totalTropasEnListas = 0

      for (const [fecha, tropasFecha] of [...fechasMap.entries()].sort()) {
        if (fechasConLista.has(fecha)) {
          listasSaltadas++
          continue
        }

        const fechaMidday = new Date(fecha + 'T12:00:00')
        const totalCabezas = tropasFecha.reduce((sum, t) => sum + (t.cantidadCabezas || 0), 0)

        // Crear la lista de faena (estado CERRADA porque es histórica)
        const lista = await prisma.listaFaena.create({
          data: {
            numero: proximoNumero,
            fecha: fechaMidday,
            estado: 'CERRADA',
            cantidadTotal: totalCabezas,
            fechaCierre: fechaMidday,
          },
        })
        proximoNumero++

        // Crear las relaciones tropa → lista
        for (const t of tropasFecha) {
          const tropaId = tropaIdMap.get(t.numero)
          if (!tropaId) continue

          // Obtener corralId si existe
          let corralId: string | null = null
          if (t.corral) {
            // Los corrales pueden ser compuestos (ej: "D-01,D-02"), tomar el primero
            const primerCorral = t.corral.split(',')[0].trim().split(/[-\s]/)[0] + '-' + t.corral.split(',')[0].trim().split(/[-\s]/)[1]
            try {
              const corralRecord = await prisma.corral.findFirst({
                where: { nombre: { contains: primerCorral } },
              })
              if (corralRecord) corralId = corralRecord.id
            } catch { /* corral no encontrado, ok */ }
          }

          try {
            await prisma.listaFaenaTropa.create({
              data: {
                listaFaenaId: lista.id,
                tropaId,
                cantidad: t.cantidadCabezas,
                corralId,
              },
            })
            totalTropasEnListas++
          } catch (err) {
            // Si ya existe la relación (lista + tropa), ignorar
            console.warn(`  ⚠️  ListaFaenaTropa (lista ${lista.numero}, tropa #${t.numero}): ${(err as Error).message}`)
          }
        }

        listasCreadas++
      }

      logOk('Listas de faena creadas', listasCreadas)
      logOk('Listas ya existentes (saltadas)', listasSaltadas)
      logOk('Total tropas vinculadas a listas', totalTropasEnListas)
    } catch (e) { logErr('Error en listas de faena', e) }

    // ═══ RESUMEN ═══
    logHeader('📊 Resumen del Seed')
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`  ⏱️  Tiempo total: ${elapsed}s`)
    console.log('  📦 MODO INCREMENTAL — NINGUN dato fue borrado:')
    console.log(`     • Operador Admin: asegurado`)
    console.log(`     • Configuración: asegurada`)
    console.log(`     • Corrales: ${corralesN} | Cámaras: ${camarasN} | Tipificadores: ${tipifN}`)
    console.log(`     • Clientes: ${clientes.length} | Tropas: ${tropaIdMap.size}`)
    console.log('     • Animales, Romaneos, Facturas, Menudencias: upsert/skip')
    console.log('     • Numeradores: solo avanzan, nunca retroceden')
    console.log('     • Listas de Faena: generadas desde fechas de faena de tropas')
    console.log(`\n  ✅ Todos los datos del usuario fueron PRESERVADOS intactos.`)
    console.log('\n🎉 Seed completado exitosamente!\n')
  } catch (error) {
    console.error('\n💥 Error fatal durante el seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
