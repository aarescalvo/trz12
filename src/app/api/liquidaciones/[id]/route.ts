import { NextRequest, NextResponse } from 'next/server'
import { liquidacionService } from '@/modules/facturacion/services/liquidacion.service'
import { actualizarItemsSchema, supervisorAuthSchema } from '@/modules/facturacion/types'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { id } = await params
    const data = await liquidacionService.getById(id)
    if (!data) return NextResponse.json({ success: false, error: 'Liquidación no encontrada' }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    
    // Check action type
    if (body.action === 'emitir') {
      const factura = await liquidacionService.emitirFactura(id)
      return NextResponse.json({ success: true, data: factura, message: 'Factura emitida exitosamente' })
    }
    
    if (body.action === 'autorizar') {
      const parsed = supervisorAuthSchema.safeParse({ ...body, liquidacionId: id })
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: ((parsed.error as unknown as { issues?: Array<{ message: string }> }).issues?.map((e: { message: string }) => e.message).join(', ')) || 'Validation error' }, { status: 400 })
      }
      const result = await liquidacionService.autorizarEdicion(id, body.pin, body.operadorId)
      return NextResponse.json({ success: true, data: result })
    }
    
    if (body.action === 'items') {
      const parsed = actualizarItemsSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: ((parsed.error as unknown as { issues?: Array<{ message: string }> }).issues?.map((e: { message: string }) => e.message).join(', ')) || 'Validation error' }, { status: 400 })
      }
      const data = await liquidacionService.actualizarItems(id, parsed.data.items)
      return NextResponse.json({ success: true, data })
    }
    
    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { id } = await params
    const data = await liquidacionService.anular(id)
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 })
  }
}
