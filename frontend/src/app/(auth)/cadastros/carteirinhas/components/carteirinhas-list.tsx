'use client'

import { useEffect, useState } from 'react'
import { CarteirinhaItem } from './carteirinha-item'
import { api } from '@/lib/api'

interface Carteirinha {
  id: string
  paciente: {
    nome: string
  }
  dataEmissao: string
  dataValidade: string
  status: string
}

interface CarteirinhasListProps {
  currentPage: number
  itemsPerPage: number
  onTotalItemsChange: (total: number) => void
}

export function CarteirinhasList({
  currentPage,
  itemsPerPage,
  onTotalItemsChange,
}: CarteirinhasListProps) {
  const [carteirinhas, setCarteirinhas] = useState<Carteirinha[]>([])

  useEffect(() => {
    async function fetchCarteirinhas() {
      try {
        const response = await api.get('/carteirinhas', {
          params: {
            page: currentPage,
            limit: itemsPerPage,
          },
        })
        setCarteirinhas(response.data.items)
        onTotalItemsChange(response.data.total)
      } catch (error) {
        console.error('Erro ao buscar carteirinhas:', error)
      }
    }
    fetchCarteirinhas()
  }, [currentPage, itemsPerPage])

  return (
    <div className="space-y-4">
      {carteirinhas.map((carteirinha) => (
        <CarteirinhaItem key={carteirinha.id} carteirinha={carteirinha} />
      ))}
    </div>
  )
}
