// components/auditoria/EstatisticasCards.tsx
import { FileText, AlertCircle, Calendar, FileCheck, FileX, Clock } from 'lucide-react';
import { formatarData } from '@/lib/utils';

interface AuditoriaResultado {
  total_protocolos: number;
  total_divergencias: number;
  total_resolvidas: number;
  total_pendentes: number;
  total_fichas_sem_assinatura: number;
  total_execucoes_sem_ficha: number;
  data_execucao: string;
  data_inicial: string;
  data_final: string;
  tempo_execucao?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  subtitle?: string;
}

const StatCard = ({ title, value, icon, variant = 'default', subtitle }: StatCardProps) => {
  const variantStyles = {
    default: 'bg-white text-gray-800',
    warning: 'bg-yellow-50 text-yellow-800',
    success: 'bg-green-50 text-green-800',
    danger: 'bg-red-50 text-red-800'
  };

  return (
    <div className={`p-6 rounded-lg shadow-sm ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs mt-1 opacity-70">{subtitle}</p>
          )}
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
};

export const EstatisticasCards = ({ resultadoAuditoria }: { resultadoAuditoria: AuditoriaResultado | null }) => {
  if (!resultadoAuditoria) return null;

  const percentualResolvido = resultadoAuditoria.total_divergencias > 0 
    ? Math.round((resultadoAuditoria.total_resolvidas / resultadoAuditoria.total_divergencias) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total de Protocolos"
        value={resultadoAuditoria.total_protocolos}
        icon={<FileText className="w-6 h-6" />}
        subtitle="Protocolos analisados"
      />
      <StatCard
        title="Divergências Encontradas"
        value={resultadoAuditoria.total_divergencias}
        icon={<AlertCircle className="w-6 h-6" />}
        variant={resultadoAuditoria.total_divergencias > 0 ? "warning" : "success"}
        subtitle={`${resultadoAuditoria.total_pendentes} pendentes`}
      />
      <StatCard
        title="Divergências Resolvidas"
        value={`${percentualResolvido}%`}
        icon={<FileCheck className="w-6 h-6" />}
        variant="success"
        subtitle={`${resultadoAuditoria.total_resolvidas} de ${resultadoAuditoria.total_divergencias}`}
      />
      <StatCard
        title="Fichas sem Assinatura"
        value={resultadoAuditoria.total_fichas_sem_assinatura}
        icon={<FileX className="w-6 h-6" />}
        variant="danger"
        subtitle="Necessitam regularização"
      />
      <StatCard
        title="Execuções sem Ficha"
        value={resultadoAuditoria.total_execucoes_sem_ficha}
        icon={<AlertCircle className="w-6 h-6" />}
        variant="warning"
        subtitle="Fichas não encontradas"
      />
      <StatCard
        title="Última Execução"
        value={formatarData(new Date(resultadoAuditoria.data_execucao), true)}
        icon={<Clock className="w-6 h-6" />}
        subtitle={resultadoAuditoria.tempo_execucao || ""}
      />
    </div>
  );
};