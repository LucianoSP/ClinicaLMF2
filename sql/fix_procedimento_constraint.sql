-- Adicionar a coluna procedimento_id se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_name='guias' AND column_name='procedimento_id') THEN
        ALTER TABLE guias ADD COLUMN procedimento_id uuid;
    END IF;
END $$;

-- Remover a constraint antiga se existir
ALTER TABLE guias DROP CONSTRAINT IF EXISTS guias_procedimento_id_fkey;

-- Adicionar a nova constraint com o nome específico
ALTER TABLE guias 
ADD CONSTRAINT guias_procedimento_id_fkey 
FOREIGN KEY (procedimento_id) 
REFERENCES procedimentos(id) 
ON DELETE RESTRICT;
