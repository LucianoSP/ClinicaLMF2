-- Lista TODAS as triggers do banco, incluindo as do sistema
SELECT 
    event_object_schema AS schema,
    event_object_table AS tabela,
    trigger_name AS nome_trigger,
    event_manipulation AS evento,
    action_statement AS acao,
    action_timing AS momento
FROM information_schema.triggers
ORDER BY event_object_schema, event_object_table, trigger_name;

-- Lista TODAS as funções do banco
SELECT 
    n.nspname as schema,
    p.proname AS nome_funcao,
    pg_get_functiondef(p.oid) AS definicao_funcao
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prokind = 'f'  -- 'f' para funções normais
AND p.proname LIKE '%quantidade%';  -- Filtra funções que contenham 'quantidade'
