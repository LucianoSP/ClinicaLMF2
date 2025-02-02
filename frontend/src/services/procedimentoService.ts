import { api } from '@/lib/api';
import { Procedimento } from "@/types/procedimento";

export async function listarProcedimentos(): Promise<Procedimento[]> {
  try {
    const { data } = await api.get<Procedimento[]>('/procedimentos');
    return data;
  } catch (error) {
    console.error('Erro ao listar procedimentos:', error);
    throw error;
  }
}

export async function criarProcedimento(
  data: Omit<Procedimento, "id" | "created_at" | "updated_at">
): Promise<Procedimento> {
  try {
    const { data: procedimento } = await api.post<Procedimento>('/procedimentos', data);
    return procedimento;
  } catch (error) {
    console.error('Erro ao criar procedimento:', error);
    throw error;
  }
}

export async function atualizarProcedimento(
  id: string,
  data: Partial<Procedimento>
): Promise<Procedimento> {
  try {
    const { data: procedimento } = await api.put<Procedimento>(`/procedimentos/${id}`, data);
    return procedimento;
  } catch (error) {
    console.error('Erro ao atualizar procedimento:', error);
    throw error;
  }
}
