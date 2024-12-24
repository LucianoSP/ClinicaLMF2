from datetime import datetime
from typing import Dict, List, Optional
import logging
import traceback
from fastapi import APIRouter, HTTPException

from database_supabase import (
    listar_fichas_presenca,
    listar_execucoes,
    registrar_divergencia,
    registrar_auditoria_execucoes,
    limpar_divergencias_db,
    listar_divergencias,
)

# Configuração de logging
logging.basicConfig(level=logging.INFO)

# Criar router
router = APIRouter()


def verificar_datas(protocolo: Dict, execucao: Dict) -> bool:
    """Verifica se as datas do protocolo e execucao correspondem"""
    try:
        data_protocolo = datetime.strptime(protocolo["dataExec"], "%d/%m/%Y")
        data_execucao = datetime.strptime(execucao["data_execucao"], "%d/%m/%Y")
        return data_protocolo == data_execucao
    except ValueError as e:
        logging.error(f"Erro ao comparar datas: {e}")
        return False


def verificar_quantidade_execucaos(protocolo: Dict, execucaos: List[Dict]) -> bool:
    """Verifica se a quantidade de execucaos corresponde ao protocolo"""
    try:
        qtd_protocolo = int(protocolo.get("quantidade", 1))
        return len(execucaos) == qtd_protocolo
    except ValueError as e:
        logging.error(f"Erro ao comparar quantidades: {e}")
        return False


def formatar_data_iso(data_str: str) -> str:
    """
    Converte uma data no formato YYYY-MM-DD para DD/MM/YYYY
    """
    try:
        data = datetime.strptime(data_str, "%Y-%m-%d")
        return data.strftime("%d/%m/%Y")
    except ValueError:
        return data_str


def verificar_validade_guia(guia: Dict) -> bool:
    """
    Verifica se a guia está dentro do prazo de validade.

    Args:
        guia: Dicionário contendo os dados da guia

    Returns:
        bool: True se a guia está válida, False caso contrário
    """
    try:
        if not guia.get("data_validade"):
            return True

        data_validade = datetime.strptime(guia["data_validade"], "%Y-%m-%d")
        return datetime.now() <= data_validade
    except ValueError as e:
        logging.error(f"Erro ao verificar validade da guia: {e}")
        return False


def verificar_quantidade_autorizada(guia: Dict) -> bool:
    """
    Verifica se a quantidade executada não excede a autorizada na guia.

    Args:
        guia: Dicionário contendo os dados da guia

    Returns:
        bool: True se a quantidade está dentro do limite, False caso contrário
    """
    try:
        qtd_autorizada = int(guia.get("quantidade_autorizada", 0))
        qtd_executada = int(guia.get("quantidade_executada", 0))
        return qtd_executada <= qtd_autorizada
    except ValueError as e:
        logging.error(f"Erro ao verificar quantidade autorizada: {e}")
        return False


def realizar_auditoria(
    data_inicial: Optional[str] = None, data_final: Optional[str] = None
) -> bool:
    """
    Realiza a auditoria das fichas vs execuções
    """
    try:
        logging.info(
            f"Iniciando auditoria com data_inicial={data_inicial}, data_final={data_final}"
        )
        logging.info("Iniciando processo de auditoria de fichas vs execuções...")

        # Limpa divergências antigas
        print("Iniciando limpeza da tabela divergencias...")
        if not limpar_divergencias_db():
            logging.error("Erro ao limpar divergências antigas")
            return False
        print("Tabela divergencias limpa com sucesso!")

        # Busca fichas e execuções
        fichas = listar_fichas_presenca(limit=0)
        execucoes = listar_execucoes(limit=0)

        logging.info(f"Total de fichas a serem auditadas: {len(fichas)}")
        logging.info(f"Total de execuções a serem auditadas: {len(execucoes)}")

        # Mapeia fichas por número da guia para facilitar a busca
        fichas_por_guia = {ficha.get("numero_guia"): ficha for ficha in fichas}
        execucoes_por_guia = {exec.get("numero_guia"): exec for exec in execucoes}

        # Verifica execuções sem ficha
        for execucao in execucoes:
            numero_guia = execucao.get("numero_guia")
            if not fichas_por_guia.get(numero_guia):
                registrar_divergencia(
                    numero_guia=numero_guia,
                    data_execucao=execucao.get("data_execucao"),
                    codigo_ficha=execucao.get("codigo_ficha"),
                    tipo_divergencia="execucao_sem_ficha",
                    descricao="Execução sem ficha de presença correspondente",
                    paciente_nome=execucao.get("paciente_nome"),
                    carteirinha=execucao.get("carteirinha"),
                    prioridade="ALTA",
                )

        # Verifica fichas sem execução
        for ficha in fichas:
            numero_guia = ficha.get("numero_guia")
            if not execucoes_por_guia.get(numero_guia):
                registrar_divergencia(
                    numero_guia=numero_guia,
                    data_atendimento=ficha.get("data_atendimento"),
                    codigo_ficha=ficha.get("codigo_ficha"),
                    tipo_divergencia="ficha_sem_execucao",
                    descricao="Ficha sem execução correspondente",
                    paciente_nome=ficha.get("paciente_nome"),
                    carteirinha=ficha.get("carteirinha"),
                    prioridade="ALTA",
                )

        # Registra metadados da auditoria
        total_registros = len(fichas) + len(execucoes)
        registrar_auditoria_execucoes(
            total_protocolos=total_registros,
            data_inicial=data_inicial,
            data_final=data_final,
        )

        return True

    except Exception as e:
        logging.error(f"Erro ao realizar auditoria: {str(e)}")
        logging.error(traceback.format_exc())
        return False


def registrar_divergencia_detalhada(divergencia: Dict) -> bool:
    """
    Registra uma divergência com detalhes específicos.
    """
    try:
        # Extrai os campos obrigatórios
        dados = {
            "numero_guia": divergencia["numero_guia"],
            "tipo_divergencia": divergencia["tipo_divergencia"],
            "descricao": divergencia["descricao"],
            "paciente_nome": divergencia["paciente_nome"],
            "prioridade": divergencia["prioridade"],
        }

        # Adiciona campos opcionais se existirem
        campos_opcionais = [
            "data_execucao",
            "data_atendimento",
            "codigo_ficha",
            "carteirinha",
            "detalhes",
        ]

        for campo in campos_opcionais:
            if campo in divergencia:
                dados[campo] = divergencia[campo]

        # Registra a divergência
        return registrar_divergencia(**dados)

    except Exception as e:
        print(f"Erro ao registrar divergência detalhada: {e}")
        traceback.print_exc()
        return False


def realizar_auditoria_fichas_execucoes(
    data_inicial: str = None, data_final: str = None
):
    """
    Realiza a auditoria cruzando dados entre as tabelas de fichas_presenca e execucoes,
    registrando divergências encontradas.

    Args:
        data_inicial: Data inicial para filtrar (formato: YYYY-MM-DD ou DD/MM/YYYY)
        data_final: Data final para filtrar (formato: YYYY-MM-DD ou DD/MM/YYYY)
    """
    logging.info("Iniciando processo de auditoria de fichas vs execuções...")
    start_time = datetime.now()

    try:
        # Limpa divergências antigas antes de começar nova auditoria
        limpar_divergencias_db()
        logging.info("Divergências antigas removidas com sucesso")

        # Busca todas as fichas de presença e execuções
        fichas = listar_fichas_presenca(limit=0)
        execucoes = listar_execucoes(limit=0)

        if not isinstance(fichas, list):
            fichas = []
        if not isinstance(execucoes, list):
            execucoes = []

        # Criar um dicionário para mapear código_ficha -> ficha
        mapa_fichas = {f["codigo_ficha"]: f for f in fichas}

        # Criar um dicionário para mapear código_ficha -> execucoes
        mapa_execucoes = {}
        for execucao in execucoes:
            if execucao["codigo_ficha"]:
                if execucao["codigo_ficha"] not in mapa_execucoes:
                    mapa_execucoes[execucao["codigo_ficha"]] = []
                mapa_execucoes[execucao["codigo_ficha"]].append(execucao)

        total_fichas = len(fichas)
        total_execucoes = len(execucoes)
        logging.info(f"Total de fichas a serem auditadas: {total_fichas}")
        logging.info(f"Total de execuções a serem auditadas: {total_execucoes}")

        divergencias_encontradas = 0

        # 1. Para cada ficha, verifica as execuções correspondentes
        for ficha in fichas:
            codigo_ficha = ficha["codigo_ficha"]
            execucoes_da_ficha = mapa_execucoes.get(codigo_ficha, [])

            # Se não houver nenhuma execução
            if not execucoes_da_ficha:
                divergencias_encontradas += 1
                registrar_divergencia_detalhada(
                    {
                        "numero_guia": ficha["numero_guia"],
                        "data_atendimento": ficha["data_atendimento"],
                        "codigo_ficha": codigo_ficha,
                        "tipo_divergencia": "ficha_sem_execucao",
                        "descricao": "Ficha de presença sem execução correspondente",
                        "paciente_nome": ficha["paciente_nome"],
                        "carteirinha": ficha["paciente_carteirinha"],
                        "prioridade": "ALTA",
                    }
                )
            else:
                # Para cada execução desta ficha, verifica se a data bate
                for execucao in execucoes_da_ficha:
                    if execucao["data_execucao"] != ficha["data_atendimento"]:
                        divergencias_encontradas += 1
                        registrar_divergencia_detalhada(
                            {
                                "numero_guia": execucao["numero_guia"],
                                "data_execucao": execucao["data_execucao"],
                                "data_atendimento": ficha["data_atendimento"],
                                "codigo_ficha": codigo_ficha,
                                "tipo_divergencia": "data_divergente",
                                "descricao": f'Data da ficha ({ficha["data_atendimento"]}) diferente da execução ({execucao["data_execucao"]})',
                                "paciente_nome": execucao["paciente_nome"],
                                "carteirinha": execucao["paciente_carteirinha"],
                                "prioridade": "MEDIA",
                            }
                        )

        # 2. Para cada execução, verifica se existe a ficha correspondente
        for execucao in execucoes:
            if (
                not execucao["codigo_ficha"]
                or execucao["codigo_ficha"] not in mapa_fichas
            ):
                divergencias_encontradas += 1
                registrar_divergencia_detalhada(
                    {
                        "numero_guia": execucao["numero_guia"],
                        "data_execucao": execucao["data_execucao"],
                        "data_atendimento": execucao["data_execucao"],  # Usando a mesma data da execução como data de atendimento
                        "codigo_ficha": execucao.get("codigo_ficha"),
                        "tipo_divergencia": "execucao_sem_ficha",
                        "descricao": "Execução sem ficha de presença correspondente",
                        "paciente_nome": execucao["paciente_nome"],
                        "carteirinha": execucao["paciente_carteirinha"],
                        "prioridade": "ALTA",
                    }
                )

        end_time = datetime.now()
        tempo_execucao = str(end_time - start_time)

        return {
            "message": "Auditoria realizada com sucesso",
            "data": {
                "total_protocolos": total_fichas + total_execucoes,
                "total_divergencias": divergencias_encontradas,
                "total_resolvidas": 0,
                "total_pendentes": divergencias_encontradas,
                "total_fichas_sem_assinatura": 0,
                "total_execucoes_sem_ficha": len(
                    [e for e in execucoes if not e.get("codigo_ficha")]
                ),
                "data_execucao": end_time.strftime("%Y-%m-%dT%H:%M:%S.%f%z"),
                "tempo_execucao": tempo_execucao,
            },
        }

    except Exception as e:
        logging.error(f"Erro durante auditoria: {str(e)}")
        logging.error(traceback.format_exc())
        raise e


@router.get("/divergencias")
def listar_divergencias_route(
    page: int = 1,
    per_page: int = 10,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    tipo_divergencia: Optional[str] = None,
    prioridade: Optional[str] = None,
):
    """
    Lista as divergências encontradas na auditoria
    """
    try:
        return listar_divergencias(
            page=page,
            per_page=per_page,
            data_inicio=data_inicio,
            data_fim=data_fim,
            status=status,
            tipo_divergencia=tipo_divergencia,
            prioridade=prioridade,
        )
    except Exception as e:
        logging.error(f"Erro ao listar divergências: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar divergências: {str(e)}"
        )


if __name__ == "__main__":
    # Exemplo de uso: python auditoria.py
    resultado = realizar_auditoria()
    print(
        f"""
    Resumo da Auditoria:
    - Total de protocolos processados: {resultado['total_protocolos']}
    - Total de divergências encontradas: {resultado['divergencias_encontradas']}

    Verifique o arquivo auditoria.log para mais detalhes.
    """
    )
