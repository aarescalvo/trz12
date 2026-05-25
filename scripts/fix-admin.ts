import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient({
  datasourceUrl: 'file:/home/z/my-project/db/custom.db'
})

async function main() {
  // Verificar si existe
  const existente = await db.operador.findFirst({
    where: { usuario: 'admin' }
  })
  
  if (existente) {
    console.log('Usuario admin existe, actualizando contraseña...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await db.operador.update({
      where: { id: existente.id },
      data: { 
        password: hashedPassword,
        activo: true 
      }
    })
    console.log('Contraseña actualizada con hash bcrypt')
  } else {
    console.log('Creando usuario admin...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await db.operador.create({
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
        puedeConfiguracion: true,
      }
    })
    console.log('Admin creado:', admin.usuario)
  }
  
  // Verificar
  const verif = await db.operador.findFirst({
    where: { usuario: 'admin', activo: true }
  })
  console.log('Verificación - Usuario encontrado:', verif ? verif.usuario : 'NO')
  console.log('Password hasheado:', verif?.password?.substring(0, 20) + '...')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
