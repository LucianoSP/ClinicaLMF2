-- Create enum for tipo_guia
CREATE TYPE tipo_guia AS ENUM ('sp_sadt', 'consulta');

-- Create enum for status_guia
CREATE TYPE status_guia AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- Create guias table
CREATE TABLE guias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_guia TEXT NOT NULL UNIQUE,
    data_emissao DATE NOT NULL,
    data_validade DATE,
    tipo tipo_guia NOT NULL,
    status status_guia NOT NULL DEFAULT 'pendente',
    paciente_carteirinha TEXT NOT NULL,
    paciente_nome TEXT NOT NULL,
    quantidade_autorizada INTEGER NOT NULL DEFAULT 1,
    quantidade_executada INTEGER NOT NULL DEFAULT 0,
    procedimento_codigo TEXT,
    procedimento_nome TEXT,
    profissional_solicitante TEXT,
    profissional_executante TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_guias_numero_guia ON guias(numero_guia);
CREATE INDEX idx_guias_paciente_carteirinha ON guias(paciente_carteirinha);
CREATE INDEX idx_guias_paciente_nome ON guias(paciente_nome);
CREATE INDEX idx_guias_status ON guias(status);

-- Add trigger to update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON guias
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add foreign key to execucoes table
ALTER TABLE execucoes 
ADD COLUMN guia_id UUID,
ADD CONSTRAINT fk_execucoes_guias 
FOREIGN KEY (guia_id) 
REFERENCES guias(id);

-- Create index for the foreign key
CREATE INDEX idx_execucoes_guia_id ON execucoes(guia_id);
