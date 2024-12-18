-- Inserir dados de guias
INSERT INTO guias (
    id,
    numero_guia,
    data_emissao,
    data_validade,
    tipo,
    status,
    paciente_carteirinha,
    paciente_nome,
    quantidade_autorizada,
    quantidade_executada,
    procedimento_codigo,
    procedimento_nome,
    profissional_solicitante,
    profissional_executante,
    observacoes,
    created_at,
    updated_at
)
VALUES 
    -- Maria Silva Santos (2 guias)
    ('11111111-1111-4567-8901-111111111111', 
     'GUIA001/2024', 
     '2024-01-05',
     '2024-02-05',
     'sp_sadt',
     'concluida',
     '123456789012345',
     'Maria Silva Santos',
     10,
     8,
     'PROC001',
     'Fisioterapia Convencional',
     'Dr. João Silva',
     'Dra. Ana Paula',
     'Paciente apresentou melhora significativa',
     NOW(),
     NOW()
    ),
    
    -- João Pedro Oliveira (guia pendente)
    ('22222222-2222-4567-8901-222222222222',
     'GUIA002/2024',
     '2024-01-15',
     '2024-02-15',
     'sp_sadt',
     'pendente',
     '234567890123456',
     'João Pedro Oliveira',
     12,
     0,
     'PROC002',
     'Reeducação Postural Global',
     'Dr. Carlos Eduardo',
     NULL,
     'Aguardando início do tratamento',
     NOW(),
     NOW()
    ),
    
    -- Ana Carolina Souza
    ('33333333-3333-4567-8901-333333333333',
     'GUIA003/2024',
     '2024-01-20',
     '2024-02-20',
     'consulta',
     'concluida',
     '345678901234567',
     'Ana Carolina Souza',
     1,
     1,
     'PROC003',
     'Consulta Fisioterapêutica',
     'Dra. Mariana Costa',
     'Dr. Roberto Santos',
     'Avaliação inicial realizada',
     NOW(),
     NOW()
    ),
    
    -- Carlos Eduardo Ferreira (guia cancelada)
    ('44444444-4444-4567-8901-444444444444',
     'GUIA004/2024',
     '2024-01-30',
     '2024-03-01',
     'sp_sadt',
     'cancelada',
     '456789012345678',
     'Carlos Eduardo Ferreira',
     8,
     0,
     'PROC004',
     'Hidroterapia',
     'Dr. Paulo Mendes',
     NULL,
     'Cancelado a pedido do paciente',
     NOW(),
     NOW()
    ),
    
    -- Juliana Costa Lima
    ('55555555-5555-4567-8901-555555555555',
     'GUIA005/2024',
     '2024-02-01',
     '2024-03-01',
     'consulta',
     'em_andamento',
     '567890123456789',
     'Juliana Costa Lima',
     1,
     0,
     'PROC005',
     'Avaliação Fisioterapêutica',
     'Dra. Fernanda Lima',
     'Dr. Ricardo Alves',
     'Avaliação inicial para início de tratamento',
     NOW(),
     NOW()
    );

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_guias_numero ON guias(numero_guia);
CREATE INDEX IF NOT EXISTS idx_guias_status ON guias(status);
CREATE INDEX IF NOT EXISTS idx_guias_carteirinha ON guias(paciente_carteirinha);
CREATE INDEX IF NOT EXISTS idx_guias_datas ON guias(data_emissao, data_validade);
