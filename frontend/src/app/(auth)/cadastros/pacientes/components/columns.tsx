'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Paciente } from '@/types/paciente'
import { formatarData } from '@/lib/utils'

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
      return formatarData(date as string)
    },
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone',
    cell: ({ row }) => {
      const telefone = row.getValue('telefone')
      return telefone || '-'
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email')
      return email || '-'
    },
  },
  {
    accessorKey: 'cpf',
    header: 'CPF',
    cell: ({ row }) => {
      const cpf = row.getValue('cpf')
      return cpf || '-'
    },
  },
  {
    accessorKey: 'altura',
    header: 'Altura',
    cell: ({ row }) => {
      const altura = row.getValue('altura')
      return altura || '-'
    },
  },
  {
    accessorKey: 'peso',
    header: 'Peso',
    cell: ({ row }) => {
      const peso = row.getValue('peso')
      return peso || '-'
    },
  },
  {
    accessorKey: 'tipo_sanguineo',
    header: 'Tipo Sanguíneo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo_sanguineo')
      return tipo || '-'
    },
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