// components/auditoria/EstatisticasCards.tsx
import { ClipboardList, AlertCircle, CheckCircle2, FileSignature, FileWarning, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatarData } from '@/lib/utils';

interface EstatisticasProps {
  resultadoAuditoria?: {
    total_protocolos: number;
    total_divergencias: number;
    total_resolvidas: number;
    total_pendentes: number;
    total_fichas_sem_assinatura: number;
    total_execucoes_sem_ficha: number;
    total_fichas: number;
    data_execucao: string;
    tempo_execucao?: string;
  };
}

export function EstatisticasCards({ resultadoAuditoria }: EstatisticasProps) {
  if (!resultadoAuditoria) {
    return null;
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 rounded-lg shadow-sm bg-white text-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Total de Guias</p>
              <p className="text-2xl font-semibold mt-1">{resultadoAuditoria.total_protocolos}</p>
              <p className="text-xs mt-1 opacity-70">
                {resultadoAuditoria.total_fichas} fichas verificadas
              </p>
            </div>
            <div className="opacity-80"><ClipboardList className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="p-6 rounded-lg shadow-sm bg-yellow-50 text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Divergências Encontradas</p>
              <p className="text-2xl font-semibold mt-1">{resultadoAuditoria.total_divergencias}</p>
              <p className="text-xs mt-1 opacity-70">{resultadoAuditoria.total_pendentes} pendentes</p>
            </div>
            <div className="opacity-80"><AlertCircle className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="p-6 rounded-lg shadow-sm bg-green-50 text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Divergências Resolvidas</p>
              <p className="text-2xl font-semibold mt-1">
                {resultadoAuditoria.total_divergencias > 0
                  ? Math.round((resultadoAuditoria.total_resolvidas / resultadoAuditoria.total_divergencias) * 100)
                  : 0}%
              </p>
              <p className="text-xs mt-1 opacity-70">
                {resultadoAuditoria.total_resolvidas} de {resultadoAuditoria.total_divergencias}
              </p>
            </div>
            <div className="opacity-80"><CheckCircle2 className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="p-6 rounded-lg shadow-sm bg-red-50 text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Fichas sem Assinatura</p>
              <p className="text-2xl font-semibold mt-1">{resultadoAuditoria.total_fichas_sem_assinatura}</p>
              <p className="text-xs mt-1 opacity-70">Necessitam regularização</p>
            </div>
            <div className="opacity-80"><FileSignature className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
        <div className="p-6 rounded-lg shadow-sm bg-yellow-50 text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Execuções sem Ficha</p>
              <p className="text-2xl font-semibold mt-1">{resultadoAuditoria.total_execucoes_sem_ficha}</p>
              <p className="text-xs mt-1 opacity-70">Fichas não encontradas</p>
            </div>
            <div className="opacity-80"><FileWarning className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="p-6 rounded-lg shadow-sm bg-white text-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Última Execução</p>
              <p className="text-2xl font-semibold mt-1">
                {resultadoAuditoria.data_execucao 
                  ? format(new Date(resultadoAuditoria.data_execucao), "dd/MM/yyyy HH:mm")
                  : "-"}
              </p>
              <p className="text-xs mt-1 opacity-70">{resultadoAuditoria.tempo_execucao}</p>
            </div>
            <div className="opacity-80"><Clock className="w-6 h-6" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}