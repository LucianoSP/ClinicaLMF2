import { useState, useEffect } from 'react';
import { formatDate } from '../utils/date';
import {
  FiTrash2,
  FiRotateCw,
  FiDownload,
  FiSearch
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { SortableTable, Column } from './SortableTable';
import { useDebounce } from '../hooks/useDebounce';
import { API_URL } from '../config/api';

interface Registro {
  data_execucao: string;
  paciente_carteirinha: string;  // Changed from numero_carteira
  paciente_nome: string;
  guia_id: string;              // Changed from numero_guia_principal
  possui_assinatura: boolean;
  codigo_ficha: string;
}

interface DadosGuia {
  codigo_ficha: string;
  registros: Registro[];
}

interface Atendimento {
  data_execucao: string;
  paciente_carteirinha: string;  // Changed from numero_carteira
  paciente_nome: string;
  guia_id: string;              // Changed from numero_guia_principal
  possui_assinatura: boolean;
  codigo_ficha: string;
}

const ProcessedFiles = () => {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAtendimento, setEditedAtendimento] = useState<Atendimento | null>(null);
  const [originalCodigoFicha, setOriginalCodigoFicha] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [atendimentoToDelete, setAtendimentoToDelete] = useState<Atendimento | null>(null);

  const fetchProcessedFiles = async () => {
    setLoading(true);
    try {
      setError(null);
      setSyncSuccess(false);

      const baseUrl = `${API_URL}/atendimentos`;
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      const cleanSearchTerm = debouncedSearchTerm?.trim() || '';
      if (cleanSearchTerm.length >= 2) {
        params.set('paciente_nome', cleanSearchTerm);
      }

      const url = `${baseUrl}?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar arquivos processados');
      }

      const result = await response.json();
      console.log('Resultado da busca:', result);

      if (result.success) {
        // Format dates before setting the state
        const formattedAtendimentos = (result.data.atendimentos || []).map((atendimento: Atendimento) => ({
          ...atendimento,
          data_execucao: formatDate(atendimento.data_execucao.split('T')[0]) // Remove time part and format
        }));
        setAtendimentos(formattedAtendimentos);
        setTotalPages(result.data.pagination.total_pages);
        setTotalRecords(result.data.pagination.total);
      } else {
        throw new Error('Falha ao carregar dados');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao carregar arquivos processados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Efeito disparado. Termo de busca:', debouncedSearchTerm);
    fetchProcessedFiles();
  }, [debouncedSearchTerm, page, perPage]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerPage = parseInt(event.target.value, 10);
    setPerPage(newPerPage);
    setPage(1); // Reset to first page when changing items per page
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value || '';
    console.log('Novo termo de busca:', searchValue);
    setSearchTerm(searchValue);
    setPage(1); // Reset to first page when searching
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      setError(null);
      setSyncSuccess(false);

      const response = await fetch(`${API_URL}/sync-database/`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error('Falha ao sincronizar o banco de dados');
      }

      setSyncSuccess(true);
      fetchProcessedFiles();
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao sincronizar o banco de dados');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportExcel = () => {
    try {
      // Preparar os dados para exportação
      const exportData = atendimentos.map(item => ({
        'DATA': item.data_execucao,
        'CARTEIRA': item.paciente_carteirinha,  // Changed
        'BENEFICIÁRIO': item.paciente_nome,
        'NÚMERO DA GUIA': item.guia_id,         // Changed
        'CÓDIGO DA FICHA': item.codigo_ficha,
        'ASSINATURA': item.possui_assinatura ? 'Sim' : 'Não'
      }));

      // Criar uma nova planilha
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Atendimentos');

      // Gerar o arquivo e fazer o download
      const fileName = `atendimentos_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar os dados para Excel');
    }
  };

  const handleEdit = (atendimento: Atendimento) => {
    setEditingId(atendimento.codigo_ficha);
    setEditedAtendimento({ ...atendimento });
    setOriginalCodigoFicha(atendimento.codigo_ficha);
  };

  const handleCellEdit = (item: Atendimento, key: keyof Atendimento, value: any) => {
    if (editedAtendimento && item.codigo_ficha === editingId) {
      const updatedAtendimento = { ...editedAtendimento, [key]: value };
      setEditedAtendimento(updatedAtendimento);

      // If we're editing the codigo_ficha, we need to update the editingId
      if (key === 'codigo_ficha') {
        setEditingId(value);
      }

      // Update the local state to reflect changes immediately
      setAtendimentos(atendimentos.map(a =>
        a.codigo_ficha === (originalCodigoFicha || editingId) ? updatedAtendimento : a
      ));
    }
  };

  const handleSave = async (item: Atendimento) => {
    if (!editedAtendimento || !originalCodigoFicha) return;

    try {
      const dataToSend = {
        ...editedAtendimento,
        data_execucao: editedAtendimento.data_execucao
      };

      // Validate required fields
      if (!dataToSend.data_execucao || !dataToSend.paciente_carteirinha ||
        !dataToSend.paciente_nome || !dataToSend.guia_id ||
        !dataToSend.codigo_ficha) {
        throw new Error('Todos os campos são obrigatórios');
      }

      // Convert date from DD/MM/YYYY to YYYY-MM-DD
      if (dataToSend.data_execucao) {
        const parts = dataToSend.data_execucao.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          // Validate date parts
          if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) {
            throw new Error('Formato de data inválido. Use DD/MM/YYYY');
          }
          dataToSend.data_execucao = `${year}-${month}-${day}`;
        } else {
          throw new Error('Formato de data inválido. Use DD/MM/YYYY');
        }
      }

      console.log('Sending data:', dataToSend);

      const response = await fetch(`${API_URL}/atendimento/${originalCodigoFicha}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Erro ao atualizar o atendimento');
      }

      // Format the date back to DD/MM/YYYY for display
      const updatedAtendimento = {
        ...editedAtendimento,
        data_execucao: formatDate(dataToSend.data_execucao)
      };

      // Update local state with the new data
      setAtendimentos(atendimentos.map(a =>
        a.codigo_ficha === originalCodigoFicha ? updatedAtendimento : a
      ));

      // Clear edit state
      setEditingId(null);
      setEditedAtendimento(null);
      setOriginalCodigoFicha(null);

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar o atendimento');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedAtendimento(null);
    setOriginalCodigoFicha(null);
    // Revert any local changes
    fetchProcessedFiles();
  };

  const handleDelete = (atendimento: Atendimento) => {
    setAtendimentoToDelete(atendimento);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!atendimentoToDelete) return;

    try {
      const response = await fetch(`${API_URL}/atendimento/${atendimentoToDelete.codigo_ficha}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir o atendimento');
      }

      // Atualiza o estado local removendo o item excluído
      setAtendimentos(atendimentos.filter(a => a.codigo_ficha !== atendimentoToDelete.codigo_ficha));
      setShowDeleteModal(false);
      setAtendimentoToDelete(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao excluir o atendimento');
    }
  };

  const columns: Column<Atendimento>[] = [
    { key: 'data_execucao', label: 'Data', editable: true },
    { key: 'paciente_carteirinha', label: 'Carteira', editable: true },
    { key: 'paciente_nome', label: 'Beneficiário', editable: true },
    { key: 'guia_id', label: 'Número da Guia', editable: true },
    { key: 'possui_assinatura', label: 'Assinatura', editable: true, type: 'boolean' },
    { key: 'codigo_ficha', label: 'Código da Ficha', editable: true }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-[#6b342f]">Atendimentos</h1>

        <div className="flex space-x-4">
          <button
            onClick={handleExportExcel}
            disabled={loading || atendimentos.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4" />
            Exportar Excel
          </button>

          <button
            onClick={handleSync}
            disabled={loading || syncing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
          >
            <FiTrash2 className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Limpar Tabela
          </button>

          <button
            onClick={() => fetchProcessedFiles()}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
          >
            <FiRotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filtro e controles por página */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por beneficiário..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b342f] focus:border-transparent"
            />
            <FiSearch className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Itens por página:</span>
            <select
              value={perPage}
              onChange={handlePerPageChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6b342f] focus:border-transparent"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <SortableTable
            data={atendimentos.map(atendimento =>
              atendimento.codigo_ficha === editingId && editedAtendimento
                ? editedAtendimento
                : atendimento
            )}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSave={handleSave}
            onCancelEdit={handleCancelEdit}
            onCellEdit={handleCellEdit}
            editingId={editingId || undefined}
          />
        </div>
      </div>

      {/* Paginação */}
      <div className="mt-6 flex flex-col items-center justify-center gap-4">
        <div className="text-sm text-gray-600">
          Mostrando {atendimentos.length} de {totalRecords} registros
        </div>
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-lg ${page === pageNum
                  ? 'bg-[#b49d6b] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="px-2 text-gray-500">...</span>
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-1 rounded-lg ${page === totalPages
                  ? 'bg-[#b49d6b] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {syncSuccess && (
        <div className="bg-green-50 p-4 rounded-md flex items-center space-x-2">
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700">Registros sincronizados com sucesso!</p>
        </div>
      )}

      {atendimentos.length === 0 && !error && !loading && (
        <div className="text-center py-8 text-gray-500">
          Nenhum arquivo processado encontrado
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && atendimentoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-600">
              Tem certeza que deseja excluir o atendimento do beneficiário{' '}
              <span className="font-medium">{atendimentoToDelete.paciente_nome}</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessedFiles;
