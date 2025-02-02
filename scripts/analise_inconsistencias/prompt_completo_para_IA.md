[CONTEXTO:](CONTEXTO:)

# Contexto do Projeto e Script de Análise

## 1. Sobre o Projeto

### 1.1. Objetivo do Sistema

Este é um sistema de agendamento especializado para uma clínica que atende crianças autistas em São Paulo. O sistema foi desenvolvido para otimizar:

- Agendamento de consultas e terapias
- Gestão de pacientes e seus responsáveis
- Controle de profissionais e suas agendas
- Gerenciamento de salas e recursos
- Processamento de guias e autorizações
- Geração de relatórios e estatísticas

### 1.2. Tecnologias Utilizadas

- **Frontend**: Next.js 14 com App Router

  - UI/UX: Shadcn/UI + TailwindCSS
  - Tipagem: TypeScript
  - Deploy: Vercel
- **Backend**: FastAPI (Python)

  - ORM: SQLAlchemy
  - Deploy: Replit
  - URL: https://fde1cb19-4f63-43d4-a9b7-a3d808e8d2b7-00-3cdk7z76k6er0.kirk.replit.dev
- **Banco de Dados e Auth**:

  - PostgreSQL via Supabase
  - Autenticação: Supabase Auth

## 2. Entidades do Sistema

### 2.1. Paciente

- Informações pessoais e contato
- Dados do responsável
- Histórico clínico
- Vínculo com plano de saúde
- Controle de guias e autorizações

### 2.2. Guia

- Número e validade
- Vínculo com paciente
- Procedimentos autorizados
- Status de aprovação
- Controle de execução

### 2.3. Carteirinha

- Número de identificação
- Dados do plano
- Período de validade
- Informações do titular

### 2.4. Plano

- Identificação e código
- Tabela de procedimentos
- Regras de autorização
- Prazos e limites

### 2.5. Ficha de Presença

- Data e horário
- Paciente vinculado
- Status de comparecimento
- Observações do atendimento

### 2.6. Sessão

- Data e hora agendada
- Paciente
- Tipo de terapia
- Status da sessão
- Vínculo com guia

### 2.7. Execução

- Data de realização
- Sessão vinculada
- Procedimentos executados
- Status de faturamento
- Observações clínicas

### 2.8. Divergência

- Tipo de divergência
- Guia relacionada
- Status de resolução
- Prioridade
- Observações

## 3. Sobre o Script de Análise

### 3.1. Propósito

O script `analyze_project.py` foi desenvolvido para realizar uma análise completa do código, identificando:

1. Inconsistências entre backend e frontend
2. Problemas de tipagem
3. Rotas duplicadas
4. Campos faltantes
5. Estrutura dos cadastros

### 3.2. Principais Verificações

#### 3.2.1. Análise do Backend

- Modelos e seus campos
- Tipos de dados utilizados
- Validações implementadas
- Relacionamentos entre entidades

#### 3.2.2. Análise do Frontend

- Interfaces TypeScript
- Componentes utilizados
- Estrutura de páginas
- Serviços de API

#### 3.2.3. Análise de Banco de Dados

- Definições das tabelas
- Tipos das colunas
- Chaves e relacionamentos
- Índices e constraints

#### 3.2.4. Análise de Rotas

- Endpoints da API
- Rotas do Next.js
- Duplicações
- Padrões de URL

### 3.3. Relatórios Gerados

#### 3.3.1. JSON (scripts/analise_inconsistencias/analysis_report.json)

Contém dados técnicos detalhados:

- Mapeamento de campos
- Lista de inconsistências
- Estrutura de arquivos
- Componentes e serviços

#### 3.3.2. Markdown (scripts/analise_inconsistencias/analise_inconsistencias.md)

Apresenta de forma organizada:

- Problemas encontrados
- Sugestões de correção
- Estrutura recomendada
- Plano de ação

## 4. Estrutura do Projeto

### 4.1. Frontend

```

frontend/

  ├── src/

  │   ├── app/

  │   │   └── (auth)/

  │   │       ├── cadastros/

  │   │       │   ├── pacientes/

  │   │       │   ├── guias/

  │   │       │   └── ...

  │   │       └── dashboard/

  │   ├── components/

  │   └── services/

```

### 4.2. Backend

```

backend/

  ├── app.py

  ├── database_supabase.py

  └── sql/

      └── criar_tabelas.sql

```

## 5. Padrões e Convenções

### 5.1. Estrutura de Cadastros

- Formulários padronizados
- Tabelas de listagem
- Páginas de detalhe
- Componentes reutilizáveis

### 5.2. Nomenclatura

- Campos em português
- Rotas em lowercase
- Componentes em PascalCase
- Funções em camelCase

### 5.3. Validações

- Frontend: Zod/React Hook Form
- Backend: Pydantic
- Banco: Constraints SQL

`<DADOS EXTRAIDOS>`:

{

  "timestamp": "2025-02-02T12:54:16-03:00",

  "entities": {

    "Paciente": {

    "backend_fields": {

    "id": "Optional[str]",

    "nome": "str",

    "nome_responsavel": "str",

    "data_nascimento": "Optional[str]",

    "cpf": "Optional[str]",

    "telefone": "Optional[str]",

    "email": "Optional[str]",

    "created_at": "Optional[datetime]",

    "updated_at": "Optional[datetime]"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "Optional[str]",

    "Optional[datetime]",

    "str"

    ],

    "database_fields": [

    "listar_guias_paciente",

    "obter_estatisticas_paciente",

    "criar_paciente",

    "deletar_paciente",

    "atualizar_paciente",

    "buscar_paciente",

    "listar_pacientes"

    ],

    "endpoints": [

    "GET /pacientes",

    "POST /pacientes/",

    "GET /pacientes/{paciente_id}",

    "PUT /pacientes/{paciente_id}",

    "DELETE /pacientes/{paciente_id}",

    "GET /pacientes/{paciente_id}/guias",

    "GET /pacientes/{paciente_id}/estatisticas",

    "POST /pacientes/{paciente_id}/guias",

    "PUT /pacientes/{paciente_id}/guias/{guia_id}"

    ],

    "service_methods": [

    "listarPacientes",

    "criarPaciente",

    "atualizarPaciente",

    "excluirPaciente",

    "buscarEstatisticasPaciente",

    "buscarGuiasPaciente"

    ],

    "next_routes": [

    "/(auth)pacientes",

    "/(auth)cadastros/pacientes",

    "/(auth)cadastros/pacientes"

    ],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {

    "columns": {

    "id": {

    "type": "uuid",

    "comment": null

    },

    "nome": {

    "type": "text",

    "comment": null

    },

    "nome_responsavel": {

    "type": "text",

    "comment": null

    },

    "data_nascimento": {

    "type": "date",

    "comment": null

    },

    "character": {

    "type": "varying(11)",

    "comment": null

    },

    "telefone": {

    "type": "text",

    "comment": null

    },

    "email": {

    "type": "text",

    "comment": null

    },

    "endereco": {

    "type": "jsonb",

    "comment": null

    },

    "observacoes": {

    "type": "text",

    "comment": null

    },

    "created_at": {

    "type": "timestamptz",

    "comment": null

    },

    "updated_at": {

    "type": "timestamptz",

    "comment": null

    },

    "REFERENCES": {

    "type": "usuarios(id)",

    "comment": null

    }

    },

    "comments": {},

    "foreign_keys": [],

    "indexes": []

    },

    "related_tables": [],

    "crud_routes": {

    "root": [

    "/(auth)cadastros/pacientes",

    "/(auth)cadastros/pacientes"

    ],

    "cadastros": [],

    "outros": [

    "/(auth)pacientes"

    ]

    },

    "cadastros_structure": {

    "pages": [

    "pacientes\\page.tsx"

    ],

    "components": [],

    "forms": [],

    "tables": [],

    "services": [],

    "ui_components": [

    "components"

    ]

    },

    "inconsistencies": [

    "Campos do modelo ausentes na tabela: cpf",

    "Campos da tabela ausentes no modelo: REFERENCES, character, observacoes, endereco",

    "Tipo SQL incompatível para created_at: sql=TIMESTAMPTZ, model=Optional[datetime]",

    "Tipo SQL incompatível para data_nascimento: sql=DATE, model=Optional[str]",

    "Tipo SQL incompatível para updated_at: sql=TIMESTAMPTZ, model=Optional[datetime]",

    "Tipo SQL incompatível para id: sql=UUID, model=Optional[str]",

    "Formulário de cadastro não encontrado em /cadastros/pacientes",

    "Tabela de listagem não encontrada em /cadastros/pacientes"

    ]

    },

    "Carteirinha": {

    "backend_fields": {

    "id": "Optional[str]",

    "numero_carteirinha": "str",

    "paciente_id": "str",

    "plano_saude_id": "str",

    "data_validade": "Optional[str]",

    "paciente": "Optional[Dict]",

    "plano_saude": "Optional[Dict]",

    "created_at": "Optional[datetime]",

    "updated_at": "Optional[datetime]",

    "status": "str",

    "motivo_inativacao": "str",

    "created_by": "Optional[str]"

    },

    "frontend_interface_fields": {

    "id": "string",

    "numero_carteirinha": "string",

    "numeroCarteirinha": "string",

    "data_validade": "string",

    "dataValidade": "string",

    "titular": "boolean",

    "nomeTitular": "string",

    "plano_saude_id": "string",

    "planoSaudeId": "string",

    "paciente_id": "string",

    "pacienteId": "string",

    "motivo_inativacao": "string",

    "created_at": "string",

    "updated_at": "string",

    "nome": "string",

    "cpf": "string",

    "telefone": "string",

    "data_nascimento": "string",

    "nome_responsavel": "string",

    "ativo": "boolean",

    "codigo": "string"

    },

    "frontend_type_fields": [

    "Optional[Dict]",

    "Optional[str]",

    "Optional[datetime]",

    "str"

    ],

    "database_fields": [

    "get_plano_by_carteirinha",

    "listar_carteirinhas",

    "atualizar_carteirinha",

    "deletar_carteirinha",

    "criar_carteirinha"

    ],

    "endpoints": [

    "GET /carteirinhas",

    "POST /carteirinhas/",

    "GET /carteirinhas/{carteirinha_id}",

    "PUT /carteirinhas/{carteirinha_id}",

    "DELETE /carteirinhas/{carteirinha_id}"

    ],

    "service_methods": [

    "toBackendFormat",

    "toFrontendFormat",

    "listarCarteirinhas",

    "listarCarteirinhasPorPaciente",

    "criarCarteirinha",

    "atualizarCarteirinha",

    "excluirCarteirinha"

    ],

    "next_routes": [

    "/(auth)cadastros/carteirinhas",

    "/(auth)cadastros/carteirinhas"

    ],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {

    "columns": {

    "id": {

    "type": "uuid",

    "comment": null

    },

    "DELETE": {

    "type": "RESTRICT",

    "comment": null

    },

    "numero_carteirinha": {

    "type": "text",

    "comment": null

    },

    "data_validade": {

    "type": "date",

    "comment": null

    },

    "status": {

    "type": "status_carteirinha",

    "comment": null

    },

    "motivo_inativacao": {

    "type": "text",

    "comment": null

    },

    "historico_status": {

    "type": "jsonb",

    "comment": null

    },

    "created_at": {

    "type": "timestamptz",

    "comment": null

    },

    "updated_at": {

    "type": "timestamptz",

    "comment": null

    },

    "REFERENCES": {

    "type": "usuarios(id)",

    "comment": null

    }

    },

    "comments": {},

    "foreign_keys": [],

    "indexes": []

    },

    "related_tables": [],

    "crud_routes": {

    "root": [

    "/(auth)cadastros/carteirinhas",

    "/(auth)cadastros/carteirinhas"

    ],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {

    "pages": [

    "carteirinhas\\page.tsx"

    ],

    "components": [],

    "forms": [],

    "tables": [],

    "services": [],

    "ui_components": [

    "components"

    ]

    },

    "inconsistencies": [

    "Campos faltando no frontend: created_by, plano_saude, status, paciente",

    "Campos faltando no backend: titular, ativo, nome, data_nascimento, pacienteId, dataValidade, codigo, cpf, telefone, nomeTitular, nome_responsavel, planoSaudeId, numeroCarteirinha",

    "Tipo incompatível para created_at: backend=Optional[datetime], frontend=string",

    "Tipo incompatível para paciente_id: backend=str, frontend=string",

    "Tipo incompatível para numero_carteirinha: backend=str, frontend=string",

    "Tipo incompatível para updated_at: backend=Optional[datetime], frontend=string",

    "Tipo incompatível para id: backend=Optional[str], frontend=string",

    "Tipo incompatível para plano_saude_id: backend=str, frontend=string",

    "Tipo incompatível para motivo_inativacao: backend=str, frontend=string",

    "Tipo incompatível para data_validade: backend=Optional[str], frontend=string",

    "Campos do modelo ausentes na tabela: created_by, paciente_id, plano_saude_id, plano_saude, paciente",

    "Campos da tabela ausentes no modelo: DELETE, REFERENCES, historico_status",

    "Tipo SQL incompatível para created_at: sql=TIMESTAMPTZ, model=Optional[datetime]",

    "Tipo SQL incompatível para updated_at: sql=TIMESTAMPTZ, model=Optional[datetime]",

    "Tipo SQL incompatível para id: sql=UUID, model=Optional[str]",

    "Tipo SQL incompatível para data_validade: sql=DATE, model=Optional[str]",

    "Tipo SQL incompatível para status: sql=STATUS_CARTEIRINHA, model=str",

    "Formulário de cadastro não encontrado em /cadastros/carteirinhas",

    "Tabela de listagem não encontrada em /cadastros/carteirinhas"

    ]

    },

    "Plano": {

    "backend_fields": {

    "id": "Optional[str]",

    "nome": "str",

    "codigo": "str",

    "ativo": "bool",

    "created_at": "Optional[datetime]",

    "updated_at": "Optional[datetime]"

    },

    "frontend_interface_fields": {

    "id": "string",

    "nome": "string",

    "codigo": "string",

    "ativo": "boolean",

    "created_at": "string",

    "updated_at": "string"

    },

    "frontend_type_fields": [

    "Optional[str]",

    "bool",

    "str",

    "Optional[datetime]"

    ],

    "database_fields": [

    "get_plano_by_carteirinha",

    "listar_planos",

    "atualizar_plano",

    "deletar_plano",

    "extrair_codigo_plano",

    "criar_plano"

    ],

    "endpoints": [

    "DELETE /planos/{plano_id}"

    ],

    "service_methods": [

    "listarPlanos",

    "criarPlano",

    "atualizarPlano",

    "deletarPlano"

    ],

    "next_routes": [

    "/(auth)cadastros/planos",

    "/(auth)cadastros/planos"

    ],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [

    "/(auth)cadastros/planos",

    "/(auth)cadastros/planos"

    ],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {

    "pages": [

    "planos\\page.tsx"

    ],

    "components": [],

    "forms": [],

    "tables": [],

    "services": [],

    "ui_components": [

    "components"

    ]

    },

    "inconsistencies": [

    "Tipo incompatível para created_at: backend=Optional[datetime], frontend=string",

    "Tipo incompatível para ativo: backend=bool, frontend=boolean",

    "Tipo incompatível para nome: backend=str, frontend=string",

    "Tipo incompatível para codigo: backend=str, frontend=string",

    "Tipo incompatível para updated_at: backend=Optional[datetime], frontend=string",

    "Tipo incompatível para id: backend=Optional[str], frontend=string",

    "Formulário de cadastro não encontrado em /cadastros/planos",

    "Tabela de listagem não encontrada em /cadastros/planos"

    ]

    },

    "Registro": {

    "backend_fields": {

    "data_execucao": "str",

    "paciente_carteirinha": "str",

    "paciente_nome": "str",

    "guia_id": "str",

    "possui_assinatura": "bool"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "bool",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "DadosGuia": {

    "backend_fields": {

    "codigo_ficha": "str",

    "registros": "list[Registro]"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "list[Registro]",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "ExecucaoUpdate": {

    "backend_fields": {

    "data_execucao": "str",

    "paciente_carteirinha": "str",

    "paciente_nome": "str",

    "guia_id": "str",

    "possui_assinatura": "bool",

    "codigo_ficha": "str"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "bool",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "Sessao": {

    "backend_fields": {

    "data_sessao": "str",

    "tipo_terapia": "unknown",

    "profissional_executante": "unknown",

    "possui_assinatura": "bool",

    "valor_sessao": "unknown",

    "observacoes_sessao": "unknown",

    "status": "str"

    },

    "frontend_interface_fields": {

    "id": "string",

    "ficha_presenca_id": "string",

    "data_sessao": "string",

    "possui_assinatura": "boolean",

    "tipo_terapia": "string",

    "profissional_executante": "string",

    "valor_sessao": "number",

    "status": "string",

    "observacoes_sessao": "string",

    "executado": "boolean",

    "created_at": "string",

    "updated_at": "string"

    },

    "frontend_type_fields": [

    "bool",

    "unknown",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": [

    "Campos faltando no backend: created_at, updated_at, id, ficha_presenca_id, executado",

    "Tipo incompatível para tipo_terapia: backend=unknown, frontend=string",

    "Tipo incompatível para observacoes_sessao: backend=unknown, frontend=string",

    "Tipo incompatível para possui_assinatura: backend=bool, frontend=boolean",

    "Tipo incompatível para profissional_executante: backend=unknown, frontend=string",

    "Tipo incompatível para data_sessao: backend=str, frontend=string",

    "Tipo incompatível para valor_sessao: backend=unknown, frontend=number",

    "Tipo incompatível para status: backend=str, frontend=string"

    ]

    },

    "FichaPresenca": {

    "backend_fields": {

    "paciente_carteirinha": "str",

    "paciente_nome": "str",

    "numero_guia": "str",

    "codigo_ficha": "str",

    "sessoes": "unknown",

    "possui_assinatura": "bool",

    "arquivo_digitalizado": "Optional[str]"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "bool",

    "Optional[str]",

    "unknown",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "FichaPresencaUpdate": {

    "backend_fields": {

    "data_atendimento": "str",

    "paciente_carteirinha": "str",

    "paciente_nome": "str",

    "numero_guia": "str",

    "codigo_ficha": "str",

    "possui_assinatura": "bool",

    "arquivo_digitalizado": "Optional[str]"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "bool",

    "Optional[str]",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "DivergenciaResponse": {

    "backend_fields": {

    "id": "str",

    "tipo_divergencia": "str",

    "prioridade": "str",

    "descricao": "str",

    "status": "str",

    "data_identificacao": "str",

    "data_resolucao": "unknown",

    "resolvido_por": "unknown",

    "observacoes": "unknown",

    "numero_guia": "str",

    "data_execucao": "str",

    "codigo_ficha": "str",

    "paciente_nome": "str",

    "detalhes": "unknown"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "unknown",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "DivergenciasListResponse": {

    "backend_fields": {

    "success": "bool",

    "divergencias": "list[DivergenciaResponse]",

    "total": "int",

    "paginas": "int",

    "resumo": "dict"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "bool",

    "list[DivergenciaResponse]",

    "dict",

    "int"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "AuditoriaRequest": {

    "backend_fields": {

    "data_inicio": "unknown",

    "data_fim": "unknown"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "unknown"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "SessaoUpdate": {

    "backend_fields": {

    "data_sessao": "str",

    "tipo_terapia": "unknown",

    "profissional_executante": "unknown",

    "possui_assinatura": "bool",

    "valor_sessao": "unknown",

    "observacoes_sessao": "unknown"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "bool",

    "unknown",

    "str"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "Procedimento": {

    "backend_fields": {

    "id": "Optional[str]",

    "codigo": "str",

    "nome": "str",

    "descricao": "Optional[str]",

    "ativo": "bool",

    "created_at": "Optional[datetime]",

    "updated_at": "Optional[datetime]",

    "created_by": "Optional[str]",

    "updated_by": "Optional[str]"

    },

    "frontend_interface_fields": {

    "id": "string",

    "codigo": "string",

    "nome": "string",

    "descricao": "string",

    "ativo": "boolean",

    "created_at": "string",

    "updated_at": "string",

    "created_by": "string",

    "updated_by": "string"

    },

    "frontend_type_fields": [

    "Optional[str]",

    "bool",

    "str",

    "Optional[datetime]"

    ],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [

    "listarProcedimentos",

    "criarProcedimento",

    "atualizarProcedimento"

    ],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {

    "columns": {

    "id": {

    "type": "uuid",

    "comment": null

    },

    "codigo": {

    "type": "text",

    "comment": null

    },

    "nome": {

    "type": "text",

    "comment": null

    },

    "descricao": {

    "type": "text",

    "comment": null

    },

    "ativo": {

    "type": "boolean",

    "comment": null

    },

    "created_at": {

    "type": "timestamptz",

    "comment": null

    },

    "updated_at": {

    "type": "timestamptz",

    "comment": null

    },

    "REFERENCES": {

    "type": "usuarios(id)",

    "comment": null

    }

    },

    "comments": {},

    "foreign_keys": [],

    "indexes": []

    },

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": [

    "Tipo incompatível para created_at: backend=Optional[datetime], frontend=string",

    "Tipo incompatível para ativo: backend=bool, frontend=boolean",

    "Tipo incompatível para nome: backend=str, frontend=string",

    "Tipo incompatível para created_by: backend=Optional[str], frontend=string",

    "Tipo incompatível para codigo: backend=str, frontend=string",

    "Tipo incompatível para descricao: backend=Optional[str], frontend=string",

    "Tipo incompatível para id: backend=Optional[str], frontend=string",

    "Tipo incompatível para updated_at: backend=Optional[datetime], frontend=string",

    "Tipo incompatível para updated_by: backend=Optional[str], frontend=string",

    "Campos do modelo ausentes na tabela: updated_by, created_by",

    "Campos da tabela ausentes no modelo: REFERENCES",

    "Tipo SQL incompatível para created_at: sql=TIMESTAMPTZ, model=Optional[datetime]",

    "Tipo SQL incompatível para id: sql=UUID, model=Optional[str]",

    "Tipo SQL incompatível para updated_at: sql=TIMESTAMPTZ, model=Optional[datetime]"

    ]

    },

    "Guia": {

    "backend_fields": {

    "id": "Optional[str]",

    "numero_guia": "str",

    "data_emissao": "Optional[str]",

    "data_validade": "Optional[str]",

    "tipo": "str",

    "status": "str",

    "carteirinha_id": "str",

    "paciente_id": "str",

    "quantidade_autorizada": "int",

    "quantidade_executada": "int",

    "procedimento_id": "str",

    "profissional_solicitante": "Optional[str]",

    "profissional_executante": "Optional[str]",

    "observacoes": "Optional[str]",

    "created_at": "Optional[datetime]",

    "updated_at": "Optional[datetime]",

    "created_by": "Optional[str]",

    "updated_by": "Optional[str]",

    "carteirinha": "Optional[dict]",

    "paciente": "Optional[dict]",

    "procedimento": "Optional[dict]"

    },

    "frontend_interface_fields": {},

    "frontend_type_fields": [

    "int",

    "str",

    "Optional[dict]",

    "Optional[str]",

    "Optional[datetime]"

    ],

    "database_fields": [

    "salvar_guia",

    "buscar_guia",

    "criar_guia",

    "listar_guias_paciente",

    "listar_guias",

    "atualizar_guia",

    "excluir_guia"

    ],

    "endpoints": [

    "GET /guia/{numero_guia}",

    "PUT /guias/{guia_id}"

    ],

    "service_methods": [

    "listarGuias",

    "criarGuia",

    "atualizarGuia",

    "excluirGuia",

    "listarProcedimentos"

    ],

    "next_routes": [

    "/(auth)cadastros/guias",

    "/(auth)cadastros/guias"

    ],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {

    "columns": {

    "id": {

    "type": "uuid",

    "comment": null

    },

    "numero_guia": {

    "type": "text",

    "comment": null

    },

    "numero_guia_operadora": {

    "type": "text",

    "comment": null

    },

    "senha_autorizacao": {

    "type": "text",

    "comment": null

    },

    "data_emissao": {

    "type": "date",

    "comment": null

    },

    "data_validade": {

    "type": "date",

    "comment": null

    },

    "data_autorizacao": {

    "type": "date",

    "comment": null

    },

    "data_validade_senha": {

    "type": "date",

    "comment": null

    },

    "tipo": {

    "type": "tipo_guia",

    "comment": null

    },

    "status": {

    "type": "status_guia",

    "comment": null

    },

    "DELETE": {

    "type": "RESTRICT",

    "comment": null

    },

    "quantidade_autorizada": {

    "type": "integer",

    "comment": null

    },

    "quantidade_executada": {

    "type": "integer",

    "comment": null

    },

    "valor_autorizado": {

    "type": "numeric(10",

    "comment": null

    },

    "profissional_solicitante": {

    "type": "text",

    "comment": null

    },

    "profissional_executante": {

    "type": "text",

    "comment": null

    },

    "origem": {

    "type": "text",

    "comment": null

    },

    "dados_adicionais": {

    "type": "jsonb",

    "comment": null

    },

    "observacoes": {

    "type": "text",

    "comment": null

    },

    "created_at": {

    "type": "timestamptz",

    "comment": null

    },

    "updated_at": {

    "type": "timestamptz",

    "comment": null

    },

    "REFERENCES": {

    "type": "usuarios(id)",

    "comment": null

    }

    },

    "comments": {},

    "foreign_keys": [],

    "indexes": []

    },

    "related_tables": [],

    "crud_routes": {

    "root": [

    "/(auth)cadastros/guias",

    "/(auth)cadastros/guias"

    ],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {

    "pages": [

    "guias\\page.tsx"

    ],

    "components": [],

    "forms": [],

    "tables": [],

    "services": [],

    "ui_components": [

    "components"

    ]

    },

    "inconsistencies": [

    "Campos do modelo ausentes na tabela: carteirinha_id, carteirinha, created_by, paciente_id, procedimento_id, procedimento, updated_by, paciente",

    "Campos da tabela ausentes no modelo: origem, senha_autorizacao, data_validade_senha, numero_guia_operadora, REFERENCES, valor_autorizado, data_autorizacao, DELETE, dados_adicionais",

    "Tipo SQL incompatível para created_at: sql=TIMESTAMPTZ, model=Optional[datetime]",

    "Tipo SQL incompatível para updated_at: sql=TIMESTAMPTZ, model=Optional[datetime]",

    "Tipo SQL incompatível para id: sql=UUID, model=Optional[str]",

    "Tipo SQL incompatível para data_emissao: sql=DATE, model=Optional[str]",

    "Tipo SQL incompatível para tipo: sql=TIPO_GUIA, model=str",

    "Tipo SQL incompatível para data_validade: sql=DATE, model=Optional[str]",

    "Tipo SQL incompatível para status: sql=STATUS_GUIA, model=str",

    "Formulário de cadastro não encontrado em /cadastros/guias",

    "Tabela de listagem não encontrada em /cadastros/guias"

    ]

    },

    "ExcelData": {

    "backend_fields": {},

    "frontend_interface_fields": {

    "id": "number",

    "numero_guia": "string",

    "paciente_nome": "string",

    "data_execucao": "string",

    "paciente_carteirinha": "string",

    "paciente_id": "string",

    "created_at": "string",

    "label": "string"

    },

    "frontend_type_fields": [],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "Execucao": {

    "backend_fields": {},

    "frontend_interface_fields": {

    "id": "number",

    "numero_guia": "string",

    "paciente_nome": "string",

    "data_execucao": "string",

    "paciente_carteirinha": "string",

    "paciente_id": "string",

    "quantidade_sessoes": "number",

    "created_at": "string",

    "guia_id": "string",

    "possui_assinatura": "boolean",

    "codigo_ficha": "string"

    },

    "frontend_type_fields": [],

    "database_fields": [

    "atualizar_execucao"

    ],

    "endpoints": [

    "PUT /execucao/{codigo_ficha}",

    "DELETE /execucao/{codigo_ficha}"

    ],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "GuiaUnimed": {

    "backend_fields": {},

    "frontend_interface_fields": {

    "id": "string",

    "numero_guia": "string",

    "data_importacao": "string",

    "paciente_nome": "string",

    "paciente_carteirinha": "string",

    "status": "string",

    "data_execucao": "string"

    },

    "frontend_type_fields": [],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "AuditoriaResultado": {

    "backend_fields": {},

    "frontend_interface_fields": {

    "total_protocolos": "number",

    "total_divergencias": "number",

    "total_resolvidas": "number",

    "total_pendentes": "number",

    "total_fichas_sem_assinatura": "number",

    "total_execucoes_sem_ficha": "number",

    "total_fichas_sem_execucao": "number",

    "total_datas_divergentes": "number",

    "total_fichas": "number",

    "data_execucao": "string",

    "data_inicial": "string",

    "data_final": "string",

    "id": "string",

    "numero_guia": "string",

    "guia_id": "string",

    "data_atendimento": "string",

    "data_identificacao": "string",

    "codigo_ficha": "string",

    "paciente_nome": "string",

    "carteirinha": "string",

    "paciente_carteirinha": "string",

    "status": "string",

    "tipo_divergencia": "string",

    "descricao": "string",

    "descricao_divergencia": "string",

    "data_registro": "string",

    "possui_assinatura": "boolean",

    "arquivo_digitalizado": "string",

    "observacoes": "string",

    "resolvido_por": "string",

    "data_resolucao": "string",

    "quantidade_autorizada": "number",

    "quantidade_executada": "number"

    },

    "frontend_type_fields": [],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "PlanoSaude": {

    "backend_fields": {},

    "frontend_interface_fields": {

    "id": "string",

    "nome": "string",

    "codigo": "string",

    "ativo": "boolean",

    "numero": "string",

    "data_emissao": "string",

    "data_validade": "string",

    "status": "string",

    "numero_guia": "string",

    "quantidade_autorizada": "number",

    "quantidade_executada": "number",

    "tipo": "string",

    "procedimento_nome": "string",

    "paciente_carteirinha": "string",

    "data_atendimento": "string",

    "paciente_nome": "string",

    "codigo_ficha": "string",

    "possui_assinatura": "boolean",

    "total_carteirinhas": "number",

    "carteirinhas_ativas": "number",

    "total_guias": "number",

    "guias_ativas": "number",

    "sessoes_autorizadas": "number",

    "sessoes_executadas": "number",

    "taxa_execucao": "number",

    "pendente": "number",

    "em_andamento": "number",

    "concluida": "number",

    "cancelada": "number",

    "nome_responsavel": "string",

    "tipo_responsavel": "string",

    "data_nascimento": "string",

    "cpf": "string",

    "telefone": "string",

    "email": "string",

    "observacoes_clinicas": "string",

    "created_at": "string",

    "updated_at": "string",

    "idade": "number",

    "photo": "string",

    "plano_nome": "string",

    "estatisticas": "PacienteEstatisticas"

    },

    "frontend_type_fields": [],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "StorageFile": {

    "backend_fields": {},

    "frontend_interface_fields": {

    "nome": "string",

    "url": "string",

    "created_at": "string",

    "size": "number",

    "mime_type": "string"

    },

    "frontend_type_fields": [],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    },

    "GuiaProcessada": {

    "backend_fields": {},

    "frontend_interface_fields": {

    "id": "number",

    "carteira": "string",

    "nome_beneficiario": "string",

    "codigo_procedimento": "string",

    "data_atendimento": "string",

    "data_execucao": "string",

    "numero_guia": "string",

    "biometria": "string",

    "nome_profissional": "string",

    "conselho_profissional": "string",

    "numero_conselho": "string",

    "uf_conselho": "string",

    "codigo_cbo": "string",

    "created_at": "string",

    "status": "string",

    "processed_guides": "number",

    "total_guides": "number",

    "last_update": "string"

    },

    "frontend_type_fields": [],

    "database_fields": [],

    "endpoints": [],

    "service_methods": [],

    "next_routes": [],

    "components": [],

    "validations": {},

    "duplicate_routes": [],

    "table_structure": {},

    "related_tables": [],

    "crud_routes": {

    "root": [],

    "cadastros": [],

    "outros": []

    },

    "cadastros_structure": {},

    "inconsistencies": []

    }

  }

}

<PLANO DE ACAO:>

Segue o passo a passo completo, priorizado para iniciarmos as correções:

1. **Mapeamento e Priorização das Inconsistências**

   * **Ação:** Revise o relatório gerado pelo script e documente todas as divergências (tipos incompatíveis, campos ausentes, rotas duplicadas, formulários faltantes, etc.).
   * **Meta:** Crie uma lista (ou backlog) classificando os problemas por criticidade (ex.: erros de tipagem entre backend e BD são mais críticos que formulários ausentes).
2. **Padronização dos Modelos do Backend e Sincronização com o Banco**

   * **Ação:**

     * Revise os modelos Pydantic e SQLAlchemy para cada entidade.
     * Alinhe nomes e tipos de campos com a estrutura do banco (ex.: converter `data_nascimento` de `Optional[str]` para `Optional[datetime]`).
     * Ajuste as migrações (usando Alembic, por exemplo) para garantir que as tabelas estejam em sincronia com os modelos.
   * **Exemplo (Paciente):**

     ```python

     from datetime import datetime

     from pydantic import BaseModel

     from typing import Optional


     class PacienteModel(BaseModel):

         id: Optional[str]

         nome: str

         nome_responsavel: str

         cpf: Optional[str]        # Incluir se for necessário

         data_nascimento: Optional[datetime]

         telefone: Optional[str]

         email: Optional[str]

         created_at: Optional[datetime]

         updated_at: Optional[datetime]

     ```
   * **Meta:** Eliminar discrepâncias críticas entre modelos e tabela (por exemplo, tipos de data e identificadores).
3. **Revisão e Unificação dos Endpoints e Rotas**

   * **Ação:**

     * Corrija rotas duplicadas (ex.: `/cadastros/pacientes` aparecendo mais de uma vez).
     * Defina um padrão único:

       * Rotas de cadastro centralizadas em `/(auth)/cadastros/<entidade>`.
       * Outras operações via `/api/<entidade>` ou conforme o padrão definido.
   * **Meta:** Garantir que cada entidade tenha rotas claras e sem duplicidades, facilitando manutenção e integração.
4. **Alinhamento das Interfaces e Tipos no Frontend**

   * **Ação:**

     * Atualize as interfaces TypeScript para usar *camelCase* e refletir fielmente os modelos do backend.
     * Ajuste os tipos (por exemplo, datas como ISO strings) e implemente funções de conversão, se necessário.
   * **Exemplo (Paciente):**

     ```typescript

     export interface Paciente {

       id?: string;

       nome: string;

       nomeResponsavel: string;

       cpf?: string;

       dataNascimento?: string;  // ISO 8601

       telefone?: string;

       email?: string;

       createdAt?: string;

       updatedAt?: string;

     }

     ```
   * **Meta:** Assegurar compatibilidade entre dados enviados/recebidos no backend e o que o frontend espera.
5. **Implementação ou Correção dos Componentes de Cadastro e Listagem**

   * **Ação:**

     * Para cada entidade com “Formulário de cadastro não encontrado” ou “Tabela de listagem não encontrada”, crie ou ajuste os componentes faltantes no frontend.
     * Certifique-se de que os formulários utilizem as interfaces atualizadas e que os serviços chamem os endpoints padronizados.
   * **Meta:** Completar a interface do usuário para todas as entidades, garantindo a experiência de cadastro e visualização de dados.
6. **Centralização das Funções de Conversão e Validação**

   * **Ação:**

     * Desenvolva funções utilitárias para converter dados entre formatos (ex.: TIMESTAMPTZ do banco para ISO strings no frontend).
     * Utilize bibliotecas de validação (como Pydantic no backend e Zod ou Yup no frontend) para reforçar a consistência.
   * **Meta:** Minimizar erros de formatação e garantir a integridade dos dados em todas as camadas.
7. **Testes e Integração Contínua**

   * **Ação:**

     * Crie testes unitários e de integração que validem a correspondência entre modelos, endpoints e interfaces.
     * Integre o script de análise ao CI para identificar automaticamente novas inconsistências.
   * **Meta:** Ter um ciclo de feedback rápido que previna regressões e novas divergências.
8. **Atualização da Documentação e Monitoramento**

   * **Ação:**

     * Atualize a documentação (Swagger/OpenAPI para o backend, Storybook para componentes, etc.) refletindo os novos padrões.
     * Estabeleça checkpoints regulares para revisar a padronização.
   * **Meta:** Manter a equipe informada e o projeto sustentável a longo prazo.
9. **Revisão Final e Iteração**

   * **Ação:**

     * Após as implementações, execute o script de análise novamente para confirmar a resolução das inconsistências.
     * Ajuste os pontos remanescentes e documente lições aprendidas para futuras mudanças.
   * **Meta:** Alcançar uma padronização robusta e um ciclo de manutenção contínuo.

Começamos, portanto, pela **análise e priorização** seguida da **padronização dos modelos e sincronização com o banco** – pois são a base para que o restante (rotas, frontend, componentes) se alinhe corretamente.
