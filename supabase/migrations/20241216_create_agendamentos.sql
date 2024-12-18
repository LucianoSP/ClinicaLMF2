-- Criar tabela de agendamentos (importada do MySQL externo)
CREATE TABLE agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mysql_id INTEGER,  -- ID original do MySQL (antigo schedule_id)
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    mysql_paciente_id INTEGER, -- ID do paciente no MySQL
    paciente_id UUID REFERENCES pacientes(id), -- Referência ao paciente no nosso sistema
    pagamento_id INTEGER,
    sala_id INTEGER,
    qtd_sessoes INTEGER,
    status VARCHAR(50),
    valor_sala DECIMAL(10,2),
    fixo BOOLEAN,
    especialidade_id INTEGER,
    local_id INTEGER,
    saldo_sessoes INTEGER,
    elegibilidade VARCHAR(100),
    falta_profissional BOOLEAN,
    agendamento_pai_id INTEGER,
    parent_id INTEGER,
    codigo_faturamento VARCHAR(100),
    data_registro TIMESTAMP WITH TIME ZONE,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX idx_agendamentos_mysql_id ON agendamentos(mysql_id);
CREATE INDEX idx_agendamentos_mysql_paciente_id ON agendamentos(mysql_paciente_id);
CREATE INDEX idx_agendamentos_paciente_id ON agendamentos(paciente_id);
CREATE INDEX idx_agendamentos_data_inicio ON agendamentos(data_inicio);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_agendamentos
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela
COMMENT ON TABLE agendamentos IS 'Tabela de agendamentos importada do MySQL externo (ps_schedule)';
COMMENT ON COLUMN agendamentos.mysql_id IS 'ID original da tabela ps_schedule do MySQL';
COMMENT ON COLUMN agendamentos.mysql_paciente_id IS 'ID original do paciente no MySQL';
COMMENT ON COLUMN agendamentos.paciente_id IS 'Referência ao paciente no sistema atual';
COMMENT ON COLUMN agendamentos.data_inicio IS 'Data e hora de início do agendamento';
COMMENT ON COLUMN agendamentos.data_fim IS 'Data e hora de fim do agendamento';
COMMENT ON COLUMN agendamentos.status IS 'Status do agendamento';
COMMENT ON COLUMN agendamentos.qtd_sessoes IS 'Quantidade de sessões';
COMMENT ON COLUMN agendamentos.saldo_sessoes IS 'Saldo de sessões restantes';
COMMENT ON COLUMN agendamentos.elegibilidade IS 'Status de elegibilidade do agendamento';
COMMENT ON COLUMN agendamentos.falta_profissional IS 'Indica se houve falta do profissional';
