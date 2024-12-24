-- Inserindo pacientes
INSERT INTO pacientes (
    id,
    nome,
    data_nascimento,
    responsavel_nome,
    responsavel_telefone,
    responsavel_email
) VALUES 
-- Ana Costa
('d11f4ca2-8f76-4b14-8d18-4a8e7f70a123',
 'Ana Costa',
 '2018-05-15',
 'Roberto Costa',
 '(11) 98765-4321',
 'roberto.costa@email.com'),

-- Lucas Ferreira
('e22f5cb3-9f77-4c15-9d19-5b9e8f81b456',
 'Lucas Ferreira',
 '2019-03-20',
 'Lucas Ferreira',
 '(11) 98765-4322',
 'lucas.ferreira@email.com'),

-- Pedro Santos
('f33f6cd4-0f78-4d16-0e20-6c0e9f92c789',
 'Pedro Santos',
 '2017-08-10',
 'Maria Santos',
 '(11) 98765-4323',
 'maria.santos@email.com');

-- Inserindo carteirinhas
INSERT INTO carteirinhas (
    paciente_id,
    plano_saude_id,
    numero_carteirinha,
    data_validade,
    titular,
    nome_titular
) VALUES 
-- Ana Costa
('d11f4ca2-8f76-4b14-8d18-4a8e7f70a123', -- substitua pelo ID real do paciente
 '550e8400-e29b-41d4-a716-446655440000', -- substitua pelo ID real do plano
 '567891',
 '2024-12-31',
 false,
 'Roberto Costa'),

-- Lucas Ferreira
('e22f5cb3-9f77-4c15-9d19-5b9e8f81b456', -- substitua pelo ID real do paciente
 '550e8400-e29b-41d4-a716-446655440000', -- substitua pelo ID real do plano
 '567892',
 '2024-12-31',
 true,
 'Lucas Ferreira'),

-- Pedro Santos
('f33f6cd4-0f78-4d16-0e20-6c0e9f92c789', -- substitua pelo ID real do paciente
 '550e8400-e29b-41d4-a716-446655440000', -- substitua pelo ID real do plano
 '567893',
 '2024-12-31',
 false,
 'Maria Santos');

-- Guias para Ana Costa
INSERT INTO guias (
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
    observacoes
) VALUES 
-- Ana Costa: Guia 1 - Terapia ABA
('GUIA001/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Em andamento', '567891', 'Ana Costa', 96, 24, 
'50000123', 'TERAPIA ABA', 'Dra. Carla Oliveira', 'Dr. Ricardo Mendes', 
'Atendimento 2x por semana'),

-- Ana Costa: Guia 2 - Fonoaudiologia
('GUIA002/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Pendente', '567891', 'Ana Costa', 48, 0,
'50000560', 'FONOAUDIOLOGIA', 'Dra. Carla Oliveira', 'Dr. Pedro Lima',
'Atendimento semanal'),

-- Ana Costa: Guia 3 - Terapia Ocupacional
('GUIA003/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Data Divergente', '567891', 'Ana Costa', 48, 2,
'50000470', 'TERAPIA OCUPACIONAL', 'Dra. Carla Oliveira', 'Dra. Maria Santos',
'Verificar datas de atendimento');

-- Guias para Lucas Ferreira
INSERT INTO guias (
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
    observacoes
) VALUES 
-- Lucas Ferreira: Guia 1 - Psicologia
('GUIA004/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Em andamento', '567892', 'Lucas Ferreira', 48, 12, 
'50000398', 'PSICOLOGIA', 'Dr. João Silva', 'Dra. Ana Beatriz', 
'Atendimento semanal'),

-- Lucas Ferreira: Guia 2 - Fonoaudiologia
('GUIA005/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Execucao Sem Ficha', '567892', 'Lucas Ferreira', 48, 1,
'50000560', 'FONOAUDIOLOGIA', 'Dr. João Silva', 'Dr. Pedro Lima',
'Sessão realizada sem registro prévio'),

-- Lucas Ferreira: Guia 3 - Terapia ABA (Antiga)
('GUIA006/2023', '2023-07-01', '2023-12-31', 'sp_sadt', 'Executada', '567892', 'Lucas Ferreira', 48, 48,
'50000123', 'TERAPIA ABA', 'Dr. João Silva', 'Dr. Ricardo Mendes',
'Guia concluída'),

-- Lucas Ferreira: Guia 4 - Psicomotricidade
('GUIA007/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Pendente', '567892', 'Lucas Ferreira', 48, 0,
'50000789', 'PSICOMOTRICIDADE', 'Dr. João Silva', 'Dr. Fernando Santos',
'Aguardando início');

-- Guias para Pedro Santos
INSERT INTO guias (
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
    observacoes
) VALUES 
-- Pedro Santos: Guia 1 - Terapia ABA
('GUIA008/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Em andamento', '567893', 'Pedro Santos', 96, 36, 
'50000123', 'TERAPIA ABA', 'Dra. Carla Oliveira', 'Dr. Ricardo Mendes', 
'Atendimento 2x por semana'),

-- Pedro Santos: Guia 2 - Fonoaudiologia
('GUIA009/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Cancelada', '567893', 'Pedro Santos', 48, 0,
'50000560', 'FONOAUDIOLOGIA', 'Dra. Carla Oliveira', 'Dr. Pedro Lima',
'Cancelada a pedido do responsável'),

-- Pedro Santos: Guia 3 - Psicologia
('GUIA010/2024', '2024-01-15', '2024-12-31', 'sp_sadt', 'Aprovada', '567893', 'Pedro Santos', 48, 4,
'50000398', 'PSICOLOGIA', 'Dra. Carla Oliveira', 'Dra. Ana Beatriz',
'Atendimento semanal'),

-- Pedro Santos: Guia 4 - Terapia Ocupacional
('GUIA011/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Em andamento', '567893', 'Pedro Santos', 48, 8,
'50000470', 'TERAPIA OCUPACIONAL', 'Dra. Carla Oliveira', 'Dra. Maria Santos',
'Atendimento semanal');
