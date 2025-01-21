-- Create table guias_unimed to store imported guide data
CREATE TABLE IF NOT EXISTS guias_unimed (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia text NOT NULL,
    carteira text NOT NULL,
    nome_beneficiario text NOT NULL,
    codigo_procedimento text NOT NULL,
    data_atendimento date NOT NULL,
    data_execucao date,
    nome_profissional text NOT NULL,
    conselho_profissional text NOT NULL,
    numero_conselho text NOT NULL,
    uf_conselho text NOT NULL,
    codigo_cbo text NOT NULL,
    status status_guia DEFAULT 'pendente',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_guias_unimed_numero_guia ON guias_unimed(numero_guia);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_carteira ON guias_unimed(carteira);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_data_atendimento ON guias_unimed(data_atendimento);
CREATE INDEX IF NOT EXISTS idx_guias_unimed_data_execucao ON guias_unimed(data_execucao);

-- Grant permissions
GRANT ALL ON TABLE guias_unimed TO public;