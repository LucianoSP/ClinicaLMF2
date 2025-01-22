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
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PatientForm } from './components/patient-form'
import { PatientDetails } from '@/components/PatientDetails'
import { formatarData } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  CreditCard,
  FileText,
  AlertTriangle,
  Activity,
  CheckCircle2
} from 'lucide-react'
import { listarPacientes, buscarGuiasPaciente, buscarEstatisticasPaciente } from '@/services/pacienteService'
import { Paciente, Guide, FichaPresenca } from '@/types/paciente'

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
  const [patients, setPatients] = useState<Paciente[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Paciente | undefined>()
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

  const loadPatientGuides = useCallback(async (patientId: string) => {
    try {
      const data = await buscarGuiasPaciente(patientId)
      console.log('Dados recebidos das guias:', data)

      // Atualiza o paciente incluindo todos os dados
      setSelectedPatient(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          guias: data.items || [],
          // Usar as carteirinhas da resposta ou manter as existentes
          carteirinhas: data.carteirinhas || prev.carteirinhas || [],
          fichas: data.fichas || []
        };
      });

      // Atualiza as guias separadamente
      setPatientGuides(data.items || []);
    } catch (error) {
      console.error('Erro ao carregar guias:', error)
      setPatientGuides([])
    }
  }, [])

  const loadPatientStats = useCallback(async (patientId: string) => {
    try {
      const stats = await buscarEstatisticasPaciente(patientId)
      setPatientStats(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }, [])

  const handlePatientSelect = useCallback(async (patient: Paciente) => {
    console.log('Paciente selecionado:', {
      id: patient.id,
      carteirinhas: patient.carteirinhas
    });

    // Primeiro seta o paciente com todos os dados
    setSelectedPatient(patient);

    // Depois carrega as guias e estatísticas
    if (patient?.id) {
      await loadPatientGuides(patient.id);
      await loadPatientStats(patient.id);
    }
  }, [loadPatientGuides, loadPatientStats]);

  const carregarPacientes = async (term = '') => {
    try {
      setIsLoading(true)
      const response = await listarPacientes(1, term.trim())
      console.log('Dados dos pacientes:', response.items);
      const patientsData: Paciente[] = (response.items || []).map((paciente: Paciente) => {
        // Preserve existing data if patient already exists
        const existingPatient = patients.find(p => p.id === paciente.id);
        console.log(`Processando paciente ${paciente.nome}:`, {
          existingData: existingPatient?.carteirinhas,
          newData: paciente.carteirinhas
        });
        return {
          ...paciente,
          nome_responsavel: paciente.nome_responsavel || '',
          data_nascimento: paciente.data_nascimento || new Date().toISOString(),
          created_at: paciente.created_at || new Date().toISOString(),
          telefone: paciente.telefone || '',
          carteirinhas: existingPatient?.carteirinhas || paciente.carteirinhas || [],
          guias: existingPatient?.guias || paciente.guias || [],
          fichas: existingPatient?.fichas || paciente.fichas || []
        }
      })
      setPatients(patientsData)

      // Se houver um paciente selecionado, atualize seus dados
      if (selectedPatient) {
        const updatedSelectedPatient = patientsData.find(p => p.id === selectedPatient.id);
        if (updatedSelectedPatient) {
          console.log('Atualizando paciente selecionado:', updatedSelectedPatient);
          setSelectedPatient(updatedSelectedPatient);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      carregarPacientes(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    if (selectedPatient) {
      console.log('Carregando guias para paciente:', selectedPatient.id)
      loadPatientGuides(selectedPatient.id);
      loadPatientStats(selectedPatient.id);
    }
  }, [selectedPatient?.id, loadPatientGuides, loadPatientStats])

  const handleEditPatient = (patient: Paciente) => {
    setSelectedPatient(patient)
    setIsFormOpen(true)
  }

  const refreshPatientData = useCallback(() => {
    if (selectedPatient) {
      loadPatientGuides(selectedPatient.id);
      loadPatientStats(selectedPatient.id);
    }
  }, [selectedPatient, loadPatientGuides, loadPatientStats]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-col gap-6">
          {/* Header com título */}
          <div>
            <h1 className="page-title">
              Gerenciamento de Pacientes
            </h1>
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
                  <CommandList>
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
                            onClick={() => handlePatientSelect(patient)}
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
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Patient section */}
          {selectedPatient && (
            <div className="mt-6">
              <PatientDetails
                patient={{
                  id: selectedPatient.id,
                  nome: selectedPatient.nome,
                  nome_responsavel: selectedPatient.nome_responsavel || '',
                  data_nascimento: selectedPatient.data_nascimento || new Date().toISOString(),
                  created_at: selectedPatient.created_at || new Date().toISOString(),
                  telefone: selectedPatient.telefone || '',
                  carteirinhas: selectedPatient.carteirinhas || [],
                  guias: patientGuides,
                  fichas: selectedPatient.fichas || [],
                  ...selectedPatient
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
