-- Adiciona novos campos na tabela divergencias
ALTER TABLE divergencias
ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'MEDIA',
ADD COLUMN IF NOT EXISTS paciente_nome text,
ADD COLUMN IF NOT EXISTS detalhes jsonb DEFAULT '{}'::jsonb;

-- Atualiza as prioridades existentes
UPDATE divergencias
SET prioridade = CASE 
    WHEN tipo_divergencia IN ('ficha_sem_execucao', 'execucao_sem_ficha', 'ficha_sem_assinatura', 'guia_vencida', 'quantidade_excedida') THEN 'ALTA'
    ELSE 'MEDIA'
END;

-- Cria um índice para melhorar performance de busca por prioridade
CREATE INDEX IF NOT EXISTS idx_divergencias_prioridade ON divergencias(prioridade);

-- Adiciona constraint de validação para prioridade
ALTER TABLE divergencias 
ADD CONSTRAINT check_prioridade 
CHECK (prioridade IN ('ALTA', 'MEDIA'));
