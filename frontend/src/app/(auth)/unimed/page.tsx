'use client';
import { UnimedDashboard } from "@/components/unimed/UnimedDashboard";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';  // Usando a instância existente do Supabase
import SortableTable, { Column } from '@/components/SortableTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { API_URLS } from '@/config';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Interfaces
interface GuiaProcessada {
  id: number;
  carteira: string;
  nome_beneficiario: string;
  codigo_procedimento: string;
  data_atendimento: string;
  data_execucao: string;
  numero_guia: string;
  biometria: string;
  nome_profissional: string;
  created_at: string;
}

interface ProcessingStatus {
  id: string;
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_guides: number;
  processed_guides: number;
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  started_at: string;
}

interface CaptureStatus {
  status: string;
  total_guides: number;
  processed_guides: number;
  error: string | null;
  updated_at: string;
}

interface ExecutionHistory {
  task_id: string;
  status: string;
  total_guides: number;
  processed_guides: number;
  created_at: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

interface HourlyMetrics {
  hour: number;
  total_executions: number;
  total_guides: number;
  processed_guides: number;
  errors: number;
}

export default function UnimedPage() {
  const [guias, setGuias] = useState<GuiaProcessada[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataInicial, setDataInicial] = useState<Date | undefined>(undefined);
  const [dataFinal, setDataFinal] = useState<Date | undefined>(undefined);
  const [maxGuias, setMaxGuias] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string>();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [hourlyMetrics, setHourlyMetrics] = useState<HourlyMetrics[]>([]);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Buscar último status
      const { data: lastStatus } = await supabase
        .from('processing_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastStatus) {
        setProcessingStatus(lastStatus);
      }

      // Buscar histórico de execuções das últimas 24h
      const { data: history } = await supabase
        .from('processing_status')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (history) {
        const processedHistory = history.map(item => ({
          ...item,
          duration_seconds: item.completed_at
            ? (new Date(item.completed_at).getTime() - new Date(item.created_at).getTime()) / 1000
            : null
        }));
        setExecutionHistory(processedHistory);

        // Processar métricas por hora
        const hourlyData = history.reduce((acc, curr) => {
          const hourDate = new Date(curr.created_at);
          const hour = hourDate.setMinutes(0, 0, 0);

          const existing = acc.find(x => x.hour === hour);

          if (existing) {
            existing.total_executions += 1;
            existing.total_guides += curr.total_guides || 0;
            existing.processed_guides += curr.processed_guides || 0;
            existing.errors += (curr.status === 'error' || curr.status === 'failed') ? 1 : 0;
          } else {
            acc.push({
              hour,
              total_executions: 1,
              total_guides: curr.total_guides || 0,
              processed_guides: curr.processed_guides || 0,
              errors: (curr.status === 'error' || curr.status === 'failed') ? 1 : 0
            });
          }
          return acc;
        }, [] as HourlyMetrics[]);

        // Ordenar por hora
        hourlyData.sort((a, b) => a.hour - b.hour);

        setHourlyMetrics(hourlyData);
      }
    };

    // Buscar dados iniciais
    fetchData();

    // Configurar intervalo para atualização
    const interval = setInterval(fetchData, 30000);

    // Configurar subscription para atualizações de status
    const channel = supabase
      .channel('scraping_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_status'
        },
        (payload) => {
          console.log('Status atualizado:', payload.new);
          setProcessingStatus(payload.new as ProcessingStatus);
          fetchData(); // Atualizar todas as métricas
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'iniciado':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'processing':
      case 'processando':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'completed':
      case 'finalizado':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'failed':
      case 'error':
      case 'erro':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'iniciado':
        return 'Iniciado';
      case 'processing':
      case 'processando':
        return 'Processando';
      case 'completed':
      case 'finalizado':
        return 'Finalizado';
      case 'failed':
      case 'error':
      case 'erro':
        return 'Erro';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatGuias = (processed: number, total: number) => {
    if (total === 0) return '-';
    return `${processed}/${total}`;
  };

  const formatDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  };

  const calculateSuccessRate = () => {
    if (!executionHistory.length) return 0;
    const total = executionHistory.length;
    const errors = executionHistory.filter(
      exec => exec.status === 'error' || exec.status === 'failed'
    ).length;
    return Math.round(((total - errors) / total) * 100);
  };

  const calculateTotalExecutions = () => {
    return executionHistory.length;
  };

  const calculateAverageGuides = () => {
    if (!executionHistory.length) return 0;
    const totalGuides = executionHistory.reduce((acc, curr) => acc + (curr.total_guides || 0), 0);
    return Math.round(totalGuides / executionHistory.length);
  };

  const calculateProgress = (processed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((processed / total) * 100);
  };

  const LastExecutionCard = () => {
    if (!processingStatus) return null;

    const isRunning = ['processing', 'processando'].includes(processingStatus.status.toLowerCase());
    const progress = calculateProgress(processingStatus.processed_guides, processingStatus.total_guides);

    return (
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Status Atual</CardTitle>
            <Badge variant="secondary" className={cn("capitalize", getStatusColor(processingStatus.status))}>
              {getStatusText(processingStatus.status)}
            </Badge>
          </div>
          <CardDescription>
            {isRunning ? 'Em execução' : 'Última execução'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-2 items-center">
                <span>Progresso:</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="flex gap-2 items-center">
                <span>Guias:</span>
                <span className="font-medium">{processingStatus.processed_guides}/{processingStatus.total_guides}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span>Duração:</span>
                <span className="font-medium">
                  {formatDuration(processingStatus.started_at, processingStatus.completed_at)}
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const ExecutionHistoryCard = () => {
    if (!executionHistory.length) return null;

    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Histórico de Execuções (24h)</CardTitle>
          <CardDescription>
            Últimas {executionHistory.length} execuções
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pl-6 pr-4 text-left w-1/4">Data</th>
                  <th className="py-2 px-3 text-left w-1/4">Duração</th>
                  <th className="py-2 px-3 text-right w-1/4">Guias</th>
                  <th className="py-2 pl-8 text-left w-1/4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {executionHistory.map((execution) => (
                  <tr
                    key={execution.task_id}
                    className="hover:bg-muted/50 group relative"
                    title={`Task ID: ${execution.task_id}`}
                  >
                    <td className="py-1.5 pl-6 pr-4 whitespace-nowrap">
                      {formatDate(execution.created_at)}
                    </td>
                    <td className="py-1.5 px-3">
                      {formatDuration(execution.started_at, execution.completed_at)}
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      {formatGuias(execution.processed_guides, execution.total_guides)}
                    </td>
                    <td className="py-1.5 pl-8">
                      <Badge variant="secondary" className={cn("capitalize", getStatusColor(execution.status))}>
                        {getStatusText(execution.status)}
                      </Badge>
                      <div className="hidden group-hover:block absolute left-0 top-full bg-popover text-popover-foreground p-2 rounded-md shadow-md z-10">
                        <span className="font-mono text-xs">ID: {execution.task_id}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="h-4"></div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const MetricsCard = () => {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Sucesso</CardTitle>
            <CardDescription>Últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {`${calculateSuccessRate()}%`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Execuções</CardTitle>
            <CardDescription>Últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateTotalExecutions()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Média de Guias</CardTitle>
            <CardDescription>Por execução</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateAverageGuides()}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const ChartCard = () => {
    if (!hourlyMetrics.length) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Execuções por Hora</CardTitle>
          <CardDescription>
            Últimas 24 horas
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getHours().toString().padStart(2, '0')}:00`;
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }}
                formatter={(value, name) => {
                  switch (name) {
                    case 'total_executions':
                      return [value, 'Execuções'];
                    case 'total_guides':
                      return [value, 'Guias'];
                    case 'errors':
                      return [value, 'Erros'];
                    default:
                      return [value, name];
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="total_executions"
                stroke="#8884d8"
                name="Execuções"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="total_guides"
                stroke="#82ca9d"
                name="Guias"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="errors"
                stroke="#ff7300"
                name="Erros"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="processed_guides"
                stroke="#82ca9d"
                name="Guias Processadas"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const fetchInitialData = async () => {
    try {
      // Buscar status atual
      const { data: statusData } = await supabase
        .from('processing_status')
        .select('*')
        .order('last_update', { ascending: false })
        .limit(1)
        .single();

      if (statusData) {
        setProcessingStatus(statusData);
        // Se houver um processo em andamento, atualizar UI
        if (statusData.status === 'processing') {
          setIsLoading(true);
        }
      }

      // Buscar guias
      await fetchGuias();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const fetchGuias = async () => {
    try {
      const { data, error } = await supabase
        .from('guias_processadas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuias(data || []);
    } catch (error) {
      console.error('Erro ao buscar guias:', error);
    }
  };

  const monitorCaptureProgress = async (taskId: string) => {
    try {
      const response = await fetch(`http://147.93.70.96/capture-status/${taskId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar status da captura');
      }

      const status = await response.json();
      setCaptureStatus(status);

      // Continua monitorando se ainda estiver em progresso
      if (status.status === 'processing') {
        setTimeout(() => monitorCaptureProgress(taskId), 2000);
      } else if (status.status === 'completed') {
        alert('Captura finalizada com sucesso!');
        await fetchGuias();
        setIsLoading(false);
        setCaptureStatus(null);
      } else if (status.status === 'error') {
        alert(`Erro na captura: ${status.error}`);
        setIsLoading(false);
        setCaptureStatus(null);
      }
    } catch (error) {
      console.error('Erro ao monitorar progresso:', error);
    }
  };

  const iniciarScraping = async () => {
    if (!dataInicial || !dataFinal) {
      alert('Por favor, selecione o intervalo de datas');
      return;
    }

    setIsLoading(true);
    setCaptureStatus(null);

    try {
      const response = await fetch('http://147.93.70.96/capture-guides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: format(dataInicial, 'dd/MM/yyyy'),
          end_date: format(dataFinal, 'dd/MM/yyyy'),
          max_guides: maxGuias || 1
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar o scraping');
      }

      const data = await response.json();
      if (data.task_id) {
        setTaskId(data.task_id);
        monitorCaptureProgress(data.task_id);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar a captura');
      setIsLoading(false);
    }
  };

  const getStatusMessage = (status: ProcessingStatus) => {
    switch (status.status) {
      case 'processing':
        return `Processando guias (${status.processed_guides}/${status.total_guides})`;
      case 'completed':
        return 'Processo concluído com sucesso!';
      case 'failed':
        return `Erro: ${status.error}`;
      default:
        return 'Processando...';
    }
  };

  const columns: Column<GuiaProcessada>[] = [
    {
      key: 'numero_guia',
      label: 'Número da Guia',
    },
    {
      key: 'carteira',
      label: 'Carteira',
    },
    {
      key: 'nome_beneficiario',
      label: 'Beneficiário',
    },
    {
      key: 'data_execucao',
      label: 'Data de Execução',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'nome_profissional',
      label: 'Profissional',
    },
    {
      key: 'biometria',
      label: 'Biometria',
      render: (value) => (
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          value ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
        )}>
          {value ? 'Com Biometria' : 'Sem Biometria'}
        </span>
      ),
    },
  ];

  const filteredGuias = guias.filter((guia) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      guia.numero_guia.toLowerCase().includes(searchTermLower) ||
      guia.carteira.toLowerCase().includes(searchTermLower) ||
      guia.nome_beneficiario.toLowerCase().includes(searchTermLower) ||
      guia.nome_profissional.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div >
      <Tabs defaultValue="dashboard" className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">Processamento Unimed</h1>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="guias">Guias</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Sucesso</CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {`${calculateSuccessRate()}%`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total de Execuções</CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateTotalExecutions()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Média de Guias</CardTitle>
                <CardDescription>Por execução</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateAverageGuides()}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <LastExecutionCard />
            <ExecutionHistoryCard />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ChartCard />
          </div>
        </TabsContent>

        <TabsContent value="guias">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Guias Unimed</h1>
            </div>

            <div className="flex flex-col space-y-4 mb-8">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataInicial && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicial ? format(dataInicial, "PPP", { locale: ptBR }) : <span>Data Inicial</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={dataInicial}
                        onSelect={(date: Date | undefined) => setDataInicial(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataFinal && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFinal ? format(dataFinal, "PPP", { locale: ptBR }) : <span>Data Final</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={dataFinal}
                        onSelect={(date: Date | undefined) => setDataFinal(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Quantidade máxima de guias"
                    value={maxGuias || ''}
                    onChange={(e) => setMaxGuias(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                onClick={iniciarScraping}
                disabled={!dataInicial || !dataFinal || isLoading}
                className="mt-auto"
              >
                {isLoading ? "Processando..." : "Iniciar Scraping"}
              </Button>
            </div>

            {/* Status do processamento do Supabase */}
            {isLoading && processingStatus && (
              <div className="space-y-4">
                <div className="bg-blue-50 text-blue-700 p-4 rounded-md">
                  <p className="font-medium">{getStatusMessage(processingStatus)}</p>

                  {processingStatus.status === 'processing' && (
                    <div className="mt-4 space-y-2">
                      <div className="w-full bg-blue-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${(processingStatus.processed_guides / processingStatus.total_guides) * 100}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-blue-600">
                        {processingStatus.processed_guides} de {processingStatus.total_guides} guias processadas
                      </p>
                    </div>
                  )}

                  {processingStatus.status === 'failed' && (
                    <div className="mt-2 text-red-600">
                      <p className="text-sm">{processingStatus.error}</p>
                    </div>
                  )}

                  {processingStatus.status === 'completed' && (
                    <div className="mt-2 text-green-600">
                      <p className="text-sm">Total de guias processadas: {processingStatus.total_guides}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status da captura do novo endpoint */}
            {isLoading && captureStatus && (
              <div className="space-y-4">
                <div className="bg-blue-50 text-blue-700 p-4 rounded-md">
                  <p className="font-medium">Capturando guias...</p>
                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${(captureStatus.processed_guides / captureStatus.total_guides) * 100}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-600">
                      {captureStatus.processed_guides} de {captureStatus.total_guides} guias processadas
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar guias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="rounded-md border">
              <SortableTable
                data={filteredGuias}
                columns={columns}
                loading={false}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}