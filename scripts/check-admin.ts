import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  datasourceUrl: 'file:/home/z/my-project/db/custom.db'
})

async function main() {
  const operadores = await db.operador.findMany()
  console.log('Operadores existentes:', operadores)
  
  if (operadores.length === 0) {
    console.log('No hay operadores. Creando admin...')
    const admin = await db.operador.create({
      data: {
        nombre: 'Administrador',
        usuario: 'admin',
        password: 'admin123', // contraseña por defecto
        rol: 'ADMINISTRADOR',
        activo: true,
        puedePesajeCamiones: true,
        puedePesajeIndividual: true,
        puedeMovimientoHacienda: true,
        puedeListaFaena: true,
        puedeRomaneo: true,
        puedeIngresoCajon: true,
        puedeMenudencias: true,
        puedeStock: true,
        puedeReportes: true,
        puedeCCIR: true,
        puedeFacturacion: true,
        puedeConfiguracion: true,
      }
    })
    console.log('Admin creado:', admin)
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
