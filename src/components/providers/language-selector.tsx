'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocale } from './locale-provider'
import { Globe } from 'lucide-react'
import { type Locale } from '@/i18n/config'

export function LanguageSelector() {
  const { locale, setLocale, localeNames, localeFlags, locales } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm">{localeFlags[locale]} {localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc as Locale)}
            className={`cursor-pointer ${locale === loc ? 'bg-amber-50 text-amber-700' : ''}`}
          >
            <span className="mr-2">{localeFlags[loc as Locale]}</span>
            {localeNames[loc as Locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
