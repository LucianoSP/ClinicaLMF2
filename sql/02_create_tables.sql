-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos enumerados
CREATE TYPE tipo_guia AS ENUM ('sp_sadt', 'consulta', 'internacao');
CREATE TYPE status_guia AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE status_carteirinha AS ENUM ('ativa', 'vencida', 'cancelada', 'suspensa', 'em_analise');

-- Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id uuid UNIQUE,
    nome text NOT NULL,
    email text UNIQUE,
    tipo_usuario text DEFAULT 'operador',
    ativo boolean DEFAULT true,
    ultimo_acesso timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    nome_responsavel text NOT NULL,
    data_nascimento date,
    cpf character varying(11),
    telefone text,
    email text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Planos de Saúde
CREATE TABLE IF NOT EXISTS planos_saude (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo character varying(50) UNIQUE,
    nome character varying(255) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Carteirinhas
CREATE TABLE IF NOT EXISTS carteirinhas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    plano_saude_id uuid REFERENCES planos_saude(id) ON DELETE RESTRICT,
    numero_carteirinha character varying(50) NOT NULL,
    data_validade date,
    status status_carteirinha NOT NULL DEFAULT 'ativa',
    motivo_inativacao text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(plano_saude_id, numero_carteirinha),
    CONSTRAINT carteirinhas_numero_carteirinha_check CHECK (numero_carteirinha ~ '^[0-9.\-]+$')
);

-- Index for faster carteirinha lookups
CREATE INDEX IF NOT EXISTS idx_carteirinhas_numero ON carteirinhas(numero_carteirinha);
CREATE INDEX IF NOT EXISTS idx_carteirinhas_paciente ON carteirinhas(paciente_id);

-- Guias
CREATE TABLE IF NOT EXISTS guias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text UNIQUE,
    data_emissao date,
    data_validade date,
    tipo tipo_guia,
    status status_guia DEFAULT 'pendente',
    carteirinha_id uuid REFERENCES carteirinhas(id) ON DELETE RESTRICT,
    paciente_id uuid REFERENCES pacientes(id) ON DELETE RESTRICT,
    quantidade_autorizada integer NOT NULL,
    quantidade_executada integer DEFAULT 0,
    procedimento_codigo text,
    procedimento_nome text,
    profissional_solicitante text,
    profissional_executante text,
    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_guias_paciente_id ON guias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_guias_carteirinha_id ON guias(carteirinha_id);
CREATE INDEX IF NOT EXISTS idx_guias_numero ON guias(numero_guia);
CREATE INDEX IF NOT EXISTS idx_guias_status ON guias(status);

-- Guias Unimed
CREATE TABLE IF NOT EXISTS guias_unimed (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guia_id uuid REFERENCES guias(id) ON DELETE CASCADE,
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    numero_guia_operadora text,
    senha_autorizacao text,
    data_autorizacao date,
    data_validade_senha date,
    codigo_procedimento text,
    nome_procedimento text,
    quantidade_autorizada integer,
    quantidade_executada integer DEFAULT 0,
    valor_autorizado numeric(10,2),
    status text DEFAULT 'pendente',
    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT guias_unimed_numero_guia_operadora_key UNIQUE (numero_guia_operadora)
);

-- Index for guias_unimed
CREATE INDEX IF NOT EXISTS idx_guias_unimed_paciente_id ON guias_unimed(paciente_id);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_guia_id ON guias_unimed(guia_id);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_numero_guia ON guias_unimed(numero_guia_operadora);

-- Fichas de Presença
CREATE TABLE IF NOT EXISTS fichas_presenca (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_ficha text UNIQUE,
    numero_guia text,
    paciente_nome text,
    paciente_carteirinha text,
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    arquivo_digitalizado text,
    observacoes text,
    status text DEFAULT 'pendente',
    data_atendimento date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Sessões
CREATE TABLE IF NOT EXISTS sessoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ficha_presenca_id uuid REFERENCES fichas_presenca(id) ON DELETE CASCADE,
    data_sessao date NOT NULL,
    possui_assinatura boolean DEFAULT false,
    tipo_terapia text,
    profissional_executante text,
    valor_sessao numeric(10,2),
    status text DEFAULT 'pendente',
    observacoes_sessao text,
    executado boolean DEFAULT false,
    data_execucao date,
    executado_por uuid REFERENCES usuarios(id),
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Execuções
CREATE TABLE IF NOT EXISTS execucoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guia_id uuid REFERENCES guias(id) ON DELETE CASCADE,
    sessao_id uuid REFERENCES sessoes(id) ON DELETE CASCADE,
    data_execucao date NOT NULL,
    paciente_nome text NOT NULL,
    paciente_carteirinha text NOT NULL,
    numero_guia text NOT NULL,
    codigo_ficha text NOT NULL,
    usuario_executante uuid REFERENCES usuarios(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Divergências
CREATE TABLE IF NOT EXISTS divergencias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text NOT NULL,
    tipo_divergencia text NOT NULL,
    descricao text,
    paciente_nome text,
    codigo_ficha text,
    data_execucao date,
    data_atendimento date,
    carteirinha text,
    prioridade text DEFAULT 'MEDIA',
    status text DEFAULT 'pendente',
    data_identificacao timestamptz DEFAULT now(),
    data_resolucao timestamptz,
    resolvido_por uuid REFERENCES usuarios(id),
    detalhes jsonb,
    ficha_id uuid REFERENCES fichas_presenca(id),
    execucao_id uuid REFERENCES execucoes(id),
    sessao_id uuid REFERENCES sessoes(id),
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Auditoria de Execuções
CREATE TABLE IF NOT EXISTS auditoria_execucoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_execucao timestamptz NOT NULL,
    data_inicial date,
    data_final date,
    total_protocolos integer DEFAULT 0,
    total_divergencias integer DEFAULT 0,
    total_fichas integer DEFAULT 0,
    total_guias integer DEFAULT 0,
    total_resolvidas integer DEFAULT 0,
    divergencias_por_tipo jsonb,
    status text DEFAULT 'em_andamento',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    total_execucoes INTEGER DEFAULT 0
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_nome ON execucoes(paciente_nome);
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_carteirinha ON execucoes(paciente_carteirinha);
CREATE INDEX IF NOT EXISTS idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX IF NOT EXISTS idx_execucoes_codigo_ficha ON execucoes(codigo_ficha);
CREATE INDEX IF NOT EXISTS idx_execucoes_data_execucao ON execucoes(data_execucao);
CREATE INDEX IF NOT EXISTS idx_fichas_presenca_paciente_id ON fichas_presenca(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_paciente_id ON sessoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_paciente_id ON divergencias(paciente_id);

-- Atualizar função trigger para contar todas as execuções, sem distinção por data
CREATE OR REPLACE FUNCTION update_guia_quantidade_executada()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Atualiza quantidade_executada baseado no total de execuções
        UPDATE guias
        SET quantidade_executada = (
            SELECT COUNT(*)
            FROM execucoes
            WHERE numero_guia = NEW.numero_guia
        )
        WHERE numero_guia = NEW.numero_guia;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE guias
        SET quantidade_executada = (
            SELECT COUNT(*)
            FROM execucoes
            WHERE numero_guia = OLD.numero_guia
        )
        WHERE numero_guia = OLD.numero_guia;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger para executar na tabela execucoes ao invés de fichas_presenca
DROP TRIGGER IF EXISTS trigger_update_guia_quantidade ON fichas_presenca;
CREATE TRIGGER trigger_update_guia_quantidade
    AFTER INSERT OR UPDATE OR DELETE ON execucoes
    FOR EACH ROW
    EXECUTE FUNCTION update_guia_quantidade_executada();

-- Adicionar índice para melhorar performance do COUNT DISTINCT
CREATE INDEX IF NOT EXISTS idx_execucoes_numero_guia_data 
ON execucoes(numero_guia, data_execucao);

-- Configurar permissões
GRANT ALL ON ALL TABLES IN SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO public;
ALTER TABLE auditoria_execucoes DISABLE ROW LEVEL SECURITY;

-- Migration script for carteirinhas table updates
DO $$ 
BEGIN
    -- Remove nome_titular column if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'carteirinhas' AND column_name = 'nome_titular'
    ) THEN
        ALTER TABLE carteirinhas DROP COLUMN nome_titular;
    END IF;

    -- Update foreign key constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'carteirinhas_paciente_id_fkey'
    ) THEN
        ALTER TABLE carteirinhas
            ADD CONSTRAINT carteirinhas_paciente_id_fkey 
            FOREIGN KEY (paciente_id) 
            REFERENCES pacientes(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'carteirinhas_plano_saude_id_fkey'
    ) THEN
        ALTER TABLE carteirinhas
            ADD CONSTRAINT carteirinhas_plano_saude_id_fkey 
            FOREIGN KEY (plano_saude_id) 
            REFERENCES planos_saude(id) ON DELETE RESTRICT;
    END IF;

    -- Update existing carteirinhas to have status 'ativa'
    UPDATE carteirinhas SET status = 'ativa' WHERE status IS NULL OR status = '';
END $$;