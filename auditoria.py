from database_supabase import (
    registrar_divergencia,
    listar_guias,
    listar_dados_excel,
    listar_fichas_presenca,
    listar_execucoes,
    registrar_execucao_auditoria,
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
            for atend in execucaos["execucaos"]
            if atend["numero_guia_principal"] == protocolo["idGuia"]
        ]

        # Verifica divergências
        if not execucaos_correspondentes:
            divergencias_encontradas += 1
            registrar_divergencia(
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
                registrar_divergencia(
                    numero_guia=execucao["numero_guia_principal"],
                    data_execucao=execucao["data_execucao"],
                    codigo_ficha=execucao["codigo_ficha"],
                    tipo_divergencia="sem_assinatura",
                    descricao=f'execucao sem assinatura. Paciente: {execucao["paciente_nome"]}',
                )

            # Verifica código da ficha
            if not execucao["codigo_ficha"]:
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=execucao["numero_guia_principal"],
                    data_execucao=execucao["data_execucao"],
                    codigo_ficha="AUSENTE",
                    tipo_divergencia="sem_codigo_ficha",
                    descricao=f'execucao sem código de ficha. Paciente: {execucao["paciente_nome"]}',
                )

        # Verifica quantidade de execucaos (mais de um execucao para o mesmo protocolo)
        if len(execucaos_correspondentes) > 1:
            divergencias_encontradas += 1
            registrar_divergencia(
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

    try:
        # Converte datas para o formato DD/MM/YYYY se necessário
        if data_inicial:
            data_inicial = formatar_data_iso(data_inicial)
        if data_final:
            data_final = formatar_data_iso(data_final)

        # Busca todas as fichas de presença e execuções (limit=0 retorna todos os registros)
        fichas = listar_fichas_presenca(limit=0)
        execucoes = listar_execucoes(limit=0)

        if not isinstance(fichas, list):
            fichas = []
        if not isinstance(execucoes, list):
            execucoes = []

        total_fichas = len(fichas)
        total_execucoes = len(execucoes)
        logging.info(f"Total de fichas a serem auditadas: {total_fichas}")
        logging.info(f"Total de execuções a serem auditadas: {total_execucoes}")

        divergencias_encontradas = 0

        # 1. Verifica fichas sem execução correspondente
        for ficha in fichas:
            # Filtra por data se especificado
            if data_inicial and data_final:
                try:
                    data_ficha = datetime.strptime(ficha["data_execucao"], "%d/%m/%Y")
                    data_ini = datetime.strptime(data_inicial, "%d/%m/%Y")
                    data_fim = datetime.strptime(data_final, "%d/%m/%Y")

                    if not (data_ini <= data_ficha <= data_fim):
                        continue
                except ValueError as e:
                    logging.error(f"Erro ao filtrar por data: {e}")
                    continue

            # Busca execução correspondente
            execucao_correspondente = next(
                (e for e in execucoes if e["codigo_ficha"] == ficha["codigo_ficha"]),
                None,
            )

            if not execucao_correspondente:
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=ficha.get("numero_guia", "-"),
                    data_execucao=ficha.get("data_execucao", ""),
                    codigo_ficha=ficha.get("codigo_ficha", "-"),
                    tipo_divergencia="ficha_sem_execucao",
                    descricao="Ficha de presença sem execução correspondente",
                    paciente_nome=ficha.get("paciente_nome", "Não informado"),
                )

        # 2. Verifica execuções sem ficha correspondente
        for execucao in execucoes:
            # Filtra por data se especificado
            if data_inicial and data_final:
                try:
                    data_exec = datetime.strptime(execucao["data_execucao"], "%d/%m/%Y")
                    data_ini = datetime.strptime(data_inicial, "%d/%m/%Y")
                    data_fim = datetime.strptime(data_final, "%d/%m/%Y")

                    if not (data_ini <= data_exec <= data_fim):
                        continue
                except ValueError as e:
                    logging.error(f"Erro ao filtrar por data: {e}")
                    continue

            if not execucao.get("codigo_ficha"):  # Registra divergência se NÃO tiver código de ficha
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=execucao.get("numero_guia", "-"),
                    data_execucao=execucao.get("data_execucao", ""),
                    codigo_ficha="-",  # Não tem código de ficha
                    tipo_divergencia="execucao_sem_ficha",
                    descricao="Execução sem ficha de presença correspondente",
                    paciente_nome=execucao.get("paciente_nome", "Não informado"),
                )
            else:  # Se tem código de ficha, verifica se existe a ficha
                ficha_correspondente = next(
                    (f for f in fichas if f["codigo_ficha"] == execucao["codigo_ficha"]),
                    None,
                )

                if not ficha_correspondente:
                    divergencias_encontradas += 1
                    registrar_divergencia(
                        numero_guia=execucao.get("numero_guia", "-"),
                        data_execucao=execucao.get("data_execucao", ""),
                        codigo_ficha=execucao.get("codigo_ficha", "-"),
                        tipo_divergencia="execucao_sem_ficha",
                        descricao="Execução sem ficha de presença correspondente",
                        paciente_nome=execucao.get("paciente_nome", "Não informado"),
                    )

        # 3. Verifica fichas sem assinatura
        for ficha in fichas:
            if not ficha.get(
                "possui_assinatura", True
            ):  # True como padrão para evitar falsos positivos
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=ficha.get("numero_guia", "-"),
                    data_execucao=ficha.get("data_execucao", ""),
                    codigo_ficha=ficha.get("codigo_ficha", "-"),
                    tipo_divergencia="ficha_sem_assinatura",
                    descricao="Ficha de presença sem assinatura do paciente",
                    paciente_nome=ficha.get("paciente_nome", "Não informado"),
                )

        # 4. Verifica divergências de data
        for ficha in fichas:
            execucao_correspondente = next(
                (e for e in execucoes if e["codigo_ficha"] == ficha["codigo_ficha"]),
                None,
            )

            if (
                execucao_correspondente
                and ficha["data_execucao"] != execucao_correspondente["data_execucao"]
            ):
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=ficha.get("numero_guia", "-"),
                    data_execucao=ficha.get("data_execucao", ""),
                    codigo_ficha=ficha.get("codigo_ficha", "-"),
                    tipo_divergencia="data_divergente",
                    descricao=f'Data da ficha ({ficha["data_execucao"]}) diferente da execução ({execucao_correspondente["data_execucao"]})',
                    paciente_nome=ficha.get("paciente_nome", "Não informado"),
                )

        # 5. Verifica quantidade de sessões executadas vs fichas
        for ficha in fichas:
            # Agrupa execuções por número da guia
            execucoes_da_guia = [
                e for e in execucoes if e["numero_guia"] == ficha["numero_guia"]
            ]
            qtd_execucoes = len(execucoes_da_guia)

            # Agrupa fichas por número da guia
            fichas_da_guia = [
                f for f in fichas if f["numero_guia"] == ficha["numero_guia"]
            ]
            qtd_fichas = len(fichas_da_guia)

            if qtd_execucoes != qtd_fichas:
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=ficha.get("numero_guia", "-"),
                    data_execucao=ficha.get("data_execucao", ""),
                    codigo_ficha=ficha.get("codigo_ficha", "-"),
                    tipo_divergencia="quantidade_sessoes_divergente",
                    descricao=f"Quantidade de sessões executadas ({qtd_execucoes}) diferente das fichas de presença ({qtd_fichas})",
                    paciente_nome=ficha.get("paciente_nome", "Não informado"),
                )

        # Contabiliza divergências por tipo
        divergencias_por_tipo = {
            "ficha_sem_assinatura": 0,
            "ficha_sem_execucao": 0,
            "execucao_sem_ficha": 0,
            "quantidade_sessoes_divergente": 0,
            "data_divergente": 0,
            "sem_assinatura": 0,
            "sem_ficha": 0,
            "pendente": 0,
            "resolvida": 0
        }

        # Contabiliza fichas sem assinatura
        for ficha in fichas:
            if not ficha.get("possui_assinatura", True):
                divergencias_por_tipo["ficha_sem_assinatura"] += 1
                divergencias_por_tipo["sem_assinatura"] += 1
                divergencias_por_tipo["pendente"] += 1

        # Contabiliza fichas sem execução
        for ficha in fichas:
            execucao_correspondente = next(
                (e for e in execucoes if e["codigo_ficha"] == ficha["codigo_ficha"]),
                None,
            )
            if not execucao_correspondente:
                divergencias_por_tipo["ficha_sem_execucao"] += 1
                divergencias_por_tipo["pendente"] += 1

        # Contabiliza execuções sem ficha
        for execucao in execucoes:
            if execucao.get("codigo_ficha"):
                ficha_correspondente = next(
                    (f for f in fichas if f["codigo_ficha"] == execucao["codigo_ficha"]),
                    None,
                )
                if not ficha_correspondente:
                    divergencias_por_tipo["execucao_sem_ficha"] += 1
                    divergencias_por_tipo["sem_ficha"] += 1
                    divergencias_por_tipo["pendente"] += 1

        # Contabiliza divergências de data
        for ficha in fichas:
            execucao_correspondente = next(
                (e for e in execucoes if e["codigo_ficha"] == ficha["codigo_ficha"]),
                None,
            )
            if execucao_correspondente and ficha["data_execucao"] != execucao_correspondente["data_execucao"]:
                divergencias_por_tipo["data_divergente"] += 1
                divergencias_por_tipo["pendente"] += 1

        # Contabiliza divergências de quantidade (agora usando um set para evitar duplicatas)
        guias_processadas = set()
        for ficha in fichas:
            numero_guia = ficha["numero_guia"]
            if numero_guia not in guias_processadas:
                guias_processadas.add(numero_guia)
                
                # Agrupa execuções e fichas por número da guia
                execucoes_da_guia = [e for e in execucoes if e["numero_guia"] == numero_guia]
                fichas_da_guia = [f for f in fichas if f["numero_guia"] == numero_guia]
                
                if len(execucoes_da_guia) != len(fichas_da_guia):
                    divergencias_por_tipo["quantidade_sessoes_divergente"] += 1
                    divergencias_por_tipo["pendente"] += 1

        # Registra metadados da execução da auditoria
        registrar_execucao_auditoria(
            data_inicial=data_inicial,
            data_final=data_final,
            total_protocolos=total_fichas + total_execucoes,
            total_divergencias=sum(divergencias_por_tipo[tipo] for tipo in ["ficha_sem_assinatura", "ficha_sem_execucao", "execucao_sem_ficha", "quantidade_sessoes_divergente", "data_divergente"]),
            divergencias_por_tipo=divergencias_por_tipo,
        )

        logging.info(
            f"Auditoria concluída. {divergencias_encontradas} divergências encontradas."
        )
        return {
            "status": "success",
            "divergencias_encontradas": divergencias_encontradas,
        }

    except Exception as e:
        logging.error(f"Erro durante a auditoria: {e}")
        traceback.print_exc()
        raise Exception(f"Erro durante a auditoria: {str(e)}")


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
