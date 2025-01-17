import { Plano } from '@/types/plano';
import { api } from '@/lib/api';

export async function listarPlanos(): Promise<Plano[]> {
  const response = await api.get('/api/planos');
  return response.data;
}

export async function criarPlano(plano: Omit<Plano, 'id'>): Promise<Plano> {
  const response = await api.post('/api/planos', plano);
  return response.data;
}

export async function atualizarPlano(id: string, plano: Omit<Plano, 'id'>): Promise<Plano> {
  const response = await api.put(`/api/planos/${id}`, plano);
  return response.data;
}

export async function deletarPlano(id: string): Promise<void> {
  await api.delete(`/api/planos/${id}`);
}
