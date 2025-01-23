-- Adiciona a coluna procedimento_id se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sessoes' AND column_name = 'procedimento_id') THEN
        ALTER TABLE sessoes ADD COLUMN procedimento_id uuid REFERENCES procedimentos(id);
    END IF;
END $$;

-- Atualiza os registros existentes apenas se a coluna tipo_terapia ainda existir
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'sessoes' AND column_name = 'tipo_terapia') THEN
        EXECUTE '
            UPDATE sessoes s
            SET procedimento_id = p.id
            FROM procedimentos p
            WHERE s.tipo_terapia = p.nome;
            
            -- Verifica se existem sessões que não foram vinculadas
            SELECT DISTINCT tipo_terapia
            FROM sessoes
            WHERE procedimento_id IS NULL AND tipo_terapia IS NOT NULL;
            
            -- Remove a coluna tipo_terapia
            ALTER TABLE sessoes DROP COLUMN tipo_terapia;
        ';
    END IF;
END $$;
