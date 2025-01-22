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
    'resolvida': { 
      label: 'Resolvida', 
      className: 'bg-green-100 text-green-800' 
    },
    'ativo': {
      label: 'Ativo',
      className: 'bg-green-100 text-green-800'
    },
    'inativo': {
      label: 'Inativo',
      className: 'bg-red-100 text-red-800'
    }
  };

  const config = statusConfig[status.toLowerCase()] || { 
    label: status, 
    className: 'bg-gray-100 text-gray-800' 
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.className
    )}>
      {config.label}
    </span>
  );
};
