-- Permitir data_atendimento nula em fichas_presenca
ALTER TABLE fichas_presenca ALTER COLUMN data_atendimento DROP NOT NULL;

-- Permitir data_execucao nula em execucoes
ALTER TABLE execucoes ALTER COLUMN data_execucao DROP NOT NULL;
