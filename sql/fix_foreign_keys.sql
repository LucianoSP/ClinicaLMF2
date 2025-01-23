-- Corrigir as referências para a tabela usuarios
ALTER TABLE guias DROP CONSTRAINT IF EXISTS guias_created_by_fkey;
ALTER TABLE guias DROP CONSTRAINT IF EXISTS guias_updated_by_fkey;
ALTER TABLE guias ADD CONSTRAINT guias_created_by_fkey FOREIGN KEY (created_by) REFERENCES usuarios(id);
ALTER TABLE guias ADD CONSTRAINT guias_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES usuarios(id);

ALTER TABLE procedimentos DROP CONSTRAINT IF EXISTS procedimentos_created_by_fkey;
ALTER TABLE procedimentos DROP CONSTRAINT IF EXISTS procedimentos_updated_by_fkey;
ALTER TABLE procedimentos ADD CONSTRAINT procedimentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES usuarios(id);
ALTER TABLE procedimentos ADD CONSTRAINT procedimentos_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES usuarios(id);
