import { describe, it, expect } from 'bun:test'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = join(import.meta.dir, '..')

describe('Verificación de Archivos - Batt Scripts', () => {
  
  const battScripts = [
    'iniciar-servidor.bat',
    'iniciar-segundo-plano.bat',
    'detener-servidor.bat',
    'backup-todo.bat',
    'restaurar-backup.bat',
    'listar-backups.bat',
    'menu.bat',
    'verificar-estado.bat',
    'ejecutar-lint.bat',
    'actualizar-github.bat',
    'build-proyecto.bat',
    'ver-logs.bat',
    'exportar-db.bat',
    'importar-db.bat',
    'iniciar-produccion.bat'
  ]

  battScripts.forEach(script => {
    it(`Script ${script} debe existir`, () => {
      const path = join(PROJECT_ROOT, 'batt', script)
      expect(existsSync(path)).toBe(true)
    })
  })

})

describe('Verificación de API Reportes', () => {
  
  it('API reportes/route.ts debe existir', () => {
    const path = join(PROJECT_ROOT, 'src/app/api/reportes/route.ts')
    expect(existsSync(path)).toBe(true)
  })

  it('API reportes debe tener filtros avanzados', () => {
    const path = join(PROJECT_ROOT, 'src/app/api/reportes/route.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('tropaCodigo')
    expect(content).toContain('fechaFaena')
    expect(content).toContain('resumen')
    expect(content).toContain('rendimientoPorTropa')
    expect(content).toContain('detalleFaena')
    expect(content).toContain('ocupacionPorc')
  })

})

describe('Verificación de UI Reportes', () => {
  
  it('Componente reportes/index.tsx debe existir', () => {
    const path = join(PROJECT_ROOT, 'src/components/reportes/index.tsx')
    expect(existsSync(path)).toBe(true)
  })

  it('UI debe tener filtros de rango de fecha', () => {
    const path = join(PROJECT_ROOT, 'src/components/reportes/index.tsx')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('filtroRangoFecha')
    expect(content).toContain('busquedaTropa')
    expect(content).toContain('busquedaFechaFaena')
    expect(content).toContain('resumen')
  })

})

describe('Verificación de Tests', () => {
  
  it('Archivo de tests debe existir', () => {
    const path = join(PROJECT_ROOT, 'tests/reportes.test.ts')
    expect(existsSync(path)).toBe(true)
  })

})

console.log('\n✅ Verificación completada!')
console.log('\nPara ejecutar tests de integración con servidor:')
console.log('  1. Iniciar servidor: bun run dev')
console.log('  2. En otra terminal: bun test\n')