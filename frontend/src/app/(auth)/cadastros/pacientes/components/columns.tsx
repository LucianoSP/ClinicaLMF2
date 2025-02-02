'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Paciente } from '@/types/paciente'
import { formatDate } from '@/lib/utils'

export const columns: ColumnDef<Paciente>[] = [
  {
    accessorKey: 'nome',
    header: 'Nome',
  },
  {
    accessorKey: 'nome_responsavel',
    header: 'Responsável',
  },
  {
    accessorKey: 'data_nascimento',
    header: 'Data Nascimento',
    cell: ({ row }) => {
      const date = row.getValue('data_nascimento')
      if (!date) return '-'
      return formatDate(date as string)
    },
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'cpf',
    header: 'CPF',
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const paciente = row.original
      
      return (
        <div className="flex gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => table.options.meta?.onEdit?.(paciente)}
          >
            Editar
          </Button>
        </div>
      )
    },
  },
]