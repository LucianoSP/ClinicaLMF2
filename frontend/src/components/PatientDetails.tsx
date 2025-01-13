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
import { FiCheck, FiX } from 'react-icons/fi'

interface Guide {
  id: string
  numero_guia: string
  data_emissao: string | null
  data_validade: string | null
  quantidade_autorizada: number
  quantidade_executada: number
  status: string
  tipo: string
  procedimento_nome?: string
}

interface FichaPresenca {
  id: string
  data_atendimento: string
  paciente_carteirinha: string
  paciente_nome: string
  numero_guia: string
  codigo_ficha: string
  possui_assinatura: boolean
  arquivo_digitalizado?: string
}

interface Carteirinha {
  numero_carteirinha: string
  nome_titular: string
  data_validade: string | null
  plano_saude?: {
    id: string
    nome: string
    codigo: string
  }
}

interface PatientDetailsProps {
  patient: {
    id: string
    nome: string
    carteirinhas: Carteirinha[]
    guias: Guide[]
    fichas: Array<{
      id: string
      data_atendimento: string
      paciente_carteirinha: string
      paciente_nome: string
      numero_guia: string
      codigo_ficha: string
      possui_assinatura: boolean
      arquivo_digitalizado?: string | null
      observacoes?: string | null
    }>
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
  // Calcula a porcentagem, limitando a 100% mesmo se value > max
  const percentage = Math.min(Math.round((value / max) * 100), 100)
  
  return (
    <div className="flex items-center gap-2">
      {/* Container da barra */}
      <div className="w-32 bg-gray-100 rounded-full h-4 dark:bg-gray-200">
        {/* Barra de progresso */}
        <div 
          className={cn(
            "h-4 rounded-full transition-all",
            percentage >= 100 ? "bg-red-500" : // Vermelho se excedeu
            percentage >= 75 ? "bg-yellow-500" : // Amarelo se acima de 75%
            "bg-black" // Preto (padrão)
          )} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Contador numérico */}
      <span className="text-sm font-medium whitespace-nowrap">
        {value}/{max}
      </span>
    </div>
  )
}

export default function PatientDetails({ patient }: PatientDetailsProps) {
  console.log('PatientDetails rendering with:', {
    fichas: patient.fichas,
    guias: patient.guias
  });

  const carteirinha = patient.carteirinhas?.[0] // Pega a primeira carteirinha

  return (
    <div className="space-y-6">
      {/* Card do Plano */}
      {carteirinha?.plano_saude && (
        <Card className="border-[#e5e7eb] border-[0.5px]">
          <CardHeader>
            <CardTitle className="text-lg text-[#8B4513]">
              Plano de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground">Nome do Plano</p>
                  <p className="text-base font-medium">{carteirinha.plano_saude.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carteirinha</p>
                  <p className="text-base font-medium">{carteirinha.numero_carteirinha}</p>
                </div>
              </div>
              <div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Código</p>
                  <p className="text-base font-medium">{carteirinha.plano_saude.codigo}</p>
                </div>
                {carteirinha.data_validade && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-muted-foreground">Validade</p>
                    <p className="text-base font-medium">{formatDate(carteirinha.data_validade)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card das Guias */}
      <Card className="border-[#e5e7eb] border-[0.5px]">
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
                  <TableHead>Carteirinha</TableHead>
                  <TableHead>Tipo de Procedimento</TableHead>
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
                      <TableCell>{guia.paciente_carteirinha}</TableCell>
                      <TableCell>{guia.procedimento_nome || '-'}</TableCell>
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

      {/* Card das Fichas de Presença */}
      <Card className="border-[#e5e7eb] border-[0.5px]">
        <CardHeader>
          <CardTitle className="text-lg text-[#8B4513]">Fichas de Presença</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(patient.fichas) && patient.fichas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Ficha</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Guia</TableHead>
                  <TableHead>Assinado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.fichas.map((ficha) => (
                  <TableRow key={ficha.id}>
                    <TableCell>{ficha.codigo_ficha}</TableCell>
                    <TableCell>{ficha.data_atendimento}</TableCell>
                    <TableCell>{ficha.numero_guia}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          ficha.possui_assinatura 
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : 'bg-[#fef9c3] text-[#854d0e]'
                        )}>
                          {ficha.possui_assinatura ? (
                            <><FiCheck className="w-3 h-3" />Sim</>
                          ) : (
                            <><FiX className="w-3 h-3" />Não</>
                          )}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma ficha de presença encontrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
