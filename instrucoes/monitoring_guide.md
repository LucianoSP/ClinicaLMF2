# Guia de Monitoramento - Processing Status

## Registros por Execução

1. Um novo registro é criado para CADA execução do script
2. Se executar o script 3 vezes em um dia, terá 3 registros diferentes
3. Cada registro tem seu próprio task_id único (ex: task_20250128_100118_1634)

## Dashboard: Visões Recomendadas

### 1. Status Atual (Última Execução)

```sql

SELECT * FROM processing_status 

ORDER BY created_at DESC

LIMIT1;

```

- Mostra o estado mais recente do processamento
- Útil para monitoramento em tempo real

### 2. Histórico de Execuções (Últimas 24h)

```sql

SELECT

    task_id,

    status,

    total_guides,

    processed_guides,

    created_at,

    completed_at,

    EXTRACT(EPOCH FROM (completed_at - created_at)) as duration_seconds

FROM processing_status 

WHERE created_at > NOW() - INTERVAL '24 hours'

ORDER BY created_at DESC;

```

- Permite análise de tendências
- Identifica padrões de erro

### 3. Métricas Agregadas

```sql

SELECT

    date_trunc('hour', created_at) ashour,

    COUNT(*) as total_executions,

    SUM(total_guides) as total_guides,

    SUM(processed_guides) as processed_guides,

    COUNT(CASEWHENstatus = 'error'THEN1END) as errors

FROM processing_status

WHERE created_at > NOW() - INTERVAL '24 hours'

GROUP BYhour

ORDER BYhourDESC;

```

- Visão consolidada por hora/dia
- Útil para relatórios

## Recomendações para o Dashboard

1.**Visão Principal**

- Status da última execução
- Progresso atual (processed_guides/total_guides)
- Tempo desde última execução bem-sucedida

2.**Visão Histórica**

- Gráfico de execuções por hora
- Taxa de sucesso/erro
- Tempo médio de processamento

3.**Alertas**

- Execuções com status 'error'
- Execuções incompletas (queued > 1h)
- Anomalias no número de guias processadas

4.**Manutenção**

- Limpar registros antigos (> 30 dias)
- Manter índices otimizados
- Monitorar crescimento da tabela
