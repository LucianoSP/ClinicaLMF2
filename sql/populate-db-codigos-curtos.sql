-- Limpar dados existentes
DO $$ 
BEGIN
    TRUNCATE TABLE divergencias, execucoes, sessoes, fichas_presenca, 
                   guias, carteirinhas, pacientes, planos_saude, usuarios CASCADE;
END $$;

-- Inserir usuários (mantido igual)
INSERT INTO usuarios (nome, email, tipo_usuario, ativo, permissoes) VALUES
('Admin Silva', 'admin@clinica.com', 'admin', true, '{"all": true}'),
('Faturista Santos', 'faturamento@clinica.com', 'faturista', true, '{"faturamento": true}'),
('Auditor Pereira', 'auditoria@clinica.com', 'auditor', true, '{"auditoria": true}'),
('Recepcionista Lima', 'recepcao@clinica.com', 'recepcionista', true, '{"atendimento": true}'),
('Dr. Oliveira', 'medico@clinica.com', 'medico', true, '{"atendimento": true, "laudos": true}'),
('Tec. Rodrigues', 'tecnico@clinica.com', 'tecnico', true, '{"execucao": true}'),
('Coord. Costa', 'coordenador@clinica.com', 'coordenador', true, '{"gestao": true}'),
('Assist. Souza', 'assistente@clinica.com', 'assistente', true, '{"visualizacao": true}');

-- Inserir planos de saúde (mantido igual)
INSERT INTO planos_saude (codigo, nome, dados_contrato) VALUES
('001', 'Unimed', '{"tipo": "cooperativa", "abrangencia": "nacional"}'),
('002', 'Bradesco Saúde', '{"tipo": "seguradora", "abrangencia": "nacional"}'),
('003', 'Hapvida', '{"tipo": "operadora", "abrangencia": "regional"}');

-- Inserir pacientes (mantido igual)
INSERT INTO pacientes (nome, cpf, data_nascimento, telefone, email) VALUES
('João Silva', '12345678901', '1980-05-15', '11999999999', 'joao@email.com'),
('Maria Santos', '23456789012', '1990-03-20', '11988888888', 'maria@email.com'),
('Pedro Oliveira', '34567890123', '1975-08-10', '11977777777', 'pedro@email.com');

-- Inserir carteirinhas (MODIFICADO: número da carteirinha mais curto)
INSERT INTO carteirinhas (paciente_id, plano_saude_id, numero_carteirinha, data_validade, status)
SELECT 
    p.id,
    ps.id,
    LPAD(ROW_NUMBER() OVER (ORDER BY p.id, ps.id)::text, 6, '0'), -- Gera números sequenciais de 6 dígitos
    CURRENT_DATE + interval '1 year',
    'ativa'::status_carteirinha
FROM pacientes p
CROSS JOIN planos_saude ps;

-- Inserir guias (MODIFICADO: número da guia mais curto)
DO $$
DECLARE
    paciente record;
    carteirinha record;
    guia_id uuid;
    guia_counter integer := 1;
BEGIN
    FOR paciente IN SELECT * FROM pacientes LOOP
        FOR carteirinha IN SELECT * FROM carteirinhas WHERE paciente_id = paciente.id LOOP
            FOR i IN 1..5 LOOP
                INSERT INTO guias (
                    numero_guia,
                    numero_guia_operadora,
                    data_emissao,
                    data_validade,
                    tipo,
                    status,
                    carteirinha_id,
                    paciente_id,
                    quantidade_autorizada,
                    valor_autorizado
                ) VALUES (
                    'G' || LPAD(guia_counter::text, 7, '0'), -- Formato: G0000001
                    'OP' || LPAD(guia_counter::text, 6, '0'),
                    CURRENT_DATE - (i * 30 || ' days')::interval,
                    CASE 
                        WHEN i <= 2 THEN CURRENT_DATE - interval '1 day'
                        ELSE CURRENT_DATE + interval '6 months'
                    END,
                    'sp_sadt'::tipo_guia,
                    CASE 
                        WHEN i <= 2 THEN 'expirada'::status_guia
                        WHEN i = 3 THEN 'em_andamento'::status_guia
                        ELSE 'autorizada'::status_guia
                    END,
                    carteirinha.id,
                    paciente.id,
                    10,
                    500.00
                ) RETURNING id INTO guia_id;
                
                guia_counter := guia_counter + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Inserir fichas de presença (MODIFICADO: código da ficha mais curto)
DO $$
DECLARE
    paciente record;
    guia record;
    ficha_id uuid;
    ficha_counter integer := 1;
BEGIN
    FOR paciente IN SELECT * FROM pacientes LOOP
        FOR guia IN SELECT * FROM guias WHERE paciente_id = paciente.id LIMIT 5 LOOP
            INSERT INTO fichas_presenca (
                codigo_ficha,
                numero_guia,
                paciente_nome,
                paciente_carteirinha,
                paciente_id,
                data_atendimento,
                status
            ) VALUES (
                'F' || LPAD(ficha_counter::text, 7, '0'), -- Formato: F0000001
                guia.numero_guia,
                paciente.nome,
                (SELECT numero_carteirinha FROM carteirinhas WHERE id = guia.carteirinha_id),
                paciente.id,
                CURRENT_DATE - interval '1 month',
                CASE random() * 3
                    WHEN 0 THEN 'pendente'::status_ficha
                    WHEN 1 THEN 'conferido'::status_ficha
                    ELSE 'cancelado'::status_ficha
                END
            ) RETURNING id INTO ficha_id;

            ficha_counter := ficha_counter + 1;

            -- Inserir 10 sessões para cada ficha (mantido igual)
            FOR i IN 1..10 LOOP
                INSERT INTO sessoes (
                    ficha_presenca_id,
                    data_sessao,
                    possui_assinatura,
                    valor_sessao,
                    status,
                    executado,
                    paciente_id
                ) VALUES (
                    ficha_id,
                    CURRENT_DATE + ((i-1) || ' days')::interval,
                    i <= 4,
                    50.00,
                    CASE 
                        WHEN i <= 4 THEN 'conferida'::status_sessao
                        ELSE 'pendente'::status_sessao
                    END,
                    i <= 4,
                    paciente.id
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Registrar execuções (mantido igual)
INSERT INTO execucoes (
    guia_id,
    sessao_id,
    data_execucao,
    paciente_nome,
    paciente_carteirinha,
    numero_guia,
    codigo_ficha,
    usuario_executante
)
SELECT 
    g.id,
    s.id,
    s.data_sessao,
    p.nome,
    c.numero_carteirinha,
    g.numero_guia,
    fp.codigo_ficha,
    (SELECT id FROM usuarios WHERE tipo_usuario = 'tecnico' LIMIT 1)
FROM sessoes s
JOIN fichas_presenca fp ON fp.id = s.ficha_presenca_id
JOIN guias g ON g.numero_guia = fp.numero_guia
JOIN pacientes p ON p.id = s.paciente_id
JOIN carteirinhas c ON c.paciente_id = p.id
WHERE s.executado = true;