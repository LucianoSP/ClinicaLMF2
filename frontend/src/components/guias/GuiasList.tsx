'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2, Loader2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SortableTable, { Column } from '@/components/SortableTable';
import { TableActions } from '@/components/ui/table-actions';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { GuiaModal } from './GuiaModal';
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Guia,
  GuiaFormData,
  listarGuias,
  criarGuia,
  atualizarGuia,
  excluirGuia
} from '@/services/guiaService';
import { toast } from "sonner";

interface PaginatedData {
  items: Guia[];
  total: number;
  pages: number;
  isLoading: boolean;
  currentPage: number;
}

export function GuiasList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState<Guia | undefined>();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 0,
    isLoading: true,
    currentPage: 1
  });

  const fetchGuias = useCallback(async (page: number = 1, limit: number = itemsPerPage) => {
    try {
      setLoading(true);
      const response = await listarGuias(page, limit, searchTerm);
      setData({
        items: response.items,
        total: response.total,
        pages: Math.ceil(response.total / limit),
        currentPage: page,
        isLoading: false
      });
    } catch (error) {
      console.error("Erro ao buscar guias:", error);
      toast.error("Erro ao carregar guias");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGuias(currentPage);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchGuias, currentPage, itemsPerPage]);

  const handleCreate = async (data: GuiaFormData) => {
    try {
      await criarGuia(data);
      toast.success('Guia criada com sucesso!');
      fetchGuias(currentPage);
    } catch (error) {
      console.error('Erro ao criar guia:', error);
      toast.error('Erro ao criar guia');
    }
  };

  const handleUpdate = async (data: GuiaFormData) => {
    if (!selectedGuia) return;
    try {
      await atualizarGuia(selectedGuia.id, data);
      toast.success('Guia atualizada com sucesso!');
      fetchGuias(currentPage);
    } catch (error) {
      console.error('Erro ao atualizar guia:', error);
      toast.error('Erro ao atualizar guia');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta guia?')) return;
    try {
      await excluirGuia(id);
      toast.success('Guia excluída com sucesso!');
      fetchGuias(currentPage);
    } catch (error) {
      console.error('Erro ao excluir guia:', error);
      toast.error('Erro ao excluir guia');
    }
  };

  const handleEdit = (guia: Guia) => {
    setSelectedGuia(guia);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedGuia(undefined);
    setIsModalOpen(false);
  };

  const handleModalSubmit = (data: GuiaFormData) => {
    if (selectedGuia) {
      handleUpdate(data);
    } else {
      handleCreate(data);
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handlePageChange = (page: number) => {
    setData(prev => ({ ...prev, currentPage: page }));
  };

  const columns: Column<Guia>[] = [
    {
      key: 'numero_guia',
      label: 'Número',
    },
    {
      key: 'paciente',
      label: 'Paciente',
      render: (value) => value?.nome
    },
    {
      key: 'carteirinha',
      label: 'Carteirinha',
      render: (value) => value?.numero_carteirinha
    },
    {
      key: 'tipo',
      label: 'Tipo',
    },
    {
      key: 'quantidade_autorizada',
      label: 'Qtd. Autorizada',
    },
    {
      key: 'quantidade_executada',
      label: 'Qtd. Executada',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Buscar guias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Nova Guia
        </Button>
      </div>

      {data.isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <SortableTable
            data={data.items}
            columns={columns}
            loading={loading}
            actions={(guia) => (
              <TableActions
                onEdit={() => handleEdit(guia)}
                onDelete={() => handleDelete(guia.id)}
              />
            )}
          />

          {data.pages > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={data.pages}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={setItemsPerPage}
              showItemsPerPageSelector={true}
            />
          )}
        </>
      )}

      <GuiaModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        guia={selectedGuia}
      />
    </div>
  );
}
