"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiTrash2, FiEdit, FiDownload, FiUpload, FiSearch, FiCheck, FiX, FiCheckCircle, FiEye } from 'react-icons/fi';
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

// Add a helper function for safe date formatting
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  
  try {
    // If date is already in DD/MM/YYYY format
    if (dateStr.includes('/')) {
      return dateStr;
    }
    
    // If date is in ISO format or other format, try to parse it
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

interface EditedSessao extends Partial<Sessao> {
  // ...existing Sessao fields...
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
  const [showFichaDetails, setShowFichaDetails] = useState(false);
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
      // Make sure we have the correct API URL
      if (!process.env.NEXT_PUBLIC_API_URL) {
        throw new Error('API URL not configured');
      }

      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca`;
      const params = new URLSearchParams();
      
      params.append('limit', perPage.toString());
      params.append('offset', ((page - 1) * perPage).toString());
      params.append('order', 'created_at.desc');
      
      if (statusFilter !== 'todas') {
        params.append('status', statusFilter);
      }

      if (debouncedSearchTerm.trim().length >= 2) {
        params.append('search', debouncedSearchTerm.trim());
      }

      const url = `${baseUrl}?${params.toString()}`;
      console.log('Fetching from URL:', url); // Debug log

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.fichas || !Array.isArray(result.fichas)) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid API response format');
      }

      // Format the data
      const fichasFormatadas = result.fichas.map((ficha: FichaPresenca) => ({
        ...ficha,
        created_at: formatDate(ficha.created_at)
      }));

      setFichas(fichasFormatadas);
      setTotalPages(Math.ceil(result.total / perPage));
      setTotalRecords(result.total);

    } catch (error) {
      console.error('Error fetching fichas:', error);
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

  const handleSessaoClick = (sessao: Sessao) => {
    setSelectedSessao(sessao.id === selectedSessao?.id ? null : sessao);
  };

  const handleActions = (item: FichaPresenca) => {
    return (
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            setSelectedFicha(item); // Apenas seleciona a ficha para mostrar sessões
          }}
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
            e.stopPropagation(); // Previne a seleção da ficha
            setSelectedFicha(item);
            setEditedFicha({...item});
            setShowEditDialog(true);
          }}
          className="text-[#b49d6b] hover:text-[#a08b5f]"
          title="Editar Ficha"
        >
          <FiEdit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Previne a seleção da ficha
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

  const fichasColumns: Column<FichaPresenca>[] = [
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
      key: 'sessoes',
      label: 'Sessões',
      className: 'w-[100px] text-center',
      render: (_, item) => (
        <div className="text-center">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium 
            ${item.sessoes?.length ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            {item.sessoes?.length || 0}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-[100px] text-center',
      render: (value, item) => handleActions(item)
    }
  ];

  const handleEditSessao = async (sessao: Sessao) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessoes/${sessao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_sessao: sessao.data_sessao,
          tipo_terapia: sessao.tipo_terapia,
          profissional_executante: sessao.profissional_executante,
          possui_assinatura: sessao.possui_assinatura,
          valor_sessao: sessao.valor_sessao,
          observacoes_sessao: sessao.observacoes_sessao
        }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar sessão');

      toast({
        title: "Sucesso",
        description: "Sessão atualizada com sucesso",
      });
      
      // Atualiza a ficha para mostrar as alterações
      fetchFichas();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar sessão",
        variant: "destructive",
      });
    }
  };

  const sessoesColumns: Column<Sessao>[] = [
    {
      key: 'data_sessao',
      label: 'Data',
      className: 'w-[120px] text-center',
      render: (value) => formatDate(value)
    },
    {
      key: 'tipo_terapia',
      label: 'Terapia',
      className: 'w-[150px] text-center'
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
          value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-[100px] text-center',
      render: (value) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          value === 'conferida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-[120px] text-center',
      render: (_, sessao) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSessao(sessao);
              setEditedSessao(sessao);
              setShowEditSessaoDialog(true);
            }}
            title="Editar Sessão"
          >
            <FiEdit className="w-4 h-4 text-[#b49d6b]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleConferirSessao(sessao);
            }}
            disabled={sessao.status === 'conferida'}
            title="Confirmar Sessão"
          >
            <FiCheckCircle className={`w-4 h-4 ${
              sessao.status === 'conferida' ? 'text-green-600' : 'text-gray-400'
            }`} />
          </Button>
        </div>
      )
    }
  ];

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

      // Update the session status in the selected ficha
      if (selectedFicha) {
        const updatedSessoes = selectedFicha.sessoes?.map(s => 
          s.id === sessaoParaConferir.id ? { ...s, status: 'conferida' } : s
        );
        setSelectedFicha({
          ...selectedFicha,
          sessoes: updatedSessoes
        });

        // Also update in the main fichas list
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

  const handleRowClick = (ficha: FichaPresenca) => {
    setSelectedFicha(ficha);
    console.log('Ficha selecionada:', ficha);
    console.log('Sessões:', ficha.sessoes);
  };

  const handleCloseSessoes = () => {
    setSelectedFicha(null);
    setSelectedSessao(null);
  };

  const handleEditSessaoSubmit = async () => {
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

      toast({
        title: "Sucesso",
        description: "Sessão atualizada com sucesso",
      });
      
      // Update local state
      if (selectedFicha) {
        const updatedSessoes = selectedFicha.sessoes?.map(s => 
          s.id === selectedSessao.id ? { ...s, ...editedSessao } : s
        );
        setSelectedFicha({ ...selectedFicha, sessoes: updatedSessoes });
      }
      setShowEditSessaoDialog(false);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar sessão",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6b342f]" />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Header com upload e filtros - mantém o mesmo */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="p-6 flex flex-col gap-8">
            {/* Header */}
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
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#6b342f]" />
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
                <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
                  <FiDownload className="h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShowClearDialog(true)}>
                  <TrashIcon className="h-4 w-4" />
                  Limpar Fichas
                </Button>
              </div>
            </div>

            {/* Filters */}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
          </div>
        </div>

        {/* Layout Principal - Modificado para layout vertical */}
        <div className="flex flex-col gap-4">
          {/* Tabela de Fichas */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Fichas de Presença</h3>
            <SortableTable
              data={fichas}
              columns={fichasColumns}
              loading={loading}
              onRowClick={handleRowClick}
              rowClassName={(item) => 
                item.id === selectedFicha?.id ? 'bg-blue-50 cursor-pointer' : 'cursor-pointer hover:bg-gray-50'
              }
            />
            
            {/* Paginação e contadores */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Total de registros: {totalRecords}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>

          {/* Tabela de Sessões */}
          {selectedFicha && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Ficha:</span>
                  <span className="text-gray-900">{selectedFicha.codigo_ficha}</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-medium text-gray-700">Paciente:</span>
                  <span className="text-gray-900">{selectedFicha.paciente_nome}</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-medium text-gray-700">Guia:</span>
                  <span className="text-gray-900">{selectedFicha.numero_guia}</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-medium text-gray-700">Carteirinha:</span>
                  <span className="text-gray-900">{selectedFicha.paciente_carteirinha}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseSessoes}
                  className="hover:bg-gray-100"
                >
                  <FiX className="h-4 w-4" />
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <SortableTable
                  data={selectedFicha.sessoes || []}
                  columns={sessoesColumns}
                  loading={false}
                  onRowClick={handleSessaoClick}
                  rowClassName={(sessao) => 
                    sessao.id === selectedSessao?.id 
                      ? 'bg-blue-50 cursor-pointer' 
                      : 'cursor-pointer hover:bg-gray-50'
                  }
                />
              </div>

              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>Total de sessões: {selectedFicha.sessoes?.length || 0}</span>
                <span>
                  Conferidas: {selectedFicha.sessoes?.filter(s => s.status === 'conferida').length || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dialog para Detalhes da Ficha */}
        <Dialog open={showFichaDetails} onOpenChange={setShowFichaDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Ficha</DialogTitle>
            </DialogHeader>
            {/* ...detalhes da ficha... */}
          </DialogContent>
        </Dialog>

        {/* Dialogs */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          {/* ...existing edit dialog content... */}
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          {/* ...existing delete dialog content... */}
        </Dialog>

        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          {/* ...existing clear dialog content... */}
        </Dialog>

        <Dialog open={showSessoesDialog} onOpenChange={setShowSessoesDialog}>
          <DialogContent className="bg-white max-w-5xl">
            <DialogHeader>
              <DialogTitle>Sessões da Ficha</DialogTitle>
              <DialogDescription>
                Confira cada sessão individualmente
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

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total de sessões: {selectedSessoes.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Conferidas: {selectedSessoes.filter(s => s.status === 'conferida').length}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSessoesDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Edit Session Dialog */}
        <Dialog open={showEditSessaoDialog} onOpenChange={setShowEditSessaoDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Editar Sessão
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Altere os dados da sessão. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="data_sessao" className="text-sm font-medium text-gray-700">
                  Data da Sessão
                </Label>
                <Input
                  id="data_sessao"
                  type="date"
                  value={editedSessao.data_sessao ? editedSessao.data_sessao.split('T')[0] : ''}
                  onChange={(e) => setEditedSessao({ ...editedSessao, data_sessao: e.target.value })}
                  className="border rounded-md p-2"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tipo_terapia" className="text-sm font-medium text-gray-700">
                  Tipo de Terapia
                </Label>
                <Input
                  id="tipo_terapia"
                  value={editedSessao.tipo_terapia || ''}
                  onChange={(e) => setEditedSessao({ ...editedSessao, tipo_terapia: e.target.value })}
                  className="border rounded-md p-2"
                  placeholder="Ex: Fisioterapia"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="profissional" className="text-sm font-medium text-gray-700">
                  Profissional
                </Label>
                <Input
                  id="profissional"
                  value={editedSessao.profissional_executante || ''}
                  onChange={(e) => setEditedSessao({ ...editedSessao, profissional_executante: e.target.value })}
                  className="border rounded-md p-2"
                  placeholder="Nome do profissional"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="possui_assinatura" className="text-sm font-medium text-gray-700">
                  Possui Assinatura
                </Label>
                <input
                  id="possui_assinatura"
                  type="checkbox"
                  checked={editedSessao.possui_assinatura || false}
                  onChange={(e) => setEditedSessao({ ...editedSessao, possui_assinatura: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
                  Observações
                </Label>
                <textarea
                  id="observacoes"
                  value={editedSessao.observacoes_sessao || ''}
                  onChange={(e) => setEditedSessao({ ...editedSessao, observacoes_sessao: e.target.value })}
                  className="min-h-[80px] w-full p-2 border rounded-md"
                  placeholder="Observações sobre a sessão..."
                />
              </div>
            </div>
            
            <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditSessaoDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSessaoSubmit}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white">
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
      </div>
    );
  };

  // Return the component
  return renderContent();
}
