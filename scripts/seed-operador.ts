import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Verificar si existe operador
  const existente = await prisma.operador.findFirst()
  
  if (existente) {
    console.log('Operador existente:', existente.usuario)
    return
  }
  
  // Crear operador admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const operador = await prisma.operador.create({
    data: {
      nombre: 'Administrador',
      usuario: 'admin',
      password: hashedPassword,
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
      puedeConfiguracion: true
    }
  })
  
  console.log('Operador creado:', operador.usuario, 'ID:', operador.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
