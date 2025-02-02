'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PacienteForm } from './components/PacienteForm'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './components/columns'
import { Paciente } from '@/types/paciente'
import { listarPacientes } from '@/services/pacienteService'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { PaginationControls } from '@/components/ui/pagination-controls'
import Link from 'next/link'

export default function PacientesPage() {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['pacientes', currentPage, searchTerm, itemsPerPage],
    queryFn: () => listarPacientes(currentPage, searchTerm, itemsPerPage),
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setSelectedPaciente(null)
    setIsFormOpen(false)
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar pacientes. Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const totalPages = data ? Math.ceil(data.total / itemsPerPage) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Controle de pacientes cadastrados</p>
        </div>
        <Link href="/cadastros" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data?.items || []}
            meta={{
              onEdit: handleEdit,
              onDelete: () => { }, // Implementar depois
            }}
          />
        )}
      </Card>

      {data && data.total > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPaciente ? 'Editar' : 'Novo'} Paciente</DialogTitle>
          </DialogHeader>
          <PacienteForm
            paciente={selectedPaciente || undefined}
            onSuccess={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
