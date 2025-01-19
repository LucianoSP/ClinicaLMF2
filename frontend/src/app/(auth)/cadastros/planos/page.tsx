'use client'

import { Card } from '@/components/ui/card'
import { PlanosList } from '@/components/planos/PlanosList'

export default function PlanosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planos de Saúde</h1>
        <p className="text-muted-foreground">
          Gerencie os planos de saúde cadastrados
        </p>
      </div>

      <Card className="p-6">
        <PlanosList />
      </Card>
    </div>
  )
}
