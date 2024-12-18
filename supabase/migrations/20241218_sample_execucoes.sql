-- Inserir dados de execuções
INSERT INTO execucoes (
    id,
    numero_guia,
    paciente_nome,
    data_execucao,
    paciente_carteirinha,
    paciente_id,
    quantidade_sessoes,
    usuario_executante,
    codigo_ficha,
    created_at,
    updated_at
)
VALUES 
    -- Maria Silva Santos (3 execuções correspondentes às fichas)
    ('e1111111-1111-4567-8901-111111111111',
     'GUIA001/2024',
     'Maria Silva Santos',
     '2024-01-10',
     '123456789012345',
     '11111111-1111-4567-8901-111111111111',
     1,
     NULL, -- usuário executante será adicionado quando criarmos a tabela de usuários
     'FICHA001/2024',
     NOW(),
     NOW()
    ),
    ('e1111111-1111-4567-8901-111111111112',
     'GUIA001/2024',
     'Maria Silva Santos',
     '2024-01-12',
     '123456789012345',
     '11111111-1111-4567-8901-111111111111',
     1,
     NULL,
     'FICHA002/2024',
     NOW(),
     NOW()
    ),
    ('e1111111-1111-4567-8901-111111111113',
     'GUIA001/2024',
     'Maria Silva Santos',
     '2024-01-15',
     '123456789012345',
     '11111111-1111-4567-8901-111111111111',
     1,
     NULL,
     'FICHA003/2024',
     NOW(),
     NOW()
    ),
    
    -- Ana Carolina Souza (1 execução da consulta)
    ('e3333333-3333-4567-8901-333333333333',
     'GUIA003/2024',
     'Ana Carolina Souza',
     '2024-01-25',
     '345678901234567',
     '33333333-3333-4567-8901-333333333333',
     1,
     NULL,
     'FICHA004/2024',
     NOW(),
     NOW()
    ),
    
    -- Juliana Costa Lima (1 execução, mas ficha sem assinatura - gerará divergência)
    ('e5555555-5555-4567-8901-555555555555',
     'GUIA005/2024',
     'Juliana Costa Lima',
     '2024-02-05',
     '567890123456789',
     '55555555-5555-4567-8901-555555555555',
     1,
     NULL,
     'FICHA005/2024',
     NOW(),
     NOW()
    ),
    
    -- Execução extra sem ficha correspondente (gerará divergência)
    ('e6666666-6666-4567-8901-666666666666',
     'GUIA001/2024',
     'Maria Silva Santos',
     '2024-01-17',
     '123456789012345',
     '11111111-1111-4567-8901-111111111111',
     1,
     NULL,
     NULL, -- sem código de ficha
     NOW(),
     NOW()
    );

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_execucoes_guia ON execucoes(numero_guia);
CREATE INDEX IF NOT EXISTS idx_execucoes_ficha ON execucoes(codigo_ficha);
CREATE INDEX IF NOT EXISTS idx_execucoes_data ON execucoes(data_execucao);
CREATE INDEX IF NOT EXISTS idx_execucoes_carteirinha ON execucoes(paciente_carteirinha);
