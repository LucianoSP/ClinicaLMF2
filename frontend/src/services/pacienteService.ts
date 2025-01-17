import { api } from '@/lib/api';
import { Paciente } from '@/types/paciente';

export async function listarPacientes(): Promise<Paciente[]> {
  const response = await api.get('/pacientes');
  return response.data;
}

export async function criarPaciente(paciente: Paciente): Promise<Paciente> {
  const response = await api.post('/pacientes', paciente);
  return response.data;
}

export async function atualizarPaciente(id: string, paciente: Paciente): Promise<Paciente> {
  const response = await api.put(`/pacientes/${id}`, paciente);
  return response.data;
}

export async function excluirPaciente(id: string): Promise<void> {
  await api.delete(`/pacientes/${id}`);
}
