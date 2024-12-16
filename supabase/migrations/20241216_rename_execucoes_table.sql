-- Rename execucoes_unimed table to execucoes
ALTER TABLE execucoes_unimed RENAME TO execucoes;

-- Rename existing indexes
ALTER INDEX IF EXISTS idx_execucoes_unimed_numero_guia RENAME TO idx_execucoes_numero_guia;
ALTER INDEX IF EXISTS idx_execucoes_unimed_data RENAME TO idx_execucoes_data;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX IF NOT EXISTS idx_execucoes_data ON execucoes(data_execucao);
