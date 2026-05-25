/**
 * Script para borrar TODAS las tropas de la base de datos
 * Ejecutar con: bun prisma/delete-all-tropas.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllTropas() {
  console.log('🗑️ Iniciando borrado de TODAS las tropas...\n')

  try {
    // 1. Contar registros actuales
    const tropasCount = await prisma.tropa.count()
    const animalesCount = await prisma.animal.count()
    const tiposAnimalesCount = await prisma.tropaAnimalCantidad.count()
    
    console.log(`📊 Registros actuales:`)
    console.log(`   - Tropas: ${tropasCount}`)
    console.log(`   - Animales: ${animalesCount}`)
    console.log(`   - Tipos de animales por tropa: ${tiposAnimalesCount}\n`)

    if (tropasCount === 0) {
      console.log('✅ No hay tropas para borrar.')
      return
    }

    // 2. Borrar pesajes individuales
    console.log('🗑️ Borrando pesajes individuales...')
    const pesajesDeleted = await prisma.pesajeIndividual.deleteMany({})
    console.log(`   ✅ ${pesajesDeleted.count} pesajes individuales borrados\n`)

    // 3. Borrar animales
    console.log('🗑️ Borrando animales...')
    const animalesDeleted = await prisma.animal.deleteMany({})
    console.log(`   ✅ ${animalesDeleted.count} animales borrados\n`)

    // 4. Borrar relaciones tropas-lista faena
    console.log('🗑️ Borrando relaciones tropas-lista faena...')
    const listaTropasDeleted = await prisma.listaFaenaTropa.deleteMany({})
    console.log(`   ✅ ${listaTropasDeleted.count} relaciones borradas\n`)

    // 5. Borrar movimientos de corral que referencian tropas
    console.log('🗑️ Borrando movimientos de corral con tropa...')
    const movimientosDeleted = await prisma.movimientoCorral.deleteMany({
      where: { tropaId: { not: null } }
    })
    console.log(`   ✅ ${movimientosDeleted.count} movimientos de corral borrados\n`)

    // 6. Borrar asignaciones de garrón
    console.log('🗑️ Borrando asignaciones de garrón...')
    const asignacionesDeleted = await prisma.asignacionGarron.deleteMany({})
    console.log(`   ✅ ${asignacionesDeleted.count} asignaciones de garrón borradas\n`)

    // 7. Borrar tipos de animales por tropa
    console.log('🗑️ Borrando tipos de animales por tropa...')
    const tiposDeleted = await prisma.tropaAnimalCantidad.deleteMany({})
    console.log(`   ✅ ${tiposDeleted.count} tipos de animales borrados\n`)

    // 8. Ahora sí, borrar las tropas
    console.log('🗑️ Borrando tropas...')
    const tropasDeleted = await prisma.tropa.deleteMany({})
    console.log(`   ✅ ${tropasDeleted.count} tropas borradas\n`)

    // 9. Verificar resultado
    const tropasFinal = await prisma.tropa.count()
    const animalesFinal = await prisma.animal.count()
    
    console.log('📊 Resultado final:')
    console.log(`   - Tropas: ${tropasFinal}`)
    console.log(`   - Animales: ${animalesFinal}`)
    console.log('\n✅ ¡BORRADO COMPLETADO CON ÉXITO!')

  } catch (error) {
    console.error('❌ Error al borrar tropas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllTropas()
