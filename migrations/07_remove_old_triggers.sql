-- Remover todas as triggers antigas que usam campos removidos
DROP TRIGGER IF EXISTS tr_update_quantidade_executada ON execucoes;
DROP TRIGGER IF EXISTS tr_update_quantidade ON execucoes;
DROP TRIGGER IF EXISTS tr_update_quantidade_sessoes ON execucoes;

-- Remover todas as funções antigas
DROP FUNCTION IF EXISTS fn_update_quantidade_executada();
DROP FUNCTION IF EXISTS fn_update_quantidade();
DROP FUNCTION IF EXISTS fn_update_quantidade_sessoes();

-- Criar nova trigger para atualizar quantidade_executada baseada em contagem
CREATE OR REPLACE FUNCTION fn_update_quantidade_executada()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Atualiza quantidade_executada na guia para o novo registro
        UPDATE guias 
        SET quantidade_executada = (
            SELECT COUNT(*) 
            FROM execucoes 
            WHERE numero_guia = NEW.numero_guia
        )
        WHERE numero_guia = NEW.numero_guia;
    END IF;

    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        -- Atualiza quantidade_executada na guia para o registro antigo
        UPDATE guias 
        SET quantidade_executada = (
            SELECT COUNT(*) 
            FROM execucoes 
            WHERE numero_guia = OLD.numero_guia
        )
        WHERE numero_guia = OLD.numero_guia;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar nova trigger
CREATE TRIGGER tr_update_quantidade_executada
AFTER INSERT OR DELETE OR UPDATE ON execucoes
FOR EACH ROW
EXECUTE FUNCTION fn_update_quantidade_executada();
