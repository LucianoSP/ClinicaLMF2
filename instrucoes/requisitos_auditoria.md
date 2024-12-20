# Requisitos de Auditoria - Sistema de execucaos Médicos

## 1. Contexto Geral

## 1. Estrutura do Banco de Dados

### 1.1 Tabelas Principais

#### `pacientes` (Pacientes)
```sql
CREATE TABLE pacientes (
    id uuid PRIMARY KEY,
    nome text,
    carteirinha text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Armazena informações básicas dos pacientes
- Mantém histórico de datas de criação e atualização

#### `carteirinhas` (Carteirinhas dos Pacientes)
```sql
CREATE TABLE carteirinhas (
    id uuid PRIMARY KEY,
    paciente_id uuid,
    plano_saude_id uuid,
    numero_carteirinha character varying(50),
    data_validade date,
    titular boolean,
    nome_titular character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Vincula pacientes a planos de saúde
- Controla titularidade e validade das carteirinhas
- Mantém histórico de datas de criação e atualização

#### `planos_saude` (Planos de Saúde)
```sql
CREATE TABLE planos_saude (
    id uuid PRIMARY KEY,
    codigo character varying(50),
    nome character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Armazena informações sobre os planos de saúde
- Mantém histórico de datas de criação e atualização

#### `guias` (Guias Médicas)
```sql
CREATE TABLE guias (
    id uuid PRIMARY KEY,
    numero_guia text,
    data_emissao date,
    data_validade date,
    tipo USER-DEFINED,
    status USER-DEFINED,
    paciente_carteirinha text,
    paciente_nome text,
    quantidade_autorizada integer,
    quantidade_executada integer,
    procedimento_codigo text,
    procedimento_nome text,
    profissional_solicitante text,
    profissional_executante text,
    observacoes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Armazena informações completas das guias médicas
- Controla quantidades autorizadas e executadas
- Mantém informações sobre procedimentos e profissionais

#### `fichas_presenca` (Fichas Digitalizadas)
```sql
CREATE TABLE fichas_presenca (
    id uuid PRIMARY KEY,
    data_execucao date,
    paciente_nome text,
    paciente_carteirinha text,
    numero_guia text,
    codigo_ficha text,
    possui_assinatura boolean,
    arquivo_digitalizado text,
    observacoes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Armazena as fichas físicas digitalizadas
- Controla presença de assinaturas
- Permite observações sobre o execucao

#### `execucoes` (Execuções no Sistema)
```sql
CREATE TABLE execucoes (
    id uuid PRIMARY KEY,
    numero_guia text,
    paciente_nome text,
    data_execucao date,
    paciente_carteirinha text,
    paciente_id text,
    quantidade_sessoes integer,
    usuario_executante uuid,
    codigo_ficha text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Registra execuções feitas no sistema
- Relaciona com guias através do numero_guia
- Controla quantidade de sessões executadas

#### `divergencias` (Inconsistências Encontradas)
```sql
CREATE TABLE divergencias (
    id uuid PRIMARY KEY,
    tipo_divergencia text,
    descricao text,
    status USER-DEFINED,
    data_identificacao timestamp with time zone,
    data_resolucao timestamp with time zone,
    resolvido_por uuid,
    observacoes text,
    numero_guia text,
    data_execucao date,
    codigo_ficha text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Registra divergências identificadas
- Controla status e resolução
- Mantém histórico completo

#### `usuarios` (Usuários do Sistema)
```sql
CREATE TABLE usuarios (
    id uuid PRIMARY KEY,
    auth_user_id uuid,
    nome text,
    email text,
    ativo boolean,
    ultimo_acesso timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Gerencia usuários do sistema
- Controla acesso e status

#### `agendamentos` (Agendamentos)
```sql
CREATE TABLE agendamentos (
    id uuid PRIMARY KEY,
    mysql_id integer,
    paciente_id uuid,
    data_inicio timestamp with time zone,
    data_fim timestamp with time zone,
    pagamento_id integer,
    sala_id integer,
    qtd_sessoes integer,
    status character varying(50),
    valor_sala numeric,
    fixo boolean,
    especialidade_id integer,
    local_id integer,
    elegibilidade character varying(100),
    falta_profissional boolean,
    parent_id integer,
    agendamento_pai_id integer,
    codigo_faturamento character varying(100),
    data_registro timestamp with time zone,
    ultima_atualizacao timestamp with time zone,
    saldo_sessoes integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```
- Controla agendamentos dos pacientes
- Mantém informações sobre sessões e status
- Permite controle de faltas e faturamento

#### `auditoria_execucoes` (Metadados de Execuções de Auditoria)
```sql
CREATE TABLE auditoria_execucoes (
    id uuid PRIMARY KEY,
    data_execucao timestamp with time zone,
    data_inicial date,
    data_final date,
    total_protocolos integer,
    total_divergencias integer,
    divergencias_por_tipo jsonb,
    created_by uuid REFERENCES usuarios(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```
- Armazena metadados de cada execução de auditoria
- Registra totais e tipos de divergências encontradas
- Mantém histórico de quem executou a auditoria


## 2. Verificações de Auditoria

### 2.1. Verificações por Ficha
- Cada execucao deve ter uma ficha de presença preenchida
- Cada ficha deve ter um `codigo_ficha` único
- O número de execuções na tabela `execucoes` deve corresponder exatamente ao número de execucaos na ficha
- O `codigo_ficha` deve ser idêntico em ambas as tabelas

### 2.2. Verificações de Datas e Guias
- A `data_execucao` na tabela `execucoes` deve ser igual à `data_execucao` na tabela `fichas_presenca`
- O `numero_guia` deve ser idêntico em ambas as tabelas
- Todas as datas de execucao devem estar devidamente preenchidas

### 2.3. Verificações de Assinaturas
- Cada execucao realizado deve ter uma assinatura correspondente
- A quantidade de assinaturas deve corresponder à quantidade de execuções

## 3. Tipos de Divergências a Serem Identificadas

**Divergências de Datas:**  
- Datas não preenchidas  
- Datas divergentes entre a ficha de presença e a execução registrada  
- Datas incompatíveis com a quantidade autorizada

**Divergências de Documentação:**  
- Número da guia ausente ou incorreto  
- Código da ficha ausente ou incorreto  
- Falta de assinatura na ficha de presença

**Divergências Quantitativas:**  
- Quantidade de execuções diferente da quantidade autorizada  
- Quantidade de fichas assinadas não correspondente às execuções realizadas

## 4. Auditorias Possíveis

**Execuções sem ficha correspondente:**  
Verifica execuções no sistema sem ficha de presença associada, comparando `numero_guia`, `data_execucao` e `codigo_ficha`.

**Fichas sem execução correspondente:**  
Verifica fichas de presença sem execução registrada, comparando `numero_guia`, `data_execucao` e `codigo_ficha`.

**Divergência na quantidade executada vs. quantidade autorizada:**  
Identifica guias em que o total de execuções excede a quantidade autorizada.

**Ficha sem assinatura:**  
Identifica fichas de presença sem assinatura, apesar da execução correspondente.

**Diferenças de data:**  
Detecta casos em que a data da execução não coincide com a data da ficha de presença.


### Códigos de exemplos


```python
-- Auditoria 1: Execuções sem Ficha Correspondente
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'execucao_sem_ficha' AS tipo_divergencia,
    'Execução registrada sem ficha de presença correspondente' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    e.numero_guia,
    e.data_execucao,
    e.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM execucoes e
LEFT JOIN fichas_presenca f ON f.numero_guia = e.numero_guia 
  AND f.data_execucao = e.data_execucao 
  AND f.codigo_ficha = e.codigo_ficha
WHERE f.id IS NULL;



-- Auditoria 2: Fichas sem Execução Correspondente
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'ficha_sem_execucao' AS tipo_divergencia,
    'Ficha de presença digitalizada sem execução correspondente registrada' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    f.numero_guia,
    f.data_execucao,
    f.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM fichas_presenca f
LEFT JOIN execucoes e ON e.numero_guia = f.numero_guia 
  AND e.data_execucao = f.data_execucao 
  AND e.codigo_ficha = f.codigo_ficha
WHERE e.id IS NULL;


-- Auditoria 3: Divergência na Quantidade Executada vs. Quantidade Autorizada
-- Aqui assumimos que a quantidade executada total deve ser <= quantidade_autorizada na guia
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'quantidade_divergente' AS tipo_divergencia,
    'Soma das execuções excede a quantidade autorizada na guia' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    g.numero_guia,
    NULL::date AS data_execucao,
    NULL::text AS codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM guias g
JOIN (
    SELECT numero_guia, SUM(quantidade_sessoes) AS total_executado
    FROM execucoes
    GROUP BY numero_guia
) ex ON ex.numero_guia = g.numero_guia
WHERE ex.total_executado > g.quantidade_autorizada;


-- Auditoria 4: Ficha sem Assinatura
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'ficha_sem_assinatura' AS tipo_divergencia,
    'Ficha de presença sem assinatura detectada' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    f.numero_guia,
    f.data_execucao,
    f.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM fichas_presenca f
WHERE f.possui_assinatura = false;


-- Auditoria 5: Divergência de Data entre Ficha e Execução
-- Considera-se divergência se existe a mesma guia e ficha, porém datas não batem.
-- Aqui utilizamos um exemplo simplificado: fichas e execuções que compartilham guia e ficha, mas com datas diferentes.
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid() AS id,
    'data_divergente' AS tipo_divergencia,
    'A data da ficha de presença não corresponde à data da execução registrada' AS descricao,
    'pendente'::text AS status,
    now() AS data_identificacao,
    e.numero_guia,
    e.data_execucao,
    e.codigo_ficha,
    now() AS created_at,
    now() AS updated_at
FROM execucoes e
JOIN fichas_presenca f ON f.numero_guia = e.numero_guia AND f.codigo_ficha = e.codigo_ficha
WHERE f.data_execucao != e.data_execucao;
```


Prompt:
veja os requisitos em instrucoes\requisitos_auditoria.md e a página da auditoria  em frontend\src\app\auditoria\page.tsx