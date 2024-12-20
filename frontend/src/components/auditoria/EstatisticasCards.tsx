// components/auditoria/EstatisticasCards.tsx
import { FileText, AlertCircle, Calendar } from 'lucide-react';
import { formatarData } from '@/lib/utils';


interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    variant?: 'default' | 'warning';
}




interface AuditoriaResultado {
    total_protocolos: number;
    total_divergencias: number;
    data_execucao: string;
    data_inicial: string;
    data_final: string;
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    variant?: 'default' | 'warning';
}

const StatCard = ({ title, value, icon, variant = 'default' }: StatCardProps) => (
    <div className={`bg-white p-4 rounded-lg shadow-sm ${variant === 'warning' ? 'border-orange-200' : 'border-gray-200'
        } border`}>
        <div className="flex items-center gap-3">
            <div className={`${variant === 'warning' ? 'text-orange-500' : 'text-gray-500'
                }`}>
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <p className="text-2xl font-semibold">{value}</p>
            </div>
        </div>
    </div>
);

export const EstatisticasCards = ({ resultadoAuditoria }: { resultadoAuditoria: AuditoriaResultado }) => {
    if (!resultadoAuditoria) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                title="Total de Protocolos"
                value={resultadoAuditoria.total_protocolos}
                icon={<FileText className="w-6 h-6" />}
            />
            <StatCard
                title="Divergências Encontradas"
                value={resultadoAuditoria.total_divergencias}
                icon={<AlertCircle className="w-6 h-6" />}
                variant="warning"
            />
            <StatCard
                title="Período Inicial"
                value={formatarData(resultadoAuditoria.data_inicial)}
                icon={<Calendar className="w-6 h-6" />}
            />
            <StatCard
                title="Período Final"
                value={formatarData(resultadoAuditoria.data_final)}
                icon={<Calendar className="w-6 h-6" />}
            />
        </div>
    );
};