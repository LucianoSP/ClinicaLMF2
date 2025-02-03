'use client'

import { Column } from '@/components/SortableTable'
import { Carteirinha } from '@/types/Carteirinha'
import { formatarData } from '@/lib/utils'
import { TableActions } from '@/components/ui/table-actions'
import { Badge } from '@/components/ui/badge'

declare global {
  interface Window {
    tableRef: any;
  }
}

export const columns: Column<Carteirinha>[] = [
  {
    key: 'numero_carteirinha',
    label: 'Número',
    style: { paddingLeft: '1rem' },
    render: (_, carteirinha) => carteirinha.numero_carteirinha
  },
  {
    key: 'data_validade',
    label: 'Validade',
    style: { paddingLeft: '1rem' },
    render: (_, carteirinha) => carteirinha.data_validade ? formatarData(carteirinha.data_validade) : '-'
  },
  {
    key: 'status',
    label: 'Status',
    style: { paddingLeft: '1rem' },
    render: (_, carteirinha) => (
      <Badge variant={carteirinha.status === 'ativa' ? 'success' : 'destructive'}>
        {carteirinha.status === 'ativa' ? 'Ativa' : 'Inativa'}
      </Badge>
    )
  },
  {
    key: 'actions',
    label: 'Ações',
    style: { paddingRight: '1rem' },
    className: 'text-right',
    render: (_, carteirinha) => (
      <TableActions
        onEdit={() => window.tableRef?.onEdit?.(carteirinha)}
        onDelete={() => window.tableRef?.onDelete?.(carteirinha)}
      />
    )
  }
]
