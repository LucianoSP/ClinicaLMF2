'use client'

import { Button } from "@/components/ui/button"
import { EditIcon, Trash2Icon } from "lucide-react"

interface PacienteItemProps {
  paciente: {
    id: string
    nome: string
    cpf: string
    dataNascimento: string
    telefone: string
  }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function PacienteItem({ paciente, onEdit, onDelete }: PacienteItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">{paciente.nome}</h3>
        <div className="text-sm text-muted-foreground">
          CPF: {paciente.cpf} | 
          Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString()} |
          Tel: {paciente.telefone}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(paciente.id)}
        >
          <EditIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(paciente.id)}
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
