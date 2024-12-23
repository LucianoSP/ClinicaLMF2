-- Adiciona novos tipos ao ENUM tipo_divergencia
ALTER TYPE tipo_divergencia ADD VALUE IF NOT EXISTS 'guia_vencida';
ALTER TYPE tipo_divergencia ADD VALUE IF NOT EXISTS 'quantidade_excedida';
