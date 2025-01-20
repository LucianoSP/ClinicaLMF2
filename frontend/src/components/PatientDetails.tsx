'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { FiCheck, FiX, FiEdit } from 'react-icons/fi'
import { CreditCard, Activity, AlertTriangle, FileText, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GuideForm } from './GuideForm'
import SortableTable, { Column } from './SortableTable'
import { PencilIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from '@/lib/api'

// Consolidated interfaces at the top
interface PlanoSaude {
  id: string
  nome: string
  codigo: string
}

interface Carteirinha {
  id: string
  paciente_carteirinha: string
  paciente_nome: string
  data_validade: string | null
  plano_saude?: {
    id: string
    nome: string
    codigo: string
  }
}

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
  paciente_carteirinha: string
}

interface FichaPresenca {
  id: string
  data_atendimento: string
  paciente_carteirinha: string
  paciente_nome: string
  numero_guia: string
  codigo_ficha: string
  possui_assinatura: boolean
  arquivo_digitalizado?: string | null
  observacoes?: string | null
}

interface PatientStats {
  total_carteirinhas: number;
  carteirinhas_ativas: number;
  total_guias: number;
  guias_ativas: number;
  sessoes_autorizadas: number;
  sessoes_executadas: number;
  divergencias_pendentes: number;
  taxa_execucao: number;
}

interface PatientDetailsProps {
  patient: {
    id: string
    nome: string
    nome_responsavel: string
    idade?: number
    photo?: string
    plano_nome?: string
    data_nascimento: string
    created_at: string
    telefone: string
    carteirinhas: Carteirinha[]
    guias: Guide[]
    fichas: FichaPresenca[]
  }
  stats: PatientStats;
  onGuideCreated: () => void;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return format(date, 'dd/MM/yyyy')
  } catch (error) {
    return dateStr
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-100 rounded-full h-4">
              <div
                className={cn(
                  "h-4 rounded-full transition-all",
                  percentage >= 100 ? "bg-red-500" :
                    percentage >= 75 ? "bg-yellow-500" :
                      "bg-[#D2691E]/60"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {value}/{max}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{percentage}% concluído</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function PatientDetails({ patient, stats, onGuideCreated }: PatientDetailsProps) {
  const [isGuideFormOpen, setIsGuideFormOpen] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<Guide | undefined>()
  const carteirinha = patient.carteirinhas?.[0]

  // Ordenar guias por data de emissão (mais recentes primeiro)
  const sortedGuias = [...patient.guias].sort((a, b) => {
    return new Date(b.data_emissao || '').getTime() - new Date(a.data_emissao || '').getTime()
  })

  // Calcular totalizadores
  const totais = {
    sessoesAutorizadas: patient.guias.reduce((sum, guia) => sum + guia.quantidade_autorizada, 0),
    sessoesExecutadas: patient.guias.reduce((sum, guia) => sum + guia.quantidade_executada, 0),
    guiasAtivas: patient.guias.filter(guia => guia.status.toLowerCase() === 'em_andamento').length
  }

  // Adicionar verificação de dados
  if (!patient) {
    return <div>Nenhum paciente selecionado</div>
  }

  const handleNewGuide = () => {
    setSelectedGuide(undefined)
    setIsGuideFormOpen(true)
  }

  const handleEditGuide = (guiaId: string) => {
    const guia = patient.guias.find(g => g.id === guiaId)
    if (guia) {
      setSelectedGuide(guia)
      setIsGuideFormOpen(true)
    }
  }

  const handleGuideSuccess = () => {
    onGuideCreated()
    setIsGuideFormOpen(false)
    setSelectedGuide(undefined)
  }

  // Define columns for Guides table
  const guideColumns: Column<Guide>[] = [
    {
      key: 'numero_guia',
      label: 'Número'
    },
    {
      key: 'data_emissao',
      label: 'Data de Emissão',
      render: (value) => formatDate(value as string)
    },
    {
      key: 'data_validade',
      label: 'Data de Validade',
      render: (value) => formatDate(value as string)
    },
    {
      key: 'paciente_carteirinha',
      label: 'Carteirinha'
    },
    {
      key: 'procedimento_nome',
      label: 'Tipo de Procedimento',
      render: (value) => value || '-'
    },
    {
      key: 'sessoes',
      label: 'Sessões',
      render: (_, item: Guide) => (
        <ProgressBar
          value={item.quantidade_executada}
          max={item.quantidade_autorizada}
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const status = formatStatus(value as string)
        return (
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            status.className
          )}>
            {status.label}
          </span>
        )
      }
    },
  ]

  // Define columns for Attendance Records table
  const fichaColumns: Column<FichaPresenca>[] = [
    {
      key: 'codigo_ficha',
      label: 'Código Ficha'
    },
    {
      key: 'data_atendimento',
      label: 'Data',
      render: (value) => formatDate(value as string)
    },
    {
      key: 'numero_guia',
      label: 'Guia'
    },
    {
      key: 'possui_assinatura',
      label: 'Assinado',
      render: (value) => (
        <div className="flex items-center justify-center">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            value
              ? 'bg-[#dcfce7] text-[#15803d]'
              : 'bg-[#fef9c3] text-[#854d0e]'
          )}>
            {value ? (
              <><FiCheck className="w-3 h-3" />Sim</>
            ) : (
              <><FiX className="w-3 h-3" />Não</>
            )}
          </span>
        </div>
      ),
      className: 'text-center'
    },
  ]

  // Define columns for Carteirinhas table
  const carteirinhaColumns: Column<Carteirinha>[] = [
    {
      key: 'paciente_carteirinha',
      label: 'Número da Carteirinha'
    },
    {
      key: 'plano_saude',
      label: 'Plano de Saúde',
      render: (value) => value?.nome || '-'
    },
    {
      key: 'paciente_nome',
      label: 'Nome do Titular'
    },
    {
      key: 'data_validade',
      label: 'Data de Validade',
      render: (value) => formatDate(value as string)
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (_, item: Carteirinha) => {
        const dataValidade = item.data_validade ? new Date(item.data_validade) : null
        const hoje = new Date()
        const ativo = dataValidade ? dataValidade > hoje : true

        return (
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          )}>
            {ativo ? 'Ativo' : 'Inativo'}
          </span>
        )
      }
    }
  ]

  return (
    <>
      <div className="space-y-6">
        {/* Perfil Principal */}
        <div className="relative">
          <div className="absolute inset-x-0 -top-6 h-px bg-gray-200" />
          <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="flex items-start justify-between">
              {/* Lado Esquerdo - Foto e Info */}
              <div className="flex gap-4">
                <div className="w-32 h-40 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src="/imagens/zico.webp"
                    alt={patient.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="patient-name">{patient.nome}</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Convênio:</span>
                      <span className="text-sm">{carteirinha?.plano_saude?.nome || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Nome do Responsável:</span>
                      <span className="text-sm">{patient.nome_responsavel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Data de Nascimento:</span>
                      <span className="text-sm">{formatDate(patient.data_nascimento)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Data de Cadastro:</span>
                      <span className="text-sm">{formatDate(patient.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Telefone do Responsável:</span>
                      <span className="text-sm">{patient.telefone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Carteirinhas */}
  <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Carteirinhas</h3>
          <p className="text-2xl font-bold mt-1 text-blue-700">{stats.carteirinhas_ativas}</p>
          <p className="text-xs text-blue-600/80 mt-0.5">
            De {stats.total_carteirinhas} total
          </p>
        </div>
        <CreditCard className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
      </div>
    </CardContent>
  </Card>

  {/* Guias */}
  <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Guias</h3>
          <p className="text-2xl font-bold mt-1 text-blue-700">{stats.guias_ativas}</p>
          <p className="text-xs text-blue-600/80 mt-0.5">
            De {stats.total_guias} total
          </p>
        </div>
        <FileText className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
      </div>
    </CardContent>
  </Card>

  {/* Sessões */}
  <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Sessões</h3>
          <p className="text-2xl font-bold mt-1 text-blue-700">{stats.sessoes_executadas}</p>
          <p className="text-xs text-blue-600/80 mt-0.5">
            {stats.sessoes_autorizadas} autorizadas ({stats.taxa_execucao}%)
          </p>
        </div>
        <Activity className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
      </div>
    </CardContent>
  </Card>

  {/* Divergências */}
  <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Divergências</h3>
          <p className="text-2xl font-bold mt-1 text-blue-700">{stats.divergencias_pendentes || 0}</p>
          <p className="text-xs text-blue-600/80 mt-0.5">
            {stats.divergencias_pendentes === 1 ? 'Divergência pendente' : 'Divergências pendentes'}
          </p>
        </div>
        <AlertTriangle 
          className={`h-5 w-5 group-hover:scale-110 transition-transform duration-300 ${
            stats.divergencias_pendentes > 0 ? 'text-red-500' : 'text-blue-500'
          }`} 
        />
      </div>
    </CardContent>
  </Card>
</div>

        {/* Plano de Saúde */}
        {carteirinha?.plano_saude && (
          <>
            <h2 className="section-title">Plano de Saúde</h2>
            <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base font-medium">{carteirinha.plano_saude.nome}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Número da Carteirinha</p>
                      <p className="text-base mt-1">{carteirinha.paciente_carteirinha || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nome do Titular</p>
                      <p className="text-base mt-1">{carteirinha.paciente_nome || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Validade</p>
                      <p className="text-base mt-1">{formatDate(carteirinha.data_validade) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-base mt-1">Ativo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Carteirinhas */}
        {patient.carteirinhas && patient.carteirinhas.length > 0 && (
          <div className="mt-8">
            <h3 className="section-title">Carteirinhas</h3>
            <SortableTable
              data={patient.carteirinhas}
              columns={carteirinhaColumns}
            />
          </div>
        )}

        {/* Guias */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Guias</h3>
            <Button
              onClick={handleNewGuide}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nova Guia
            </Button>
          </div>
          <SortableTable
            data={sortedGuias}
            columns={guideColumns}
            actions={(item) => (
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-[#8B4513] hover:text-white transition-colors"
                onClick={() => handleEditGuide(item.id)}
              >
                <FiEdit className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
          />
        </div>

        {/* Fichas de Presença */}
        <div className="mt-8">
          <h3 className="section-title">Fichas de Presença</h3>
          <SortableTable
            data={patient.fichas}
            columns={fichaColumns}
          />
        </div>

        {/* Add GuideForm component */}
        <GuideForm
          isOpen={isGuideFormOpen}
          onClose={() => setIsGuideFormOpen(false)}
          onSuccess={handleGuideSuccess}
          patientId={patient.id}
          carteirinha={patient.carteirinhas?.[0]?.paciente_carteirinha}
        />
      </div>
      <GuideForm
        isOpen={isGuideFormOpen}
        onClose={() => {
          setIsGuideFormOpen(false)
          setSelectedGuide(undefined)
        }}
        onSuccess={onGuideCreated}
        patientId={patient.id}
        carteirinha={patient.carteirinhas?.[0]?.paciente_carteirinha}
        guia={selectedGuide}
      />
    </>
  )
}
