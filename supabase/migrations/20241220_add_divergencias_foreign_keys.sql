-- Add foreign key columns to divergencias table
ALTER TABLE divergencias
    ADD COLUMN ficha_id UUID REFERENCES fichas_presenca(id),
    ADD COLUMN execucao_id UUID REFERENCES execucoes(id);

-- Create indexes for the foreign key columns
CREATE INDEX idx_divergencias_ficha_id ON divergencias(ficha_id);
CREATE INDEX idx_divergencias_execucao_id ON divergencias(execucao_id);

-- Update existing records to link with fichas_presenca
UPDATE divergencias d
SET ficha_id = f.id
FROM fichas_presenca f
WHERE d.numero_guia = f.numero_guia
  AND d.codigo_ficha = f.codigo_ficha;

-- Update existing records to link with execucoes
UPDATE divergencias d
SET execucao_id = e.id
FROM execucoes e
WHERE d.numero_guia = e.numero_guia;
