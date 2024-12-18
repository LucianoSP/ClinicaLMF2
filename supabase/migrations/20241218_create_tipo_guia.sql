-- Criar enum para tipos de guia
CREATE TYPE tipo_guia AS ENUM (
    'FISIOTERAPIA',           -- Tratamentos fisioterapêuticos gerais
    'RPG',                    -- Reeducação Postural Global
    'PILATES',               -- Pilates clínico
    'ACUPUNTURA',            -- Acupuntura
    'HIDROTERAPIA',          -- Fisioterapia aquática
    'AVALIACAO'              -- Avaliação inicial/reavaliação
);
