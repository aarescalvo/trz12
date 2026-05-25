import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { checkPermission } from '@/lib/auth-helpers'

const logger = createLogger('API:CodigoBarras')

// Configuración por defecto si no hay datos en BD
const CONFIG_DEFAULT = [
  { 
    tipo: 'Media Res', 
    prefijo: 'MR', 
    formato: 'MR-TROPA-GARRON-LADO-FECHA',
    descripcion: 'Código para media res individual',
    variables: '["TROPA", "GARRON", "LADO", "FECHA"]',
    esDefault: true
  },
  { 
    tipo: 'Cuarto', 
    prefijo: 'CD', 
    formato: 'CD-TROPA-GARRON-TIPO',
    descripcion: 'Código para cuarto delantero/trasero',
    variables: '["TROPA", "GARRON", "TIPO"]',
    esDefault: false
  },
  { 
    tipo: 'Producto', 
    prefijo: 'PR', 
    formato: 'PR-CODIGO-LOTE-FECHA',
    descripcion: 'Código para producto terminado',
    variables: '["CODIGO", "LOTE", "FECHA"]',
    esDefault: false
  },
  { 
    tipo: 'Caja', 
    prefijo: 'CJ', 
    formato: 'CJ-CODIGO-PESO-NUM',
    descripcion: 'Código para caja de producto',
    variables: '["CODIGO", "PESO", "NUM"]',
    esDefault: false
  },
  { 
    tipo: 'Subproducto', 
    prefijo: 'SB', 
    formato: 'SB-CODIGO-FECHA',
    descripcion: 'Código para subproductos',
    variables: '["CODIGO", "FECHA"]',
    esDefault: false
  },
  { 
    tipo: 'Menudencia', 
    prefijo: 'MN', 
    formato: 'MN-CODIGO-BOLSA-FECHA',
    descripcion: 'Código para menudencias',
    variables: '["CODIGO", "BOLSA", "FECHA"]',
    esDefault: false
  },
]

// Inicializar configuración por defecto si está vacía
async function inicializarSiVacio() {
  const count = await db.codigoBarrasConfig.count()
  if (count === 0) {
    logger.info('Inicializando configuración de códigos de barras')
    await db.codigoBarrasConfig.createMany({
      data: CONFIG_DEFAULT
    })
  }
}

// GET - Listar configuración de códigos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    await inicializarSiVacio()
    
    const configs = await db.codigoBarrasConfig.findMany({
      where: { activo: true },
      orderBy: { tipo: 'asc' }
    })
    
    logger.debug('Configuraciones obtenidas', { count: configs.length })
    
    return NextResponse.json({ 
      success: true, 
      data: configs 
    })
  } catch (error) {
    logger.error('Error al obtener códigos', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al obtener códigos' 
    }, { status: 500 })
  }
}

// POST - Crear nueva configuración
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { tipo, prefijo, formato, descripcion, variables, esDefault } = body
    
    // Validar que el tipo sea único
    const existente = await db.codigoBarrasConfig.findFirst({
      where: { tipo }
    })
    
    if (existente) {
      return NextResponse.json({ 
        success: false, 
        error: `Ya existe una configuración para el tipo "${tipo}"` 
      }, { status: 400 })
    }
    
    // Si es default, quitar default de las otras
    if (esDefault) {
      await db.codigoBarrasConfig.updateMany({
        where: { esDefault: true },
        data: { esDefault: false }
      })
    }
    
    const config = await db.codigoBarrasConfig.create({
      data: {
        tipo,
        prefijo,
        formato,
        descripcion,
        variables: variables ? JSON.stringify(variables) : null,
        esDefault: esDefault || false
      }
    })
    
    logger.info('Configuración creada', { tipo, prefijo })
    
    return NextResponse.json({ 
      success: true, 
      data: config 
    })
  } catch (error) {
    logger.error('Error al crear configuración', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al crear configuración' 
    }, { status: 500 })
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, tipo, prefijo, formato, descripcion, variables, esDefault, activo } = body
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID es requerido' 
      }, { status: 400 })
    }
    
    // Si es default, quitar default de las otras
    if (esDefault) {
      await db.codigoBarrasConfig.updateMany({
        where: { esDefault: true, id: { not: id } },
        data: { esDefault: false }
      })
    }
    
    const config = await db.codigoBarrasConfig.update({
      where: { id },
      data: {
        tipo,
        prefijo,
        formato,
        descripcion,
        variables: variables ? JSON.stringify(variables) : null,
        esDefault,
        activo,
        updatedAt: new Date()
      }
    })
    
    logger.info('Configuración actualizada', { tipo, prefijo })
    
    return NextResponse.json({ 
      success: true, 
      data: config 
    })
  } catch (error) {
    logger.error('Error al actualizar configuración', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al actualizar configuración' 
    }, { status: 500 })
  }
}

// DELETE - Eliminar configuración
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID es requerido' 
      }, { status: 400 })
    }
    
    await db.codigoBarrasConfig.delete({
      where: { id }
    })
    
    logger.info('Configuración eliminada', { id })
    
    return NextResponse.json({ 
      success: true, 
      data: { id } 
    })
  } catch (error) {
    logger.error('Error al eliminar configuración', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al eliminar configuración' 
    }, { status: 500 })
  }
}
