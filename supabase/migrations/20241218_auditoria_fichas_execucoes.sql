-- Auditoria: Cruzamento entre fichas_presenca e execucoes

-- 1. Fichas sem execução correspondente
WITH fichas_sem_execucao AS (
    SELECT 
        f.codigo_ficha,
        f.numero_guia,
        f.data_atendimento,
        f.paciente_nome,
        'Ficha sem execução registrada' as tipo_divergencia
    FROM fichas_presenca f
    LEFT JOIN execucoes e ON f.codigo_ficha = e.codigo_ficha
    WHERE e.id IS NULL
),

-- 2. Execuções sem ficha correspondente
execucoes_sem_ficha AS (
    SELECT 
        e.codigo_ficha,
        e.numero_guia,
        e.data_execucao,
        e.paciente_nome,
        'Execução sem ficha correspondente' as tipo_divergencia
    FROM execucoes e
    LEFT JOIN fichas_presenca f ON e.codigo_ficha = f.codigo_ficha
    WHERE f.id IS NULL AND e.codigo_ficha IS NOT NULL
),

-- 3. Fichas sem assinatura
fichas_nao_assinadas AS (
    SELECT 
        f.codigo_ficha,
        f.numero_guia,
        f.data_atendimento,
        f.paciente_nome,
        'Ficha sem assinatura' as tipo_divergencia
    FROM fichas_presenca f
    WHERE NOT f.possui_assinatura
),

-- 4. Divergências de data
divergencias_data AS (
    SELECT 
        f.codigo_ficha,
        f.numero_guia,
        f.data_atendimento,
        f.paciente_nome,
        'Data da ficha diferente da execução' as tipo_divergencia
    FROM fichas_presenca f
    JOIN execucoes e ON f.codigo_ficha = e.codigo_ficha
    WHERE f.data_atendimento != e.data_execucao
)

-- União de todas as divergências
INSERT INTO divergencias (
    id,
    tipo_divergencia,
    descricao,
    status,
    data_identificacao,
    numero_guia,
    data_execucao,
    codigo_ficha,
    paciente_nome,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    tipo_divergencia,
    CASE 
        WHEN tipo_divergencia = 'Ficha sem execução registrada' 
            THEN 'Ficha de presença sem execução correspondente'
        WHEN tipo_divergencia = 'Execução sem ficha correspondente'
            THEN 'Execução registrada sem ficha de presença correspondente'
        WHEN tipo_divergencia = 'Ficha sem assinatura'
            THEN 'Ficha de presença sem assinatura do paciente'
        WHEN tipo_divergencia = 'Data da ficha diferente da execução'
            THEN 'Data da ficha não corresponde à data da execução'
    END as descricao,
    'pendente'::USER-DEFINED as status,
    NOW() as data_identificacao,
    numero_guia,
    CASE 
        WHEN tipo_divergencia = 'Ficha sem execução registrada' THEN data_atendimento
        ELSE data_atendimento
    END as data_execucao,
    codigo_ficha,
    paciente_nome,
    NOW() as created_at,
    NOW() as updated_at
FROM (
    SELECT * FROM fichas_sem_execucao
    UNION ALL
    SELECT * FROM execucoes_sem_ficha
    UNION ALL
    SELECT * FROM fichas_nao_assinadas
    UNION ALL
    SELECT * FROM divergencias_data
) todas_divergencias;

-- Consulta para visualizar as divergências encontradas
SELECT 
    tipo_divergencia,
    descricao,
    status,
    numero_guia,
    codigo_ficha,
    data_execucao
FROM divergencias
WHERE data_identificacao::date = CURRENT_DATE
ORDER BY tipo_divergencia, numero_guia;
