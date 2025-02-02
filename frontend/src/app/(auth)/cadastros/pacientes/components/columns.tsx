'use client'

import { Column } from '@/components/SortableTable'
import { Paciente } from '@/types/paciente'
import { formatarData } from '@/lib/utils'
import { TableActions } from '@/components/ui/table-actions'

export const columns: Column<Paciente>[] = [
  {
    key: 'nome',
    label: 'Nome',
    style: { paddingLeft: '1rem' },
    render: (_, paciente) => paciente.nome
  },
  {
    key: 'nome_responsavel',
    label: 'Responsável',
    style: { paddingLeft: '1rem' },
    render: (_, paciente) => paciente.nome_responsavel || '-'
  },
  {
    key: 'data_nascimento',
    label: 'Data Nascimento',
    style: { paddingLeft: '1rem' },
    render: (_, paciente) => paciente.data_nascimento ? formatarData(paciente.data_nascimento) : '-'
  },
  {
    key: 'telefone',
    label: 'Telefone',
    style: { paddingLeft: '1rem' },
    render: (_, paciente) => paciente.telefone || '-'
  },
  {
    key: 'email',
    label: 'Email',
    style: { paddingLeft: '1rem' },
    render: (_, paciente) => paciente.email || '-'
  },
  {
    key: 'actions',
    label: 'Ações',
    style: { paddingRight: '1rem' },
    className: 'text-right',
    render: (_, paciente) => (
      <TableActions
        onEdit={() => table.options.meta?.onEdit?.(paciente)}
        onDelete={() => table.options.meta?.onDelete?.(paciente)}
      />
    )
  }
]