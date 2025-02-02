# Script de Análise de Implementação

Este documento descreve o script Python que analisa a consistência da implementação entre o backend (FastAPI) e o frontend (Next.js) do sistema.

## 1. Visão Geral

O script `analyze_project.py` realiza uma análise completa do projeto, verificando:
- Modelos e campos do backend
- Interfaces e tipos do frontend
- Endpoints da API
- Funções de banco de dados
- Serviços do frontend
- Rotas do Next.js
- Componentes relacionados
- Validações de campos
- Estrutura das tabelas SQL
- Estrutura da página de cadastros

## 2. Análises Realizadas

### 2.1. Modelos do Backend (`analyze_backend_models`)

Analisa os modelos definidos no arquivo `app.py`:
- Campos e seus tipos
- Validações aplicadas aos campos
- Relacionamentos entre entidades
- Decoradores e configurações especiais

Exemplo de análise:
```python
class Paciente(Base):
    id: int
    nome: str = Field(min_length=3)
    cpf: str = Field(regex=r'^\d{3}\.\d{3}\.\d{3}-\d{2}$')
```

### 2.2. Interfaces do Frontend (`analyze_frontend_interfaces`)

Examina as interfaces TypeScript em `src/types`:
- Campos e seus tipos
- Tipos opcionais e obrigatórios
- Tipos complexos (arrays, objetos)
- Tipos personalizados

Exemplo de interface analisada:
```typescript
interface Paciente {
    id: number;
    nome: string;
    cpf: string;
    carteirinhas?: Carteirinha[];
}
```

### 2.3. Endpoints da API (`analyze_endpoints`)

Mapeia todos os endpoints FastAPI:
- Métodos HTTP (GET, POST, PUT, DELETE)
- Parâmetros de rota
- Query parameters
- Corpo das requisições
- Respostas esperadas

Endpoints verificados:
- `GET /{entidade}s` - Listar todos
- `GET /{entidade}s/{id}` - Buscar por ID
- `POST /{entidade}s` - Criar novo
- `PUT /{entidade}s/{id}` - Atualizar
- `DELETE /{entidade}s/{id}` - Deletar

### 2.4. Funções de Banco de Dados (`analyze_database_functions`)

Analisa as funções em `database_supabase.py`:
- Operações CRUD básicas
- Queries personalizadas
- Relacionamentos
- Tratamento de erros
- Transações

### 2.5. Serviços do Frontend (`analyze_frontend_services`)

Examina os serviços em `src/services`:
- Métodos de comunicação com a API
- Tratamento de erros
- Cache e estado
- Transformação de dados

### 2.6. Rotas do Next.js (`analyze_next_routes`)

Analisa as rotas em `src/app/(auth)`:
- Estrutura de pastas
- Páginas e layouts
- Parâmetros de rota
- Rotas duplicadas
- Proteção de rotas

### 2.7. Componentes (`analyze_components`)

Mapeia componentes em `src/components`:
- Uso de entidades
- Props e tipos
- Validações de formulário
- Componentes reutilizáveis

### 2.8. Estrutura de Tabelas (`analyze_table_structure`)

Analisa as definições SQL em `sql/criar_tabelas.sql`:
- Colunas e tipos
- Chaves primárias e estrangeiras
- Índices e constraints
- Comentários de documentação
- Relacionamentos entre tabelas

### 2.9. Estrutura de Cadastros (`analyze_cadastros_structure`)

Analisa a estrutura específica da pasta `(auth)/cadastros`:

#### 2.9.1. Estrutura de Arquivos
```
(auth)/cadastros/
  ├── entidade1/
  │   ├── page.tsx              # Página principal
  │   ├── components/           # Componentes específicos
  │   │   ├── Form.tsx         # Formulário de cadastro
  │   │   └── Table.tsx        # Tabela de listagem
  │   └── services/            # Serviços da entidade
  │       └── api.ts
  └── entidade2/
      └── ...
```

#### 2.9.2. Elementos Analisados
- **Páginas**: Arquivos `page.tsx` para cada entidade
- **Formulários**: Componentes `*Form.tsx` para cadastro/edição
- **Tabelas**: Componentes `*Table.tsx` para listagem
- **Componentes**: Outros componentes específicos
- **Serviços**: Chamadas à API e lógica de negócio
- **UI Components**: Uso de componentes shadcn/ui

#### 2.9.3. Verificações
- Presença de todos os componentes necessários
- Duplicação de funcionalidade com rotas principais
- Consistência de implementação entre entidades
- Padrões de código e estrutura

## 3. Relatório de Inconsistências

O script gera um relatório JSON com:

### 3.1. Campos Inconsistentes
- Campos presentes no backend mas ausentes no frontend
- Campos presentes no frontend mas ausentes no backend
- Tipos incompatíveis entre as camadas

### 3.2. Rotas Duplicadas
- Rotas que apontam para a mesma funcionalidade
- Conflitos de rota
- Nomenclatura inconsistente
- Duplicação entre rotas principais e cadastros

### 3.3. Validações Ausentes
- Campos sem validação
- Validações incompletas
- Validações inconsistentes entre camadas

### 3.4. Endpoints Faltantes
- Endpoints básicos não implementados
- Endpoints com implementação incompleta
- Endpoints com nomenclatura inconsistente

### 3.5. Tipos Incompatíveis
- Mapeamento incorreto de tipos entre Python e TypeScript
- Tipos opcionais vs obrigatórios
- Arrays e objetos aninhados

### 3.6. Estrutura de Cadastros
- Componentes faltantes (Form, Table)
- Duplicação de funcionalidade
- Inconsistência na implementação
- Padrões diferentes entre entidades

## 4. Como Usar

1. Execute o script:
```bash
python scripts/analyze_project.py
```

2. O relatório será gerado em `analysis_report.json`

3. Analise as inconsistências reportadas

4. Corrija os problemas seguindo as sugestões

## 5. Mapeamento de Tipos

### 5.1. Python para TypeScript
- `str` -> `string`
- `int` -> `number`
- `float` -> `number`
- `bool` -> `boolean`
- `List[T]` -> `T[]`
- `Dict[K, V]` -> `Record<K, V>`
- `Optional[T]` -> `T | null`
- `datetime` -> `Date | string`

### 5.2. SQL para Python
- `INTEGER/BIGINT/SMALLINT` -> `int`
- `VARCHAR/TEXT` -> `str`
- `BOOLEAN` -> `bool`
- `TIMESTAMP` -> `datetime`
- `DATE` -> `date`
- `NUMERIC/DECIMAL` -> `Decimal`
- `JSON/JSONB` -> `dict`

### 5.3. Validações
- Regex para CPF: `r'^\d{3}\.\d{3}\.\d{3}-\d{2}$'`
- Regex para email: `r'^[\w\.-]+@[\w\.-]+\.\w+$'`
- Regex para telefone: `r'^\(\d{2}\)\s\d{4,5}-\d{4}$'`

## 6. Boas Práticas

1. **Campos**:
   - Use nomes consistentes em todas as camadas
   - Mantenha tipos compatíveis
   - Documente campos especiais

2. **Rotas**:
   - Evite duplicação
   - Use nomes descritivos
   - Siga padrões REST
   - Mantenha consistência entre rotas principais e cadastros

3. **Validações**:
   - Valide em todas as camadas
   - Use mensagens de erro claras
   - Mantenha regras consistentes

4. **Tipos**:
   - Use tipos específicos
   - Evite `any` no TypeScript
   - Documente tipos complexos

5. **Cadastros**:
   - Mantenha estrutura consistente
   - Evite duplicação de funcionalidade
   - Reutilize componentes quando possível
   - Siga o mesmo padrão para todas as entidades