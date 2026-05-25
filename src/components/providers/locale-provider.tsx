'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useSyncExternalStore } from 'react'
import { locales, defaultLocale, type Locale, localeNames, localeFlags } from '@/i18n/config'

// Import translations
import esLatamTranslations from '../../../messages/es-Latam.json'
import enTranslations from '../../../messages/en.json'
import itTranslations from '../../../messages/it.json'

const translations: Record<Locale, Record<string, unknown>> = {
  'es-Latam': esLatamTranslations,
  'en': enTranslations,
  'it': itTranslations
}

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  localeNames: typeof localeNames
  localeFlags: typeof localeFlags
  locales: readonly Locale[]
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

interface LocaleProviderProps {
  children: ReactNode
}

// Helper to detect if we're on the client
const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function LocaleProvider({ children }: LocaleProviderProps) {
  // Use useSyncExternalStore to detect client-side mounting
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
  
  // Use lazy initialization to read from localStorage once
  const [locale, setLocaleState] = useState<Locale>(() => {
    // This only runs on the client
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale')
      if (stored && locales.includes(stored as Locale)) {
        return stored as Locale
      }
    }
    return defaultLocale
  })

  // Set locale and persist to localStorage
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
      document.documentElement.lang = newLocale
    }
  }, [])

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: unknown = translations[locale]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        // Fallback to default locale
        value = translations[defaultLocale]
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = (value as Record<string, unknown>)[fallbackKey]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Replace parameters
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, String(paramValue)),
        value
      )
    }

    return value
  }, [locale])

  // Show default content until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <LocaleContext.Provider value={{ locale: defaultLocale, setLocale, t, localeNames, localeFlags, locales }}>
        {children}
      </LocaleContext.Provider>
    )
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, localeNames, localeFlags, locales }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

// Export useTranslations as alias for convenience
export const useTranslations = useLocale
