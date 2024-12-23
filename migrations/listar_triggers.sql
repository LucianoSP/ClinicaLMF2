-- Lista todas as triggers do banco
SELECT 
    event_object_table AS tabela,
    trigger_name AS nome_trigger,
    event_manipulation AS evento,
    action_statement AS acao,
    action_timing AS momento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Lista todas as funções de trigger
SELECT 
    p.proname AS nome_funcao,
    pg_get_functiondef(p.oid) AS definicao_funcao
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'  -- 'f' para funções normais
AND p.proname LIKE 'fn_%';  -- Filtra apenas funções que começam com 'fn_'
