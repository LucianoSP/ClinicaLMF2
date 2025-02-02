'use client'

import { CarteirinhasList } from '@/components/carteirinhas/CarteirinhasList'
import { BackButton } from '@/components/ui/back-button'

export default function CarteirinhasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carteirinhas</h1>
          <p className="text-muted-foreground">
            Controle de carteirinhas emitidas
          </p>
        </div>
        <BackButton />
      </div>

      <CarteirinhasList />
    </div>
  )
}
