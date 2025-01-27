'use client';

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
  id: number;
  status: string;
  error: string | null;
  processed_guides: number;
  total_guides: number;
  last_update: string;
}

interface CaptureStatus {
  status: string;
  total_guides: number;
  processed_guides: number;
  error: string | null;
  updated_at: string;
}

export default function UnimedPage() {
  const [guias, setGuias] = useState<GuiaProcessada[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataInicial, setDataInicial] = useState<Date>();
  const [dataFinal, setDataFinal] = useState<Date>();
  const [maxGuias, setMaxGuias] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string>();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);

  useEffect(() => {
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

          // Se o processo foi concluído ou falhou, atualizar estado
          if (['completed', 'failed'].includes(payload.new.status)) {
            setIsLoading(false);
            setTaskId(undefined);
            fetchGuias(); // Recarregar guias
          }
        }
      )
      .subscribe();

    // Carregar dados iniciais
    fetchInitialData();

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, []);

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
    <div className="container mx-auto py-10">
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
                  mode="single"
                  selected={dataInicial}
                  onSelect={setDataInicial}
                  initialFocus
                  locale={ptBR}
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
                  mode="single"
                  selected={dataFinal}
                  onSelect={setDataFinal}
                  initialFocus
                  locale={ptBR}
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
  );
}