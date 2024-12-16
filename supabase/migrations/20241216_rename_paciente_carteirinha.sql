-- Rename paciente_carteirinha to paciente_id in execucoes_unimed table
ALTER TABLE execucoes_unimed 
RENAME COLUMN paciente_carteirinha TO paciente_id;
