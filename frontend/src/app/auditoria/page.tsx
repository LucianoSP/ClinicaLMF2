'use client';

import { useEffect, useState } from 'react';
import { SortableTable, Column } from '@/components/SortableTable';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
//import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/Pagination';
import { FiCheck, FiX } from 'react-icons/fi';
import { API_URL } from '@/config/api';
import { useToast } from '@/components/ui/toasts';

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

  const buscarDivergencias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '10');
      if (dataInicial) params.append('data_inicio', format(dataInicial, 'yyyy-MM-dd'));
      if (dataFinal) params.append('data_fim', format(dataFinal, 'yyyy-MM-dd'));

      const response = await fetch(`${API_URL}/auditoria/divergencias?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const divergenciasFormatadas = data.divergencias.map(div => ({
          ...div,
          data_registro: format(new Date(div.data_registro.split('+')[0]), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          data_execucao: format(new Date(div.data_execucao.split('+')[0]), 'dd/MM/yyyy HH:mm', { locale: ptBR })
        }));
        setDados(divergenciasFormatadas);
        setTotalPages(Math.ceil(data.total / 10));
      } else {
        throw new Error(data.detail || 'Erro ao buscar divergências');
      }
    } catch (error) {
      console.error('Erro ao buscar divergências:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
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
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <Label>Data Inicial</Label>
              <DatePicker
                date={dataInicial}
                setDate={setDataInicial}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Data Final</Label>
              <DatePicker
                date={dataFinal}
                setDate={setDataFinal}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={limparDivergencias}
              disabled={limpandoDivergencias}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
            >
              {limpandoDivergencias ? 'Limpando...' : 'Limpar Divergências'}
            </Button>
            <Button
              onClick={iniciarAuditoria}
              disabled={executandoAuditoria}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
            >
              {executandoAuditoria ? 'Executando...' : 'Iniciar Auditoria'}
            </Button>
            <Button
              onClick={gerarRelatorio}
              disabled={gerandoRelatorio}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#b49d6b] text-white rounded hover:bg-[#a08b5f] transition-colors disabled:opacity-50"
            >
              {gerandoRelatorio ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </div>

        {resultadoAuditoria && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total de Protocolos</h3>
              <p className="mt-1 text-2xl font-semibold text-[#b49d6b]">{resultadoAuditoria.total_protocolos}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Divergências Encontradas</h3>
              <p className="mt-1 text-2xl font-semibold text-[#b49d6b]">{resultadoAuditoria.total_divergencias}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Última Verificação</h3>
              <p className="mt-1 text-2xl font-semibold text-[#b49d6b]">
                {formatarDataExibicao(resultadoAuditoria.data_execucao)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Período Analisado</h3>
              <p className="mt-1 text-lg font-medium text-[#b49d6b]">
                {formatarDataExibicao(resultadoAuditoria.data_inicial)} - {formatarDataExibicao(resultadoAuditoria.data_final)}
              </p>
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
          <h2 className="text-lg font-medium mb-4 text-[#6b342f]">Divergências Encontradas</h2>
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
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${value === 'Resolvido'
                        ? 'bg-[#dcfce7] text-[#15803d]'
                        : 'bg-[#fef9c3] text-[#854d0e]'
                        }`}>
                        {value === 'Resolvido' ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            {value}
                          </>
                        ) : (
                          <>
                            <FiX className="w-3 h-3" />
                            {value}
                          </>
                        )}
                      </span>
                    </div>
                  )
                }
              ]}
              actions={(item) => (
                item.status !== 'Resolvido' && (
                  <Button
                    onClick={() => marcarResolvido(item.id)}
                    className="text-xs bg-[#f0e6d3] hover:bg-[#e6dbc8] text-[#6b342f]"
                  >
                    Marcar como Resolvido
                  </Button>
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