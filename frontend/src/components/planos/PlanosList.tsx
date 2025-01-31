'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const carregarPlanos = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listarPlanos(searchTerm);
      setPlanos(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarPlanos();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, carregarPlanos]);

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

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Buscar planos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
        </div>
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
