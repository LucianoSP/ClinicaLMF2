-- Inserindo plano particular
INSERT INTO planos_saude (
    id,
    nome,
    codigo
) VALUES 
('8f7e6d5c-4b3a-2d1e-9f8e-7d6c5b4a3f2e',
 'Particular',
 'PART001');

-- Inserindo carteirinhas adicionais para Ana Costa
INSERT INTO carteirinhas (
    paciente_id,
    plano_saude_id,
    numero_carteirinha,
    data_validade,
    titular,
    nome_titular
) VALUES 
-- Ana Costa - Carteirinha 2 (Plano Secundário)
('9dfde2a4-0c85-4616-82da-6476c1e94a3f',
 '550e8400-e29b-41d4-a716-446655440000', -- ID do plano existente
 '901235',
 '2024-12-31',
 false,
 'Roberto Costa'),

-- Ana Costa - Carteirinha 3 (Plano Particular)
('9dfde2a4-0c85-4616-82da-6476c1e94a3f',
 '8f7e6d5c-4b3a-2d1e-9f8e-7d6c5b4a3f2e', -- ID do plano particular novo
 '901236',
 '2024-12-31',
 false,
 'Roberto Costa');

-- Guias para Carteirinha 901234 (já existente)
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
-- Carteirinha 901234: Guia 1 - Terapia ABA
('GUIA101/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'em_andamento', '901234', 'Ana Costa', 96, 24, 
'50000123', 'TERAPIA ABA', 'Dra. Carla Oliveira', 'Dr. Ricardo Mendes', 
'Atendimento 2x por semana'),

-- Carteirinha 901234: Guia 2 - Fonoaudiologia
('GUIA102/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'pendente', '901234', 'Ana Costa', 48, 0,
'50000560', 'FONOAUDIOLOGIA', 'Dra. Carla Oliveira', 'Dr. Pedro Lima',
'Atendimento semanal');

-- Guias para Carteirinha 901235 (Plano Secundário)
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
-- Carteirinha 901235: Guia 1 - Psicologia
('GUIA103/2024', '2024-01-15', '2024-12-31', 'sp_sadt', 'pendente', '901235', 'Ana Costa', 48, 4,
'50000398', 'PSICOLOGIA', 'Dr. João Silva', 'Dra. Ana Beatriz',
'Atendimento semanal'),

-- Carteirinha 901235: Guia 2 - Terapia Ocupacional
('GUIA104/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'em_andamento', '901235', 'Ana Costa', 48, 8,
'50000470', 'TERAPIA OCUPACIONAL', 'Dr. João Silva', 'Dra. Maria Santos',
'Atendimento semanal');

-- Guias para Carteirinha 901236 (Plano Particular)
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
-- Carteirinha 901236: Guia 1 - Psicomotricidade
('GUIA105/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'em_andamento', '901236', 'Ana Costa', 48, 12,
'50000789', 'PSICOMOTRICIDADE', 'Dra. Carla Oliveira', 'Dr. Fernando Santos',
'Atendimento semanal'),

-- Carteirinha 901236: Guia 2 - Terapia ABA
('GUIA106/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'pendente', '901236', 'Ana Costa', 96, 2,
'50000123', 'TERAPIA ABA', 'Dra. Carla Oliveira', 'Dr. Ricardo Mendes',
'Verificar datas de atendimento'),

-- Carteirinha 901236: Guia 3 - Fonoaudiologia (Antiga)
('GUIA107/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'concluida', '901236', 'Ana Costa', 48, 48,
'50000560', 'FONOAUDIOLOGIA', 'Dra. Carla Oliveira', 'Dr. Pedro Lima',
'Todas as sessões realizadas');
