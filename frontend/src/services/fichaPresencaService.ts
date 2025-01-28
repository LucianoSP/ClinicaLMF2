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

export async function listarFichasPresenca(
  page = 1,
  limit = 10,
  search?: string,
  status?: string
) {
  const offset = (page - 1) * limit;
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca?${params}`, {
    headers: {
      'user-id': supabase.auth.getUser()?.data?.user?.id || '',
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao listar fichas de presença');
  }

  return response.json();
}

export async function criarFichaPresenca(data: Partial<FichaPresenca>) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-id': userId,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro ao criar ficha de presença');
  }

  return response.json();
}

export async function atualizarFichaPresenca(id: string, data: Partial<FichaPresenca>) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'user-id': userId,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar ficha de presença');
  }

  return response.json();
}

export async function excluirFichaPresenca(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fichas-presenca/${id}`, {
    method: 'DELETE',
    headers: {
      'user-id': userId,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao excluir ficha de presença');
  }
}
