-- Renomear campos na tabela execucaos
ALTER TABLE execucaos RENAME COLUMN data_execucao TO data_execucao;
ALTER TABLE execucaos RENAME COLUMN paciente_carteirinhaTO paciente_carteirinha;
ALTER TABLE execucaos RENAME COLUMN paciente_nomeTO paciente_nome;
ALTER TABLE execucaos RENAME COLUMN guia_idTO guia_id;

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
