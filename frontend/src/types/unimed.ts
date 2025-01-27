// types/unimed.ts

export interface GuiaProcessada {
  id: number;
  carteira: string;
  nome_beneficiario: string;
  codigo_procedimento: string;
  data_atendimento: string;
  data_execucao: string;
  numero_guia: string;
  biometria: string;
  nome_profissional: string;
  conselho_profissional: string;
  numero_conselho: string;
  uf_conselho: string;
  codigo_cbo: string;
  created_at: string;
}

export interface ProcessingStatus {
  id: number;
  status: string;
  error: string | null;
  processed_guides: number;
  total_guides: number;
  last_update: string;
}

export interface ScrapingFormData {
  dataInicial: Date | undefined;
  dataFinal: Date | undefined;
  maxGuias: number | undefined;
}

export type ScrapingStatus = "idle" | "processing" | "completed" | "failed";
