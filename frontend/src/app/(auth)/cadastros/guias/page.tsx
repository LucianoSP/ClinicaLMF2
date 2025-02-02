'use client'

import { GuiasList } from '@/components/guias/GuiasList'
import { BackButton } from '@/components/ui/back-button'

export default function GuiasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guias Médicas</h1>
          <p className="text-muted-foreground">
            Gerenciamento de guias médicas
          </p>
        </div>
        <BackButton />
      </div>

      <GuiasList />
    </div>
  )
}
