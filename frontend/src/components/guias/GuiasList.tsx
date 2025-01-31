'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2, Loader2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
import { TableActions } from '@/components/ui/table-actions';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
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

const ITEMS_PER_PAGE = 10;

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
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 0,
    isLoading: true,
    currentPage: 1
  });

  const fetchGuias = useCallback(async (page: number = 1, limit: number = ITEMS_PER_PAGE) => {
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
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGuias(data.currentPage);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, data.currentPage, fetchGuias]);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Carteirinha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Qtd. Autorizada</TableHead>
                <TableHead>Qtd. Executada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((guia) => (
                <TableRow key={guia.id}>
                  <TableCell>{guia.numero_guia}</TableCell>
                  <TableCell>{guia.paciente?.nome}</TableCell>
                  <TableCell>{guia.carteirinha?.numero_carteirinha}</TableCell>
                  <TableCell>{guia.tipo}</TableCell>
                  <TableCell>{guia.quantidade_autorizada}</TableCell>
                  <TableCell>{guia.quantidade_executada}</TableCell>
                  <TableCell>
                    <StatusBadge status={guia.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <TableActions
                      onEdit={() => handleEdit(guia)}
                      onDelete={() => handleDelete(guia.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.pages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => currentPage > 1 && setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Anterior
                  </Button>
                </PaginationItem>

                {Array.from({ length: data.pages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => currentPage < data.pages && setCurrentPage(prev => Math.min(prev + 1, data.pages))}
                    className={`${currentPage >= data.pages ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Próximo
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
