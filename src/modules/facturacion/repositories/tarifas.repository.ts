import { db } from '@/lib/db'

export class TarifasRepository {
  
  async findVigentesPara(params: {
    tipoTarifaCodigo: string
    fechaFaena: Date
    clienteId?: string | null
    especie?: string | null
    categoria?: string | null
  }) {
    const { tipoTarifaCodigo, fechaFaena, clienteId, especie, categoria } = params
    
    // Get the TipoTarifa id from codigo
    const tipoTarifa = await db.tipoTarifa.findUnique({ where: { codigo: tipoTarifaCodigo } })
    if (!tipoTarifa) return []
    
    // Build where clause combining vigencia and cliente filters with AND
    const where: any = {
      AND: [
        {
          tipoTarifaId: tipoTarifa.id,
          vigenciaDesde: { lte: fechaFaena },
          OR: [
            { vigenciaHasta: null },
            { vigenciaHasta: { gte: fechaFaena } }
          ],
        },
        clienteId
          ? { OR: [{ clienteId: null }, { clienteId }] }
          : { clienteId: null },
      ]
    }
    
    return db.historicoTarifa.findMany({
      where,
      include: { tipoTarifa: true, cliente: { select: { id: true, nombre: true, razonSocial: true } } },
      orderBy: { vigenciaDesde: 'desc' }
    })
  }
  
  async findHistorico(filtros: {
    tipoTarifaCodigo?: string
    clienteId?: string
    especie?: string
    desde?: Date
    hasta?: Date
  }) {
    const where: any = {}
    
    if (filtros.tipoTarifaCodigo) {
      const tipo = await db.tipoTarifa.findUnique({ where: { codigo: filtros.tipoTarifaCodigo } })
      if (tipo) where.tipoTarifaId = tipo.id
    }
    if (filtros.clienteId) where.clienteId = filtros.clienteId
    if (filtros.especie) where.especie = filtros.especie
    if (filtros.desde || filtros.hasta) {
      where.vigenciaDesde = {}
      if (filtros.desde) where.vigenciaDesde.gte = filtros.desde
      if (filtros.hasta) where.vigenciaDesde.lte = filtros.hasta
    }
    
    return db.historicoTarifa.findMany({
      where,
      include: { 
        tipoTarifa: true, 
        cliente: { select: { id: true, nombre: true, razonSocial: true } },
        operador: { select: { id: true, nombre: true } }
      },
      orderBy: { vigenciaDesde: 'desc' }
    })
  }
  
  async findVigentesHoy() {
    const hoy = new Date()
    return db.historicoTarifa.findMany({
      where: {
        vigenciaDesde: { lte: hoy },
        vigenciaHasta: null,
      },
      include: { tipoTarifa: true, cliente: { select: { id: true, nombre: true, razonSocial: true } } },
      orderBy: [{ tipoTarifa: { orden: 'asc' } }, { cliente: { nombre: 'asc' } }]
    })
  }
  
  async cerrarTarifaActual(params: {
    tipoTarifaCodigo: string
    clienteId?: string | null
    especie?: string | null
    categoria?: string | null
    hasta: Date
  }) {
    const tipo = await db.tipoTarifa.findUnique({ where: { codigo: params.tipoTarifaCodigo } })
    if (!tipo) return
    
    const where: any = {
      tipoTarifaId: tipo.id,
      vigenciaHasta: null,
    }
    if (params.clienteId) where.clienteId = params.clienteId
    else where.clienteId = null
    if (params.especie) where.especie = params.especie
    if (params.categoria) where.categoria = params.categoria
    
    return db.historicoTarifa.updateMany({
      where,
      data: { vigenciaHasta: params.hasta }
    })
  }
  
  async create(data: {
    tipoTarifaCodigo: string
    valor: number
    vigenciaDesde: Date
    clienteId?: string | null
    especie?: string | null
    categoria?: string | null
    motivo?: string | null
    operadorId: string
  }) {
    const tipo = await db.tipoTarifa.findUnique({ where: { codigo: data.tipoTarifaCodigo } })
    if (!tipo) throw new Error(`Tipo de tarifa ${data.tipoTarifaCodigo} no encontrado`)
    
    return db.historicoTarifa.create({
      data: {
        tipoTarifaId: tipo.id,
        valor: data.valor,
        vigenciaDesde: data.vigenciaDesde,
        clienteId: data.clienteId || null,
        especie: data.especie || null,
        categoria: data.categoria || null,
        motivo: data.motivo,
        operadorId: data.operadorId,
      },
      include: { tipoTarifa: true, cliente: { select: { id: true, nombre: true } } }
    })
  }
  
  async findTiposActivos() {
    return db.tipoTarifa.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } })
  }
  
  async seedTiposDefault() {
    const TIPOS_DEFAULT = [
      { codigo: 'FAENA_BOVINO', descripcion: 'Servicio de faena bovino', unidad: 'POR_KG', orden: 1 },
      { codigo: 'FAENA_EQUINO', descripcion: 'Servicio de faena equino', unidad: 'POR_KG', orden: 2 },
      { codigo: 'FAENA_PORCINO', descripcion: 'Servicio de faena porcino', unidad: 'POR_KG', orden: 3 },
      { codigo: 'ESTACIONAMIENTO', descripcion: 'Estacionamiento en cámara', unidad: 'POR_KG_POR_DIA', orden: 10 },
      { codigo: 'HONORARIOS_VET', descripcion: 'Honorarios veterinario bromatología', unidad: 'POR_CABEZA', orden: 20 },
      { codigo: 'SELLADO_SENASA', descripcion: 'Sellado/estampillas SENASA', unidad: 'POR_CABEZA', orden: 21 },
      { codigo: 'FLETE', descripcion: 'Flete/transporte', unidad: 'FIJO', orden: 30 },
      { codigo: 'DOCUMENTACION', descripcion: 'Guías y documentación', unidad: 'FIJO', orden: 31 },
    ]
    
    let created = 0
    for (const tipo of TIPOS_DEFAULT) {
      const existing = await db.tipoTarifa.findUnique({ where: { codigo: tipo.codigo } })
      if (!existing) {
        await db.tipoTarifa.create({ data: tipo })
        created++
      }
    }
    return created
  }
}

export const tarifasRepository = new TarifasRepository()
