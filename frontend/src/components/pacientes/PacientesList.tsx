'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paciente } from '@/types/paciente';
import { PacienteDialog } from './PacienteDialog';
import { listarPacientes, excluirPaciente } from '@/services/pacienteService';
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

export function PacientesList() {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<string | null>(null);
  const [pacienteParaEditar, setPacienteParaEditar] = useState<Paciente | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const carregarPacientes = async () => {
    try {
      const response = await listarPacientes(currentPage);
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
    }
  };

  useEffect(() => {
    carregarPacientes();
  }, []);

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
        carregarPacientes();
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
    carregarPacientes();
    setOpen(false);
    setPacienteParaEditar(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pacientes</h3>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data de Nascimento</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientes && pacientes.length > 0 ? (
              pacientes.map((paciente) => (
                <TableRow key={paciente.id}>
                  <TableCell>{paciente.nome}</TableCell>
                  <TableCell>{paciente.nome_responsavel}</TableCell>
                  <TableCell>
                    {paciente.data_nascimento ? 
                      format(parseISO(paciente.data_nascimento), 'dd/MM/yyyy', { locale: ptBR }) 
                      : '-'}
                  </TableCell>
                  <TableCell>{paciente.telefone}</TableCell>
                  <TableCell>{paciente.email}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(paciente)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(paciente.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Nenhum paciente cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PacienteDialog
        open={open}
        onOpenChange={setOpen}
        paciente={pacienteParaEditar}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
