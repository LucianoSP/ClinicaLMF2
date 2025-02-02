'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Loader2 } from "lucide-react";
import SortableTable, { Column } from '@/components/SortableTable';
import { Plano } from '@/types/plano';
import { PlanoDialog } from './PlanoDialog';
import { listarPlanos } from '@/services/planoService';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { TableActions } from '@/components/ui/table-actions';
import { StatusBadge } from "@/components/ui/status-badge";

export function PlanosList() {
  const [open, setOpen] = useState(false);
  const [planoParaEditar, setPlanoParaEditar] = useState<Plano | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const carregarPlanos = async (search?: string) => {
    try {
      setIsLoading(true);
      const data = await listarPlanos(search);
      setPlanos(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPlanos(searchTerm);
  }, [searchTerm]);

  const handleEdit = (plano: Plano) => {
    setPlanoParaEditar(plano);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // TODO: Implementar chamada de API para deletar plano
      await carregarPlanos();
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano",
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    carregarPlanos();
    setOpen(false);
    setPlanoParaEditar(null);
  };

  const columns: Column<Plano>[] = [
    {
      key: 'nome',
      label: 'Nome',
      style: { paddingLeft: '1rem' }
    },
    {
      key: 'codigo',
      label: 'Código',
      style: { paddingLeft: '1rem' }
    },
    {
      key: 'ativo' as keyof Plano,
      label: 'Status',
      style: { paddingLeft: '1rem' },
      render: (_, plano) => (
        <StatusBadge status={plano.ativo ? "ativo" : "inativo"} />
      )
    },
    {
      key: 'id' as keyof Plano,
      label: 'Ações',
      style: { paddingRight: '1rem' },
      className: 'text-right',
      render: (_, plano) => (
        <TableActions
          onEdit={() => handleEdit(plano)}
          onDelete={() => handleDelete(plano.id as string)}
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
            placeholder="Buscar planos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
        </div>
        <Button onClick={() => setOpen(true)} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <SortableTable
        data={planos}
        columns={columns}
        loading={isLoading}
      />

      <PlanoDialog
        open={open}
        onOpenChange={setOpen}
        plano={planoParaEditar}
        onSuccess={handleSuccess}
      />
    </div>
  );
}