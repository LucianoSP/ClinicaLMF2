-- Usuários
CREATE TABLE usuarios (
    id uuid PRIMARY KEY,
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
CREATE TABLE pacientes (
    id uuid PRIMARY KEY,
    nome text NOT NULL,
    data_nascimento date,
    cpf character varying(11),
    telefone text,
    email text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Planos de Saúde
CREATE TABLE planos_saude (
    id uuid PRIMARY KEY,
    codigo character varying(50) UNIQUE,
    nome character varying(255) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Carteirinhas
CREATE TABLE carteirinhas (
    id uuid PRIMARY KEY,
    paciente_id uuid REFERENCES pacientes(id),
    plano_saude_id uuid REFERENCES planos_saude(id),
    numero_carteirinha character varying(50) NOT NULL,
    data_validade date,
    titular boolean DEFAULT false,
    nome_titular character varying(255),
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(plano_saude_id, numero_carteirinha)
);

-- Guias
CREATE TABLE guias (
    id uuid PRIMARY KEY,
    numero_guia text UNIQUE,
    data_emissao date,
    data_validade date,
    tipo tipo_guia,
    status status_guia DEFAULT 'pendente',
    paciente_carteirinha text,
    paciente_nome text,
    quantidade_autorizada integer NOT NULL,
    procedimento_codigo text,
    procedimento_nome text,
    profissional_solicitante text,
    profissional_executante text,
    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Fichas de Presença
CREATE TABLE fichas_presenca (
    id uuid PRIMARY KEY,
    codigo_ficha text UNIQUE,
    numero_guia text,
    paciente_nome text,
    paciente_carteirinha text,
    arquivo_digitalizado text,
    observacoes text,
    status text DEFAULT 'pendente',
    data_atendimento date,  -- Campo adicionado diretamente na criação
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Sessões
CREATE TABLE sessoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Adicionar DEFAULT para gerar UUID automaticamente
    ficha_presenca_id uuid REFERENCES fichas_presenca(id) ON DELETE CASCADE,  -- Confirmar que esta linha existe
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
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Execuções
CREATE TABLE execucoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guia_id uuid REFERENCES guias(id),
    sessao_id uuid REFERENCES sessoes(id) ON DELETE CASCADE,
    data_execucao date NOT NULL,
    paciente_nome text NOT NULL,
    paciente_carteirinha text NOT NULL,
    numero_guia text NOT NULL,
    codigo_ficha text NOT NULL,  -- Changed from nullable to NOT NULL
    usuario_executante uuid REFERENCES usuarios(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_guia FOREIGN KEY (guia_id) 
        REFERENCES guias(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_execucoes_paciente_nome ON execucoes(paciente_nome);
CREATE INDEX idx_execucoes_paciente_carteirinha ON execucoes(paciente_carteirinha);
CREATE INDEX idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX idx_execucoes_codigo_ficha ON execucoes(codigo_ficha);
CREATE INDEX idx_execucoes_data_execucao ON execucoes(data_execucao);

-- Divergências
CREATE TABLE divergencias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text NOT NULL,
    tipo_divergencia text NOT NULL,
    descricao text,
    paciente_nome text,
    codigo_ficha text,  -- Added this field
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
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE divergencias 
ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'MEDIA';

-- Drop and recreate Auditoria de Execuções
DROP TABLE IF EXISTS auditoria_execucoes;
CREATE TABLE auditoria_execucoes (
    id uuid PRIMARY KEY,
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
    updated_at timestamptz DEFAULT now()
);

-- First drop existing RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON auditoria_execucoes;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON auditoria_execucoes;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON auditoria_execucoes;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON auditoria_execucoes;

-- Disable RLS temporarily
ALTER TABLE auditoria_execucoes DISABLE ROW LEVEL SECURITY;

-- Create new policies allowing all operations
CREATE POLICY "Enable full access" ON auditoria_execucoes
    USING (true)
    WITH CHECK (true);

-- Grant all permissions to public
GRANT ALL ON auditoria_execucoes TO PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;
