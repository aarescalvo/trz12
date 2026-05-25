import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Seed Tipos de Cuarto
  const tipos = [
    { nombre: 'Delantero', codigo: 'DEL', descripcion: 'Cuarto delantero de la media res', orden: 1 },
    { nombre: 'Trasero', codigo: 'TRA', descripcion: 'Cuarto trasero de la media res', orden: 2 },
    { nombre: 'Asado', codigo: 'ASA', descripcion: 'Cuarto de asado de la media res', orden: 3 },
  ]
  
  for (const tipo of tipos) {
    await prisma.c2TipoCuarto.upsert({
      where: { codigo: tipo.codigo },
      update: {},
      create: tipo,
    })
  }

  // Seed Rubros
  const rubros = [
    { nombre: 'Cortes Traseros', descripcion: 'Cortes provenientes del cuarto trasero', orden: 1 },
    { nombre: 'Cortes Delanteros', descripcion: 'Cortes provenientes del cuarto delantero', orden: 2 },
    { nombre: 'Cortes de Asado', descripcion: 'Cortes provenientes del cuarto de asado', orden: 3 },
    { nombre: 'Menudencias', descripcion: 'Menudencias y vísceras', orden: 4 },
    { nombre: 'Elaborados', descripcion: 'Productos elaborados', orden: 5 },
  ]
  
  for (const rubro of rubros) {
    await prisma.c2Rubro.upsert({
      where: { nombre: rubro.nombre },
      update: {},
      create: rubro,
    })
  }

  console.log('Seed C2 masters completado')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
