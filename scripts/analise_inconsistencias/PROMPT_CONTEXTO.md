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

## 6. Como Usar Este Contexto

Este documento serve como base para entender:
1. A estrutura geral do projeto
2. O propósito do script de análise
3. As entidades e seus relacionamentos
4. Os padrões e convenções adotados

Use estas informações para:
- Entender o contexto de uma dúvida
- Propor soluções adequadas
- Manter consistência com o projeto
- Seguir os padrões estabelecidos
