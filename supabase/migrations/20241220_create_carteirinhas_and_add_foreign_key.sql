-- Create carteirinhas table
CREATE TABLE carteirinhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_carteirinha TEXT NOT NULL UNIQUE,
    paciente_nome TEXT NOT NULL,
    data_nascimento DATE,
    cpf TEXT,
    status TEXT DEFAULT 'ativo',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for numero_carteirinha
CREATE INDEX idx_carteirinhas_numero ON carteirinhas(numero_carteirinha);

-- Add foreign key constraint between guias and carteirinhas
ALTER TABLE guias
    ADD CONSTRAINT fk_guias_carteirinhas
    FOREIGN KEY (paciente_carteirinha)
    REFERENCES carteirinhas(numero_carteirinha)
    ON DELETE SET NULL;

-- Create trigger to update updated_at
CREATE TRIGGER tr_carteirinhas_updated_at
    BEFORE UPDATE ON carteirinhas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
