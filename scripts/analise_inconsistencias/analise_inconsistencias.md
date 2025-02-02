# Análise de Inconsistências do Projeto
## 1. Inconsistências por Entidade
### 1.2. Paciente
#### Campos Faltantes
**No Backend:**
- `status`
- `tipo_responsavel`
- `plano_nome`
- `observacoes_clinicas`
- `idade`
- `photo`
- `estatisticas`

#### Tipos Incompatíveis
```
Backend                  Frontend
data_nascimento: Optional[str]   -> string
created_at: Optional[datetime] -> string
telefone: Optional[str]   -> string
email: Optional[str]   -> string
nome_responsavel: str             -> string
cpf: Optional[str]   -> string
updated_at: Optional[datetime] -> string
nome: str             -> string
id: Optional[str]   -> string
```

#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `cpf`
**Campos da tabela ausentes no modelo:**
- `endereco`
- `observacoes`
- `REFERENCES`
- `character`

### 1.34. Carteirinha
#### Campos Faltantes
**No Frontend:**
- `created_at`
- `paciente`
- `numero_carteirinha`
- `plano_saude`
- `plano_saude_id`
- `motivo_inativacao`
- `updated_at`
- `paciente_id`
- `created_by`
**No Backend:**
- `data_emissao`
- `nome`
- `numero`

#### Tipos Incompatíveis
```
Backend                  Frontend
data_validade: Optional[str]   -> string
status: str             -> string
id: Optional[str]   -> string
```

#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `paciente`
- `plano_saude`
- `plano_saude_id`
- `paciente_id`
- `created_by`
**Campos da tabela ausentes no modelo:**
- `REFERENCES`
- `historico_status`
- `DELETE`

### 1.69. Plano
#### Tipos Incompatíveis
```
Backend                  Frontend
created_at: Optional[datetime] -> string
ativo: bool            -> boolean
codigo: str             -> string
updated_at: Optional[datetime] -> string
nome: str             -> string
id: Optional[str]   -> string
```

### 1.79. Sessao
#### Campos Faltantes
**No Backend:**
- `created_at`
- `ficha_presenca_id`
- `executado`
- `updated_at`
- `id`

#### Tipos Incompatíveis
```
Backend                  Frontend
profissional_executante: unknown         -> string
possui_assinatura: bool            -> boolean
observacoes_sessao: unknown         -> string
status: str             -> string
data_sessao: str             -> string
valor_sessao: unknown         -> number
tipo_terapia: unknown         -> string
```

### 1.98. FichaPresenca
#### Campos Faltantes
**No Frontend:**
- `sessoes`
- `arquivo_digitalizado`
**No Backend:**
- `id`
- `data_atendimento`

#### Tipos Incompatíveis
```
Backend                  Frontend
possui_assinatura: bool            -> boolean
paciente_nome: str             -> string
codigo_ficha: str             -> string
numero_guia: str             -> string
paciente_carteirinha: str             -> string
```

### 1.115. Procedimento
#### Tipos Incompatíveis
```
Backend                  Frontend
created_at: Optional[datetime] -> string
descricao: Optional[str]   -> string
updated_by: Optional[str]   -> string
ativo: bool            -> boolean
codigo: str             -> string
updated_at: Optional[datetime] -> string
nome: str             -> string
id: Optional[str]   -> string
created_by: Optional[str]   -> string
```

#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `updated_by`
- `created_by`
**Campos da tabela ausentes no modelo:**
- `REFERENCES`

### 1.135. Guia
#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `procedimento_id`
- `paciente`
- `updated_by`
- `carteirinha`
- `procedimento`
- `carteirinha_id`
- `paciente_id`
- `created_by`
**Campos da tabela ausentes no modelo:**
- `data_autorizacao`
- `dados_adicionais`
- `senha_autorizacao`
- `valor_autorizado`
- `origem`
- `DELETE`
- `data_validade_senha`
- `numero_guia_operadora`
- `REFERENCES`

### 1.157. Divergencia
#### Problemas com a Tabela
**Campos da tabela ausentes no modelo:**
- `created_at`
- `status`
- `DELETE`
- `tipo`
- `tentativas_resolucao`
- `updated_at`
- `descricao`
- `data_identificacao`
- `numero_guia`
- `paciente_nome`
- `detalhes`
- `carteirinha`
- `codigo_ficha`
- `data_atendimento`
- `data_execucao`
- `data_resolucao`
- `REFERENCES`
- `prioridade`
- `id`


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

Este relatório foi gerado automaticamente em 2025-02-02T12:28:15-03:00.
Algumas inconsistências podem requerer análise manual mais detalhada.
Recomenda-se manter este relatório atualizado conforme as correções são implementadas.
