-- Remover todas as constraints antigas
ALTER TABLE guias DROP CONSTRAINT IF EXISTS guias_carteirinha_id_fkey;
ALTER TABLE guias DROP CONSTRAINT IF EXISTS guias_paciente_id_fkey;
ALTER TABLE guias DROP CONSTRAINT IF EXISTS guias_procedimento_id_fkey;

-- Adicionar as constraints com os nomes específicos
ALTER TABLE guias 
ADD CONSTRAINT guias_carteirinha_id_fkey 
FOREIGN KEY (carteirinha_id) 
REFERENCES carteirinhas(id) 
ON DELETE RESTRICT;

ALTER TABLE guias 
ADD CONSTRAINT guias_paciente_id_fkey 
FOREIGN KEY (paciente_id) 
REFERENCES pacientes(id) 
ON DELETE RESTRICT;

ALTER TABLE guias 
ADD CONSTRAINT guias_procedimento_id_fkey 
FOREIGN KEY (procedimento_id) 
REFERENCES procedimentos(id) 
ON DELETE RESTRICT;
