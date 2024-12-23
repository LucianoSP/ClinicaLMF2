import { Badge } from "./badge";

interface PrioridadeBadgeProps {
  prioridade: string;
}

export function PrioridadeBadge({ prioridade }: PrioridadeBadgeProps) {
  const prioridadeUpperCase = prioridade.toUpperCase();
  
  const variant = prioridadeUpperCase === "ALTA" ? "destructive" : "secondary";
  
  return (
    <Badge variant={variant}>
      {prioridadeUpperCase}
    </Badge>
  );
}
