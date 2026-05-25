import { NextRequest, NextResponse } from 'next/server'
import { liquidacionService } from '@/modules/facturacion/services/liquidacion.service'
import { crearLiquidacionSchema } from '@/modules/facturacion/types'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

export async function GET(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeVer = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeVer) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const modo = searchParams.get('modo') || 'all'
    
    if (modo === 'pendientes') {
      const data = await liquidacionService.getPendientes()
      return NextResponse.json({ success: true, data })
    }
    
    // All liquidaciones with filters
    const data = await liquidacionService.getAll({
      estado: searchParams.get('estado') || undefined,
      clienteId: searchParams.get('clienteId') || undefined,
      desde: searchParams.get('desde') ? new Date(searchParams.get('desde')!) : undefined,
      hasta: searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : undefined,
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error liquidaciones GET:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const operadorId = body.operadorId || getOperadorId(request)
    const puedeCrear = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeCrear) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }

    const parsed = crearLiquidacionSchema.safeParse(body)
    
    if (!parsed.success) {
      const zodError = parsed.error as { issues?: Array<{ message: string }> } | undefined
      return NextResponse.json({ success: false, error: zodError?.issues?.map((e) => e.message).join(', ') || 'Validation error' }, { status: 400 })
    }
    
    const data = await liquidacionService.crearDesdeRomaneo(parsed.data.tropaId, parsed.data.operadorId)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error liquidaciones POST:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
