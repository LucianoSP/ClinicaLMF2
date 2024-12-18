-- Exemplo: Criação de tipos ENUM para divergências
-- Caso já existam tipos definidos, ignore ou ajuste conforme necessário.
CREATE TYPE divergencia_tipo AS ENUM ('FALTA_ASSINATURA', 'GUIA_VENCIDA', 'SESSOES_EXCEDIDAS');
CREATE TYPE divergencia_status AS ENUM ('ABERTA', 'EM_ANALISE', 'RESOLVIDA');

-- Ajustar colunas existentes na tabela divergencias para usar os novos tipos
ALTER TABLE divergencias
  ALTER COLUMN tipo_divergencia TYPE divergencia_tipo USING tipo_divergencia::divergencia_tipo,
  ALTER COLUMN status TYPE divergencia_status USING status::divergencia_status;

------------------------------------------------------------------------
-- ADIÇÃO DE COLUNAS REFERENCIAIS E CHAVES ESTRANGEIRAS
------------------------------------------------------------------------

-- Exemplo: Adicionar paciente_id em fichas_presenca, vinculado à pacientes
ALTER TABLE fichas_presenca
  ADD COLUMN paciente_id uuid,
  ADD CONSTRAINT fichas_presenca_paciente_id_fk FOREIGN KEY (paciente_id) REFERENCES pacientes (id);

-- Adicionar guia_id em fichas_presenca, vinculado à guias
ALTER TABLE fichas_presenca
  ADD COLUMN guia_id uuid,
  ADD CONSTRAINT fichas_presenca_guia_id_fk FOREIGN KEY (guia_id) REFERENCES guias (id);

-- Exemplo: Adicionar paciente_id e guia_id em execucoes
ALTER TABLE execucoes
  ADD COLUMN paciente_id_ref uuid,
  ADD CONSTRAINT execucoes_paciente_id_fk FOREIGN KEY (paciente_id_ref) REFERENCES pacientes (id),
  ADD COLUMN guia_id_ref uuid,
  ADD CONSTRAINT execucoes_guia_id_fk FOREIGN KEY (guia_id_ref) REFERENCES guias (id);

-- Exemplo: Adicionar paciente_id e guia_id em divergencias
ALTER TABLE divergencias
  ADD COLUMN paciente_id_ref uuid,
  ADD CONSTRAINT divergencias_paciente_id_fk FOREIGN KEY (paciente_id_ref) REFERENCES pacientes (id),
  ADD COLUMN guia_id_ref uuid,
  ADD CONSTRAINT divergencias_guia_id_fk FOREIGN KEY (guia_id_ref) REFERENCES guias (id);

------------------------------------------------------------------------
-- ADIÇÃO DE CAMPOS DE AUDITORIA DE USUÁRIO (created_by, updated_by)
------------------------------------------------------------------------

-- Exemplo: Adicionar created_by e updated_by em fichas_presenca
ALTER TABLE fichas_presenca
  ADD COLUMN created_by uuid,
  ADD COLUMN updated_by uuid,
  ADD CONSTRAINT fichas_presenca_created_by_fk FOREIGN KEY (created_by) REFERENCES usuarios (id),
  ADD CONSTRAINT fichas_presenca_updated_by_fk FOREIGN KEY (updated_by) REFERENCES usuarios (id);

-- Repita conforme desejado nas demais tabelas importantes, como execucoes, guias etc.
ALTER TABLE execucoes
  ADD COLUMN created_by uuid,
  ADD COLUMN updated_by uuid,
  ADD CONSTRAINT execucoes_created_by_fk FOREIGN KEY (created_by) REFERENCES usuarios (id),
  ADD CONSTRAINT execucoes_updated_by_fk FOREIGN KEY (updated_by) REFERENCES usuarios (id);

ALTER TABLE guias
  ADD COLUMN created_by uuid,
  ADD COLUMN updated_by uuid,
  ADD CONSTRAINT guias_created_by_fk FOREIGN KEY (created_by) REFERENCES usuarios (id),
  ADD CONSTRAINT guias_updated_by_fk FOREIGN KEY (updated_by) REFERENCES usuarios (id);

------------------------------------------------------------------------
-- REMOÇÃO OU AJUSTE DE COLUNAS DUPLICADAS (OPCIONAL)
-- Por exemplo, se quiser remover paciente_carteirinha ou numero_guia textuais
-- e depender exclusivamente do guia_id e paciente_id, faça:
--
-- ALTER TABLE fichas_presenca DROP COLUMN paciente_carteirinha;
-- ALTER TABLE fichas_presenca DROP COLUMN numero_guia;
--
-- Ajuste conforme necessário. Antes, verifique se já migrou dados e se não há impactos.
------------------------------------------------------------------------

-- Índices para consultas mais rápidas (opcional)
CREATE INDEX ON execucoes (guia_id_ref);
CREATE INDEX ON execucoes (data_execucao);
CREATE INDEX ON divergencias (guia_id_ref);
CREATE INDEX ON divergencias (status);

------------------------------------------------------------------------
-- Ajustar permissões no Supabase (opcional)
-- Exemplo:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
------------------------------------------------------------------------
