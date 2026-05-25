'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Cliente, Transportista, Corral, Pesaje, TipoAnimalCounter } from './types'
import { imprimirTicket, imprimirReporte } from './ticketPrint'

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
      const [pesajesRes, transRes, clientesRes, corralesRes] = await Promise.all([
        fetch('/api/pesaje-camion'),
        fetch('/api/transportistas'),
        fetch('/api/clientes'),
        fetch('/api/corrales')
      ])
      
      const pesajesData = await pesajesRes.json()
      const transData = await transRes.json()
      const clientesData = await clientesRes.json()
      const corralesData = await corralesRes.json()
      
      if (pesajesData.success) {
        setPesajesAbiertos(pesajesData.data.filter((p: Pesaje) => p.estado === 'ABIERTO'))
        setPesajesCerrados(pesajesData.data.filter((p: Pesaje) => p.estado === 'CERRADO'))
        setNextTicket(pesajesData.nextTicketNumber)
      }
      
      if (transData.success) setTransportistas(transData.data)
      if (clientesData.success) setClientes(clientesData.data)
      if (corralesData.success) setCorrales(corralesData.data)
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
          toast.success(`✅ Tropa ${data.data.tropa?.codigo} creada con ${animalesCreados} animales individuales`, { duration: 6000 })
          toast.info(`Ticket #${String(data.data.numeroTicket).padStart(6, '0')} - Pendiente de tara`)
        } else {
          toast.success(`Ticket #${String(data.data.numeroTicket).padStart(6, '0')} creado`)
        }
        
        resetForm()
        
        if (data.data.estado === 'ABIERTO') {
          setPesajesAbiertos(prev => [data.data, ...prev])
        } else {
          setPesajesCerrados(prev => [data.data, ...prev])
          imprimirTicket(data.data, true)
        }
        
        setNextTicket(prev => prev + 1)
        onTropaCreada?.()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }, [
    patenteChasis, tipoPesaje, usuarioFaenaId, totalCabezas, corralId, pesoBruto,
    destino, pesoTara, pesoNeto, patenteAcoplado, chofer, dniChofer, transportistaId,
    observaciones, remito, descripcion, operadorId, dte, guia, productorId, especie,
    tiposAnimales, resetForm, onTropaCreada
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
        
        setTimeout(() => imprimirTicket(data.data, true), 100)
        await fetchData()
        onTropaCreada?.()
      } else {
        toast.error(data.error || 'Error al cerrar')
      }
    } catch (error) {
      console.error('Error al cerrar pesaje:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }, [pesajeSeleccionado, taraForm, fetchData, onTropaCreada])

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
      toast.error('Error de conexión')
    }
  }, [pesajeAccion, fetchData])

  // Print report
  const handleImprimirReporte = useCallback(() => {
    imprimirReporte(pesajesFiltrados, fechaDesde, fechaHasta)
  }, [pesajesFiltrados, fechaDesde, fechaHasta])

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
    imprimirTicket
  }
}
