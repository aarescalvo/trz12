import { db } from '../src/lib/db'

async function main() {
  console.log('Eliminando corrales existentes...')
  await db.corral.deleteMany({})
  
  console.log('Eliminando cámaras existentes...')
  await db.camara.deleteMany({})

  console.log('\n=== CREANDO CORRALES ===')
  
  // 10 Corrales de Descanso (D1-D10) - 20 animales cada uno
  const corralesDescanso = []
  for (let i = 1; i <= 10; i++) {
    corralesDescanso.push({
      id: `corral-d${i}`,
      nombre: `Corral D${i}`,
      capacidad: 20,
      observaciones: 'Corral de descanso',
      activo: true
    })
  }
  
  // 1 Corral de Observación
  const corralObservacion = {
    id: 'corral-observacion',
    nombre: 'Corral de Observación',
    capacidad: 20,
    observaciones: 'Corral para observación de animales',
    activo: true
  }
  
  // 1 Corral de Aislamiento
  const corralAislamiento = {
    id: 'corral-aislamiento',
    nombre: 'Corral de Aislamiento',
    capacidad: 10,
    observaciones: 'Corral de aislamiento sanitario',
    activo: true
  }
  
  const todosCorrales = [...corralesDescanso, corralObservacion, corralAislamiento]
  
  for (const corral of todosCorrales) {
    await db.corral.create({ data: corral })
    console.log(`  ✓ ${corral.nombre} - capacidad: ${corral.capacidad}`)
  }

  console.log('\n=== CREANDO CÁMARAS ===')
  
  const camaras = [
    // Cámaras de Faena
    { id: 'camara-1', nombre: 'Cámara 1', tipo: 'FAENA', capacidad: 180, observaciones: 'Capacidad: 90 animales (180 medias)' },
    { id: 'camara-2', nombre: 'Cámara 2', tipo: 'FAENA', capacidad: 154, observaciones: 'Capacidad: 77 animales (154 medias)' },
    { id: 'camara-3', nombre: 'Cámara 3', tipo: 'FAENA', capacidad: 60, observaciones: 'Capacidad: 30 animales (60 medias)' },
    
    // Cámaras de Despostada (Cuarteo)
    { id: 'camara-4', nombre: 'Cámara 4', tipo: 'CUARTEO', capacidad: 112, observaciones: 'Despostada - capacidad aprox 37 animales (112 cuartos)' },
    { id: 'camara-5', nombre: 'Cámara 5', tipo: 'CUARTEO', capacidad: 113, observaciones: 'Despostada - capacidad aprox 38 animales (113 cuartos)' },
    
    // Depósitos
    { id: 'camara-7', nombre: 'Cámara 7', tipo: 'DEPOSITO', capacidad: 6, observaciones: 'Cámara de enfriado - 6 pallets' },
    { id: 'deposito-congelado', nombre: 'Depósito de Congelado', tipo: 'DEPOSITO', capacidad: 60, observaciones: 'Capacidad: 60 pallets' },
    { id: 'deposito-enfriado', nombre: 'Depósito de Enfriado', tipo: 'DEPOSITO', capacidad: 60, observaciones: 'Capacidad: 60 pallets' },
    
    // Túneles de Congelado
    { id: 'tunel-1', nombre: 'Túnel N°1', tipo: 'DEPOSITO', capacidad: 8, observaciones: 'Túnel de congelado - 8 pallets' },
    { id: 'tunel-2', nombre: 'Túnel N°2', tipo: 'DEPOSITO', capacidad: 8, observaciones: 'Túnel de congelado - 8 pallets' },
    
    // Contenedores Reefer
    { id: 'contenedor-1', nombre: 'Contenedor N°1', tipo: 'DEPOSITO', capacidad: 19, observaciones: 'Contenedor Reefer - 19 pallets' },
    { id: 'contenedor-2', nombre: 'Contenedor N°2', tipo: 'DEPOSITO', capacidad: 19, observaciones: 'Contenedor Reefer - 19 pallets' },
    { id: 'contenedor-3', nombre: 'Contenedor N°3', tipo: 'DEPOSITO', capacidad: 19, observaciones: 'Contenedor Reefer - 19 pallets' },
    { id: 'contenedor-4', nombre: 'Contenedor N°4', tipo: 'DEPOSITO', capacidad: 19, observaciones: 'Contenedor Reefer - 19 pallets' },
  ]
  
  for (const camara of camaras) {
    await db.camara.create({ data: camara })
    console.log(`  ✓ ${camara.nombre} - tipo: ${camara.tipo}, capacidad: ${camara.capacidad}`)
  }

  // Mostrar resumen
  console.log('\n========================================')
  console.log('RESUMEN DE DATOS CARGADOS')
  console.log('========================================')
  
  console.log('\n📍 CORRALES (12 total):')
  console.log('   Descanso (10): D1-D10 - 20 animales c/u')
  console.log('   Observación (1): 20 animales')
  console.log('   Aislamiento (1): 10 animales')
  console.log('   Capacidad total: 230 animales')
  
  console.log('\n📍 CÁMARAS (14 total):')
  console.log('   Faena (3): Cámara 1, 2, 3 - 197 animales / 394 medias')
  console.log('   Despostada (2): Cámara 4, 5 - 75 animales')
  console.log('   Depósitos (2): Enfriado y Congelado - 60 pallets c/u')
  console.log('   Enfriado (1): Cámara 7 - 6 pallets')
  console.log('   Túneles (2): N°1 y N°2 - 8 pallets c/u')
  console.log('   Contenedores (4): N°1-4 - 19 pallets c/u')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
