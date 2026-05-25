'use client'

import { useState, useEffect, useRef } from 'react'

interface UIPreferences {
  tamanoFuente: 'small' | 'normal' | 'large'
  densidad: 'compact' | 'normal' | 'comfortable'
  tema: 'light' | 'dark' | 'system'
}

const STORAGE_KEY = 'ui-preferences'

// Module-level cache to avoid refetching
let cachedPrefs: UIPreferences | null = null
let cachedOperadorId: string | null = null

/**
 * Apply UI preferences as CSS data attributes and classes on the <html> element.
 * This is the core function that makes font size and density work visually.
 */
export function applyPreferencesToDOM(prefs: Partial<UIPreferences>): void {
  if (typeof document === 'undefined') return

  const html = document.documentElement

  // Font size
  if (prefs.tamanoFuente) {
    html.setAttribute('data-font-size', prefs.tamanoFuente)
  }

  // Density
  if (prefs.densidad) {
    html.setAttribute('data-density', prefs.densidad)
  }

  // Theme
  if (prefs.tema) {
    if (prefs.tema === 'dark') {
      html.classList.add('dark')
    } else if (prefs.tema === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    } else {
      html.classList.remove('dark')
    }
  }
}

/**
 * Save preferences to localStorage cache for fast initialization on next page load.
 */
export function cachePreferences(prefs: UIPreferences): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load cached preferences from localStorage.
 */
export function loadCachedPreferences(): UIPreferences | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UIPreferences
  } catch {
    return null
  }
}

/**
 * Hook to load UI preferences from the API and apply them to the DOM.
 * Caches results in memory and localStorage for fast subsequent loads.
 */
export function usePreferenciasUI(operadorId: string): UIPreferences & { loaded: boolean } {
  const [prefs, setPrefs] = useState<UIPreferences>({
    tamanoFuente: 'normal',
    densidad: 'normal',
    tema: 'light',
  })
  const [loaded, setLoaded] = useState(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    if (!operadorId || fetchingRef.current) return
    fetchingRef.current = true

    let cancelled = false

    const load = async () => {
      try {
        // Return cached if same operador
        if (cachedOperadorId === operadorId && cachedPrefs) {
          applyPreferencesToDOM(cachedPrefs)
          if (!cancelled) {
            setPrefs(cachedPrefs)
            setLoaded(true)
          }
          return
        }

        const res = await fetch(`/api/preferencias-ui?operadorId=${operadorId}`)
        const data = await res.json()

        if (cancelled) return

        if (data.success && data.data) {
          const newPrefs: UIPreferences = {
            tamanoFuente: data.data.tamanoFuente || 'normal',
            densidad: data.data.densidad || 'normal',
            tema: data.data.tema || 'light',
          }

          cachedPrefs = newPrefs
          cachedOperadorId = operadorId

          applyPreferencesToDOM(newPrefs)
          cachePreferences(newPrefs)
          setPrefs(newPrefs)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading UI preferences:', error)
        }
      } finally {
        if (!cancelled) {
          setLoaded(true)
        }
        fetchingRef.current = false
      }
    }

    // Use scheduler to avoid synchronous setState in effect
    const id = setTimeout(load, 0)

    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [operadorId])

  return { ...prefs, loaded }
}
