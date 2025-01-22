export interface Sessao {
  id: string;
  ficha_presenca_id: string;
  data_sessao: string;
  possui_assinatura: boolean;
  tipo_terapia: string;
  profissional_executante: string;
  valor_sessao: number;
  status: string;
  observacoes_sessao: string;
  executado: boolean;
  data_execucao: string | null;
  executado_por: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SessaoCreate extends Omit<Sessao, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface SessaoUpdate extends Partial<SessaoCreate> {
  id: string;
}
