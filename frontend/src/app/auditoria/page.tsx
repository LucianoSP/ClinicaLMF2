'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCheck, FiX } from 'react-icons/fi';
import { SortableTable, Column } from '@/components/SortableTable';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
//import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/Pagination';
import { API_URL } from '@/config/api';
import { useToast } from '@/components/ui/toasts';

interface execucao {
  id: number;
  numero_carteira: string;
  paciente_nome: string;
  numero_guia_principal?: string;
  data_execucao?: string;
}

interface Divergencia {
  id: string;  // Changed from number to string to handle UUIDs
  guia_id: string;
  data_execucao: string;
  codigo_ficha: string;
  descricao_divergencia: string;
  paciente_nome: string;  // alterado de beneficiario
  status: string;
  data_registro: string;
}

interface AuditoriaResultado {
  total_protocolos: number;
  total_divergencias: number;
  data_execucao: string;
  data_inicial: string;
  data_final: string;
  divergencias_por_tipo?: Record<string, number>;
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
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [limpandoDivergencias, setLimpandoDivergencias] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'resolvida'>('todos');
  const { toast } = useToast();

  const formatarData = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const formatarDataExibicao = (dataString: string | undefined) => {
    if (!dataString) return '-';
    try {
      // Pega só a parte antes do +
      const dataLimpa = dataString.split('+')[0];
      const data = new Date(dataLimpa.replace('T', ' '));
      return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataString;
    }
  };

  useEffect(() => {
    console.log('Buscando divergências...');
    buscarDivergencias();
  }, [page, statusFiltro]); // Adiciona statusFiltro como dependência

  const buscarDivergencias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '10');
      if (statusFiltro !== 'todos') {
        params.append('status', statusFiltro);
      }
      if (dataInicial) params.append('data_inicio', format(dataInicial, 'yyyy-MM-dd'));
      if (dataFinal) params.append('data_fim', format(dataFinal, 'yyyy-MM-dd'));

      const response = await fetch(`${API_URL}/auditoria/divergencias?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.divergencias) {
        const divergenciasFormatadas = data.divergencias.map((div: any) => ({
          ...div,
          // Dates are already formatted by the backend
          data_registro: div.data_registro || '-',
          data_execucao: div.data_execucao || '-'
        }));
        setDados(divergenciasFormatadas);
        setTotalPages(Math.ceil((data.total || 0) / 10));
        setError(null);
      } else {
        console.error('Resposta inválida:', data);
        throw new Error(data.detail || 'Erro ao buscar divergências');
      }
    } catch (error) {
      console.error('Erro ao buscar divergências:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar divergências');
      // Mantém os dados anteriores em caso de erro
      // setDados([]);
    } finally {
      setLoading(false);
    }
  };

  const iniciarAuditoria = async () => {
    setExecutandoAuditoria(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('data_inicio', format(dataInicial, 'yyyy-MM-dd'));
      if (dataFinal) params.append('data_fim', format(dataFinal, 'yyyy-MM-dd'));

      console.log('Parâmetros da auditoria:', Object.fromEntries(params));

      // Construir a URL base
      const baseUrl = `${API_URL}/auditoria/iniciar/`;

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
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

  const gerarRelatorio = async () => {
    setGerandoRelatorio(true);
    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('data_inicio', format(dataInicial, 'yyyy-MM-dd'));
      if (dataFinal) params.append('data_fim', format(dataFinal, 'yyyy-MM-dd'));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auditoria/relatorio?${params.toString()}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-auditoria-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso",
        });
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Falha ao gerar relatório');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const limparDivergencias = async () => {
    if (!confirm('Tem certeza que deseja limpar todas as divergências? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLimpandoDivergencias(true);
    try {
      const response = await fetch(`${API_URL}/auditoria/limpar-divergencias`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao limpar divergências');
      }

      const data = await response.json();

      // Atualiza os dados diretamente com o retorno da API
      if (data.dados) {
        setDados(data.dados.divergencias || []);
        setTotalPages(Math.ceil((data.dados.total || 0) / 10));
      } else {
        // Se não houver dados, limpa a tabela
        setDados([]);
        setTotalPages(1);
      }

      toast({
        title: "Sucesso!",
        description: "As divergências foram limpas com sucesso.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

    } catch (error) {
      console.error('Erro ao limpar divergências:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao limpar as divergências.",
        variant: "destructive",
      });
    } finally {
      setLimpandoDivergencias(false);
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

  const marcarResolvido = async (id: string) => {
    try {
      console.log('Marcando divergência como resolvida:', id);
      setError(null);

      const response = await fetch(`${API_URL}/auditoria/divergencia/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolvida' }),
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
        d.id === id ? { ...d, status: 'resolvida' } : d
      ));

      // Mostra mensagem de sucesso
      toast({
        title: "Sucesso",
        description: "Divergência marcada como resolvida",
      });

      // Busca os dados atualizados
      await buscarDivergencias();

    } catch (error) {
      console.error('Erro ao marcar como resolvido:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status da divergência');

      toast({
        title: "Erro",
        description: "Erro ao marcar divergência como resolvida",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('Data Inicial:', dataInicial);
    console.log('Data Final:', dataFinal);
  }, [dataInicial, dataFinal]);

  useEffect(() => {
    buscarDivergencias();
  }, [page, sortField, sortDirection]);

  useEffect(() => {
    const buscarUltimaAuditoria = async () => {
      try {
        const response = await fetch(`${API_URL}/auditoria/ultima`);
        console.log('Resposta da última auditoria:', response);
        if (response.ok) {
          const data = await response.json();
          console.log('Dados da última auditoria:', data);
          if (data.data) {
            setResultadoAuditoria(data.data);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar última auditoria:', error);
      }
    };
    buscarUltimaAuditoria();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6 text-[#6b342f]">Auditoria</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 items-center">
            <div className="space-y-4">
              <Label>Data Inicial</Label>
              <div className="mt-2">
                <DatePicker date={dataInicial} setDate={setDataInicial} />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Data Final</Label>
              <div className="mt-2">
                <DatePicker date={dataFinal} setDate={setDataFinal} />
              </div>
            </div>
          </div>
          <div>
            <Button
              onClick={iniciarAuditoria}
              disabled={executandoAuditoria || loading}
              className="bg-[#C5A880] text-white hover:bg-[#b49d6b]"
            >
              {executandoAuditoria ? 'Executando...' : 'Iniciar Auditoria'}
            </Button>
          </div>
        </div>

        {resultadoAuditoria && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Total de Protocolos</h3>
              <p className="text-2xl text-[#8B4513]">{resultadoAuditoria.total_protocolos}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Divergências Encontradas</h3>
              <p className="text-2xl text-[#8B4513]">{resultadoAuditoria.total_divergencias}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Data Inicial</h3>
              <p className="text-2xl text-[#8B4513]">{formatarData(dataInicial)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Data Final</h3>
              <p className="text-2xl text-[#8B4513]">{formatarData(dataFinal)}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filtrar por status:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="todos"
                    checked={statusFiltro === 'todos'}
                    onChange={(e) => setStatusFiltro(e.target.value as 'todos' | 'pendente' | 'resolvida')}
                    className="text-[#b49d6b]"
                  />
                  <span className="text-sm">Todos</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="pendente"
                    checked={statusFiltro === 'pendente'}
                    onChange={(e) => setStatusFiltro(e.target.value as 'todos' | 'pendente' | 'resolvida')}
                    className="text-[#b49d6b]"
                  />
                  <span className="text-sm">Pendentes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="resolvida"
                    checked={statusFiltro === 'resolvida'}
                    onChange={(e) => setStatusFiltro(e.target.value as 'todos' | 'pendente' | 'resolvida')}
                    className="text-[#b49d6b]"
                  />
                  <span className="text-sm">Resolvidas</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={gerarRelatorio}
              disabled={gerandoRelatorio || loading}
              className="bg-[#b49d6b] text-white hover:bg-[#a08b5f]"
            >
              {gerandoRelatorio ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
            <Button
              onClick={limparDivergencias}
              disabled={limpandoDivergencias || loading}
              className="bg-[#8B4513] text-white hover:bg-[#7a3d10]"
            >
              {limpandoDivergencias ? 'Limpando...' : 'Limpar Divergências'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : error ? (
            <div className="text-red-600 py-4">Erro: {error}</div>
          ) : (
            <SortableTable
              data={dados}
              columns={[
                {
                  key: 'data_registro',
                  label: 'Data Registro',
                  render: (value) => formatarDataExibicao(value)
                },
                {
                  key: 'guia_id',
                  label: 'Número Guia'
                },
                {
                  key: 'data_execucao',
                  label: 'Data Execução',
                  render: (value) => formatarDataExibicao(value)
                },
                {
                  key: 'descricao_divergencia',
                  label: 'Descrição'
                },
                {
                  key: 'paciente_nome',
                  label: 'Paciente',
                  render: (value) => value || '-'
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value) => (
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${
                        value === 'resolvida'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#fef9c3] text-[#854d0e]'
                        }`}>
                        {value === 'resolvida' ? (
                          <><FiCheck className="w-3 h-3" />Resolvida</>
                        ) : (
                          <><FiX className="w-3 h-3" />Pendente</>
                        )}
                      </span>
                    </div>
                  )
                }
              ]}
              actions={(item) => (
                item.status !== 'resolvida' && (
                  <button
                    onClick={() => marcarResolvido(item.id)}
                    className="text-[#15803d] hover:text-[#166534] transition-colors duration-200"
                    title="Marcar como Resolvida"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                )
              )}
            />
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