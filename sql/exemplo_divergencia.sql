-- Exemplo de registro de divergência de datas
INSERT INTO divergencias (
    id,
    guia_id,          -- ID da guia relacionada
    sessao_id,        -- ID da sessão onde a divergência foi encontrada
    ficha_id,         -- ID da ficha que contém a sessão
    tipo_divergencia, -- tipo da divergência encontrada
    descricao,        -- descrição detalhada do problema
    detalhes,         -- JSON com informações adicionais
    status
) VALUES (
    'uuid-gerado',
    'uuid-da-guia',
    'uuid-da-sessao',
    'uuid-da-ficha',
    'data_divergente',
    'Data da sessão (10/02/2024) difere da data de execução (14/02/2024)',
    '{
        "data_sessao": "2024-02-10",
        "data_execucao": "2024-02-14",
        "codigo_ficha": "FICHA123",
        "numero_guia": "GUIA456"
    }',
    'pendente'
);
