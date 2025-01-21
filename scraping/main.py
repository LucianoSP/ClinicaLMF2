from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import os
from dotenv import load_dotenv
from scraper import UnimesScraper
from rq import Queue
from redis import Redis
import json

# Carrega variáveis de ambiente
load_dotenv()

# Configuração do Redis para fila de tarefas
redis_conn = Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD', None)
)
task_queue = Queue(connection=redis_conn)

app = FastAPI(title="Serviço de Scraping Unimed")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configurar para os domínios específicos em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapingTask(BaseModel):
    username: str
    password: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ScrapingResult(BaseModel):
    task_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None

# Armazenamento em memória dos resultados (em produção, usar Redis ou banco de dados)
task_results = {}

def process_scraping(task_id: str, credentials: ScrapingTask):
    try:
        scraper = UnimesScraper()
        scraper.login(credentials.username, credentials.password)
        
        # Define datas padrão se não fornecidas
        if not credentials.start_date:
            credentials.start_date = datetime.now().strftime("%d/%m/%Y")
        if not credentials.end_date:
            credentials.end_date = datetime.now().strftime("%d/%m/%Y")
        
        results = scraper.extract_guides(credentials.start_date, credentials.end_date)
        
        # Envia resultados para o backend principal
        api_url = os.getenv('MAIN_API_URL')
        for guide in results:
            try:
                response = requests.post(f"{api_url}/unimed/guias", json=guide)
                response.raise_for_status()
            except Exception as e:
                print(f"Erro ao enviar guia para API principal: {str(e)}")
        
        task_results[task_id] = {
            "status": "completed",
            "result": {"total_guides": len(results)}
        }
    except Exception as e:
        task_results[task_id] = {
            "status": "failed",
            "error": str(e)
        }
    finally:
        scraper.close()

@app.post("/scrape", response_model=ScrapingResult)
async def start_scraping(task: ScrapingTask, background_tasks: BackgroundTasks):
    task_id = str(datetime.now().timestamp())
    task_results[task_id] = {"status": "processing"}
    
    # Adiciona tarefa à fila do Redis
    job = task_queue.enqueue(process_scraping, task_id, task)
    
    return ScrapingResult(
        task_id=task_id,
        status="processing"
    )

@app.get("/status/{task_id}", response_model=ScrapingResult)
async def get_status(task_id: str):
    if task_id not in task_results:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    result = task_results[task_id]
    return ScrapingResult(
        task_id=task_id,
        status=result["status"],
        result=result.get("result"),
        error=result.get("error")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
