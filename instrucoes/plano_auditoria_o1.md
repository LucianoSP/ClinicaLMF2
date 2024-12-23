Auditorias Possíveis
Execuções sem ficha correspondente:
Verifica execuções registradas no sistema (tabela execucoes) que não possuem ficha de presença correspondente (tabela fichas_presenca) com base em numero_guia, data_execucao e codigo_ficha.

Fichas sem execução correspondente:
Verifica fichas de presença digitalizadas (tabela fichas_presenca) que não possuem execução registrada (tabela execucoes) com base em numero_guia, data_execucao e codigo_ficha.

Divergência na quantidade executada vs. quantidade autorizada:
Identifica guias em que a soma das execuções não bate com a quantidade autorizada na própria guia.

Ficha sem assinatura:
Identifica fichas de presença sem a devida assinatura, que deveriam corresponder a execuções realizadas.

Diferenças de data:
Identifica casos em que a data da execução não bate com a data da ficha de presença correspondente.

Exemplos:
-- Auditoria 1: Execuções sem Ficha Correspondente
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'execucao_sem_ficha' AS tipo_divergencia,
    'Execução registrada sem ficha de presença correspondente' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    e.numero_guia,
    e.data_execucao,
    e.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM execucoes e
LEFT JOIN fichas_presenca f ON f.numero_guia = e.numero_guia 
  AND f.data_execucao = e.data_execucao 
  AND f.codigo_ficha = e.codigo_ficha
WHERE f.id IS NULL;


-- Auditoria 2: Fichas sem Execução Correspondente
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'ficha_sem_execucao' AS tipo_divergencia,
    'Ficha de presença digitalizada sem execução correspondente registrada' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    f.numero_guia,
    f.data_execucao,
    f.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM fichas_presenca f
LEFT JOIN execucoes e ON e.numero_guia = f.numero_guia 
  AND e.data_execucao = f.data_execucao 
  AND e.codigo_ficha = f.codigo_ficha
WHERE e.id IS NULL;


-- Auditoria 3: Divergência na Quantidade Executada vs. Quantidade Autorizada
-- Aqui assumimos que a quantidade executada total deve ser <= quantidade_autorizada na guia
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'quantidade_divergente' AS tipo_divergencia,
    'Soma das execuções excede a quantidade autorizada na guia' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    g.numero_guia,
    NULL::date AS data_execucao,
    NULL::text AS codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM guias g
JOIN (
    SELECT numero_guia, SUM(quantidade_sessoes) AS total_executado
    FROM execucoes
    GROUP BY numero_guia
) ex ON ex.numero_guia = g.numero_guia
WHERE ex.total_executado > g.quantidade_autorizada;


-- Auditoria 4: Ficha sem Assinatura
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'ficha_sem_assinatura' AS tipo_divergencia,
    'Ficha de presença sem assinatura detectada' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    f.numero_guia,
    f.data_execucao,
    f.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM fichas_presenca f
WHERE f.possui_assinatura = false;


-- Auditoria 5: Divergência de Data entre Ficha e Execução
-- Considera-se divergência se existe a mesma guia e ficha, porém datas não batem.
-- Aqui utilizamos um exemplo simplificado: fichas e execuções que compartilham guia e ficha, mas com datas diferentes.
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'data_divergente' AS tipo_divergencia,
    'A data da ficha de presença não corresponde à data da execução registrada' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    e.numero_guia,
    e.data_execucao,
    e.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM execucoes e
JOIN fichas_presenca f ON f.numero_guia = e.numero_guia AND f.codigo_ficha = e.codigo_ficha
WHERE f.data_execucao != e.data_execucao;


