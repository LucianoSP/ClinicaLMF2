-- Insert sample data into divergencias table
INSERT INTO divergencias (numero_guia, data_execucao, codigo_ficha, tipo_divergencia, descricao, status)
VALUES 
    ('G123456789', '2024-01-15', 'F001', 'Horário Incorreto', 'Horário registrado não corresponde ao execucao real', 'pendente'),
    ('G987654321', '2024-01-16', 'F002', 'Procedimento Ausente', 'Procedimento realizado não consta na ficha', 'resolvida'),
    ('G456789123', '2024-01-17', 'F003', 'Data Divergente', 'Data de execução diferente da data agendada', 'pendente'),
    ('G789123456', '2024-01-18', 'F004', 'Profissional Incorreto', 'Profissional executante diferente do registrado', 'pendente'),
    ('G321654987', '2024-01-19', 'F005', 'Valor Incorreto', 'Valor cobrado diferente da tabela', 'pendente'),
    ('G147258369', '2024-01-20', 'F006', 'Duplicidade', 'execucao registrado em duplicidade', 'resolvida'),
    ('G963852741', '2024-01-21', 'F007', 'Paciente Incorreto', 'Nome do paciente divergente do cadastro', 'pendente'),
    ('G852963741', '2024-01-22', 'F008', 'Código Procedimento', 'Código do procedimento incorreto', 'pendente'),
    ('G741852963', '2024-01-23', 'F009', 'Falta Assinatura', 'Ausência de assinatura do paciente', 'resolvida'),
    ('G369258147', '2024-01-24', 'F010', 'Documento Ilegível', 'Documento anexado está ilegível', 'pendente');
