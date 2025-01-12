'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { FiDownload, FiUpload, FiTrash2 } from 'react-icons/fi';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SortableTable, { Column } from '@/components/SortableTable';
import { useDebounce } from '@/hooks/useDebounce';
import Pagination from '@/components/Pagination';
import { API_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExcelData {
  id: number;
  numero_guia: string;
  paciente_nome: string;
  data_execucao: string;
  paciente_carteirinha: string;
  paciente_id: string;
  codigo_ficha: string;
  usuario_executante: string | null;
  created_at: string;
  updated_at: string | null;
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
        const formattedData = result.data.registros.map((item: any) => ({
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
        'Guia': item.numero_guia,
        'Paciente': item.paciente_nome,
        'Data Execução': item.data_execucao,
        'Carteirinha': item.paciente_carteirinha,
        'Código Ficha': item.codigo_ficha || '',
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
        setError(null);

        const response = await fetch(`${API_URL}/excel/limpar`, {
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
          toast({
            title: "Sucesso",
            description: "Dados limpos com sucesso!",
          });
        } else {
          throw new Error(result.detail || 'Erro ao limpar dados');
        }
      } catch (error) {
        console.error('Erro ao limpar:', error);
        toast({
          title: "Erro",
          description: "Erro ao limpar os dados. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/excel/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Arquivo Excel importado com sucesso!",
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

  const columns: Column<ExcelData>[] = [
    {
      key: 'numero_guia',
      label: 'Guia',
      className: 'py-1.5'
    },
    {
      key: 'paciente_nome',
      label: 'Paciente',
      className: 'py-1.5'
    },
    {
      key: 'data_execucao',
      label: 'Data Execução',
      className: 'py-1.5'
    },
    {
      key: 'paciente_carteirinha',
      label: 'Carteirinha',
      className: 'py-1.5'
    },
    {
      key: 'codigo_ficha',
      label: 'Código Ficha',
      className: 'py-1.5'
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
    <div className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold text-[#6b342f]">Dados Importados do Excel</h1>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome do paciente..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          </div>

          <select
            value={perPage}
            onChange={handlePerPageChange}
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => document.getElementById('fileInput')?.click()}
            className="gap-2"
          >
            <FiUpload className="h-4 w-4" />
            Upload Excel
          </Button>
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls"
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

          <Button
            variant="outline"
            onClick={handleClearData}
            className="gap-2"
          >
            <FiTrash2 className="h-4 w-4" />
            Limpar Tabela
          </Button>
        </div>
      </div>

      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="rounded-md border">
            <SortableTable
              data={data}
              columns={columns}
            />
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
