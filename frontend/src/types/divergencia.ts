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
