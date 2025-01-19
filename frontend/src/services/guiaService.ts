import { api } from '@/lib/api';

export interface Guia {
  id?: string;
  numero_guia: string;
  data_emissao?: string;
  data_validade?: string;
  tipo: 'sp_sadt' | 'consulta' | 'internacao';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  paciente_carteirinha: string;
  paciente_nome: string;
  quantidade_autorizada: number;
  quantidade_executada?: number;
  procedimento_codigo?: string;
  procedimento_nome?: string;
  profissional_solicitante?: string;
  profissional_executante?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GuiaFormData extends Omit<Guia, 'id' | 'created_at' | 'updated_at' | 'quantidade_executada'> {}

export async function listarGuias(page: number = 1, limit: number = 10, search?: string) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: ((page - 1) * limit).toString(),
  });
  
  if (search) {
    params.append('search', search);
  }
  
  const response = await api.get(`/guias/?${params.toString()}`);
  return response.data;
}

export async function criarGuia(data: GuiaFormData) {
  const response = await api.post('/guias/', data);
  return response.data;
}

export async function atualizarGuia(id: string, data: GuiaFormData) {
  const response = await api.put(`/guias/${id}`, data);
  return response.data;
}

export async function excluirGuia(id: string) {
  const response = await api.delete(`/guias/${id}`);
  return response.data;
}
