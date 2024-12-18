-- Executar todos os scripts de dados de teste na ordem correta

-- 1. Criar tipos e enums
\i 20241218_create_tipo_guia.sql

-- 2. Inserir dados de planos e carteirinhas
\i 20241218_sample_planos_carteirinhas.sql

-- 3. Inserir guias
\i 20241218_sample_guias.sql

-- 4. Inserir fichas de presença
\i 20241218_sample_fichas_presenca.sql

-- 5. Inserir execuções
\i 20241218_sample_execucoes.sql
