'use client'

import { useState, useEffect } from 'react'
import { CarteirinhasList } from './components/carteirinhas-list'
import { BackButton } from '@/components/ui/back-button'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { api } from '@/lib/api'

export default function CarteirinhasPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Buscar total de itens
  useEffect(() => {
    async function fetchTotalItems() {
      try {
        const response = await api.get('/carteirinhas/count')
        setTotalItems(response.data.count)
      } catch (error) {
        console.error('Erro ao buscar total de carteirinhas:', error)
      }
    }
    fetchTotalItems()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carteirinhas</h1>
          <p className="text-muted-foreground">
            Controle de carteirinhas emitidas
          </p>
        </div>
        <BackButton />
      </div>

      <CarteirinhasList
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onTotalItemsChange={setTotalItems}
      />
      
      <PaginationControls
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  )
}
