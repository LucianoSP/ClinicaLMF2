-- Adiciona coluna paciente_nome na tabela divergencias
ALTER TABLE divergencias ADD COLUMN paciente_nome text;

-- Atualiza os registros existentes extraindo o nome do paciente da descrição
UPDATE divergencias
SET paciente_nome = 
    CASE 
        WHEN descricao LIKE '%Paciente: %' 
            THEN substring(descricao from 'Paciente: ([^.]+)(?:\.|$)')
        ELSE NULL
    END
WHERE paciente_nome IS NULL;
