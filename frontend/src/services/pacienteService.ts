import { api } from "@/lib/api";
import { Paciente } from "@/types/paciente";

interface PacienteResponse {
  items: Paciente[];
  total: number;
  pages: number;
}

interface PacienteEstatisticas {
  carteirinhas: number;
  guias: number;
  sessoes: number;
  divergencias: number;
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
    return {
      carteirinhas: response.data.carteirinhas || 0,
      guias: response.data.guias || 0,
      sessoes: response.data.sessoes || 0,
      divergencias: response.data.divergencias || 0
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      carteirinhas: 0,
      guias: 0,
      sessoes: 0,
      divergencias: 0
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
