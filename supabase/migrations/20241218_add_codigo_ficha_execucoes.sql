-- Create a temporary table to store the records we want to keep
CREATE TEMP TABLE temp_fichas AS
SELECT DISTINCT ON (codigo_ficha) *
FROM fichas_presenca
WHERE codigo_ficha IS NOT NULL
ORDER BY codigo_ficha, created_at DESC;

-- Delete all records from fichas_presenca
DELETE FROM fichas_presenca;

-- Insert back only the unique records
INSERT INTO fichas_presenca
SELECT * FROM temp_fichas;

-- Add UNIQUE constraint to codigo_ficha in fichas_presenca table
ALTER TABLE fichas_presenca ADD CONSTRAINT uk_fichas_presenca_codigo_ficha UNIQUE (codigo_ficha);

-- Add codigo_ficha column to execucoes table
ALTER TABLE execucoes ADD COLUMN codigo_ficha TEXT;

-- Create index for better performance
CREATE INDEX idx_execucoes_codigo_ficha ON execucoes(codigo_ficha);

-- Add foreign key constraint to link with fichas_presenca table
ALTER TABLE execucoes 
ADD CONSTRAINT fk_execucoes_fichas_presenca 
FOREIGN KEY (codigo_ficha) 
REFERENCES fichas_presenca(codigo_ficha);
