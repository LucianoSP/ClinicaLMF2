-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos enumerados
CREATE TYPE tipo_guia AS ENUM ('sp_sadt', 'consulta', 'internacao');
CREATE TYPE status_guia AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE status_carteirinha AS ENUM ('ativa', 'vencida', 'cancelada', 'suspensa', 'em_analise');
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

-- Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id uuid UNIQUE,
    nome text NOT NULL,
    email text UNIQUE,
    tipo_usuario text DEFAULT 'operador',
    ativo boolean DEFAULT true,
    ultimo_acesso timestamptz,
    permissoes jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Planos de Saúde
CREATE TABLE IF NOT EXISTS planos_saude (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo character varying(50) UNIQUE,
    nome character varying(255) NOT NULL,
    ativo boolean DEFAULT true,
    dados_contrato jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    nome_responsavel text,
    data_nascimento date,
    cpf character varying(11),
    telefone text,
    email text,
    endereco jsonb,
    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
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
    historico_status jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id),
    UNIQUE(plano_saude_id, numero_carteirinha),
    CONSTRAINT carteirinhas_numero_carteirinha_check CHECK (numero_carteirinha ~ '^[0-9.\-]+$')
);

-- Guias
CREATE TABLE IF NOT EXISTS guias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text UNIQUE,
    data_emissao date NOT NULL,
    data_validade date NOT NULL,
    tipo tipo_guia NOT NULL,
    status status_guia DEFAULT 'pendente',
    paciente_carteirinha text NOT NULL,
    paciente_nome text NOT NULL,
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    quantidade_autorizada integer NOT NULL,
    quantidade_executada integer DEFAULT 0,
    procedimento_codigo text NOT NULL,
    procedimento_nome text NOT NULL,
    profissional_solicitante text,
    profissional_executante text,
    observacoes text,
    versao integer DEFAULT 1,
    guia_original_id uuid REFERENCES guias(id),
    valor_autorizado numeric(10,2),
    dados_autorizacao jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Guias Unimed
CREATE TABLE IF NOT EXISTS guias_unimed (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guia_id uuid REFERENCES guias(id) ON DELETE CASCADE,
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    numero_guia_operadora text UNIQUE,
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
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Lotes de Faturamento
CREATE TABLE IF NOT EXISTS lotes_faturamento (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_lote text UNIQUE NOT NULL,
    data_envio timestamptz,
    data_processamento timestamptz,
    status text DEFAULT 'em_processamento',
    plano_saude_id uuid REFERENCES planos_saude(id),
    valor_total numeric(10,2),
    quantidade_guias integer,
    retorno_operadora jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Fichas de Presença
CREATE TABLE IF NOT EXISTS fichas_presenca (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_ficha text UNIQUE,
    numero_guia text NOT NULL,
    paciente_nome text NOT NULL,
    paciente_carteirinha text NOT NULL,
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    arquivo_digitalizado text,
    arquivo_hash text,
    observacoes text,
    status text DEFAULT 'pendente',
    data_atendimento date NOT NULL,
    lote_faturamento_id uuid REFERENCES lotes_faturamento(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
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
    status_faturamento text DEFAULT 'pendente',
    data_faturamento timestamptz,
    faturado_por uuid REFERENCES usuarios(id),
    numero_lote text,
    valor_faturado numeric(10,2),
    observacoes_sessao text,
    executado boolean DEFAULT false,
    data_execucao date,
    executado_por uuid REFERENCES usuarios(id),
    paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
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
    origem text DEFAULT 'manual',
    ip_origem inet,
    dados_adicionais jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
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
    tentativas_resolucao integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Histórico de Status das Guias
CREATE TABLE IF NOT EXISTS historico_status_guias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guia_id uuid REFERENCES guias(id),
    status_anterior status_guia,
    status_novo status_guia,
    motivo text,
    dados_alteracao jsonb,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id)
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
    total_execucoes integer DEFAULT 0,
    divergencias_por_tipo jsonb,
    metricas_adicionais jsonb,
    status text DEFAULT 'em_andamento',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_carteirinhas_numero ON carteirinhas(numero_carteirinha);
CREATE INDEX IF NOT EXISTS idx_carteirinhas_paciente ON carteirinhas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_paciente_id ON guias_unimed(paciente_id);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_guia_id ON guias_unimed(guia_id);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_numero_guia ON guias_unimed(numero_guia_operadora);
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_nome ON execucoes(paciente_nome);
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_carteirinha ON execucoes(paciente_carteirinha);
CREATE INDEX IF NOT EXISTS idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX IF NOT EXISTS idx_execucoes_codigo_ficha ON execucoes(codigo_ficha);
CREATE INDEX IF NOT EXISTS idx_execucoes_data_execucao ON execucoes(data_execucao);
CREATE INDEX IF NOT EXISTS idx_guias_paciente_id ON guias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fichas_presenca_paciente_id ON fichas_presenca(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_paciente_id ON sessoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_paciente_id ON divergencias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_status_data ON sessoes(status, data_sessao);
CREATE INDEX IF NOT EXISTS idx_execucoes_guia_data ON execucoes(guia_id, data_execucao);
CREATE INDEX IF NOT EXISTS idx_divergencias_tipo_status ON divergencias(tipo_divergencia, status);

-- View Materializada para Relatórios de Faturamento
CREATE MATERIALIZED VIEW IF NOT EXISTS vw_resumo_faturamento AS
SELECT 
    g.id as guia_id,
    g.numero_guia,
    g.paciente_nome,
    g.paciente_carteirinha,
    ps.nome as plano_saude,
    COUNT(e.id) as total_execucoes,
    SUM(s.valor_sessao) as valor_total,
    g.status,
    g.created_at as data_criacao
FROM guias g
LEFT JOIN execucoes e ON e.guia_id = g.id
LEFT JOIN sessoes s ON s.id = e.sessao_id
LEFT JOIN carteirinhas c ON c.numero_carteirinha = g.paciente_carteirinha
LEFT JOIN planos_saude ps ON ps.id = c.plano_saude_id
GROUP BY g.id, g.numero_guia, g.paciente_nome, g.paciente_carteirinha, ps.nome
WITH DATA;

-- Função de Validação de Guias
CREATE OR REPLACE FUNCTION validar_guia()
RETURNS trigger AS $$
BEGIN
    -- Validar data de validade
    IF NEW.data_validade < NEW.data_emissao THEN
        RAISE EXCEPTION 'Data de validade não pode ser anterior à data de emissão';
    END IF;
    
    -- Validar quantidade autorizada
    IF NEW.quantidade_autorizada <= 0 THEN
        RAISE EXCEPTION 'Quantidade autorizada deve ser maior que zero';
    END IF;
    
    -- Validar número da guia ????????????????? 
    -- IF NEW.numero_guia !~ '^[0-9]{12}$' THEN
    --     RAISE EXCEPTION 'Número da guia deve conter 12 dígitos';
    -- END IF;
    
    -- Validar carteirinha
    IF NOT EXISTS (
        SELECT 1 FROM carteirinhas 
        WHERE numero_carteirinha = NEW.paciente_carteirinha
        AND status = 'ativa'
    ) THEN
        RAISE EXCEPTION 'Carteirinha não encontrada ou inativa: %', NEW.paciente_carteirinha;
    END IF;
    
    -- Validar transições de status
    IF TG_OP = 'UPDATE' THEN
        -- Não permitir mudança de status de 'cancelada' para outros status
        IF OLD.status = 'cancelada' AND NEW.status != 'cancelada' THEN
            RAISE EXCEPTION 'Não é permitido reativar uma guia cancelada';
        END IF;
        
        -- Não permitir mudança de 'concluida' para 'pendente'
        IF OLD.status = 'concluida' AND NEW.status = 'pendente' THEN
            RAISE EXCEPTION 'Não é permitido retornar uma guia concluída para pendente';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger para Validação de Guias
CREATE TRIGGER trigger_validar_guia
    BEFORE INSERT OR UPDATE ON guias
    FOR EACH ROW
    EXECUTE FUNCTION validar_guia();

-- Função para Atualizar Quantidade Executada
CREATE OR REPLACE FUNCTION update_guia_quantidade_executada()
RETURNS TRIGGER AS $
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Atualiza quantidade_executada baseado no total de execuções
        UPDATE guias
        SET 
            quantidade_executada = (
                SELECT COUNT(*)
                FROM execucoes
                WHERE numero_guia = NEW.numero_guia
            ),
            updated_at = now(),
            updated_by = NEW.created_by
        WHERE numero_guia = NEW.numero_guia;
        
        -- Verifica se atingiu o limite de execuções
        IF (SELECT quantidade_executada >= quantidade_autorizada 
            FROM guias 
            WHERE numero_guia = NEW.numero_guia) THEN
            
            UPDATE guias 
            SET 
                status = 'concluida',
                updated_at = now(),
                updated_by = NEW.created_by
            WHERE numero_guia = NEW.numero_guia;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE guias
        SET 
            quantidade_executada = (
                SELECT COUNT(*)
                FROM execucoes
                WHERE numero_guia = OLD.numero_guia
            ),
            updated_at = now()
        WHERE numero_guia = OLD.numero_guia;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger para Atualizar Quantidade Executada
CREATE TRIGGER trigger_update_guia_quantidade
    AFTER INSERT OR UPDATE OR DELETE ON execucoes
    FOR EACH ROW
    EXECUTE FUNCTION update_guia_quantidade_executada();

-- Função para Registrar Histórico de Status
CREATE OR REPLACE FUNCTION registrar_historico_status_guia()
RETURNS TRIGGER AS $
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO historico_status_guias (
            guia_id,
            status_anterior,
            status_novo,
            motivo,
            dados_alteracao,
            created_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'Alteração automática de status',
            jsonb_build_object(
                'quantidade_executada', NEW.quantidade_executada,
                'quantidade_autorizada', NEW.quantidade_autorizada
            ),
            NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger para Histórico de Status
CREATE TRIGGER trigger_historico_status_guia
    AFTER UPDATE ON guias
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historico_status_guia();

-- Configurações de Segurança
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guias ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY usuarios_policy ON usuarios
    USING (auth_user_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tipo_usuario = 'admin'));

CREATE POLICY guias_policy ON guias
    USING (created_by IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()) OR 
           EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tipo_usuario = 'admin'));

-- Refresh da View Materializada
CREATE OR REPLACE FUNCTION refresh_vw_resumo_faturamento()
RETURNS void AS $
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_resumo_faturamento;
END;
$ LANGUAGE plpgsql;

-- Agendar refresh automático (requer extensão pg_cron)
-- SELECT cron.schedule('0 */1 * * *', 'SELECT refresh_vw_resumo_faturamento()');

COMMENT ON TABLE guias IS 'Tabela principal para armazenamento de guias médicas';
COMMENT ON TABLE execucoes IS 'Registro de execuções de procedimentos';
COMMENT ON TABLE divergencias IS 'Registro de divergências identificadas no processo de auditoria';
COMMENT ON TABLE lotes_faturamento IS 'Controle de lotes de faturamento enviados às operadoras';

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;