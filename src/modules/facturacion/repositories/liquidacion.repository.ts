import { db } from '@/lib/db'

export class LiquidacionRepository {
  
  async findPendientes() {
    // Tropas faenadas (estado FAENADO) con romaneo cerrado que no tienen liquidacion
    const tropas = await db.tropa.findMany({
      where: {
        estado: 'FAENADO',
        fechaFaena: { not: null },
        kgGancho: { not: null },
        liquidacionesFaena: { none: {} },
      },
      include: {
        usuarioFaena: { select: { id: true, nombre: true, cuit: true, condicionIva: true, razonSocial: true } },
        productor: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaFaena: 'desc' }
    })
    
    return tropas.map(t => ({
      id: t.id,
      codigo: t.codigo,
      especie: t.especie,
      cantidadCabezas: t.cantidadCabezas,
      kgGancho: t.kgGancho,
      pesoTotalIndividual: t.pesoTotalIndividual,
      fechaFaena: t.fechaFaena,
      dte: t.dte,
      guia: t.guia,
      usuarioFaena: t.usuarioFaena,
      productor: t.productor,
      romaneosCount: 0,
      tieneLiquidacion: false,
    }))
  }
  
  async findById(id: string) {
    return db.liquidacionFaena.findUnique({
      where: { id },
      include: {
        tropa: { select: { id: true, codigo: true, especie: true, cantidadCabezas: true, dte: true, guia: true } },
        cliente: { select: { id: true, nombre: true, cuit: true, condicionIva: true, razonSocial: true, direccion: true } },
        items: { orderBy: { createdAt: 'asc' } },
        factura: { select: { id: true, numero: true, tipoComprobante: true, cae: true, estado: true } },
        operador: { select: { id: true, nombre: true } },
        supervisor: { select: { id: true, nombre: true } },
      }
    })
  }
  
  async findAll(filtros?: { estado?: string; clienteId?: string; desde?: Date; hasta?: Date }) {
    const where: any = {}
    if (filtros?.estado) where.estado = filtros.estado
    if (filtros?.clienteId) where.clienteId = filtros.clienteId
    if (filtros?.desde || filtros?.hasta) {
      where.fechaFaena = {}
      if (filtros.desde) where.fechaFaena.gte = filtros.desde
      if (filtros.hasta) where.fechaFaena.lte = filtros.hasta
    }
    
    return db.liquidacionFaena.findMany({
      where,
      include: {
        tropa: { select: { id: true, codigo: true, especie: true, cantidadCabezas: true } },
        cliente: { select: { id: true, nombre: true, razonSocial: true } },
        items: true,
        factura: { select: { id: true, numero: true, cae: true, estado: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
  }
  
  async createFromRomaneo(data: {
    tropaId: string
    clienteId: string
    fechaFaena: Date
    dteSenasa?: string
    cantCabezas: number
    kgRomaneo: number
    tarifaFaenaId?: string
    tarifaFaenaValor: number
    subtotalNeto: number
    totalIVA: number
    totalFinal: number
    operadorId: string
    items: Array<{
      tipoTarifaId?: string
      descripcion: string
      unidad: string
      cantidad: number
      tarifaValor: number
      subtotal: number
      alicuotaIVA: number
      importeIVA: number
      esDescuento?: boolean
    }>
  }) {
    // Get next numero
    const last = await db.liquidacionFaena.findFirst({ orderBy: { numero: 'desc' }, select: { numero: true } })
    const numero = (last?.numero || 0) + 1
    
    return db.liquidacionFaena.create({
      data: {
        numero,
        tropaId: data.tropaId,
        clienteId: data.clienteId,
        fechaFaena: data.fechaFaena,
        dteSenasa: data.dteSenasa,
        cantCabezas: data.cantCabezas,
        kgRomaneo: data.kgRomaneo,
        tarifaFaenaId: data.tarifaFaenaId,
        tarifaFaenaValor: data.tarifaFaenaValor,
        subtotalNeto: data.subtotalNeto,
        totalIVA: data.totalIVA,
        totalFinal: data.totalFinal,
        estado: 'BORRADOR',
        operadorId: data.operadorId,
        items: { create: data.items }
      },
      include: {
        tropa: true, cliente: true, items: true
      }
    })
  }
  
  async updateItems(liquidacionId: string, items: Array<{
    id?: string
    tipoTarifaId?: string | null
    descripcion: string
    unidad: string
    cantidad: number
    tarifaValor: number
    alicuotaIVA: number
    esDescuento?: boolean
  }>) {
    // Delete existing items and recreate
    await db.liquidacionItem.deleteMany({ where: { liquidacionId } })
    
    const createdItems: Awaited<ReturnType<typeof db.liquidacionItem.create>>[] = []
    for (const item of items) {
      const subtotal = item.cantidad * item.tarifaValor
      const importeIVA = item.esDescuento ? 0 : subtotal * (item.alicuotaIVA / 100)
      const created = await db.liquidacionItem.create({
        data: {
          liquidacionId,
          tipoTarifaId: item.tipoTarifaId || null,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidad: item.cantidad,
          tarifaValor: item.tarifaValor,
          subtotal,
          alicuotaIVA: item.alicuotaIVA,
          importeIVA,
          esDescuento: item.esDescuento || false,
        }
      })
      createdItems.push(created)
    }
    
    // Recalculate totals
    const subtotalNeto = createdItems.filter((i) => !i.esDescuento).reduce((s, i) => s + i.subtotal, 0)
    const descuentos = createdItems.filter((i) => i.esDescuento).reduce((s, i) => s + i.subtotal, 0)
    const totalIVA = createdItems.filter((i) => !i.esDescuento).reduce((s, i) => s + i.importeIVA, 0)
    const totalFinal = subtotalNeto - descuentos + totalIVA
    
    return db.liquidacionFaena.update({
      where: { id: liquidacionId },
      data: { subtotalNeto: subtotalNeto - descuentos, totalIVA, totalFinal },
      include: { items: true, tropa: true, cliente: true }
    })
  }
  
  async emitir(liquidacionId: string, facturaId: string) {
    return db.liquidacionFaena.update({
      where: { id: liquidacionId },
      data: { estado: 'EMITIDA', facturaId }
    })
  }
  
  async anular(liquidacionId: string) {
    return db.liquidacionFaena.update({
      where: { id: liquidacionId },
      data: { estado: 'ANULADA' }
    })
  }
  
  async setSupervisor(liquidacionId: string, supervisorId: string) {
    return db.liquidacionFaena.update({
      where: { id: liquidacionId },
      data: { supervisorId }
    })
  }
}

export const liquidacionRepository = new LiquidacionRepository()
