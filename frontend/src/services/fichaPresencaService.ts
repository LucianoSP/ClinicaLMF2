import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface Procedimento {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
}

export interface Sessao {
  id: string;
  ficha_presenca_id: string;
  data_sessao: string;
  possui_assinatura: boolean;
  procedimento_id: string;
  procedimento?: Procedimento;
  profissional_executante: string;
  valor_sessao?: number;
  status: 'pendente' | 'conferida' | string;
  observacoes_sessao?: string;
  executado: boolean;
  data_execucao?: string;
  executado_por?: string;
}

export interface FichaPresenca {
  id: string;
  codigo_ficha: string;
  numero_guia: string;
  paciente_nome: string;
  paciente_carteirinha: string;
  arquivo_digitalizado?: string;
  observacoes?: string;
  data_atendimento?: string;
  created_at: string;
  updated_at: string;
  sessoes?: Sessao[];
}

export interface FichaPresencaListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

export async function listarFichasPresenca(params: FichaPresencaListParams = {}): Promise<{
  fichas: FichaPresenca[];
  total: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) {
      const offset = (params.page - 1) * (params.limit || 10);
      queryParams.append('offset', offset.toString());
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    if (params.data_inicio) {
      queryParams.append('data_inicio', params.data_inicio);
    }
    
    if (params.data_fim) {
      queryParams.append('data_fim', params.data_fim);
    }

    const { data } = await api.get<{
      fichas: FichaPresenca[];
      total: number;
    }>(`/fichas-presenca?${queryParams}`);

    return data;
  } catch (error) {
    console.error('Erro ao listar fichas de presença:', error);
    return { fichas: [], total: 0 };
  }
}

export async function criarFichaPresenca(ficha: Partial<FichaPresenca>): Promise<FichaPresenca> {
  try {
    const { data } = await api.post<FichaPresenca>('/fichas-presenca', ficha);
    return data;
  } catch (error) {
    console.error('Erro ao criar ficha de presença:', error);
    throw error;
  }
}

export async function atualizarFichaPresenca(id: string, ficha: Partial<FichaPresenca>): Promise<FichaPresenca> {
  try {
    const { data } = await api.put<FichaPresenca>(`/fichas-presenca/${id}`, ficha);
    return data;
  } catch (error) {
    console.error('Erro ao atualizar ficha de presença:', error);
    throw error;
  }
}

export async function deletarFichaPresenca(id: string): Promise<void> {
  try {
    await api.delete(`/fichas-presenca/${id}`);
  } catch (error) {
    console.error('Erro ao deletar ficha de presença:', error);
    throw error;
  }
}
