import { Badge } from "./badge";

interface DivergenciaBadgeProps {
  tipo: string;
}

export const DivergenciaBadge = ({ tipo }: DivergenciaBadgeProps) => {
  const tipos: { [key: string]: { label: string; className: string } } = {
    'execucao_sem_ficha': { 
      label: 'Execução sem Ficha', 
      className: 'bg-white border border-red-200 text-red-700' 
    },
    'ficha_sem_execucao': { 
      label: 'Ficha sem Execução', 
      className: 'bg-white border border-yellow-200 text-yellow-700' 
    },
    'quantidade_excedida': { 
      label: 'Quantidade Excedida', 
      className: 'bg-white border border-orange-200 text-orange-700' 
    },
    'data_inconsistente': { 
      label: 'Data Inconsistente', 
      className: 'bg-white border border-blue-200 text-blue-700' 
    },
    'doc_incompleto': { 
      label: 'Documentação Incompleta', 
      className: 'bg-white border border-purple-200 text-purple-700' 
    },
    'assinatura_ausente': { 
      label: 'Assinatura Ausente', 
      className: 'bg-white border border-pink-200 text-pink-700' 
    },
  };

  const { label, className } = tipos[tipo.toLowerCase()] || { 
    label: tipo, 
    className: 'bg-white border border-gray-200 text-gray-700' 
  };

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};
