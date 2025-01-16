-- Criação dos ENUMS
CREATE TYPE tipo_guia AS ENUM ('sp_sadt', 'consulta');
CREATE TYPE status_guia AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE status_divergencia AS ENUM ('pendente', 'em_analise', 'resolvida', 'cancelada');
CREATE TYPE tipo_divergencia AS ENUM (
    'ficha_sem_execucao',
    'execucao_sem_ficha',
    'sessao_sem_assinatura',
    'data_divergente',
    'guia_vencida',
    'quantidade_excedida',
    'falta_data_execucao',
    'duplicidade'
);