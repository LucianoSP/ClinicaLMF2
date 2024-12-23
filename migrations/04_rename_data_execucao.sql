-- Renomeia o campo data_execucao para data_atendimento na tabela fichas_presenca
ALTER TABLE fichas_presenca 
RENAME COLUMN data_execucao TO data_atendimento;
