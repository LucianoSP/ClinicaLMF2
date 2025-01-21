I'll help create a comprehensive consolidated document that maintains all the detailed information from both sources. Let me structure this in a clear, detailed format.



# Sistema de Auditoria de Atendimentos Médicos - Documentação Técnica Completa

## 1. Visão Geral do Sistema

O sistema foi desenvolvido para automatizar e controlar o processo de auditoria de atendimentos médicos, focando na validação entre fichas físicas assinadas e execuções registradas no sistema da Unimed. O principal objetivo é garantir que todos os atendimentos realizados estejam corretamente documentados e faturados, mantendo a integridade entre documentação física e registros digitais.

## 2. Fluxo do Processo

### 2.1 Atendimento Inicial
1. Paciente comparece ao atendimento
2. Assina a ficha de presença física
3. A recepção digitaliza a ficha assinada
4. O arquivo digitalizado é armazenado no sistema

### 2.2 Processo de Faturamento
1. Faturista acessa o sistema da Unimed
2. Registra a execução do atendimento manualmente
3. Sistema interno registra a execução realizada
4. Sistema verifica automaticamente por divergências

### 2.3 Processo de Auditoria
1. Sistema compara automaticamente:
   - Quantidade de fichas digitalizadas vs execuções registradas
   - Presença de assinaturas nas fichas
   - Datas e quantidades correspondentes
2. Divergências são registradas automaticamente
3. Auditores podem visualizar e resolver as divergências
4. Sistema mantém histórico de todas as resoluções

## 3. Estrutura do Banco de Dados

### 3.1 Tabelas Principais

#### `pacientes`
```sql
CREATE TABLE pacientes (
    id uuid PRIMARY KEY,
    nome text,
    nome_responsavel text,
    carteirinha text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

#### `carteirinhas`
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

#### `planos_saude`
```sql
CREATE TABLE planos_saude (
    id uuid PRIMARY KEY,
    codigo character varying(50),
    nome character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

#### `guias`
```sql
CREATE TABLE guias (
    id uuid PRIMARY KEY,
    numero_guia text,
    data_emissao date,
    data_validade date,
    tipo USER-DEFINED,  -- Valores: 'sp_sadt', 'consulta', 'internacao'
    status USER-DEFINED, -- Valores: 'pendente', 'em_andamento', 'concluida', 'cancelada'
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

A tabela `guias` armazena todas as guias médicas do sistema. Cada guia possui:
- Informações básicas como número, datas de emissão e validade
- Tipo da guia (sp_sadt, consulta, internacao)
- Status atual (pendente, em_andamento, concluida, cancelada)
- Informações do paciente (nome e carteirinha)
- Quantidades autorizadas e executadas
- Informações do procedimento e profissionais envolvidos

O campo `quantidade_executada` é atualizado automaticamente através de triggers quando novas execuções são registradas.

#### `fichas_presenca`
```sql
CREATE TABLE fichas_presenca (
    id uuid PRIMARY KEY,
    data_execucao date,
    paciente_nome text,
    paciente_carteirinha text,
    numero_guia text,
    codigo_ficha text,
    arquivo_digitalizado text,
    observacoes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

#### `sessoes`
```sql
CREATE TABLE sessoes (
    id uuid PRIMARY KEY,
    ficha_presenca_id uuid REFERENCES fichas_presenca(id),
    data_sessao date,
    possui_assinatura boolean,
    tipo_terapia text,
    profissional_executante text,
    valor_sessao numeric(10,2),
    status text,
    observacoes_sessao text,
    executado boolean,
    data_execucao date,
    executado_por uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

A tabela `sessoes` armazena informações sobre cada sessão individual dentro de uma ficha de presença. Quando uma ficha é registrada, são criadas automaticamente as sessões correspondentes, que posteriormente são vinculadas às execuções.

#### `assinaturas_sessoes`
```sql
CREATE TABLE assinaturas_sessoes (
    id uuid PRIMARY KEY,
    ficha_presenca_id uuid REFERENCES fichas_presenca(id),
    sessao_numero integer,
    possui_assinatura boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

#### `execucoes`
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

#### `divergencias`
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

#### `usuarios`
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

#### `agendamentos`
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
    saldo_sessoes integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

#### `auditoria_execucoes`
```sql
CREATE TABLE auditoria_execucoes (
    id uuid PRIMARY KEY,
    execucao_id uuid REFERENCES execucoes(id),
    tipo_alteracao text,
    dados_anteriores jsonb,
    dados_novos jsonb,
    usuario_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

A tabela `auditoria_execucoes` registra todas as alterações feitas nas execuções, mantendo um histórico completo de modificações para fins de auditoria.

#### `autorizacoes_guias`
```sql
CREATE TABLE autorizacoes_guias (
    id uuid PRIMARY KEY,
    guia_id uuid REFERENCES guias(id),
    tipo_autorizacao text,
    status text,
    data_solicitacao timestamp with time zone,
    data_autorizacao timestamp with time zone,
    usuario_autorizador uuid,
    observacoes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

A tabela `autorizacoes_guias` controla o processo de autorização das guias, registrando quando e por quem as autorizações foram concedidas.

#### `historico_carteirinhas`
```sql
CREATE TABLE historico_carteirinhas (
    id uuid PRIMARY KEY,
    carteirinha_id uuid REFERENCES carteirinhas(id),
    tipo_alteracao text,
    dados_anteriores jsonb,
    dados_novos jsonb,
    usuario_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
```

A tabela `historico_carteirinhas` mantém um registro histórico de todas as alterações feitas nas carteirinhas dos pacientes, incluindo mudanças de plano, renovações e cancelamentos.

#### `unimed_scraping_tasks`
```sql
CREATE TABLE unimed_scraping_tasks (
    id uuid PRIMARY KEY,
    task_id text,
    status text,  -- 'pending', 'processing', 'completed', 'failed'
    start_date date,
    end_date date,
    total_guides integer,
    processed_guides integer,
    error_message text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    completed_at timestamp with time zone
);
```

A tabela `unimed_scraping_tasks` controla as tarefas de scraping da Unimed, mantendo o estado e progresso de cada execução.

## 4. Tipos de Divergências e Status

### 4.1 Tipos de Divergências (tipo_divergencia)

1. **Data Divergente** (`data_divergente`)
   - Descrição: Data de execução diferente da data de atendimento
   - Campo chave: codigo_ficha
   - Campos verificados: execucoes.data_execucao (obrigatório), fichas_presenca.data_atendimento (opcional)

2. **Sessão sem Assinatura** (`sessao_sem_assinatura`)
   - Descrição: Sessão sem assinatura do paciente
   - Campo chave: codigo_ficha + data_sessao
   - Campos verificados: fichas_presenca.assinaturas_sessoes, execucoes.data_execucao

3. **Execução sem Sessão** (`execucao_sem_sessao`)
   - Descrição: Execução sem sessão correspondente
   - Campo chave: codigo_ficha + data_sessao
   - Campos verificados: execucoes.codigo_ficha, execucoes.data_execucao

4. **Sessão sem Execução** (`sessao_sem_execucao`)
   - Descrição: Sessão sem execução correspondente
   - Campo chave: codigo_ficha + data_sessao
   - Campos verificados: sessoes.codigo_ficha, sessoes.data_sessao

5. **Quantidade Excedida** (`quantidade_excedida`)
   - Descrição: Execuções excedem quantidade autorizada
   - Campo chave: numero_guia
   - Campos verificados: guias.quantidade_autorizada, contagem de execucoes.numero_guia

6. **Guia Vencida** (`guia_vencida`)
   - Descrição: Execução após validade da guia
   - Campo chave: numero_guia
   - Campos verificados: guias.data_validade, execucoes.data_execucao

7. **Duplicidade** (`duplicidade`)
   - Descrição: Mesma sessão executada múltiplas vezes
   - Campo chave: codigo_ficha + data_sessao
   - Campos verificados: execucoes.codigo_ficha, execucoes.data_execucao, contagem de execucoes por sessao

### 4.2 Status das Divergências (status_divergencia)
- `pendente`: Divergência identificada
- `em_analise`: Em processo de verificação
- `resolvida`: Divergência corrigida
- `cancelada`: Divergência desconsiderada

### 4.3 Status das Guias (status_guia)
- `pendente`: Aguardando início
- `em_andamento`: Execuções em andamento
- `concluida`: Todas execuções realizadas
- `cancelada`: Guia cancelada

### 4.4 Tipos de Guia
- `sp_sadt`: Guia de Serviço Profissional/SADT para procedimentos e terapias
- `consulta`: Guia para avaliações e consultas

## 5. Estrutura do Sistema

### 4.5 Fluxo de Dados entre Fichas, Sessões e Execuções

O sistema segue um fluxo específico para gerenciar a relação entre fichas de presença, sessões e execuções:

1. Quando uma nova `ficha_presenca` é registrada:
   - São criadas automaticamente as entradas correspondentes na tabela `sessoes`
   - Cada sessão é vinculada à ficha através do `ficha_presenca_id`
   - O status inicial da sessão é 'pendente'

2. Quando uma execução é registrada:
   - O sistema localiza a sessão correspondente na tabela `sessoes`
   - Cria uma entrada na tabela `execucoes` vinculada à sessão
   - Atualiza o status da sessão para 'executado'
   - Registra a data de execução e o usuário responsável


### 5.1 Organização dos Arquivos

#### database_supabase.py
Funções básicas de CRUD:
- salvar_dados_excel()
- listar_dados_excel()
- listar_guias()
- buscar_guia()
- listar_fichas_presenca()
- salvar_ficha_presenca()
- limpar_banco()
- refresh_view_materializada()
- formatar_data()

#### auditoria_repository.py
Funções específicas de divergências:
- registrar_divergencia()
- registrar_divergencia_detalhada()
- buscar_divergencias_view()
- atualizar_ficha_ids_divergencias()
- registrar_execucao_auditoria()
- calcular_estatisticas_divergencias()
- obter_ultima_auditoria()
- atualizar_status_divergencia()

#### auditoria.py
Lógica de negócio e endpoints:
- realizar_auditoria()
- realizar_auditoria_fichas_execucoes()
- verificar_datas()
- verificar_quantidade_execucaos()
- verificar_validade_guia()
- verificar_quantidade_autorizada()
- verificar_assinatura_ficha()
- safe_get_value()
- listar_divergencias_route()

## 6. Componentes do Frontend

### 6.1 Páginas Principais

#### Cadastros (`/cadastros`)
- Interface unificada para gerenciamento de cadastros
- Navegação por cards para diferentes seções:
  - Planos de Saúde
  - Pacientes
  - Carteirinhas
  - Guias

### 6.2 Componentes Principais

#### GuiasList
- Listagem de guias com paginação
- Exibe informações essenciais:
  - Número da guia
  - Paciente e carteirinha
  - Tipo da guia
  - Quantidades autorizadas e executadas
  - Status atual
- Suporte a ações de edição e exclusão

#### GuiaModal
- Modal para criação e edição de guias
- Campos validados com Zod
- Suporte a todos os campos do modelo:
  - Informações básicas da guia
  - Dados do paciente
  - Quantidades e procedimentos
  - Profissionais envolvidos

### 6.3 Serviços

#### guiaService
- Interface TypeScript para o modelo Guia
- Funções para operações CRUD:
  - listarGuias: Busca paginada com suporte a filtros
  - criarGuia: Criação com validação
  - atualizarGuia: Atualização parcial
  - excluirGuia: Remoção com verificação de dependências

## 7. Interface do Sistema

### 7.1 Gerenciamento de Pacientes

#### Busca e Listagem de Pacientes e Carteirinhas
- Campo de busca para localizar pacientes
- Tabela interativa com informações básicas
- Botão para cadastro de novos pacientes e carteirinhas
- Opção de edição para cada paciente e suas carteirinhas

#### Informações do Paciente
**Dados Pessoais:**
- Nome completo
- Número da carteirinha
- Data de cadastro

**Informações da Carteirinha:**
- Número da carteirinha
- Data de validade
- Status de titularidade
- Nome do titular (quando dependente)

#### Guias do Paciente
- Número da guia
- Nome do procedimento
- Data de validade
- Quantidade de sessões autorizadas/utilizadas
- Saldo disponível
- Status da guia

### 7.2 Página de Auditoria

#### Dashboard
- Total de protocolos analisados
- Total de divergências encontradas
- Data da última verificação
- Período analisado

#### Funcionalidades
- Filtros por período
- Visualização detalhada de divergências
- Marcação de resolução
- Registro de observações

## 7. Serviço de Scraping Unimed

### 7.1 Visão Geral
O serviço de scraping da Unimed é um componente separado do sistema principal, responsável por automatizar a coleta de informações de guias e execuções diretamente do portal da Unimed. Este serviço foi desenvolvido para operar de forma independente, utilizando filas para processamento assíncrono e garantindo a integridade dos dados coletados.

### 7.2 Estrutura do Serviço

#### Componentes Principais
- `main.py`: API FastAPI que gerencia as requisições de scraping
- `scraper.py`: Implementação do scraper usando Selenium
- `requirements.txt`: Dependências do projeto
- `.env`: Configurações do ambiente

#### Funcionalidades
1. **Captura de Guias**
   - Login automático no sistema da Unimed
   - Navegação pelas páginas de guias
   - Extração de informações básicas das guias
   - Suporte à paginação

2. **Processamento de Guias**
   - Extração de dados detalhados de cada guia
   - Captura de informações biométricas
   - Coleta de dados dos profissionais
   - Validação de execuções

3. **Integração com Backend**
   - Envio automático dos dados para a API principal
   - Sistema de filas com Redis para processamento assíncrono
   - Tratamento de erros e retry automático

### 7.3 Endpoints da API

#### POST /scrape
Inicia uma nova tarefa de scraping
```json
{
  "username": "string",
  "password": "string",
  "start_date": "DD/MM/YYYY",  // opcional
  "end_date": "DD/MM/YYYY"     // opcional
}
```

#### GET /status/{task_id}
Verifica o status de uma tarefa de scraping

### 7.4 Configurações

#### Variáveis de Ambiente
```env
# Configurações do Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# URL da API principal
MAIN_API_URL=http://localhost:8000

# Configurações do Chrome
PRODUCTION=false
CHROME_BINARY_PATH=/usr/bin/google-chrome
```

### 7.5 Fluxo de Dados
1. Frontend solicita scraping via API
2. Serviço inicia processo em background usando Redis
3. Scraper navega pelo portal da Unimed
4. Dados são coletados e processados
5. Informações são enviadas para o backend principal
6. Frontend é notificado da conclusão

### 7.6 Segurança
- Uso de perfil Chrome para manter sessão
- Simulação de comportamento humano
- Tratamento de timeouts e erros
- Logs detalhados para auditoria

Esta documentação consolidada serve como referência completa para o sistema de auditoria de atendimentos médicos, abrangendo todos os aspectos técnicos e funcionais necessários para sua implementação e manutenção.


https://claude.site/artifacts/315058f5-1977-430c-a6cf-ea2affba3375