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
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_resumo_faturamento_guia_id 
ON vw_resumo_faturamento (guia_id);

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
        AND c.numero_carteirinha IS NOT NULL
        AND c.numero_carteirinha != ''
    ) THEN
        RAISE EXCEPTION 'Carteirinha não encontrada, inativa ou com número inválido';
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
$$ LANGUAGE plpgsql;

-- Trigger para Validação de Guias
DROP TRIGGER IF EXISTS trigger_validar_guia ON guias;
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
DROP TRIGGER IF EXISTS trigger_update_guia_quantidade ON execucoes;
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
$$ LANGUAGE plpgsql;

-- Trigger para Histórico de Status
DROP TRIGGER IF EXISTS trigger_historico_status_guia ON guias;
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
$$ LANGUAGE plpgsql;

-- Trigger para manter contagem de sessões conferidas atualizada
DROP TRIGGER IF EXISTS trigger_update_sessoes_conferidas ON sessoes;
CREATE TRIGGER trigger_update_sessoes_conferidas
    AFTER UPDATE ON sessoes
    FOR EACH ROW
    EXECUTE FUNCTION update_sessoes_conferidas();

-- Função para atualizar data de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at em todas as tabelas
DROP TRIGGER IF EXISTS trigger_update_usuarios_timestamp ON usuarios;
CREATE TRIGGER trigger_update_usuarios_timestamp 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_planos_saude_timestamp ON planos_saude;
CREATE TRIGGER trigger_update_planos_saude_timestamp 
    BEFORE UPDATE ON planos_saude 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_pacientes_timestamp ON pacientes;
CREATE TRIGGER trigger_update_pacientes_timestamp 
    BEFORE UPDATE ON pacientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_carteirinhas_timestamp ON carteirinhas;
CREATE TRIGGER trigger_update_carteirinhas_timestamp 
    BEFORE UPDATE ON carteirinhas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_procedimentos_timestamp ON procedimentos;
CREATE TRIGGER trigger_update_procedimentos_timestamp 
    BEFORE UPDATE ON procedimentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_guias_timestamp ON guias;
CREATE TRIGGER trigger_update_guias_timestamp 
    BEFORE UPDATE ON guias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sessoes_timestamp ON sessoes;
CREATE TRIGGER trigger_update_sessoes_timestamp 
    BEFORE UPDATE ON sessoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_execucoes_timestamp ON execucoes;
CREATE TRIGGER trigger_update_execucoes_timestamp 
    BEFORE UPDATE ON execucoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_divergencias_timestamp ON divergencias;
CREATE TRIGGER trigger_update_divergencias_timestamp 
    BEFORE UPDATE ON divergencias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Configurações de Segurança
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guias ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE carteirinhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE divergencias ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
DROP POLICY IF EXISTS usuarios_policy ON usuarios;
CREATE POLICY usuarios_policy ON usuarios
    USING (auth_user_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tipo_usuario = 'admin'));

DROP POLICY IF EXISTS guias_policy ON guias;
CREATE POLICY guias_policy ON guias
    USING (created_by IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()) OR 
           EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.tipo_usuario = 'admin'));

DROP POLICY IF EXISTS procedimentos_policy ON procedimentos;
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