# Actualizar Ticket de Pesaje - Solemar Alimentaria
# Agrega firma porteria y datos del frigorifico

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ACTUALIZACION DE TICKET DE PESAJE" -ForegroundColor Cyan
Write-Host "  Solemar Alimentaria" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el directorio
$baseDir = "C:\TrazaSole\frigorifico"
if (-not (Test-Path $baseDir)) {
    Write-Host "ERROR: No se encuentra el directorio $baseDir" -ForegroundColor Red
    Write-Host "Presione una tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

$componentDir = Join-Path $baseDir "src\components\pesaje-camiones"

# ============================================
# 1. ACTUALIZAR ticketPrint.ts
# ============================================
Write-Host "[1/3] Actualizando ticketPrint.ts..." -ForegroundColor Yellow

$ticketPrintContent = @'
import { TIPOS_PESAJE } from './constants'
import type { Pesaje } from './types'

// Interfaz para la configuracion del frigorifico
export interface ConfigFrigorifico {
  nombre: string
  direccion?: string | null
  cuit?: string | null
  numeroEstablecimiento?: string | null
  numeroMatricula?: string | null
  logo?: string | null
}

// Imprimir ticket individual
export function imprimirTicket(pesaje: Pesaje, duplicado: boolean = false, config?: ConfigFrigorifico | null) {
  const tipoLabel = TIPOS_PESAJE.find(t => t.id === pesaje.tipo)?.label || pesaje.tipo
  const copia = duplicado ? ' - COPIA' : ''
  
  // Datos de la empresa (usar configuracion o valores por defecto)
  const empresaNombre = config?.nombre || 'SOLEMAR ALIMENTARIA'
  const empresaDireccion = config?.direccion || ''
  const empresaCuit = config?.cuit || ''
  const empresaNroEstablecimiento = config?.numeroEstablecimiento || ''
  const empresaMatricula = config?.numeroMatricula || ''
  
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) return
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket #${pesaje.numeroTicket}${copia}</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 10mm; max-width: 80mm; }
        .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 10px; }
        .empresa { font-size: 16px; font-weight: bold; }
        .empresa-datos { font-size: 10px; margin-top: 3px; }
        .ticket { font-size: 20px; font-weight: bold; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .label { font-weight: bold; }
        .section { border-top: 1px dashed black; padding-top: 8px; margin-top: 8px; }
        .peso { font-size: 14px; font-weight: bold; }
        .firma { margin-top: 20px; border-top: 1px solid black; padding-top: 10px; }
        .firma-linea { border-bottom: 1px solid black; height: 30px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="/logo.png" alt="${empresaNombre}" style="height: 50px; max-width: 150px; object-fit: contain;">
        </div>
        <div class="empresa">${empresaNombre}</div>
        ${empresaDireccion ? `<div class="empresa-datos">${empresaDireccion}</div>` : ''}
        ${empresaCuit ? `<div class="empresa-datos">CUIT: ${empresaCuit}</div>` : ''}
        ${empresaNroEstablecimiento ? `<div class="empresa-datos">Establecimiento Nro: ${empresaNroEstablecimiento}</div>` : ''}
        ${empresaMatricula ? `<div class="empresa-datos">Matricula: ${empresaMatricula}</div>` : ''}
        <div style="margin-top: 8px;">TICKET DE PESAJE${copia}</div>
        <div class="ticket">Nro ${String(pesaje.numeroTicket).padStart(6, '0')}</div>
      </div>
      
      <div class="row"><span class="label">Tipo:</span><span>${tipoLabel}</span></div>
      <div class="row"><span class="label">Fecha:</span><span>${new Date(pesaje.fecha).toLocaleDateString('es-AR')}</span></div>
      <div class="row"><span class="label">Hora:</span><span>${new Date(pesaje.fecha).toLocaleTimeString('es-AR')}</span></div>
      ${pesaje.operador ? `<div class="row"><span class="label">Operador:</span><span>${pesaje.operador.nombre}</span></div>` : ''}
      
      <div class="section">
        <div class="row"><span class="label">Patente:</span><span>${pesaje.patenteChasis}</span></div>
        ${pesaje.patenteAcoplado ? `<div class="row"><span class="label">Acoplado:</span><span>${pesaje.patenteAcoplado}</span></div>` : ''}
        ${pesaje.chofer ? `<div class="row"><span class="label">Chofer:</span><span>${pesaje.chofer}</span></div>` : ''}
      </div>
      
      ${pesaje.tipo === 'INGRESO_HACIENDA' && pesaje.tropa ? `
        <div class="section">
          <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">DATOS DE HACIENDA</div>
          <div class="row"><span class="label">Tropa:</span><span style="font-weight: bold;">${pesaje.tropa.codigo}</span></div>
          ${pesaje.tropa.productor ? `<div class="row"><span class="label">Productor:</span><span>${pesaje.tropa.productor.nombre}</span></div>` : ''}
          <div class="row"><span class="label">Usuario Faena:</span><span>${pesaje.tropa.usuarioFaena?.nombre || '-'}</span></div>
          <div class="row"><span class="label">Especie:</span><span>${pesaje.tropa.especie}</span></div>
          <div class="row"><span class="label">Corral:</span><span>${pesaje.tropa.corral || '-'}</span></div>
          ${pesaje.tropa.dte ? `<div class="row"><span class="label">DTE:</span><span>${pesaje.tropa.dte}</span></div>` : ''}
          ${pesaje.tropa.guia ? `<div class="row"><span class="label">Guia:</span><span>${pesaje.tropa.guia}</span></div>` : ''}
          ${pesaje.descripcion ? `<div class="row"><span class="label">Observaciones:</span><span>${pesaje.descripcion}</span></div>` : ''}
        </div>
      ` : ''}
      
      ${pesaje.tipo === 'SALIDA_MERCADERIA' ? `
        <div class="section">
          <div class="row"><span class="label">Destino:</span><span>${pesaje.destino || '-'}</span></div>
          ${pesaje.remito ? `<div class="row"><span class="label">Remito:</span><span>${pesaje.remito}</span></div>` : ''}
        </div>
      ` : ''}
      
      <div class="section">
        <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">PESOS</div>
        <div class="row peso"><span class="label">Bruto:</span><span>${pesaje.pesoBruto?.toLocaleString() || '-'} kg</span></div>
        <div class="row peso"><span class="label">Tara:</span><span>${pesaje.pesoTara?.toLocaleString() || '-'} kg</span></div>
        <div class="row peso" style="font-size: 16px;"><span class="label">NETO:</span><span style="font-weight: bold;">${pesaje.pesoNeto?.toLocaleString() || '-'} kg</span></div>
      </div>
      
      <div class="firma" style="display: flex; justify-content: space-between; gap: 20px;">
        <div style="flex: 1; text-align: center;">
          <div>Firma Conforme Chofer</div>
          <div class="firma-linea"></div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div>Firma Porteria</div>
          <div class="firma-linea"></div>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); }
        }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// Imprimir reporte por rango de fechas
export function imprimirReporte(pesajes: Pesaje[], fechaDesde: string, fechaHasta: string, config?: ConfigFrigorifico | null) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return
  
  const empresaNombre = config?.nombre || 'SOLEMAR ALIMENTARIA'
  
  const totalBruto = pesajes.reduce((acc, p) => acc + (p.pesoBruto || 0), 0)
  const totalTara = pesajes.reduce((acc, p) => acc + (p.pesoTara || 0), 0)
  const totalNeto = pesajes.reduce((acc, p) => acc + (p.pesoNeto || 0), 0)
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Pesajes</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .totals { margin-top: 20px; padding: 10px; background: #f9f9f9; }
        .totals p { margin: 5px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>${empresaNombre} - Reporte de Pesajes</h1>
      <p><strong>Periodo:</strong> ${fechaDesde ? new Date(fechaDesde).toLocaleDateString('es-AR') : 'Inicio'} - ${fechaHasta ? new Date(fechaHasta).toLocaleDateString('es-AR') : 'Hoy'}</p>
      <p><strong>Generado:</strong> ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
      
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Patente</th>
            <th>Tropa</th>
            <th>Bruto (kg)</th>
            <th>Tara (kg)</th>
            <th>Neto (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${pesajes.map(p => `
            <tr>
              <td>#${String(p.numeroTicket).padStart(6, '0')}</td>
              <td>${new Date(p.fecha).toLocaleDateString('es-AR')}</td>
              <td>${TIPOS_PESAJE.find(t => t.id === p.tipo)?.label || p.tipo}</td>
              <td>${p.patenteChasis}</td>
              <td>${p.tropa?.codigo || '-'}</td>
              <td>${p.pesoBruto?.toLocaleString() || '-'}</td>
              <td>${p.pesoTara?.toLocaleString() || '-'}</td>
              <td><strong>${p.pesoNeto?.toLocaleString() || '-'}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <p>Total de pesajes: ${pesajes.length}</p>
        <p>Total Bruto: ${totalBruto.toLocaleString()} kg</p>
        <p>Total Tara: ${totalTara.toLocaleString()} kg</p>
        <p>Total Neto: ${totalNeto.toLocaleString()} kg</p>
      </div>
      
      <script>
        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
'@

$ticketPrintPath = Join-Path $componentDir "ticketPrint.ts"
$ticketPrintContent | Out-File -FilePath $ticketPrintPath -Encoding UTF8
Write-Host "  OK - ticketPrint.ts actualizado" -ForegroundColor Green

# ============================================
# 2. ACTUALIZAR usePesajeCamiones.ts
# ============================================
Write-Host "[2/3] Actualizando usePesajeCamiones.ts..." -ForegroundColor Yellow

$usePesajeContent = @'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Cliente, Transportista, Corral, Pesaje, TipoAnimalCounter } from './types'
import { imprimirTicket, imprimirReporte, type ConfigFrigorifico } from './ticketPrint'

interface UsePesajeCamionesOptions {
  operadorId: string
  onTropaCreada?: () => void
}

export function usePesajeCamiones({ operadorId, onTropaCreada }: UsePesajeCamionesOptions) {
  // Data
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [transportistas, setTransportistas] = useState<Transportista[]>([])
  const [corrales, setCorrales] = useState<Corral[]>([])
  const [pesajesAbiertos, setPesajesAbiertos] = useState<Pesaje[]>([])
  const [pesajesCerrados, setPesajesCerrados] = useState<Pesaje[]>([])
  const [nextTicket, setNextTicket] = useState(1)
  const [nextTropaCode, setNextTropaCode] = useState<{ codigo: string; numero: number } | null>(null)
  const [config, setConfig] = useState<ConfigFrigorifico | null>(null)
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('nuevo')
  const [tipoPesaje, setTipoPesaje] = useState<string>('INGRESO_HACIENDA')
  
  // Form State
  const [patenteChasis, setPatenteChasis] = useState('')
  const [patenteAcoplado, setPatenteAcoplado] = useState('')
  const [chofer, setChofer] = useState('')
  const [dniChofer, setDniChofer] = useState('')
  const [transportistaId, setTransportistaId] = useState('')
  const [dte, setDte] = useState('')
  const [guia, setGuia] = useState('')
  const [productorId, setProductorId] = useState('')
  const [usuarioFaenaId, setUsuarioFaenaId] = useState('')
  const [especie, setEspecie] = useState('BOVINO')
  const [corralId, setCorralId] = useState('')
  const [pesoBruto, setPesoBruto] = useState<number>(0)
  const [pesoTara, setPesoTara] = useState<number>(0)
  const [observaciones, setObservaciones] = useState('')
  const [destino, setDestino] = useState('')
  const [remito, setRemito] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tiposAnimales, setTiposAnimales] = useState<TipoAnimalCounter[]>([])
  
  // History filters
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  
  // Dialogs
  const [cerrarOpen, setCerrarOpen] = useState(false)
  const [pesajeSeleccionado, setPesajeSeleccionado] = useState<Pesaje | null>(null)
  const [taraForm, setTaraForm] = useState(0)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supervisorPin, setSupervisorPin] = useState('')
  const [supervisorVerificado, setSupervisorVerificado] = useState(false)
  const [pesajeAccion, setPesajeAccion] = useState<Pesaje | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState<'transportista' | 'productor' | 'usuarioFaena' | null>(null)
  
  // Computed
  const pesoNeto = pesoBruto > 0 && pesoTara > 0 ? pesoBruto - pesoTara : 0
  const productores = clientes.filter(c => c.esProductor)
  const usuariosFaena = clientes.filter(c => c.esUsuarioFaena)
  const totalCabezas = tiposAnimales.reduce((acc, t) => acc + t.cantidad, 0)
  
  // Filtered history
  const pesajesFiltrados = pesajesCerrados.filter(p => {
    if (fechaDesde) {
      const desde = new Date(fechaDesde)
      desde.setHours(0, 0, 0, 0)
      if (new Date(p.fecha) < desde) return false
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      if (new Date(p.fecha) > hasta) return false
    }
    return true
  })

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [pesajesRes, transRes, clientesRes, corralesRes, configRes] = await Promise.all([
        fetch('/api/pesaje-camion'),
        fetch('/api/transportistas'),
        fetch('/api/clientes'),
        fetch('/api/corrales'),
        fetch('/api/configuracion')
      ])
      
      const pesajesData = await pesajesRes.json()
      const transData = await transRes.json()
      const clientesData = await clientesRes.json()
      const corralesData = await corralesRes.json()
      const configData = await configRes.json()
      
      if (pesajesData.success) {
        setPesajesAbiertos(pesajesData.data.filter((p: Pesaje) => p.estado === 'ABIERTO'))
        setPesajesCerrados(pesajesData.data.filter((p: Pesaje) => p.estado === 'CERRADO'))
        setNextTicket(pesajesData.nextTicketNumber)
      }
      
      if (transData.success) setTransportistas(transData.data)
      if (clientesData.success) setClientes(clientesData.data)
      if (corralesData.success) setCorrales(corralesData.data)
      if (configData.success) setConfig(configData.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch next tropa code
  const fetchNextTropaCode = useCallback(async (especieParam: string) => {
    try {
      const res = await fetch(`/api/pesaje-camion?action=nextTropaCode&especie=${especieParam}`)
      const data = await res.json()
      if (data.success) {
        setNextTropaCode(data.data)
      }
    } catch (error) {
      console.error('Error fetching next tropa code:', error)
    }
  }, [])

  // Initialize
  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (tipoPesaje === 'INGRESO_HACIENDA') {
      fetchNextTropaCode(especie)
    }
  }, [especie, tipoPesaje, fetchNextTropaCode])

  // Reset form
  const resetForm = useCallback(() => {
    setPatenteChasis('')
    setPatenteAcoplado('')
    setChofer('')
    setDniChofer('')
    setTransportistaId('')
    setDte('')
    setGuia('')
    setProductorId('')
    setUsuarioFaenaId('')
    setEspecie('BOVINO')
    setCorralId('')
    setPesoBruto(0)
    setPesoTara(0)
    setObservaciones('')
    setDestino('')
    setRemito('')
    setDescripcion('')
    setTiposAnimales([])
    fetchNextTropaCode('BOVINO')
  }, [fetchNextTropaCode])

  // Handle quick add
  const handleQuickAdd = useCallback((tipo: string, data: Cliente | Transportista) => {
    if (tipo === 'transportista') {
      setTransportistas(prev => [...prev, data as Transportista])
      setTransportistaId(data.id)
    } else {
      setClientes(prev => [...prev, data as Cliente])
      if (tipo === 'productor') setProductorId(data.id)
      else setUsuarioFaenaId(data.id)
    }
  }, [])

  // Save pesaje
  const handleGuardar = useCallback(async () => {
    // Validations
    if (!patenteChasis) {
      toast.error('Ingrese la patente del chasis')
      return
    }
    
    if (tipoPesaje === 'INGRESO_HACIENDA') {
      if (!usuarioFaenaId) {
        toast.error('Seleccione el usuario de faena')
        return
      }
      if (totalCabezas <= 0) {
        toast.error('Indique la cantidad de animales')
        return
      }
      if (!corralId) {
        toast.error('Seleccione el corral')
        return
      }
      if (pesoBruto <= 0) {
        toast.error('Ingrese el peso bruto')
        return
      }
    }
    
    if (tipoPesaje === 'SALIDA_MERCADERIA' && !destino) {
      toast.error('Ingrese el destino')
      return
    }
    
    if ((tipoPesaje === 'PESAJE_PARTICULAR' || tipoPesaje === 'SALIDA_MERCADERIA') && pesoBruto <= 0) {
      toast.error('Ingrese el peso bruto')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        tipo: tipoPesaje,
        patenteChasis: patenteChasis.toUpperCase(),
        patenteAcoplado: patenteAcoplado?.toUpperCase() || null,
        chofer: chofer || null,
        dniChofer: dniChofer || null,
        transportistaId: transportistaId || null,
        pesoBruto: pesoBruto || null,
        pesoTara: tipoPesaje === 'INGRESO_HACIENDA' ? null : (pesoTara || null),
        pesoNeto: tipoPesaje === 'INGRESO_HACIENDA' ? null : (pesoNeto || null),
        observaciones: observaciones || null,
        destino: destino || null,
        remito: remito || null,
        descripcion: descripcion || null,
        operadorId
      }
      
      if (tipoPesaje === 'INGRESO_HACIENDA') {
        payload.dte = dte || ''
        payload.guia = guia || ''
        payload.productorId = productorId || null
        payload.usuarioFaenaId = usuarioFaenaId
        payload.especie = especie
        payload.tiposAnimales = tiposAnimales
        payload.cantidadCabezas = totalCabezas
        payload.corralId = corralId || null
      }
      
      const res = await fetch('/api/pesaje-camion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        if (tipoPesaje === 'INGRESO_HACIENDA') {
          const animalesCreados = data.data.animalesCreados || 0
          toast.success(`Tropa ${data.data.tropa?.codigo} creada con ${animalesCreados} animales individuales`, { duration: 6000 })
          toast.info(`Ticket #${String(data.data.numeroTicket).padStart(6, '0')} - Pendiente de tara`)
        } else {
          toast.success(`Ticket #${String(data.data.numeroTicket).padStart(6, '0')} creado`)
        }
        
        resetForm()
        
        if (data.data.estado === 'ABIERTO') {
          setPesajesAbiertos(prev => [data.data, ...prev])
        } else {
          setPesajesCerrados(prev => [data.data, ...prev])
          imprimirTicket(data.data, true, config)
        }
        
        setNextTicket(prev => prev + 1)
        onTropaCreada?.()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error de conexion')
    } finally {
      setSaving(false)
    }
  }, [
    patenteChasis, tipoPesaje, usuarioFaenaId, totalCabezas, corralId, pesoBruto,
    destino, pesoTara, pesoNeto, patenteAcoplado, chofer, dniChofer, transportistaId,
    observaciones, remito, descripcion, operadorId, dte, guia, productorId, especie,
    tiposAnimales, resetForm, onTropaCreada, config
  ])

  // Cerrar pesaje (add tara)
  const handleCerrarPesaje = useCallback(async () => {
    if (!pesajeSeleccionado || taraForm <= 0) {
      toast.error('Ingrese el peso tara')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/pesaje-camion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pesajeSeleccionado.id,
          pesoTara: taraForm,
          pesoNeto: pesajeSeleccionado.pesoBruto! - taraForm
        })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast.success('Pesaje cerrado correctamente')
        setCerrarOpen(false)
        setPesajeSeleccionado(null)
        setTaraForm(0)
        
        setTimeout(() => imprimirTicket(data.data, true, config), 100)
        await fetchData()
        onTropaCreada?.()
      } else {
        toast.error(data.error || 'Error al cerrar')
      }
    } catch (error) {
      console.error('Error al cerrar pesaje:', error)
      toast.error('Error de conexion')
    } finally {
      setSaving(false)
    }
  }, [pesajeSeleccionado, taraForm, fetchData, onTropaCreada, config])

  // Delete pesaje
  const handleDeletePesaje = useCallback(async () => {
    if (!pesajeAccion) return
    
    try {
      const res = await fetch(`/api/pesaje-camion?id=${pesajeAccion.id}`, { method: 'DELETE' })
      
      if (res.ok) {
        toast.success('Pesaje eliminado')
        setDeleteDialogOpen(false)
        setPesajeAccion(null)
        setSupervisorPin('')
        fetchData()
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexion')
    }
  }, [pesajeAccion, fetchData])

  // Print report
  const handleImprimirReporte = useCallback(() => {
    imprimirReporte(pesajesFiltrados, fechaDesde, fechaHasta, config)
  }, [pesajesFiltrados, fechaDesde, fechaHasta, config])

  return {
    // Data
    clientes,
    transportistas,
    corrales,
    pesajesAbiertos,
    pesajesCerrados,
    pesajesFiltrados,
    nextTicket,
    nextTropaCode,
    productores,
    usuariosFaena,
    
    // UI State
    loading,
    saving,
    activeTab,
    setActiveTab,
    tipoPesaje,
    setTipoPesaje,
    
    // Form State
    patenteChasis, setPatenteChasis,
    patenteAcoplado, setPatenteAcoplado,
    chofer, setChofer,
    dniChofer, setDniChofer,
    transportistaId, setTransportistaId,
    dte, setDte,
    guia, setGuia,
    productorId, setProductorId,
    usuarioFaenaId, setUsuarioFaenaId,
    especie, setEspecie,
    corralId, setCorralId,
    pesoBruto, setPesoBruto,
    pesoTara, setPesoTara,
    pesoNeto,
    observaciones, setObservaciones,
    destino, setDestino,
    remito, setRemito,
    descripcion, setDescripcion,
    tiposAnimales, setTiposAnimales,
    totalCabezas,
    
    // History filters
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    
    // Dialogs
    cerrarOpen, setCerrarOpen,
    pesajeSeleccionado, setPesajeSeleccionado,
    taraForm, setTaraForm,
    editDialogOpen, setEditDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    supervisorPin, setSupervisorPin,
    supervisorVerificado, setSupervisorVerificado,
    pesajeAccion, setPesajeAccion,
    quickAddOpen, setQuickAddOpen,
    
    // Actions
    fetchData,
    resetForm,
    handleQuickAdd,
    handleGuardar,
    handleCerrarPesaje,
    handleDeletePesaje,
    handleImprimirReporte,
    imprimirTicket,
    config
  }
}
'@

$usePesajePath = Join-Path $componentDir "usePesajeCamiones.ts"
$usePesajeContent | Out-File -FilePath $usePesajePath -Encoding UTF8
Write-Host "  OK - usePesajeCamiones.ts actualizado" -ForegroundColor Green

# ============================================
# 3. ACTUALIZAR index.tsx (solo lineas necesarias)
# ============================================
Write-Host "[3/3] Actualizando index.tsx..." -ForegroundColor Yellow

$indexPath = Join-Path $componentDir "index.tsx"
$indexContent = Get-Content $indexPath -Raw

# Reemplazar la linea de usePesajeCamiones
$indexContent = $indexContent -replace "handleImprimirReporte, imprimirTicket\s*\}", "handleImprimirReporte, imprimirTicket, config`n  }"
$indexContent = $indexContent -replace "onClick=\{\(\) => imprimirTicket\(p, false\)\}", "onClick={() => imprimirTicket(p, false, config)}"

$indexContent | Out-File -FilePath $indexPath -Encoding UTF8
Write-Host "  OK - index.tsx actualizado" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ACTUALIZACION COMPLETADA" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Cambios realizados:" -ForegroundColor Cyan
Write-Host "  - Ticket muestra datos del frigorifico (direccion, CUIT, etc.)"
Write-Host "  - Agregado campo 'Firma Porteria' junto a 'Firma Conforme Chofer'"
Write-Host "  - Logo en el encabezado del ticket"
Write-Host ""
Write-Host "Ahora actualice la configuracion en la base de datos:" -ForegroundColor Yellow
Write-Host "  1. Abra el sistema en el navegador"
Write-Host "  2. Vaya a Configuracion"
Write-Host "  3. Complete los datos del frigorifico"
Write-Host ""
Write-Host "Datos a cargar:" -ForegroundColor Cyan
Write-Host "  Nombre: Solemar Alimentaria"
Write-Host "  Direccion: Ruta Nac. N 22 Km 1043, Chimpay, Rio Negro, Argentina"
Write-Host "  CUIT: 30-70919450-6"
Write-Host "  Nro Establecimiento: 3986"
Write-Host "  Matricula: 300"
Write-Host ""
Write-Host "Presione una tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
