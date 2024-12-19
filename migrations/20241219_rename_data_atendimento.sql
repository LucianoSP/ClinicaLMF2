-- Renomear a coluna data_atendimento para data_execucao na tabela fichas_presenca
ALTER TABLE fichas_presenca RENAME COLUMN data_atendimento TO data_execucao;

-- Adicionar índice para melhorar performance de ordenação
CREATE INDEX IF NOT EXISTS idx_fichas_presenca_data_execucao ON fichas_presenca(data_execucao DESC);

-- Atualizar comentário da coluna
COMMENT ON COLUMN fichas_presenca.data_execucao IS 'Data de execução do atendimento';
