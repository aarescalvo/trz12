'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Tropa, Animal, Corral } from './types'
import { imprimirRotulo } from './rotuloPrint'

interface TipoAnimalConfig {
  tipoAnimal: string
  cantidad: number
}

interface UsePesajeIndividualOptions {
  operadorId: string
}

export function usePesajeIndividual({ operadorId }: UsePesajeIndividualOptions) {
  // Data
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [tropasListoPesaje, setTropasListoPesaje] = useState<Tropa[]>([])
  const [tropasPesado, setTropasPesado] = useState<Tropa[]>([])
  const [corrales, setCorrales] = useState<Corral[]>([])
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('solicitar')
  const [tropaSeleccionada, setTropaSeleccionada] = useState<Tropa | null>(null)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [animalActual, setAnimalActual] = useState(0)
  const [corralDestinoId, setCorralDestinoId] = useState('')
  
  // Form fields
  const [caravana, setCaravana] = useState('')
  const [tipoAnimalSeleccionado, setTipoAnimalSeleccionado] = useState('')
  const [raza, setRaza] = useState('')
  const [pesoActual, setPesoActual] = useState('')
  const [observacionesAnimal, setObservacionesAnimal] = useState('')
  
  // Rotulo preview
  const [showRotuloPreview, setShowRotuloPreview] = useState(false)
  const [rotuloPreviewData, setRotuloPreviewData] = useState<Animal | null>(null)
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null)
  const [editCaravana, setEditCaravana] = useState('')
  const [editTipoAnimal, setEditTipoAnimal] = useState('')
  const [editRaza, setEditRaza] = useState('')
  const [editPeso, setEditPeso] = useState('')
  
  // Confirmar tipos dialog
  const [confirmarTiposOpen, setConfirmarTiposOpen] = useState(false)
  const [tiposConfirmados, setTiposConfirmados] = useState<TipoAnimalConfig[]>([])
  
  // Computed
  const animalesPendientes = animales.filter(a => a.estado === 'RECIBIDO')
  const animalesPesados = animales.filter(a => a.estado === 'PESADO')

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [tropasRes, corralesRes] = await Promise.all([
        fetch('/api/tropas'),
        fetch('/api/corrales')
      ])
      const tropasData = await tropasRes.json()
      const corralesData = await corralesRes.json()
      
      if (tropasData.success) {
        setTropas(tropasData.data)
      }
      if (corralesData.success) {
        setCorrales(corralesData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update filtered tropas
  useEffect(() => {
    setTropasListoPesaje(tropas.filter(t => t.estado === 'EN_PESAJE' || t.estado === 'RECIBIDO' || t.estado === 'EN_CORRAL'))
    setTropasPesado(tropas.filter(t => t.estado === 'PESADO'))
  }, [tropas])

  // Initialize
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset form fields
  const resetFormFields = useCallback(() => {
    setCaravana('')
    setTipoAnimalSeleccionado('')
    setRaza('')
    setPesoActual('')
    setObservacionesAnimal('')
  }, [])

  // Seleccionar tropa - Abre diálogo de confirmación de tipos
  const handleSeleccionarTropa = useCallback((tropa: Tropa) => {
    // Set corral destino from tropa if available
    const corralId = tropa.corralId || 
      (typeof tropa.corral === 'object' && tropa.corral?.id ? tropa.corral.id : '') || ''
    setCorralDestinoId(corralId)
    
    setTropaSeleccionada(tropa)
    
    // Inicializar tipos confirmados con los de la tropa
    const tiposIniciales = tropa.tiposAnimales?.map(t => ({ ...t })) || []
    setTiposConfirmados(tiposIniciales)
    
    // Abrir diálogo de confirmación de tipos
    setConfirmarTiposOpen(true)
    
    resetFormFields()
  }, [resetFormFields])

  // Confirmar tipos y cargar animales existentes si los hay
  const handleConfirmarTipos = useCallback(async (tipos: TipoAnimalConfig[]) => {
    if (!tropaSeleccionada) return
    
    setSaving(true)
    
    try {
      // Verificar si hay cambios respecto a los tipos originales
      const tiposOriginales = tropaSeleccionada.tiposAnimales || []
      const hayCambios = JSON.stringify(tipos) !== JSON.stringify(tiposOriginales)
      
      // Si hay cambios, actualizar en la base de datos
      if (hayCambios) {
        const totalCabezas = tipos.reduce((acc, t) => acc + t.cantidad, 0)
        
        const res = await fetch('/api/tropas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tropaSeleccionada.id,
            tiposAnimales: tipos,
            cantidadCabezas: totalCabezas
          })
        })
        
        if (!res.ok) {
          toast.error('Error al actualizar tipos de animales')
          setSaving(false)
          return
        }
        
        // Actualizar tropa local
        setTropaSeleccionada(prev => prev ? {
          ...prev,
          tiposAnimales: tipos,
          cantidadCabezas: totalCabezas
        } : null)
        
        toast.success(`Tipos actualizados: ${totalCabezas} animales`)
      }
      
      // Guardar tipos confirmados
      setTiposConfirmados(tipos)
      setConfirmarTiposOpen(false)
      
      // Cargar animales existentes si los hay
      try {
        const res = await fetch(`/api/tropas/${tropaSeleccionada.id}`)
        const data = await res.json()
        if (data.success && data.data.animales && data.data.animales.length > 0) {
          setAnimales(data.data.animales)
          const pendientes = data.data.animales.filter((a: Animal) => a.estado === 'RECIBIDO')
          setAnimalActual(pendientes.length > 0 ? data.data.animales.findIndex((a: Animal) => a.estado === 'RECIBIDO') : data.data.animales.length)
        } else {
          setAnimales([])
          setAnimalActual(0)
        }
      } catch {
        setAnimales([])
        setAnimalActual(0)
      }
      
      fetchData()
    } catch (error) {
      console.error('Error confirmando tipos:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }, [tropaSeleccionada, fetchData])

  // Iniciar pesaje con tipos confirmados
  const handleIniciarPesaje = useCallback(async () => {
    if (!tropaSeleccionada) return
    if (!corralDestinoId) {
      toast.error('Seleccione el corral de destino')
      return
    }
    
    if (tiposConfirmados.length === 0) {
      toast.error('No hay animales configurados para pesar')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/tropas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tropaSeleccionada.id,
          estado: 'EN_PESAJE',
          corralId: corralDestinoId
        })
      })
      
      if (res.ok) {
        toast.success('Pesaje iniciado')
        setActiveTab('pesar')
        
        // Create animals list based on TIPOS CONFIRMADOS
        if (animales.length === 0) {
          const nuevosAnimales: Animal[] = []
          let num = 1
          const prefijo = tropaSeleccionada.especie === 'BOVINO' ? 'B' : 'E'
          const year = new Date().getFullYear()
          
          // Usar tiposConfirmados en lugar de tropaSeleccionada.tiposAnimales
          for (const tipo of tiposConfirmados) {
            for (let i = 0; i < tipo.cantidad; i++) {
              nuevosAnimales.push({
                id: `temp-${num}`,
                numero: num,
                codigo: `${prefijo}${year}${String(tropaSeleccionada.numero).padStart(4, '0')}-${String(num).padStart(3, '0')}`,
                tipoAnimal: tipo.tipoAnimal,
                estado: 'RECIBIDO'
              })
              num++
            }
          }
          
          setAnimales(nuevosAnimales)
          setAnimalActual(0)
        }
        
        fetchData()
      } else {
        toast.error('Error al iniciar pesaje')
      }
    } catch (error) {
      console.error('Error iniciando pesaje:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }, [tropaSeleccionada, corralDestinoId, animales.length, tiposConfirmados, fetchData])

  // Registrar peso con validación de tipo
  const handleRegistrarPeso = useCallback(async () => {
    if (!pesoActual || !animales[animalActual]) return
    
    const peso = parseFloat(pesoActual)
    if (isNaN(peso) || peso <= 0) {
      toast.error('Ingrese un peso válido')
      return
    }

    if (!tipoAnimalSeleccionado) {
      toast.error('Seleccione el tipo de animal')
      return
    }

    // Validar que el tipo seleccionado esté en los tipos confirmados
    const tipoConfirmado = tiposConfirmados.find(t => t.tipoAnimal === tipoAnimalSeleccionado)
    if (!tipoConfirmado) {
      toast.error('El tipo seleccionado no está en los animales confirmados')
      return
    }

    // Contar cuántos animales de este tipo ya se pesaron
    const animalesPesadosDeTipo = animales.filter(
      a => a.estado === 'PESADO' && a.tipoAnimal === tipoAnimalSeleccionado
    ).length
    
    // Verificar que no se exceda la cantidad confirmada
    if (animalesPesadosDeTipo >= tipoConfirmado.cantidad) {
      toast.error(`Ya se pesaron los ${tipoConfirmado.cantidad} animales de tipo ${tipoAnimalSeleccionado} confirmados`)
      return
    }

    setSaving(true)
    try {
      const animal = animales[animalActual]
      
      const res = await fetch('/api/animales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tropaId: tropaSeleccionada?.id,
          numero: animal.numero,
          codigo: animal.codigo,
          tipoAnimal: tipoAnimalSeleccionado,
          caravana: caravana || null,
          raza: raza || null,
          pesoVivo: peso,
          observaciones: observacionesAnimal || null,
          operadorId
        })
      })
      
      if (res.ok) {
        const newAnimal = await res.json()
        
        // Actualizar animal en la lista local
        const animalesActualizados = [...animales]
        animalesActualizados[animalActual] = {
          ...animalesActualizados[animalActual],
          id: newAnimal.id,
          caravana: caravana || undefined,
          raza: raza || undefined,
          tipoAnimal: tipoAnimalSeleccionado,
          pesoVivo: peso,
          observaciones: observacionesAnimal || undefined,
          estado: 'PESADO'
        }
        setAnimales(animalesActualizados)
        
        // Imprimir rótulo
        imprimirRotulo({ animal: animalesActualizados[animalActual], tropaCodigo: tropaSeleccionada?.codigo || '' })
        
        // Avanzar al siguiente animal automáticamente
        const nextIndex = animalesActualizados.findIndex((a, i) => a.estado === 'RECIBIDO' && i > animalActual)
        if (nextIndex !== -1) {
          setAnimalActual(nextIndex)
          resetFormFields()
          toast.success(`Animal ${animal.numero} registrado - ${peso} kg`, { duration: 1500 })
        } else {
          // Check if all animals are weighed
          const noPesados = animalesActualizados.filter(a => a.estado === 'RECIBIDO')
          if (noPesados.length === 0) {
            toast.success('¡Pesaje completado!')
            handleFinalizarPesaje(animalesActualizados)
          } else {
            const firstPendiente = animalesActualizados.findIndex(a => a.estado === 'RECIBIDO')
            if (firstPendiente !== -1) {
              setAnimalActual(firstPendiente)
              resetFormFields()
            }
          }
        }
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Error al registrar peso')
      }
    } catch (error) {
      console.error('Error registrando peso:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }, [pesoActual, animales, animalActual, tipoAnimalSeleccionado, caravana, raza, observacionesAnimal, tropaSeleccionada, operadorId, resetFormFields, tiposConfirmados])

  // Finalizar pesaje
  const handleFinalizarPesaje = useCallback(async (animalesActuales?: Animal[]) => {
    if (!tropaSeleccionada) return
    
    setSaving(true)
    try {
      const pesoTotal = (animalesActuales || animales).reduce((acc, a) => acc + (a.pesoVivo || 0), 0)
      
      const res = await fetch('/api/tropas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tropaSeleccionada.id,
          estado: 'PESADO',
          pesoTotalIndividual: pesoTotal
        })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast.success('Tropa pesada completamente')
        setTropaSeleccionada(null)
        setAnimales([])
        setAnimalActual(0)
        setTiposConfirmados([])
        setActiveTab('solicitar')
        await fetchData()
      } else {
        toast.error(data.error || 'Error al finalizar pesaje')
      }
    } catch (error) {
      console.error('Error al finalizar pesaje:', error)
      toast.error('Error de conexión al finalizar pesaje')
    } finally {
      setSaving(false)
    }
  }, [tropaSeleccionada, animales, fetchData])

  // Edit animal
  const handleEditAnimal = useCallback((animal: Animal) => {
    setEditingAnimal(animal)
    setEditCaravana(animal.caravana || '')
    setEditTipoAnimal(animal.tipoAnimal)
    setEditRaza(animal.raza || '')
    setEditPeso(animal.pesoVivo?.toString() || '')
    setEditDialogOpen(true)
  }, [])

  // Save edit
  const handleSaveEdit = useCallback(async () => {
    if (!editingAnimal) return
    
    try {
      const res = await fetch('/api/animales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAnimal.id,
          caravana: editCaravana || null,
          tipoAnimal: editTipoAnimal,
          raza: editRaza || null,
          pesoVivo: parseFloat(editPeso) || null
        })
      })
      
      if (res.ok) {
        toast.success('Animal actualizado')
        setEditDialogOpen(false)
        
        const updated = animales.map(a => {
          if (a.id === editingAnimal.id) {
            return {
              ...a,
              caravana: editCaravana || undefined,
              tipoAnimal: editTipoAnimal,
              raza: editRaza || undefined,
              pesoVivo: parseFloat(editPeso) || undefined
            }
          }
          return a
        })
        setAnimales(updated)
      } else {
        toast.error('Error al actualizar')
      }
    } catch (error) {
      console.error('Error guardando edición:', error)
      toast.error('Error de conexión')
    }
  }, [editingAnimal, editCaravana, editTipoAnimal, editRaza, editPeso, animales])

  // Delete animal
  const handleDeleteAnimal = useCallback(async (animal: Animal) => {
    if (!confirm(`¿Eliminar animal ${animal.numero}?`)) return
    
    try {
      const res = await fetch(`/api/animales?id=${animal.id}`, { method: 'DELETE' })
      
      if (res.ok) {
        toast.success('Animal eliminado')
        const updated = animales.filter(a => a.id !== animal.id)
        setAnimales(updated)
        if (animalActual >= updated.length) {
          setAnimalActual(Math.max(0, updated.length - 1))
        }
      } else {
        toast.error('Error al eliminar')
      }
    } catch (error) {
      console.error('Error eliminando animal:', error)
      toast.error('Error de conexión')
    }
  }, [animales, animalActual])

  // Reprint rotulo
  const handleReprint = useCallback((animal: Animal) => {
    imprimirRotulo({ animal, tropaCodigo: tropaSeleccionada?.codigo || '' })
    toast.success('Rótulo enviado a impresión')
  }, [tropaSeleccionada])

  // Preview rotulo
  const handlePreviewRotulo = useCallback((animal: Animal) => {
    setRotuloPreviewData(animal)
    setShowRotuloPreview(true)
  }, [])

  // Reabrir diálogo de confirmación de tipos
  const handleReabrirConfirmacion = useCallback(() => {
    setConfirmarTiposOpen(true)
  }, [])

  return {
    // Data
    tropas,
    tropasListoPesaje,
    tropasPesado,
    corrales,
    animales,
    animalesPendientes,
    animalesPesados,
    tiposConfirmados,
    
    // UI State
    loading,
    saving,
    activeTab,
    setActiveTab,
    tropaSeleccionada,
    animalActual,
    setAnimalActual,
    corralDestinoId,
    setCorralDestinoId,
    
    // Form fields
    caravana, setCaravana,
    tipoAnimalSeleccionado, setTipoAnimalSeleccionado,
    raza, setRaza,
    pesoActual, setPesoActual,
    observacionesAnimal, setObservacionesAnimal,
    
    // Rotulo preview
    showRotuloPreview,
    setShowRotuloPreview,
    rotuloPreviewData,
    
    // Edit dialog
    editDialogOpen,
    setEditDialogOpen,
    editingAnimal,
    editCaravana, setEditCaravana,
    editTipoAnimal, setEditTipoAnimal,
    editRaza, setEditRaza,
    editPeso, setEditPeso,
    
    // Confirmar tipos dialog
    confirmarTiposOpen,
    setConfirmarTiposOpen,
    setTropaSeleccionada,
    
    // Actions
    fetchData,
    handleSeleccionarTropa,
    handleConfirmarTipos,
    handleIniciarPesaje,
    handleRegistrarPeso,
    handleFinalizarPesaje,
    handleEditAnimal,
    handleSaveEdit,
    handleDeleteAnimal,
    handleReprint,
    handlePreviewRotulo,
    handleReabrirConfirmacion,
    imprimirRotulo
  }
}
