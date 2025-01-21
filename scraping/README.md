# Serviço de Scraping Unimed

Este é um serviço separado responsável por realizar o scraping de guias da Unimed. Ele foi projetado para funcionar independentemente do backend principal, utilizando filas para processamento assíncrono.

## Estrutura do Projeto

- `main.py`: API FastAPI que gerencia as requisições de scraping
- `scraper.py`: Implementação do scraper usando Selenium
- `requirements.txt`: Dependências do projeto
- `.env`: Configurações do ambiente (criar baseado no .env.example)

## Configuração

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Configure o arquivo .env:
```bash
cp .env.example .env
```

3. Instale o Redis (necessário para o sistema de filas)

## Execução

Para iniciar o serviço:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Endpoints

### POST /scrape
Inicia uma nova tarefa de scraping.

Payload:
```json
{
  "username": "string",
  "password": "string",
  "start_date": "DD/MM/YYYY",  // opcional
  "end_date": "DD/MM/YYYY"     // opcional
}
```

### GET /status/{task_id}
Verifica o status de uma tarefa de scraping.

## Integração com o Backend Principal

O serviço envia automaticamente os dados extraídos para o backend principal através da URL configurada em MAIN_API_URL.

## Ambiente de Produção

Para o ambiente de produção no Replit:

1. Configure as variáveis de ambiente no Replit
2. Instale o Chrome e o ChromeDriver
3. Configure PRODUCTION=true no .env
