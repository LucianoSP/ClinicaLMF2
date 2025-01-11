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
    status text DEFAULT 'pendente',  -- Add this line
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Sessões
CREATE TABLE sessoes (
    id uuid PRIMARY KEY,
    ficha_presenca_id uuid REFERENCES fichas_presenca(id),
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
    updated_at timestamptz DEFAULT now(),
    UNIQUE(ficha_presenca_id, data_sessao)
);

-- Execuções
CREATE TABLE execucoes (
    id uuid PRIMARY KEY,
    guia_id uuid REFERENCES guias(id),
    sessao_id uuid REFERENCES sessoes(id),
    data_execucao date NOT NULL,
    usuario_executante uuid REFERENCES usuarios(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_guia FOREIGN KEY (guia_id) 
        REFERENCES guias(id) ON DELETE CASCADE
);

-- Divergências
CREATE TABLE divergencias (
    id uuid PRIMARY KEY,
    guia_id uuid REFERENCES guias(id),
    sessao_id uuid REFERENCES sessoes(id),
    ficha_id uuid REFERENCES fichas_presenca(id),
    tipo_divergencia tipo_divergencia,
    status status_divergencia DEFAULT 'pendente',
    descricao text,
    data_sessao date,
    data_execucao date,
    detalhes jsonb,
    prioridade text DEFAULT 'MEDIA',
    data_identificacao timestamptz DEFAULT now(),
    data_resolucao timestamptz,
    resolvido_por uuid REFERENCES usuarios(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Auditoria de Execuções
CREATE TABLE auditoria_execucoes (
    id uuid PRIMARY KEY,
    data_execucao timestamptz NOT NULL,
    data_inicial date NOT NULL,
    data_final date NOT NULL,
    total_protocolos integer DEFAULT 0,
    total_divergencias integer DEFAULT 0,
    divergencias_por_tipo jsonb,
    status text DEFAULT 'em_andamento',
    created_by uuid REFERENCES usuarios(id),
    finalizado_em timestamptz,
    finalizado_por uuid REFERENCES usuarios(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
