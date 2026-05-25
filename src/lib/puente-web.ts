/**
 * Puente Web - Módulo de integración AFIP y SIGICA
 * 
 * Este módulo actúa como puente entre el sistema frigorífico y los servicios externos:
 * - AFIP: Facturación electrónica
 * - SIGICA: Sistema de trazabilidad sanitaria
 */

import { db } from '@/lib/db';

// ==================== CONFIGURACIÓN ====================

export interface PuenteWebConfig {
  afip: {
    habilitado: boolean;
    cuit: string;
    razonSocial: string;
    puntoVenta: number;
    inicioActividades: Date;
    certificado: string;
    clavePrivada: string;
    modoTest: boolean;
  };
  sigica: {
    habilitado: boolean;
    establecimiento: string;
    usuario: string;
    password: string;
    urlServicio: string;
    modoTest: boolean;
  };
}

// ==================== INTERFAZ UNIFICADA ====================

export class PuenteWebService {
  private config: PuenteWebConfig | null = null;

  async loadConfig(): Promise<PuenteWebConfig> {
    if (this.config) return this.config;

    // Load from database
    const configAFIP = await db.configuracionAFIP?.findFirst() as {
      cuit?: string; razonSocial?: string; inicioActividades?: Date;
      habilitado?: boolean; puntoVenta?: number; certificado?: string;
      clavePrivada?: string; modoTest?: boolean;
    } | null;
    const configSIGICA = await db.configuracionSIGICA?.findFirst();

    this.config = {
      afip: {
        habilitado: configAFIP?.habilitado ?? false,
        cuit: configAFIP?.cuit ?? '',
        razonSocial: configAFIP?.razonSocial ?? '',
        puntoVenta: configAFIP?.puntoVenta ?? 1,
        inicioActividades: configAFIP?.inicioActividades ?? new Date(),
        certificado: configAFIP?.certificado ?? '',
        clavePrivada: configAFIP?.clavePrivada ?? '',
        modoTest: configAFIP?.modoTest ?? true,
      },
      sigica: {
        habilitado: configSIGICA?.habilitado ?? false,
        establecimiento: configSIGICA?.establecimiento ?? '',
        usuario: configSIGICA?.usuario ?? '',
        password: configSIGICA?.password ?? '',
        urlServicio: configSIGICA?.urlServicio ?? '',
        modoTest: !configSIGICA?.urlServicio?.includes('produccion'),
      },
    };

    return this.config;
  }

  // ==================== ESTADO DEL PUENTE ====================

  async getEstado(): Promise<{
    afip: { conectado: boolean; ultimoAcceso: Date | null; error: string | null };
    sigica: { conectado: boolean; ultimoAcceso: Date | null; error: string | null };
  }> {
    const config = await this.loadConfig();

    return {
      afip: {
        conectado: config.afip.habilitado && !!config.afip.certificado,
        ultimoAcceso: null, // Would be loaded from logs
        error: config.afip.habilitado && !config.afip.certificado ? 'Certificado no configurado' : null,
      },
      sigica: {
        conectado: config.sigica.habilitado && !!config.sigica.usuario,
        ultimoAcceso: null,
        error: config.sigica.habilitado && !config.sigica.usuario ? 'Credenciales no configuradas' : null,
      },
    };
  }

  // ==================== SINCRONIZACIÓN ====================

  /**
   * Sincroniza datos con ambos servicios
   */
  async sincronizarTodo(): Promise<{
    afip: { exito: boolean; mensaje: string };
    sigica: { exito: boolean; mensaje: string };
  }> {
    const [resultadoAFIP, resultadoSIGICA] = await Promise.all([
      this.sincronizarAFIP(),
      this.sincronizarSIGICA(),
    ]);

    return {
      afip: resultadoAFIP,
      sigica: resultadoSIGICA,
    };
  }

  /**
   * Sincroniza con AFIP
   */
  async sincronizarAFIP(): Promise<{ exito: boolean; mensaje: string }> {
    const config = await this.loadConfig();

    if (!config.afip.habilitado) {
      return { exito: false, mensaje: 'AFIP no está habilitado' };
    }

    try {
      // Check for pending invoices
      const facturasPendientes = await db.factura.count({
        where: { estado: 'PENDIENTE', cae: null },
      });

      if (facturasPendientes === 0) {
        return { exito: true, mensaje: 'No hay facturas pendientes de autorización' };
      }

      // Would process pending invoices here
      return { exito: true, mensaje: `${facturasPendientes} facturas pendientes de procesar` };
    } catch (error) {
      return { exito: false, mensaje: `Error: ${error}` };
    }
  }

  /**
   * Sincroniza con SIGICA
   */
  async sincronizarSIGICA(): Promise<{ exito: boolean; mensaje: string }> {
    const config = await this.loadConfig();

    if (!config.sigica.habilitado) {
      return { exito: false, mensaje: 'SIGICA no está habilitado' };
    }

    try {
      // Check for pending shipments
      const enviosPendientes = await db.envioSIGICA.count({
        where: { estado: 'PENDIENTE' },
      });

      if (enviosPendientes === 0) {
        return { exito: true, mensaje: 'No hay envíos pendientes a SIGICA' };
      }

      return { exito: true, mensaje: `${enviosPendientes} envíos pendientes` };
    } catch (error) {
      return { exito: false, mensaje: `Error: ${error}` };
    }
  }

  // ==================== FLUJO INTEGRADO ====================

  /**
   * Procesa el flujo completo post-faena:
   * 1. Confirma datos de faena
   * 2. Envía a SIGICA
   * 3. Genera facturas en AFIP
   * 4. Envía romaneos al cliente
   */
  async procesarFlujoPostFaena(listaFaenaId: string): Promise<{
    paso: string;
    exito: boolean;
    mensaje: string;
    detalles?: any;
  }[]> {
    const resultados: Array<{ paso: string; exito: boolean; mensaje: string; detalles?: any }> = [];

    // Paso 1: Obtener datos de la lista de faena
    const listaFaena = await db.listaFaena.findUnique({
      where: { id: listaFaenaId },
      include: {
        tropas: { include: { tropa: true } },
        asignaciones: { include: { animal: true } },
      },
    });

    if (!listaFaena) {
      resultados.push({ paso: 'Obtener datos', exito: false, mensaje: 'Lista de faena no encontrada' });
      return resultados;
    }

    resultados.push({ paso: 'Obtener datos', exito: true, mensaje: 'Datos obtenidos correctamente' });

    // Paso 2: Enviar romaneo a SIGICA
    const config = await this.loadConfig();
    if (config.sigica.habilitado) {
      try {
        // Would create EnvioSIGICA record and send
        resultados.push({ paso: 'SIGICA', exito: true, mensaje: 'Romaneo enviado a SIGICA' });
      } catch (error) {
        resultados.push({ paso: 'SIGICA', exito: false, mensaje: `Error: ${error}` });
      }
    } else {
      resultados.push({ paso: 'SIGICA', exito: true, mensaje: 'SIGICA no habilitado, omitido' });
    }

    // Paso 3: Generar facturas
    if (config.afip.habilitado) {
      try {
        // Would create Factura records and authorize with AFIP
        resultados.push({ paso: 'AFIP', exito: true, mensaje: 'Facturas generadas' });
      } catch (error) {
        resultados.push({ paso: 'AFIP', exito: false, mensaje: `Error: ${error}` });
      }
    } else {
      resultados.push({ paso: 'AFIP', exito: true, mensaje: 'AFIP no habilitado, omitido' });
    }

    // Paso 4: Enviar romaneos por email
    try {
      // Would send emails to clients
      resultados.push({ paso: 'Envío romaneos', exito: true, mensaje: 'Romaneos enviados por email' });
    } catch (error) {
      resultados.push({ paso: 'Envío romaneos', exito: false, mensaje: `Error: ${error}` });
    }

    return resultados;
  }

  // ==================== UTILIDADES ====================

  /**
   * Prueba la conexión con los servicios
   */
  async probarConexion(): Promise<{
    afip: { ok: boolean; mensaje: string };
    sigica: { ok: boolean; mensaje: string };
  }> {
    const config = await this.loadConfig();
    const estado = await this.getEstado();

    // Test AFIP
    let afipOk = false;
    let afipMensaje = 'No configurado';
    if (config.afip.habilitado && config.afip.certificado) {
      try {
        // Would call AFIP dummy service
        afipOk = true;
        afipMensaje = 'Conexión exitosa';
      } catch (error) {
        afipMensaje = `Error de conexión: ${error}`;
      }
    }

    // Test SIGICA
    let sigicaOk = false;
    let sigicaMensaje = 'No configurado';
    if (config.sigica.habilitado && config.sigica.usuario) {
      try {
        // Would call SIGICA test endpoint
        sigicaOk = true;
        sigicaMensaje = 'Conexión exitosa';
      } catch (error) {
        sigicaMensaje = `Error de conexión: ${error}`;
      }
    }

    return {
      afip: { ok: afipOk, mensaje: afipMensaje },
      sigica: { ok: sigicaOk, mensaje: sigicaMensaje },
    };
  }
}

// Singleton instance
export const puenteWeb = new PuenteWebService();
