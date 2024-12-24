import { cn } from "@/lib/utils";

interface BadgeStatusProps {
  value: string | boolean;
  colorScheme?: {
    true?: string;
    false?: string;
    [key: string]: string | undefined;
  };
}

export function BadgeStatus({ value, colorScheme = {} }: BadgeStatusProps) {
  const defaultColors = {
    true: "bg-green-100 text-green-800 border-green-200",
    false: "bg-red-100 text-red-800 border-red-200",
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    resolvida: "bg-green-100 text-green-800 border-green-200",
    "em_analise": "bg-blue-100 text-blue-800 border-blue-200",
    "execucao_sem_ficha": "bg-red-100 text-red-800 border-red-200",
    "ficha_sem_execucao": "bg-orange-100 text-orange-800 border-orange-200",
    "ficha_sem_assinatura": "bg-purple-100 text-purple-800 border-purple-200",
    ...colorScheme,
  };

  const getDisplayText = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? "Sim" : "Não";
    }
    return value.replace(/_/g, " ");
  };

  const getColorClass = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? defaultColors.true : defaultColors.false;
    }
    return defaultColors[value.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        getColorClass(value)
      )}
    >
      {getDisplayText(value)}
    </span>
  );
}
