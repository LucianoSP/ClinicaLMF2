'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PacienteForm } from './components/PacienteForm'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './components/columns'
import { Paciente } from '@/types/paciente'
import { getPacientes } from './services/pacientes'
import { Card } from '@/components/ui/card'

export default function PacientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: getPacientes
  })

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setSelectedPaciente(null)
    setIsFormOpen(false)
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          Novo Paciente
        </Button>
      </div>

      <Card>
        <DataTable 
          columns={columns}
          data={data || []}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </Card>

      {isFormOpen && (
        <PacienteForm 
          paciente={selectedPaciente || undefined}
          isOpen={isFormOpen}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
