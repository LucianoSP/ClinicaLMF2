'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function UnimedPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    numero_guia: '',
    carteira: '',
    data_inicio: null,
    data_fim: null,
    status: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const formattedFilters = {
        ...filters,
        data_inicio: filters.data_inicio ? format(filters.data_inicio, 'yyyy-MM-dd') : undefined,
        data_fim: filters.data_fim ? format(filters.data_fim, 'yyyy-MM-dd') : undefined
      }

      const response = await fetch('/api/unimed/guias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limit: 100,
          offset: 0,
          filters: formattedFilters
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar dados')
      }

      const result = await response.json()
      setData(result.guides)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFilter = () => {
    fetchData()
  }

  const clearFilters = () => {
    setFilters({
      numero_guia: '',
      carteira: '',
      data_inicio: null,
      data_fim: null,
      status: ''
    })
    fetchData()
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Número da Guia"
              value={filters.numero_guia}
              onChange={(e) => setFilters({ ...filters, numero_guia: e.target.value })}
            />
            <Input
              placeholder="Carteira"
              value={filters.carteira}
              onChange={(e) => setFilters({ ...filters, carteira: e.target.value })}
            />
            <DatePicker
              placeholder="Data Início"
              selected={filters.data_inicio}
              onSelect={(date) => setFilters({ ...filters, data_inicio: date })}
              locale={ptBR}
            />
            <DatePicker
              placeholder="Data Fim"
              selected={filters.data_fim}
              onSelect={(date) => setFilters({ ...filters, data_fim: date })}
              locale={ptBR}
            />
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="executado">Executado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={handleFilter}>
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guias Unimed</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
