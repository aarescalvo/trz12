import { db } from '../src/lib/db'

async function checkData() {
  const tropas = await db.tropa.count()
  const animales = await db.animal.count()
  const clientes = await db.cliente.count()
  const romaneos = await db.romaneo.count()
  
  console.log('=== DATOS EN LA BASE DE DATOS ===')
  console.log(`Tropas: ${tropas}`)
  console.log(`Animales: ${animales}`)
  console.log(`Clientes: ${clientes}`)
  console.log(`Romaneos: ${romaneos}`)
  
  // Mostrar algunas tropas
  const muestraTropas = await db.tropa.findMany({
    take: 3,
    include: { usuarioFaena: true }
  })
  
  console.log('\n=== MUESTRA DE TROPAS ===')
  muestraTropas.forEach(t => {
    console.log(`${t.codigo} - ${t.usuarioFaena.nombre} - ${t.cantidadCabezas} cabezas - ${t.estado}`)
  })
}

checkData().catch(console.error)
