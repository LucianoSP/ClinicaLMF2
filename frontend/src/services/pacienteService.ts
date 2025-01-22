import { api } from "@/lib/api";
import { Paciente } from "@/types/paciente";

interface PacienteResponse {
  items: Paciente[];
  total: number;
  pages: number;
}

interface PacienteEstatisticas {
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

export async function listarPacientes(
  page: number = 1,
  search?: string,
  limit: number = 10
): Promise<PacienteResponse> {
  const offset = (page - 1) * limit;
  const params: any = { limit, offset };
  if (search) {
    params.search = search;
  }
  const response = await api.get("/pacientes", { params });
  return {
    items: response.data.data,
    total: response.data.total,
    pages: response.data.pages
  };
}

export async function criarPaciente(paciente: Paciente): Promise<Paciente> {
  const response = await api.post("/pacientes", {
    nome: paciente.nome,
    nome_responsavel: paciente.nome_responsavel,
    tipo_responsavel: paciente.tipo_responsavel,
    data_nascimento: paciente.data_nascimento ? paciente.data_nascimento.split('T')[0] : null,
    cpf: paciente.cpf,
    telefone: paciente.telefone,
    email: paciente.email,
    status: paciente.status,
    observacoes_clinicas: paciente.observacoes_clinicas
  });
  return response.data;
}

export async function atualizarPaciente(
  id: string,
  paciente: Paciente
): Promise<Paciente> {
  const response = await api.put(`/pacientes/${id}`, {
    nome: paciente.nome,
    nome_responsavel: paciente.nome_responsavel,
    tipo_responsavel: paciente.tipo_responsavel,
    data_nascimento: paciente.data_nascimento ? paciente.data_nascimento.split('T')[0] : null,
    cpf: paciente.cpf,
    telefone: paciente.telefone,
    email: paciente.email,
    status: paciente.status,
    observacoes_clinicas: paciente.observacoes_clinicas
  });
  return response.data;
}

export async function excluirPaciente(id: string): Promise<void> {
  await api.delete(`/pacientes/${id}`);
}

export async function buscarEstatisticasPaciente(id: string): Promise<PacienteEstatisticas> {
  try {
    const response = await api.get(`/pacientes/${id}/estatisticas`);
    const data = response.data.data;
    
    return {
      total_carteirinhas: data.total_carteirinhas || 0,
      carteirinhas_ativas: data.carteirinhas_ativas || 0,
      total_guias: data.total_guias || 0,
      guias_ativas: data.guias_ativas || 0,
      sessoes_autorizadas: data.sessoes_autorizadas || 0,
      sessoes_executadas: data.sessoes_executadas || 0,
      divergencias_pendentes: data.divergencias_pendentes || null,
      taxa_execucao: data.taxa_execucao || 0,
      guias_por_status: {
        pendente: data.guias_por_status?.pendente || 0,
        em_andamento: data.guias_por_status?.em_andamento || 0,
        concluida: data.guias_por_status?.concluida || 0,
        cancelada: data.guias_por_status?.cancelada || 0,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      total_carteirinhas: 0,
      carteirinhas_ativas: 0,
      total_guias: 0,
      guias_ativas: 0,
      sessoes_autorizadas: 0,
      sessoes_executadas: 0,
      divergencias_pendentes: null,
      taxa_execucao: 0,
      guias_por_status: {
        pendente: 0,
        em_andamento: 0,
        concluida: 0,
        cancelada: 0,
      },
    };
  }
}

export async function buscarGuiasPaciente(id: string): Promise<{
  items: any[];
  carteirinhas: any[];
  plano: any;
  fichas: any[];
}> {
  const response = await api.get(`/pacientes/${id}/guias`);
  return response.data;
}
