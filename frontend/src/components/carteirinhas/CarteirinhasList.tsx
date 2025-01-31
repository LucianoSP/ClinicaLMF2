'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CarteirinhaModal } from './CarteirinhaModal';
import {
  Carteirinha,
  listarCarteirinhas,
  criarCarteirinha,
  atualizarCarteirinha,
  excluirCarteirinha as deleteCarteirinha
} from '@/services/carteirinhaService';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SortableTable, { Column } from '@/components/SortableTable';
import { Plus } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface PaginatedData {
  items: Carteirinha[];
  total: number;
  pages: number;
  currentPage: number;
  isLoading: boolean;
}

export function CarteirinhasList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarteirinha, setSelectedCarteirinha] = useState<Carteirinha | undefined>();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 0,
    currentPage: 1,
    isLoading: true
  });

  const fetchCarteirinhas = useCallback(async (page: number = 1) => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));
      const response = await listarCarteirinhas(page, ITEMS_PER_PAGE, searchTerm);
      setData({
        items: response.items,
        total: response.total,
        pages: Math.ceil(response.total / ITEMS_PER_PAGE),
        currentPage: page,
        isLoading: false
      });
    } catch (error) {
      console.error("Erro ao buscar carteirinhas:", error);
      toast.error("Erro ao carregar carteirinhas");
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCarteirinhas(data.currentPage);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, data.currentPage, fetchCarteirinhas]);

  const handlePageChange = (page: number) => {
    setData(prev => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (carteirinha: Carteirinha) => {
    setSelectedCarteirinha(carteirinha);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCarteirinha(id);
      toast.success("Carteirinha excluída com sucesso!");
      fetchCarteirinhas();
    } catch (error) {
      console.error("Erro ao excluir carteirinha:", error);
      toast.error("Erro ao excluir carteirinha");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCarteirinha(undefined);
  };

  const handleAddNew = () => {
    setSelectedCarteirinha(undefined);
    setIsModalOpen(true);
  };

  const columns: Column<Carteirinha>[] = [
    {
      key: 'paciente',
      label: 'Paciente',
      style: { paddingLeft: '1rem' },
      render: (_, carteirinha) => carteirinha.paciente?.nome
    },
    {
      key: 'plano',
      label: 'Plano',
      style: { paddingLeft: '1rem' },
      render: (_, carteirinha) => carteirinha.plano_saude?.nome
    },
    {
      key: 'numero',
      label: 'Número',
      style: { paddingLeft: '1rem' },
      render: (_, carteirinha) => carteirinha.numero_carteirinha
    },
    {
      key: 'validade',
      label: 'Validade',
      style: { paddingLeft: '1rem' },
      render: (_, carteirinha) => carteirinha.data_validade
        ? format(parseISO(carteirinha.data_validade), 'dd/MM/yyyy', { locale: ptBR })
        : 'N/A'
    },
    {
      key: 'status',
      label: 'Status',
      style: { paddingLeft: '1rem' },
      render: (_, carteirinha) => (
        <StatusBadge status={carteirinha.status} />
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      style: { paddingRight: '1rem' },
      className: 'text-right',
      render: (_, carteirinha) => (
        <TableActions
          onEdit={() => handleEdit(carteirinha)}
          onDelete={() => handleDelete(carteirinha.id)}
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
            placeholder="Buscar carteirinhas..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-[300px]"
          />
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Carteirinha
        </Button>
      </div>

      <SortableTable
        data={data.items}
        columns={columns}
        loading={data.isLoading}
      />

      {data.pages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, data.currentPage - 1))}
                  className={data.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={data.currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(data.pages, data.currentPage + 1))}
                  className={data.currentPage === data.pages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <CarteirinhaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        carteirinha={selectedCarteirinha}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchCarteirinhas(data.currentPage);
        }}
      />
    </div>
  );
}