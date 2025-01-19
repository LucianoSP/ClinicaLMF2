'use client'

import { Card } from '@/components/ui/card'
import { CarteirinhasList } from '@/components/carteirinhas/CarteirinhasList'

export default function CarteirinhasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carteirinhas</h1>
        <p className="text-muted-foreground">
          Controle de carteirinhas emitidas
        </p>
      </div>

      <Card className="p-6">
        <CarteirinhasList />
      </Card>
    </div>
  )
}
