'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { PatientForm } from './components/patient-form'
import { API_URL } from '@/config/api'

interface Patient {
  id: string
  nome: string
  carteirinha: string
  created_at: string
  updated_at: string
  plano_saude?: {
    nome: string
    codigo: string
  }
  carteirinha_info?: {
    numero_carteirinha: string
    data_validade: string
    titular: boolean
    nome_titular: string
  }
}

interface Guide {
  id: string
  numero_guia: string
  data_emissao: string
  data_validade: string
  quantidade_autorizada: number
  quantidade_executada: number
  procedimento_nome: string
  status: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>()
  const [patientGuides, setPatientGuides] = useState<Guide[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showTable, setShowTable] = useState(false)

  // Carregar pacientes
  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchTerm.trim()) {
        params.append('paciente_nome', searchTerm.trim())
      }

      const response = await fetch(`${API_URL}/pacientes?${params.toString()}`)
      if (!response.ok) throw new Error('Falha ao carregar pacientes')
      const data = await response.json()
      setPatients(data.items || [])
      setFilteredPatients(data.items || [])
      setShowTable(true)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  // Carregar guias do paciente
  const loadPatientGuides = useCallback(async (patientId: string) => {
    try {
      const response = await fetch(`${API_URL}/pacientes/${patientId}/guias`)
      if (!response.ok) throw new Error('Falha ao carregar guias')
      const data = await response.json()
      setPatientGuides(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar guias:', error)
      setPatientGuides([])
    }
  }, [])

  // Função de busca
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setShowTable(false)
      setPatients([])
      setFilteredPatients([])
      return
    }

    loadPatients()
  }, [loadPatients])

  // Efeito para atualizar a busca quando o termo muda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, handleSearch])

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

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col gap-8">
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

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder="Buscar por nome ou carteirinha..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {showTable && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Carteirinha</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8f732b]"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum paciente encontrado para esta busca
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow 
                        key={patient.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <TableCell>{patient.nome}</TableCell>
                        <TableCell>{patient.carteirinha}</TableCell>
                        <TableCell>
                          {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditPatient(patient)
                            }}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Informações do Paciente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Dados Pessoais</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Nome:</span> {selectedPatient.nome}</p>
                    <p><span className="text-muted-foreground">Carteirinha:</span> {selectedPatient.carteirinha}</p>
                    <p><span className="text-muted-foreground">Data de Cadastro:</span> {new Date(selectedPatient.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {selectedPatient.carteirinha_info && (
                  <div>
                    <h4 className="font-medium mb-2">Informações da Carteirinha</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Número:</span> {selectedPatient.carteirinha_info.numero_carteirinha}</p>
                      <p><span className="text-muted-foreground">Validade:</span> {new Date(selectedPatient.carteirinha_info.data_validade).toLocaleDateString('pt-BR')}</p>
                      <p><span className="text-muted-foreground">Titular:</span> {selectedPatient.carteirinha_info.titular ? 'Sim' : 'Não'}</p>
                      {!selectedPatient.carteirinha_info.titular && (
                        <p><span className="text-muted-foreground">Nome do Titular:</span> {selectedPatient.carteirinha_info.nome_titular}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Guias do Paciente</h3>
                  <p className="text-sm text-muted-foreground">Histórico de guias e saldos disponíveis</p>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número da Guia</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Autorizadas</TableHead>
                      <TableHead>Utilizadas</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientGuides.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhuma guia encontrada para este paciente
                        </TableCell>
                      </TableRow>
                    ) : (
                      patientGuides.map((guide) => (
                        <TableRow key={guide.id}>
                          <TableCell>{guide.numero_guia}</TableCell>
                          <TableCell>{guide.procedimento_nome}</TableCell>
                          <TableCell>{new Date(guide.data_validade).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{guide.quantidade_autorizada}</TableCell>
                          <TableCell>{guide.quantidade_executada}</TableCell>
                          <TableCell>{guide.quantidade_autorizada - guide.quantidade_executada}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              guide.status === 'ativa' 
                                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                            }`}>
                              {guide.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
  )
}
