/**
 * Test de conexión a base de datos
 * Uso: bun run db:test
 */

import { db } from '../src/lib/db'

async function testConnection() {
  console.log('🔍 Test de conexión a base de datos\n')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
  console.log('')
  
  try {
    // Test de conexión
    console.log('1️⃣  Conectando...')
    await db.$queryRaw`SELECT 1 as test`
    console.log('   ✅ Conexión exitosa\n')
    
    // Verificar tablas principales
    console.log('2️⃣  Verificando tablas...')
    
    const counts = {
      operadores: await db.operador.count(),
      clientes: await db.cliente.count(),
      tropas: await db.tropa.count(),
      animales: await db.animal.count(),
      corrales: await db.corral.count(),
      camaras: await db.camara.count(),
      productos: await db.producto.count(),
    }
    
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`)
    })
    
    // Verificar admin
    console.log('\n3️⃣  Verificando admin...')
    const admin = await db.operador.findFirst({ where: { usuario: 'admin' } })
    
    if (admin) {
      console.log('   ✅ Admin encontrado:', admin.nombre)
    } else {
      console.log('   ⚠️  Admin NO encontrado - ejecutar: bun run db:seed')
    }
    
    console.log('\n✅ TEST EXITOSO - Base de datos operativa')
    return true
    
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error)
    console.log('\n📋 POSIBLES CAUSAS:')
    console.log('   1. Base de datos no existe')
    console.log('   2. Credenciales incorrectas')
    console.log('   3. Servidor no está corriendo')
    console.log('\n🔧 SOLUCIONES:')
    console.log('   - Ejecutar: bun run db:push')
    console.log('   - Ejecutar: bun run db:seed')
    return false
  } finally {
    await db.$disconnect()
  }
}

testConnection()
  .then((success) => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1))
