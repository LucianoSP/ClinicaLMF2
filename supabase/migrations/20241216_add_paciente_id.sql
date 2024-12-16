-- Add paciente_id column to execucoes_unimed table
ALTER TABLE execucoes_unimed 
ADD COLUMN paciente_id UUID;
