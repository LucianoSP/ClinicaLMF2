# Sistema de Gestão de Guias Médicas - Clínica LMF

## Descrição
Sistema web desenvolvido para gerenciamento e auditoria de guias médicas, permitindo o upload, processamento e validação de documentos médicos, com foco em controle de atendimentos e verificação de conformidade.

## Principais Funcionalidades
- Upload e processamento de guias médicas em PDF
- Importação de dados via planilhas Excel
- Sistema de auditoria automatizada
- Gestão de divergências
- Interface web para visualização e gerenciamento
- Controle de assinaturas em documentos
- Filtros e busca avançada de registros

## Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework Python para criação de APIs
- **SQLite**: Banco de dados para armazenamento local
- **Pandas**: Processamento de dados e análise
- **Anthropic**: Integração com IA para processamento de documentos

### Frontend
- **Next.js 14**: Framework React com renderização do lado do servidor
- **Shadcn/ui**: Biblioteca de componentes UI customizáveis
- **Axios**: Cliente HTTP para comunicação com a API
- **TypeScript**: Linguagem de programação tipada

### Ferramentas de Desenvolvimento
- **Python 3.8+**
- **Node.js**
- **Git**: Controle de versão

## Hospedagem
- **Frontend**: Hospedado na [Vercel](https://vercel.com)
  - URL: [clinica-lmf-2-n66vmxplw-lucianosps-projects.vercel.app](https://clinica-lmf-2-n66vmxplw-lucianosps-projects.vercel.app)
- **Backend**: Hospedado no [Replit](https://replit.com)
  - URL: [API Backend](https://fde1cb19-4f63-43d4-a9b7-a3d808e8d2b7-00-3cdk7z76k6er0.kirk.replit.dev/)

## Estrutura do Projeto
- `/frontend`: Código fonte da interface web
- `/GUIAS`: Diretório para armazenamento de guias processadas
- `app.py`: Arquivo principal da aplicação backend
- `database.py`: Gerenciamento do banco de dados
- `auditoria.py`: Lógica de auditoria e validação

## Como Executar
1. Instale as dependências do Python:
```bash
pip install -r requirements.txt
```

2. Execute o servidor backend:
```bash
uvicorn app:app --reload
```

3. Acesse a interface web através do navegador

## Funcionalidades da API
- `/upload/pdf`: Upload de guias em PDF
- `/upload/excel`: Importação de dados via Excel
- `/guias`: Listagem e busca de guias
- `/auditoria`: Endpoints relacionados à auditoria
- `/divergencias`: Gestão de divergências encontradas
