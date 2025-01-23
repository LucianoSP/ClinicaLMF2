-- Remover índices
DROP INDEX IF EXISTS idx_guias_paciente_id;
DROP INDEX IF EXISTS idx_guias_numero;
DROP INDEX IF EXISTS idx_guias_status;

-- Remover a tabela
DROP TABLE IF EXISTS guias CASCADE;
