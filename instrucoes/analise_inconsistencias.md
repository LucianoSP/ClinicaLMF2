# Análise de Inconsistências do Projeto
## 1. Inconsistências por Entidade
### 1.2. Paciente
#### Campos Faltantes
**No Backend:**
- `observacoes_clinicas`
- `estatisticas`
- `status`
- `idade`
- `plano_nome`
- `tipo_responsavel`
- `photo`

#### Tipos Incompatíveis
```
Backend                  Frontend
nome: str             -> string
created_at: Optional[datetime] -> string
id: Optional[str]   -> string
telefone: Optional[str]   -> string
nome_responsavel: str             -> string
updated_at: Optional[datetime] -> string
data_nascimento: Optional[str]   -> string
cpf: Optional[str]   -> string
email: Optional[str]   -> string
```

#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `cpf`
**Campos da tabela ausentes no modelo:**
- `endereco`
- `REFERENCES`
- `observacoes`
- `character`

### 1.34. Carteirinha
#### Campos Faltantes
**No Frontend:**
- `motivo_inativacao`
- `numero_carteirinha`
- `created_at`
- `paciente`
- `plano_saude_id`
- `paciente_id`
- `updated_at`
- `created_by`
- `plano_saude`
**No Backend:**
- `nome`
- `numero`
- `data_emissao`

#### Tipos Incompatíveis
```
Backend                  Frontend
data_validade: Optional[str]   -> string
id: Optional[str]   -> string
status: str             -> string
```

#### Problemas com a Tabela
**Campos do modelo ausentes na tabela:**
- `paciente`
- `plano_saude_id`
- `paciente_id`
- `created_by`
- `plano_saude`
**Campos da tabela ausentes no modelo:**
- `historico_status`
- `REFERENCES`
- `DELETE`

### 1.69. Plano
#### Tipos Incompatíveis
```
Backend                  Frontend
ativo: bool            -> boolean
nome: str             -> string
id: Optional[str]   -> string
created_at: Optional[datetime] -> string
updated_at: Optional[datetime] -> string
codigo: str             -> string
```

### 1.79. Sessao
#### Campos Faltantes
**No Backend:**
- `ficha_presenca_id`
- `created_at`
- `id`
- `updated_at`
- `executado`

#### Tipos Incompatíveis
```
Backend                  Frontend
possui_assinatura: bool            -> boolean
status: str             -> string
valor_sessao: unknown         -> number
tipo_terapia: unknown         -> string
profissional_executante: unknown         -> string
data_sessao: str             -> string
observacoes_sessao: unknown         -> string
```

### 1.98. FichaPresenca
#### Campos Faltantes
**No Frontend:**
- `sessoes`
- `arquivo_digitalizado`
**No Backend:**
- `data_atendimento`
- `id`

#### Tipos Incompatíveis
```
Backend                  Frontend
paciente_carteirinha: str             -> string
possui_assinatura: bool            -> boolean
codigo_ficha: str             -> string
paciente_nome: str             -> string
numero_guia: str             -> string
```

### 1.115. Procedimento
#### Tipos Incompatíveis
```
Backend                  Frontend
ativo: bool            -> boolean
nome: str             -> string
created_at: Optional[datetime] -> string
id: Optional[str]   -> string
updated_at: Optional[datetime] -> string
created_by: Optional[str]   -> string
updated_by: Optional[str]   -> string
descricao: Optional[str]   -> string
codigo: str             -> string
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
- `carteirinha_id`
- `paciente_id`
- `procedimento`
- `created_by`
- `updated_by`
- `carteirinha`
**Campos da tabela ausentes no modelo:**
- `REFERENCES`
- `data_validade_senha`
- `data_autorizacao`
- `valor_autorizado`
- `numero_guia_operadora`
- `origem`
- `senha_autorizacao`
- `dados_adicionais`
- `DELETE`

### 1.157. Divergencia
#### Problemas com a Tabela
**Campos da tabela ausentes no modelo:**
- `id`
- `data_identificacao`
- `codigo_ficha`
- `data_resolucao`
- `detalhes`
- `paciente_nome`
- `updated_at`
- `tentativas_resolucao`
- `descricao`
- `data_atendimento`
- `tipo`
- `data_execucao`
- `prioridade`
- `numero_guia`
- `REFERENCES`
- `created_at`
- `status`
- `carteirinha`
- `DELETE`


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
