-- View para sessões completas
CREATE VIEW vw_sessoes_completas AS
SELECT 
    s.*,
    f.codigo_ficha,
    f.numero_guia,
    f.paciente_nome,
    f.paciente_carteirinha
FROM sessoes s
JOIN fichas_presenca f ON s.ficha_presenca_id = f.id;

-- View para contagem de sessões por guia
CREATE VIEW vw_sessoes_por_guia AS
SELECT 
    g.id as guia_id,
    g.numero_guia,
    g.quantidade_autorizada,
    COUNT(e.id) as quantidade_executada,
    g.quantidade_autorizada - COUNT(e.id) as saldo_sessoes
FROM guias g
LEFT JOIN execucoes e ON g.id = e.guia_id
GROUP BY g.id, g.numero_guia, g.quantidade_autorizada;

-- View para carteirinhas ativas
CREATE VIEW vw_carteirinhas_ativas AS
SELECT 
    c.*,
    p.nome as paciente_nome,
    ps.nome as plano_nome
FROM carteirinhas c
JOIN pacientes p ON c.paciente_id = p.id
JOIN planos_saude ps ON c.plano_saude_id = ps.id
WHERE c.ativo = true
AND c.data_validade >= CURRENT_DATE;

-- View para divergências com datas
CREATE VIEW vw_divergencias_datas AS
SELECT *
FROM divergencias
WHERE tipo_divergencia = 'data_divergente'
AND data_sessao != data_execucao;

-- View para resumo de auditorias
CREATE VIEW vw_resumo_auditorias AS
SELECT 
    ae.*,
    u.nome as criado_por_nome,
    uf.nome as finalizado_por_nome,
    COALESCE(ae.total_divergencias::float / NULLIF(ae.total_protocolos, 0), 0) as percentual_divergencias
FROM auditoria_execucoes ae
LEFT JOIN usuarios u ON ae.created_by = u.id
LEFT JOIN usuarios uf ON ae.finalizado_por = uf.id;
