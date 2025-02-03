'use client'

import { useEffect, useState } from 'react'
import { PacienteItem } from './paciente-item'
import { api } from '@/lib/api'

interface PacientesListProps {
  currentPage: number
  itemsPerPage: number
  onTotalItemsChange: (total: number) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function PacientesList({
  currentPage,
  itemsPerPage,
  onTotalItemsChange,
  onEdit,
  onDelete
}: PacientesListProps) {
  const [pacientes, setPacientes] = useState([])

  useEffect(() => {
    async function fetchPacientes() {
      try {
        const response = await api.get('/pacientes', {
          params: {
            page: currentPage,
            limit: itemsPerPage,
          },
        })
        setPacientes(response.data.items)
        onTotalItemsChange(response.data.total)
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error)
      }
    }
    fetchPacientes()
  }, [currentPage, itemsPerPage])

  return (
    <div className="space-y-4">
      {pacientes.map((paciente) => (
        <PacienteItem 
          key={paciente.id} 
          paciente={paciente}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
