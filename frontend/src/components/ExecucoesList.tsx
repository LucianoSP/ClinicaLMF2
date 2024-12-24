'use client';

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
import { Button } from '@/components/ui/button';

interface Execucao {
  id: string;
  numero_guia: string;
  paciente_nome: string;
  data_execucao: string;
  paciente_carteirinha: string;
  paciente_id: string;
  quantidade_sessoes: number;
  created_at: string;
}

const ExecucoesList = () => {
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchExecucoes = async () => {
    setLoading(true);
    try {
      setError(null);

      const baseUrl = `${API_URL}/excel`;
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      const cleanSearchTerm = debouncedSearchTerm?.trim() || '';
      if (cleanSearchTerm.length >= 2) {
        params.set('paciente_nome', cleanSearchTerm);
      }

      const url = `${baseUrl}?${params.toString()}`;
      console.log('Buscando execuções:', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao carregar execuções');
      }

      const result = await response.json();
      console.log('Resultado da busca:', result);

      if (result.success) {
        console.log('Execuções recebidas:', result.data.registros);
        const formattedExecucoes = (result.data.registros || []).map((execucao: Execucao) => ({
          ...execucao,
          data_execucao: formatDate(execucao.data_execucao.split('T')[0])
        }));
        setExecucoes(formattedExecucoes);
        setTotalPages(result.data.pagination.total_pages);
        setTotalRecords(result.data.pagination.total);
      } else {
        throw new Error('Falha ao carregar dados');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao carregar execuções');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Efeito disparado. Termo de busca:', debouncedSearchTerm);
    fetchExecucoes();
  }, [debouncedSearchTerm, page, perPage]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerPage = parseInt(event.target.value, 10);
    setPerPage(newPerPage);
    setPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value || '';
    console.log('Novo termo de busca:', searchValue);
    setSearchTerm(searchValue);
    setPage(1);
  };

  const handleClear = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todas as execuções?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/execucoes/limpar`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao limpar execuções');
      }

      setExecucoes([]);
      setTotalRecords(0);
      setTotalPages(1);
      setPage(1);
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao limpar execuções');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = execucoes.map(item => ({
        'DATA': item.data_execucao,
        'CARTEIRINHA': item.paciente_carteirinha,
        'PACIENTE': item.paciente_nome,
        'GUIA': item.numero_guia,
        'CÓDIGO DA FICHA': item.id,
        'PACIENTE ID': item.paciente_id,
        'ASSINATURA': item.quantidade_sessoes
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Execucoes');

      const fileName = `execucoes_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar os dados para Excel');
    }
  };

  const columns: Column<Execucao>[] = [
    { key: 'data_execucao', label: 'Data' },
    { key: 'paciente_carteirinha', label: 'Carteirinha' },
    { key: 'paciente_nome', label: 'Paciente' },
    { key: 'paciente_id', label: 'Paciente Id' },
    { key: 'numero_guia', label: 'Guia' },
    { key: 'id', label: 'Código da Ficha' },
    {
      key: 'quantidade_sessoes',
      label: 'Quantidade de Sessões',
      render: (value: number) => value.toString()
    }
  ];

  return (
    <div className="space-y-4">
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
            onClick={handleExportExcel}
            className="gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            className="gap-2"
          >
            <FiTrash2 className="h-4 w-4" />
            Limpar Tabela
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchExecucoes()}
            className="gap-2"
          >
            <FiRotateCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <SortableTable
          data={execucoes}
          columns={columns}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecucoesList;
