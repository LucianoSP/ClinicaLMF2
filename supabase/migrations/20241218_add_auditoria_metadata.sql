-- Criar tabela para armazenar metadados das execuções de auditoria
CREATE TABLE auditoria_execucoes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    data_execucao timestamp with time zone DEFAULT now(),
    data_inicial date,
    data_final date,
    total_protocolos integer DEFAULT 0,
    total_divergencias integer DEFAULT 0,
    divergencias_por_tipo jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES usuarios(id)
);

-- Adicionar índices para consultas frequentes
CREATE INDEX idx_auditoria_execucoes_data ON auditoria_execucoes(data_execucao);

-- Adicionar tipo_divergencia como ENUM
DO $$ BEGIN
    CREATE TYPE tipo_divergencia AS ENUM (
        'ficha_sem_execucao',
        'execucao_sem_ficha',
        'ficha_sem_assinatura',
        'data_divergente'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alterar coluna tipo_divergencia para usar o ENUM
ALTER TABLE divergencias 
    ALTER COLUMN tipo_divergencia TYPE tipo_divergencia 
    USING tipo_divergencia::tipo_divergencia;
