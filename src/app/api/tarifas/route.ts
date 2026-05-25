import { NextRequest, NextResponse } from 'next/server'
import { tarifasService } from '@/modules/facturacion/services/tarifas.service'
import { crearTarifaSchema } from '@/modules/facturacion/types'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

export async function GET(request: NextRequest) {
  const operadorId = getOperadorId(request)
  const puedeVer = await validarPermiso(operadorId, 'puedeFacturacion')
  if (!puedeVer) {
    return NextResponse.json({ success: false, error: 'Sin permisos de facturacion' }, { status: 403 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const modo = searchParams.get('modo') || 'vigentes'
    
    if (modo === 'vigentes') {
      const data = await tarifasService.getVigentes()
      return NextResponse.json({ success: true, data })
    }
    
    if (modo === 'historico') {
      const data = await tarifasService.getHistorico({
        tipoTarifaCodigo: searchParams.get('tipo') || undefined,
        clienteId: searchParams.get('clienteId') || undefined,
        especie: searchParams.get('especie') || undefined,
        desde: searchParams.get('desde') ? new Date(searchParams.get('desde')!) : undefined,
        hasta: searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : undefined,
      })
      return NextResponse.json({ success: true, data })
    }
    
    if (modo === 'vigente') {
      const tarifa = await tarifasService.getTarifaVigente({
        tipoTarifaCodigo: searchParams.get('tipo')!,
        fechaFaena: searchParams.get('fecha') ? new Date(searchParams.get('fecha')!) : new Date(),
        clienteId: searchParams.get('clienteId') || null,
        especie: searchParams.get('especie') || null,
        categoria: searchParams.get('categoria') || null,
      })
      return NextResponse.json({ success: true, data: tarifa })
    }
    
    if (modo === 'tipos') {
      const data = await tarifasService.getTiposActivos()
      return NextResponse.json({ success: true, data })
    }
    
    // Modo seed eliminado por seguridad - usar endpoint dedicado con auth
    if (modo === 'seed') {
      return NextResponse.json({ success: false, error: 'Modo no disponible. Use el endpoint POST /api/tarifas/seed' }, { status: 403 })
    }
    
    return NextResponse.json({ success: false, error: 'Modo no válido' }, { status: 400 })
  } catch (error: any) {
    console.error('Error tarifas GET:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeCrear = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeCrear) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = crearTarifaSchema.safeParse(body)
    
    if (!parsed.success) {
      const zodError = parsed.error as { issues?: Array<{ message: string }> } | undefined
      return NextResponse.json({ success: false, error: zodError?.issues?.map((e) => e.message).join(', ') || 'Validation error' }, { status: 400 })
    }
    
    const data = await tarifasService.crearTarifa({
      ...parsed.data,
      vigenciaDesde: new Date(parsed.data.vigenciaDesde),
    })
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error tarifas POST:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
