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
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces e Tipos
interface Sessao {
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
}

interface EditedSessao extends Partial<Sessao> { }

type Column<T> = {
  key: keyof T | 'actions' | 'sessoes';
  label: string;
  className?: string;
  sortable?: boolean;
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

  // Estados para seleção e edição
  const [selectedFicha, setSelectedFicha] = useState<FichaPresenca | null>(null);
  const [editedFicha, setEditedFicha] = useState<Partial<FichaPresenca>>({});
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [editedSessao, setEditedSessao] = useState<EditedSessao>({});
  const [sessaoParaConferir, setSessaoParaConferir] = useState<{ id: string, ficha_presenca_id: string } | null>(null);

  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>('pendente');

  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();

  // Função principal para buscar dados
  const fetchFichas = async () => {
    setLoading(true);
    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca`;
      const params = new URLSearchParams();

      params.append('limit', perPage.toString());
      params.append('offset', ((page - 1) * perPage).toString());

      if (statusFilter !== 'todas') {
        params.append('status', statusFilter);
      }

      if (debouncedSearchTerm.trim().length >= 2) {
        params.append('search', debouncedSearchTerm.trim());
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) throw new Error('Falha ao buscar fichas');

      const result = await response.json();
      const fichasFormatadas = result.fichas.map((ficha: FichaPresenca) => ({
        ...ficha,
        created_at: formatDate(ficha.created_at)
      }));

      setFichas(fichasFormatadas);
      setTotalPages(Math.ceil(result.total / perPage));
      setTotalRecords(result.total);

    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar as fichas de presença",
        variant: "destructive",
      });
      setFichas([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Effect para buscar dados quando filtros mudam
  useEffect(() => {
    fetchFichas();
  }, [page, perPage, debouncedSearchTerm, statusFilter]);

  // Handlers
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

  // Handlers para manipulação de fichas e sessões
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

      if (!response.ok) throw new Error('Falha ao atualizar ficha');

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessoes/${sessaoParaConferir.id}/conferir`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) throw new Error('Falha ao conferir sessão');

      toast({
        title: "Sucesso",
        description: "Sessão conferida com sucesso",
      });

      if (selectedFicha) {
        const updatedSessoes = selectedFicha.sessoes?.map(s =>
          s.id === sessaoParaConferir.id ? { ...s, status: 'conferida' } : s
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Falha ao fazer upload dos arquivos');
      }

      const results = await response.json();
      
      // Verifica se algum arquivo teve erro
      const errors = results.filter(result => result.status === 'error');
      if (errors.length > 0) {
        throw new Error(errors[0].message || 'Falha ao processar alguns arquivos');
      }

      toast({
        title: "Sucesso",
        description: `${results.length} arquivo(s) enviado(s) e processado(s) com sucesso`,
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessoes/${selectedSessao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedSessao),
      });

      if (!response.ok) throw new Error('Falha ao atualizar sessão');

      const updatedSessao = await response.json();

      // Atualiza o estado local
      if (selectedFicha) {
        const updatedSessoes = selectedFicha.sessoes?.map(s =>
          s.id === selectedSessao.id ? { ...s, ...updatedSessao.data } : s
        );
        setSelectedFicha({
          ...selectedFicha,
          sessoes: updatedSessoes
        });
      }

      toast({
        title: "Sucesso",
        description: "Sessão atualizada com sucesso",
      });
      setShowEditSessaoDialog(false);
    } catch (error) {
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
      sortable: true
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
      key: 'created_at',
      label: 'Data Cadastro',
      className: 'w-[130px] text-center',
      sortable: true,
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
      render: (_, item) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFicha(item);
              setShowSessoesDialog(true);
            }}
            title="Ver Sessões"
          >
            <FiEye className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFicha(item);
              setEditedFicha({ ...item });
              setShowEditDialog(true);
            }}
            title="Editar Ficha"
          >
            <FiEdit className="w-4 h-4 text-[#b49d6b]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFicha(item);
              setShowDeleteDialog(true);
            }}
            title="Excluir"
          >
            <FiTrash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header e Filtros */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Fichas de Presença</h1>

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
                    <th className="p-2 text-left">Tipo Terapia</th>
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
                      <td className="p-2">{sessao.tipo_terapia || '-'}</td>
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
                            title="Conferir Sessão"
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
                            title="Editar Sessão"
                          >
                            <FiEdit className="w-4 h-4 text-[#b49d6b]" />
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
                value={editedSessao.data_sessao?.split('T')[0] || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  data_sessao: e.target.value
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de Terapia</Label>
              <Input
                value={editedSessao.tipo_terapia || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  tipo_terapia: e.target.value
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Profissional Executante</Label>
              <Input
                value={editedSessao.profissional_executante || ''}
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
                value={editedSessao.valor_sessao || ''}
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
                value={editedSessao.observacoes_sessao || ''}
                onChange={(e) => setEditedSessao({
                  ...editedSessao,
                  observacoes_sessao: e.target.value
                })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="possui_assinatura"
                checked={editedSessao.possui_assinatura || false}
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
    </div>
  );
}