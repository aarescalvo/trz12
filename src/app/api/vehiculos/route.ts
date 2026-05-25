import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

/** Normaliza una patente: quita espacios, puntos, guiones → "AB123CD" */
function normalizarPatente(patente: string): string {
  return patente.replace(/[\s.\-]/g, '').toUpperCase()
}

/** Formatea una patente para mostrar: "AB 123 CD" */
function formatearPatente(patente: string): string {
  const norm = normalizarPatente(patente)
  if (norm.length === 6) {
    return `${norm.slice(0, 2)} ${norm.slice(2, 5)} ${norm.slice(5)}`
  }
  if (norm.length === 7) {
    return `${norm.slice(0, 2)} ${norm.slice(2, 5)} ${norm.slice(5)}`
  }
  return norm
}

// GET - Buscar vehículos por patente o listar
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedePesajeCamiones')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const patente = searchParams.get('patente')
    const buscar = searchParams.get('buscar')

    // Búsqueda exacta por patente normalizada
    if (patente) {
      const patenteNorm = normalizarPatente(patente)
      const vehiculo = await db.vehiculo.findUnique({
        where: { patente: patenteNorm },
        include: { transportista: true }
      })

      if (!vehiculo) {
        return NextResponse.json({ success: true, data: null })
      }

      return NextResponse.json({ success: true, data: vehiculo })
    }

    // Búsqueda parcial por patente, chofer o empresa
    if (buscar) {
      const term = normalizarPatente(buscar)
      const vehiculos = await db.vehiculo.findMany({
        where: {
          OR: [
            { patente: { contains: term } },
            { patenteMostrar: { contains: buscar.toUpperCase(), mode: 'insensitive' } },
            { choferNombre: { contains: buscar, mode: 'insensitive' } },
            { empresa: { contains: buscar, mode: 'insensitive' } },
          ]
        },
        include: { transportista: true },
        orderBy: { ultimaVisita: 'desc' },
        take: 20
      })

      return NextResponse.json({ success: true, data: vehiculos })
    }

    // Listar todos (últimos visitados primero)
    const vehiculos = await db.vehiculo.findMany({
      include: { transportista: true },
      orderBy: { ultimaVisita: 'desc' },
      take: 50
    })

    return NextResponse.json({ success: true, data: vehiculos })
  } catch (error) {
    console.error('Error al buscar vehículos:', error)
    return NextResponse.json(
      { error: 'Error al buscar vehículos' },
      { status: 500 }
    )
  }
}

// POST - Crear o actualizar vehículo (upsert)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedePesajeCamiones')
  if (authError) return authError

  try {
    const data = await request.json()
    const {
      patente,
      choferNombre,
      choferDni,
      choferTelefono,
      habilitacion,
      empresa,
      transportistaId
    } = data

    if (!patente || patente.trim().length < 3) {
      return NextResponse.json(
        { error: 'Patente requerida (mínimo 3 caracteres)' },
        { status: 400 }
      )
    }

    const patenteNorm = normalizarPatente(patente)
    const patenteMostrar = formatearPatente(patente)

    // Upsert: si ya existe, actualiza datos + incrementa visita
    const vehiculo = await db.vehiculo.upsert({
      where: { patente: patenteNorm },
      update: {
        patenteMostrar,
        choferNombre: choferNombre || null,
        choferDni: choferDni || null,
        choferTelefono: choferTelefono || null,
        habilitacion: habilitacion || null,
        empresa: empresa || null,
        transportistaId: transportistaId || null,
        ultimaVisita: new Date(),
        vecesVisita: { increment: 1 }
      },
      create: {
        patente: patenteNorm,
        patenteMostrar,
        choferNombre: choferNombre || null,
        choferDni: choferDni || null,
        choferTelefono: choferTelefono || null,
        habilitacion: habilitacion || null,
        empresa: empresa || null,
        transportistaId: transportistaId || null,
        ultimaVisita: new Date(),
        vecesVisita: 1
      },
      include: { transportista: true }
    })

    return NextResponse.json({ success: true, data: vehiculo })
  } catch (error) {
    console.error('Error al guardar vehículo:', error)
    return NextResponse.json(
      { error: 'Error al guardar vehículo' },
      { status: 500 }
    )
  }
}
