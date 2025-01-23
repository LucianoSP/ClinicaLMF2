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
