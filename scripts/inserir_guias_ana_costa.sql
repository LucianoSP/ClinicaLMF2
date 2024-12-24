-- Inserindo guias para Ana Costa
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
-- Guia 1: Terapia Ocupacional
('GUIA001/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Em andamento', '567891', 'Ana Costa', 48, 12, 
'50000470', 'TERAPIA OCUPACIONAL', 'Dr. João Silva', 'Dra. Maria Santos', 
'Atendimento semanal'),

-- Guia 2: Fonoaudiologia
('GUIA002/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Pendente', '567891', 'Ana Costa', 48, 0,
'50000560', 'FONOAUDIOLOGIA', 'Dr. João Silva', 'Dr. Pedro Lima',
'Atendimento 2x por semana'),

-- Guia 3: Psicologia
('GUIA003/2024', '2024-01-15', '2024-12-31', 'sp_sadt', 'Aprovada', '567891', 'Ana Costa', 48, 4,
'50000398', 'PSICOLOGIA', 'Dr. João Silva', 'Dra. Ana Beatriz',
'Atendimento semanal'),

-- Guia 4: Terapia Ocupacional (antiga)
('GUIA004/2023', '2023-07-01', '2023-12-31', 'sp_sadt', 'Executada', '567891', 'Ana Costa', 24, 24,
'50000470', 'TERAPIA OCUPACIONAL', 'Dr. João Silva', 'Dra. Maria Santos',
'Guia anterior concluída'),

-- Guia 5: Fonoaudiologia (cancelada)
('GUIA005/2023', '2023-12-01', '2024-11-30', 'sp_sadt', 'Cancelada', '567891', 'Ana Costa', 48, 0,
'50000560', 'FONOAUDIOLOGIA', 'Dr. João Silva', 'Dr. Pedro Lima',
'Guia cancelada por mudança de profissional'),

-- Guia 6: Psicologia (data divergente)
('GUIA006/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Data Divergente', '567891', 'Ana Costa', 48, 2,
'50000398', 'PSICOLOGIA', 'Dr. João Silva', 'Dra. Ana Beatriz',
'Divergência na data de execução'),

-- Guia 7: Terapia Ocupacional (execução sem ficha)
('GUIA007/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Execucao Sem Ficha', '567891', 'Ana Costa', 48, 1,
'50000470', 'TERAPIA OCUPACIONAL', 'Dr. João Silva', 'Dra. Maria Santos',
'Sessão realizada sem registro prévio'),

-- Guia 8: Terapia ABA
('GUIA008/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Em andamento', '567891', 'Ana Costa', 96, 24, 
'50000123', 'TERAPIA ABA', 'Dra. Carla Oliveira', 'Dr. Ricardo Mendes', 
'Atendimento 2x por semana'),

-- Guia 9: Psicomotricidade
('GUIA009/2024', '2024-01-01', '2024-12-31', 'sp_sadt', 'Pendente', '567891', 'Ana Costa', 48, 0,
'50000789', 'PSICOMOTRICIDADE', 'Dra. Carla Oliveira', 'Dr. Fernando Santos',
'Atendimento semanal');
