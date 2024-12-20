-- Add foreign key constraint between guias and carteirinhas
ALTER TABLE guias
    ADD CONSTRAINT fk_guias_carteirinhas
    FOREIGN KEY (paciente_carteirinha)
    REFERENCES carteirinhas(numero_carteirinha)
    ON DELETE SET NULL;

-- Create index for paciente_carteirinha if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_guias_paciente_carteirinha ON guias(paciente_carteirinha);
