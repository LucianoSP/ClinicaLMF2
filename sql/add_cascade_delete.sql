-- Primeiro remove a constraint existente
ALTER TABLE execucoes 
DROP CONSTRAINT IF EXISTS execucoes_sessao_id_fkey;

-- Adiciona novamente com ON DELETE CASCADE
ALTER TABLE execucoes
ADD CONSTRAINT execucoes_sessao_id_fkey 
FOREIGN KEY (sessao_id) 
REFERENCES sessoes(id) 
ON DELETE CASCADE;
