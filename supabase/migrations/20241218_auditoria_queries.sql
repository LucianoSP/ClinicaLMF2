-- Query 1: Verificar fichas sem assinatura
SELECT 
    f.codigo_ficha,
    f.paciente_nome,
    f.data_atendimento,
    f.numero_guia
FROM fichas_presenca f
WHERE f.possui_assinatura = false;

-- Query 2: Verificar execuções sem fichas correspondentes
SELECT 
    e.codigo_ficha,
    e.paciente_nome,
    e.data_execucao,
    e.numero_guia
FROM execucoes e
LEFT JOIN fichas_presenca f ON 
    e.codigo_ficha = f.codigo_ficha AND 
    e.data_execucao = f.data_atendimento
WHERE f.id IS NULL;

-- Query 3: Verificar fichas sem execuções
SELECT 
    f.codigo_ficha,
    f.paciente_nome,
    f.data_atendimento,
    f.numero_guia
FROM fichas_presenca f
LEFT JOIN execucoes e ON 
    f.codigo_ficha = e.codigo_ficha AND 
    f.data_atendimento = e.data_execucao
WHERE e.id IS NULL;

-- Query 4: Verificar datas divergentes
SELECT 
    f.codigo_ficha,
    f.paciente_nome,
    f.data_atendimento as data_ficha,
    e.data_execucao as data_execucao,
    f.numero_guia
FROM fichas_presenca f
JOIN execucoes e ON f.codigo_ficha = e.codigo_ficha
WHERE f.data_atendimento != e.data_execucao;

-- Query 5: Verificar múltiplas execuções para mesma ficha
SELECT 
    f.codigo_ficha,
    f.paciente_nome,
    f.data_atendimento,
    f.numero_guia,
    COUNT(e.id) as quantidade_execucoes
FROM fichas_presenca f
JOIN execucoes e ON f.codigo_ficha = e.codigo_ficha
GROUP BY f.codigo_ficha, f.paciente_nome, f.data_atendimento, f.numero_guia
HAVING COUNT(e.id) > 1;

-- Query 6: Verificar dados incompletos
SELECT 
    f.codigo_ficha,
    f.paciente_nome,
    f.data_atendimento,
    f.numero_guia
FROM fichas_presenca f
WHERE 
    f.numero_guia IS NULL OR 
    f.paciente_carteirinha IS NULL OR 
    f.arquivo_digitalizado IS NULL;
