'use client'

import { Card } from '@/components/ui/card'
import { PlanosList } from '@/components/planos/PlanosList'
import { BackButton } from '@/components/ui/back-button'

export default function PlanosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos de Saúde</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de saúde cadastrados
          </p>
        </div>
        <BackButton />
      </div>

      <Card className="p-6">
        <PlanosList />
      </Card>
    </div>
  )
}
