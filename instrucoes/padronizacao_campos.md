# Padronização dos Campos

## Campos que precisam ser padronizados

### Identificadores de Guia
Atualmente existem variações:
- `numero_guia_principal` (execucaos)
- `idGuia` (protocolos_excel)
- `numero_guia` (divergencias)

**Padronização sugerida:** `guia_id`

### Dados do Paciente
Atualmente existem variações:
- `paciente_nome` (execucaos)
- `nomePaciente` (protocolos_excel)
- `beneficiario` (divergencias)

**Padronização sugerida:** `paciente_nome`

### Número da Carteirinha
Atualmente existem variações:
- `numero_carteira` (execucaos)
- `carteirinha` (protocolos_excel)

**Padronização sugerida:** `paciente_carteirinha`

### Datas
Atualmente existem variações:
- `data_execucao` (execucaos)
- `dataExec` (protocolos_excel)
- `data_exec` (divergencias)

**Padronização sugerida:** `data_execucao`

### Código da Ficha
Atualmente existem variações:
- `codigo_ficha` (execucaos e divergencias)

**Mantém-se:** `codigo_ficha` (já está padronizado)

## Proposta de Estrutura Padronizada

```sql
-- Tabela protocolos_excel
CREATE TABLE protocolos_excel (
    id BIGINT PRIMARY KEY,
    guia_id TEXT NOT NULL,
    paciente_nome TEXT NOT NULL,
    data_execucao TIMESTAMP NOT NULL,
    paciente_carteirinha TEXT NOT NULL,
    paciente_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela execucaos
CREATE TABLE execucaos (
    id BIGINT PRIMARY KEY,
    data_execucao TIMESTAMP NOT NULL,
    paciente_carteirinha TEXT NOT NULL,
    paciente_nome TEXT NOT NULL,
    guia_id TEXT NOT NULL,
    codigo_ficha TEXT,
    possui_assinatura BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela divergencias
CREATE TABLE divergencias (
    id BIGINT PRIMARY KEY,
    guia_id TEXT NOT NULL,
    data_execucao TIMESTAMP NOT NULL,
    codigo_ficha TEXT NOT NULL,
    descricao_divergencia TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Observações sobre a Padronização

1. Todos os identificadores seguem o padrão snake_case
2. Campos relacionados ao paciente começam com prefixo `paciente_`
3. Campos de data usam o tipo TIMESTAMP do PostgreSQL
4. Campos de criação/registro padronizados como `created_at`
5. Campos booleanos usam TRUE/FALSE do PostgreSQL em vez de 0/1
6. IDs das tabelas alterados para BIGINT (mais apropriado para PostgreSQL/Supabase)
