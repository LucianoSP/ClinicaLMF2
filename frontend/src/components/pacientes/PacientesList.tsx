'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import SortableTable, { Column } from '@/components/SortableTable';
import { Paciente } from '@/types/paciente';
import { PacienteDialog } from './PacienteDialog';
import { PacienteDetalhes } from './PacienteDetalhes';
import { listarPacientes, excluirPaciente, buscarEstatisticasPaciente } from '@/services/pacienteService';
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { TableActions } from "@/components/ui/table-actions";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function PacientesList() {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openDetalhes, setOpenDetalhes] = useState(false);
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<string | null>(null);
  const [pacienteParaEditar, setPacienteParaEditar] = useState<Paciente | null>(null);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const carregarPacientes = async (search?: string) => {
    try {
      setIsLoading(true);
      const response = await listarPacientes(currentPage, search);
      setPacientes(response.items);
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      setPacientes([]);
      toast({
        title: "Erro",
        description: "Erro ao carregar pacientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPacientes(searchTerm);
  }, [currentPage, searchTerm]);

  const handleEdit = (paciente: Paciente) => {
    setPacienteParaEditar(paciente);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    setPacienteParaExcluir(id);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (pacienteParaExcluir) {
      try {
        await excluirPaciente(pacienteParaExcluir);
        toast({
          title: "Sucesso",
          description: "Paciente excluído com sucesso",
        });
        carregarPacientes(searchTerm);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir paciente",
          variant: "destructive",
        });
      }
    }
    setOpenDelete(false);
    setPacienteParaExcluir(null);
  };

  const handleSuccess = () => {
    carregarPacientes(searchTerm);
    setOpen(false);
    setPacienteParaEditar(null);
  };

  const handleRowClick = async (paciente: Paciente) => {
    try {
      const estatisticas = await buscarEstatisticasPaciente(paciente.id);
      setPacienteSelecionado({ ...paciente, estatisticas });
      setOpenDetalhes(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas do paciente",
        variant: "destructive",
      });
    }
  };

  const handleView = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setOpenDetalhes(true);
  };

  const columns: Column<Paciente>[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'cpf', label: 'CPF' },
    { key: 'dataNascimento', label: 'Data de Nascimento', render: (value) => value ? format(parseISO(value as string), 'dd/MM/yyyy', { locale: ptBR }) : '-' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'Email' },
    {
      key: 'actions',
      label: 'Ações',
      render: (_, item) => (
        <TableActions
          onView={() => handleView(item)}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item.id)}
        />
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <div className="rounded-md border">
        <SortableTable
          data={pacientes}
          columns={columns}
          loading={isLoading}
        />
      </div>

      <Dialog open={openDetalhes} onOpenChange={setOpenDetalhes}>
        <DialogContent className="max-w-4xl">
          {pacienteSelecionado && (
            <PacienteDetalhes
              paciente={pacienteSelecionado}
              onClose={() => setOpenDetalhes(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <PacienteDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        paciente={pacienteParaEditar}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
