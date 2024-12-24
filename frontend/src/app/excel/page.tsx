'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { FiDownload, FiUpload, FiTrash2 } from 'react-icons/fi';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SortableTable, Column } from '@/components/SortableTable';
import { useDebounce } from '@/hooks/useDebounce';
import Pagination from '@/components/Pagination';
import { API_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 1. Atualizar interface
interface ExcelData {
  id: string;
  numero_guia: string;
  paciente_nome: string;
  data_execucao: string;
  paciente_carteirinha: string;
  paciente_id: string;
  codigo_ficha: string | null;
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
        console.log('Dados da API:', result.data.registros);
        const formattedData = result.data.registros.map((item: any) => ({
          ...item,
          numero_guia: item.guia_id, // Mapear guia_id para numero_guia
          data_execucao: formatDate(item.data_execucao),
          created_at: formatDate(item.created_at)
        }));
        console.log('Dados formatados:', formattedData);
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
        const response = await fetch(`${API_URL}/clear-execucoes`, {  // Mudou de /clear-excel-data para /clear-execucoes
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

  const columns: Column<ExcelData>[] = [
    {
      key: 'numero_guia',
      label: 'Guia',
      render: (item: ExcelData) => item.numero_guia
    },
    {
      key: 'paciente_nome',
      label: 'Paciente',
      render: (item: ExcelData) => item.paciente_nome
    },
    {
      key: 'data_execucao',
      label: 'Data',
      render: (item: ExcelData) => item.data_execucao
    },
    {
      key: 'paciente_carteirinha',
      label: 'Carteirinha',
      render: (item: ExcelData) => item.paciente_carteirinha
    },
    {
      key: 'paciente_id',
      label: 'Id paciente',
      render: (item: ExcelData) => item.paciente_id
    },
    {
      key: 'created_at',
      label: 'Data importação',
      render: (item: ExcelData) => item.created_at
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
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-[#8B4513]">Dados Importados do Excel</h2>
            <div className="flex gap-2">
              <input
                type="file"
                id="excelFileInput"
                className="hidden"
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('excelFileInput')?.click()}
                className="gap-2"
              >
                <FiUpload className="h-4 w-4" />
                Upload Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={data.length === 0}
                className="gap-2"
              >
                <FiDownload className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleClearData}
                disabled={data.length === 0}
                className="gap-2"
              >
                <FiTrash2 className="h-4 w-4" />
                Limpar Tabela
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar por nome do paciente..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 w-[300px]"
                />
                <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Itens por página:</span>
                <select
                  value={perPage}
                  onChange={handlePerPageChange}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <SortableTable<ExcelData>
              data={data}
              columns={columns}
            />
          </div>

          {data.length === 0 && !error && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-center">
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
