'use client'

import { Card, CardContent } from '@/components/ui/card'

interface Props {
  title: string
  description?: string
  icon: React.ReactNode
}

export function PlaceholderModule({ title, description, icon }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">{title}</h1>
            {description && <p className="text-stone-500 mt-1">{description}</p>}
          </div>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center text-stone-400">
            <div className="flex justify-center mb-4 opacity-50">
              {icon}
            </div>
            <p className="text-lg mb-2">Módulo en desarrollo</p>
            <p className="text-sm">Esta funcionalidad estará disponible próximamente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
