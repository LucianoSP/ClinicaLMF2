-- Remove foreign key constraint and guia_id column from execucoes table
ALTER TABLE execucoes 
    DROP CONSTRAINT IF EXISTS fk_execucoes_guias,
    DROP COLUMN IF EXISTS guia_id;
