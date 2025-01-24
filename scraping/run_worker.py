import os
import sys
import logging
from redis import Redis
from rq import Queue, Worker
from dotenv import load_dotenv

# Configuração de logs
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

def main():
    try:
        # Conecta ao Redis - sem decode_responses
        redis_conn = Redis(
            host='0.0.0.0',
            port=6379,
            socket_timeout=5,
            retry_on_timeout=True
        )
        redis_conn.ping()
        logger.info("✅ Conectado ao Redis com sucesso!")

        # Inicia o worker
        queue = Queue(connection=redis_conn)
        worker = Worker([queue], connection=redis_conn)
        logger.info("🚀 Worker iniciado e aguardando tarefas...")
        worker.work()
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar worker: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
