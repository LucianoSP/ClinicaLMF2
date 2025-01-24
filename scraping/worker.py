from datetime import datetime
import os
import requests
from scraper import UnimedScraper
from redis import Redis
import logging
import json
import traceback

# Configuração de logs
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configuração do Redis
redis_conn = Redis(host="localhost", port=6379, socket_timeout=5, retry_on_timeout=True)


def atualizar_status(
    task_id: str, status: str, detalhes: dict = None, error: str = None
):
    """Atualiza o status da tarefa no Redis"""
    try:
        status_data = {"status": status}
        if detalhes:
            if isinstance(detalhes, dict):
                status_data.update(
                    {k: str(v).encode("utf-8") for k, v in detalhes.items()}
                )
            else:
                logger.error(f"❌ Detalhes inválidos (deve ser dict): {detalhes}")
        if error:
            status_data["error"] = error.encode("utf-8")

        redis_conn.hset(f"task:{task_id}", mapping=status_data)
        logger.info(f"✅ Status atualizado: {task_id} -> {status}")
        logger.debug(f"📋 Detalhes do status: {status_data}")
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar status no Redis: {str(e)}")


def process_scraping(task_id: str, task_data: dict, *args, **kwargs):
    logger.info(f"🚀 Iniciando processamento da tarefa {task_id}")
    logger.debug(f"📋 Dados da tarefa: {task_data}")

    try:
        logger.info(
            f"📅 Período: {task_data.get('start_date')} até {task_data.get('end_date')}"
        )
        atualizar_status(
            task_id, "iniciando", {"message": "Iniciando o processo de scraping"}
        )

        # Obtém credenciais do Replit Secrets
        username = os.environ.get("UNIMED_USERNAME")
        password = os.environ.get("UNIMED_PASSWORD")

        if not username or not password:
            raise Exception(
                "Credenciais da Unimed não configuradas nos secrets do Replit"
            )

        scraper = UnimedScraper()
        logger.info("🔑 Realizando login na Unimed...")
        atualizar_status(task_id, "login", {"message": "Realizando login na Unimed"})

        scraper.login(username, password)
        logger.info("✅ Login realizado com sucesso")

        # Define datas padrão se não fornecidas
        start_date = task_data.get("start_date") or datetime.now().strftime("%d/%m/%Y")
        end_date = task_data.get("end_date") or datetime.now().strftime("%d/%m/%Y")
        max_guides = task_data.get("max_guides")  # Pode ser None

        logger.info(
            f"🔍 Extraindo guias (limite: {max_guides if max_guides else 'sem limite'})..."
        )
        atualizar_status(
            task_id, "extraindo", {"message": "Extraindo guias do sistema Unimed"}
        )
        results = scraper.extract_guides(start_date, end_date, max_guides=max_guides)
        logger.info(f"✅ Extraídas {len(results)} guias")

        # Envia resultados para o backend principal
        api_url = os.environ.get("MAIN_API_URL")
        if not api_url:
            raise Exception("MAIN_API_URL não configurada")

        logger.info("📤 Enviando guias para o backend principal...")
        atualizar_status(
            task_id,
            "enviando",
            {
                "message": "Enviando guias para o sistema",
                "total_guides": len(results),
                "processed_guides": 0,
            },
        )

        for i, guide in enumerate(results, 1):
            try:
                response = requests.post(api_url, json=guide)
                response.raise_for_status()
                atualizar_status(
                    task_id,
                    "enviando",
                    {
                        "message": "Enviando guias para o sistema",
                        "total_guides": len(results),
                        "processed_guides": i,
                    },
                )
                logger.debug(f"✅ Guia {i}/{len(results)} enviada com sucesso")
            except Exception as e:
                logger.error(f"❌ Erro ao enviar guia {i}/{len(results)}: {str(e)}")

        logger.info("🎉 Processo concluído com sucesso")
        atualizar_status(
            task_id, "completed", {"result": json.dumps({"total_guides": len(results)})}
        )
    except Exception as e:
        logger.error(f"❌ Erro durante o scraping: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        atualizar_status(task_id, "failed", error=str(e))
    finally:
        try:
            scraper.close()
            logger.info("✅ Recursos do scraper liberados")
        except Exception as e:
            logger.error(f"❌ Erro ao fechar scraper: {str(e)}")
