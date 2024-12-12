-- Parte 1: Criação das tabelas no Supabase
-- Nota: Execute cada bloco separadamente para melhor controle

-- Criar tabela protocolos_excel
CREATE TABLE protocolos_excel (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    guia_id TEXT NOT NULL,
    paciente_nome TEXT NOT NULL,
    data_execucao TIMESTAMP NOT NULL,
    paciente_carteirinha TEXT NOT NULL,
    paciente_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para melhor performance
    CONSTRAINT idx_protocolos_guia_id UNIQUE (guia_id),
    CONSTRAINT idx_protocolos_data_execucao_carteirinha 
        UNIQUE (data_execucao, paciente_carteirinha)
);

-- Criar tabela atendimentos
CREATE TABLE atendimentos (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    data_execucao TIMESTAMP NOT NULL,
    paciente_carteirinha TEXT NOT NULL,
    paciente_nome TEXT NOT NULL,
    guia_id TEXT NOT NULL,
    codigo_ficha TEXT,
    possui_assinatura BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para melhor performance
    CONSTRAINT idx_atendimentos_codigo_ficha UNIQUE (codigo_ficha),
    CONSTRAINT idx_atendimentos_guia_id_data 
        UNIQUE (guia_id, data_execucao)
);

-- Criar tabela divergencias
CREATE TABLE divergencias (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    guia_id TEXT NOT NULL,
    data_execucao TIMESTAMP NOT NULL,
    codigo_ficha TEXT NOT NULL,
    descricao_divergencia TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para melhor performance
    CONSTRAINT idx_divergencias_guia_codigo 
        UNIQUE (guia_id, codigo_ficha)
);

-- Criar enums para status
CREATE TYPE status_divergencia AS ENUM ('Pendente', 'Resolvido', 'Em Análise');

-- Remover o valor default da coluna status
ALTER TABLE divergencias 
    ALTER COLUMN status DROP DEFAULT;

-- Alterar coluna status para usar enum
ALTER TABLE divergencias 
    ALTER COLUMN status TYPE status_divergencia 
    USING status::status_divergencia;

-- Adicionar novo valor default com o tipo correto
ALTER TABLE divergencias 
    ALTER COLUMN status SET DEFAULT 'Pendente'::status_divergencia;

-- Adicionar restrições de chave estrangeira
ALTER TABLE divergencias
    ADD CONSTRAINT fk_divergencias_atendimentos
    FOREIGN KEY (codigo_ficha)
    REFERENCES atendimentos(codigo_ficha)
    ON DELETE CASCADE;

-- Criar índices adicionais para busca
CREATE INDEX idx_protocolos_paciente_nome 
    ON protocolos_excel (paciente_nome);
CREATE INDEX idx_atendimentos_paciente_nome 
    ON atendimentos (paciente_nome);
CREATE INDEX idx_divergencias_status 
    ON divergencias (status);

-- Criar funções para auditoria de timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna updated_at e trigger em todas as tabelas
DO $$ 
BEGIN
    -- Para protocolos_excel
    ALTER TABLE protocolos_excel 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    CREATE TRIGGER update_protocolos_excel_updated_at
        BEFORE UPDATE ON protocolos_excel
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();

    -- Para atendimentos
    ALTER TABLE atendimentos 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    CREATE TRIGGER update_atendimentos_updated_at
        BEFORE UPDATE ON atendimentos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();

    -- Para divergencias
    ALTER TABLE divergencias 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    CREATE TRIGGER update_divergencias_updated_at
        BEFORE UPDATE ON divergencias
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
END $$;

-- Criar políticas RLS (Row Level Security)
ALTER TABLE protocolos_excel ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE divergencias ENABLE ROW LEVEL SECURITY;

-- Criar política padrão para autenticados
CREATE POLICY "Permitir acesso completo para usuários autenticados" ON protocolos_excel
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir acesso completo para usuários autenticados" ON atendimentos
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir acesso completo para usuários autenticados" ON divergencias
    FOR ALL USING (auth.role() = 'authenticated');

-- Parte 2: Script de migração de dados do SQLite
-- Nota: Este é um exemplo do formato dos comandos INSERT
-- Você precisará adaptar os dados do seu SQLite atual

-- Migrar protocolos_excel
INSERT INTO protocolos_excel 
    (guia_id, paciente_nome, data_execucao, paciente_carteirinha, paciente_id)
SELECT 
    idGuia,
    nomePaciente,
    TO_TIMESTAMP(dataExec, 'DD/MM/YYYY'),
    carteirinha,
    idPaciente
FROM sqlite_protocolos_excel;

-- Migrar atendimentos
INSERT INTO atendimentos 
    (data_execucao, paciente_carteirinha, paciente_nome, guia_id, 
     codigo_ficha, possui_assinatura)
SELECT 
    TO_TIMESTAMP(data_atendimento, 'DD/MM/YYYY'),
    numero_carteira,
    nome_beneficiario,
    numero_guia_principal,
    codigo_ficha,
    possui_assinatura
FROM sqlite_atendimentos;

-- Migrar divergencias
INSERT INTO divergencias 
    (guia_id, data_execucao, codigo_ficha, descricao_divergencia, status)
SELECT 
    numero_guia,
    TO_TIMESTAMP(data_exec, 'DD/MM/YYYY'),
    codigo_ficha,
    descricao_divergencia,
    status::status_divergencia
FROM sqlite_divergencias;

-- Comentários sobre a migração:
/*
1. Este script assume que você exportou seus dados do SQLite para tabelas temporárias
   no Supabase (sqlite_protocolos_excel, sqlite_atendimentos, sqlite_divergencias)

2. Para migrar os dados, você precisará:
   a) Exportar os dados do SQLite para CSV
   b) Importar os CSVs para tabelas temporárias no Supabase
   c) Executar os comandos INSERT acima para mover os dados para as tabelas finais
   d) Dropar as tabelas temporárias

3. Certifique-se de que as datas estão no formato correto antes da migração

4. Execute os INSERTs em transações para garantir a integridade dos dados

5. Faça backup dos dados antes de iniciar a migração
*/
