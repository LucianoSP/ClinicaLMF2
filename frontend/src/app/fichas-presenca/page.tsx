// types/fichas.ts

export interface Sessao {
  id: string;
  ficha_presenca_id: string;
  data_sessao: string;
  possui_assinatura: boolean;
  tipo_terapia: string;
  profissional_executante: string;
  valor_sessao?: number;
  status: 'pendente' | 'conferida';
  observacoes_sessao?: string;
  executado: boolean;
  data_execucao?: string;
  executado_por?: string;
}

export interface FichaPresenca {
  id: string;
  codigo_ficha: string;
  numero_guia: string;
  paciente_nome: string;
  paciente_carteirinha: string;
  arquivo_digitalizado?: string;
  observacoes?: string;
  data_atendimento?: string;
  created_at: string;
  updated_at: string;
  sessoes?: Sessao[];
}

export interface EditedSessao extends Partial<Sessao> { }

export type Column<T> = {
  key: keyof T | 'actions' | 'sessoes';
  label: string;
  className?: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
};

export type SortableTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  fichas?: T[];
}

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiTrash2, FiEdit, FiDownload, FiUpload, FiCheck, FiX, FiCheckCircle, FiEye } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SortableTable from '@/components/SortableTable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { FichaPresenca, Sessao, Column, EditedSessao } from '@/types/fichas';

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';

  try {
    if (dateStr.includes('/')) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return dateStr;
    }
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return dateStr;
  }
};

export default function FichasPresencaPage() {
  const [fichas, setFichas] = useState<FichaPresenca[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaPresenca | null>(null);
  const [editedFicha, setEditedFicha] = useState<Partial<FichaPresenca>>({});
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('pendente');
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [showEditSessaoDialog, setShowEditSessaoDialog] = useState(false);
  const [editedSessao, setEditedSessao] = useState<EditedSessao>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sessaoParaConferir, setSessaoParaConferir] = useState<{ id: string, ficha_presenca_id: string } | null>(null);

  const handleDelete = async () => {
    if (!selectedFicha) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${selectedFicha.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Ficha excluída com sucesso",
        });
        fetchFichas();
      } else {
        throw new Error('Falha ao excluir ficha');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir a ficha",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedFicha(null);
    }
  };

  const handleSave = async () => {
    if (!selectedFicha || !editedFicha) return;

    try {
      const payload = {
        ...editedFicha,
        data_atendimento: editedFicha.data_atendimento || selectedFicha.created_at
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${selectedFicha.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar ficha');
      }

      toast({
        title: "Sucesso",
        description: "Ficha atualizada com sucesso",
      });
      fetchFichas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar a ficha",
        variant: "destructive",
      });
    } finally {
      setShowEditDialog(false);
      setSelectedFicha(null);
      setEditedFicha({});
    }
  };

  const handleActions = (item: FichaPresenca) => (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => setSelectedFicha(item)}
        className="text-blue-600 hover:text-blue-700"
        title="Ver Sessões"
      >
        <FiEye className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleConferir(item.id)}
        className="text-green-600 hover:text-green-700"
        title="Marcar como conferida"
      >
        <FiCheckCircle className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFicha(item);
          setEditedFicha({ ...item });
          setShowEditDialog(true);
        }}
        className="text-[#b49d6b] hover:text-[#a08b5f]"
        title="Editar Ficha"
      >
        <FiEdit className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFicha(item);
          setShowDeleteDialog(true);
        }}
        className="text-red-600 hover:text-red-700"
        title="Excluir"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const columns: Column<FichaPresenca>[] = [
    {
      key: 'codigo_ficha',
      label: 'Código Ficha',
      className: 'w-[200px] text-center'
    },
    {
      key: 'paciente_nome',
      label: 'Paciente',
      className: 'w-[220px] text-center'
    },
    {
      key: 'paciente_carteirinha',
      label: 'Carteirinha',
      className: 'w-[250px] text-center'
    },
    {
      key: 'numero_guia',
      label: 'Guia',
      className: 'w-[150px] text-center'
    },
    {
      key: 'created_at',
      label: 'Data Cadastro',
      className: 'w-[130px] text-center',
      render: (value) => formatDate(value)
    },
    {
      key: 'sessoes',
      label: 'Sessões',
      className: 'w-[120px] text-center',
      render: (_, item) => {
        const total = item.sessoes?.length || 0;
        const conferidas = item.sessoes?.filter(s => s.status === 'conferida').length || 0;
        const porcentagem = total > 0 ? (conferidas / total) * 100 : 0;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-4">
                    <div
                      className={cn(
                        "h-4 rounded-full transition-all",
                        porcentagem >= 100 ? "bg-green-500" :
                          porcentagem >= 75 ? "bg-yellow-500" :
                            "bg-[#D2691E]/60"
                      )}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {conferidas}/{total}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{porcentagem}% concluído</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-[100px] text-center',
      render: (_, item) => handleActions(item)
    }
  ];

  // Funções de fetch e manipulação dos dados
  // ... (manter o resto do seu código)

  return (
    <div className="flex flex-col gap-6">
      {/* ... (manter o restante da sua UI) */}
    </div>
  );
}