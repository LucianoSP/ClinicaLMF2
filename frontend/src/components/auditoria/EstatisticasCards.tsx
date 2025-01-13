import React from 'react';
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  FileSignature,
  Calendar,
  Clock,
  Files,
  FileCheck2,
  AlertTriangle,
  FileWarning,
  FileX,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';

// Type definition for audit data
interface AuditoriaData {
  total_protocolos: number;
  total_divergencias: number;
  total_fichas: number;
  total_execucoes: number;
  total_resolvidas: number;
  data_execucao: string;
  tempo_execucao: string;
  divergencias_por_tipo: {
    execucao_sem_sessao: number;
    sessao_sem_execucao: number;
    data_divergente: number;
    sessao_sem_assinatura: number;
    guia_vencida: number;
    quantidade_excedida: number;
    duplicidade: number;
  };
}

const EstatisticasCards = ({ resultadoAuditoria }: { resultadoAuditoria: AuditoriaData | null }) => {
  if (!resultadoAuditoria) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Nenhuma auditoria realizada ainda.</p>
      </div>
    );
  }

  const {
    total_divergencias = 0,
    total_resolvidas = 0,
    total_fichas = 0,
    total_execucoes = 0,
    data_execucao,
    tempo_execucao,
    divergencias_por_tipo = {}
  } = resultadoAuditoria;

  const {
    execucao_sem_sessao = 0,
    sessao_sem_execucao = 0,
    data_divergente = 0,
    sessao_sem_assinatura = 0,
    guia_vencida = 0,
    quantidade_excedida = 0,
    duplicidade = 0
  } = divergencias_por_tipo || {};

  return (
    <div className="grid gap-6">
      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Execuções */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Total de Execuções</h3>
              <p className="text-2xl font-bold mt-1">{total_execucoes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Execuções analisadas</p>
            </div>
            <Files className="text-muted-foreground h-5 w-5" />
          </div>
        </div>

        {/* Total de Fichas */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Total de Fichas</h3>
              <p className="text-2xl font-bold mt-1">{total_fichas}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fichas verificadas</p>
            </div>
            <FileCheck2 className="text-muted-foreground h-5 w-5" />
          </div>
        </div>

        {/* Resolvidas */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Resolvidas</h3>
              <p className="text-2xl font-bold mt-1">
                {total_divergencias > 0
                  ? Math.round((total_resolvidas / total_divergencias) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Divergências resolvidas</p>
            </div>
            <CheckCircle2 className="text-muted-foreground h-5 w-5" />
          </div>
        </div>

        {/* Última Execução */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Última Execução</h3>
              <p className="text-2xl font-bold mt-1">
                {data_execucao ? format(new Date(data_execucao), "dd/MM/yyyy") : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tempo_execucao ? `Há ${tempo_execucao}` : ""}
              </p>
            </div>
            <Clock className="text-muted-foreground h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Cards de Divergências */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Divergências */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Divergências</h3>
              <p className="text-2xl font-bold mt-1">{total_divergencias}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total de divergências encontradas</p>
            </div>
            <AlertTriangle className="text-red-500 h-5 w-5" />
          </div>
        </div>

        {/* Sessões sem Assinatura */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Sessões sem Assinatura</h3>
              <p className="text-2xl font-bold mt-1">{sessao_sem_assinatura}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sessões executadas sem assinatura</p>
            </div>
            <FileSignature className="text-red-500 h-5 w-5" />
          </div>
        </div>

        {/* Execuções sem Ficha */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Execuções sem Ficha</h3>
              <p className="text-2xl font-bold mt-1">{execucao_sem_sessao}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Execuções sem sessão correspondente</p>
            </div>
            <FileWarning className="text-red-500 h-5 w-5" />
          </div>
        </div>

        {/* Fichas sem Execução */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Fichas sem Execução</h3>
              <p className="text-2xl font-bold mt-1">{sessao_sem_execucao}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Execuções não encontradas</p>
            </div>
            <FileX className="text-red-500 h-5 w-5" />
          </div>
        </div>

        {/* Datas Divergentes */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Datas Divergentes</h3>
              <p className="text-2xl font-bold mt-1">{data_divergente}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Datas não correspondem</p>
            </div>
            <Calendar className="text-red-500 h-5 w-5" />
          </div>
        </div>

        {/* Guias Vencidas */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Guias Vencidas</h3>
              <p className="text-2xl font-bold mt-1">{guia_vencida}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Guias expiradas</p>
            </div>
            <AlertCircle className="text-red-500 h-5 w-5" />
          </div>
        </div>

        {/* Qtd. Excedida */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Qtd. Excedida</h3>
              <p className="text-2xl font-bold mt-1">{quantidade_excedida}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Quantidade excedida na guia</p>
            </div>
            <ClipboardList className="text-red-500 h-5 w-5" />
          </div>
        </div>

        {/* Duplicidades */}
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Duplicidades</h3>
              <p className="text-2xl font-bold mt-1">{duplicidade}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Execuções duplicadas detectadas</p>
            </div>
            <Copy className="text-red-500 h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export { EstatisticasCards };