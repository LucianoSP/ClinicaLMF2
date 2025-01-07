'use client';

import { useState, useEffect } from 'react';
import { AuditoriaHeader } from '@/components/auditoria/AuditoriaHeader';
import { EstatisticasCards } from '@/components/auditoria/EstatisticasCards';

import { TabelaDivergencias } from '@/components/auditoria/TabelaDivergencias';
import { Button } from '@/components/ui/button';
import { FileDown, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { API_URL } from '@/config/api';
import { AuditoriaResultado } from "@/types";
import { FiltrosAuditoria, FiltrosAuditoriaProps } from '@/components/auditoria/FiltrosAuditoria';

export interface Divergencia {
  id: string;
  numero_guia: string;
  data_execucao: string;
  data_atendimento: string;
  data_identificacao: string;
  codigo_ficha: string;
  paciente_nome: string;
  carteirinha: string;
  status: string;
  tipo_divergencia: string;
  descricao: string;
  observacoes?: string;
  resolvido_por?: string;
  data_resolucao?: string;
}

export default function AuditoriaPage() {

  const [dataInicial, setDataInicial] = useState<Date | null>(null);
  const [dataFinal, setDataFinal] = useState<Date | null>(null);
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [tipoDivergencia, setTipoDivergencia] = useState('todos');
  const [resultadoAuditoria, setResultadoAuditoria] = useState<AuditoriaResultado | null>(null);
  const [divergencias, setDivergencias] = useState<Divergencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { toast } = useToast();

  const formatarData = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy');
  };

  const handleAuditoria = async () => {
    setLoading(true);
    try {
      const requestBody = {
        data_inicio: formatarData(dataInicial),
        data_fim: formatarData(dataFinal)
      };

      const response = await fetch(`${API_URL}/auditoria/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Falha ao iniciar auditoria');
      }

      const result = await response.json();
      setResultadoAuditoria(result.data);
      await buscarDivergencias();

      toast({
        title: "Sucesso",
        description: "Auditoria iniciada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao iniciar auditoria:', error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar auditoria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarDivergencias = async () => {
    try {
      const params = new URLSearchParams();
      if (dataInicial) params.set('data_inicio', formatarData(dataInicial));
      if (dataFinal) params.set('data_fim', formatarData(dataFinal));
      if (statusFiltro !== 'todos') params.set('status', statusFiltro);
      if (tipoDivergencia !== 'todos') params.set('tipo_divergencia', tipoDivergencia);
      params.set('page', page.toString());
      params.set('per_page', perPage.toString());

      const response = await fetch(`${API_URL}/auditoria/divergencias?${params}`);

      if (!response.ok) {
        throw new Error('Falha ao buscar divergências');
      }

      const data = await response.json();
      setDivergencias(data.divergencias as Divergencia[] || []);
      setTotalPages(Math.ceil((data.total || 0) / perPage));
    } catch (error) {
      console.error('Erro ao buscar divergências:', error);
      toast({
        title: "Erro",
        description: "Falha ao buscar divergências",
        variant: "destructive",
      });
    }
  };

  const gerarRelatorio = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('data_inicio', formatarData(dataInicial));
      if (dataFinal) params.append('data_fim', formatarData(dataFinal));

      const response = await fetch(`${API_URL}/auditoria/relatorio?${params}`);

      if (!response.ok) {
        throw new Error('Falha ao gerar relatório');
      }

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
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const marcarResolvido = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/auditoria/divergencia/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolvida' }),
      });

      if (!response.ok) {
        throw new Error('Falha ao marcar como resolvida');
      }

      await buscarDivergencias();

      toast({
        title: "Sucesso",
        description: "Divergência marcada como resolvida",
      });
    } catch (error) {
      console.error('Erro ao marcar como resolvida:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar divergência como resolvida",
        variant: "destructive",
      });
    }
  };

  // Buscar divergências quando os filtros mudarem
  useEffect(() => {
    buscarDivergencias();
  }, [statusFiltro, tipoDivergencia, page, perPage]);

  // Buscar última auditoria ao carregar a página
  useEffect(() => {
    const buscarUltimaAuditoria = async () => {
      try {
        const response = await fetch(`${API_URL}/auditoria/ultima`);
        if (response.ok) {
          const { data } = await response.json();
          if (data) {
            setResultadoAuditoria(data);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar última auditoria:', error);
      }
    };
    buscarUltimaAuditoria();
  }, []);

  return (
    <div className="pl-1">
      <div className="bg-white rounded-lg shadow p-6 flex flex-col space-y-4">
        <AuditoriaHeader />
        <EstatisticasCards resultadoAuditoria={resultadoAuditoria} />
        <FiltrosAuditoria
          dataInicial={dataInicial}
          setDataInicial={setDataInicial}
          dataFinal={dataFinal}
          setDataFinal={setDataFinal}
          statusFiltro={statusFiltro}
          setStatusFiltro={setStatusFiltro}
          tipoDivergencia={tipoDivergencia}
          setTipoDivergencia={setTipoDivergencia}
          onAuditoria={handleAuditoria}
          onGerarRelatorio={gerarRelatorio}
          loading={loading}
        />

        <TabelaDivergencias
          divergencias={divergencias}
          loading={loading}
          onMarcarResolvido={marcarResolvido}
        />

        {divergencias.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <select
                className="border rounded p-1"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}