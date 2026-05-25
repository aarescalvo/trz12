import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener layout de un módulo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const modulo = searchParams.get('modulo')
    
    if (!modulo) {
      return NextResponse.json(
        { success: false, error: 'Módulo requerido' },
        { status: 400 }
      )
    }
    
    let layout = await db.layoutGlobalModulo.findUnique({
      where: { modulo }
    })
    
    // Si no existe, crear layout por defecto
    if (!layout) {
      layout = await createDefaultLayout(modulo)
    }
    
    // Parsear JSON fields de forma segura
    const result: Record<string, unknown> = {
      id: layout.id,
      modulo: layout.modulo,
      tema: layout.tema,
      colorPrincipal: layout.colorPrincipal,
      activo: layout.activo,
    }
    
    if (layout.bloques) {
      try {
        result.bloques = JSON.parse(layout.bloques)
      } catch {
        result.bloques = null
      }
    }
    
    if (layout.botones) {
      try {
        result.botones = JSON.parse(layout.botones)
      } catch {
        result.botones = null
      }
    }
    
    // Parsear layout (que incluye items y textos)
    if (layout.layout) {
      try {
        const layoutParsed = JSON.parse(layout.layout)
        result.layout = layoutParsed
        
        // Extraer textos si existen
        if (layoutParsed.textos) {
          result.textos = layoutParsed.textos
        }
        
        // Extraer items si existen
        if (layoutParsed.items) {
          result.layout = { items: layoutParsed.items }
        }
      } catch {
        result.layout = null
      }
    }
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching layout:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener layout' },
      { status: 500 }
    )
  }
}

// POST - Guardar layout
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { modulo, bloques, botones, layout, textos, tema, colorPrincipal } = body
    
    if (!modulo) {
      return NextResponse.json(
        { success: false, error: 'Módulo requerido' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe
    const existing = await db.layoutGlobalModulo.findUnique({
      where: { modulo }
    })
    
    // Convertir a strings JSON de forma segura
    const bloquesStr = bloques ? JSON.stringify(bloques) : null
    const botonesStr = botones ? JSON.stringify(botones) : null
    const layoutStr = layout ? JSON.stringify(layout) : null
    
    // Guardar textos en el campo layout junto con los items
    const layoutConTextos = layout ? { 
      ...layout,
      textos: textos || null
    } : { textos: textos || null }
    const layoutFinalStr = JSON.stringify(layoutConTextos)
    
    let savedLayout
    if (existing) {
      savedLayout = await db.layoutGlobalModulo.update({
        where: { modulo },
        data: {
          bloques: bloquesStr,
          botones: botonesStr,
          layout: layoutFinalStr,
          tema: tema || existing.tema,
          colorPrincipal: colorPrincipal || existing.colorPrincipal,
          updatedAt: new Date()
        }
      })
    } else {
      savedLayout = await db.layoutGlobalModulo.create({
        data: {
          modulo,
          bloques: bloquesStr,
          botones: botonesStr,
          layout: layoutFinalStr,
          tema: tema || 'default',
          colorPrincipal: colorPrincipal || 'stone'
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: savedLayout.id,
        modulo: savedLayout.modulo,
        bloques: bloquesStr ? JSON.parse(bloquesStr) : null,
        botones: botonesStr ? JSON.parse(botonesStr) : null,
        layout: layoutFinalStr ? JSON.parse(layoutFinalStr) : null,
        textos: textos
      }
    })
  } catch (error) {
    console.error('Error saving layout:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar layout: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// DELETE - Resetear layout a valores por defecto
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const modulo = searchParams.get('modulo')
    
    if (!modulo) {
      return NextResponse.json(
        { success: false, error: 'Módulo requerido' },
        { status: 400 }
      )
    }
    
    // Eliminar layout existente
    await db.layoutGlobalModulo.deleteMany({
      where: { modulo }
    })
    
    // Crear layout por defecto
    const layout = await createDefaultLayout(modulo)
    
    return NextResponse.json({
      success: true,
      data: {
        id: layout.id,
        modulo: layout.modulo,
        bloques: layout.bloques ? JSON.parse(layout.bloques) : null,
        botones: layout.botones ? JSON.parse(layout.botones) : null,
        layout: layout.layout ? JSON.parse(layout.layout) : null
      },
      message: 'Layout reseteado a valores por defecto'
    })
  } catch (error) {
    console.error('Error resetting layout:', error)
    return NextResponse.json(
      { success: false, error: 'Error al resetear layout' },
      { status: 500 }
    )
  }
}

// Función para crear layout por defecto según el módulo
async function createDefaultLayout(modulo: string) {
  const defaultLayouts: Record<string, { 
    layout: { items: Array<{
      id: string
      label: string
      visible: boolean
      x: number
      y: number
      width: number
      height: number
      minWidth: number
      minHeight: number
      texto?: string
    }>}
    botones?: { items: Array<{ id: string; texto: string; visible: boolean }> }
    colorPrincipal?: string 
  }> = {
    'ingresoCajon': {
      layout: {
        items: [
          { id: 'header', label: 'Título', visible: true, x: 20, y: 20, width: 900, height: 70, minWidth: 300, minHeight: 60, texto: 'Ingreso a Cajón' },
          { id: 'resumen', label: 'Resumen', visible: true, x: 20, y: 100, width: 900, height: 60, minWidth: 200, minHeight: 50 },
          { id: 'teclado', label: 'Teclado Numérico', visible: true, x: 20, y: 180, width: 450, height: 580, minWidth: 320, minHeight: 400 },
          { id: 'listaGarrones', label: 'Lista de Garrones', visible: true, x: 490, y: 180, width: 430, height: 580, minWidth: 250, minHeight: 300 }
        ]
      },
      botones: {
        items: [
          { id: 'asignar', texto: 'ASIGNAR GARRÓN', visible: true },
          { id: 'sinIdentificar', texto: 'ASIGNAR SIN IDENTIFICAR', visible: true }
        ]
      },
      colorPrincipal: 'amber'
    }
  }
  
  const layoutData = defaultLayouts[modulo] || {
    layout: {
      items: [
        { id: 'header', label: 'Título', visible: true, x: 20, y: 20, width: 900, height: 60, minWidth: 300, minHeight: 50 },
        { id: 'contenido', label: 'Contenido', visible: true, x: 20, y: 100, width: 900, height: 600, minWidth: 400, minHeight: 300 }
      ]
    },
    colorPrincipal: 'stone'
  }
  
  const layout = await db.layoutGlobalModulo.create({
    data: {
      modulo,
      bloques: layoutData.layout ? JSON.stringify(layoutData.layout) : null,
      botones: layoutData.botones ? JSON.stringify(layoutData.botones) : null,
      layout: layoutData.layout ? JSON.stringify(layoutData.layout) : null,
      tema: 'default',
      colorPrincipal: layoutData.colorPrincipal || 'stone'
    }
  })
  
  return layout
}
