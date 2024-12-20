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

3. Tipos de Divergências a Serem Identificadas
As divergências serão identificadas e agrupadas pelo codigo_ficha. Dessa forma, cada ficha será o ponto central para rastrear problemas, tornando a análise mais direta.

### Divergências de Datas (DATA_INCONSISTENTE):

Datas ausentes no registro
Datas divergentes entre a ficha de presença e a execução correspondente
Datas fora do intervalo autorizado pelas guias

### Divergências de Documentação (DOC_INCOMPLETO):

Ausência ou divergência no número da guia
Ausência ou divergência no código da ficha
Assinatura ausente na ficha de presença (ASSINATURA_AUSENTE)

### Divergências Quantitativas (QUANTIDADE_EXCEDIDA):

Quantidade executada maior que a autorizada na guia
Divergências de Execução vs. Ficha:

Execução sem ficha correspondente (EXECUCAO_SEM_FICHA)
Ficha sem execução correspondente (FICHA_SEM_EXECUCAO)


## 4. Auditorias Possíveis
Essas auditorias servem para detectar divergências, sempre levando em conta o codigo_ficha como chave de agrupamento:

Execuções sem ficha correspondente (EXECUCAO_SEM_FICHA):
Compara execucoes e fichas_presenca para encontrar execuções que não tenham uma ficha associada, usando numero_guia, data_execucao e codigo_ficha.

Fichas sem execução correspondente (FICHA_SEM_EXECUCAO):
Compara fichas_presenca e execucoes para encontrar fichas sem a execução devida, usando numero_guia, data_execucao e codigo_ficha.

Divergência na quantidade executada vs. quantidade autorizada (QUANTIDADE_EXCEDIDA):
Verifica se o total de execuções associadas a uma determinada ficha (via guia e codigo_ficha) excede a quantidade autorizada.

Ficha sem assinatura (ASSINATURA_AUSENTE):
Verifica fichas de presença sem assinatura, indicando possível falta de validação presencial do paciente.

Diferenças de data (DATA_INCONSISTENTE):
Identifica se a data na ficha difere da data da execução, causando inconsistência no registro.

### Códigos de exemplos

Auditoria 1: Execuções sem Ficha Correspondente
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'EXECUCAO_SEM_FICHA',
    'Execução registrada sem ficha correspondente',
    'pendente',
    now(),
    e.numero_guia,
    e.data_execucao,
    e.codigo_ficha,
    now(),
    now()
FROM execucoes e
LEFT JOIN fichas_presenca f ON f.numero_guia = e.numero_guia 
  AND f.data_execucao = e.data_execucao 
  AND f.codigo_ficha = e.codigo_ficha
WHERE f.id IS NULL;

Auditoria 2: Fichas sem Execução Correspondente
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'FICHA_SEM_EXECUCAO',
    'Ficha sem execução correspondente',
    'pendente',
    now(),
    f.numero_guia,
    f.data_execucao,
    f.codigo_ficha,
    now(),
    now()
FROM fichas_presenca f
LEFT JOIN execucoes e ON e.numero_guia = f.numero_guia 
  AND e.data_execucao = f.data_execucao 
  AND e.codigo_ficha = f.codigo_ficha
WHERE e.id IS NULL;

Auditoria 3: Divergência na Quantidade Executada vs. Quantidade Autorizada
-- Aqui supõe-se que a quantidade autorizada está na tabela guias
-- e que podemos verificar a soma das execuções por guia e ficha.
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'QUANTIDADE_EXCEDIDA',
    'A quantidade executada na ficha excede a quantidade autorizada',
    'pendente',
    now(),
    g.numero_guia,
    e.codigo_ficha,
    now(),
    now()
FROM guias g
JOIN execucoes e ON e.numero_guia = g.numero_guia
JOIN (
    SELECT numero_guia, codigo_ficha, SUM(quantidade_sessoes) AS total_executado
    FROM execucoes
    GROUP BY numero_guia, codigo_ficha
) ex ON ex.numero_guia = g.numero_guia AND ex.codigo_ficha = e.codigo_ficha
WHERE ex.total_executado > g.quantidade_autorizada;


Auditoria 4: Ficha sem Assinatura
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'ASSINATURA_AUSENTE',
    'A ficha não possui assinatura do paciente',
    'pendente',
    now(),
    f.numero_guia,
    f.data_execucao,
    f.codigo_ficha,
    now(),
    now()
FROM fichas_presenca f
WHERE f.possui_assinatura = false;


Auditoria 5: Diferenças de Data
INSERT INTO divergencias (
    id, tipo_divergencia, descricao, status, data_identificacao, numero_guia, data_execucao, codigo_ficha, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'DATA_INCONSISTENTE',
    'A data da execução não coincide com a data da ficha de presença',
    'pendente',
    now(),
    e.numero_guia,
    e.data_execucao,
    e.codigo_ficha,
    now(),
    now()
FROM execucoes e
JOIN fichas_presenca f ON f.numero_guia = e.numero_guia AND f.codigo_ficha = e.codigo_ficha
WHERE f.data_execucao != e.data_execucao;
