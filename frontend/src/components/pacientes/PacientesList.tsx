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

export function PacientesList() {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
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
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas do paciente",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {pacienteSelecionado ? (
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => setPacienteSelecionado(null)}
            className="mb-4"
          >
            Voltar para lista
          </Button>
          <PacienteDetalhes
            paciente={{
              ...pacienteSelecionado,
              estatisticas: pacienteSelecionado.estatisticas
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={() => {
              setPacienteParaEditar(null);
              setOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right pr-8">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Carregando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Nenhum paciente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  pacientes.map((paciente) => (
                    <TableRow 
                      key={paciente.id}
                      className="cursor-pointer hover:bg-accent/5"
                      onClick={() => handleRowClick(paciente)}
                    >
                      <TableCell>{paciente.nome}</TableCell>
                      <TableCell>{paciente.nome_responsavel}</TableCell>
                      <TableCell>{paciente.tipo_responsavel || '-'}</TableCell>
                      <TableCell>
                        {paciente.data_nascimento ? format(new Date(paciente.data_nascimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        {paciente.created_at ? format(new Date(paciente.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(paciente);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(paciente.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <PacienteDialog
        open={open}
        onOpenChange={setOpen}
        paciente={pacienteParaEditar}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
