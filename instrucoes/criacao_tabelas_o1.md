-- EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- TIPOS ENUM (ajuste se necessário)
CREATE TYPE tipo_divergencia AS ENUM ('DATA_INCONSISTENTE','DOC_INCOMPLETO','ASSINATURA_AUSENTE','QUANTIDADE_EXCEDIDA','EXECUCAO_SEM_FICHA','FICHA_SEM_EXECUCAO');
CREATE TYPE status_divergencia AS ENUM ('pendente', 'resolvida');

CREATE TYPE tipo_guia AS ENUM ('sp_sadt', 'consulta');
CREATE TYPE status_guia AS ENUM ('pendente','em_andamento','concluida','cancelada');

-- Tabela pacientes
CREATE TABLE public.pacientes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    carteirinha text NOT NULL,
    PRIMARY KEY (id)
);

-- Tabela planos_saude (placeholder caso não exista)
-- Ajuste conforme necessário.
CREATE TABLE public.planos_saude (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    codigo character varying(50),
    nome character varying(255),
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone DEFAULT timezone('utc', now()),
    PRIMARY KEY (id)
);

-- Tabela carteirinhas
CREATE TABLE public.carteirinhas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    paciente_id uuid NOT NULL,
    plano_saude_id uuid NOT NULL,
    numero_carteirinha character varying NOT NULL,
    data_validade date,
    titular boolean DEFAULT false,
    nome_titular character varying,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (id)
);

-- Índice único para garantir a referência por numero_carteirinha
CREATE UNIQUE INDEX ux_carteirinhas_numero_carteirinha ON public.carteirinhas (numero_carteirinha);

-- Tabela guias
CREATE TABLE public.guias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    numero_guia text NOT NULL,
    data_emissao date NOT NULL,
    data_validade date,
    tipo tipo_guia NOT NULL,
    status status_guia NOT NULL DEFAULT 'pendente',
    paciente_carteirinha text NOT NULL,
    paciente_nome text NOT NULL,
    quantidade_autorizada integer NOT NULL DEFAULT 1,
    quantidade_executada integer NOT NULL DEFAULT 0,
    procedimento_codigo text,
    procedimento_nome text,
    profissional_solicitante text,
    profissional_executante text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela fichas_presenca
CREATE TABLE public.fichas_presenca (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    data_atendimento date NOT NULL,
    paciente_carteirinha text NOT NULL,
    paciente_nome text NOT NULL,
    numero_guia text NOT NULL,
    codigo_ficha text,
    possui_assinatura boolean NOT NULL DEFAULT false,
    arquivo_digitalizado text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Índice para lookup por (numero_guia, codigo_ficha)
CREATE INDEX idx_fichas_presenca_guia_ficha ON public.fichas_presenca (numero_guia, codigo_ficha);

-- Tabela execucoes
CREATE TABLE public.execucoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    numero_guia text NOT NULL,
    paciente_nome text NOT NULL,
    data_execucao date NOT NULL,
    paciente_carteirinha text NOT NULL,
    paciente_id text,
    quantidade_sessoes integer DEFAULT 1,
    usuario_executante uuid,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
    codigo_ficha text,
    PRIMARY KEY (id)
);

-- Índice para lookup por (numero_guia, codigo_ficha)
CREATE INDEX idx_execucoes_guia_ficha ON public.execucoes (numero_guia, codigo_ficha);

-- Tabela divergencias
CREATE TABLE public.divergencias (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    numero_guia text NOT NULL,
    data_execucao date NOT NULL,
    codigo_ficha text,
    tipo_divergencia tipo_divergencia NOT NULL,
    descricao text NOT NULL,
    status status_divergencia DEFAULT 'pendente',
    data_identificacao timestamp with time zone DEFAULT now(),
    data_resolucao timestamp with time zone,
    resolvido_por uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    paciente_nome text,
    ficha_id uuid,
    execucao_id uuid,
    PRIMARY KEY (id)
);

-- Tabela auditoria_execucoes
-- Supondo que created_by referencia public.usuarios.id
-- Ajuste se necessário, caso usuarios não exista
CREATE TABLE public.auditoria_execucoes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    data_execucao timestamp with time zone DEFAULT now(),
    data_inicial date,
    data_final date,
    total_protocolos integer DEFAULT 0,
    total_divergencias integer DEFAULT 0,
    divergencias_por_tipo jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    PRIMARY KEY (id)
);

-- Tabela agendamentos
CREATE TABLE public.agendamentos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    mysql_id integer,
    data_inicio timestamp with time zone,
    data_fim timestamp with time zone,
    mysql_paciente_id integer,
    paciente_id uuid,
    pagamento_id integer,
    sala_id integer,
    qtd_sessoes integer,
    status character varying,
    valor_sala numeric,
    fixo boolean,
    especialidade_id integer,
    local_id integer,
    saldo_sessoes integer,
    elegibilidade character varying,
    falta_profissional boolean,
    agendamento_pai_id integer,
    parent_id integer,
    codigo_faturamento character varying,
    data_registro timestamp with time zone,
    ultima_atualizacao timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (id)
);

-- Tabela usuarios (placeholder caso não exista)
CREATE TABLE public.usuarios (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    nome text,
    email text,
    ativo boolean,
    ultimo_acesso timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

----------------------------------
-- CHAVES ESTRANGEIRAS
----------------------------------

-- fk_guias_carteirinhas: guias.paciente_carteirinha -> carteirinhas.numero_carteirinha
ALTER TABLE public.guias
ADD CONSTRAINT fk_guias_carteirinhas
FOREIGN KEY (paciente_carteirinha)
REFERENCES public.carteirinhas (numero_carteirinha);

-- auditoria_execucoes_created_by_fkey: auditoria_execucoes.created_by -> usuarios.id
ALTER TABLE public.auditoria_execucoes
ADD CONSTRAINT auditoria_execucoes_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.usuarios (id);

-- divergencias_execucao_id_fkey: divergencias.execucao_id -> execucoes.id
ALTER TABLE public.divergencias
ADD CONSTRAINT divergencias_execucao_id_fkey
FOREIGN KEY (execucao_id)
REFERENCES public.execucoes (id);

-- divergencias_ficha_id_fkey: divergencias.ficha_id -> fichas_presenca.id
ALTER TABLE public.divergencias
ADD CONSTRAINT divergencias_ficha_id_fkey
FOREIGN KEY (ficha_id)
REFERENCES public.fichas_presenca (id);

-- fk_execucoes_fichas_presenca: execucoes.codigo_ficha -> fichas_presenca.codigo_ficha
-- Como não é PK em fichas_presenca, cuidado. Supondo que (numero_guia, codigo_ficha) identifique unicamente:
-- Caso queira forçar integridade, é melhor ter chave única em fichas_presenca (numero_guia, codigo_ficha).
-- Aqui faremos referência apenas a codigo_ficha, mas isso pode não garantir integridade. Ajuste conforme a modelagem.
-- Se for suposto que codigo_ficha é único globalmente, crie UNIQUE em fichas_presenca(codigo_ficha).
ALTER TABLE public.fichas_presenca
ADD CONSTRAINT uq_fichas_codigo_ficha UNIQUE (codigo_ficha);

ALTER TABLE public.execucoes
ADD CONSTRAINT fk_execucoes_fichas_presenca
FOREIGN KEY (codigo_ficha)
REFERENCES public.fichas_presenca (codigo_ficha);

-- fk_execucoes_guias: execucoes.numero_guia -> guias.numero_guia
-- Precisamos que guias.numero_guia seja único para referência.
ALTER TABLE public.guias
ADD CONSTRAINT uq_guias_numero_guia UNIQUE (numero_guia);

ALTER TABLE public.execucoes
ADD CONSTRAINT fk_execucoes_guias
FOREIGN KEY (numero_guia)
REFERENCES public.guias (numero_guia);

-- carteirinhas_paciente_id_fkey: carteirinhas.paciente_id -> pacientes.id
ALTER TABLE public.carteirinhas
ADD CONSTRAINT carteirinhas_paciente_id_fkey
FOREIGN KEY (paciente_id)
REFERENCES public.pacientes (id);

-- carteirinhas_plano_saude_id_fkey: carteirinhas.plano_saude_id -> planos_saude.id
ALTER TABLE public.carteirinhas
ADD CONSTRAINT carteirinhas_plano_saude_id_fkey
FOREIGN KEY (plano_saude_id)
REFERENCES public.planos_saude (id);

-- agendamentos_paciente_id_fkey: agendamentos.paciente_id -> pacientes.id
ALTER TABLE public.agendamentos
ADD CONSTRAINT agendamentos_paciente_id_fkey
FOREIGN KEY (paciente_id)
REFERENCES public.pacientes (id);
