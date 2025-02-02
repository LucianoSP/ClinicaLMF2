# Plano de Resolução de Inconsistências

## 1. Organização do Código

### 1.1. Serviços de API
- **Ação**: Centralizar todos os serviços de API na pasta `src/services/`
- **Objetivo**: Evitar duplicação e manter consistência nas chamadas à API
- **Exemplo**:
  ```typescript
  // src/services/pacienteService.ts
  import { api } from '@/lib/api';
  import { Paciente } from '@/types/paciente';

  interface PacienteResponse {
    items: Paciente[];
    total: number;
    pages: number;
  }

  export async function listarPacientes(
    page: number = 1,
    search?: string,
    limit: number = 10
  ): Promise<PacienteResponse> {
    const { data } = await api.get('/pacientes', { 
      params: { 
        limit, 
        offset: (page - 1) * limit,
        search 
      } 
    });
    return data;
  }
  ```

### 1.2. Componentes React
1. **Componentes Compartilhados** (`src/components/`)
   - Componentes genéricos e reutilizáveis
   - Manter consistência visual
   - Exemplos: `Button`, `Input`, `DataTable`

2. **Componentes Específicos** (`src/app/(auth)/[feature]/components/`)
   - Componentes acoplados à lógica da página
   - Podem usar componentes compartilhados
   - Exemplos: `PacienteForm`, `columns.tsx`

## 2. Padronização dos Modelos

### 2.1. Backend (Python/FastAPI)
```python
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class PacienteBase(BaseModel):
    nome: str
    nome_responsavel: str
    data_nascimento: Optional[datetime]
    cpf: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    altura: Optional[str]
    peso: Optional[str]
    tipo_sanguineo: Optional[str]

class PacienteCreate(PacienteBase):
    pass

class PacienteUpdate(PacienteBase):
    pass

class Paciente(PacienteBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
```

### 2.2. Frontend (TypeScript)
```typescript
// src/types/paciente.ts
export interface Paciente {
  id: string;
  nome: string;
  nome_responsavel: string;
  data_nascimento?: string; // ISO 8601
  cpf?: string;
  telefone?: string;
  email?: string;
  altura?: string;
  peso?: string;
  tipo_sanguineo?: string;
  created_at: string;
  updated_at: string;
}
```

## 3. Plano de Ação

### 3.1. Fase 1: Estrutura Base
1. Mover todos os serviços de API para `src/services/`
2. Atualizar imports em todos os componentes
3. Remover serviços duplicados
4. Configurar axios e interceptors em `src/lib/api.ts`

### 3.2. Fase 2: Tipagem e Validação
1. Definir interfaces TypeScript para todas as entidades
2. Implementar funções de conversão de dados quando necessário
3. Adicionar validações usando Zod ou similar
4. Documentar os tipos e validações

### 3.3. Fase 3: Componentes
1. Identificar componentes que podem ser compartilhados
2. Mover componentes específicos para suas páginas
3. Implementar composição de componentes
4. Documentar uso e props

### 3.4. Fase 4: Testes e Documentação
1. Criar testes para serviços de API
2. Testar componentes compartilhados
3. Atualizar documentação com nova estrutura
4. Criar guia de boas práticas

## 4. Convenções e Boas Práticas

### 4.1. Serviços
- Um arquivo por recurso (pacientes, guias, etc.)
- Funções assíncronas com tratamento de erro
- Logs para debug
- Tipagem forte

### 4.2. Componentes
- Componentes compartilhados genéricos
- Componentes específicos focados
- Props bem definidas
- Composição sobre herança

### 4.3. Nomenclatura
- Serviços: `nomeService.ts`
- Componentes compartilhados: PascalCase
- Funções: camelCase
- Interfaces: PascalCase

## 5. Monitoramento e Manutenção

### 5.1. Checklist de Qualidade
- [ ] Serviços centralizados
- [ ] Tipos consistentes
- [ ] Componentes organizados
- [ ] Documentação atualizada
- [ ] Testes implementados

### 5.2. Revisão Periódica
- Executar script de análise
- Verificar logs de erro
- Atualizar dependências
- Refatorar conforme necessário
