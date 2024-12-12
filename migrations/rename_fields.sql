-- Renomear campos na tabela atendimentos
ALTER TABLE atendimentos RENAME COLUMN data_atendimento TO data_execucao;
ALTER TABLE atendimentos RENAME COLUMN numero_carteira TO paciente_carteirinha;
ALTER TABLE atendimentos RENAME COLUMN nome_beneficiario TO paciente_nome;
ALTER TABLE atendimentos RENAME COLUMN numero_guia_principal TO guia_id;

-- Renomear campos na tabela protocolos_excel
ALTER TABLE protocolos_excel RENAME COLUMN idGuia TO guia_id;
ALTER TABLE protocolos_excel RENAME COLUMN nomePaciente TO paciente_nome;
ALTER TABLE protocolos_excel RENAME COLUMN dataExec TO data_execucao;
ALTER TABLE protocolos_excel RENAME COLUMN carteirinha TO paciente_carteirinha;
ALTER TABLE protocolos_excel RENAME COLUMN idPaciente TO paciente_id;

-- Renomear campos na tabela divergencias
ALTER TABLE divergencias RENAME COLUMN numero_guia TO guia_id;
ALTER TABLE divergencias RENAME COLUMN data_exec TO data_execucao;
ALTER TABLE divergencias RENAME COLUMN data_registro TO created_at;
