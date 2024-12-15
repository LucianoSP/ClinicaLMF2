'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SortableTable, Column } from '@/components/SortableTable';
import { useDebounce } from '@/hooks/useDebounce';
import Pagination from '@/components/Pagination';
import { API_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

interface ExcelData {
  id: number;
  guia_id: string;
  paciente_nome: string;
  data_execucao: string;
  paciente_carteirinha: string;
  paciente_id: string;
  created_at: string;
}

export default function ExcelPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ExcelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchData();
  }, [debouncedSearchTerm, page, perPage]);

  const fetchData = async () => {
    try {
      setError(null);

      // Construir a URL base
      const baseUrl = `${API_URL}/excel`;

      // Construir os parâmetros
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      // Só adiciona o filtro se tiver 2 ou mais caracteres
      const cleanSearchTerm = debouncedSearchTerm?.trim() || '';
      if (cleanSearchTerm.length >= 2) {
        params.set('paciente_nome', cleanSearchTerm);
      }

      // Construir a URL final
      const url = `${baseUrl}?${params.toString()}`;
      console.log('URL completa:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      const result = await response.json();

      if (result.success) {
        const formattedData = result.data.registros.map((item: ExcelData) => ({
          ...item,
          data_execucao: formatDate(item.data_execucao),
          created_at: formatDate(item.created_at)
        }));
        setData(formattedData);
        setTotalPages(result.data.pagination.total_pages);
        setTotalRecords(result.data.pagination.total);
      } else {
        throw new Error('Falha ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao carregar os dados. Por favor, tente novamente.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Se a data já estiver no formato DD/MM/YYYY, retorna como está
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value || '';
    console.log('Novo termo de busca:', searchValue);
    setSearchTerm(searchValue);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerPage = parseInt(event.target.value, 10);
    setPerPage(newPerPage);
    setPage(1); // Reset to first page when changing items per page
  };

  const handleExportExcel = () => {
    try {
      // Preparar os dados para exportação
      const exportData = data.map(item => ({
        'Guia': item.guia_id,
        'Paciente': item.paciente_nome,
        'Data': item.data_execucao,
        'Número da carteirinha': item.paciente_carteirinha,
        'Id paciente': item.paciente_id,
        'Data importação': item.created_at,
      }));

      // Criar uma nova planilha
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');

      // Gerar o arquivo e fazer o download
      const fileName = `dados_excel_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar os dados para Excel');
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados da tabela?')) {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/clear-excel-data`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Erro ao limpar dados');
        }

        const result = await response.json();
        if (result.success) {
          setData([]);
          setTotalRecords(0);
          setTotalPages(1);
          setPage(1);
        } else {
          throw new Error(result.message || 'Erro ao limpar dados');
        }
      } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao limpar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload/excel`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.message) {
        toast({
          title: "Sucesso!",
          description: result.message,
        });
        fetchData(); // Recarrega os dados
      } else {
        throw new Error(result.detail || 'Erro ao fazer upload do arquivo');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo Excel. Tente novamente.",
        variant: "destructive",
      });
    }

    // Limpa o input de arquivo
    event.target.value = '';
  };

  const columns: Column[] = [
    {
      key: 'guia_id',
      label: 'Guia',
    },
    {
      key: 'paciente_nome',
      label: 'Paciente',
    },
    {
      key: 'data_execucao',
      label: 'Data',
    },
    {
      key: 'paciente_carteirinha',
      label: 'Carteirinha',
    },
    {
      key: 'paciente_id',
      label: 'Id paciente',
    },
    {
      key: 'created_at',
      label: 'Data importação',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6b342f]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[#8B4513]">Dados Importados do Excel</h1>
        <div className="flex gap-2">
          <button
            onClick={handleClearData}
            disabled={data.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
          >
            Limpar Tabela
          </button>
          <div className="relative">
            <input
              type="file"
              id="excelFileInput"
              className="hidden"
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
            />
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors"
              onClick={() => document.getElementById('excelFileInput')?.click()}
            >
              <FiUpload className="w-4 h-4" />
              Upload Excel
            </button>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={data.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Buscar por nome do paciente..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-[300px] pl-8"
              />
              <MagnifyingGlassIcon className="absolute left-2 h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Itens por página:</span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="border rounded p-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <SortableTable
              data={data}
              columns={columns}
            />
          </div>

          {data.length === 0 && !error && !loading && (
            <div className="text-center py-8 text-gray-500">
              Nenhum registro encontrado
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-4 rounded-md mt-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
