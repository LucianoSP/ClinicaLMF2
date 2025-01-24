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
import json
import logging

# Carrega variáveis de ambiente
load_dotenv()

# Configuração de logging
logging.basicConfig(level=logging.DEBUG,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuração do Redis
def init_redis(max_retries=3):
    """Configure and initialize Redis"""
    for attempt in range(max_retries):
        try:
            # Start Redis server
            os.system("redis-server --daemonize yes --protected-mode no --port 6379 --bind 0.0.0.0")
            time.sleep(2)  # Wait for Redis to start
            
            # Try to connect
            redis_conn = Redis(
                host='0.0.0.0',
                port=6379,
                socket_timeout=5,
                retry_on_timeout=True
            )
            redis_conn.ping()
            logger.info("✅ Conectado ao Redis com sucesso!")
            return redis_conn
        except Exception as e:
            logger.error(f"❌ Tentativa {attempt + 1}/{max_retries}: {str(e)}")
            time.sleep(2)
    raise Exception("Não foi possível conectar ao Redis após várias tentativas")

redis_conn = init_redis()

# Inicializa a fila
task_queue = Queue(connection=redis_conn)
logger.info(f"✅ Fila Redis inicializada. Tamanho atual: {len(task_queue)}")

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
    max_guides: Optional[int] = None


class ScrapingResult(BaseModel):
    task_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None


# Armazenamento em memória dos resultados (em produção, usar Redis ou banco de dados)
# task_results = {}


@app.post("/scrape", response_model=ScrapingResult)
async def start_scraping(task: ScrapingTask,
                         background_tasks: BackgroundTasks):
    task_id = str(datetime.now().timestamp())
    logger.info(f"📋 Nova tarefa de scraping iniciada: {task_id}")
    logger.debug(f"Dados da tarefa: {task.model_dump()}")
    
    # Inicializa o status no Redis
    try:
        redis_conn.hset(f"task:{task_id}", mapping={"status": "processing"})
        logger.info("✅ Status inicial salvo no Redis")
    except Exception as e:
        logger.error(f"❌ Erro ao salvar status no Redis: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao inicializar tarefa")

    # Adiciona tarefa à fila do Redis
    try:
        job = task_queue.enqueue(process_scraping, task_id, task.model_dump())
        logger.info(f"✅ Tarefa adicionada à fila. Job ID: {job.id}")
        logger.info(f"📊 Tamanho atual da fila: {len(task_queue)}")
    except Exception as e:
        logger.error(f"❌ Erro ao adicionar tarefa à fila: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao iniciar processamento")

    return ScrapingResult(task_id=task_id, status="processing")


@app.get("/status/{task_id}", response_model=ScrapingResult)
async def get_status(task_id: str):
    # Busca o status no Redis
    try:
        result = {
            k.decode('utf-8'): v.decode('utf-8') 
            for k, v in redis_conn.hgetall(f"task:{task_id}").items()
        }
        logger.debug(f"📋 Status da tarefa {task_id}: {result}")
        
        if not result:
            logger.warning(f"⚠️ Tarefa não encontrada: {task_id}")
            raise HTTPException(status_code=404, detail="Tarefa não encontrada")

        return ScrapingResult(
            task_id=task_id,
            status=result.get("status", "processing"),
            result=json.loads(result.get("result", "null")) if result.get("result") else None,
            error=result.get("error"),
        )
    except Exception as e:
        logger.error(f"❌ Erro ao buscar status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar status: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
