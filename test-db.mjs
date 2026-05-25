import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  console.log('Testing Prisma client...')
  console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')))
  
  try {
    const result = await prisma.registroCuarteo.findMany({ take: 1 })
    console.log('registroCuarteo works:', result.length, 'records')
  } catch (e) {
    console.log('registroCuarteo error:', e.message)
  }
  
  try {
    const result = await prisma.loteDespostada.findMany({ take: 1 })
    console.log('loteDespostada works:', result.length, 'records')
  } catch (e) {
    console.log('loteDespostada error:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
