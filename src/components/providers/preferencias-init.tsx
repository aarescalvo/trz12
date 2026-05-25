'use client'

import { useEffect } from 'react'
import { applyPreferencesToDOM, loadCachedPreferences } from '@/hooks/use-preferencias-ui'

/**
 * Lightweight provider that applies cached UI preferences from localStorage
 * on app mount. This ensures font size, density, and theme are applied
 * immediately without waiting for an API call.
 *
 * Should be placed in the root layout to run on every page.
 */
export function PreferenciasUIProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply cached preferences immediately from localStorage
    const cached = loadCachedPreferences()
    if (cached) {
      applyPreferencesToDOM(cached)
    }
  }, [])

  return <>{children}</>
}
