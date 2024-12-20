// components/auditoria/EstatisticasCards.tsx
import { ClipboardList, AlertCircle, CheckCircle2, FileSignature, FileWarning, Clock, Files, FileCheck2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { formatarData } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Guias</CardTitle>
            <Files className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultadoAuditoria.total_protocolos}</div>
            <p className="text-xs text-muted-foreground">
              Guias analisadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fichas</CardTitle>
            <FileCheck2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultadoAuditoria.total_fichas}</div>
            <p className="text-xs text-muted-foreground">
              Fichas verificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Divergências</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultadoAuditoria.total_divergencias}</div>
            <p className="text-xs text-muted-foreground">
              Total de divergências encontradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resultadoAuditoria.total_divergencias > 0
                ? Math.round((resultadoAuditoria.total_resolvidas / resultadoAuditoria.total_divergencias) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Divergências resolvidas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções sem Ficha</CardTitle>
            <FileWarning className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultadoAuditoria.total_execucoes_sem_ficha}</div>
            <p className="text-xs text-muted-foreground">
              Fichas não encontradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Execução</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resultadoAuditoria.data_execucao 
                ? format(new Date(resultadoAuditoria.data_execucao), "dd/MM/yyyy HH:mm")
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {resultadoAuditoria.tempo_execucao}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}