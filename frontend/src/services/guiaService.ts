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
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
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
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
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
    status: z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada']).default('pendente'),
    carteirinha_id: z.string().min(1, 'Carteirinha é obrigatória'),
    paciente_id: z.string().min(1, 'Paciente é obrigatório'),
    quantidade_autorizada: z.number().min(1, 'Quantidade autorizada é obrigatória'),
    procedimento_id: z.string().min(1, 'Procedimento é obrigatório'),
    profissional_solicitante: z.string().optional(),
    profissional_executante: z.string().optional(),
    observacoes: z.string().optional(),
});

export async function listarGuias(params: URLSearchParams): Promise<Guia[]> {
    try {
        const { data } = await api.get<Guia[]>(`/guias?${params}`);
        return data;
    } catch (error) {
        console.error('Erro ao listar guias:', error);
        throw error;
    }
}

export async function criarGuia(guia: Partial<GuiaFormData>): Promise<Guia> {
    try {
        const { data } = await api.post<Guia>('/guias', guia);
        return data;
    } catch (error) {
        console.error('Erro ao criar guia:', error);
        throw error;
    }
}

export async function atualizarGuia(id: string, guia: Partial<GuiaFormData>): Promise<Guia> {
    try {
        const { data } = await api.put<Guia>(`/guias/${id}`, guia);
        return data;
    } catch (error) {
        console.error('Erro ao atualizar guia:', error);
        throw error;
    }
}

export async function deletarGuia(id: string): Promise<void> {
    try {
        await api.delete(`/guias/${id}`);
    } catch (error) {
        console.error('Erro ao deletar guia:', error);
        throw error;
    }
}

export async function listarProcedimentos(): Promise<any[]> {
    try {
        const { data } = await api.get<any[]>('/procedimentos');
        return data;
    } catch (error) {
        console.error('Erro ao listar procedimentos:', error);
        throw error;
    }
}
