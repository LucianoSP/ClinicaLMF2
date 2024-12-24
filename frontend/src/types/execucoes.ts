export interface Execucao {
  id: number;
  numero_guia: string;
  paciente_nome: string;
  data_execucao: string;
  paciente_carteirinha: string;
  paciente_id: string;
  quantidade_sessoes: number;
  created_at: string;
  guia_id?: string;
  possui_assinatura?: boolean;
  codigo_ficha?: string;
}
