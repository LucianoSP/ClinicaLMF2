-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for divergence status
CREATE TYPE status_divergencia AS ENUM ('pendente', 'resolvida', 'ignorada');

-- Table: fichas_presenca
CREATE TABLE fichas_presenca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_atendimento DATE NOT NULL,
    paciente_carteirinha TEXT NOT NULL,
    paciente_nome TEXT NOT NULL,
    numero_guia TEXT NOT NULL,
    codigo_ficha TEXT NOT NULL,
    possui_assinatura BOOLEAN NOT NULL DEFAULT false,
    arquivo_digitalizado TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: execucoes_unimed
CREATE TABLE execucoes_unimed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia TEXT NOT NULL,
    paciente_nome TEXT NOT NULL,
    data_execucao DATE NOT NULL,
    paciente_carteirinha TEXT NOT NULL,
    quantidade_sessoes INTEGER NOT NULL,
    usuario_executante UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: divergencias
CREATE TABLE divergencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia TEXT NOT NULL,
    data_execucao DATE NOT NULL,
    codigo_ficha TEXT,
    tipo_divergencia TEXT NOT NULL,
    descricao TEXT NOT NULL,
    status status_divergencia NOT NULL DEFAULT 'pendente',
    data_resolucao TIMESTAMPTZ,
    resolvido_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_fichas_numero_guia ON fichas_presenca(numero_guia);
CREATE INDEX idx_fichas_data ON fichas_presenca(data_atendimento);
CREATE INDEX idx_execucoes_numero_guia ON execucoes_unimed(numero_guia);
CREATE INDEX idx_execucoes_data ON execucoes_unimed(data_execucao);
CREATE INDEX idx_divergencias_status ON divergencias(status);
CREATE INDEX idx_divergencias_data ON divergencias(data_execucao);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables
CREATE TRIGGER update_fichas_presenca_updated_at
    BEFORE UPDATE ON fichas_presenca
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_execucoes_unimed_updated_at
    BEFORE UPDATE ON execucoes_unimed
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_divergencias_updated_at
    BEFORE UPDATE ON divergencias
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies
ALTER TABLE fichas_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_unimed ENABLE ROW LEVEL SECURITY;
ALTER TABLE divergencias ENABLE ROW LEVEL SECURITY;

-- Basic policies (you may want to adjust these based on your specific needs)
CREATE POLICY "Allow read for authenticated users" ON fichas_presenca
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated users" ON execucoes_unimed
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated users" ON divergencias
    FOR SELECT TO authenticated USING (true);

-- More restrictive policies for modifications
CREATE POLICY "Allow insert/update for authenticated users" ON fichas_presenca
    FOR ALL TO authenticated USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow insert/update for authenticated users" ON execucoes_unimed
    FOR ALL TO authenticated USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow insert/update for authenticated users" ON divergencias
    FOR ALL TO authenticated USING (true)
    WITH CHECK (true);
