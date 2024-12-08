'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { FiDownload } from 'react-icons/fi';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SortableTable, Column } from '@/components/SortableTable';
import { useDebounce } from '@/hooks/useDebounce';
import Pagination from '@/components/Pagination';
import { API_URL } from '@/config/api';

interface ExcelData {
  id: number;
  idGuia: string;
  nomePaciente: string;
  dataExec: string;
  carteirinha: string;
  idPaciente: string;
  created_at: string;
}

export default function ExcelPage() {
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
      const baseUrl = `${API_URL}/excel/`;

      // Construir os parâmetros
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      // Só adiciona o filtro se tiver 2 ou mais caracteres
      const cleanSearchTerm = debouncedSearchTerm?.trim() || '';
      if (cleanSearchTerm.length >= 2) {
        params.set('nome_beneficiario', cleanSearchTerm);
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
          dataExec: formatDate(item.dataExec),
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
        'Número da guia': item.idGuia,
        'Beneficiário': item.nomePaciente,
        'Data': item.dataExec,
        'Carteira': item.carteirinha,
        'Id paciente': item.idPaciente,
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
        const response = await fetch('http://localhost:5000/clear-excel-data', {
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

  const columns: Column<ExcelData>[] = [
    { key: 'idGuia', label: 'Número da guia' },
    { key: 'nomePaciente', label: 'Beneficiário' },
    { key: 'dataExec', label: 'Data' },
    { key: 'carteirinha', label: 'Carteira' },
    { key: 'idPaciente', label: 'Id paciente' },
    { key: 'created_at', label: 'Data importação' },
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#6b342f]">Dados Importados do Excel</h1>

        <div className="flex gap-2">
          <button
            onClick={handleClearData}
            disabled={data.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
          >
            Limpar Tabela
          </button>
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

      {/* Barra de busca e seletor de itens por página */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por nome do beneficiário..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b342f] focus:border-transparent"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="perPage" className="text-sm text-gray-600">
              Itens por página:
            </label>
            <select
              id="perPage"
              value={perPage}
              onChange={handlePerPageChange}
              className="border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#6b342f] focus:border-transparent"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <SortableTable
          data={data}
          columns={columns}
        />
      </div>

      {/* Paginação */}
      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Total de registros */}
      <div className="mt-4 text-sm text-gray-600 text-right">
        Total de registros: {totalRecords}
      </div>
    </div>
  );
}
