'use client'

import { Card } from '@/components/ui/card'
import { PacientesList } from '@/components/pacientes/PacientesList'

export default function PacientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
        <p className="text-muted-foreground">
          Cadastro e gestão de pacientes
        </p>
      </div>

      <Card className="p-6">
        <PacientesList />
      </Card>
    </div>
  )
}
