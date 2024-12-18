-- Remove foreign key constraint and guia_id column from execucoes table
ALTER TABLE execucoes 
    DROP CONSTRAINT IF EXISTS fk_execucoes_guias;

-- Drop the index first
DROP INDEX IF EXISTS idx_execucoes_guia_id;

-- Then drop the column
ALTER TABLE execucoes 
    DROP COLUMN IF EXISTS guia_id;
