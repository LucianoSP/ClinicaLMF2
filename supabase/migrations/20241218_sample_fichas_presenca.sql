-- Inserir dados de fichas de presença
INSERT INTO fichas_presenca (
    id,
    data_atendimento,
    paciente_nome,
    paciente_carteirinha,
    numero_guia,
    codigo_ficha,
    possui_assinatura,
    arquivo_digitalizado,
    observacoes,
    created_at,
    updated_at
)
VALUES 
    -- Maria Silva Santos (3 fichas da mesma guia)
    ('f1111111-1111-4567-8901-111111111111',
     '2024-01-10',
     'Maria Silva Santos',
     '123456789012345',
     'GUIA001/2024',
     'FICHA001/2024',
     true,
     'fichas/2024/01/FICHA001.pdf',
     'Paciente compareceu no horário',
     NOW(),
     NOW()
    ),
    ('f1111111-1111-4567-8901-111111111112',
     '2024-01-12',
     'Maria Silva Santos',
     '123456789012345',
     'GUIA001/2024',
     'FICHA002/2024',
     true,
     'fichas/2024/01/FICHA002.pdf',
     'Paciente relatou melhora',
     NOW(),
     NOW()
    ),
    ('f1111111-1111-4567-8901-111111111113',
     '2024-01-15',
     'Maria Silva Santos',
     '123456789012345',
     'GUIA001/2024',
     'FICHA003/2024',
     true,
     'fichas/2024/01/FICHA003.pdf',
     'Evolução positiva do quadro',
     NOW(),
     NOW()
    ),
    
    -- Ana Carolina Souza (1 ficha - consulta)
    ('f3333333-3333-4567-8901-333333333333',
     '2024-01-25',
     'Ana Carolina Souza',
     '345678901234567',
     'GUIA003/2024',
     'FICHA004/2024',
     true,
     'fichas/2024/01/FICHA004.pdf',
     'Avaliação inicial completa',
     NOW(),
     NOW()
    ),
    
    -- Juliana Costa Lima (1 ficha sem assinatura)
    ('f5555555-5555-4567-8901-555555555555',
     '2024-02-05',
     'Juliana Costa Lima',
     '567890123456789',
     'GUIA005/2024',
     'FICHA005/2024',
     false,
     'fichas/2024/02/FICHA005.pdf',
     'Paciente esqueceu de assinar a ficha',
     NOW(),
     NOW()
    );

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_fichas_codigo ON fichas_presenca(codigo_ficha);
CREATE INDEX IF NOT EXISTS idx_fichas_guia ON fichas_presenca(numero_guia);
CREATE INDEX IF NOT EXISTS idx_fichas_data ON fichas_presenca(data_atendimento);
CREATE INDEX IF NOT EXISTS idx_fichas_carteirinha ON fichas_presenca(paciente_carteirinha);
