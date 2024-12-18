-- Criar tabela de planos de saúde
CREATE TABLE planos_saude (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),  -- Código identificador do plano
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela de carteirinhas
CREATE TABLE carteirinhas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    plano_saude_id UUID NOT NULL REFERENCES planos_saude(id) ON DELETE CASCADE,
    numero_carteirinha VARCHAR(50) NOT NULL,
    data_validade DATE,
    titular BOOLEAN DEFAULT false,
    nome_titular VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(paciente_id, plano_saude_id, numero_carteirinha)
);

-- Criar índices para melhor performance
CREATE INDEX idx_carteirinhas_paciente ON carteirinhas(paciente_id);
CREATE INDEX idx_carteirinhas_plano ON carteirinhas(plano_saude_id);
CREATE INDEX idx_carteirinhas_numero ON carteirinhas(numero_carteirinha);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_planos_saude
    BEFORE UPDATE ON planos_saude
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_carteirinhas
    BEFORE UPDATE ON carteirinhas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
