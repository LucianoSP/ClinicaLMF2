-- Modify paciente_id column in execucoes_unimed table to be TEXT instead of UUID
ALTER TABLE execucoes_unimed 
    ALTER COLUMN paciente_id TYPE TEXT;
