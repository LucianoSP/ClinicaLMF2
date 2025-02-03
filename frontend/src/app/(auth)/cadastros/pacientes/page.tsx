'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PacienteForm } from './components/PacienteForm'
import SortableTable from '@/components/SortableTable'
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
import { toast } from "sonner"

interface PaginatedData {
  items: Paciente[];
  total: number;
  pages: number;
  currentPage: number;
  isLoading: boolean;
}

export default function PacientesPage() {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 0,
    currentPage: 1,
    isLoading: true
  })
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const tableRef = useCallback((table: any) => {
    if (typeof window !== 'undefined') {
      window.tableRef = table;
    }
  }, []);

  const fetchPacientes = useCallback(async (page: number = 1) => {
    try {
      setData(prev => ({ ...prev, isLoading: true }))
      const response = await listarPacientes(page, searchTerm, itemsPerPage)
      setData({
        items: response.items,
        total: response.total,
        pages: Math.ceil(response.total / itemsPerPage),
        currentPage: page,
        isLoading: false
      })
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error)
      toast.error("Erro ao carregar pacientes")
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }, [searchTerm, itemsPerPage])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPacientes(data.currentPage)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, data.currentPage, fetchPacientes])

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente)
    setIsFormOpen(true)
  }

  const handleDelete = async (paciente: Paciente) => {
    // Implementar depois
    console.log('Delete:', paciente)
  }

  const handleClose = () => {
    setSelectedPaciente(null)
    setIsFormOpen(false)
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handlePageChange = (page: number) => {
    setData(prev => ({ ...prev, currentPage: page }))
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setData(prev => ({ ...prev, currentPage: 1 }))
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
            data={data.items}
            columns={columns}
            loading={data.isLoading}
            meta={{
              onEdit: handleEdit,
              onDelete: handleDelete
            }}
          />
        </div>
      </Card>

      {data.pages > 0 && (
        <PaginationControls
          currentPage={data.currentPage}
          totalPages={data.pages}
          itemsPerPage={itemsPerPage}
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
    </div>
  )
}
