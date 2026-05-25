/**
 * Script para importar datos desde Excel a la base de datos
 * Uso: bun run scripts/importar-datos-excel.ts <archivo.xlsx>
 */

import * as XLSX from 'xlsx'
import { db } from '../src/lib/db'
import { randomUUID } from 'crypto'

interface ProductorData {
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  email?: string
  observaciones?: string
}

interface ClienteData {
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  email?: string
  esProductor?: string
  observaciones?: string
}

interface CorralData {
  nombre: string
  capacidad?: number
  observaciones?: string
}

interface TropaData {
  codigo: string
  fechaIngreso: Date
  especie: string
  cantidadCabezas: number
  productorNombre?: string
  corralNombre?: string
  pesoNeto?: number
  estado?: string
  observaciones?: string
}

interface AnimalData {
  tropaCodigo: string
  numero: number
  tipoAnimal: string
  caravana?: string
  raza?: string
  pesoVivo?: number
  estado?: string
  observaciones?: string
}

interface PesajeData {
  tropaCodigo: string
  numeroAnimal: number
  peso: number
  fecha?: Date
  observaciones?: string
}

interface AsignacionData {
  garron: number
  tropaCodigo: string
  numeroAnimal: number
  fecha: Date
  tieneMediaDer?: boolean
  tieneMediaIzq?: boolean
}

interface RomaneoData {
  garron: number
  lado: string
  peso: number
  fecha: Date
  tropaCodigo?: string
  denticion?: string
}

// Mapeos para IDs
const productoresMap = new Map<string, string>()
const clientesMap = new Map<string, string>()
const corralesMap = new Map<string, string>()
const tropasMap = new Map<string, string>()
const animalesMap = new Map<string, string>()

function parseDate(value: unknown): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (typeof value === 'number') {
    // Excel serial date
    return new Date((value - 25569) * 86400 * 1000)
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) return parsed
  }
  return new Date()
}

function parseBoolean(value: unknown): boolean {
  if (!value) return false
  const str = String(value).toUpperCase()
  return str === 'SI' || str === 'S' || str === 'YES' || str === 'Y' || str === 'TRUE' || str === '1'
}

function cleanString(value: unknown): string | null {
  if (!value) return null
  const str = String(value).trim()
  return str || null
}

async function importarProductores(worksheet: XLSX.WorkSheet) {
  console.log('\n📋 Importando Productores...')
  const data = XLSX.utils.sheet_to_json<ProductorData>(worksheet, { range: 4 })
  
  for (const row of data) {
    if (!row.nombre) continue
    
    const nombre = cleanString(row.nombre)
    if (!nombre) continue
    
    const existe = await db.productor.findFirst({ where: { nombre } })
    if (existe) {
      productoresMap.set(nombre, existe.id)
      console.log(`  ⏭️  ${nombre} ya existe`)
      continue
    }
    
    const productor = await db.productor.create({
      data: {
        nombre,
        cuit: cleanString(row.cuit),
        direccion: cleanString(row.direccion),
        telefono: cleanString(row.telefono),
        email: cleanString(row.email),
        observaciones: cleanString(row.observaciones),
      }
    })
    
    productoresMap.set(nombre, productor.id)
    console.log(`  ✅ ${nombre}`)
  }
}

async function importarClientes(worksheet: XLSX.WorkSheet) {
  console.log('\n📋 Importando Clientes...')
  const data = XLSX.utils.sheet_to_json<ClienteData>(worksheet, { range: 4 })
  
  for (const row of data) {
    if (!row.nombre) continue
    
    const nombre = cleanString(row.nombre)
    if (!nombre) continue
    
    const existe = await db.cliente.findFirst({ where: { nombre } })
    if (existe) {
      clientesMap.set(nombre, existe.id)
      console.log(`  ⏭️  ${nombre} ya existe`)
      continue
    }
    
    const cliente = await db.cliente.create({
      data: {
        nombre,
        cuit: cleanString(row.cuit),
        direccion: cleanString(row.direccion),
        telefono: cleanString(row.telefono),
        email: cleanString(row.email),
        observaciones: cleanString(row.observaciones),
      }
    })
    
    clientesMap.set(nombre, cliente.id)
    console.log(`  ✅ ${nombre}`)
  }
}

async function importarCorrales(worksheet: XLSX.WorkSheet) {
  console.log('\n📋 Importando Corrales...')
  const data = XLSX.utils.sheet_to_json<CorralData>(worksheet, { range: 4 })
  
  for (const row of data) {
    if (!row.nombre) continue
    
    const nombre = cleanString(row.nombre)
    if (!nombre) continue
    
    const existe = await db.corral.findFirst({ where: { nombre } })
    if (existe) {
      corralesMap.set(nombre, existe.id)
      console.log(`  ⏭️  ${nombre} ya existe`)
      continue
    }
    
    const corral = await db.corral.create({
      data: {
        nombre,
        capacidad: Number(row.capacidad) || 0,
        observaciones: cleanString(row.observaciones),
      }
    })
    
    corralesMap.set(nombre, corral.id)
    console.log(`  ✅ ${nombre}`)
  }
}

async function importarTropas(worksheet: XLSX.WorkSheet) {
  console.log('\n📋 Importando Tropas...')
  const data = XLSX.utils.sheet_to_json<TropaData>(worksheet, { range: 4 })
  
  for (const row of data) {
    if (!row.codigo) continue
    
    const codigo = cleanString(row.codigo)
    if (!codigo) continue
    
    const existe = await db.tropa.findFirst({ where: { codigo } })
    if (existe) {
      tropasMap.set(codigo, existe.id)
      console.log(`  ⏭️  ${codigo} ya existe`)
      continue
    }
    
    const productorNombre = cleanString(row.productorNombre)
    const corralNombre = cleanString(row.corralNombre)
    
    // Crear o buscar usuarioFaena
    let usuarioFaenaId = null
    if (productorNombre) {
      usuarioFaenaId = productoresMap.get(productorNombre)
      if (!usuarioFaenaId) {
        // Crear productor si no existe
        const nuevoProductor = await db.productor.create({
          data: { nombre: productorNombre }
        })
        usuarioFaenaId = nuevoProductor.id
        productoresMap.set(productorNombre, usuarioFaenaId)
      }
    }
    
    const tropa = await db.tropa.create({
      data: {
        codigo,
        fechaIngreso: parseDate(row.fechaIngreso),
        especie: (row.especie || 'BOVINO') as 'BOVINO' | 'EQUINO',
        cantidadCabezas: Number(row.cantidadCabezas) || 0,
        pesoNeto: row.pesoNeto ? Number(row.pesoNeto) : null,
        estado: (row.estado || 'RECIBIDO') as any,
        usuarioFaenaId,
        corralId: corralNombre ? corralesMap.get(corralNombre) : null,
        observaciones: cleanString(row.observaciones),
      }
    })
    
    tropasMap.set(codigo, tropa.id)
    console.log(`  ✅ ${codigo} - ${row.cantidadCabezas} cabezas`)
  }
}

async function importarAnimales(worksheet: XLSX.WorkSheet) {
  console.log('\n📋 Importando Animales...')
  const data = XLSX.utils.sheet_to_json<AnimalData>(worksheet, { range: 4 })
  let count = 0
  
  for (const row of data) {
    if (!row.tropaCodigo || !row.numero) continue
    
    const tropaCodigo = cleanString(row.tropaCodigo)
    const tropaId = tropasMap.get(tropaCodigo || '')
    if (!tropaId) {
      console.log(`  ⚠️  Tropa no encontrada: ${tropaCodigo}`)
      continue
    }
    
    const numero = Number(row.numero)
    const key = `${tropaCodigo}-${numero}`
    
    const existe = await db.animal.findFirst({
      where: { tropaId, numero }
    })
    
    if (existe) {
      animalesMap.set(key, existe.id)
      continue
    }
    
    // Generar código del animal
    const tropa = await db.tropa.findUnique({ where: { id: tropaId } })
    const prefijo = tropa?.especie === 'EQUINO' ? 'E' : 'B'
    const year = tropa?.fechaIngreso?.getFullYear() || new Date().getFullYear()
    const numeroTropa = parseInt(tropaCodigo?.split(' ').pop() || '0000')
    const codigo = `${prefijo}${year}${String(numeroTropa).padStart(4, '0')}-${String(numero).padStart(3, '0')}`
    
    const animal = await db.animal.create({
      data: {
        tropaId,
        numero,
        codigo,
        tipoAnimal: (row.tipoAnimal || 'VA') as any,
        caravana: cleanString(row.caravana),
        raza: cleanString(row.raza),
        pesoVivo: row.pesoVivo ? Number(row.pesoVivo) : null,
        estado: (row.estado || 'RECIBIDO') as any,
      }
    })
    
    animalesMap.set(key, animal.id)
    count++
  }
  
  console.log(`  ✅ ${count} animales importados`)
}

async function importarAsignaciones(worksheet: XLSX.WorkSheet) {
  console.log('\n📋 Importando Asignaciones de Garrones...')
  const data = XLSX.utils.sheet_to_json<AsignacionData>(worksheet, { range: 4 })
  let count = 0
  
  for (const row of data) {
    if (!row.garron || !row.tropaCodigo || !row.numeroAnimal) continue
    
    const tropaCodigo = cleanString(row.tropaCodigo)
    const key = `${tropaCodigo}-${row.numeroAnimal}`
    const animalId = animalesMap.get(key)
    
    if (!animalId) {
      console.log(`  ⚠️  Animal no encontrado: ${key}`)
      continue
    }
    
    const garron = Number(row.garron)
    
    const existe = await db.asignacionGarron.findFirst({
      where: { garron }
    })
    
    if (existe) {
      continue
    }
    
    await db.asignacionGarron.create({
      data: {
        garron,
        animalId,
        tropaCodigo,
        animalNumero: Number(row.numeroAnimal),
        horaIngreso: parseDate(row.fecha),
        tieneMediaDer: parseBoolean(row.tieneMediaDer),
        tieneMediaIzq: parseBoolean(row.tieneMediaIzq),
      }
    })
    
    count++
  }
  
  console.log(`  ✅ ${count} asignaciones importadas`)
}

async function importarRomaneos(worksheet: XLSX.WorkSheet) {
  console.log('\n📋 Importando Romaneos...')
  const data = XLSX.utils.sheet_to_json<RomaneoData>(worksheet, { range: 4 })
  let count = 0
  
  for (const row of data) {
    if (!row.garron || !row.lado || !row.peso) continue
    
    const garron = Number(row.garron)
    const peso = Number(row.peso)
    const lado = String(row.lado).toUpperCase()
    const fecha = parseDate(row.fecha)
    
    // Buscar o crear romaneo
    let romaneo = await db.romaneo.findFirst({
      where: { garron }
    })
    
    if (!romaneo) {
      romaneo = await db.romaneo.create({
        data: {
          garron,
          tropaCodigo: cleanString(row.tropaCodigo),
          denticion: cleanString(row.denticion),
          estado: 'PENDIENTE',
        }
      })
    }
    
    // Crear media res
    const codigoBase = `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}`
    
    await db.mediaRes.create({
      data: {
        romaneoId: romaneo.id,
        lado: lado as 'DERECHA' | 'IZQUIERDA',
        sigla: 'A',
        peso,
        codigo: `${codigoBase}-A`,
        estado: 'EN_CAMARA',
      }
    })
    
    // Actualizar romaneo
    if (lado === 'DERECHA') {
      await db.romaneo.update({
        where: { id: romaneo.id },
        data: { pesoMediaDer: peso }
      })
    } else {
      await db.romaneo.update({
        where: { id: romaneo.id },
        data: { pesoMediaIzq: peso }
      })
    }
    
    count++
  }
  
  console.log(`  ✅ ${count} medias importadas`)
}

async function main() {
  const archivo = process.argv[2]
  
  if (!archivo) {
    console.log('❌ Uso: bun run scripts/importar-datos-excel.ts <archivo.xlsx>')
    process.exit(1)
  }
  
  console.log(`\n🚀 Importando datos desde: ${archivo}`)
  console.log('=' .repeat(50))
  
  try {
    const workbook = XLSX.readFile(archivo)
    
    // Importar en orden
    if (workbook.Sheets['PRODUCTORES']) {
      await importarProductores(workbook.Sheets['PRODUCTORES'])
    }
    
    if (workbook.Sheets['CLIENTES']) {
      await importarClientes(workbook.Sheets['CLIENTES'])
    }
    
    if (workbook.Sheets['CORRALES']) {
      await importarCorrales(workbook.Sheets['CORRALES'])
    }
    
    if (workbook.Sheets['TROPAS']) {
      await importarTropas(workbook.Sheets['TROPAS'])
    }
    
    if (workbook.Sheets['ANIMALES']) {
      await importarAnimales(workbook.Sheets['ANIMALES'])
    }
    
    if (workbook.Sheets['ASIGNACIONES_GARRONES']) {
      await importarAsignaciones(workbook.Sheets['ASIGNACIONES_GARRONES'])
    }
    
    if (workbook.Sheets['ROMANEOS']) {
      await importarRomaneos(workbook.Sheets['ROMANEOS'])
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('✅ Importación completada!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
