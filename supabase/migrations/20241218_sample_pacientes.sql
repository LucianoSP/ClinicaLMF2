-- Inserir dados de teste para pacientes
INSERT INTO pacientes (id, nome, carteirinha, created_at, updated_at)
VALUES 
    ('11111111-1111-4567-8901-111111111111', 'Maria Silva Santos', '123456789012345', NOW(), NOW()),
    ('22222222-2222-4567-8901-222222222222', 'João Pedro Oliveira', '234567890123456', NOW(), NOW()),
    ('33333333-3333-4567-8901-333333333333', 'Ana Carolina Souza', '345678901234567', NOW(), NOW()),
    ('44444444-4444-4567-8901-444444444444', 'Carlos Eduardo Ferreira', '456789012345678', NOW(), NOW()),
    ('55555555-5555-4567-8901-555555555555', 'Juliana Costa Lima', '567890123456789', NOW(), NOW()),
    ('66666666-6666-4567-8901-666666666666', 'Roberto Alves Pereira', '678901234567890', NOW(), NOW()),
    ('77777777-7777-4567-8901-777777777777', 'Patricia Mendes Santos', '789012345678901', NOW(), NOW()),
    ('88888888-8888-4567-8901-888888888888', 'Lucas Ribeiro Almeida', '890123456789012', NOW(), NOW()),
    ('99999999-9999-4567-8901-999999999999', 'Fernanda Santos Silva', '901234567890123', NOW(), NOW()),
    ('aaaaaaaa-aaaa-4567-8901-aaaaaaaaaaaa', 'Marcelo Lima Oliveira', '012345678901234', NOW(), NOW());

-- Criar índice para melhor performance em buscas por carteirinha
CREATE INDEX IF NOT EXISTS idx_pacientes_carteirinha ON pacientes(carteirinha);

-- Criar índice para buscas por nome
CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes(nome);
