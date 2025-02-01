export interface Carteirinha {
  id: string;
  numero_carteirinha: string;
  numeroCarteirinha?: string;
  data_validade?: string;
  dataValidade?: string;
  status?: "ativa" | "vencida" | "cancelada" | "suspensa" | "em_analise";
  titular?: boolean;
  nomeTitular?: string;
  plano_saude_id?: string;
  planoSaudeId?: string;
  paciente_id?: string;
  pacienteId?: string;
  motivo_inativacao?: string;
  created_at?: string;
  updated_at?: string;
  
  paciente?: {
    id: string;
    nome: string;
    cpf?: string;
    email?: string | null;
    telefone?: string;
    data_nascimento?: string;
    nome_responsavel?: string;
  };
  plano_saude?: {
    id: string;
    nome: string;
    ativo?: boolean;
    codigo: string;
  };
}