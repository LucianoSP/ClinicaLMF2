import { api } from '@/lib/api';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export interface Procedimento {
    id?: string;
    codigo: string;
    nome: string;
    descricao?: string;
    ativo: boolean;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
}

export interface Guia {
    id?: string;
    numero_guia: string;
    data_emissao?: string;
    data_validade?: string;
    tipo: string;
    status: string;
    carteirinha_id: string;
    paciente_id: string;
    quantidade_autorizada: number;
    quantidade_executada?: number;
    procedimento_id: string;
    profissional_solicitante?: string;
    profissional_executante?: string;
    observacoes?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    carteirinha?: {
        id: string;
        numero_carteirinha: string;
        status: string;
        data_validade?: string;
        plano_saude_id: string;
    };
    paciente?: {
        id: string;
        nome: string;
        cpf?: string;
        data_nascimento?: string;
        nome_responsavel?: string;
    };
    procedimento?: {
        id: string;
        codigo: string;
        nome: string;
        descricao?: string;
        ativo: boolean;
    };
}

export interface GuiaFormData {
    numero_guia: string;
    data_emissao?: string;
    data_validade?: string;
    tipo: string;
    carteirinha_id: string;
    paciente_id: string;
    quantidade_autorizada: number;
    procedimento_id: string;
    profissional_solicitante?: string;
    profissional_executante?: string;
    observacoes?: string;
}

export const guiaSchema = z.object({
    numero_guia: z.string().min(1, 'Número da guia é obrigatório'),
    data_emissao: z.string().optional(),
    data_validade: z.string().optional(),
    tipo: z.string().min(1, 'Tipo é obrigatório'),
    carteirinha_id: z.string().min(1, 'Carteirinha é obrigatória'),
    paciente_id: z.string().min(1, 'Paciente é obrigatório'),
    quantidade_autorizada: z.number().min(1, 'Quantidade autorizada é obrigatória'),
    procedimento_id: z.string().min(1, 'Procedimento é obrigatório'),
    profissional_solicitante: z.string().optional(),
    profissional_executante: z.string().optional(),
    observacoes: z.string().optional(),
});

export async function listarGuias(page = 1, limit = 10, search?: string) {
    const offset = (page - 1) * limit;
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    if (search) {
        params.append('search', search);
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guias?${params}`, {
        headers: {
            'user-id': supabase.auth.getUser()?.data?.user?.id || '',
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao listar guias');
    }

    return response.json();
}

export async function criarGuia(data: GuiaFormData) {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guias/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-id': userId,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Erro ao criar guia');
    }

    return response.json();
}

export async function atualizarGuia(id: string, data: GuiaFormData) {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guias/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'user-id': userId,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar guia');
    }

    return response.json();
}

export async function excluirGuia(id: string) {
    const response = await api.delete(`/guias/${id}`);
    return response.data;
}

export async function listarProcedimentos() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procedimentos/`, {
        headers: {
            'user-id': supabase.auth.getUser()?.data?.user?.id || '',
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao listar procedimentos');
    }

    return response.json();
}
