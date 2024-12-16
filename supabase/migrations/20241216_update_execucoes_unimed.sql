-- First, let's get a valid user ID from auth.users for the usuario_executante
WITH user_id AS (
    SELECT id FROM auth.users LIMIT 1
)
-- Now insert sample data into execucoes_unimed
INSERT INTO execucoes_unimed (
    numero_guia,
    paciente_nome,
    data_execucao,
    paciente_carteirinha,
    paciente_id,
    quantidade_sessoes,
    usuario_executante
)
SELECT
    'G' || LPAD(n::text, 9, '0') as numero_guia,
    'Paciente ' || n as paciente_nome,
    CURRENT_DATE - (n || ' days')::interval as data_execucao,
    'CART' || LPAD(n::text, 6, '0') as paciente_carteirinha,
    uuid_generate_v4() as paciente_id,
    FLOOR(RANDOM() * 10 + 1)::int as quantidade_sessoes,
    id as usuario_executante
FROM generate_series(1, 10) n
CROSS JOIN user_id;
