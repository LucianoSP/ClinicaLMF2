'use client'

import { Card } from '@/components/ui/card'
import { GuiasList } from '@/components/guias/GuiasList'

export default function GuiasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guias Médicas</h1>
        <p className="text-muted-foreground">
          Gerenciamento de guias médicas
        </p>
      </div>

      <Card className="p-6">
        <GuiasList />
      </Card>
    </div>
  )
}
