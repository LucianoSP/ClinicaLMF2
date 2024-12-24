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

interface Patient {
  id: string
  nome: string
  carteirinha: string
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

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>()
  const [patientGuides, setPatientGuides] = useState<Guide[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

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
      console.log('Carregando guias para o paciente:', patientId)
      const response = await fetch(`${API_URL}/pacientes/${patientId}/guias`)
      if (!response.ok) throw new Error('Falha ao carregar guias')
      const data = await response.json()
      console.log('Guias recebidas:', data)
      setPatientGuides(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar guias:', error)
      setPatientGuides([])
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
      loadPatientGuides(selectedPatient.id)
    } else {
      setPatientGuides([])
    }
  }, [selectedPatient, loadPatientGuides])

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsFormOpen(true)
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setOpen(false)
    setSearchTerm('')
    setPatients([])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-[#8B4513]">Gerenciamento de Pacientes</h2>
            <Button 
              variant="outline"
              onClick={() => setIsFormOpen(true)}
              className="gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Novo Paciente
            </Button>
          </div>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[300px] justify-between"
              >
                {selectedPatient
                  ? selectedPatient.nome
                  : "Selecione um paciente..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Buscar paciente..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8f732b]"></div>
                  </div>
                ) : patients.length === 0 ? (
                  <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
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
                          <span className="text-xs text-muted-foreground">
                            Carteirinha: {patient.carteirinha}
                          </span>
                        </div>
                      </button>
                    ))}
                  </CommandGroup>
                )}
              </Command>
            </PopoverContent>
          </Popover>

          {selectedPatient && (
            <div className="mt-6 space-y-6">
              <div className="rounded-lg border p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-brown-800">{selectedPatient.nome}</h2>
                    <p className="text-muted-foreground">Carteirinha: {selectedPatient.carteirinha}</p>
                  </div>
                  <Button variant="outline" onClick={() => handleEditPatient(selectedPatient)}>
                    Editar Paciente
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Guias do Paciente</h3>
                  <PatientDetails patient={selectedPatient} guides={patientGuides} />
                </div>
              </div>
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
