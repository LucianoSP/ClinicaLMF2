'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Guide {
  id: string
  numero_guia: string
  data_emissao: string | null
  data_validade: string | null
  quantidade_autorizada: number
  quantidade_executada: number
  status: string
  tipo: string
}

interface PatientDetailsProps {
  patient: {
    id: string
    nome: string
    carteirinha: string
    plano?: {
      id: string
      nome: string
      codigo: string
    }
    guias: Guide[]
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try {
    // Primeiro verifica se a data já está no formato DD/MM/YYYY
    if (dateStr.includes('/')) {
      return dateStr
    }
    // Se não estiver, assume que está em formato ISO e converte
    const date = new Date(dateStr)
    return format(date, 'dd/MM/yyyy')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}

const formatStatus = (status: string) => {
  // Convert status to lowercase for case-insensitive comparison
  const normalizedStatus = status?.toLowerCase() || '';
  
  const statusMap: { [key: string]: { label: string; className: string } } = {
    'pendente': {
      label: 'Pendente',
      className: 'bg-yellow-100 text-yellow-800'
    },
    'em_andamento': {
      label: 'Em andamento',
      className: 'bg-blue-100 text-blue-800'
    },
    'concluida': {
      label: 'Concluída',
      className: 'bg-green-100 text-green-800'
    },
    'cancelada': {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800'
    }
  }

  const defaultStatus = {
    label: status || '',
    className: 'bg-gray-100 text-gray-800'
  }

  return statusMap[normalizedStatus] || defaultStatus
}

const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100)
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-32 bg-gray-100 rounded-full h-4 dark:bg-gray-200">
        <div 
          className={cn(
            "h-4 rounded-full transition-all",
            percentage >= 100 ? "bg-red-500" : // Vermelho se excedeu
            percentage >= 75 ? "bg-yellow-500" : // Amarelo se acima de 75%
            "bg-green-500" // Verde otherwise
          )} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium whitespace-nowrap">
        {value}/{max}
      </span>
    </div>
  )
}

export default function PatientDetails({ patient }: PatientDetailsProps) {
  console.log('DEBUG - Status das guias:', patient.guias.map(g => ({
    numero_guia: g.numero_guia,
    status: g.status
  })))

  return (
    <div className="space-y-6">
      {/* Card do Plano */}
      {patient.plano && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#8B4513]">
              Plano de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome do Plano</p>
                <p className="text-base font-medium">{patient.plano.nome}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código</p>
                <p className="text-base font-medium">{patient.plano.codigo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card das Guias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#8B4513]">Guias</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.guias.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.guias.map((guia) => {
                  const status = formatStatus(guia.status)
                  return (
                    <TableRow key={guia.id}>
                      <TableCell>{guia.numero_guia}</TableCell>
                      <TableCell>{guia.data_emissao}</TableCell>
                      <TableCell>{guia.data_validade}</TableCell>
                      <TableCell className="w-[200px]">
                        <ProgressBar 
                          value={guia.quantidade_executada} 
                          max={guia.quantidade_autorizada} 
                        />
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          status.className
                        )}>
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma guia encontrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
