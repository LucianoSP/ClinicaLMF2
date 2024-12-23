## 5. Diagrama do Banco de Dados

```mermaid
erDiagram
    PACIENTES ||--o{ CARTEIRINHAS : "possui"
    PLANOS_SAUDE ||--o{ CARTEIRINHAS : "emite"
    CARTEIRINHAS ||--o{ GUIAS : "utilizada em"
    USUARIOS ||--o{ EXECUCOES : "registra"
    USUARIOS ||--o{ DIVERGENCIAS : "resolve"
    GUIAS ||--o{ EXECUCOES : "tem"
    GUIAS ||--o{ FICHAS_PRESENCA : "tem"
    PACIENTES ||--o{ AGENDAMENTOS : "possui"

    PACIENTES {
        uuid id PK
        text nome
        text carteirinha
        timestamp created_at
        timestamp updated_at
    }

    PLANOS_SAUDE {
        uuid id PK
        string codigo
        string nome
        timestamp created_at
        timestamp updated_at
    }

    CARTEIRINHAS {
        uuid id PK
        uuid paciente_id FK
        uuid plano_id FK
        string numero_carteirinha
        date data_validade
        boolean titular
        string nome_titular
        timestamp created_at
        timestamp updated_at
    }

    GUIAS {
        uuid id PK
        string numero_guia
        date data_emissao
        date data_validade
        enum tipo
        enum status
        string paciente_carteirinha
        string paciente_nome
        integer quantidade_autorizada
        integer quantidade_executada
        string procedimento_codigo
        string procedimento_nome
        string profissional_solicitante
        string profissional_executante
        string observacoes
        timestamp created_at
        timestamp updated_at
    }

    FICHAS_PRESENCA {
        uuid id PK
        date data_atendimento NULL
        string paciente_nome
        string paciente_carteirinha
        string numero_guia
        string codigo_ficha
        boolean possui_assinatura
        string arquivo_digitalizado
        string observacoes
        timestamp created_at
        timestamp updated_at
    }

    EXECUCOES {
        uuid id PK
        string numero_guia
        string paciente_nome
        date data_execucao NULL
        string paciente_carteirinha
        string paciente_id
        uuid usuario_executante FK
        string codigo_ficha
        timestamp created_at
        timestamp updated_at
    }

    DIVERGENCIAS {
        uuid id PK
        string tipo_divergencia
        string descricao
        enum status
        timestamp data_identificacao
        timestamp data_resolucao
        uuid resolvido_por FK
        string observacoes
        string numero_guia
        date data_execucao
        date data_atendimento
        string codigo_ficha
        timestamp created_at
        timestamp updated_at
    }

    USUARIOS {
        uuid id PK
        uuid auth_user_id FK
        string nome
        string email
        boolean ativo
        timestamp ultimo_acesso
        timestamp created_at
        timestamp updated_at
    }

    AGENDAMENTOS {
        uuid id PK
        integer mysql_id
        uuid paciente_id FK
        timestamp data_inicio
        timestamp data_fim
        integer pagamento_id
        integer sala_id
        integer qtd_sessoes
        string status
        numeric valor_sala
        boolean fixo
        integer especialidade_id
        integer local_id
        string elegibilidade
        boolean falta_profissional
        integer parent_id
        integer agendamento_pai_id
        string codigo_faturamento
        timestamp data_registro
        timestamp ultima_atualizacao
        integer saldo_sessoes
        timestamp created_at
        timestamp updated_at
    }

    AUDITORIA_EXECUCOES {
        uuid id PK
        timestamp data_execucao
        date data_inicial
        date data_final
        integer total_protocolos
        integer total_divergencias
        jsonb divergencias_por_tipo
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
```

### 5.1 Análise das Tabelas e Relações

#### Tabela PACIENTES
- **Objetivo**: Centralizar informações básicas dos pacientes
- **Campos Essenciais**: id, nome, carteirinha
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Um paciente pode ter várias carteirinhas
  - Um paciente pode ter vários agendamentos

#### Tabela PLANOS_SAUDE
- **Objetivo**: Cadastro de convênios aceitos
- **Campos Essenciais**: id, nome, codigo
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: Um plano pode emitir várias carteirinhas

#### Tabela CARTEIRINHAS
- **Objetivo**: Vincular pacientes a planos de saúde
- **Campos Essenciais**: id, paciente_id, plano_saude_id, numero_carteirinha, data_validade
- **Campos Adicionais**: titular, nome_titular
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Pertence a um paciente
  - Pertence a um plano
  - Usada em guias

#### Tabela FICHAS_PRESENCA
- **Objetivo**: Registrar atendimentos físicos presenciais. Cada linha representa um único atendimento.
- **Campos Essenciais**: id, data_atendimento (pode ser nulo), paciente_nome, paciente_carteirinha, numero_guia, codigo_ficha
- **Campos de Controle**: possui_assinatura, arquivo_digitalizado, observacoes
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Vinculada a uma guia (uma guia pode ter várias fichas)
  - Pode ser referenciada em execuções

#### Tabela EXECUCOES
- **Objetivo**: Registrar execuções/faturamentos no sistema. Cada linha representa uma única sessão executada.
- **Campos Essenciais**: id, numero_guia, data_execucao (pode ser nulo)
- **Campos de Identificação**: paciente_nome, paciente_carteirinha, paciente_id
- **Campos de Controle**: usuario_executante, codigo_ficha
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Relacionada com guia através do numero_guia (uma guia pode ter várias execuções)
  - Registrada por um usuário
  - Pode referenciar uma ficha de presença

#### Tabela DIVERGENCIAS
- **Objetivo**: Controlar inconsistências entre fichas e execuções
- **Campos Essenciais**: id, tipo_divergencia, descricao, status
- **Campos de Controle**: data_identificacao, data_resolucao, resolvido_por, observacoes
- **Campos de Referência**: numero_guia, data_execucao, data_atendimento, codigo_ficha
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Resolvida por um usuário
  - Pode referenciar guias, execuções e fichas

#### Tabela USUARIOS
- **Objetivo**: Gerenciar usuários do sistema
- **Campos Essenciais**: id, auth_user_id, nome, email
- **Campos de Controle**: ativo, ultimo_acesso
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Registra execuções
  - Resolve divergências

#### Tabela GUIAS
- **Objetivo**: Armazenar informações das guias médicas
- **Campos Essenciais**: id, numero_guia, data_emissao, data_validade, tipo, status
- **Campos de Identificação**: paciente_carteirinha, paciente_nome
- **Campos de Controle**: quantidade_autorizada, quantidade_executada
- **Campos Adicionais**: procedimento_codigo, procedimento_nome, profissional_solicitante, profissional_executante, observacoes
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Tem várias execuções
  - Tem várias fichas de presença

#### Tabela AGENDAMENTOS
- **Objetivo**: Controlar agendamentos e sessões
- **Campos Essenciais**: id, paciente_id, data_inicio, data_fim, qtd_sessoes, status
- **Campos de Integração**: mysql_id
- **Campos de Controle**: valor_sala, fixo, especialidade_id, local_id, saldo_sessoes
- **Campos Adicionais**: elegibilidade, falta_profissional, parent_id, agendamento_pai_id, codigo_faturamento
- **Campos de Auditoria**: created_at, updated_at, data_registro, ultima_atualizacao
- **Relações**: Pertence a um paciente

#### Tabela AUDITORIA_EXECUCOES
- **Objetivo**: Armazenar metadados de execuções de auditoria
- **Campos Essenciais**: id, data_execucao, data_inicial, data_final, total_protocolos, total_divergencias
- **Campos de Controle**: divergencias_por_tipo, created_by
- **Campos de Auditoria**: created_at, updated_at
- **Relações**: 
  - Executada por um usuário