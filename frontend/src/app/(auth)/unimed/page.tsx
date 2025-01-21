'use client';

import { useState } from 'react';
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

export default function UnimedPage() {
  const [guias] = useState<GuiaUnimed[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataInicial, setDataInicial] = useState<Date>();
  const [dataFinal, setDataFinal] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);

  const columns: Column[] = [
    {
      key: 'numero_guia',
      header: 'Número da Guia',
    },
    {
      key: 'carteira',
      header: 'Carteira',
    },
    {
      key: 'nome_paciente',
      header: 'Paciente',
    },
    {
      key: 'data_execucao',
      header: 'Data Execução',
    },
    {
      key: 'nome_profissional',
      header: 'Profissional',
    },
    {
      key: 'status',
      header: 'Status',
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

  const iniciarScraping = async () => {
    if (!dataInicial || !dataFinal) {
      alert('Por favor, selecione o intervalo de datas');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URLS.SCRAPING_API}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: format(dataInicial, 'dd/MM/yyyy'),
          end_date: format(dataFinal, 'dd/MM/yyyy'),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar o scraping');
      }

      const data = await response.json();
      alert('Scraping iniciado com sucesso! ID da tarefa: ' + data.task_id);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar o scraping');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Guias Unimed</h1>
      </div>

      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dataInicial && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicial ? format(dataInicial, "dd/MM/yyyy") : <span>Selecione a data</span>}
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

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dataFinal && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFinal ? format(dataFinal, "dd/MM/yyyy") : <span>Selecione a data</span>}
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

          <Button 
            onClick={iniciarScraping} 
            disabled={!dataInicial || !dataFinal || isLoading}
            className="mt-auto"
          >
            {isLoading ? "Iniciando..." : "Iniciar Scraping"}
          </Button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar guias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
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
