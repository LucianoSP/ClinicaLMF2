from database_supabase import (
    registrar_divergencia,
    listar_guias,
    listar_dados_excel,
    listar_fichas_presenca,
    listar_execucoes,
    registrar_execucao_auditoria,
    limpar_divergencias_db
)
from datetime import datetime
from typing import Dict, List
import logging
import traceback

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("auditoria.log"), logging.StreamHandler()],
)


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


def realizar_auditoria(data_inicial: str = None, data_final: str = None):
    """
    Realiza a auditoria cruzando dados entre as tabelas de execucaos e protocolos,
    registrando divergências encontradas.

    Args:
        data_inicial: Data inicial para filtrar (formato: DD/MM/YYYY)
        data_final: Data final para filtrar (formato: DD/MM/YYYY)
    """
    logging.info("Iniciando processo de auditoria...")

    # Busca todos os registros do Excel (protocolos)
    dados_excel = listar_dados_excel(limit=0)
    protocolos = dados_excel["registros"]

    total_protocolos = len(protocolos)
    protocolos_processados = 0
    divergencias_encontradas = 0

    logging.info(f"Total de protocolos a serem auditados: {total_protocolos}")

    # Para cada protocolo, verifica se existe correspondência nos execucaos
    for protocolo in protocolos:
        protocolos_processados += 1

        if protocolos_processados % 100 == 0:
            logging.info(
                f"Progresso: {protocolos_processados}/{total_protocolos} protocolos processados"
            )

        # Filtra por data se especificado
        if data_inicial and data_final:
            try:
                data_protocolo = datetime.strptime(protocolo["dataExec"], "%d/%m/%Y")
                data_ini = datetime.strptime(data_inicial, "%d/%m/%Y")
                data_fim = datetime.strptime(data_final, "%d/%m/%Y")

                if not (data_ini <= data_protocolo <= data_fim):
                    continue
            except ValueError as e:
                logging.error(f"Erro ao filtrar por data: {e}")
                continue

        # Busca execucaos correspondentes
        execucaos = listar_guias(limit=0, paciente_nome=protocolo["nomePaciente"])

        # Filtra execucaos pelo número da guia
        execucaos_correspondentes = [
            atend
            for atend in execucoes["execucaos"]
            if atend["numero_guia_principal"] == protocolo["idGuia"]
        ]

        # Verifica divergências
        if not execucaos_correspondentes:
            divergencias_encontradas += 1
            registrar_divergencia_detalhada(
                numero_guia=protocolo["idGuia"],
                data_execucao=protocolo["dataExec"],
                codigo_ficha="N/A",
                tipo_divergencia="sem_execucao",
                descricao=f'Protocolo sem execucao correspondente. Paciente: {protocolo["nomePaciente"]}',
            )
            continue

        # Verifica cada execucao correspondente
        for execucao in execucaos_correspondentes:
            # Verifica assinatura
            if not execucao["possui_assinatura"]:
                divergencias_encontradas += 1
                registrar_divergencia_detalhada(
                    numero_guia=execucao["numero_guia_principal"],
                    data_execucao=execucao["data_execucao"],
                    codigo_ficha=execucao["codigo_ficha"],
                    tipo_divergencia="sem_assinatura",
                    descricao=f'execucao sem assinatura. Paciente: {execucao["paciente_nome"]}',
                )

            # Verifica código da ficha
            if not execucao["codigo_ficha"]:
                divergencias_encontradas += 1
                registrar_divergencia_detalhada(
                    numero_guia=execucao["numero_guia_principal"],
                    data_execucao=execucao["data_execucao"],
                    codigo_ficha="AUSENTE",
                    tipo_divergencia="sem_codigo_ficha",
                    descricao=f'execucao sem código de ficha. Paciente: {execucao["paciente_nome"]}',
                )

        # Verifica quantidade de execucaos (mais de um execucao para o mesmo protocolo)
        if len(execucaos_correspondentes) > 1:
            divergencias_encontradas += 1
            registrar_divergencia_detalhada(
                numero_guia=protocolo["idGuia"],
                data_execucao=protocolo["dataExec"],
                codigo_ficha=execucaos_correspondentes[0]["codigo_ficha"],
                tipo_divergencia="multiplos_execucaos",
                descricao=f'Protocolo com múltiplos execucaos ({len(execucaos_correspondentes)}). Paciente: {protocolo["nomePaciente"]}',
            )

    logging.info(
        f"""
    Auditoria concluída!
    Total de protocolos processados: {protocolos_processados}
    Total de divergências encontradas: {divergencias_encontradas}
    """
    )

    return {
        "total_protocolos": protocolos_processados,
        "divergencias_encontradas": divergencias_encontradas,
    }


def registrar_divergencia_detalhada(
    numero_guia: str,
    data_execucao: str = None,
    data_atendimento: str = None,
    codigo_ficha: str = None,
    tipo_divergencia: str = None,
    descricao: str = None,
    paciente_nome: str = "Não informado",
    carteirinha: str = None,
) -> None:
    """Registra uma divergência com prioridade e informações detalhadas"""
    prioridade = (
        "ALTA"
        if tipo_divergencia
        in [
            "execucao_sem_ficha",
            "ficha_sem_execucao",
            "quantidade_execucoes_divergente",
        ]
        else "MEDIA"
    )

    divergencia = {
        "numero_guia": numero_guia,
        "data_execucao": data_execucao,
        "data_atendimento": data_atendimento,
        "codigo_ficha": codigo_ficha,
        "tipo_divergencia": tipo_divergencia,
        "prioridade": prioridade,
        "descricao": descricao,
        "paciente_nome": paciente_nome,
        "carteirinha": carteirinha,
        "detalhes": {},
    }

    logging.info(f"Nova divergência identificada: {divergencia}")
    registrar_divergencia(**divergencia)


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
                    numero_guia=ficha["numero_guia"],
                    data_atendimento=ficha["data_atendimento"],
                    codigo_ficha=codigo_ficha,
                    tipo_divergencia="ficha_sem_execucao",
                    descricao="Ficha de presença sem execução correspondente",
                    paciente_nome=ficha["paciente_nome"],
                    carteirinha=ficha["paciente_carteirinha"]
                )
            else:
                # Para cada execução desta ficha, verifica se a data bate
                for execucao in execucoes_da_ficha:
                    if execucao["data_execucao"] != ficha["data_atendimento"]:
                        divergencias_encontradas += 1
                        registrar_divergencia_detalhada(
                            numero_guia=execucao["numero_guia"],
                            data_execucao=execucao["data_execucao"],
                            data_atendimento=ficha["data_atendimento"],
                            codigo_ficha=codigo_ficha,
                            tipo_divergencia="data_divergente",
                            descricao=f'Data da ficha ({ficha["data_atendimento"]}) diferente da execução ({execucao["data_execucao"]})',
                            paciente_nome=execucao["paciente_nome"],
                            carteirinha=execucao["paciente_carteirinha"]
                        )
        
        # 2. Para cada execução, verifica se existe a ficha correspondente
        for execucao in execucoes:
            if not execucao["codigo_ficha"] or execucao["codigo_ficha"] not in mapa_fichas:
                divergencias_encontradas += 1
                registrar_divergencia_detalhada(
                    numero_guia=execucao["numero_guia"],
                    data_execucao=execucao["data_execucao"],
                    codigo_ficha=execucao.get("codigo_ficha"),
                    tipo_divergencia="execucao_sem_ficha",
                    descricao="Execução sem ficha de presença correspondente",
                    paciente_nome=execucao["paciente_nome"],
                    carteirinha=execucao["paciente_carteirinha"]
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
                "total_execucoes_sem_ficha": len([e for e in execucoes if not e.get("codigo_ficha")]),
                "data_execucao": end_time.strftime("%Y-%m-%dT%H:%M:%S.%f%z"),
                "tempo_execucao": tempo_execucao
            }
        }

    except Exception as e:
        logging.error(f"Erro durante auditoria: {str(e)}")
        logging.error(traceback.format_exc())
        raise e


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
