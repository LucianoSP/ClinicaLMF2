from redis import Redis
from rq import Queue
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def clear_redis():
    try:
        # Conecta ao Redis
        redis_conn = Redis(host='0.0.0.0', port=6379)
        redis_conn.ping()
        logger.info("✅ Conectado ao Redis")

        # Limpa todas as chaves relacionadas ao RQ
        keys = redis_conn.keys('rq:*')
        if keys:
            redis_conn.delete(*keys)
            logger.info(f"🧹 Removidas {len(keys)} chaves RQ do Redis")
        else:
            logger.info("ℹ️ Nenhuma chave RQ encontrada no Redis")

        # Limpa todas as chaves de tarefas
        task_keys = redis_conn.keys('task:*')
        if task_keys:
            redis_conn.delete(*task_keys)
            logger.info(f"🧹 Removidas {len(task_keys)} chaves de tarefas do Redis")
        else:
            logger.info("ℹ️ Nenhuma chave de tarefa encontrada no Redis")

        logger.info("✅ Redis limpo com sucesso!")
    except Exception as e:
        logger.error(f"❌ Erro ao limpar Redis: {str(e)}")
        raise

if __name__ == "__main__":
    clear_redis()
