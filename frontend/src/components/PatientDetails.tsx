'use client'

import { useState } from 'react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CreditCard, Activity, AlertTriangle, FileText, PlusIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GuideForm } from './GuideForm'

// Consolidated interfaces at the top
interface PlanoSaude {
  id: string
  nome: string
  codigo: string
}

interface Carteirinha {
  numero_carteirinha: string
  nome_titular: string
  data_validade: string | null
  plano_saude?: PlanoSaude
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
}  // <-- Added missing closing brace

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
    idade?: number
    photo?: string
    plano_nome?: string
    carteirinhas: Carteirinha[]
    guias: Guide[]
    fichas: FichaPresenca[]
  }
  stats: PatientStats;
  onGuideCreated: () => void; // Add this new prop
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
      className: 'bg-blue-100 text-blue-800'  // Added missing colon
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
                  "bg-black"
                )} 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              {value}/{max}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Progresso: {percentage}%</p>
          <p>{max - value} sessões restantes</p>
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

  return (
    <>
      <div className="space-y-6">
        {/* Perfil Principal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            {/* Lado Esquerdo - Foto e Info */}
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100"> {/* Increased size from w-20 h-20 */}
                <img 
                  src="/imagens/zico.webp"
                  alt={patient.nome} 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">{patient.nome}</h2>
                <div className="space-y-1">
                  {patient.idade && (
                    <p className="text-gray-600 text-sm">Idade: {patient.idade}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Convênio:</span>
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {carteirinha?.plano_saude?.nome || "Não informado"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Moved here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-700">Carteirinhas</h3>
                <p className="text-3xl font-bold text-[#8f732b] mt-2">{stats.carteirinhas_ativas}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  De {stats.total_carteirinhas} total
                </p>
              </div>
              <CreditCard className="text-[#8f732b] h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-700">Guias</h3>
                <p className="text-3xl font-bold text-[#8f732b] mt-2">{stats.guias_ativas}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  De {stats.total_guias} total
                </p>
              </div>
              <FileText className="text-[#8f732b] h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-700">Sessões</h3>
                <p className="text-3xl font-bold text-[#8f732b] mt-2">{stats.sessoes_executadas}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.sessoes_autorizadas} autorizadas ({stats.taxa_execucao}%)
                </p>
              </div>
              <Activity className="text-[#8f732b] h-6 w-6" />
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow p-6 ${stats.divergencias_pendentes > 0 ? 'bg-yellow-50 border-yellow-200' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-700">Divergências</h3>
                <p className="text-3xl font-bold text-[#8f732b] mt-2">{stats.divergencias_pendentes}</p>
                <p className="text-sm text-amber-600 mt-1">
                  {stats.divergencias_pendentes === 1 ? 'Divergência pendente' : 'Divergências pendentes'}
                </p>
              </div>
              <AlertTriangle className={`text-[#8f732b] h-6 w-6 ${stats.divergencias_pendentes > 0 ? 'text-amber-600' : ''}`} />
            </div>
          </div>
        </div>

        {/* Card do Plano e Carteirinha */}
        {carteirinha?.plano_saude && (
          <Card className="border-[#e5e7eb] border-[0.5px]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-[#8B4513]">Plano de Saúde</CardTitle>
                {carteirinha.data_validade && (
                  <span className="text-sm text-muted-foreground">
                    Válido até {formatDate(carteirinha.data_validade)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plano</p>
                    <p className="text-base font-medium">{carteirinha.plano_saude.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Carteirinha</p>
                    <p className="text-base font-medium">{carteirinha?.numero_carteirinha || patient?.carteirinha || '-'}</p>
                  </div>
                </div>
                <div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Titular</p>
                      <p className="text-base font-medium">{carteirinha.nome_titular}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código do Plano</p>
                      <p className="text-base font-medium">{carteirinha.plano_saude.codigo}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card das Guias com Totalizadores */}
        <Card className="border-[#e5e7eb] border-[0.5px]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center justify-between flex-1">
                <div className="flex items-center gap-6">
                  <CardTitle className="text-lg text-[#8B4513]">Guias</CardTitle>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Guias Ativas: {totais.guiasAtivas}
                    </span>
                    <span className="text-muted-foreground">
                      Sessões: {totais.sessoesExecutadas}/{totais.sessoesAutorizadas}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 hover:bg-[#8B4513] hover:text-white transition-colors"
                  onClick={handleNewGuide}
                >
                  <PlusIcon className="h-4 w-4" />
                  Nova Guia
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sortedGuias.length > 0 ? (
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
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGuias.map((guia) => {
                    const status = formatStatus(guia.status)
                    return (
                      <TableRow key={guia.id}>
                        <TableCell className="font-medium">{guia.numero_guia}</TableCell>
                        <TableCell>{formatDate(guia.data_emissao)}</TableCell>
                        <TableCell>{formatDate(guia.data_validade)}</TableCell>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#8B4513] hover:text-white transition-colors"
                            onClick={() => handleEditGuide(guia.id)}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
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

        {/* Add GuideForm component */}
        <GuideForm 
          isOpen={isGuideFormOpen}
          onClose={() => setIsGuideFormOpen(false)}
          onSuccess={handleGuideSuccess}
          patientId={patient.id}
          carteirinha={patient.carteirinhas?.[0]?.numero_carteirinha}
        />

        {/* Card das Fichas com Header Melhorado */}
        <Card className="border-[#e5e7eb] border-[0.5px]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-[#8B4513]">Fichas de Presença</CardTitle>
              <span className="text-sm text-muted-foreground">
                Total: {patient.fichas.length}
              </span>
            </div>
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
                      <TableCell>{formatDate(ficha.data_atendimento)}</TableCell>
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
      <GuideForm 
        isOpen={isGuideFormOpen}
        onClose={() => {
          setIsGuideFormOpen(false)
          setSelectedGuide(undefined)
        }}
        onSuccess={onGuideCreated}
        patientId={patient.id}
        carteirinha={patient.carteirinhas?.[0]?.numero_carteirinha}
        guia={selectedGuide}  // Pass the selected guide for editing
      />
    </>
  )
}
