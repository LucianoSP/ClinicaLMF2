export interface AuditoriaResultado {
  total_protocolos: number;
  total_divergencias: number;
  total_resolvidas: number;
  total_pendentes: number;
  total_fichas_sem_assinatura: number;
  total_execucoes_sem_ficha: number;
  total_fichas_sem_execucao: number;
  total_datas_divergentes: number;
  total_fichas: number;
  data_execucao: string;
  data_inicial: string;
  data_final: string;
}

export interface Divergencia {
  id: string;
  numero_guia: string;
  guia_id: string;
  data_execucao: string;
  data_atendimento: string;
  data_identificacao: string;
  codigo_ficha: string;
  paciente_nome: string;
  carteirinha: string;
  paciente_carteirinha: string;
  status: string;
  tipo_divergencia: string;
  descricao: string;
  descricao_divergencia: string;
  data_registro: string;
  possui_assinatura: boolean;
  arquivo_digitalizado?: string;
  observacoes?: string;
  resolvido_por?: string;
  data_resolucao?: string;
  quantidade_autorizada?: number;
  quantidade_executada?: number;
  detalhes?: Record<string, any>;
}
