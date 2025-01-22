export interface Paciente {
  id: string;
  nome: string;
  nome_responsavel: string;
  tipo_responsavel?: string;
  data_nascimento?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  status?: string;
  observacoes_clinicas?: string;
  created_at?: string;
  updated_at?: string;
}
