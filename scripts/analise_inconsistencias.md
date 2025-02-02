# Análise de Inconsistências do Projeto
## 1. Inconsistências por Entidade
### 1.2. Paciente
#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `cpf`
**Campos da tabela ausentes no modelo:**
- `REFERENCES`
- `character`
- `observacoes`
- `endereco`

### 1.12. Carteirinha
#### Campos Faltantes
**No Frontend:**
- `created_by`
- `plano_saude`
- `status`
- `paciente`
**No Backend:**
- `titular`
- `ativo`
- `nome`
- `data_nascimento`
- `pacienteId`
- `dataValidade`
- `codigo`
- `cpf`
- `telefone`
- `nomeTitular`
- `nome_responsavel`
- `planoSaudeId`
- `numeroCarteirinha`

#### Tipos Incompatíveis
```
Backend                  Frontend
created_at: Optional[datetime] -> string
paciente_id: str             -> string
numero_carteirinha: str             -> string
updated_at: Optional[datetime] -> string
id: Optional[str]   -> string
plano_saude_id: str             -> string
motivo_inativacao: str             -> string
data_validade: Optional[str]   -> string
```

#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `created_by`
- `paciente_id`
- `plano_saude_id`
- `plano_saude`
- `paciente`
**Campos da tabela ausentes no modelo:**
- `DELETE`
- `REFERENCES`
- `historico_status`

### 1.57. Plano
#### Tipos Incompatíveis
```
Backend                  Frontend
created_at: Optional[datetime] -> string
ativo: bool            -> boolean
nome: str             -> string
codigo: str             -> string
updated_at: Optional[datetime] -> string
id: Optional[str]   -> string
```

### 1.67. Sessao
#### Campos Faltantes
**No Backend:**
- `created_at`
- `updated_at`
- `id`
- `ficha_presenca_id`
- `executado`

#### Tipos Incompatíveis
```
Backend                  Frontend
tipo_terapia: unknown         -> string
observacoes_sessao: unknown         -> string
possui_assinatura: bool            -> boolean
profissional_executante: unknown         -> string
data_sessao: str             -> string
valor_sessao: unknown         -> number
status: str             -> string
```

### 1.86. Procedimento
#### Tipos Incompatíveis
```
Backend                  Frontend
created_at: Optional[datetime] -> string
ativo: bool            -> boolean
nome: str             -> string
created_by: Optional[str]   -> string
codigo: str             -> string
descricao: Optional[str]   -> string
id: Optional[str]   -> string
updated_at: Optional[datetime] -> string
updated_by: Optional[str]   -> string
```

#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `updated_by`
- `created_by`
**Campos da tabela ausentes no modelo:**
- `REFERENCES`

### 1.106. Guia
#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `carteirinha_id`
- `carteirinha`
- `created_by`
- `paciente_id`
- `procedimento_id`
- `procedimento`
- `updated_by`
- `paciente`
**Campos da tabela ausentes no modelo:**
- `origem`
- `senha_autorizacao`
- `data_validade_senha`
- `numero_guia_operadora`
- `REFERENCES`
- `valor_autorizado`
- `data_autorizacao`
- `DELETE`
- `dados_adicionais`


## 2. Recomendações

### 2.1. Alta Prioridade
1. Corrigir tipos incompatíveis entre camadas
2. Unificar rotas duplicadas
3. Adicionar campos faltantes no backend
4. Alinhar estrutura das tabelas com os modelos

### 2.2. Média Prioridade
1. Padronizar nomenclatura de campos
2. Implementar validações consistentes
3. Documentar campos calculados
4. Revisar relacionamentos entre tabelas

### 2.3. Baixa Prioridade
1. Refatorar estrutura de arquivos
2. Melhorar tipagem TypeScript
3. Adicionar testes automatizados
4. Otimizar consultas ao banco

## 3. Estrutura Recomendada

```
(auth)/
  ├── cadastros/
  │   ├── [entidade]/
  │   │   ├── page.tsx
  │   │   ├── [id]/
  │   │   │   └── page.tsx
  │   │   ├── components/
  │   │   │   ├── Form.tsx
  │   │   │   └── Table.tsx
  │   │   └── services/
  │   │       └── api.ts
  │   └── ...
  └── dashboard/
      └── page.tsx
```

## 4. Próximos Passos

1. Revisar este relatório com a equipe
2. Priorizar correções críticas
3. Criar branches específicas para cada tipo de correção
4. Implementar testes antes das correções
5. Realizar as correções de forma incremental
6. Validar cada correção em ambiente de teste

## 5. Observações

Este relatório foi gerado automaticamente em 2025-02-02T12:54:16-03:00.
Algumas inconsistências podem requerer análise manual mais detalhada.
Recomenda-se manter este relatório atualizado conforme as correções são implementadas.
