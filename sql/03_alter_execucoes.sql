-- 1. Primeiro fazer backup dos dados existentes
CREATE TABLE execucoes_backup AS SELECT * FROM execucoes;

-- 2. Adicionar as novas colunas necessárias
ALTER TABLE execucoes 
ADD COLUMN paciente_nome text,
ADD COLUMN paciente_carteirinha text,
ADD COLUMN numero_guia text,
ADD COLUMN codigo_ficha text;

-- 3. Atualizar os registros existentes com dados das tabelas relacionadas
UPDATE execucoes e
SET 
    paciente_nome = g.paciente_nome,
    paciente_carteirinha = g.paciente_carteirinha,
    numero_guia = g.numero_guia
FROM guias g
WHERE e.guia_id = g.id;

-- 4. Tornar as colunas NOT NULL depois que os dados estiverem preenchidos
ALTER TABLE execucoes 
ALTER COLUMN paciente_nome SET NOT NULL,
ALTER COLUMN paciente_carteirinha SET NOT NULL,
ALTER COLUMN numero_guia SET NOT NULL;

-- 5. Criar os índices
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_nome ON execucoes(paciente_nome);
CREATE INDEX IF NOT EXISTS idx_execucoes_paciente_carteirinha ON execucoes(paciente_carteirinha);
CREATE INDEX IF NOT EXISTS idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX IF NOT EXISTS idx_execucoes_codigo_ficha ON execucoes(codigo_ficha);
CREATE INDEX IF NOT EXISTS idx_execucoes_data_execucao ON execucoes(data_execucao);
