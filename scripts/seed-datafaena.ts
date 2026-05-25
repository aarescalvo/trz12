// Script para cargar datos de DataFaena
// Ejecutar con: bun run scripts/seed-datafaena.ts

import { PrismaClient, Especie, RolOperador, TipoAnimal } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Datos extraídos de los PDFs
const tropasData = [
  { numero: 30, fecha: '2026-01-21', productor: 'BOSQUE AMADO S.R.L', cabezas: 18 },
  { numero: 31, fecha: '2026-01-20', productor: 'KREITZ JUAN EDUARDO', cabezas: 50 },
  { numero: 100, fecha: '2026-03-03', productor: 'BOSQUE AMADO SRL', cabezas: 18 },
  { numero: 101, fecha: '2026-03-04', productor: 'RUFFINI GABRIEL HORACIO', cabezas: 8 },
  { numero: 102, fecha: '2026-03-04', productor: 'SARASOLA ESMIR ANTONIO', cabezas: 12 },
  { numero: 103, fecha: '2026-03-04', productor: 'DIETZELFACUNDO ROBERTO', cabezas: 10 },
  { numero: 104, fecha: '2026-03-04', productor: 'ARANEDA MARIO ALEJANDRO', cabezas: 20 },
  { numero: 18, fecha: '2026-01-12', productor: 'SCHINDLER MARTIN', cabezas: 43 },
  { numero: 19, fecha: '2026-01-12', productor: 'LOGINPET SRL', cabezas: 25 },
  { numero: 20, fecha: '2026-01-12', productor: 'LASTRA PATRICIO RODENDO', cabezas: 15 },
  { numero: 21, fecha: '2026-01-13', productor: 'DOLORES PARRA S.A.', cabezas: 8 },
  { numero: 22, fecha: '2026-01-13', productor: 'AGROPECUARIA DON MANUEL S.A.', cabezas: 7 },
  { numero: 23, fecha: '2026-01-13', productor: 'AGROPECUARIA DON MANUEL S.A.', cabezas: 5 },
  { numero: 24, fecha: '2026-01-14', productor: 'SARASOLA ESMIR ANTONIO', cabezas: 30 },
  { numero: 25, fecha: '2026-01-14', productor: 'RUFFINI GABRIEL HORACIO', cabezas: 6 },
  { numero: 26, fecha: '2026-01-16', productor: 'YAMINUHE SRL', cabezas: 50 },
  { numero: 27, fecha: '2026-01-19', productor: 'LA TAPERITAS S.A.', cabezas: 40 },
  { numero: 28, fecha: '2026-01-19', productor: 'LOGINPET SRL', cabezas: 26 },
  { numero: 29, fecha: '2026-01-19', productor: 'LASTRA PATRICIO ROSENDO', cabezas: 15 },
  { numero: 32, fecha: '2026-01-22', productor: 'MONEDERO ARMANDO DANIEL', cabezas: 8 },
  { numero: 33, fecha: '2026-01-22', productor: 'SARASOLA ESMIR ANTONIO', cabezas: 20 },
  { numero: 34, fecha: '2026-01-24', productor: 'RODRIGUEZ MARIO ISAIAS', cabezas: 15 },
  { numero: 35, fecha: '2026-01-24', productor: 'BERTIL GRAHN SOCIEDAD ANONIMA AGROP', cabezas: 13 },
  { numero: 36, fecha: '2026-01-24', productor: 'AGROPECUARIA DON MANUEL S.A.', cabezas: 15 },
  { numero: 37, fecha: '2026-01-26', productor: 'LASTRA PATRICIO ROSENDO', cabezas: 15 },
  { numero: 38, fecha: '2026-01-26', productor: 'LOGINPET SRL', cabezas: 26 },
  { numero: 39, fecha: '2026-01-27', productor: 'BOSQUE AMADO S.R.L', cabezas: 18 },
  { numero: 40, fecha: '2026-01-27', productor: 'ARANEDA MARIO ALEJANDRO', cabezas: 31 },
  { numero: 41, fecha: '2026-01-27', productor: 'ARANEDA MARIO ALEJANDRO', cabezas: 14 },
  { numero: 42, fecha: '2026-01-28', productor: 'LEDESMA ARIEL ALEJANDRO', cabezas: 14 },
  { numero: 43, fecha: '2026-01-28', productor: 'LAMAS MIGUEL', cabezas: 9 },
  { numero: 44, fecha: '2026-01-28', productor: 'VICWNTY JORGE ALBERTO', cabezas: 6 },
  { numero: 45, fecha: '2026-01-30', productor: 'SEIRA HECTOR', cabezas: 22 },
  { numero: 46, fecha: '2026-01-30', productor: 'LOGINPET SRL', cabezas: 20 },
  { numero: 47, fecha: '2026-01-30', productor: 'BERTIL GRAHN SOCIEDAD ANONIMA AGROP', cabezas: 13 },
  { numero: 48, fecha: '2026-01-30', productor: 'AGROPECUARIA DON MANUEL', cabezas: 8 },
  { numero: 49, fecha: '2026-01-30', productor: 'AGROPECUARIA DON MANUEL', cabezas: 5 },
  { numero: 50, fecha: '2026-01-30', productor: 'TRANSPORTE DOLORES PARRA SA', cabezas: 2 },
  { numero: 51, fecha: '2026-02-02', productor: 'YAMINUHE SRL', cabezas: 42 },
  { numero: 52, fecha: '2026-02-02', productor: 'YAMINUHE SRL', cabezas: 18 },
  { numero: 53, fecha: '2026-02-04', productor: 'BOSQUES AMADOS SRL', cabezas: 17 },
  { numero: 54, fecha: '2026-02-03', productor: 'KREITZ JUAN EDUARDO', cabezas: 50 },
  { numero: 55, fecha: '2026-02-04', productor: 'RUFFINI GABRIEL HORACIO', cabezas: 10 },
  { numero: 56, fecha: '2026-02-05', productor: 'ARMINDA SRL', cabezas: 15 },
  { numero: 57, fecha: '2026-02-04', productor: 'BONADE MARIO ANTONIO', cabezas: 5 },
  { numero: 58, fecha: '2026-02-05', productor: 'BONADE MARIO ANTONIO', cabezas: 10 },
  { numero: 59, fecha: '2026-02-06', productor: 'SARASOLA ESMIR ANTONIO', cabezas: 20 },
  { numero: 60, fecha: '2026-02-06', productor: 'KEDINGE ELSA OTILIA', cabezas: 28 },
  { numero: 61, fecha: '2026-02-06', productor: 'LOGINPET SRL', cabezas: 20 },
  { numero: 62, fecha: '2026-02-06', productor: 'KEDINGE ELSA OTILIA', cabezas: 1 },
  { numero: 63, fecha: '2026-02-09', productor: 'LASTRA PATRICIO ROSENDO', cabezas: 8 },
  { numero: 64, fecha: '2026-02-09', productor: 'BONADE MARCELO JAVIER', cabezas: 3 },
  { numero: 65, fecha: '2026-02-09', productor: 'LASTRA PATRICIO ROSENDO', cabezas: 4 },
  { numero: 96, fecha: '2026-02-27', productor: 'FV AGROPECUARIA SRL', cabezas: 22 },
  { numero: 97, fecha: '2026-03-02', productor: 'VILLA NORBERTO FABIAN', cabezas: 18 },
  { numero: 98, fecha: '2026-03-02', productor: 'SCHINDLER MARTIN', cabezas: 44 },
  { numero: 99, fecha: '2026-03-02', productor: 'LOGINPET SRL', cabezas: 21 },
  // Tropas adicionales de Diciembre 2025
  { numero: 170, fecha: '2025-12-19', productor: 'YAMINUHE SRL', cabezas: 50 },
  { numero: 171, fecha: '2025-12-19', productor: 'YAMINUHE SRL', cabezas: 50 },
  { numero: 172, fecha: '2025-12-19', productor: 'YAMINUHE SRL', cabezas: 50 },
  { numero: 173, fecha: '2025-12-19', productor: 'YAMINUHE SRL', cabezas: 50 },
  { numero: 174, fecha: '2025-12-19', productor: 'YAMINUHE SRL', cabezas: 50 },
  { numero: 175, fecha: '2025-12-23', productor: 'SCHINDLER MARTIN', cabezas: 50 },
  { numero: 176, fecha: '2025-12-23', productor: 'SCHINDLER MARTIN', cabezas: 50 },
  { numero: 177, fecha: '2025-12-24', productor: 'LA TAPERITAS S.A.', cabezas: 50 },
  { numero: 178, fecha: '2025-12-24', productor: 'LA TAPERITAS S.A.', cabezas: 50 },
  { numero: 179, fecha: '2025-12-24', productor: 'LA TAPERITAS S.A.', cabezas: 50 },
  { numero: 180, fecha: '2025-12-24', productor: 'LA TAPERITAS S.A.', cabezas: 50 },
  { numero: 181, fecha: '2025-12-26', productor: 'KREITZ JUAN EDUARDO', cabezas: 50 },
  { numero: 182, fecha: '2025-12-26', productor: 'KREITZ JUAN EDUARDO', cabezas: 50 },
  { numero: 183, fecha: '2025-12-26', productor: 'KREITZ JUAN EDUARDO', cabezas: 50 },
  { numero: 184, fecha: '2025-12-26', productor: 'KREITZ JUAN EDUARDO', cabezas: 50 },
  { numero: 185, fecha: '2025-12-30', productor: 'BOSQUE AMADO S.R.L', cabezas: 18 },
  { numero: 186, fecha: '2025-12-30', productor: 'BOSQUE AMADO S.R.L', cabezas: 18 },
  { numero: 187, fecha: '2025-12-31', productor: 'BOSQUE AMADO S.R.L', cabezas: 18 },
  { numero: 188, fecha: '2025-12-31', productor: 'BOSQUE AMADO S.R.L', cabezas: 18 },
]

const productoresUnicos = [...new Set(tropasData.map(t => t.productor))]

async function main() {
  console.log('🌱 Iniciando carga de datos de DataFaena...')

  // 1. Obtener operador admin
  const admin = await prisma.operador.findFirst({
    where: { usuario: 'admin' }
  })
  
  if (!admin) {
    console.error('❌ No se encontró el operador admin')
    return
  }
  console.log(`   ✓ Operador admin: ${admin.nombre}`)

  // 2. Obtener o crear usuario de faena por defecto
  let usuarioFaenaDefault = await prisma.cliente.findFirst({
    where: { esUsuarioFaena: true }
  })
  
  if (!usuarioFaenaDefault) {
    usuarioFaenaDefault = await prisma.cliente.create({
      data: {
        nombre: 'USUARIO FAENA GENERAL',
        esUsuarioFaena: true
      }
    })
    console.log('   ✓ Usuario de faena por defecto creado')
  }

  // 3. Crear productores
  console.log(`📝 Creando ${productoresUnicos.length} productores...`)
  const productoresMap: Record<string, string> = {}
  
  for (const nombre of productoresUnicos) {
    const existente = await prisma.cliente.findFirst({
      where: { nombre, esProductor: true }
    })
    
    if (existente) {
      productoresMap[nombre] = existente.id
    } else {
      const nuevo = await prisma.cliente.create({
        data: {
          nombre,
          esProductor: true,
          esUsuarioFaena: false
        }
      })
      productoresMap[nombre] = nuevo.id
    }
  }
  console.log(`   ✓ ${productoresUnicos.length} productores listos`)

  // 4. Obtener corrales disponibles
  const corrales = await prisma.corral.findMany({ where: { activo: true } })
  console.log(`   ✓ ${corrales.length} corrales disponibles`)

  // 5. Crear tropas
  console.log(`📝 Creando ${tropasData.length} tropas...`)
  let tropasCreadas = 0
  let animalesCreados = 0
  
  for (const tropaInfo of tropasData) {
    // Verificar si ya existe
    const existente = await prisma.tropa.findFirst({
      where: { numero: tropaInfo.numero }
    })
    
    if (existente) {
      console.log(`   - Tropa ${tropaInfo.numero} ya existe, saltando...`)
      continue
    }
    
    const year = new Date(tropaInfo.fecha).getFullYear()
    const codigo = `B ${year} ${String(tropaInfo.numero).padStart(4, '0')}`
    const codigoSimplificado = `B${String(tropaInfo.numero).padStart(4, '0')}`
    const productorId = productoresMap[tropaInfo.productor] || null
    const corralAsignado = corrales[tropasCreadas % corrales.length]
    
    // Crear tropa
    const tropa = await prisma.tropa.create({
      data: {
        numero: tropaInfo.numero,
        codigo,
        codigoSimplificado,
        productorId,
        usuarioFaenaId: usuarioFaenaDefault.id,
        especie: Especie.BOVINO,
        dte: `DTE-${year}-${String(tropaInfo.numero).padStart(5, '0')}`,
        guia: `GUIA-${year}-${String(tropaInfo.numero).padStart(5, '0')}`,
        cantidadCabezas: tropaInfo.cabezas,
        corralId: corralAsignado?.id,
        estado: 'FAENADO',
        fechaRecepcion: new Date(tropaInfo.fecha),
        operadorId: admin.id
      }
    })
    
    // Crear animales para esta tropa
    const tipoAnimales: TipoAnimal[] = ['NO', 'VA', 'VQ', 'NT', 'MEJ']
    
    for (let i = 1; i <= tropaInfo.cabezas; i++) {
      const tipoAnimal = tipoAnimales[i % tipoAnimales.length]
      const pesoBase = 400 + Math.floor(Math.random() * 150)
      
      await prisma.animal.create({
        data: {
          tropaId: tropa.id,
          numero: i,
          codigo: `${codigoSimplificado}-${String(i).padStart(3, '0')}`,
          tipoAnimal,
          raza: ['HE', 'AA', 'CA'][i % 3],
          pesoVivo: pesoBase,
          estado: 'FAENADO',
          corralId: corralAsignado?.id
        }
      })
      animalesCreados++
    }
    
    tropasCreadas++
    
    if (tropasCreadas % 10 === 0) {
      console.log(`   - Progreso: ${tropasCreadas}/${tropasData.length} tropas...`)
    }
  }

  console.log(`\n✅ Carga completada!`)
  console.log(`   - ${tropasCreadas} tropas creadas`)
  console.log(`   - ${animalesCreados} animales creados`)
  console.log(`   - ${productoresUnicos.length} productores`)
  
  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
