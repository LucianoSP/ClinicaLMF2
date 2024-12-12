'use client';

import { useEffect, useState } from 'react';
import { SortableTable, Column } from '@/components/SortableTable';
import { Button } from '@/components/ui/button';
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/Pagination';
import { FiCheck, FiX } from 'react-icons/fi';
import { API_URL } from '@/config/api';

interface Atendimento {
  id: number;
  numero_carteira: string;
  paciente_nome: string;
  numero_guia_principal?: string;
  data_execucao?: string;
}

interface Divergencia {
  id: number;
  guia_id: string;
  data_execucao: string;
  codigo_ficha: string;
  descricao_divergencia: string;
  beneficiario: string | null;
  status: string;
  data_registro: string;
}

interface AuditoriaResultado {
  total_protocolos: number;
  divergencias_encontradas: number;
}

export default function AuditoriaPage() {
  const [dados, setDados] = useState<Divergencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInicial, setDataInicial] = useState<Date>();
  const [dataFinal, setDataFinal] = useState<Date>();
  const [executandoAuditoria, setExecutandoAuditoria] = useState(false);
  const [resultadoAuditoria, setResultadoAuditoria] = useState<AuditoriaResultado | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<keyof Divergencia>('data_registro');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatarData = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const formatarDataExibicao = (dataString: string | undefined) => {
    if (!dataString) return '-';
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataString;
    }
  };

  const buscarDivergencias = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = `${API_URL}/auditoria/divergencias`;
      const params = new URLSearchParams({
        page: page.toString(),
        sort_field: sortField,
        sort_direction: sortDirection,
      });

      const response = await fetch(`${baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar divergências: ${response.status}`);
      }

      const result = await response.json();
      console.log('Divergências:', result);

      if (!result || !result.success || !Array.isArray(result.divergencias)) {
        throw new Error('Formato de resposta inválido');
      }

      // Processar as divergências para extrair o beneficiário
      const divergenciasProcessadas = result.divergencias.map(div => ({
        id: div.id,
        guia_id: div.guia_id,
        data_execucao: div.data_execucao,
        codigo_ficha: div.codigo_ficha,
        descricao_divergencia: div.descricao_divergencia,
        beneficiario: div.beneficiario,
        status: div.status,
        data_registro: div.data_registro
      }));

      setDados(divergenciasProcessadas);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (err) {
      console.error('Erro ao buscar divergências:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const iniciarAuditoria = async () => {
    setExecutandoAuditoria(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('data_inicial', formatarData(dataInicial));
      if (dataFinal) params.append('data_final', formatarData(dataFinal));

      console.log('Parâmetros da auditoria:', Object.fromEntries(params));

      // Construir a URL base
      const baseUrl = `${API_URL}/auditoria/iniciar/`;

      const response = await fetch(`${baseUrl}?${params}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao executar auditoria: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resultado da auditoria:', result);

      if (!result || !result.data) {
        throw new Error('Formato de resposta inválido');
      }

      setResultadoAuditoria(result.data);
      await buscarDivergencias();
    } catch (err) {
      console.error('Erro ao executar auditoria:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setExecutandoAuditoria(false);
    }
  };

  const handleSort = (field: keyof Divergencia) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const marcarResolvido = async (id: number) => {
    try {
      console.log('Marcando divergência como resolvida:', id);
      setError(null);

      // Construir a URL base
      const baseUrl = `${API_URL}/auditoria/divergencia/`;

      const response = await fetch(`${baseUrl}${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Resolvido' })
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro ao atualizar status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Resultado:', result);

      // Atualiza a lista localmente
      setDados(dados.map(d =>
        d.id === id ? { ...d, status: 'Resolvido' } : d
      ));

      // Atualiza o contador de divergências se necessário
      if (resultadoAuditoria) {
        setResultadoAuditoria({
          ...resultadoAuditoria,
          divergencias_encontradas: resultadoAuditoria.divergencias_encontradas - 1
        });
      }
    } catch (error) {
      console.error('Erro ao marcar como resolvido:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status da divergência');
    }
  };

  useEffect(() => {
    console.log('Data Inicial:', dataInicial);
    console.log('Data Final:', dataFinal);
  }, [dataInicial, dataFinal]);

  useEffect(() => {
    buscarDivergencias();
  }, [page, sortField, sortDirection]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6 text-[#6b342f]">Auditoria</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <Label>Data Inicial</Label>
            <DatePicker
              mode="single"
              selected={dataInicial}
              onSelect={setDataInicial}
              initialFocus
              className="w-[240px] bg-white border-gray-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Data Final</Label>
            <DatePicker
              mode="single"
              selected={dataFinal}
              onSelect={setDataFinal}
              initialFocus
              className="w-[240px] bg-white border-gray-200"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={iniciarAuditoria}
              disabled={executandoAuditoria || !dataInicial || !dataFinal}
              className="bg-[#b49d6b] text-white hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
            >
              {executandoAuditoria ? "Executando..." : "Iniciar Auditoria"}
            </Button>
          </div>
        </div>

        {resultadoAuditoria && (
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium mb-2">Resultado da Auditoria</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total de Protocolos</p>
                <p className="text-2xl font-semibold">{resultadoAuditoria.total_protocolos}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Divergências Encontradas</p>
                <p className="text-2xl font-semibold">{resultadoAuditoria.divergencias_encontradas}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-[#6b342f]">Divergências Encontradas</h2>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : error ? (
            <div className="text-red-600 py-4">Erro: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('data_registro')}>
                    Data Registro {sortField === 'data_registro' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('guia_id')}>
                    Número Guia {sortField === 'guia_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('data_execucao')}>
                    Data Execução {sortField === 'data_execucao' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.map((divergencia) => (
                  <TableRow key={divergencia.id}>
                    <TableCell>{formatarDataExibicao(divergencia.data_registro)}</TableCell>
                    <TableCell>{divergencia.guia_id}</TableCell>
                    <TableCell>{formatarDataExibicao(divergencia.data_execucao)}</TableCell>
                    <TableCell>{divergencia.descricao_divergencia}</TableCell>
                    <TableCell>{divergencia.beneficiario || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${divergencia.status === 'Resolvido'
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : 'bg-[#fef9c3] text-[#854d0e]'
                          }`}>
                          {divergencia.status === 'Resolvido' ? (
                            <>
                              <FiCheck className="w-3 h-3" />
                              {divergencia.status}
                            </>
                          ) : (
                            <>
                              <FiX className="w-3 h-3" />
                              {divergencia.status}
                            </>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {divergencia.status !== 'Resolvido' && (
                        <Button
                          onClick={() => marcarResolvido(divergencia.id)}
                          className="text-xs bg-[#b49d6b] hover:bg-[#a08b5f]"
                        >
                          Marcar como Resolvido
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}