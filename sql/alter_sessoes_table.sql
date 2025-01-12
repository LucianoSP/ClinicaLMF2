-- Remove a constraint UNIQUE da tabela sessoes
ALTER TABLE sessoes
DROP CONSTRAINT IF EXISTS sessoes_ficha_presenca_id_data_sessao_key;
