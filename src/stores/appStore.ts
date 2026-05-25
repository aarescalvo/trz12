'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================
// APP STORE - Estado global de la aplicación
// Capa 1: Persiste operador, página actual y preferencias
// ============================================================

interface Operador {
  id: string
  nombre: string
  usuario: string
  rol: string
  email?: string
  permisos: {
    puedePesajeCamiones: boolean
    puedePesajeIndividual: boolean
    puedeMovimientoHacienda: boolean
    puedeListaFaena: boolean
    puedeIngresoCajon: boolean
    puedeRomaneo: boolean
    puedeCuarteo: boolean
    puedeDesposte: boolean
    puedeEmpaque: boolean
    puedeExpedicionC2: boolean
    puedeMenudencias: boolean
    puedeStock: boolean
    puedeReportes: boolean
    puedeCCIR: boolean
    puedeFacturacion: boolean
    puedeConfiguracion: boolean
    puedeCalidad: boolean
    puedeAutorizarReportes: boolean
  }
}

type Page = 'dashboard' | 'pesajeCamiones' | 'pesajeIndividual' | 'movimientoHacienda' | 'listaFaena' | 'ingresoCajon' | 'romaneo' | 'vbRomaneo' | 'movimientoCamaras' | 'expedicion' | 'despachos' | 'cuarteo' | 'ingresoDespostada' | 'movimientosDespostada' | 'cortesDespostada' | 'empaque' | 'menudencias' | 'cueros' | 'grasa' | 'desperdicios' | 'fondoDigestor' | 'stock' | 'stocksCorrales' | 'planilla01' | 'rindesTropa' | 'busquedaFiltro' | 'reportesSenasa' | 'facturacion' | 'insumos' | 'stocksInsumos' | 'configRotulos' | 'editorRotulos' | 'configInsumos' | 'configUsuarios' | 'configCodigobarras' | 'configBalanzas' | 'configOperadores' | 'configProductos' | 'configSubproductos' | 'configListadoInsumos' | 'configCondicionesEmbalaje' | 'configTiposProducto' | 'calidadRegistroUsuarios' | 'reportes' | 'configuracion'

interface AppState {
  // Auth
  operador: Operador | null
  setOperador: (op: Operador | null) => void

  // Navigation
  currentPage: Page
  setCurrentPage: (page: Page) => void

  // Module dirty tracking (Capa 1 - know which modules have unsaved data)
  dirtyModules: Set<string>
  markDirty: (moduleId: string) => void
  markClean: (moduleId: string) => void
  isDirty: (moduleId: string) => boolean
  hasAnyDirty: () => boolean

  // Sidebar state
  expandedGroups: string[]
  setExpandedGroups: (groups: string[]) => void
  expandedSubGroups: string[]
  setExpandedSubGroups: (groups: string[]) => void

  // Stats (cached)
  stats: { tropasActivas: number; enPesaje: number; pesajesHoy: number; enCamara: number }
  setStats: (stats: AppState['stats']) => void

  // Persisted navigation (survives reload)
  lastPage: string
  setLastPage: (page: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      operador: null,
      setOperador: (op) => set({ operador: op }),

      // Navigation
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),

      // Dirty tracking
      dirtyModules: new Set<string>(),
      markDirty: (moduleId) =>
        set((state) => {
          const dirty = new Set(state.dirtyModules)
          dirty.add(moduleId)
          return { dirtyModules: dirty }
        }),
      markClean: (moduleId) =>
        set((state) => {
          const dirty = new Set(state.dirtyModules)
          dirty.delete(moduleId)
          return { dirtyModules: dirty }
        }),
      isDirty: (moduleId) => get().dirtyModules.has(moduleId),
      hasAnyDirty: () => get().dirtyModules.size > 0,

      // Sidebar
      expandedGroups: ['CICLO I', 'Subproductos'],
      setExpandedGroups: (groups) => set({ expandedGroups: groups }),
      expandedSubGroups: ['Subproductos-Consumo', 'Subproductos-Rendering'],
      setExpandedSubGroups: (groups) => set({ expandedSubGroups: groups }),

      // Stats
      stats: { tropasActivas: 0, enPesaje: 0, pesajesHoy: 0, enCamara: 0 },
      setStats: (stats) => set({ stats }),

      // Persisted navigation
      lastPage: 'dashboard',
      setLastPage: (page) => set({ lastPage: page }),
    }),
    {
      name: 'solemar-app-store',
      partialize: (state) => ({
        operador: state.operador,
        lastPage: state.lastPage,
        expandedGroups: state.expandedGroups,
        expandedSubGroups: state.expandedSubGroups,
        // NOT persisting dirtyModules, stats, or currentPage - they're transient
      }),
    }
  )
)

export type { Operador, Page }
