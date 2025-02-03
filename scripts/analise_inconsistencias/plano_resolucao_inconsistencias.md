# Plano de Resolução de Inconsistências

## 1. Organização do Código

### 1.1. Estrutura de Pastas
```
src/
  ├── app/(auth)/[modulo]/
  │   ├── components/
  │   │   ├── ModuloForm.tsx    # Formulário específico do módulo
  │   │   └── columns.tsx       # Definições de colunas da tabela
  │   └── page.tsx              # Página principal com listagem e CRUD
  ├── services/
  │   └── moduloService.ts      # Serviços de API centralizados
  └── types/
      └── modulo.ts            # Interfaces e tipos
```

### 1.2. Serviços de API
- **Localização**: `src/services/`
- **Nomenclatura**: `nomeService.ts`
- **Exemplo**:
  ```typescript
  // src/services/pacienteService.ts
  import { api } from '@/lib/api'
  import { Paciente } from '@/types/paciente'

  interface ListResponse<T> {
    items: T[]
    total: number
    pages: number
  }

  export async function listarPacientes(
    page: number = 1,
    search?: string,
    limit: number = 10
  ): Promise<ListResponse<Paciente>> {
    const { data } = await api.get('/pacientes', { 
      params: { 
        limit, 
        offset: (page - 1) * limit,
        search 
      } 
    })
    return data
  }

  export async function excluirPaciente(id: string): Promise<void> {
    await api.delete(`/pacientes/${id}`)
  }
  ```

### 1.3. Componentes React

1. **Página Principal** (`page.tsx`)
   - Implementa a listagem com CRUD completo
   - Usa React Query para estado da API
   - Gerencia estados locais (diálogos, loading, etc)
   - Exemplo:
   ```typescript
   export default function PacientesPage() {
     const [isFormOpen, setIsFormOpen] = useState(false)
     const [searchTerm, setSearchTerm] = useState('')
     const [currentPage, setCurrentPage] = useState(1)

     const { data, isLoading } = useQuery({
       queryKey: ['pacientes', currentPage, searchTerm],
       queryFn: () => listarPacientes(currentPage, searchTerm)
     })

     // ... resto da implementação
   }
   ```

2. **Formulário** (`components/ModuloForm.tsx`)
   - Validação com Zod
   - Tratamento de erros
   - Feedback visual
   - Exemplo:
   ```typescript
   const formSchema = z.object({
     nome: z.string().min(1, "Nome é obrigatório").max(100),
     email: z.string().email().optional(),
     // ... outros campos
   })
   ```

3. **Colunas** (`components/columns.tsx`)
   - Define a estrutura da tabela
   - Ações por linha
   - Formatação de dados
   - Exemplo:
   ```typescript
   export const columns: ColumnDef<Paciente>[] = [
     {
       accessorKey: "nome",
       header: "Nome"
     },
     // ... outras colunas
   ]
   ```

## 2. Padrões e Convenções

### 2.1. Validação de Dados
- Usar Zod para validação de formulários
- Definir limites de caracteres
- Validar formatos (email, CPF, etc)
- Tratar campos opcionais

### 2.2. Tratamento de Erros
- Feedback visual para o usuário
- Mensagens de erro claras
- Logs para debug
- Tratamento de erros da API

### 2.3. Estado e Cache
- Usar React Query para dados da API
- Estados locais com useState
- Invalidação de cache após mutações
- Feedback de loading

### 2.4. UI/UX
- Diálogos de confirmação
- Indicadores de loading
- Mensagens de sucesso/erro
- Paginação e busca
- Responsividade

## 3. Checklist de Implementação

Para cada novo módulo, seguir:

1. **Estrutura**
   - [ ] Criar pasta no app router
   - [ ] Definir tipos/interfaces
   - [ ] Criar serviço de API
   - [ ] Implementar componentes

2. **Funcionalidades**
   - [ ] CRUD completo
   - [ ] Busca e filtros
   - [ ] Paginação
   - [ ] Validações
   - [ ] Tratamento de erros

3. **Qualidade**
   - [ ] Tipos bem definidos
   - [ ] Validações adequadas
   - [ ] Feedback ao usuário
   - [ ] Código organizado
   - [ ] Sem duplicação

4. **Performance**
   - [ ] Cache configurado
   - [ ] Loading states
   - [ ] Paginação eficiente
   - [ ] Debounce em buscas

## 4. Monitoramento

- Revisar implementações periodicamente
- Verificar consistência entre módulos
- Atualizar documentação quando necessário
- Refatorar código duplicado
