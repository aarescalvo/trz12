import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Get label templates with preview
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeConfiguracion')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === 'true'
    const tipo = searchParams.get('tipo')
    const formato = searchParams.get('formato') // ZPL, DPL, PDF

    const where: Record<string, unknown> = { activo: true }
    if (tipo) where.tipo = tipo

    const rotulos = await db.rotulo.findMany({
      where,
      include: {
        elementos: {
          orderBy: { orden: 'asc' }
        }
      },
      orderBy: [{ esDefault: 'desc' }, { nombre: 'asc' }]
    })

    // Preview mode: render sample labels with sample data
    if (preview) {
      const sampleData = {
        NUMERO: '42',
        TROPA: 'B 2026 0015',
        TIPO: 'VA',
        PESO: '452.5',
        CODIGO: 'B20260015-042',
        RAZA: 'Angus',
        FECHA: new Date().toLocaleDateString('es-AR'),
        FECHA_VENC: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR'),
        PRODUCTO: 'Media Res',
        GARRON: '42',
        LADO: 'I',
        SIGLA: 'A',
        PESO_NETO: '118.5',
        USUARIO_FAENA: 'Ganadera del Sur',
        MATRICULA: '12345',
        CODIGO_BARRAS: 'B202600150421',
      }

      const rendered = rotulos.map(rotulo => {
        let contenido = rotulo.contenido || ''

        // Replace variables with sample data
        for (const [key, value] of Object.entries(sampleData)) {
          contenido = contenido.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        }

        return {
          ...rotulo,
          renderedPreview: contenido,
          sampleData,
          anchoMM: rotulo.ancho,
          altoMM: rotulo.alto
        }
      })

      return NextResponse.json({
        success: true,
        data: rendered,
        sampleData
      })
    }

    // Generate print queue stats
    const totalRotulos = await db.rotulo.count({ where: { activo: true } })
    const porTipo = await db.rotulo.groupBy({
      by: ['tipo'],
      where: { activo: true },
      _count: { id: true }
    })

    const porImpresora = await db.rotulo.groupBy({
      by: ['tipoImpresora'],
      where: { activo: true },
      _count: { id: true }
    })

    // Export format conversion
    let exportData = null
    if (formato === 'ZPL' || formato === 'DPL') {
      exportData = rotulos
        .filter(r => r.tipoImpresora === (formato === 'ZPL' ? 'ZEBRA' : 'DATAMAX'))
        .map(r => ({
          nombre: r.nombre,
          codigo: r.codigo,
          tipo: r.tipo,
          tipoImpresora: r.tipoImpresora,
          ancho: r.ancho,
          alto: r.alto,
          dpi: r.dpi,
          contenido: r.contenido,
          elementos: r.elementos
        }))
    }

    return NextResponse.json({
      success: true,
      data: rotulos,
      stats: {
        total: totalRotulos,
        porTipo,
        porImpresora
      },
      exportData
    })
  } catch (error) {
    console.error('Error en rotulos mejoras:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener rótulos' },
      { status: 500 }
    )
  }
}

// POST - Create new label template
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeConfiguracion')
    if (authError) return authError

    const body = await request.json()
    const {
      nombre,
      codigo,
      tipo,
      tipoImpresora,
      modeloImpresora,
      ancho,
      alto,
      dpi,
      contenido,
      elementos,
      esDefault,
      diasConsumo,
      temperaturaMax
    } = body

    if (!nombre || !codigo || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: nombre, codigo, tipo' },
        { status: 400 }
      )
    }

    // Check for duplicate code
    const existing = await db.rotulo.findUnique({ where: { codigo } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un rótulo con ese código' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults of same type
    if (esDefault) {
      await db.rotulo.updateMany({
        where: { tipo: tipo as any, esDefault: true },
        data: { esDefault: false }
      })
    }

    // Create the rotulo with elements
    const rotulo = await db.rotulo.create({
      data: {
        nombre,
        codigo,
        tipo: tipo as any,
        tipoImpresora: tipoImpresora || 'ZEBRA',
        modeloImpresora: modeloImpresora || 'ZT410',
        ancho: ancho || 80,
        alto: alto || 50,
        dpi: dpi || 203,
        contenido: contenido || '',
        esDefault: esDefault || false,
        diasConsumo: diasConsumo || 30,
        temperaturaMax: temperaturaMax || 5.0,
        elementos: {
          create: (elementos || []).map((el: Record<string, unknown>, idx: number) => ({
            tipo: el.tipo || 'TEXTO',
            campo: el.campo || null,
            textoFijo: el.textoFijo || null,
            posX: el.posX || 0,
            posY: el.posY || 0,
            ancho: el.ancho || 100,
            alto: el.alto || 30,
            fuente: el.fuente || '0',
            tamano: el.tamano || 10,
            negrita: el.negrita || false,
            alineacion: el.alineacion || 'LEFT',
            tipoCodigo: el.tipoCodigo || null,
            altoCodigo: el.altoCodigo || null,
            mostrarTexto: el.mostrarTexto || null,
            grosorLinea: el.grosorLinea || null,
            color: el.color || null,
            orden: el.orden ?? idx,
          }))
        }
      },
      include: {
        elementos: {
          orderBy: { orden: 'asc' }
        }
      }
    })

    // Audit log
    await db.auditoria.create({
      data: {
        modulo: 'ROTULOS_MEJORAS',
        accion: 'CREATE',
        entidad: 'Rotulo',
        entidadId: rotulo.id,
        descripcion: `Nueva plantilla de rótulo creada: ${nombre}`,
        datosDespues: JSON.stringify(body)
      }
    })

    return NextResponse.json({
      success: true,
      data: rotulo,
      message: 'Plantilla creada correctamente'
    })
  } catch (error) {
    console.error('Error al crear rótulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear plantilla' },
      { status: 500 }
    )
  }
}

// PUT - Update label template
export async function PUT(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeConfiguracion')
    if (authError) return authError

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Get existing for audit
    const existing = await db.rotulo.findUnique({
      where: { id },
      include: { elementos: true }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Rótulo no encontrado' },
        { status: 404 }
      )
    }

    // If setting as default, unset other defaults
    if (updateData.esDefault) {
      await db.rotulo.updateMany({
        where: { tipo: existing.tipo, esDefault: true },
        data: { esDefault: false }
      })
    }

    // Update elements if provided
    if (updateData.elementos) {
      await db.rotuloElemento.deleteMany({ where: { rotuloId: id } })
    }

    const rotulo = await db.rotulo.update({
      where: { id },
      data: {
        nombre: updateData.nombre,
        codigo: updateData.codigo,
        tipo: updateData.tipo,
        tipoImpresora: updateData.tipoImpresora,
        modeloImpresora: updateData.modeloImpresora,
        ancho: updateData.ancho,
        alto: updateData.alto,
        dpi: updateData.dpi,
        contenido: updateData.contenido,
        esDefault: updateData.esDefault,
        diasConsumo: updateData.diasConsumo,
        temperaturaMax: updateData.temperaturaMax,
        ...(updateData.elementos ? {
          elementos: {
            create: updateData.elementos.map((el: Record<string, unknown>, idx: number) => ({
              tipo: el.tipo || 'TEXTO',
              campo: el.campo || null,
              textoFijo: el.textoFijo || null,
              posX: el.posX || 0,
              posY: el.posY || 0,
              ancho: el.ancho || 100,
              alto: el.alto || 30,
              fuente: el.fuente || '0',
              tamano: el.tamano || 10,
              negrita: el.negrita || false,
              alineacion: el.alineacion || 'LEFT',
              tipoCodigo: el.tipoCodigo || null,
              altoCodigo: el.altoCodigo || null,
              mostrarTexto: el.mostrarTexto || null,
              grosorLinea: el.grosorLinea || null,
              color: el.color || null,
              orden: el.orden ?? idx,
            }))
          }
        } : {})
      },
      include: {
        elementos: {
          orderBy: { orden: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: rotulo,
      message: 'Plantilla actualizada correctamente'
    })
  } catch (error) {
    console.error('Error al actualizar rótulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar plantilla' },
      { status: 500 }
    )
  }
}
