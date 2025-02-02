export interface PlanoSaude {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
}

export interface Carteirinha {
  id: string;
  numero: string;
  data_emissao: string;
  data_validade: string;
  status: string;
  plano_saude?: {
    id: string;
    nome: string;
  };
}

export interface Guide {
  id: string;
  numero_guia: string;
  data_emissao: string | null;
  data_validade: string | null;
  quantidade_autorizada: number;
  quantidade_executada: number;
  status: string;
  tipo: string;
  procedimento_nome?: string;
  paciente_carteirinha: string;
}

export interface FichaPresenca {
  id: string;
  data_atendimento: string;
  paciente_carteirinha: string;
  paciente_nome: string;
  numero_guia: string;
  codigo_ficha: string;
  possui_assinatura: boolean;
  arquivo_digitalizado?: string | null;
  observacoes?: string | null;
}

export interface PacienteEstatisticas {
  total_carteirinhas: number;
  carteirinhas_ativas: number;
  total_guias: number;
  guias_ativas: number;
  sessoes_autorizadas: number;
  sessoes_executadas: number;
  divergencias_pendentes: number | null;
  taxa_execucao: number;
  guias_por_status: {
    pendente: number;
    em_andamento: number;
    concluida: number;
    cancelada: number;
  };
}

export interface Endereco {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface Paciente {
  id?: string;
  nome: string;
  nome_responsavel: string;
  data_nascimento?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: Endereco;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}
