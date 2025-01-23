-- Função para gerar dados aleatórios de divergências
CREATE OR REPLACE FUNCTION gerar_divergencias_teste(quantidade integer) RETURNS void AS $$
DECLARE
    tipos_divergencia text[] := ARRAY['ficha_sem_execucao', 'execucao_sem_ficha', 'sessao_sem_assinatura', 
                                    'data_divergente', 'guia_vencida', 'quantidade_excedida', 'duplicidade'];
    status_divergencia text[] := ARRAY['pendente', 'em_analise', 'resolvida', 'cancelada'];
    prioridades text[] := ARRAY['BAIXA', 'MEDIA', 'ALTA'];
    guia record;
    ficha record;
    execucao record;
    sessao record;
    usuario record;
    i integer;
BEGIN
    FOR i IN 1..quantidade LOOP
        -- Seleciona dados aleatórios das tabelas relacionadas
        SELECT id, numero_guia, paciente_id INTO guia 
        FROM guias ORDER BY random() LIMIT 1;
        
        SELECT id, codigo_ficha INTO ficha 
        FROM fichas_presenca ORDER BY random() LIMIT 1;
        
        SELECT id INTO execucao 
        FROM execucoes ORDER BY random() LIMIT 1;
        
        SELECT id INTO sessao 
        FROM sessoes ORDER BY random() LIMIT 1;
        
        SELECT id INTO usuario 
        FROM usuarios ORDER BY random() LIMIT 1;

        INSERT INTO divergencias (
            numero_guia,
            tipo_divergencia,
            descricao,
            paciente_nome,
            codigo_ficha,
            data_execucao,
            data_atendimento,
            carteirinha,
            prioridade,
            status,
            data_identificacao,
            data_resolucao,
            resolvido_por,
            detalhes,
            ficha_id,
            execucao_id,
            sessao_id,
            paciente_id,
            tentativas_resolucao,
            created_by,
            updated_by
        ) VALUES (
            guia.numero_guia,
            tipos_divergencia[floor(random() * array_length(tipos_divergencia, 1) + 1)],
            'Divergência gerada automaticamente para testes',
            (SELECT nome FROM pacientes WHERE id = guia.paciente_id),
            ficha.codigo_ficha,
            CURRENT_DATE - (floor(random() * 30)::integer || ' days')::interval,
            CURRENT_DATE - (floor(random() * 30)::integer || ' days')::interval,
            (SELECT numero_carteirinha FROM carteirinhas WHERE paciente_id = guia.paciente_id LIMIT 1),
            prioridades[floor(random() * array_length(prioridades, 1) + 1)],
            status_divergencia[floor(random() * array_length(status_divergencia, 1) + 1)],
            CURRENT_TIMESTAMP - (floor(random() * 30)::integer || ' days')::interval,
            CASE WHEN random() < 0.5 
                THEN CURRENT_TIMESTAMP - (floor(random() * 15)::integer || ' days')::interval 
                ELSE NULL 
            END,
            CASE WHEN random() < 0.5 THEN usuario.id ELSE NULL END,
            jsonb_build_object(
                'origem', 'script_teste',
                'detalhes_adicionais', 'Dados gerados automaticamente',
                'timestamp_geracao', CURRENT_TIMESTAMP
            ),
            ficha.id,
            execucao.id,
            sessao.id,
            guia.paciente_id,
            floor(random() * 3),
            usuario.id,
            usuario.id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executa a função para gerar 100 divergências de teste
SELECT gerar_divergencias_teste(100);
