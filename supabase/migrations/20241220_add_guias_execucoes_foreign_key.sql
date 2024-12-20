-- Add foreign key constraint between guias and execucoes
ALTER TABLE execucoes
    ADD CONSTRAINT fk_execucoes_guias
    FOREIGN KEY (numero_guia)
    REFERENCES guias(numero_guia)
    ON DELETE SET NULL;

-- Create index for the foreign key
CREATE INDEX idx_execucoes_numero_guia ON execucoes(numero_guia);

-- Add trigger to update guias.quantidade_executada when execucoes are added/removed
CREATE OR REPLACE FUNCTION update_guia_quantidade_executada()
RETURNS TRIGGER AS $$
BEGIN
    -- Update quantidade_executada when execucoes are added/removed
    IF TG_OP = 'INSERT' THEN
        UPDATE guias
        SET quantidade_executada = COALESCE(quantidade_executada, 0) + NEW.quantidade_sessoes
        WHERE numero_guia = NEW.numero_guia;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE guias
        SET quantidade_executada = COALESCE(quantidade_executada, 0) - OLD.quantidade_sessoes
        WHERE numero_guia = OLD.numero_guia;
    ELSIF TG_OP = 'UPDATE' AND OLD.numero_guia != NEW.numero_guia THEN
        -- If numero_guia changed, update both old and new guias
        UPDATE guias
        SET quantidade_executada = COALESCE(quantidade_executada, 0) - OLD.quantidade_sessoes
        WHERE numero_guia = OLD.numero_guia;
        
        UPDATE guias
        SET quantidade_executada = COALESCE(quantidade_executada, 0) + NEW.quantidade_sessoes
        WHERE numero_guia = NEW.numero_guia;
    ELSIF TG_OP = 'UPDATE' AND OLD.quantidade_sessoes != NEW.quantidade_sessoes THEN
        -- If only quantidade_sessoes changed
        UPDATE guias
        SET quantidade_executada = COALESCE(quantidade_executada, 0) - OLD.quantidade_sessoes + NEW.quantidade_sessoes
        WHERE numero_guia = NEW.numero_guia;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER tr_execucoes_update_guia_quantidade
    AFTER INSERT OR UPDATE OR DELETE ON execucoes
    FOR EACH ROW
    EXECUTE FUNCTION update_guia_quantidade_executada();

-- Initialize quantidade_executada for existing guias
UPDATE guias g
SET quantidade_executada = COALESCE(
    (SELECT SUM(quantidade_sessoes)
     FROM execucoes e
     WHERE e.numero_guia = g.numero_guia
     GROUP BY e.numero_guia),
    0
);
