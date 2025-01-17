import { api } from "@/lib/api";
import { Paciente } from "@/types/paciente";

export async function listarPacientes(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ data: Paciente[]; total: number; pages: number }> {
  const offset = (page - 1) * limit;
  const response = await api.get("/pacientes", {
    params: { limit, offset, search },
  });
  return response.data;
}

export async function criarPaciente(paciente: Paciente): Promise<Paciente> {
  const response = await api.post("/pacientes", paciente);
  return response.data;
}

export async function atualizarPaciente(
  id: string,
  paciente: Paciente
): Promise<Paciente> {
  const response = await api.put(`/pacientes/${id}`, paciente);
  return response.data;
}

export async function excluirPaciente(id: string): Promise<void> {
  await api.delete(`/pacientes/${id}`);
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

export async function buscarEstatisticasPaciente(id: string): Promise<any> {
  const response = await api.get(`/pacientes/${id}/estatisticas`);
  return response.data;
}
