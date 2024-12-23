import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    'pendente': { 
      label: 'Pendente', 
      className: 'bg-white border border-yellow-200 text-yellow-700' 
    },
    'em_analise': { 
      label: 'Em Análise', 
      className: 'bg-white border border-blue-200 text-blue-700' 
    },
    'resolvida': { 
      label: 'Resolvida', 
      className: 'bg-white border border-green-200 text-green-700' 
    },
  };

  const config = statusConfig[status.toLowerCase()] || { 
    label: status, 
    className: 'bg-white border border-gray-200 text-gray-700' 
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
