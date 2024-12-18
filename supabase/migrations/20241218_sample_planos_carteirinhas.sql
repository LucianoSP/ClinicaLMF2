-- Inserir planos de saúde
INSERT INTO planos_saude (id, nome, codigo, created_at, updated_at)
VALUES 
    ('cccccccc-cccc-4567-8901-cccccccccccc', 'Unimed', 'UNIMED001', NOW(), NOW()),
    ('dddddddd-dddd-4567-8901-dddddddddddd', 'Bradesco Saúde', 'BRAD001', NOW(), NOW());

-- Inserir carteirinhas
-- Alguns pacientes terão mais de uma carteirinha (diferentes planos ou dependentes)
INSERT INTO carteirinhas (
    id, 
    paciente_id, 
    plano_saude_id, 
    numero_carteirinha, 
    data_validade, 
    titular,
    nome_titular, 
    created_at, 
    updated_at
)
VALUES 
    -- Maria Silva Santos (titular Unimed)
    ('10000000-0000-4567-8901-000000000001', '11111111-1111-4567-8901-111111111111', 'cccccccc-cccc-4567-8901-cccccccccccc', '123456789012345', '2025-12-31', true, NULL, NOW(), NOW()),
    
    -- João Pedro Oliveira (titular Bradesco)
    ('20000000-0000-4567-8901-000000000002', '22222222-2222-4567-8901-222222222222', 'dddddddd-dddd-4567-8901-dddddddddddd', '234567890123456', '2025-12-31', true, NULL, NOW(), NOW()),
    
    -- Ana Carolina Souza (titular Unimed e dependente Bradesco)
    ('30000000-0000-4567-8901-000000000003', '33333333-3333-4567-8901-333333333333', 'cccccccc-cccc-4567-8901-cccccccccccc', '345678901234567', '2025-12-31', true, NULL, NOW(), NOW()),
    ('30000000-0000-4567-8901-000000000004', '33333333-3333-4567-8901-333333333333', 'dddddddd-dddd-4567-8901-dddddddddddd', '345678901234568', '2025-12-31', false, 'Ricardo Souza', NOW(), NOW()),
    
    -- Carlos Eduardo Ferreira (titular Unimed)
    ('40000000-0000-4567-8901-000000000005', '44444444-4444-4567-8901-444444444444', 'cccccccc-cccc-4567-8901-cccccccccccc', '456789012345678', '2025-12-31', true, NULL, NOW(), NOW()),
    
    -- Juliana Costa Lima (dependente Unimed)
    ('50000000-0000-4567-8901-000000000006', '55555555-5555-4567-8901-555555555555', 'cccccccc-cccc-4567-8901-cccccccccccc', '567890123456789', '2025-12-31', false, 'Paulo Lima', NOW(), NOW()),
    
    -- Roberto Alves Pereira (titular ambos os planos)
    ('60000000-0000-4567-8901-000000000007', '66666666-6666-4567-8901-666666666666', 'cccccccc-cccc-4567-8901-cccccccccccc', '678901234567890', '2025-12-31', true, NULL, NOW(), NOW()),
    ('60000000-0000-4567-8901-000000000008', '66666666-6666-4567-8901-666666666666', 'dddddddd-dddd-4567-8901-dddddddddddd', '678901234567891', '2025-12-31', true, NULL, NOW(), NOW()),
    
    -- Patricia Mendes Santos (titular Bradesco)
    ('70000000-0000-4567-8901-000000000009', '77777777-7777-4567-8901-777777777777', 'dddddddd-dddd-4567-8901-dddddddddddd', '789012345678901', '2025-12-31', true, NULL, NOW(), NOW()),
    
    -- Lucas Ribeiro Almeida (dependente Unimed)
    ('80000000-0000-4567-8901-000000000010', '88888888-8888-4567-8901-888888888888', 'cccccccc-cccc-4567-8901-cccccccccccc', '890123456789012', '2025-12-31', false, 'Maria Almeida', NOW(), NOW()),
    
    -- Fernanda Santos Silva (titular Unimed)
    ('90000000-0000-4567-8901-000000000011', '99999999-9999-4567-8901-999999999999', 'cccccccc-cccc-4567-8901-cccccccccccc', '901234567890123', '2025-12-31', true, NULL, NOW(), NOW()),
    
    -- Marcelo Lima Oliveira (titular Bradesco)
    ('a0000000-0000-4567-8901-000000000012', 'aaaaaaaa-aaaa-4567-8901-aaaaaaaaaaaa', 'dddddddd-dddd-4567-8901-dddddddddddd', '012345678901234', '2025-12-31', true, NULL, NOW(), NOW());

-- Criar índices adicionais se necessário
CREATE INDEX IF NOT EXISTS idx_carteirinhas_numero ON carteirinhas(numero_carteirinha);
CREATE INDEX IF NOT EXISTS idx_carteirinhas_titular ON carteirinhas(titular);
