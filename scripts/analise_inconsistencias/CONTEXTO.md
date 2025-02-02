# Contexto do Projeto e Script de Análise

## 1. Visão Geral do Projeto

### 1.1. Objetivo do Sistema
O projeto é um sistema de agendamento especializado para uma clínica que atende crianças autistas. O sistema visa gerenciar de forma eficiente:
- Agendamentos de consultas
- Cadastro de pacientes
- Gestão de profissionais
- Controle de salas
- Gestão de guias e autorizações
- Relatórios e estatísticas

### 1.2. Stack Tecnológica
- **Frontend**: Next.js 14 com App Router + Shadcn/UI + TailwindCSS
- **Backend**: FastAPI (Python) + SQLAlchemy
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth
- **Deploy**: 
  - Frontend: Vercel
  - Backend: Replit

## 2. Entidades Principais

### 2.1. Paciente
- Dados pessoais
- Histórico clínico
- Responsáveis
- Plano de saúde
- Guias e autorizações

### 2.2. Profissional
- Dados pessoais
- Especialidades
- Agenda
- Histórico de atendimentos

### 2.3. Guia
- Número da guia
- Paciente
- Procedimentos
- Datas de validade
- Status de autorização

### 2.4. Carteirinha
- Número da carteirinha
- Plano de saúde
- Validade
- Titular

### 2.5. Plano
- Nome do plano
- Código
- Tabela de procedimentos
- Regras de autorização

## 3. Script de Análise (analyze_project.py)

### 3.1. Objetivo do Script
O script realiza uma análise abrangente do projeto para identificar inconsistências e garantir a qualidade do código. Ele verifica:
1. Consistência entre backend e frontend
2. Estrutura de cadastros
3. Tipos de dados
4. Rotas e endpoints
5. Componentes e serviços

### 3.2. Principais Análises

#### 3.2.1. Modelos do Backend
- Campos e tipos
- Validações
- Relacionamentos

#### 3.2.2. Interfaces do Frontend
- Tipos TypeScript
- Campos obrigatórios
- Interfaces compartilhadas

#### 3.2.3. Endpoints da API
- Rotas FastAPI
- Métodos HTTP
- Parâmetros e respostas

#### 3.2.4. Banco de Dados
- Estrutura das tabelas
- Tipos SQL
- Chaves e relacionamentos

#### 3.2.5. Estrutura de Cadastros
- Formulários
- Tabelas de listagem
- Componentes UI
- Serviços de API

### 3.3. Saídas do Script

#### 3.3.1. Relatório JSON (analysis_report.json)
Contém dados detalhados sobre:
- Campos e tipos de cada entidade
- Inconsistências encontradas
- Estrutura de arquivos
- Componentes utilizados

#### 3.3.2. Relatório Markdown (analise_inconsistencias.md)
Apresenta de forma legível:
- Inconsistências por entidade
- Recomendações de correção
- Estrutura recomendada
- Próximos passos

## 4. Como Usar o Script

### 4.1. Pré-requisitos
- Python 3.8+
- Projeto clonado localmente
- Dependências instaladas

### 4.2. Execução
```bash
python scripts/analise_inconsistencias/analyze_project.py
```

### 4.3. Interpretação dos Resultados
1. Verificar inconsistências reportadas
2. Priorizar correções críticas
3. Implementar melhorias sugeridas
4. Manter relatório atualizado

## 5. Observações Importantes

### 5.1. Padrões do Projeto
- Rotas autenticadas em `/(auth)/`
- Cadastros centralizados em `/cadastros/`
- Componentes reutilizáveis
- Validações consistentes

### 5.2. Pontos de Atenção
- Tipos entre camadas devem ser compatíveis
- Evitar duplicação de rotas
- Manter padrão de nomenclatura
- Documentar campos calculados

Este contexto fornece as informações essenciais para entender o projeto e o propósito do script de análise. Use-o como base para solicitar ajuda específica sobre qualquer aspecto do sistema.
