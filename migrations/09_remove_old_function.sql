-- Remove todas as triggers antigas da tabela execucoes
DROP TRIGGER IF EXISTS tr_execucoes_update_guia_quantidade ON execucoes;
DROP TRIGGER IF EXISTS tr_update_guia_quantidade_executada ON execucoes;
DROP TRIGGER IF EXISTS tr_update_quantidade_executada ON execucoes;

-- Remove todas as funções antigas com CASCADE para garantir que todas as dependências sejam removidas
DROP FUNCTION IF EXISTS update_guia_quantidade_executada() CASCADE;
DROP FUNCTION IF EXISTS fn_update_quantidade_executada() CASCADE;

-- Cria a nova função que usa apenas COUNT para calcular quantidade_executada
CREATE OR REPLACE FUNCTION fn_update_quantidade_executada()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT e UPDATE, atualiza a quantidade da nova guia
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE guias 
        SET quantidade_executada = (
            SELECT COUNT(*) 
            FROM execucoes 
            WHERE numero_guia = NEW.numero_guia
        )
        WHERE numero_guia = NEW.numero_guia;
    END IF;

    -- Para DELETE e UPDATE, atualiza a quantidade da guia antiga
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.numero_guia != NEW.numero_guia) THEN
        UPDATE guias 
        SET quantidade_executada = (
            SELECT COUNT(*) 
            FROM execucoes 
            WHERE numero_guia = OLD.numero_guia
        )
        WHERE numero_guia = OLD.numero_guia;
    END IF;
    
    -- Retorna OLD para DELETE e NEW para INSERT/UPDATE
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Cria a nova trigger
CREATE TRIGGER tr_update_quantidade_executada
AFTER INSERT OR DELETE OR UPDATE ON execucoes
FOR EACH ROW
EXECUTE FUNCTION fn_update_quantidade_executada();
