"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiTrash2, FiEdit, FiDownload, FiUpload, FiSearch, FiCheck, FiX, FiCheckCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SortableTable, { Column } from '@/components/SortableTable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';

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
  created_at: string;
  updated_at: string;
  sessoes?: Sessao[];
}

export default function FichasPresenca() {
  const [fichas, setFichas] = useState<FichaPresenca[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaPresenca | null>(null);
  const [editedFicha, setEditedFicha] = useState<Partial<FichaPresenca>>({});
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('pendente');
  const [selectedSessoes, setSelectedSessoes] = useState<Sessao[]>([]);
  const [showSessoesDialog, setShowSessoesDialog] = useState(false);

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
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao excluir ficha');
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
        codigo_ficha: editedFicha.codigo_ficha,
        numero_guia: editedFicha.numero_guia,
        paciente_nome: editedFicha.paciente_nome,
        paciente_carteirinha: editedFicha.paciente_carteirinha,
        arquivo_digitalizado: editedFicha.arquivo_digitalizado,
        observacoes: editedFicha.observacoes
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${selectedFicha.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Resposta do servidor:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || 'Falha ao atualizar ficha');
      }

      toast({
        title: "Sucesso",
        description: "Ficha atualizada com sucesso",
      });
      fetchFichas();
    } catch (error) {
      console.error('Erro completo:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar a ficha",
        variant: "destructive",
      });
    } finally {
      setShowEditDialog(false);
      setSelectedFicha(null);
      setEditedFicha({});
    }
  };

  const handleDownload = async (arquivo: string) => {
    try {
      window.open(arquivo, '_blank');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Arquivos enviados com sucesso",
        });
        fetchFichas();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao enviar arquivos');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar os arquivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpar o input para permitir upload do mesmo arquivo novamente
      event.target.value = '';
    }
  };

  const handleClear = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas_presenca/limpar`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Todas as fichas foram excluídas com sucesso",
        });
        fetchFichas();
        setShowClearDialog(false);
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao limpar fichas');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao limpar as fichas",
        variant: "destructive",
      });
    }
  };

  const handleClearTable = () => {
    setFichas([]);
  };

  const handleExportExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert the data to the format we want to export
    const exportData = fichas.map(ficha => ({
      'Data': ficha.created_at,
      'Paciente': ficha.paciente_nome,
      'Carteirinha': ficha.paciente_carteirinha,
      'Guia': ficha.numero_guia,
      'Código Ficha': ficha.codigo_ficha,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Fichas de Presença');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `fichas_presenca_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const handlePageChange = (newPage: number) => {
    console.log('Mudando para página:', newPage);
    setPage(newPage);
  };

  const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerPage = parseInt(event.target.value, 10);
    console.log('Mudando itens por página para:', newPerPage);
    setPerPage(newPerPage);
    setPage(1); // Reset para primeira página ao mudar itens por página
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value || '';
    console.log('Novo termo de busca:', searchValue);
    setSearchTerm(searchValue);
    setPage(1); // Reset para primeira página ao pesquisar
  };

  const fetchFichas = async () => {
    setLoading(true);
    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca`;
      const params = new URLSearchParams();
      
      params.append('limit', perPage.toString());
      params.append('offset', ((page - 1) * perPage).toString());
      params.append('order', 'created_at.desc');
      
      // Only add status filter if not showing all
      if (statusFilter !== 'todas') {
        params.append('status', statusFilter);
      }

      if (debouncedSearchTerm.trim().length >= 2) {
        params.append('search', debouncedSearchTerm.trim());  // Changed from paciente_nome to search
      }

      const url = `${baseUrl}?${params.toString()}`;
      console.log('URL da requisição:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao carregar fichas');
      }

      const result = await response.json();
      console.log('Resposta da API:', result);

      if (!result.fichas || !Array.isArray(result.fichas)) {
        console.error('Formato inválido da resposta:', result);
        throw new Error('Formato inválido da resposta da API');
      }

      // Formatando os dados recebidos
      const fichasFormatadas = result.fichas.map((ficha: any) => {
        console.log('Processando ficha:', ficha);
        let dataFormatada = '';
        
        if (ficha.created_at) {
          try {
            // Se a data vier como DD/MM/YYYY
            if (ficha.created_at.includes('/')) {
              const [dia, mes, ano] = ficha.created_at.split('/');
              dataFormatada = `${dia}/${mes}/${ano}`;
            } else {
              // Se vier em outro formato (ISO ou MM/DD/YYYY)
              const data = new Date(ficha.created_at);
              if (!isNaN(data.getTime())) {
                dataFormatada = format(data, 'dd/MM/yyyy');
              } else {
                console.error('Data inválida:', ficha.created_at);
                dataFormatada = ficha.created_at;
              }
            }
          } catch (error) {
            console.error('Erro ao formatar data:', error, ficha.created_at);
            dataFormatada = ficha.created_at;
          }
        }

        return {
          ...ficha,
          created_at: dataFormatada
        };
      });

      console.log('Fichas formatadas:', fichasFormatadas);
      setFichas(fichasFormatadas);
      
      // Calculando o total de páginas
      const totalPages = Math.ceil(result.total / perPage);
      setTotalPages(totalPages);
      setTotalRecords(result.total);

    } catch (error) {
      console.error('Erro ao buscar fichas:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao carregar as fichas de presença",
        variant: "destructive",
      });
      setFichas([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Efeito disparado:', { page, perPage, searchTerm: debouncedSearchTerm });
    fetchFichas();
  }, [page, perPage, debouncedSearchTerm, statusFilter]);

  const handleConferir = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'conferida'
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Ficha marcada como conferida",
        });
        fetchFichas(); // Refresh the list instead of removing locally
      } else {
        throw new Error('Falha ao conferir ficha');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar ficha como conferida",
        variant: "destructive",
      });
    }
  };

  const handleViewSessoes = (ficha: FichaPresenca) => {
    setSelectedSessoes(ficha.sessoes || []);
    setShowSessoesDialog(true);
  };

  const handleActions = (item: FichaPresenca) => {
    return (
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleViewSessoes(item)}
          className="text-blue-600 hover:text-blue-700"
          title="Ver Sessões"
        >
          <DocumentIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleConferir(item.id)}
          className="text-green-600 hover:text-green-700"
          title="Marcar como conferida"
        >
          <FiCheckCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setSelectedFicha(item);
            setEditedFicha({
              ...item,
            });
            setShowEditDialog(true);
          }}
          className="text-[#b49d6b] hover:text-[#a08b5f]"
          title="Editar"
        >
          <FiEdit className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
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
  };

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
      render: (value) => {
        try {
          return format(new Date(value), 'dd/MM/yyyy');
        } catch (error) {
          console.error('Error formatting date:', value);
          return value;
        }
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-[100px] text-center',
      render: (value, item) => handleActions(item)
    }
  ];

  const sessoesColumns: Column<Sessao>[] = [
    {
      key: 'data_sessao',
      label: 'Data',
      className: 'w-[130px] text-center',
      render: (value) => format(new Date(value), 'dd/MM/yyyy')
    },
    {
      key: 'tipo_terapia',
      label: 'Terapia',
      className: 'w-[200px] text-center'
    },
    {
      key: 'profissional_executante',
      label: 'Profissional',
      className: 'w-[200px] text-center'
    },
    {
      key: 'possui_assinatura',
      label: 'Assinado',
      className: 'w-[100px] text-center',
      render: (value) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          value ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef9c3] text-[#854d0e]'
        }`}>
          {value ? <><FiCheck className="w-3 h-3" />Sim</> : <><FiX className="w-3 h-3" />Não</>}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-[100px] text-center',
      render: (value) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          value === 'conferida' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef9c3] text-[#854d0e]'
        }`}>
          {value === 'conferida' ? 'Conferida' : 'Pendente'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6b342f]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-[#8B4513]">Fichas de Presença</h2>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input) input.click();
                  }}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#6b342f]"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload className="h-4 w-4" />
                      <span>Upload PDF</span>
                    </>
                  )}
                </Button>
              </label>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportExcel}
              >
                <FiDownload className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowClearDialog(true)}
              >
                <TrashIcon className="h-4 w-4" />
                Limpar Fichas
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <FiSearch className="absolute left-2 top-3 text-muted-foreground" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1); // Reset para primeira página ao mudar filtro
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="pendente">Pendentes</option>
                <option value="conferida">Conferidas</option>
                <option value="todas">Todas</option>
              </select>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="h-10 rounded-md border border-input bg-background px-3 py-2"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <SortableTable
              data={fichas}
              columns={columns}
              loading={loading}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Total: {totalRecords} registros
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                      className={pageNum === page ? "bg-[#b49d6b] text-white" : ""}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Editar Ficha de Presença</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias nos campos abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codigo" className="text-right">
                Código Ficha
              </Label>
              <Input
                id="codigo"
                value={editedFicha.codigo_ficha}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  codigo_ficha: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paciente" className="text-right">
                Paciente
              </Label>
              <Input
                id="paciente"
                value={editedFicha.paciente_nome}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  paciente_nome: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carteirinha" className="text-right">
                Carteirinha
              </Label>
              <Input
                id="carteirinha"
                value={editedFicha.paciente_carteirinha}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  paciente_carteirinha: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guia" className="text-right">
                Guia
              </Label>
              <Input
                id="guia"
                value={editedFicha.numero_guia}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  numero_guia: e.target.value
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacoes" className="text-right">
                Observações
              </Label>
              <textarea
                id="observacoes"
                value={editedFicha.observacoes}
                onChange={(e) => setEditedFicha({
                  ...editedFicha,
                  observacoes: e.target.value
                })}
                className="col-span-3 min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
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

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Excluir Ficha de Presença</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta ficha de presença? Esta ação não pode ser desfeita.
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

      {/* Clear Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Limpar Fichas de Presença</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir todas as fichas de presença? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessões Dialog */}
      <Dialog open={showSessoesDialog} onOpenChange={setShowSessoesDialog}>
        <DialogContent className="bg-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sessões da Ficha</DialogTitle>
            <DialogDescription>
              Lista de sessões identificadas nesta ficha de presença.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="rounded-md border">
              <SortableTable
                data={selectedSessoes}
                columns={sessoesColumns}
                loading={false}
              />
            </div>
            {selectedSessoes.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma sessão encontrada para esta ficha.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessoesDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
