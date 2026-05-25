import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.operador.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      usuario: 'admin',
      password: hashedPassword,
      rol: 'ADMINISTRADOR',
      email: 'admin@solemar.com',
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
      puedeConfiguracion: true
    }
  })
  
  console.log('Admin creado:', admin.usuario)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
