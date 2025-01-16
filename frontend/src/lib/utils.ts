import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarData(data: string | Date | undefined, incluirHora: boolean = false) {
  if (!data) return '-';
  try {
    const date = typeof data === 'string' ? parseISO(data) : data;
    return format(date, incluirHora ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '-';
  }
}

export type TipoDivergencia = 'ausencia' | 'duplicidade' | 'horario' | 'profissional';

export function getDivergenciaLabel(tipo: TipoDivergencia): string {
  const labels: Record<TipoDivergencia, string> = {
    ausencia: 'Ausência de execução',
    duplicidade: 'Execução duplicada',
    horario: 'Divergência de horário',
    profissional: 'Divergência de profissional'
  };

  return labels[tipo] || tipo;
}

