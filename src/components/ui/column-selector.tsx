'use client'

import { useState, useCallback, useMemo } from 'react'
import { Columns3, GripVertical, Lock, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Public Types ──────────────────────────────────────────────

export interface ColumnDef {
  key: string
  label: string
  visible?: boolean
  order?: number
  fixed?: boolean
}

export interface ColumnSelectorProps {
  reportId: string
  columns: ColumnDef[]
  onColumnsChange: (visibleKeys: string[]) => void
}

export interface SavedColumnPrefs {
  keys: string[]   // ordered visible keys
  hidden: string[] // hidden keys (non-fixed)
}

// ── Helpers ───────────────────────────────────────────────────

const STORAGE_PREFIX = 'col-selector-'

function loadPrefs(reportId: string): SavedColumnPrefs | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + reportId)
    if (raw) return JSON.parse(raw) as SavedColumnPrefs
  } catch { /* ignore */ }
  return null
}

function savePrefs(reportId: string, prefs: SavedColumnPrefs): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_PREFIX + reportId, JSON.stringify(prefs))
  } catch { /* ignore */ }
}

function removePrefs(reportId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_PREFIX + reportId)
  } catch { /* ignore */ }
}

/** Build the initial ordered list of column keys from the ColumnDef[] defaults */
function getDefaultKeys(columns: ColumnDef[]): string[] {
  return [...columns]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((c) => c.key)
}

function getDefaultHidden(columns: ColumnDef[]): Set<string> {
  return new Set(
    columns.filter((c) => c.visible === false && !c.fixed).map((c) => c.key),
  )
}

/** Initialize ordered keys from localStorage or defaults */
function initOrderedKeys(columns: ColumnDef[], validKeys: Set<string>): string[] {
  // Try localStorage (only works client-side)
  const defaultKeys = getDefaultKeys(columns)
  if (typeof window === 'undefined') return defaultKeys

  // Check for any saved prefs (using a generic key since we don't have reportId in the lazy init)
  // We handle the reportId-specific loading via the initializedRef pattern
  return defaultKeys
}

function buildOrderedKeysFromPrefs(
  columns: ColumnDef[],
  prefs: SavedColumnPrefs,
  validKeys: Set<string>,
): string[] {
  const savedSet = new Set([...prefs.keys, ...prefs.hidden])
  const newKeys = getDefaultKeys(columns).filter((k) => !savedSet.has(k))
  const visibleSaved = prefs.keys.filter((k) => validKeys.has(k) && !prefs.hidden.includes(k))
  const hiddenSaved = prefs.hidden.filter((k) => validKeys.has(k))
  const combined = [...visibleSaved, ...newKeys, ...hiddenSaved]
  return combined.length > 0 ? combined : getDefaultKeys(columns)
}

// ── Component ─────────────────────────────────────────────────

export function ColumnSelector({
  reportId,
  columns,
  onColumnsChange,
}: ColumnSelectorProps) {
  const [open, setOpen] = useState(false)

  // Track which keys are actually valid (from current `columns` prop)
  const validKeys = useMemo(() => new Set(columns.map((c) => c.key)), [columns])
  const fixedKeys = useMemo(() => new Set(columns.filter((c) => c.fixed).map((c) => c.key)), [columns])

  // Ordered keys (including hidden ones at the end)
  const [orderedKeys, setOrderedKeys] = useState<string[]>(() => {
    const prefs = loadPrefs(reportId)
    if (prefs) {
      const vk = new Set(columns.map((c) => c.key))
      return buildOrderedKeysFromPrefs(columns, prefs, vk)
    }
    return getDefaultKeys(columns)
  })

  // Which keys are currently hidden
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => {
    const prefs = loadPrefs(reportId)
    if (prefs) {
      return new Set(prefs.hidden.filter((k) => {
        const col = columns.find((c) => c.key === k)
        return col && !col.fixed
      }))
    }
    return getDefaultHidden(columns)
  })

  // Computed visible keys
  const visibleKeys = useMemo(
    () => orderedKeys.filter((k) => !hiddenKeys.has(k)),
    [orderedKeys, hiddenKeys],
  )

  // ── Persist + notify whenever keys change ────────────────────
  const updateAndNotify = useCallback(
    (newOrdered: string[], newHidden: Set<string>) => {
      setOrderedKeys(newOrdered)
      setHiddenKeys(newHidden)

      // Persist
      const vis = newOrdered.filter((k) => !newHidden.has(k))
      const hid = [...newHidden].filter((k) => validKeys.has(k) && !fixedKeys.has(k))
      savePrefs(reportId, { keys: vis, hidden: hid })

      // Notify parent
      onColumnsChange(vis)
    },
    [reportId, validKeys, fixedKeys, onColumnsChange],
  )

  // ── Toggle visibility ───────────────────────────────────────
  const toggleVisibility = useCallback(
    (key: string) => {
      if (fixedKeys.has(key)) return
      const next = new Set(hiddenKeys)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      updateAndNotify(orderedKeys, next)
    },
    [fixedKeys, hiddenKeys, orderedKeys, updateAndNotify],
  )

  // ── Drag & Drop (HTML5) using state to avoid ref-during-render ─
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx)
  }, [])

  const handleDragOver = useCallback(
    (idx: number) => {
      if (dragIdx !== idx) {
        setDropIdx(idx)
      }
    },
    [dragIdx],
  )

  const handleDragEnd = useCallback(() => {
    if (dragIdx !== null && dropIdx !== null && dragIdx !== dropIdx) {
      const next = [...orderedKeys]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(dropIdx, 0, moved)
      updateAndNotify(next, hiddenKeys)
    }
    setDragIdx(null)
    setDropIdx(null)
  }, [dragIdx, dropIdx, orderedKeys, hiddenKeys, updateAndNotify])

  // ── Reset ───────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    removePrefs(reportId)
    updateAndNotify(getDefaultKeys(columns), getDefaultHidden(columns))
  }, [reportId, columns, updateAndNotify])

  // ── Render ──────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="size-4" />
          <span className="hidden sm:inline">Columnas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="px-3 py-2.5">
          <p className="text-sm font-medium leading-none">Columnas visibles</p>
          <p className="text-xs text-muted-foreground mt-1">
            Arrastra para reordenar
          </p>
        </div>
        <Separator />
        <ScrollArea className="max-h-64">
          <div className="py-1">
            {orderedKeys.map((key, idx) => {
              const col = columns.find((c) => c.key === key)
              if (!col) return null
              const isFixed = col.fixed ?? false
              const isHidden = hiddenKeys.has(key)
              const isDropTarget = dropIdx === idx && dragIdx !== idx

              return (
                <div
                  key={key}
                  draggable={!isFixed}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    handleDragOver(idx)
                  }}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 text-sm
                    ${!isFixed ? 'cursor-grab active:cursor-grabbing' : ''}
                    ${isDropTarget ? 'border-t-2 border-primary' : ''}
                    ${isHidden ? 'opacity-50' : ''}
                    transition-opacity
                  `}
                >
                  {/* Drag handle or lock icon */}
                  {isFixed ? (
                    <span className="w-4 shrink-0 flex items-center justify-center">
                      <Lock className="size-3 text-muted-foreground" />
                    </span>
                  ) : (
                    <span className="w-4 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <GripVertical className="size-4" />
                    </span>
                  )}

                  {/* Checkbox */}
                  <Checkbox
                    checked={!isHidden}
                    disabled={isFixed}
                    onCheckedChange={() => toggleVisibility(key)}
                  />

                  {/* Label */}
                  <span className="flex-1 truncate select-none">
                    {col.label}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <Separator />
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="size-3.5" />
            Restablecer por defecto
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ColumnSelector
