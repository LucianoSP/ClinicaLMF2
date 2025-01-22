'use client';

import React, { useEffect, useState } from 'react';
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
  excluirCarteirinha 
} from '@/services/carteirinhaService';
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

interface PaginatedData {
  items: Carteirinha[];
  total: number;
  pages: number;
  isLoading: boolean;
}

export function CarteirinhasList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarteirinha, setSelectedCarteirinha] = useState<Carteirinha>();
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 0,
    isLoading: true
  });

  const fetchCarteirinhas = async (page: number) => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));
      const response = await listarCarteirinhas(page, ITEMS_PER_PAGE);
      setData({
        items: response.items,
        total: response.total,
        pages: Math.ceil(response.total / ITEMS_PER_PAGE),
        isLoading: false
      });
    } catch (error) {
      console.error('Erro ao carregar carteirinhas:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchCarteirinhas(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSaveCarteirinha = async (carteirinhaData: Partial<Carteirinha>) => {
    try {
      if (selectedCarteirinha) {
        const updated = await atualizarCarteirinha(selectedCarteirinha.id, carteirinhaData);
        setData(prev => ({
          ...prev,
          items: prev.items.map(c => c.id === updated.id ? updated : c)
        }));
        toast.success("Carteirinha atualizada com sucesso!");
      } else {
        const created = await criarCarteirinha(carteirinhaData);
        await fetchCarteirinhas(currentPage);
        toast.success("Carteirinha criada com sucesso!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar carteirinha:', error);
      toast.error("Erro ao salvar carteirinha");
    }
  };

  const handleDelete = async (carteirinha: Carteirinha) => {
    if (window.confirm('Tem certeza que deseja excluir esta carteirinha?')) {
      try {
        await excluirCarteirinha(carteirinha.id);
        setData(prev => ({
          ...prev,
          items: prev.items.filter(c => c.id !== carteirinha.id)
        }));
        toast.success("Carteirinha excluída com sucesso!");
      } catch (error) {
        console.error('Erro ao excluir carteirinha:', error);
        toast.error("Erro ao excluir carteirinha");
      }
    }
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
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
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
              onClick={() => currentPage < data.pages && handlePageChange(currentPage + 1)}
              className={`${currentPage >= data.pages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Próximo
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (data.isLoading) {
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
          <Button onClick={() => {
            setSelectedCarteirinha(undefined);
            setIsModalOpen(true);
          }}>
            + Nova Carteirinha
          </Button>
        </div>
        <div className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">
            Nenhuma carteirinha encontrada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Lista de Carteirinhas</h2>
        <Button onClick={() => {
          setSelectedCarteirinha(undefined);
          setIsModalOpen(true);
        }}>
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
              <TableHead>Titular</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((carteirinha) => (
              <TableRow key={carteirinha.id}>
                <TableCell>
                  {carteirinha.numero || carteirinha.numero_carteirinha || '-'}
                </TableCell>
                <TableCell>{carteirinha.paciente?.nome || '-'}</TableCell>
                <TableCell>{carteirinha.plano_saude?.nome || '-'}</TableCell>
                <TableCell>
                  {carteirinha.dataValidade && carteirinha.dataValidade !== 'null' && carteirinha.dataValidade !== '' ? 
                    format(new Date(carteirinha.dataValidade), 'dd/MM/yyyy', { locale: ptBR }) 
                    : '-'}
                </TableCell>
                <TableCell>{carteirinha.titular ? 'Sim' : 'Não'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCarteirinha(carteirinha);
                        setIsModalOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(carteirinha)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex justify-center mt-4">
          {renderPagination()}
        </div>
      </div>

      <CarteirinhaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCarteirinha}
        carteirinha={selectedCarteirinha}
      />
    </div>
  );
}