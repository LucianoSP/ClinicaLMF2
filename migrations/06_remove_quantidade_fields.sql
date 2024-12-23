-- Remover campo quantidade_sessoes da tabela execucoes
ALTER TABLE execucoes DROP COLUMN quantidade_sessoes;

-- Remover campo quantidade da tabela divergencias
ALTER TABLE divergencias DROP COLUMN quantidade;
