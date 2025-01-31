'use client';

import React from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { listarFichasPresenca } from '@/services/fichaPresencaService';
import { TableActions } from '@/components/ui/table-actions';

// Interfaces e Tipos
interface Procedimento {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
}

interface Sessao {
  id: string;
  ficha_presenca_id: string;
  data_sessao: string;
  possui_assinatura: boolean;
  procedimento_id: string;
  procedimento?: Procedimento;
  profissional_executante: string;
  valor_sessao?: number;
  status: 'pendente' | 'conferida' | string;
  observacoes_sessao?: string;
  executado: boolean;
  data_execucao?: string;
  executado_por?: string;
}

interface FichaPresenca {
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
  actions?: string;
  sessoes_status?: string;
}

interface EditedSessao extends Omit<Partial<Sessao>, 'id'> {
  id?: string;
}

interface EditedFicha extends Omit<Partial<FichaPresenca>, 'sessoes'> {
  sessoes?: EditedSessao[];
  data_atendimento?: string;
}

type Column<T> = {
  key: keyof T;
  label: string;
  className?: string;
  sortable?: boolean;
  type?: 'boolean' | 'text' | 'string' | 'date';
  render?: (value: any, item: T) => React.ReactNode;
};

// Função auxiliar para formatação de data
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
  // Estados
  const [fichas, setFichas] = useState<FichaPresenca[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Estados para modais
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSessoesDialog, setShowSessoesDialog] = useState(false);
  const [showEditSessaoDialog, setShowEditSessaoDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteSessaoDialog, setShowDeleteSessaoDialog] = useState(false);
  const [sessaoParaExcluir, setSessaoParaExcluir] = useState<Sessao | null>(null);

  // Estados para seleção e edição
  const [selectedFicha, setSelectedFicha] = useState<FichaPresenca | null>(null);
  const [editedFicha, setEditedFicha] = useState<EditedFicha>({});
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [editedSessao, setEditedSessao] = useState<EditedSessao>({});
  const [sessaoParaConferir, setSessaoParaConferir] = useState<{ id: string, ficha_presenca_id: string } | null>(null);
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>('pendente');

  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();

  const supabase = createClientComponentClient();

  // Função principal para buscar dados
  const fetchFichas = async () => {
    setLoading(true);
    try {
      const response = await listarFichasPresenca(
        page,
        perPage,
        debouncedSearchTerm,
        statusFilter
      );

      setFichas(response.items);
      setTotalRecords(response.total);
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Erro ao carregar fichas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar fichas de presença",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar procedimentos
  const fetchProcedimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('procedimentos')
        .select('id, codigo, nome, descricao')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProcedimentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar procedimentos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar procedimentos",
        variant: "destructive",
      });
    }
  };

  // Função para buscar nome do procedimento
  const getProcedimentoNome = (tipo_terapia: string) => {
    const procedimento = procedimentos.find(p => p.id === tipo_terapia);
    return procedimento?.nome || tipo_terapia || '-';
  };

  // Effect para buscar dados quando filtros mudam
  useEffect(() => {
    fetchFichas();
  }, [page, perPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchProcedimentos();
  }, []);

  // Handlers
  const handleDelete = async () => {
    if (!selectedFicha) return;

    try {
      const { error } = await supabase
        .from('fichas_presenca')
        .delete()
        .eq('id', selectedFicha.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ficha excluída com sucesso",
      });
      fetchFichas();
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
      // Prepare session data
      const sessaoData = editedFicha.sessoes?.[0] || {};

      // Format date for session
      const formattedDate = editedFicha.data_atendimento ?
        new Date(editedFicha.data_atendimento).toISOString() :
        selectedFicha.created_at;

      const payload = {
        ...editedFicha,
        data_atendimento: formattedDate,
        sessoes: [{
          ...sessaoData,
          data_sessao: formattedDate,
          ficha_presenca_id: selectedFicha.id,
          status: 'pendente'
        }]
      };

      const { error } = await supabase
        .from('fichas_presenca')
        .update(payload)
        .eq('id', selectedFicha.id);

      if (error) throw error;

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

  const handleConferirSessao = async (sessao: Sessao) => {
    setSessaoParaConferir({
      id: sessao.id,
      ficha_presenca_id: sessao.ficha_presenca_id
    });
    setShowConfirmDialog(true);
  };

  const confirmarSessao = async () => {
    if (!sessaoParaConferir) return;

    try {
      const { error } = await supabase
        .from('sessoes')
        .update({ status: 'conferida' })
        .eq('id', sessaoParaConferir.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Sessão conferida com sucesso",
      });

      if (selectedFicha) {
        const updatedSessoes = selectedFicha.sessoes?.map(s =>
          s.id === sessaoParaConferir.id ? { ...s, status: 'conferida' as const } : s
        );
        setSelectedFicha({
          ...selectedFicha,
          sessoes: updatedSessoes
        });

        setFichas(prevFichas =>
          prevFichas.map(ficha =>
            ficha.id === selectedFicha.id
              ? { ...ficha, sessoes: updatedSessoes }
              : ficha
          )
        );
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao conferir sessão",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
      setSessaoParaConferir(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload('uploads/', formData, {
          upsert: true,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${data.length} arquivo(s) enviado(s) e processado(s) com sucesso`,
      });

      fetchFichas();
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao enviar os arquivos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = fichas.map(ficha => ({
        'Código Ficha': ficha.codigo_ficha,
        'Paciente': ficha.paciente_nome,
        'Carteirinha': ficha.paciente_carteirinha,
        'Número Guia': ficha.numero_guia,
        'Data Cadastro': ficha.created_at,
        'Sessões Totais': ficha.sessoes?.length || 0,
        'Sessões Conferidas': ficha.sessoes?.filter(s => s.status === 'conferida').length || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fichas de Presença');

      const fileName = `fichas_presenca_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Sucesso",
        description: "Arquivo Excel gerado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar arquivo Excel",
        variant: "destructive",
      });
    }
  };

  const handleSaveSessao = async () => {
    if (!selectedSessao || !editedSessao) return;

    try {
      // Dados a serem atualizados
      const updateData = {
        data_sessao: editedSessao.data_sessao,
        procedimento_id: editedSessao.procedimento_id,
        profissional_executante: editedSessao.profissional_executante,
        valor_sessao: editedSessao.valor_sessao,
        observacoes_sessao: editedSessao.observacoes_sessao,
        possui_assinatura: editedSessao.possui_assinatura
      };

      console.log('Atualizando sessão com dados:', updateData);

      // Atualiza no banco
      const { error: updateError } = await supabase
        .from('sessoes')
        .update(updateData)
        .eq('id', selectedSessao.id);

      if (updateError) throw updateError;

      // Busca a sessão atualizada com o procedimento
      const { data: updatedSessaoData, error: fetchError } = await supabase
        .from('sessoes')
        .select(`
          *,
          procedimento:procedimentos (
            id,
            nome,
            codigo
          )
        `)
        .eq('id', selectedSessao.id)
        .single();

      if (fetchError) throw fetchError;

      console.log('Sessão atualizada:', updatedSessaoData);

      // Atualiza o estado local
      if (selectedFicha) {
        const updatedSessoes = selectedFicha.sessoes?.map(s =>
          s.id === selectedSessao.id
            ? {
              ...updatedSessaoData,
              procedimento_nome: updatedSessaoData.procedimento?.nome || '-'
            }
            : s
        );

        setSelectedFicha({
          ...selectedFicha,
          sessoes: updatedSessoes
        });

        // Atualiza também na lista principal de fichas
        setFichas(fichas.map(ficha =>
          ficha.id === selectedFicha.id
            ? {
              ...ficha,
              sessoes: updatedSessoes
            }
            : ficha
        ));
      }

      toast({
        title: "Sucesso",
        description: "Sessão atualizada com sucesso",
      });

      // Fecha o modal
      setShowEditSessaoDialog(false);

      // Recarrega os dados para garantir
      fetchFichas();

    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar sessão",
        variant: "destructive",
      });
    }
  };

  // Definição das colunas da tabela
  const columns: Column<FichaPresenca>[] = [
    {
      key: 'codigo_ficha',
      label: 'Código Ficha',
      className: 'w-[200px] text-center',
      sortable: true,
      type: 'text'
    },
    {
      key: 'paciente_nome',
      label: 'Paciente',
      className: 'w-[220px] text-center',
      sortable: true
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
      key: 'arquivo_digitalizado',
      label: 'Arquivo',
      className: 'w-[100px] text-center',
      render: (value) => value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          <FiDownload className="inline-block w-4 h-4" />
        </a>
      ) : null
    },
    {
      key: 'created_at',
      label: 'Data Cadastro',
      className: 'w-[130px] text-center',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      key: 'sessoes_status',
      label: 'Sessões Conferidas',
      className: 'w-[120px] text-center',
      type: 'text',
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
      type: 'text',
      render: (_, item) => (
        <TableActions
          onView={() => {
            setSelectedFicha(item);
            setShowSessoesDialog(true);
          }}
          onEdit={() => {
            setSelectedFicha(item);
            setEditedFicha({ ...item });
            setShowEditDialog(true);
          }}
          onDelete={() => {
            setSelectedFicha(item);
            setShowDeleteDialog(true);
          }}
        />
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header e Filtros */}
      <div>
        <h1 className="page-title">Fichas de Presença</h1>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nome do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            </div>

            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="10">10 por página</option>
              <option value="25">25 por página</option>
              <option value="50">50 por página</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="pendente">Pendentes</option>
              <option value="conferida">Conferidas</option>
              <option value="todas">Todas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById('fileInput')?.click()}
              className="gap-2"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B4513]" />
                  Processando...
                </>
              ) : (
                <>
                  <FiUpload className="h-4 w-4" />
                  Upload PDF
                </>
              )}
            </Button>
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="gap-2"
            >
              <FiDownload className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela Principal */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8B4513]" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <SortableTable
              data={fichas}
              columns={columns}
              loading={loading}
            />
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * perPage + 1} até{" "}
                {Math.min(page * perPage, totalRecords)} de {totalRecords} registros
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Diálogos */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir a ficha {selectedFicha?.codigo_ficha}.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ficha</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Código da Ficha</Label>
                  <Input
                    value={editedFicha.codigo_ficha || ''}
                    onChange={(e) => setEditedFicha({
                      ...editedFicha,
                      codigo_ficha: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Número da Guia</Label>
                  <Input
                    value={editedFicha.numero_guia || ''}
                    onChange={(e) => setEditedFicha({
                      ...editedFicha,
                      numero_guia: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nome do Paciente</Label>
                  <Input
                    value={editedFicha.paciente_nome || ''}
                    onChange={(e) => setEditedFicha({
                      ...editedFicha,
                      paciente_nome: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Carteirinha</Label>
                  <Input
                    value={editedFicha.paciente_carteirinha || ''}
                    onChange={(e) => setEditedFicha({
                      ...editedFicha,
                      paciente_carteirinha: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Data da Sessão</Label>
                  <Input
                    type="date"
                    value={editedFicha.data_atendimento?.split('T')[0] || ''}
                    onChange={(e) => setEditedFicha({
                      ...editedFicha,
                      data_atendimento: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Terapia</Label>
                  <Input
                    value={editedFicha.sessoes?.[0]?.procedimento_id || ''}
                    onChange={(e) => {
                      const updatedSessoes = editedFicha.sessoes ? [...editedFicha.sessoes] : [{}];
                      updatedSessoes[0] = { ...updatedSessoes[0], procedimento_id: e.target.value };
                      setEditedFicha({ ...editedFicha, sessoes: updatedSessoes });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Profissional Executante</Label>
                  <Input
                    value={editedFicha.sessoes?.[0]?.profissional_executante || ''}
                    onChange={(e) => {
                      const updatedSessoes = editedFicha.sessoes ? [...editedFicha.sessoes] : [{}];
                      updatedSessoes[0] = { ...updatedSessoes[0], profissional_executante: e.target.value };
                      setEditedFicha({ ...editedFicha, sessoes: updatedSessoes });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Link do Arquivo Digitalizado</Label>
                  <Input
                    value={editedFicha.arquivo_digitalizado || ''}
                    onChange={(e) => setEditedFicha({
                      ...editedFicha,
                      arquivo_digitalizado: e.target.value
                    })}
                    placeholder="URL do arquivo digitalizado"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              Deseja marcar esta sessão como conferida?
              Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setSessaoParaConferir(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarSessao}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessoesDialog} onOpenChange={setShowSessoesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sessões da Ficha {selectedFicha?.codigo_ficha}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Procedimento</th>
                    <th className="p-2 text-left">Profissional</th>
                    <th className="p-2 text-center">Assinatura</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFicha?.sessoes?.map((sessao) => (
                    <tr key={sessao.id} className="border-b">
                      <td className="p-2">{formatDate(sessao.data_sessao)}</td>
                      <td className="p-2">{sessao.procedimento?.nome || '-'}</td>
                      <td className="p-2">{sessao.profissional_executante || '-'}</td>
                      <td className="p-2 text-center">
                        {sessao.possui_assinatura ? (
                          <FiCheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <FiX className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          sessao.status === 'conferida' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        )}>
                          {sessao.status}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConferirSessao(sessao)}
                            disabled={sessao.status === 'conferida'}
                          >
                            <FiCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSessao(sessao);
                              setEditedSessao({ ...sessao });
                              setShowEditSessaoDialog(true);
                            }}
                          >
                            <FiEdit className="w-4 h-4 text-[#b49d6b]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSessaoParaExcluir(sessao);
                              setShowDeleteSessaoDialog(true);
                            }}
                          >
                            <FiTrash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditSessaoDialog} onOpenChange={setShowEditSessaoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sessão</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Data da Sessão</Label>
              <Input
                type="date"
                value={editedSessao?.data_sessao?.split('T')[0] || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  data_sessao: e.target.value
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Procedimento</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1"
                value={editedSessao?.procedimento_id || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  procedimento_id: e.target.value
                })}
              >
                <option value="">Selecione um procedimento</option>
                {procedimentos.map((proc) => (
                  <option key={proc.id} value={proc.id}>
                    {proc.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Profissional Executante</Label>
              <Input
                value={editedSessao?.profissional_executante || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  profissional_executante: e.target.value
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor da Sessão</Label>
              <Input
                type="number"
                step="0.01"
                value={editedSessao?.valor_sessao || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  valor_sessao: parseFloat(e.target.value)
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <textarea
                className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2"
                value={editedSessao?.observacoes_sessao || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  observacoes_sessao: e.target.value
                })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="possui_assinatura"
                checked={editedSessao?.possui_assinatura || false}
                onCheckedChange={(checked) => setEditedSessao({
                  ...editedSessao,
                  possui_assinatura: checked as boolean
                })}
              />
              <Label htmlFor="possui_assinatura">Possui Assinatura</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSessaoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSessao}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteSessaoDialog} onOpenChange={setShowDeleteSessaoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão da Sessão</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir a sessão do dia {sessaoParaExcluir ? formatDate(sessaoParaExcluir.data_sessao) : ''}.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteSessaoDialog(false);
                setSessaoParaExcluir(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!sessaoParaExcluir) return;
                try {
                  const { error } = await supabase
                    .from('sessoes')
                    .delete()
                    .eq('id', sessaoParaExcluir.id);

                  if (error) throw error;

                  if (selectedFicha && selectedFicha.sessoes) {
                    const updatedSessoes = selectedFicha.sessoes.filter(s => s.id !== sessaoParaExcluir.id);
                    setSelectedFicha({ ...selectedFicha, sessoes: updatedSessoes });
                  }
                  toast({ title: "Sucesso", description: "Sessão excluída com sucesso" });
                  fetchFichas(); // Atualiza a lista principal de fichas
                } catch (error) {
                  toast({ title: "Erro", description: "Falha ao excluir a sessão", variant: "destructive" });
                } finally {
                  setShowDeleteSessaoDialog(false);
                  setSessaoParaExcluir(null);
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}