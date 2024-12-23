-- Primeiro, vamos dropar a trigger existente
DROP TRIGGER IF EXISTS tr_update_quantidade_executada ON execucoes;

-- Depois dropamos a função
DROP FUNCTION IF EXISTS fn_update_quantidade_executada();

-- Agora criamos a nova função que lida corretamente com INSERT, UPDATE e DELETE
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

-- Criamos a nova trigger
CREATE TRIGGER tr_update_quantidade_executada
AFTER INSERT OR DELETE OR UPDATE ON execucoes
FOR EACH ROW
EXECUTE FUNCTION fn_update_quantidade_executada();
