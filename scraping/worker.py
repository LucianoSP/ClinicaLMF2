from datetime import datetime
import os
import requests
from scraper import UnimedScraper
from redis import Redis
import logging

# Configuração de logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuração do Redis
redis_conn = Redis(host="0.0.0.0", port=6379, decode_responses=True)

def atualizar_status(task_id: str, status: str, detalhes: dict = None, error: str = None):
    """Atualiza o status da tarefa no Redis e no dicionário"""
    status_data = {"status": status}
    if detalhes:
        status_data.update(detalhes)
    if error:
        status_data["error"] = error
    
    redis_conn.hset(f"task:{task_id}", mapping=status_data)
    logger.info(f"Status da tarefa {task_id}: {status} - {detalhes if detalhes else error if error else ''}")

def process_scraping(task_id: str, task_data: dict, task_results: dict):
    try:
        logger.info(f"Iniciando scraping para o período: {task_data.get('start_date')} até {task_data.get('end_date')}")
        atualizar_status(task_id, "iniciando", {"message": "Iniciando o processo de scraping"})

        scraper = UnimedScraper()
        logger.info("Realizando login na Unimed...")
        atualizar_status(task_id, "login", {"message": "Realizando login na Unimed"})
        
        scraper.login(os.getenv("UNIMED_USERNAME"), os.getenv("UNIMED_PASSWORD"))
        logger.info("Login realizado com sucesso")

        # Define datas padrão se não fornecidas
        start_date = task_data.get("start_date") or datetime.now().strftime("%d/%m/%Y")
        end_date = task_data.get("end_date") or datetime.now().strftime("%d/%m/%Y")

        logger.info("Extraindo guias...")
        atualizar_status(task_id, "extraindo", {"message": "Extraindo guias do sistema Unimed"})
        results = scraper.extract_guides(start_date, end_date)
        logger.info(f"Extraídas {len(results)} guias")

        # Envia resultados para o backend principal
        api_url = os.getenv("MAIN_API_URL")
        logger.info("Enviando guias para o backend principal...")
        atualizar_status(task_id, "enviando", {
            "message": "Enviando guias para o sistema",
            "total_guides": len(results),
            "processed_guides": 0
        })

        for i, guide in enumerate(results, 1):
            try:
                response = requests.post(f"{api_url}/unimed/guias", json=guide)
                response.raise_for_status()
                atualizar_status(task_id, "enviando", {
                    "message": "Enviando guias para o sistema",
                    "total_guides": len(results),
                    "processed_guides": i
                })
            except Exception as e:
                logger.error(f"Erro ao enviar guia para API principal: {str(e)}")

        logger.info("Processo concluído com sucesso")
        atualizar_status(task_id, "completed", {"result": {"total_guides": len(results)}})
        task_results[task_id] = {
            "status": "completed",
            "result": {"total_guides": len(results)},
        }
    except Exception as e:
        logger.error(f"Erro durante o scraping: {str(e)}")
        atualizar_status(task_id, "failed", error=str(e))
        task_results[task_id] = {"status": "failed", "error": str(e)}
    finally:
        scraper.close()
