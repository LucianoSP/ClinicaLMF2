'use client'

import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { getPacientes } from '../services/pacientes'

interface PacienteTableProps {
  onEdit: (paciente: Paciente) => void
}

export function PacienteTable({ onEdit }: PacienteTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: getPacientes
  })

  return (
    <DataTable 
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      onEdit={onEdit}
    />
  )
}
