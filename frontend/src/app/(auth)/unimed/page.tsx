'use client';

import { useState, useEffect } from 'react';
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

interface GuiaUnimed {
  numero_guia: string;
  carteira: string;
  nome_paciente: string;
  data_execucao: string;
  nome_profissional: string;
  status: string;
}

interface ScrapingStatus {
  status: string;
  message?: string;
  total_guides?: number;
  processed_guides?: number;
  error?: string;
  result?: {
    total_guides: number;
  };
}

export default function UnimedPage() {
  const [guias] = useState<GuiaUnimed[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataInicial, setDataInicial] = useState<Date>();
  const [dataFinal, setDataFinal] = useState<Date>();
  const [maxGuias, setMaxGuias] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string>();
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus>();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (taskId) {
      // Verifica imediatamente ao receber o taskId
      const checkStatus = async () => {
        try {
          const response = await fetch(`${API_URLS.SCRAPING_API}/status/${taskId}`);
          if (!response.ok) {
            throw new Error('Erro ao verificar status');
          }
          const data = await response.json();
          setScrapingStatus(data);

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            setIsLoading(false);
            setTaskId(undefined);
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error);
          clearInterval(interval);
          setIsLoading(false);
          setTaskId(undefined);
          setScrapingStatus({
            status: 'failed',
            error: 'Erro ao verificar status do processo'
          });
        }
      };

      // Chama imediatamente
      checkStatus();
      
      // Configura o intervalo para verificar a cada 2 segundos
      interval = setInterval(checkStatus, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [taskId]);

  const iniciarScraping = async () => {
    if (!dataInicial || !dataFinal) {
      alert('Por favor, selecione o intervalo de datas');
      return;
    }

    setIsLoading(true);
    setScrapingStatus(undefined);
    try {
      const response = await fetch(`${API_URLS.SCRAPING_API}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: format(dataInicial, 'dd/MM/yyyy'),
          end_date: format(dataFinal, 'dd/MM/yyyy'),
          max_guides: maxGuias
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar o scraping');
      }

      const data = await response.json();
      setTaskId(data.task_id);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar o scraping');
      setIsLoading(false);
    }
  };

  const getStatusMessage = (scrapingStatus: ScrapingStatus) => {
    if (!scrapingStatus) return 'Processando...';
    
    switch (scrapingStatus.status) {
      case 'starting':
        return 'Iniciando o processo...';
      case 'login':
        return 'Realizando login na Unimed...';
      case 'extraindo':
        return 'Extraindo guias do sistema...';
      case 'enviando':
        return `Enviando guias para o sistema (${scrapingStatus.processed_guides}/${scrapingStatus.total_guides})`;
      case 'completed':
        return 'Processo concluído com sucesso!';
      case 'failed':
        return `Erro: ${scrapingStatus.error}`;
      default:
        return 'Processando...';
    }
  };

  const columns: Column<GuiaUnimed>[] = [
    {
      key: 'numero_guia',
      label: 'Número da Guia',
    },
    {
      key: 'carteira',
      label: 'Carteira',
    },
    {
      key: 'nome_paciente',
      label: 'Paciente',
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
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          value === 'Pendente' && "bg-yellow-100 text-yellow-800",
          value === 'Enviado' && "bg-green-100 text-green-800",
          value === 'Erro' && "bg-red-100 text-red-800"
        )}>
          {value}
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
      guia.nome_paciente.toLowerCase().includes(searchTermLower) ||
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

      {isLoading && (
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-700 p-4 rounded-md">
            <p className="font-medium">{scrapingStatus ? getStatusMessage(scrapingStatus) : 'Iniciando processo...'}</p>
            
            {scrapingStatus?.status === 'enviando' && (
              <div className="mt-4 space-y-2">
                <div className="w-full bg-blue-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(scrapingStatus.processed_guides! / scrapingStatus.total_guides!) * 100}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-blue-600">
                  {scrapingStatus.processed_guides} de {scrapingStatus.total_guides} guias processadas
                </p>
              </div>
            )}

            {scrapingStatus?.status === 'failed' && (
              <div className="mt-2 text-red-600">
                <p className="text-sm">{scrapingStatus.error}</p>
              </div>
            )}

            {scrapingStatus?.status === 'completed' && (
              <div className="mt-2 text-green-600">
                <p className="text-sm">Total de guias processadas: {scrapingStatus.result?.total_guides}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative">
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
