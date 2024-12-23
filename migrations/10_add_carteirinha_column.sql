-- Adiciona a coluna carteirinha na tabela divergencias
ALTER TABLE divergencias 
ADD COLUMN IF NOT EXISTS carteirinha VARCHAR(50);
