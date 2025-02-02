'use client'

import { PacientesList } from '@/components/pacientes/PacientesList'
import { BackButton } from '@/components/ui/back-button'

export default function PacientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestão de pacientes
          </p>
        </div>
        <BackButton />
      </div>

      <PacientesList />
    </div>
  )
}
