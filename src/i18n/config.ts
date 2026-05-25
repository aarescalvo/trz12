export const locales = ['es-Latam', 'en', 'it'] as const
export const defaultLocale = 'es-Latam' as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  'es-Latam': 'Español (Latinoamérica)',
  'en': 'English',
  'it': 'Italiano'
}

export const localeFlags: Record<Locale, string> = {
  'es-Latam': '🌎',
  'en': '🇬🇧',
  'it': '🇮🇹'
}
