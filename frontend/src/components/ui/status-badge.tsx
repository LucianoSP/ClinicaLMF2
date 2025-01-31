import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    'pendente': { 
      label: 'Pendente', 
      className: 'bg-yellow-100 text-yellow-800' 
    },
    'em_analise': { 
      label: 'Em Análise', 
      className: 'bg-blue-100 text-blue-800' 
    },
    'em_andamento': { 
      label: 'Em Andamento', 
      className: 'bg-blue-100 text-blue-800' 
    },
    'resolvida': { 
      label: 'Resolvida', 
      className: 'bg-green-100 text-green-800' 
    },
    'concluida': { 
      label: 'Concluída', 
      className: 'bg-green-100 text-green-800' 
    },
    'autorizada': { 
      label: 'Autorizada', 
      className: 'bg-green-100 text-green-800' 
    },
    'ativo': {
      label: 'Ativo',
      className: 'bg-green-100 text-green-800'
    },
    'ativa': {
      label: 'Ativa',
      className: 'bg-green-100 text-green-800'
    },
    'inativo': {
      label: 'Inativo',
      className: 'bg-red-100 text-red-800'
    },
    'vencida': {
      label: 'Vencida',
      className: 'bg-red-100 text-red-800'
    },
    'expirada': {
      label: 'Expirada',
      className: 'bg-red-100 text-red-800'
    },
    'cancelada': {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800'
    },
    'suspensa': {
      label: 'Suspensa',
      className: 'bg-gray-100 text-gray-800'
    }
  };

  const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
  const config = statusConfig[normalizedStatus] || { 
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
    className: 'bg-gray-100 text-gray-800' 
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
};
