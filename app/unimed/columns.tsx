'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react'

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    pendente: { label: 'Pendente', variant: 'warning' },
    executado: { label: 'Executado', variant: 'success' },
    cancelado: { label: 'Cancelado', variant: 'destructive' }
  }

  const config = statusConfig[status] || statusConfig.pendente

  return (
    <Badge variant={config.variant as any}>
      {config.label}
    </Badge>
  )
}

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'numero_guia',
    header: 'Número da Guia'
  },
  {
    accessorKey: 'carteira',
    header: 'Carteira'
  },
  {
    accessorKey: 'nome_beneficiario',
    header: 'Beneficiário'
  },
  {
    accessorKey: 'data_atendimento',
    header: 'Data Atendimento',
    cell: ({ row }) => formatDate(row.getValue('data_atendimento'))
  },
  {
    accessorKey: 'data_execucao',
    header: 'Data Execução',
    cell: ({ row }) => formatDate(row.getValue('data_execucao'))
  },
  {
    accessorKey: 'nome_profissional',
    header: 'Profissional'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const handleStatusChange = async (newStatus: string) => {
        try {
          const response = await fetch('/api/unimed/guias/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              guia_id: row.original.id,
              status: newStatus,
              data_execucao: newStatus === 'executado' ? format(new Date(), 'yyyy-MM-dd') : null
            })
          })

          if (!response.ok) {
            throw new Error('Erro ao atualizar status')
          }

          // Recarregar dados após atualização
          window.location.reload()
        } catch (error) {
          console.error('Erro:', error)
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange('executado')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como Executado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('cancelado')}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar Guia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]
