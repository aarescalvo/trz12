'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Star, BookmarkPlus, Bookmark, Trash2, Loader2 } from 'lucide-react'

interface SavedFilter {
  id: string
  reportType: string
  nombre: string
  filtros: string
  createdAt: string
}

interface ReportFavoritesProps {
  reportType: string
  currentFilters: Record<string, unknown>
  onLoadFilters: (filters: Record<string, unknown>) => void
  operadorId: string
}

export function ReportFavorites({
  reportType,
  currentFilters,
  onLoadFilters,
  operadorId,
}: ReportFavoritesProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchFilters = async () => {
    if (!operadorId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/filtros-reporte?reportType=${encodeURIComponent(reportType)}`
      )
      const data = await res.json()
      if (data.success) {
        setSavedFilters(data.data)
      }
    } catch {
      // Silently fail — favorites are non-critical
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!operadorId) return
      setLoading(true)
      try {
        const res = await fetch(
          `/api/filtros-reporte?reportType=${encodeURIComponent(reportType)}`
        )
        const data = await res.json()
        if (data.success && !cancelled) {
          setSavedFilters(data.data)
        }
      } catch {
        // Silently fail — favorites are non-critical
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [operadorId, reportType])

  const handleSave = async () => {
    if (!newName.trim()) {
      toast.error('Ingrese un nombre para el filtro')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/filtros-reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          nombre: newName.trim(),
          filtros: currentFilters,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Filtro guardado', { description: newName.trim() })
        setNewName('')
        setDialogOpen(false)
        fetchFilters()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/filtros-reporte?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Filtro eliminado', { description: nombre })
        fetchFilters()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLoad = (filter: SavedFilter) => {
    try {
      const parsed = JSON.parse(filter.filtros) as Record<string, unknown>
      onLoadFilters(parsed)
      toast.success('Filtros cargados', { description: filter.nombre })
    } catch {
      toast.error('Error al cargar el filtro guardado')
    }
  }

  const hasFilters = savedFilters.length > 0

  return (
    <div className="flex items-center gap-1">
      {/* Save button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="default"
            title="Guardar filtros actuales"
          >
            <BookmarkPlus className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle>Guardar filtros</DialogTitle>
            <DialogDescription>
              Asigne un nombre para guardar la configuración de filtros actual.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Ej: Faena mensual bovino"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            maxLength={100}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !newName.trim()}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved filters dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            title="Filtros guardados"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : hasFilters ? (
              <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            {hasFilters && (
              <span className="ml-1 text-xs text-muted-foreground">
                {savedFilters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Filtros guardados
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="max-h-64 overflow-y-auto">
            {savedFilters.length === 0 && !loading && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No hay filtros guardados
              </div>
            )}
            {savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between group cursor-pointer"
                onSelect={() => handleLoad(filter)}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {filter.nombre}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(filter.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(filter.id, filter.nombre)
                  }}
                  disabled={deletingId === filter.id}
                >
                  {deletingId === filter.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
