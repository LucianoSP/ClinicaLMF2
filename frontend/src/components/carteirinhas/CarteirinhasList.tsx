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
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 0,
    currentPage: 1,
    isLoading: true
  });

  const fetchCarteirinhas = useCallback(async (page: number = 1, limit: number = ITEMS_PER_PAGE) => {
    try {
      setLoading(true);
      const response = await listarCarteirinhas(page, limit);
      setData({
        items: response.items,
        total: response.total,
        pages: Math.ceil(response.total / limit),
        currentPage: page,
        isLoading: false
      });
    } catch (error) {
      console.error("Erro ao buscar carteirinhas:", error);
      toast.error("Erro ao carregar carteirinhas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarteirinhas();
  }, [fetchCarteirinhas]);

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

  const handlePageChange = (page: number) => {
    fetchCarteirinhas(page, ITEMS_PER_PAGE);
  };

  const renderPagination = () => {
    if (data.pages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => data.currentPage > 1 && handlePageChange(data.currentPage - 1)}
              className={`${data.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Anterior
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => data.currentPage < data.pages && handlePageChange(data.currentPage + 1)}
              className={`${data.currentPage >= data.pages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Próximo
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">
          Carregando carteirinhas...
        </p>
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Lista de Carteirinhas</h2>
          <Button onClick={handleAddNew}>
            + Nova Carteirinha
          </Button>
        </div>
        <div className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">
            Nenhuma carteirinha encontrada
          </p>
        </div>
        <CarteirinhaModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          carteirinha={selectedCarteirinha}
          onSuccess={() => {
            handleCloseModal();
            fetchCarteirinhas();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Lista de Carteirinhas</h2>
        <Button onClick={handleAddNew}>
          + Nova Carteirinha
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Plano de Saúde</TableHead>
              <TableHead>Data de Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((carteirinha) => (
              <TableRow key={carteirinha.id}>
                <TableCell>{carteirinha.numero_carteirinha}</TableCell>
                <TableCell>{carteirinha.paciente?.nome}</TableCell>
                <TableCell>{carteirinha.plano_saude?.nome}</TableCell>
                <TableCell>
                  {carteirinha.data_validade
                    ? format(parseISO(carteirinha.data_validade), 'dd/MM/yyyy', { locale: ptBR })
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={carteirinha.status} />
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(carteirinha)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(carteirinha.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}

      <CarteirinhaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        carteirinha={selectedCarteirinha}
        onSuccess={() => {
          handleCloseModal();
          fetchCarteirinhas();
        }}
      />
    </div>
  );
}