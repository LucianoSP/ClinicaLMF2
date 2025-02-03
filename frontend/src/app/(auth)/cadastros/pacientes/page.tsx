'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PacienteForm } from './components/PacienteForm'
import SortableTable from '@/components/SortableTable'
import { columns } from './components/columns'
import { Paciente } from '@/types/paciente'
import { listarPacientes, excluirPaciente, buscarGuiasPaciente } from '@/services/pacienteService'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { PaginationControls } from '@/components/ui/pagination-controls'
import Link from 'next/link'
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PacientesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pacienteToDelete, setPacienteToDelete] = useState<Paciente | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isDeleting, setIsDeleting] = useState(false)

  const tableRef = useCallback((table: any) => {
    if (typeof window !== 'undefined') {
      window.tableRef = table;
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['pacientes', currentPage, searchTerm, itemsPerPage],
    queryFn: () => listarPacientes(currentPage, searchTerm, itemsPerPage),
    keepPreviousData: true,
    staleTime: 0, // Sempre considerar os dados desatualizados
    cacheTime: 0  // Não manter cache
  })

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente)
    setIsFormOpen(true)
  }

  const handleDelete = async (paciente: Paciente) => {
    // Primeiro mostramos o diálogo de confirmação
    setPacienteToDelete(paciente)
    setIsDeleteDialogOpen(true)
    setDeleteError(null)
  }

  const handleCloseDeleteDialog = () => {
    if (isDeleting) return // Não permite fechar enquanto está processando
    setIsDeleteDialogOpen(false)
    setPacienteToDelete(null)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!pacienteToDelete || isDeleting) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      // Verificamos todos os vínculos do paciente
      const { items: guias, carteirinhas, plano } = await buscarGuiasPaciente(pacienteToDelete.id)
      
      const mensagensErro = [];
      
      if (guias && guias.length > 0) {
        mensagensErro.push('guias');
      }
      
      if (carteirinhas && carteirinhas.length > 0) {
        mensagensErro.push('carteirinhas');
      }
      
      if (plano) {
        mensagensErro.push('plano');
      }
      
      if (mensagensErro.length > 0) {
        setDeleteError(`Não é possível excluir este paciente pois ele possui ${mensagensErro.join(', ')} vinculado(s).`);
        setIsDeleting(false)
        return;
      }

      // Se não tiver vínculos, tentamos excluir
      await excluirPaciente(pacienteToDelete.id)
      toast.success('Paciente excluído com sucesso')
      queryClient.invalidateQueries(['pacientes'])
      handleCloseDeleteDialog()
    } catch (error: any) {
      console.error('Erro ao excluir paciente:', error)
      const errorMessage = error.response?.data?.detail || 'Erro ao excluir paciente'
      
      if (errorMessage.includes('violates foreign key constraint')) {
        setDeleteError('Não é possível excluir este paciente pois ele possui registros vinculados.')
      } else {
        setDeleteError('Erro ao excluir paciente. Por favor, tente novamente.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setSelectedPaciente(null)
    setIsFormOpen(false)
    // Invalida o cache para forçar uma nova busca
    queryClient.invalidateQueries(['pacientes'])
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setCurrentPage(1) // Volta para a primeira página ao pesquisar
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  const paginatedData = {
    items: data?.items || [],
    total: data?.total || 0,
    pages: data ? Math.ceil(data.total / itemsPerPage) : 0,
    currentPage,
    isLoading
  }

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

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-[300px]"
          />
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={() => setIsFormOpen(true)} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card>
        <div className="rounded-md border">
          <SortableTable
            ref={tableRef}
            data={paginatedData.items}
            columns={columns}
            loading={paginatedData.isLoading}
            meta={{
              onEdit: handleEdit,
              onDelete: handleDelete
            }}
          />
        </div>
      </Card>

      {paginatedData.pages > 0 && (
        <PaginationControls
          currentPage={paginatedData.currentPage}
          totalPages={paginatedData.pages}
          itemsPerPage={itemsPerPage}
          totalItems={paginatedData.total}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPageSelector={true}
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

      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja excluir o paciente {pacienteToDelete?.nome}?</p>
              <p className="font-medium text-destructive">Esta ação não pode ser desfeita.</p>
              {deleteError && (
                <p className="text-destructive bg-destructive/10 p-3 rounded-md mt-2 border border-destructive/20">
                  {deleteError}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCloseDeleteDialog}
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault() // Previne o fechamento automático
                confirmDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
