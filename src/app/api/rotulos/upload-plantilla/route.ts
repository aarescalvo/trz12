import { NextRequest, NextResponse } from 'next/server'
import { TipoRotulo } from '@prisma/client'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Subir plantilla (ZPL, DPL o archivo binario .lbl/.nlbl)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const nombre = formData.get('nombre') as string
    const codigo = formData.get('codigo') as string
    const tipo = formData.get('tipo') as TipoRotulo
    const tipoImpresora = formData.get('tipoImpresora') as string || 'ZEBRA'
    const ancho = parseInt(formData.get('ancho') as string) || 80
    const alto = parseInt(formData.get('alto') as string) || 50
    const dpi = parseInt(formData.get('dpi') as string) || 203
    const contenido = formData.get('contenido') as string
    const variables = formData.get('variables') as string
    const categoria = formData.get('categoria') as string || null
    const diasConsumo = parseInt(formData.get('diasConsumo') as string) || 30
    const temperaturaMax = parseFloat(formData.get('temperaturaMax') as string) || 5.0
    const esBinario = formData.get('esBinario') === 'true'

    if (!contenido || !nombre || !codigo || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Si es archivo binario, obtener el contenido como base64
    let contenidoFinal = contenido
    if (esBinario && file) {
      const buffer = await file.arrayBuffer()
      contenidoFinal = Buffer.from(buffer).toString('base64')
    }

    // Verificar si ya existe
    const existente = await db.rotulo.findUnique({
      where: { codigo }
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un rótulo con ese código' },
        { status: 400 }
      )
    }

    // Si se establece categoría, verificar si ya hay un default para esa categoría
    let esDefault = false
    if (categoria) {
      const existentesEnCategoria = await db.rotulo.findFirst({
        where: { categoria, esDefault: true }
      })
      // Si no hay ningún default, este será el default
      esDefault = !existentesEnCategoria
    }

    // Crear el rótulo
    const rotulo = await db.rotulo.create({
      data: {
        nombre,
        codigo,
        tipo,
        categoria,
        tipoImpresora,
        ancho,
        alto,
        dpi,
        contenido: contenidoFinal,
        variables,
        nombreArchivo: file?.name || null,
        diasConsumo,
        temperaturaMax,
        activo: true,
        esDefault
      }
    })

    return NextResponse.json(rotulo, { status: 201 })
  } catch (error) {
    console.error('Error al subir plantilla:', error)
    return NextResponse.json(
      { error: 'Error al subir plantilla' },
      { status: 500 }
    )
  }
}
