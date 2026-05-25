'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Printer, Download, Building2, FileText, Receipt,
  Calendar, User, CreditCard, Shield, CheckCircle, X, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface Configuracion {
  nombre: string
  direccion?: string
  cuit?: string
  numeroEstablecimiento?: string
  numeroMatricula?: string
}

interface DetalleFactura {
  id: string
  tipoProducto: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  subtotal: number
  pesoKg?: number
}

interface PagoFactura {
  id: string
  fecha: string
  monto: number
  metodoPago: string
  referencia?: string
}

interface FacturaTributo {
  id: string
  descripcion: string
  baseImponible: number
  alicuota: number
  importe: number
}

interface Factura {
  id: string
  numero: string
  tipoComprobante: string
  fecha: string
  subtotal: number
  iva: number
  porcentajeIva: number
  total: number
  importeTributos: number
  saldo: number
  estado: string
  condicionVenta?: string
  cae?: string
  caeVencimiento?: string
  puntoVenta: number
  numeroAfip?: number
  remito?: string
  observaciones?: string
  clienteNombre?: string
  clienteCuit?: string
  clienteCondicionIva?: string
  clienteDireccion?: string
  cliente?: { nombre: string; razonSocial?: string; cuit?: string; condicionIva?: string; direccion?: string }
  detalles: DetalleFactura[]
  pagos: PagoFactura[]
  tributos?: FacturaTributo[]
  operador?: { id: string; nombre: string }
}

interface Props {
  factura: Factura
  onClose?: () => void
}

const TIPOS_COMPROBANTE_LABELS: Record<string, string> = {
  FACTURA_A: 'Factura A',
  FACTURA_B: 'Factura B',
  FACTURA_C: 'Factura C',
  REMITO: 'Remito',
  NOTA_CREDITO: 'Nota de Crédito',
  NOTA_DEBITO: 'Nota de Débito',
}

const CONDICION_IVA_LABELS: Record<string, string> = {
  RI: 'Responsable Inscripto',
  CF: 'Consumidor Final',
  MT: 'Monotributo',
  EX: 'Exento',
  NR: 'No Responsable',
}

const METODOS_PAGO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia Bancaria',
  CHEQUE: 'Cheque',
  TARJETA_DEBITO: 'Tarjeta Débito',
  TARJETA_CREDITO: 'Tarjeta Crédito',
}

export function FacturaPreview({ factura, onClose }: Props) {
  const [config, setConfig] = useState<Configuracion | null>(null)
  const [printing, setPrinting] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracion')
      const data = await res.json()
      if (data.success && data.data) {
        setConfig(data.data)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const tipoLabel = TIPOS_COMPROBANTE_LABELS[factura.tipoComprobante] || factura.tipoComprobante
  const clienteNombre = factura.clienteNombre || factura.cliente?.razonSocial || factura.cliente?.nombre || '-'
  const clienteCuit = factura.clienteCuit || factura.cliente?.cuit || '-'
  const clienteCondIva = factura.clienteCondicionIva || factura.cliente?.condicionIva || '-'
  const clienteDireccion = factura.clienteDireccion || factura.cliente?.direccion || '-'

  const getEstadoBadge = () => {
    switch (factura.estado) {
      case 'PENDIENTE': return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'EMITIDA': return <Badge className="bg-blue-100 text-blue-700">Emitida</Badge>
      case 'PAGADA': return <Badge className="bg-emerald-100 text-emerald-700">Pagada</Badge>
      case 'ANULADA': return <Badge className="bg-red-100 text-red-700">Anulada</Badge>
      default: return <Badge>{factura.estado}</Badge>
    }
  }

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      const printContent = document.getElementById('factura-print-area')
      if (!printContent) return

      const printWindow = window.open('', '_blank', 'width=800,height=1000')
      if (!printWindow) {
        toast.error('No se pudo abrir la ventana de impresión')
        setPrinting(false)
        return
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Comprobante ${factura.numero}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 11px; color: #1c1917; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #d97706; padding-bottom: 12px; margin-bottom: 16px; }
    .empresa { flex: 1; }
    .empresa-nombre { font-size: 16px; font-weight: bold; color: #1c1917; }
    .empresa-datos { color: #78716c; font-size: 10px; margin-top: 4px; }
    .comprobante { text-align: right; }
    .comprobante-tipo { font-size: 18px; font-weight: bold; color: #d97706; }
    .comprobante-numero { font-size: 14px; font-weight: bold; }
    .comprobante-fecha { color: #78716c; margin-top: 4px; }
    .dos-columnas { display: flex; gap: 24px; margin-bottom: 16px; }
    .columna { flex: 1; }
    .seccion-titulo { font-size: 10px; font-weight: bold; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e7e5e4; }
    .dato { display: flex; justify-content: space-between; padding: 2px 0; }
    .dato-label { color: #78716c; }
    .dato-valor { font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th { background: #f5f5f4; padding: 8px 6px; text-align: left; font-size: 10px; font-weight: 600; color: #57534e; border-bottom: 2px solid #d6d3d1; }
    thead th.right { text-align: right; }
    tbody td { padding: 6px; border-bottom: 1px solid #e7e5e4; }
    tbody td.right { text-align: right; font-family: monospace; }
    .totales { display: flex; justify-content: flex-end; }
    .totales-tabla { width: 280px; }
    .totales-fila { display: flex; justify-content: space-between; padding: 4px 0; }
    .totales-fila.total { font-size: 14px; font-weight: bold; border-top: 2px solid #1c1917; padding-top: 8px; margin-top: 4px; }
    .cae-section { margin-top: 16px; padding: 8px; background: #f5f5f4; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
    .cae-label { font-size: 10px; color: #78716c; }
    .cae-valor { font-weight: bold; font-family: monospace; }
    .pie { margin-top: 20px; text-align: center; color: #a8a29e; font-size: 9px; border-top: 1px solid #e7e5e4; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa">
      <div class="empresa-nombre">${config?.nombre || 'Solemar Alimentaria'}</div>
      <div class="empresa-datos">
        ${config?.direccion ? `Dirección: ${config.direccion}` : ''}<br>
        ${config?.cuit ? `CUIT: ${config.cuit}` : ''} ${config?.numeroEstablecimiento ? `· Establecimiento N° ${config.numeroEstablecimiento}` : ''}<br>
        ${config?.numeroMatricula ? `Matrícula: ${config.numeroMatricula}` : ''}
      </div>
    </div>
    <div class="comprobante">
      <div class="comprobante-tipo">${tipoLabel}</div>
      <div class="comprobante-numero">${factura.numero}</div>
      <div class="comprobante-fecha">Fecha: ${formatDate(factura.fecha)}</div>
      <div style="margin-top:4px;">${factura.condicionVenta === 'CONTADO' ? 'Contado' : 'Cuenta Corriente'}</div>
    </div>
  </div>

  <div class="dos-columnas">
    <div class="columna">
      <div class="seccion-titulo">Cliente</div>
      <div class="dato"><span class="dato-label">Razón Social:</span><span class="dato-valor">${clienteNombre}</span></div>
      <div class="dato"><span class="dato-label">CUIT:</span><span class="dato-valor">${clienteCuit}</span></div>
      <div class="dato"><span class="dato-label">Cond. IVA:</span><span class="dato-valor">${CONDICION_IVA_LABELS[clienteCondIva] || clienteCondIva}</span></div>
      <div class="dato"><span class="dato-label">Dirección:</span><span class="dato-valor">${clienteDireccion}</span></div>
    </div>
    <div class="columna">
      <div class="seccion-titulo">Comprobante</div>
      <div class="dato"><span class="dato-label">Punto Venta:</span><span class="dato-valor">${String(factura.puntoVenta).padStart(4, '0')}</span></div>
      <div class="dato"><span class="dato-label">Cond. Venta:</span><span class="dato-valor">${factura.condicionVenta === 'CONTADO' ? 'Contado' : 'Cuenta Corriente'}</span></div>
      ${factura.remito ? `<div class="dato"><span class="dato-label">Remito:</span><span class="dato-valor">${factura.remito}</span></div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:45%">Descripción</th>
        <th class="right" style="width:12%">Cantidad</th>
        <th style="width:10%">Unidad</th>
        <th class="right" style="width:15%">P. Unit.</th>
        <th class="right" style="width:18%">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${(factura.detalles || []).map(d => `
      <tr>
        <td>${d.descripcion}</td>
        <td class="right">${d.cantidad}</td>
        <td>${d.unidad}</td>
        <td class="right">${formatCurrency(d.precioUnitario)}</td>
        <td class="right">${formatCurrency(d.subtotal)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totales">
    <div class="totales-tabla">
      <div class="totales-fila"><span>Subtotal:</span><span>${formatCurrency(factura.subtotal)}</span></div>
      ${factura.iva > 0 ? `<div class="totales-fila"><span>IVA (${factura.porcentajeIva}%):</span><span>${formatCurrency(factura.iva)}</span></div>` : ''}
      ${(factura.tributos || []).map(t => `<div class="totales-fila"><span>${t.descripcion} (${t.alicuota}%):</span><span>${formatCurrency(t.importe)}</span></div>`).join('')}
      ${factura.importeTributos > 0 && (!factura.tributos || factura.tributos.length === 0) ? `<div class="totales-fila"><span>Tributos:</span><span>${formatCurrency(factura.importeTributos)}</span></div>` : ''}
      <div class="totales-fila total"><span>TOTAL:</span><span>${formatCurrency(factura.total)}</span></div>
    </div>
  </div>

  ${factura.cae ? `
  <div class="cae-section">
    <div>
      <div class="cae-label">CAE (Código de Autorización Electrónico)</div>
      <div class="cae-valor">${factura.cae}</div>
    </div>
    <div>
      <div class="cae-label">Vencimiento CAE</div>
      <div class="cae-valor">${factura.caeVencimiento ? formatDate(factura.caeVencimiento) : '-'}</div>
    </div>
  </div>` : ''}

  ${factura.observaciones ? `<div style="margin-top:12px;"><div class="seccion-titulo">Observaciones</div><p>${factura.observaciones}</p></div>` : ''}

  ${(factura.pagos || []).length > 0 ? `
  <div style="margin-top:16px;">
    <div class="seccion-titulo">Pagos Registrados</div>
    <table>
      <thead><tr><th>Fecha</th><th>Método</th><th>Referencia</th><th class="right">Monto</th></tr></thead>
      <tbody>
        ${factura.pagos.map(p => `<tr><td>${formatDate(p.fecha)}</td><td>${METODOS_PAGO_LABELS[p.metodoPago] || p.metodoPago}</td><td>${p.referencia || '-'}</td><td class="right">${formatCurrency(p.monto)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="pie">
    Documento no válido como factura · ${config?.nombre || 'Solemar Alimentaria'} · Generado el ${new Date().toLocaleDateString('es-AR')}
  </div>
</body>
</html>`)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        setPrinting(false)
      }, 300)
    }, 100)
  }

  const [downloading, setDownloading] = useState(false)

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/facturacion/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId: factura.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al generar PDF')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const tipoLabel = TIPOS_COMPROBANTE_LABELS[factura.tipoComprobante] || 'Comprobante'
      a.download = `${tipoLabel.replace(/ /g, '_')}_${factura.numero.replace(/-/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descargado exitosamente')
    } catch (error: any) {
      console.error('Error descargando PDF:', error)
      toast.error(error.message || 'Error al generar PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-stone-800">Vista Previa</h3>
          {getEstadoBadge()}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint} disabled={printing}>
            <Printer className="w-4 h-4 mr-1" />{printing ? 'Preparando...' : 'Imprimir'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
            {downloading ? 'Generando...' : 'PDF'}
          </Button>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Vista previa del comprobante */}
      <Card className="border shadow-lg max-w-3xl mx-auto" id="factura-print-area">
        <CardContent className="p-6 space-y-5">
          {/* Encabezado */}
          <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-800">{config?.nombre || 'Solemar Alimentaria'}</h2>
              <p className="text-xs text-stone-500 mt-1">
                {config?.direccion || 'Dirección no configurada'}
              </p>
              <p className="text-xs text-stone-500">
                {config?.cuit ? `CUIT: ${config.cuit}` : ''}
                {config?.numeroEstablecimiento ? ` · Est. N° ${config.numeroEstablecimiento}` : ''}
              </p>
              {config?.numeroMatricula && (
                <p className="text-xs text-stone-500">Matrícula: {config.numeroMatricula}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber-600">{tipoLabel}</p>
              <p className="text-lg font-mono font-semibold">{factura.numero}</p>
              <p className="text-sm text-stone-500">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                {formatDate(factura.fecha)}
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                {factura.condicionVenta === 'CONTADO' ? 'Contado' : 'Cuenta Corriente'}
              </Badge>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Cliente</p>
              <div className="space-y-0.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Razón Social:</span>
                  <span className="font-medium">{clienteNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">CUIT:</span>
                  <span className="font-mono">{clienteCuit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Cond. IVA:</span>
                  <span>{CONDICION_IVA_LABELS[clienteCondIva] || clienteCondIva}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Dirección:</span>
                  <span className="text-right max-w-[200px] truncate">{clienteDireccion}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Comprobante</p>
              <div className="space-y-0.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Punto Venta:</span>
                  <span className="font-mono">{String(factura.puntoVenta).padStart(4, '0')}</span>
                </div>
                {factura.numeroAfip && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">N° AFIP:</span>
                    <span className="font-mono">{factura.numeroAfip}</span>
                  </div>
                )}
                {factura.remito && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Remito:</span>
                    <span>{factura.remito}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Detalle de items */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Detalle</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-stone-500">Descripción</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-stone-500">Cantidad</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-stone-500">Unidad</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-stone-500">P. Unit.</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-stone-500">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(factura.detalles || []).map((d, i) => (
                  <tr key={d.id || i} className="border-b border-stone-100">
                    <td className="py-2 px-2">{d.descripcion}</td>
                    <td className="py-2 px-2 text-right font-mono">{d.cantidad}</td>
                    <td className="py-2 px-2 text-center">{d.unidad}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatCurrency(d.precioUnitario)}</td>
                    <td className="py-2 px-2 text-right font-mono font-medium">{formatCurrency(d.subtotal)}</td>
                  </tr>
                ))}
                {(!factura.detalles || factura.detalles.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-stone-400">Sin items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-72 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal:</span>
                <span className="font-mono">{formatCurrency(factura.subtotal)}</span>
              </div>
              {factura.iva > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">IVA ({factura.porcentajeIva}%):</span>
                  <span className="font-mono">{formatCurrency(factura.iva)}</span>
                </div>
              )}
              {(factura.tributos || []).map(t => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="text-stone-500">{t.descripcion} ({t.alicuota}%):</span>
                  <span className="font-mono">{formatCurrency(t.importe)}</span>
                </div>
              ))}
              {factura.importeTributos > 0 && (!factura.tributos || factura.tributos.length === 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Tributos:</span>
                  <span className="font-mono">{formatCurrency(factura.importeTributos)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span className="font-mono text-amber-700">{formatCurrency(factura.total)}</span>
              </div>
              {factura.estado !== 'PAGADA' && factura.saldo > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Saldo Pendiente:</span>
                  <span className="font-mono">{formatCurrency(factura.saldo)}</span>
                </div>
              )}
            </div>
          </div>

          {/* CAE */}
          {factura.cae && (
            <div className="bg-stone-50 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-stone-400 uppercase">CAE</p>
                <p className="font-mono font-bold text-sm">{factura.cae}</p>
              </div>
              {factura.caeVencimiento && (
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase">Vencimiento CAE</p>
                  <p className="font-mono text-sm">{formatDate(factura.caeVencimiento)}</p>
                </div>
              )}
            </div>
          )}

          {/* Pagos registrados */}
          {(factura.pagos || []).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Pagos Registrados</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="text-left py-1.5 px-2 text-xs">Fecha</th>
                      <th className="text-left py-1.5 px-2 text-xs">Método</th>
                      <th className="text-left py-1.5 px-2 text-xs">Referencia</th>
                      <th className="text-right py-1.5 px-2 text-xs">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factura.pagos.map((p, i) => (
                      <tr key={p.id || i} className="border-b border-stone-100">
                        <td className="py-1.5 px-2">{formatDate(p.fecha)}</td>
                        <td className="py-1.5 px-2">{METODOS_PAGO_LABELS[p.metodoPago] || p.metodoPago}</td>
                        <td className="py-1.5 px-2">{p.referencia || '-'}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(p.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Observaciones */}
          {factura.observaciones && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-600">Observaciones</p>
              <p className="text-sm text-stone-700 mt-1">{factura.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
