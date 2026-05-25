import { NextRequest, NextResponse } from 'next/server'
import { TipoRotulo } from '@prisma/client'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todos los rótulos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') as TipoRotulo | null
    const tipoImpresora = searchParams.get('tipoImpresora')
    const activo = searchParams.get('activo')
    const esDefault = searchParams.get('esDefault')
    const categoria = searchParams.get('categoria')

    const where: any = {}
    if (tipo) where.tipo = tipo
    if (tipoImpresora) where.tipoImpresora = tipoImpresora
    if (activo !== null) where.activo = activo === 'true'
    if (esDefault !== null) where.esDefault = esDefault === 'true'
    if (categoria) where.categoria = categoria

    const rotulos = await db.rotulo.findMany({
      where,
      orderBy: [
        { esDefault: 'desc' },
        { nombre: 'asc' }
      ]
    })

    return NextResponse.json({ success: true, data: rotulos })
  } catch (error) {
    console.error('Error al obtener rótulos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener rótulos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo rótulo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    // Verificar si ya existe un rótulo con el mismo código
    const existente = await db.rotulo.findUnique({
      where: { codigo: data.codigo }
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un rótulo con ese código' },
        { status: 400 }
      )
    }

    // Si es default, quitar default de otros del mismo tipo
    if (data.esDefault) {
      await db.rotulo.updateMany({
        where: { tipo: data.tipo, esDefault: true },
        data: { esDefault: false }
      })
    }

    const rotulo = await db.rotulo.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        tipo: data.tipo,
        categoria: data.categoria,
        tipoImpresora: data.tipoImpresora || 'ZEBRA',
        ancho: data.ancho || 80,
        alto: data.alto || 50,
        dpi: data.dpi || 203,
        contenido: data.contenido || '',
        variables: data.variables,
        nombreArchivo: data.nombreArchivo,
        diasConsumo: data.diasConsumo || 30,
        temperaturaMax: data.temperaturaMax ?? 5.0,
        activo: data.activo ?? true,
        esDefault: data.esDefault ?? false
      }
    })

    return NextResponse.json(rotulo, { status: 201 })
  } catch (error) {
    console.error('Error al crear rótulo:', error)
    return NextResponse.json(
      { error: 'Error al crear rótulo' },
      { status: 500 }
    )
  }
}
