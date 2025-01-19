'use client'

import { useState } from 'react'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/calendar'
import { Legend } from '@/components/legend'
import { LegendFilter } from '@/components/legend-filter'

export default function SchedulePage() {
  const today = new Date()
  const [filter, setFilter] = useState('all')

  const handleFilterChange = (value: string) => {
    setFilter(value)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button variant="outline" size="sm">
            Ir para Data
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">
              {format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h1>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <LegendFilter onFilterChange={handleFilterChange} />

          <Button variant="outline" size="sm" className="ml-auto">
            Hoje
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Legend />
        <Calendar filter={filter} />
      </div>
    </div>
  )
}

