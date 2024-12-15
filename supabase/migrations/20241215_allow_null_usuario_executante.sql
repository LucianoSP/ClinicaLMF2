-- Modify execucoes_unimed table to allow NULL values for usuario_executante
ALTER TABLE execucoes_unimed 
    ALTER COLUMN usuario_executante DROP NOT NULL;
