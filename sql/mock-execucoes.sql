CREATE OR REPLACE FUNCTION gerar_execucoes_teste(quantidade integer) RETURNS void AS $$
DECLARE
    guia record;
    sessao record;
    usuario record;
    origem_tipos text[] := ARRAY['manual', 'automatico', 'importacao'];
    i integer;
BEGIN
    FOR i IN 1..quantidade LOOP
        -- Seleciona uma guia aleatória válida
        SELECT g.id, g.numero_guia, g.paciente_id, 
               p.nome as paciente_nome,
               c.numero_carteirinha
        INTO guia 
        FROM guias g
        JOIN pacientes p ON p.id = g.paciente_id
        JOIN carteirinhas c ON c.paciente_id = p.id
        WHERE g.status != 'cancelada'
        AND g.quantidade_executada < g.quantidade_autorizada
        ORDER BY random() 
        LIMIT 1;
        
        -- Seleciona uma sessão compatível
        SELECT id INTO sessao 
        FROM sessoes 
        WHERE paciente_id = guia.paciente_id
        AND executado = false
        ORDER BY random() 
        LIMIT 1;
        
        -- Seleciona um usuário ativo
        SELECT id INTO usuario 
        FROM usuarios 
        WHERE ativo = true 
        ORDER BY random() 
        LIMIT 1;

        INSERT INTO execucoes (
            guia_id,
            sessao_id,
            data_execucao,
            paciente_nome,
            paciente_carteirinha,
            numero_guia,
            codigo_ficha,
            usuario_executante,
            origem,
            ip_origem,
            dados_adicionais,
            created_by,
            updated_by
        ) VALUES (
            guia.id,
            sessao.id,
            CURRENT_DATE - (floor(random() * 30)::integer || ' days')::interval,
            guia.paciente_nome,
            guia.numero_carteirinha,
            guia.numero_guia,
            'FICHA-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 4, '0'),
            usuario.id,
            origem_tipos[floor(random() * array_length(origem_tipos, 1) + 1)],
            ('192.168.' || (floor(random() * 255))::text || '.' || (floor(random() * 255))::text)::inet,
            jsonb_build_object(
                'browser', CASE floor(random() * 3)::int
                    WHEN 0 THEN 'Chrome'
                    WHEN 1 THEN 'Firefox'
                    ELSE 'Safari'
                END,
                'sistema_operacional', CASE floor(random() * 3)::int
                    WHEN 0 THEN 'Windows'
                    WHEN 1 THEN 'MacOS'
                    ELSE 'Linux'
                END,
                'timestamp_execucao', CURRENT_TIMESTAMP
            ),
            usuario.id,
            usuario.id
        );

        -- Atualiza a sessão como executada
        UPDATE sessoes 
        SET executado = true,
            data_execucao = CURRENT_DATE,
            executado_por = usuario.id,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = usuario.id
        WHERE id = sessao.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executa a função para gerar 100 execuções de teste
SELECT gerar_execucoes_teste(100);