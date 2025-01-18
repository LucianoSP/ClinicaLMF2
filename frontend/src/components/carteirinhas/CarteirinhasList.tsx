'use client';

import React, { useEffect, useState } from 'react';
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CarteirinhaModal } from "./CarteirinhaModal";
import { toast } from "sonner";
import { 
  Carteirinha,
  listarCarteirinhas,
  criarCarteirinha,
  atualizarCarteirinha,
  excluirCarteirinha 
} from "@/services/carteirinhaService";

const ITEMS_PER_PAGE = 10;

interface PaginatedData {
  items: Carteirinha[];
  total: number;
  pages: number;
  isLoading: boolean;
}

export function CarteirinhasList() {
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 1,
    isLoading: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarteirinha, setSelectedCarteirinha] = useState<Carteirinha | undefined>();

  const fetchCarteirinhas = async (page: number) => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));
      const response = await listarCarteirinhas(page, ITEMS_PER_PAGE);
      setData({
        items: response.items,
        total: response.total,
        pages: response.pages,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching carteirinhas:', error);
      toast.error("Erro ao carregar carteirinhas");
      setData({
        items: [],
        total: 0,
        pages: 1,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchCarteirinhas(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSave = async (carteirinha: Partial<Carteirinha>) => {
    try {
      if (selectedCarteirinha?.id) {
        const updated = await atualizarCarteirinha(selectedCarteirinha.id, carteirinha);
        setData(prev => ({
          ...prev,
          items: prev.items.map(c => c.id === updated.id ? updated : c)
        }));
        toast.success("Carteirinha atualizada com sucesso!");
      } else {
        const created = await criarCarteirinha(carteirinha);
        await fetchCarteirinhas(currentPage); // Recarrega a página atual
        toast.success("Carteirinha criada com sucesso!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving carteirinha:', error);
      toast.error("Erro ao salvar carteirinha");
    }
  };

  const handleDelete = async (carteirinha: Carteirinha) => {
    try {
      await excluirCarteirinha(carteirinha.id);
      setData(prev => ({
        ...prev,
        items: prev.items.filter(c => c.id !== carteirinha.id),
        total: prev.total - 1
      }));
      toast.success("Carteirinha excluída com sucesso!");
      
      // Se a página atual ficou vazia e não é a primeira página, volta uma página
      if (data.items.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting carteirinha:', error);
      toast.error("Erro ao excluir carteirinha");
    }
  };

  const renderPagination = () => {
    if (data.pages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {[...Array(data.pages)].map((_, index) => {
            const pageNumber = index + 1;
            const shouldShowPage = 
              pageNumber === 1 || 
              pageNumber === data.pages || 
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

            if (!shouldShowPage) {
              if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            }

            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={() => handlePageChange(pageNumber)}
                  isActive={currentPage === pageNumber}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage === data.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (data.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => {
          setSelectedCarteirinha(undefined);
          setIsModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Carteirinha
        </Button>
      </div>

      {data.items.length === 0 ? (
        <div className="flex justify-center items-center min-h-[100px]">
          <p className="text-sm text-muted-foreground">
            Nenhuma carteirinha encontrada
          </p>
        </div>
      ) : (
        <>
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
                  <TableCell>{carteirinha.numero}</TableCell>
                  <TableCell>{carteirinha.paciente?.nome}</TableCell>
                  <TableCell>{carteirinha.plano_saude?.nome}</TableCell>
                  <TableCell>
                    {carteirinha.dataValidade ? 
                      format(parseISO(carteirinha.dataValidade), 'dd/MM/yyyy', { locale: ptBR }) 
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
        </>
      )}

      <CarteirinhaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        carteirinha={selectedCarteirinha}
      />
    </div>
  );
}