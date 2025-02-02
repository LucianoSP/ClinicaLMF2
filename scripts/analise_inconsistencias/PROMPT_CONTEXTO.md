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

### 1.3. Estrutura do Código Frontend

#### 1.3.1. Serviços de API (`src/services/`)
Serviços centralizados para comunicação com o backend:
- `pacienteService.ts`
- `guiaService.ts`
- `carteirinhaService.ts`
- `procedimentoService.ts`
- `fichaPresencaService.ts`

#### 1.3.2. Componentes
1. **Componentes Compartilhados** (`src/components/`)
   - Componentes reutilizáveis em toda aplicação
   - Exemplos: `Button`, `Input`, `Modal`, `DataTable`
   - Mantêm consistência visual através do design system

2. **Componentes Específicos** (`src/app/(auth)/[feature]/components/`)
   - Componentes fortemente acoplados à lógica da página
   - Exemplos: `PacienteForm`, `columns.tsx`
   - Otimizados para o caso de uso específico

#### 1.3.3. Configurações
- `src/lib/api.ts`: Configuração do axios e interceptors
- `src/config/env.ts`: Variáveis de ambiente e configurações

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
- Serviços de API
- Componentes e formulários
- Rotas e páginas

#### 3.2.3. Verificação de Consistência
- Correspondência entre modelos e interfaces
- Padronização de nomes e tipos
- Validações em ambas as camadas
- Integridade dos relacionamentos
