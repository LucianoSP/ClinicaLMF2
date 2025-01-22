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
} from "@/components/ui/pagination";
import { GuiaModal } from './GuiaModal';
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
}

export function GuiasList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState<Guia>();
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<PaginatedData>({
    items: [],
    total: 0,
    pages: 0,
    isLoading: true
  });

  const fetchGuias = async (page: number) => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));
      const response = await listarGuias(page, ITEMS_PER_PAGE);
      setData({
        items: response.items,
        total: response.total,
        pages: response.pages,
        isLoading: false
      });
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
      toast.error('Erro ao carregar guias');
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchGuias(currentPage);
  }, [currentPage]);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Guias</h2>
        <Button onClick={() => setIsModalOpen(true)}>Nova Guia</Button>
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
                <TableHead>Número da Guia</TableHead>
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
                  <TableCell>{guia.paciente_nome}</TableCell>
                  <TableCell>{guia.paciente_carteirinha}</TableCell>
                  <TableCell>{guia.tipo}</TableCell>
                  <TableCell>{guia.quantidade_autorizada}</TableCell>
                  <TableCell>{guia.quantidade_executada}</TableCell>
                  <TableCell>{guia.status}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(guia)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(guia.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                      onClick={() => setCurrentPage(page)}
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
