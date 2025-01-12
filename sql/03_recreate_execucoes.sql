-- 1. Renomear a tabela antiga
ALTER TABLE execucoes RENAME TO execucoes_old;

-- 2. Criar a nova tabela com a estrutura atualizada
CREATE TABLE execucoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guia_id uuid REFERENCES guias(id),
    sessao_id uuid REFERENCES sessoes(id) ON DELETE CASCADE,
    data_execucao date NOT NULL,
    paciente_nome text NOT NULL,
    paciente_carteirinha text NOT NULL,
    numero_guia text NOT NULL,
    codigo_ficha text,
    usuario_executante uuid REFERENCES usuarios(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_guia FOREIGN KEY (guia_id) 
        REFERENCES guias(id) ON DELETE CASCADE
);

-- 3. Migrar os dados
INSERT INTO execucoes (
    id, guia_id, sessao_id, data_execucao, 
    paciente_nome, paciente_carteirinha, numero_guia,
    usuario_executante, created_at, updated_at
)
SELECT 
    e.id, e.guia_id, e.sessao_id, e.data_execucao,
    g.paciente_nome, g.paciente_carteirinha, g.numero_guia,
    e.usuario_executante, e.created_at, e.updated_at
FROM execucoes_old e
LEFT JOIN guias g ON e.guia_id = g.id;

-- 4. Criar os índices
CREATE INDEX idx_execucoes_paciente_nome ON execucoes(paciente_nome);
CREATE INDEX idx_execucoes_paciente_carteirinha ON execucoes(paciente_carteirinha);
CREATE INDEX idx_execucoes_numero_guia ON execucoes(numero_guia);
CREATE INDEX idx_execucoes_codigo_ficha ON execucoes(codigo_ficha);
CREATE INDEX idx_execucoes_data_execucao ON execucoes(data_execucao);

-- 5. Dropar a tabela antiga (opcional - pode manter como backup)
-- DROP TABLE execucoes_old;
