CREATE OR REPLACE FUNCTION limpar_todas_tabelas()
RETURNS void AS $$
BEGIN
    DELETE FROM divergencias;
    DELETE FROM execucoes;
    DELETE FROM sessoes;
    DELETE FROM fichas_presenca;
    DELETE FROM guias;
    DELETE FROM carteirinhas;
    DELETE FROM pacientes;
    DELETE FROM planos_saude;
    DELETE FROM usuarios;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
