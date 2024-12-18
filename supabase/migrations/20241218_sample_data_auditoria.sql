-- Inserir dados de teste para auditoria
-- Cenário 1: Fichas e execuções correspondentes (caso ideal)
INSERT INTO fichas_presenca (id, data_atendimento, paciente_nome, paciente_carteirinha, numero_guia, codigo_ficha, possui_assinatura, arquivo_digitalizado, created_at)
VALUES 
    ('11111111-1111-4567-8901-111111111111', '2024-01-15', 'Maria Silva', '123456789', 'G001', 'F001', true, 'maria_15_01.pdf', NOW()),
    ('22222222-2222-4567-8901-222222222222', '2024-01-15', 'João Santos', '234567890', 'G002', 'F002', true, 'joao_15_01.pdf', NOW());

INSERT INTO execucoes (id, numero_guia, paciente_nome, data_execucao, paciente_carteirinha, quantidade_sessoes, codigo_ficha, created_at)
VALUES
    ('33333333-3333-4567-8901-333333333333', 'G001', 'Maria Silva', '2024-01-15', '123456789', 1, 'F001', NOW()),
    ('55555555-5555-4567-8901-555555555555', 'G002', 'João Santos', '2024-01-15', '234567890', 1, 'F002', NOW());

-- Cenário 2: Ficha sem assinatura
INSERT INTO fichas_presenca (id, data_atendimento, paciente_nome, paciente_carteirinha, numero_guia, codigo_ficha, possui_assinatura, arquivo_digitalizado, created_at)
VALUES 
    ('77777777-7777-4567-8901-777777777777', '2024-01-16', 'Ana Oliveira', '345678901', 'G003', 'F003', false, 'ana_16_01.pdf', NOW());

INSERT INTO execucoes (id, numero_guia, paciente_nome, data_execucao, paciente_carteirinha, quantidade_sessoes, codigo_ficha, created_at)
VALUES
    ('88888888-8888-4567-8901-888888888888', 'G003', 'Ana Oliveira', '2024-01-16', '345678901', 1, 'F003', NOW());

-- Cenário 3: Execução sem ficha correspondente
INSERT INTO execucoes (id, numero_guia, paciente_nome, data_execucao, paciente_carteirinha, quantidade_sessoes, codigo_ficha, created_at)
VALUES
    ('aaaaaaaa-aaaa-4567-8901-aaaaaaaaaaaa', 'G004', 'Pedro Costa', '2024-01-17', '456789012', 1, 'F004', NOW());

-- Cenário 4: Ficha sem execução correspondente
INSERT INTO fichas_presenca (id, data_atendimento, paciente_nome, paciente_carteirinha, numero_guia, codigo_ficha, possui_assinatura, arquivo_digitalizado, created_at)
VALUES 
    ('cccccccc-cccc-4567-8901-cccccccccccc', '2024-01-18', 'Lucia Ferreira', '567890123', 'G005', 'F005', true, 'lucia_18_01.pdf', NOW());

-- Cenário 5: Data divergente entre ficha e execução
INSERT INTO fichas_presenca (id, data_atendimento, paciente_nome, paciente_carteirinha, numero_guia, codigo_ficha, possui_assinatura, arquivo_digitalizado, created_at)
VALUES 
    ('dddddddd-dddd-4567-8901-dddddddddddd', '2024-01-19', 'Carlos Mendes', '678901234', 'G006', 'F006', true, 'carlos_19_01.pdf', NOW());

INSERT INTO execucoes (id, numero_guia, paciente_nome, data_execucao, paciente_carteirinha, quantidade_sessoes, codigo_ficha, created_at)
VALUES
    ('eeeeeeee-eeee-4567-8901-eeeeeeeeeeee', 'G006', 'Carlos Mendes', '2024-01-20', '678901234', 1, 'F006', NOW());

-- Cenário 6: Múltiplas execuções para a mesma ficha
INSERT INTO fichas_presenca (id, data_atendimento, paciente_nome, paciente_carteirinha, numero_guia, codigo_ficha, possui_assinatura, arquivo_digitalizado, created_at)
VALUES 
    ('12121212-1212-4567-8901-121212121212', '2024-01-21', 'Mariana Lima', '789012345', 'G007', 'F007', true, 'mariana_21_01.pdf', NOW());

INSERT INTO execucoes (id, numero_guia, paciente_nome, data_execucao, paciente_carteirinha, quantidade_sessoes, codigo_ficha, created_at)
VALUES
    ('23232323-2323-4567-8901-232323232323', 'G007', 'Mariana Lima', '2024-01-21', '789012345', 1, 'F007', NOW()),
    ('45454545-4545-4567-8901-454545454545', 'G007', 'Mariana Lima', '2024-01-21', '789012345', 1, 'F007', NOW());

-- Cenário 7: Ficha com dados incompletos
INSERT INTO fichas_presenca (id, data_atendimento, paciente_nome, paciente_carteirinha, numero_guia, codigo_ficha, possui_assinatura, arquivo_digitalizado, created_at)
VALUES 
    ('67676767-6767-4567-8901-676767676767', '2024-01-22', 'Roberto Alves', '890123456', NULL, 'F008', true, 'roberto_22_01.pdf', NOW());

INSERT INTO execucoes (id, numero_guia, paciente_nome, data_execucao, paciente_carteirinha, quantidade_sessoes, codigo_ficha, created_at)
VALUES
    ('78787878-7878-4567-8901-787878787878', 'G008', 'Roberto Alves', '2024-01-22', '890123456', 1, 'F008', NOW());
