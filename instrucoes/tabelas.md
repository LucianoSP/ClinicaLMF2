# Estrutura do Banco de Dados

## Diagrama de Relacionamento

```mermaid
erDiagram
    protocolos_excel ||--o{ atendimentos : "verifica"
    atendimentos ||--o{ divergencias : "gera"

    protocolos_excel {
        int id PK
        text idGuia
        text nomePaciente
        text dataExec
        text carteirinha
        text idPaciente
        timestamp created_at
    }

    atendimentos {
        int id PK
        text data_execucao
        text numero_carteira
        text paciente_nome
        text numero_guia_principal
        text codigo_ficha
        boolean possui_assinatura
    }

    divergencias {
        int id PK
        text numero_guia
        text data_exec
        text codigo_ficha
        text descricao_divergencia
        text status
        timestamp data_registro
    }
```

## Descrição das Tabelas

### protocolos_excel
Armazena os dados importados de planilhas Excel, servindo como fonte de referência para verificação dos atendimentos.

### atendimentos
Registra os atendimentos realizados, com informações do beneficiário, guia e código da ficha.

### divergencias
Registra inconsistências encontradas entre os protocolos do Excel e os atendimentos registrados.

## Observações
- Não existem chaves estrangeiras explícitas (FOREIGN KEYS) no esquema atual
- O relacionamento entre as tabelas é feito através de campos de texto como `numero_guia`, `codigo_ficha`
- A auditoria é feita cruzando dados entre `protocolos_excel` e `atendimentos`, gerando registros em `divergencias`
- Os campos de data são armazenados como TEXT, não como DATE/TIMESTAMP
- Existe um sistema de status para acompanhamento das divergências (default 'Pendente')