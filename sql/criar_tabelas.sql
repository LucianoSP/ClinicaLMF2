-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos enumerados
CREATE TYPE status_ficha AS ENUM ('pendente', 'conferido', 'cancelado');
CREATE TYPE status_sessao AS ENUM ('pendente', 'conferida');
CREATE TYPE tipo_guia AS ENUM ('sp_sadt', 'consulta', 'internacao');
CREATE TYPE status_guia AS ENUM (
    'rascunho',
    'pendente_autorizacao',
    'autorizada',
    'em_andamento',
    'suspensa',
    'concluida',
    'cancelada',
    'expirada'
);
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
    numero_carteirinha text,
    data_validade date,
    status status_carteirinha NOT NULL DEFAULT 'ativa',
    motivo_inativacao text,
    historico_status jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id),
    UNIQUE(plano_saude_id, numero_carteirinha)
);

-- Procedimentos
CREATE TABLE IF NOT EXISTS procedimentos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo text UNIQUE NOT NULL,
    nome text NOT NULL,
    descricao text,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Dados iniciais de procedimentos
INSERT INTO procedimentos (codigo, nome, descricao) VALUES
('03.01.07.004-9', 'Consulta/Avaliação em Psicologia', 'Consulta em psicologia para avaliação inicial'),
('03.01.07.005-7', 'Consulta/Avaliação em Fonoaudiologia', 'Consulta em fonoaudiologia para avaliação inicial'),
('03.01.07.006-5', 'Consulta/Avaliação em Terapia Ocupacional', 'Consulta em terapia ocupacional para avaliação inicial'),
('03.01.07.007-3', 'Consulta/Avaliação em Fisioterapia', 'Consulta em fisioterapia para avaliação inicial'),
('03.01.07.008-1', 'Atendimento/Acompanhamento em Psicologia', 'Sessão de atendimento em psicologia'),
('03.01.07.009-0', 'Atendimento/Acompanhamento em Fonoaudiologia', 'Sessão de atendimento em fonoaudiologia'),
('03.01.07.010-3', 'Atendimento/Acompanhamento em Terapia Ocupacional', 'Sessão de atendimento em terapia ocupacional'),
('03.01.07.011-1', 'Atendimento/Acompanhamento em Fisioterapia', 'Sessão de atendimento em fisioterapia');

-- Índices para busca de procedimentos
CREATE INDEX IF NOT EXISTS idx_procedimentos_codigo ON procedimentos(codigo);
CREATE INDEX IF NOT EXISTS idx_procedimentos_nome ON procedimentos(nome);
CREATE INDEX IF NOT EXISTS idx_procedimentos_ativo ON procedimentos(ativo);

-- Guias
CREATE TABLE IF NOT EXISTS guias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text UNIQUE,
    numero_guia_operadora text,
    senha_autorizacao text,
    data_emissao date,
    data_validade date,
    data_autorizacao date,
    data_validade_senha date,
    
    tipo tipo_guia,
    status status_guia DEFAULT 'rascunho',
    
    carteirinha_id uuid REFERENCES carteirinhas(id) ON DELETE RESTRICT,
    paciente_id uuid REFERENCES pacientes(id) ON DELETE RESTRICT,
    procedimento_id uuid REFERENCES procedimentos(id) ON DELETE RESTRICT,
    
    quantidade_autorizada integer NOT NULL,
    quantidade_executada integer DEFAULT 0,
    valor_autorizado numeric(10,2),
    
    profissional_solicitante text,
    profissional_executante text,
    origem text DEFAULT 'manual',
    dados_adicionais jsonb,
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
    status status_ficha DEFAULT 'pendente',
    data_atendimento date NOT NULL,
    sessoes_conferidas integer DEFAULT 0,
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
    procedimento_id uuid REFERENCES procedimentos(id),
    profissional_executante text,
    valor_sessao numeric(10,2),
    status status_sessao DEFAULT 'pendente',
    valor_faturado numeric(10,2),
    observacoes_sessao text,
    executado boolean DEFAULT false,
    data_execucao date,
    executado_por uuid REFERENCES usuarios(id),
    paciente_id uuid REFERENCES pacientes(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Criar tabela execucoes
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
    status_biometria status_biometria DEFAULT 'nao_verificado',
    dados_adicionais jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES usuarios(id),
    updated_by uuid REFERENCES usuarios(id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_execucoes_guia_id ON execucoes(guia_id);
CREATE INDEX IF NOT EXISTS idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX IF NOT EXISTS idx_execucoes_data_execucao ON execucoes(data_execucao);
CREATE INDEX IF NOT EXISTS idx_execucoes_status_biometria ON execucoes(status_biometria);

-- Divergências
CREATE TABLE IF NOT EXISTS divergencias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text NOT NULL,
    tipo tipo_divergencia NOT NULL,
    descricao text,
    paciente_nome text,
    codigo_ficha text,
    data_execucao date,
    data_atendimento date,
    carteirinha text,
    prioridade text DEFAULT 'MEDIA',
    status status_divergencia DEFAULT 'pendente',
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
CREATE INDEX IF NOT EXISTS idx_guias_paciente_id ON guias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_guias_carteirinha_id ON guias(carteirinha_id);
CREATE INDEX IF NOT EXISTS idx_guias_numero ON guias(numero_guia);
CREATE INDEX IF NOT EXISTS idx_guias_status ON guias(status);
CREATE INDEX IF NOT EXISTS idx_guias_procedimento_id ON guias(procedimento_id);
CREATE INDEX IF NOT EXISTS idx_guias_numero_operadora ON guias(numero_guia_operadora);
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_nome ON execucoes(paciente_nome);
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_carteirinha ON execucoes(paciente_carteirinha);
CREATE INDEX IF NOT EXISTS idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX IF NOT EXISTS idx_execucoes_codigo_ficha ON execucoes(codigo_ficha);
CREATE INDEX IF NOT EXISTS idx_execucoes_data_execucao ON execucoes(data_execucao);
CREATE INDEX IF NOT EXISTS idx_fichas_presenca_paciente_id ON fichas_presenca(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_paciente_id ON sessoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_paciente_id ON divergencias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_status_data ON sessoes(status, data_sessao);
CREATE INDEX IF NOT EXISTS idx_execucoes_guia_data ON execucoes(guia_id, data_execucao);
CREATE INDEX IF NOT EXISTS idx_divergencias_tipo_status ON divergencias(tipo, status);

-- View Materializada para Relatórios de Faturamento
CREATE MATERIALIZED VIEW IF NOT EXISTS vw_resumo_faturamento AS
SELECT 
    g.id as guia_id,
    g.numero_guia,
    p.nome as paciente_nome,
    c.numero_carteirinha as paciente_carteirinha,
    ps.nome as plano_saude,
    COUNT(e.id) as total_execucoes,
    SUM(s.valor_sessao) as valor_total,
    g.status,
    g.created_at as data_criacao
FROM guias g
LEFT JOIN pacientes p ON p.id = g.paciente_id
LEFT JOIN carteirinhas c ON c.id = g.carteirinha_id
LEFT JOIN planos_saude ps ON ps.id = c.plano_saude_id
LEFT JOIN execucoes e ON e.guia_id = g.id
LEFT JOIN sessoes s ON s.id = e.sessao_id
GROUP BY 
    g.id, 
    g.numero_guia, 
    p.nome,
    c.numero_carteirinha,
    ps.nome
WITH DATA;

-- Criar índice para refresh concorrente
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_resumo_faturamento_guia_id ON vw_resumo_faturamento (guia_id);

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
    
    -- Validar carteirinha
    IF NOT EXISTS (
        SELECT 1 FROM carteirinhas c
        WHERE c.id = NEW.carteirinha_id
        AND c.status = 'ativa'
    ) THEN
        RAISE EXCEPTION 'Carteirinha não encontrada ou inativa';
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
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Atualiza quantidade_executada baseado no total de execuções
        WITH execucoes_count AS (
            SELECT COUNT(*) as total
            FROM execucoes
            WHERE guia_id = COALESCE(NEW.guia_id, OLD.guia_id)
        )
        UPDATE guias g
        SET 
            quantidade_executada = ec.total,
            updated_at = now(),
            updated_by = NEW.created_by,
            status = CASE 
                WHEN ec.total >= g.quantidade_autorizada THEN 'concluida'::status_guia 
                ELSE g.status 
            END
        FROM execucoes_count ec
        WHERE g.id = COALESCE(NEW.guia_id, OLD.guia_id);
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE guias g
        SET 
            quantidade_executada = (
                SELECT COUNT(*)
                FROM execucoes e
                WHERE e.guia_id = g.id
            ),
            updated_at = now()
        WHERE g.id = OLD.guia_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Atualizar Quantidade Executada
CREATE TRIGGER trigger_update_guia_quantidade
    AFTER INSERT OR UPDATE OR DELETE ON execucoes
    FOR EACH ROW
    EXECUTE FUNCTION update_guia_quantidade_executada();

-- Função para Registrar Histórico de Status
CREATE OR REPLACE FUNCTION registrar_historico_status_guia()
RETURNS TRIGGER AS $$
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

-- Função para atualizar sessões conferidas
CREATE OR REPLACE FUNCTION update_sessoes_conferidas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        UPDATE fichas_presenca
        SET sessoes_conferidas = (
            SELECT COUNT(*) 
            FROM sessoes 
            WHERE ficha_presenca_id = NEW.ficha_presenca_id 
            AND status = 'conferida'
        )
        WHERE id = NEW.ficha_presenca_id;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger para manter contagem de sessões conferidas atualizada
CREATE TRIGGER trigger_update_sessoes_conferidas
    AFTER UPDATE ON sessoes
    FOR EACH ROW
    EXECUTE FUNCTION update_sessoes_conferidas();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at em todas as tabelas
CREATE TRIGGER trigger_update_usuarios_timestamp BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_planos_saude_timestamp BEFORE UPDATE ON planos_saude FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_pacientes_timestamp BEFORE UPDATE ON pacientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_carteirinhas_timestamp BEFORE UPDATE ON carteirinhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_procedimentos_timestamp BEFORE UPDATE ON procedimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_guias_timestamp BEFORE UPDATE ON guias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_sessoes_timestamp BEFORE UPDATE ON sessoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_execucoes_timestamp BEFORE UPDATE ON execucoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_divergencias_timestamp BEFORE UPDATE ON divergencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Configurações de Segurança
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guias ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedimentos ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY usuarios_policy ON usuarios
    USING (auth_user_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tipo_usuario = 'admin'));

CREATE POLICY guias_policy ON guias
    USING (created_by IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()) OR 
           EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tipo_usuario = 'admin'));

CREATE POLICY procedimentos_policy ON procedimentos
    USING (TRUE)
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tipo_usuario = 'admin'));

-- Função para refresh da view materializada
CREATE OR REPLACE FUNCTION refresh_vw_resumo_faturamento()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_resumo_faturamento;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE guias IS 'Tabela principal para armazenamento de guias médicas';
COMMENT ON TABLE execucoes IS 'Registro de execuções de procedimentos';
COMMENT ON TABLE divergencias IS 'Registro de divergências identificadas no processo de auditoria';
COMMENT ON TABLE lotes_faturamento IS 'Controle de lotes de faturamento enviados às operadoras';
COMMENT ON FUNCTION update_sessoes_conferidas() IS 'Mantém atualizada a contagem de sessões conferidas na tabela fichas_presenca';

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

------------------------------ GUIAS UNIMED ------------------------------

-- Tabela de status do processamento
CREATE TABLE IF NOT EXISTS processing_status (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    status text NOT NULL,
    error text,
    processed_guides integer DEFAULT 0,
    total_guides integer DEFAULT 0,
    task_id text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de fila de guias
CREATE TABLE IF NOT EXISTS guias_queue (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text NOT NULL,
    data_execucao text NOT NULL,
    status text DEFAULT 'pending',
    error text,
    task_id text,  -- Referência ao process_status
    attempts integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    processed_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    FOREIGN KEY (task_id) REFERENCES processing_status(task_id)
);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_processing_status_updated_at
    BEFORE UPDATE ON processing_status
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_guias_queue_updated_at
    BEFORE UPDATE ON guias_queue
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();