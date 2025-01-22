'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plano } from '@/types/plano';
import { PlanoDialog } from './PlanoDialog';
import { listarPlanos } from '@/services/planoService';
import { useToast } from "@/components/ui/use-toast";

export function PlanosList() {
  const [open, setOpen] = useState(false);
  const [planoParaEditar, setPlanoParaEditar] = useState<Plano | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const { toast } = useToast();

  const carregarPlanos = async () => {
    try {
      const data = await listarPlanos();
      setPlanos(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    carregarPlanos();
  }, []);

  const handleEdit = (plano: Plano) => {
    setPlanoParaEditar(plano);
    setOpen(true);
  };

  const handleSuccess = () => {
    carregarPlanos();
    setOpen(false);
    toast({
      title: "Sucesso",
      description: "Operação realizada com sucesso",
    });
  };

  const handleDelete = async (plano: Plano) => {
    try {
      // TODO: Implementar chamada de API para deletar plano
      // await deletarPlano(plano.id);
      await carregarPlanos();
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir plano",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lista de Planos</h2>
        <Button onClick={() => {
          setPlanoParaEditar(null);
          setOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-8">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planos.map((plano) => (
              <TableRow key={plano.id}>
                <TableCell>{plano.nome}</TableCell>
                <TableCell>{plano.codigo}</TableCell>
                <TableCell>
                  <StatusBadge status={plano.ativo ? "ativo" : "inativo"} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(plano)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(plano)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PlanoDialog
        open={open}
        onOpenChange={setOpen}
        plano={planoParaEditar}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
