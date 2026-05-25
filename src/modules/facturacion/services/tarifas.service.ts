import { tarifasRepository } from '../repositories/tarifas.repository'
import { eventBus } from '@/core/events/event-bus'
import { ESPECIE_TARIFA_MAP } from '../constants'

export class TarifasService {
  
  /**
   * Resuelve la tarifa vigente para una combinación dada.
   * Prioridad: cliente+especie+categoría > cliente+especie > cliente > general+especie+categoría > general+especie > general
   */
  async getTarifaVigente(params: {
    tipoTarifaCodigo: string
    fechaFaena: Date
    clienteId?: string | null
    especie?: string | null
    categoria?: string | null
  }) {
    const { tipoTarifaCodigo, fechaFaena, clienteId, especie, categoria } = params
    
    const candidatos = await tarifasRepository.findVigentesPara({
      tipoTarifaCodigo, fechaFaena, clienteId, especie, categoria
    })
    
    if (candidatos.length === 0) {
      throw new Error(`No existe tarifa vigente para ${tipoTarifaCodigo} en fecha ${fechaFaena.toISOString()}`)
    }
    
    // Prioridad de resolución (más específico primero)
    const prioridades: Array<(t: { clienteId: string | null; especie: string | null; categoria: string | null }) => boolean> = [
      (t) => t.clienteId === clienteId && t.especie === especie && t.categoria === categoria,
      (t) => t.clienteId === clienteId && t.especie === especie && !t.categoria,
      (t) => t.clienteId === clienteId && !t.especie,
      (t) => !t.clienteId && t.especie === especie && t.categoria === categoria,
      (t) => !t.clienteId && t.especie === especie && !t.categoria,
      (t) => !t.clienteId && !t.especie,
    ]
    
    for (const prioridad of prioridades) {
      const match = candidatos.find(prioridad)
      if (match) return match
    }
    
    // Fallback: return first candidate
    return candidatos[0]
  }
  
  /**
   * Crear nueva tarifa — automáticamente cierra la anterior
   */
  async crearTarifa(data: {
    tipoTarifaCodigo: string
    valor: number
    vigenciaDesde: Date
    clienteId?: string | null
    especie?: string | null
    categoria?: string | null
    motivo: string
    operadorId: string
  }) {
    const { db } = await import('@/lib/db')
    
    // Cerrar tarifa anterior y crear la nueva EN TRANSACCIÓN
    const nueva = await db.$transaction(async (tx) => {
      // 1. Cerrar la tarifa anterior
      await tx.historicoTarifa.updateMany({
        where: {
          tipoTarifaCodigo: data.tipoTarifaCodigo,
          clienteId: data.clienteId || null,
          especie: data.especie || null,
          categoria: data.categoria || null,
          vigenciaHasta: null
        } as any,
        data: {
          vigenciaHasta: new Date(data.vigenciaDesde.getTime() - 86400000)
        }
      })
      
      // 2. Crear la nueva
      const tarifa = await tx.historicoTarifa.create({
        data: {
          tipoTarifaCodigo: data.tipoTarifaCodigo,
          valor: data.valor,
          vigenciaDesde: data.vigenciaDesde,
          clienteId: data.clienteId || null,
          especie: data.especie || null,
          categoria: data.categoria || null,
          motivo: data.motivo,
          operadorId: data.operadorId
        } as any
      })
      
      return tarifa
    })
    
    // 3. Emitir evento (fuera de la transacción, no afecta consistencia)
    eventBus.emit('tarifa.actualizada', { 
      tipoTarifaCodigo: data.tipoTarifaCodigo, 
      valor: data.valor,
      tarifaId: nueva.id 
    })
    
    return nueva
  }
  
  async getHistorico(filtros: {
    tipoTarifaCodigo?: string
    clienteId?: string
    especie?: string
    desde?: Date
    hasta?: Date
  }) {
    return tarifasRepository.findHistorico(filtros)
  }
  
  async getVigentes() {
    return tarifasRepository.findVigentesHoy()
  }
  
  async getTiposActivos() {
    return tarifasRepository.findTiposActivos()
  }
  
  async seedTiposDefault() {
    return tarifasRepository.seedTiposDefault()
  }
}

export const tarifasService = new TarifasService()
