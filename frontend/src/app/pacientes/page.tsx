'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PatientForm } from './components/patient-form'
import PatientDetails from '@/components/PatientDetails'
import { formatarData } from '@/lib/utils'
import { API_URL } from '@/config/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  Activity,
  CheckCircle2
} from 'lucide-react'

interface Patient {
  id: string
  nome: string
  carteirinha?: string // Manter compatibilidade com formato antigo
  carteirinhas?: Array<{
    numero_carteirinha: string
    nome_titular: string
    data_validade: string | null
    plano_saude?: {
      id: string
      nome: string
      codigo: string
    }
  }>
  fichas?: any[]
}

interface Guide {
  id: string
  numero_guia: string
  data_emissao: string
  data_validade: string
  tipo: string
  status: string
  paciente_carteirinha: string
  paciente_nome: string
  quantidade_autorizada: number
  quantidade_executada: number
  procedimento_codigo?: string
  procedimento_nome?: string
  profissional_solicitante?: string
  profissional_executante?: string
  observacoes?: string
  created_at: string
  updated_at: string
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
  guias_por_status: {
    pendente: number;
    em_andamento: number;
    concluida: number;
    cancelada: number;
  };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>()
  const [patientGuides, setPatientGuides] = useState<Guide[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [patientStats, setPatientStats] = useState<PatientStats>({
    total_carteirinhas: 0,
    carteirinhas_ativas: 0,
    total_guias: 0,
    guias_ativas: 0,
    sessoes_autorizadas: 0,
    sessoes_executadas: 0,
    divergencias_pendentes: 0,
    taxa_execucao: 0,
    guias_por_status: {
      pendente: 0,
      em_andamento: 0,
      concluida: 0,
      cancelada: 0
    }
  })

  // Carregar pacientes
  const loadPatients = useCallback(async (term: string) => {
    if (!term.trim()) {
      setPatients([])
      return
    }

    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('paciente_nome', term.trim())

      const response = await fetch(`${API_URL}/pacientes?${params.toString()}`)
      if (!response.ok) throw new Error('Falha ao carregar pacientes')
      const data = await response.json()
      setPatients(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar guias do paciente
  const loadPatientGuides = useCallback(async (patientId: string) => {
    try {
      const response = await fetch(`${API_URL}/pacientes/${patientId}/guias`)
      if (!response.ok) throw new Error('Falha ao carregar guias')
      
      const data = await response.json()
      console.log('Dados recebidos:', data)
      
      // Atualiza as guias
      setPatientGuides(data.items || [])
      
      // Depois atualiza o paciente com o plano e fichas
      setSelectedPatient(prev => prev ? {
        ...prev,
        carteirinhas: data.carteirinhas || [{
          numero_carteirinha: prev.carteirinha || '',
          nome_titular: prev.nome,
          data_validade: null,
          plano_saude: data.plano
        }],
        fichas: data.fichas || []
      } : prev)
    } catch (error) {
      console.error('Erro ao carregar guias:', error)
      setPatientGuides([])
    }
  }, [])

  // Função para carregar estatísticas do paciente
  const loadPatientStats = useCallback(async (patientId: string) => {
    try {
      console.log('Carregando estatísticas para paciente:', patientId)
      const response = await fetch(`${API_URL}/pacientes/${patientId}/estatisticas`)
      if (!response.ok) throw new Error('Falha ao carregar estatísticas')
      const data = await response.json()
      console.log('Estatísticas recebidas:', data)
      setPatientStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }, [])

  // Efeito para atualizar a busca quando o termo muda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPatients(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, loadPatients])

  // Efeito para carregar guias quando um paciente é selecionado
  useEffect(() => {
    if (selectedPatient) {
      console.log('Carregando guias para paciente:', selectedPatient.id)
      loadPatientGuides(selectedPatient.id).then(response => {
        console.log('Resposta do backend - guias:', response) // Verifique os valores aqui
      })
      loadPatientStats(selectedPatient.id)
    }
  }, [selectedPatient?.id])

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsFormOpen(true)
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setPatientGuides([]) // Limpa as guias antes de carregar novas
    setOpen(false)
    setSearchTerm('')
    setPatients([])
  }

  const refreshPatientData = useCallback(() => {
    if (selectedPatient) {
      loadPatientGuides(selectedPatient.id);
      loadPatientStats(selectedPatient.id);
    }
  }, [selectedPatient, loadPatientGuides, loadPatientStats]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col gap-6">
          {/* Header com título */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#8B4513]">
              Gerenciamento de Pacientes
            </h2>
          </div>

          {/* Barra de busca e botão novo paciente */}
          <div className="flex items-center justify-between gap-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[400px] justify-between hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {selectedPatient
                    ? selectedPatient.nome
                    : "Buscar paciente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Digite o nome ou carteirinha..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B4513]"></div>
                    </div>
                  ) : patients.length === 0 ? (
                    <CommandEmpty className="py-6 text-center text-sm">
                      {searchTerm ? "Nenhum paciente encontrado." : "Digite para buscar pacientes"}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {patients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full flex items-start gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm relative select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 outline-none"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 mt-1",
                              selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{patient.nome}</span>
                            
                          </div>
                        </button>
                      ))}
                    </CommandGroup>
                  )}
                </Command>
              </PopoverContent>
            </Popover>

            <Button 
              variant="outline"
              onClick={() => setIsFormOpen(true)}
              className="gap-2 hover:bg-[#8B4513] hover:text-white transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Novo Paciente
            </Button>
          </div>

          {/* Patient section */}
          {selectedPatient && (
            <div className="mt-6">
              <PatientDetails 
                patient={{
                  ...selectedPatient,
                  guias: patientGuides,
                  fichas: selectedPatient.fichas || []
                }} 
                stats={patientStats}
                onGuideCreated={refreshPatientData}
              />
            </div>
          )}

          <PatientForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false)
              setSelectedPatient(undefined)
            }}
            patient={selectedPatient}
          />
        </div>
      </div>
    </div>
  )
}

