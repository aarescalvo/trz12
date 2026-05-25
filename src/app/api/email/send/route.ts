import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'
import { EstadoEnvioEmail, TipoReporteEmail } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Enviar email
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  let data: any
  try {
    data = await request.json()
    
    // Validar datos requeridos
    if (!data.destinatarios || data.destinatarios.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un destinatario' },
        { status: 400 }
      )
    }
    
    if (!data.asunto) {
      return NextResponse.json(
        { error: 'El asunto es requerido' },
        { status: 400 }
      )
    }
    
    // Obtener configuración de email
    const config = await db.configuracionFrigorifico.findFirst()
    
    if (!config || !config.emailHabilitado) {
      return NextResponse.json(
        { error: 'El envío de emails no está habilitado en la configuración' },
        { status: 400 }
      )
    }
    
    if (!config.emailHost || !config.emailUsuario || !config.emailPassword) {
      return NextResponse.json(
        { error: 'Falta configuración SMTP. Configure el servidor de email primero.' },
        { status: 400 }
      )
    }
    
    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPuerto || 587,
      secure: config.emailPuerto === 465,
      auth: {
        user: config.emailUsuario,
        pass: config.emailPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    })
    
    // Preparar opciones del email
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${config.nombre || 'Sistema Frigorífico'}" <${config.emailUsuario}>`,
      to: Array.isArray(data.destinatarios) 
        ? data.destinatarios.join(', ') 
        : data.destinatarios,
      subject: data.asunto,
      html: data.cuerpoHtml || data.cuerpo || '',
      text: data.cuerpo || ''
    }
    
    // Agregar adjuntos si existen
    if (data.adjuntos && data.adjuntos.length > 0) {
      mailOptions.attachments = data.adjuntos.map((adj: { filename: string; content: string; contentType?: string }) => ({
        filename: adj.filename,
        content: Buffer.from(adj.content, 'base64'),
        contentType: adj.contentType
      }))
    }
    
    // Enviar email
    const info = await transporter.sendMail(mailOptions)
    
    // Registrar envío exitoso en historial para cada destinatario
    const destinatarioEmails = Array.isArray(data.destinatarios) 
      ? data.destinatarios 
      : data.destinatarios.split(',').map((d: string) => d.trim())
    
    for (const email of destinatarioEmails) {
      // Buscar ID del destinatario si existe
      const destinatario = await db.destinatarioReporte.findFirst({
        where: { email }
      })
      
      await db.historialEnvio.create({
        data: {
          programacionId: data.programacionId || null,
          destinatarioId: destinatario?.id || null,
          tipoReporte: data.tipoReporte || TipoReporteEmail.PERSONALIZADO,
          asunto: data.asunto,
          destinatarioEmail: email,
          estado: EstadoEnvioEmail.ENVIADO,
          fechaProcesado: new Date(),
          tamanoArchivo: data.adjuntos?.reduce((acc: number, adj: { content: string }) => 
            acc + Buffer.byteLength(adj.content, 'base64'), 0) || null,
          contenidoResumen: data.cuerpo ? data.cuerpo.substring(0, 500) : null
        }
      })
    }
    
    // Actualizar último envío de la programación si existe
    if (data.programacionId) {
      await db.programacionReporte.update({
        where: { id: data.programacionId },
        data: { ultimoEnvio: new Date() }
      })
    }
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email enviado correctamente'
    })
    
  } catch (error) {
    console.error('Error al enviar email:', error)
    
    // Registrar error en historial si hay destinatarios
    if (data?.destinatarios) {
      try {
        const destinatarioEmails = Array.isArray(data?.destinatarios) 
          ? data?.destinatarios 
          : data?.destinatarios.split(',').map((d: string) => d.trim())
        
        for (const email of destinatarioEmails) {
          const destinatario = await db.destinatarioReporte.findFirst({
            where: { email }
          })
          
          await db.historialEnvio.create({
            data: {
              programacionId: data?.programacionId || null,
              destinatarioId: destinatario?.id || null,
              tipoReporte: data?.tipoReporte || TipoReporteEmail.PERSONALIZADO,
              asunto: data?.asunto || 'Sin asunto',
              destinatarioEmail: email,
              estado: EstadoEnvioEmail.ERROR,
              error: error instanceof Error ? error.message : 'Error desconocido',
              reintentos: 0
            }
          })
        }
      } catch {
        console.error('Error al registrar fallo en historial')
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Error al enviar email',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// GET - Obtener historial de envíos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const estado = searchParams.get('estado')
    const tipoReporte = searchParams.get('tipoReporte')
    
    const where: {
      estado?: EstadoEnvioEmail
      tipoReporte?: TipoReporteEmail
    } = {}
    
    if (estado && Object.values(EstadoEnvioEmail).includes(estado as EstadoEnvioEmail)) {
      where.estado = estado as EstadoEnvioEmail
    }
    
    if (tipoReporte && Object.values(TipoReporteEmail).includes(tipoReporte as TipoReporteEmail)) {
      where.tipoReporte = tipoReporte as TipoReporteEmail
    }
    
    const historial = await db.historialEnvio.findMany({
      where,
      include: {
        programacion: {
          select: { nombre: true }
        },
        destinatario: {
          select: { nombre: true, email: true }
        }
      },
      orderBy: { fechaEnvio: 'desc' },
      take: limit,
      skip: offset
    })
    
    const total = await db.historialEnvio.count({ where })
    
    return NextResponse.json({
      data: historial,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial de envíos' },
      { status: 500 }
    )
  }
}
