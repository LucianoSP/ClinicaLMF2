-- Dar permissões para o service_role
ALTER TABLE divergencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for service role" ON divergencias
    USING (true)
    WITH CHECK (true);

-- Repetir para outras tabelas
ALTER TABLE execucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for service role" ON execucoes
    USING (true)
    WITH CHECK (true);

-- ... etc para todas as tabelas
