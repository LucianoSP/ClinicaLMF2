'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { FiCheck, FiX, FiEdit } from 'react-icons/fi'
import {
  CreditCard,
  Activity,
  AlertTriangle,
  FileText,
  PlusIcon,
  Timer,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Download,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { GuiaForm } from './guias/GuiaForm'
import { PacienteDashboard } from './pacientes/PacienteDashboard'
import SortableTable from './SortableTable'
import { PencilIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from '@/lib/api'
import { Paciente, Guide, FichaPresenca, Carteirinha } from '@/types/paciente'
import { Guia } from '@/services/guiaService'

// Consolidated interfaces at the top

interface PatientStats {
  total_carteirinhas: number
  carteirinhas_ativas: number
  total_guias: number
  guias_ativas: number
  sessoes_autorizadas: number
  sessoes_executadas: number
  divergencias_pendentes: number
  taxa_execucao: number
  guias_por_status: {
    pendente: number
    em_andamento: number
    concluida: number
    cancelada: number
  }
}

interface PatientDetailsProps {
  patient: Paciente
  stats: PatientStats
  onGuideCreated: () => void
}

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], item: T) => React.ReactNode
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch (error) {
    return dateStr
  }
}

const formatStatus = (status: string) => {
  // Convert status to lowercase for case-insensitive comparison
  const normalizedStatus = status?.toLowerCase() || '';

  const statusMap: { [key: string]: { label: string; color: string } } = {
    'pendente': {
      label: 'Pendente',
      color: 'bg-yellow-100 text-yellow-800'
    },
    'em_andamento': {
      label: 'Em andamento',
      color: 'bg-blue-100 text-blue-800'
    },
    'concluida': {
      label: 'Concluída',
      color: 'bg-green-100 text-green-800'
    },
    'cancelada': {
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800'
    }
  }

  const defaultStatus = {
    label: status || '',
    color: 'bg-gray-100 text-gray-800'
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

export function PatientDetails({ patient, stats, onGuideCreated }: PatientDetailsProps) {
  console.log('PatientDetails - dados recebidos:', { patient, stats });
  const [isGuiaFormOpen, setIsGuiaFormOpen] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<Guia | undefined>()
  const carteirinha = patient.carteirinhas?.[0]

  // Ordenar guias por data de emissão (mais recentes primeiro)
  const sortedGuias = [...(patient.guias || [])].sort((a, b) => {
    const dateA = a.data_emissao ? new Date(a.data_emissao).getTime() : 0
    const dateB = b.data_emissao ? new Date(b.data_emissao).getTime() : 0
    return dateB - dateA
  })

  // Ordenar fichas por data de atendimento (mais recentes primeiro)
  const sortedFichas = [...(patient.fichas || [])].sort((a, b) => {
    const dateA = a.data_atendimento ? new Date(a.data_atendimento).getTime() : 0
    const dateB = b.data_atendimento ? new Date(b.data_atendimento).getTime() : 0
    return dateB - dateA
  })

  // Calcular totalizadores
  const totais = {
    sessoesAutorizadas: (patient.guias || []).reduce((sum, guia) => sum + guia.quantidade_autorizada, 0),
    sessoesExecutadas: (patient.guias || []).reduce((sum, guia) => sum + guia.quantidade_executada, 0),
    guiasAtivas: (patient.guias || []).filter(guia => guia.status.toLowerCase() === 'em_andamento').length
  }

  // Adicionar verificação de dados
  if (!patient) {
    return <div>Nenhum paciente selecionado</div>
  }

  console.log('PatientDetails - carteirinhas:', patient.carteirinhas);

  const handleNewGuide = () => {
    setSelectedGuide(undefined)
    setIsGuiaFormOpen(true)
  }

  const handleEditGuia = (guia: Guide) => {
    setSelectedGuide(guia as unknown as Guia)
    setIsGuiaFormOpen(true)
  }

  const handleCloseGuiaForm = () => {
    setIsGuiaFormOpen(false)
    setSelectedGuide(undefined)
  }

  const handleGuiaCreated = () => {
    onGuideCreated()
    handleCloseGuiaForm()
  }

  // Define columns for Guides table
  const guideColumns: Column<Guide>[] = [
    {
      key: 'numero_guia',
      label: 'Número'
    },
    {
      key: 'data_emissao',
      label: 'Data Emissão',
      render: (value) => <span>{formatDate(value as string)}</span>
    },
    {
      key: 'data_validade',
      label: 'Data Validade',
      render: (value) => <span>{formatDate(value as string)}</span>
    },
    {
      key: 'quantidade_executada',
      label: 'Sessões',
      render: (_, item) => (
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
            'px-2 py-1 rounded-full text-xs font-medium',
            status.color
          )}>
            {status.label}
          </span>
        )
      }
    }
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
      render: (value) => <span>{formatDate(value as string)}</span>
    },
    {
      key: 'possui_assinatura',
      label: 'Status',
      render: (value) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          value
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        )}>
          {value ? 'Assinada' : 'Pendente'}
        </span>
      )
    }
  ]

  // Define columns for Carteirinhas table
  // Dentro do PatientDetails.tsx, substitua o carteirinhaColumns por:
  const carteirinhaColumns: Column<Carteirinha>[] = [
    {
      key: 'numero',
      label: 'Número da Carteirinha',
      render: (value) => <span>{value as string}</span>
    },
    {
      key: 'plano_saude',
      label: 'Plano de Saúde',
      render: (value) => {
        const plano = value as { nome: string } | undefined;
        return <span>{plano?.nome || '-'}</span>;
      }
    },
    {
      key: 'data_emissao',
      label: 'Data de Emissão',
      render: (value) => <span>{formatDate(value as string)}</span>
    },
    {
      key: 'data_validade',
      label: 'Data de Validade',
      render: (value) => <span>{formatDate(value as string)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const status = value as string;
        const isActive = status?.toLowerCase() === 'ativo';

        return (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}>
            {isActive ? 'Ativa' : 'Inativa'}
          </span>
        );
      }
    }
  ];

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
        <PacienteDashboard estatisticas={stats} />

        {/* Carteirinhas */}
        {Array.isArray(patient.carteirinhas) && patient.carteirinhas.length > 0 && (
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
                onClick={() => handleEditGuia(item)}
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
            data={sortedFichas}
            columns={fichaColumns}
          />
        </div>

        {/* Add GuiaForm component */}
        <GuiaForm
          isOpen={isGuiaFormOpen}
          onClose={handleCloseGuiaForm}
          onSuccess={handleGuiaCreated}
          pacienteId={patient.id}
          carteirinha={patient.carteirinhas?.[0]?.paciente_carteirinha}
          guia={selectedGuide}
        />
      </div>
    </>
  )
}