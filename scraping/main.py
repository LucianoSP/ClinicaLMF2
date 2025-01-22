from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import os
import time
from dotenv import load_dotenv
from rq import Queue
from redis import Redis
from worker import process_scraping

# Carrega variáveis de ambiente
load_dotenv()

# Configuração do Redis
def init_redis(max_retries=3):
    for attempt in range(max_retries):
        try:
            # Start Redis server
            os.system("redis-server --daemonize yes --protected-mode no --port 6379 --bind 0.0.0.0")
            time.sleep(2)  # Wait for Redis to start
            
            # Try to connect
            redis_conn = Redis(
                host='0.0.0.0',
                port=6379,
                decode_responses=True,
                socket_timeout=5,
                retry_on_timeout=True
            )
            redis_conn.ping()
            print("✅ Conectado ao Redis com sucesso!")
            return redis_conn
        except Exception as e:
            print(f"❌ Tentativa {attempt + 1}/{max_retries}: {str(e)}")
            time.sleep(2)
    raise Exception("Não foi possível conectar ao Redis após várias tentativas")

redis_conn = init_redis()

# Inicializa a fila
task_queue = Queue(connection=redis_conn)

# Credenciais Unimed
UNIMED_USERNAME = os.getenv("UNIMED_USERNAME")
UNIMED_PASSWORD = os.getenv("UNIMED_PASSWORD")

if not UNIMED_USERNAME or not UNIMED_PASSWORD:
    raise ValueError(
        "As credenciais da Unimed são obrigatórias. Configure UNIMED_USERNAME e UNIMED_PASSWORD no ambiente."
    )

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
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ScrapingResult(BaseModel):
    task_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None


# Armazenamento em memória dos resultados (em produção, usar Redis ou banco de dados)
task_results = {}


@app.post("/scrape", response_model=ScrapingResult)
async def start_scraping(task: ScrapingTask,
                         background_tasks: BackgroundTasks):
    task_id = str(datetime.now().timestamp())
    task_results[task_id] = {"status": "processing"}

    # Adiciona tarefa à fila do Redis
    job = task_queue.enqueue(process_scraping, task_id, task.dict(),
                             task_results)

    return ScrapingResult(task_id=task_id, status="processing")


@app.get("/status/{task_id}", response_model=ScrapingResult)
async def get_status(task_id: str):
    if task_id not in task_results:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")

    result = task_results[task_id]
    return ScrapingResult(
        task_id=task_id,
        status=result["status"],
        result=result.get("result"),
        error=result.get("error"),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
