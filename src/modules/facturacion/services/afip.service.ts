/**
 * Servicio AFIP — Stub para desarrollo, integración real en producción.
 * En testing: simula la respuesta del WSAA + WSFEv1
 * En producción: conecta con los web services de AFIP
 */

export class AfipService {
  
  async solicitarCAE(facturaData: {
    tipoComprobante: number
    puntoVenta: number
    concepto: number
    docTipo: number
    docNro: number
    importeTotal: number
    importeNeto: number
    importeIVA: number
    fecha: string
  }): Promise<{ cae: string; caeVencimiento: Date; resultado: string }> {
    // Stub: simular respuesta AFIP en testing
    const config = await this.getConfig()
    
    if (config?.entorno === 'testing') {
      // Simular CAE en testing
      const cae = Math.random().toString().slice(2, 16).padEnd(14, '0')
      const vencimiento = new Date()
      vencimiento.setDate(vencimiento.getDate() + 10)
      
      return {
        cae,
        caeVencimiento: vencimiento,
        resultado: 'A'  // Aprobado
      }
    }
    
    // En producción: conectar con WSFEv1 real
    throw new Error('Integración AFIP producción no implementada aún. Configure los certificados primero.')
  }
  
  private async getConfig() {
    try {
      const { db } = await import('@/lib/db')
      return db.configuracionAFIP.findFirst({ where: { activo: true } })
    } catch {
      return null
    }
  }
}

export const afipService = new AfipService()
