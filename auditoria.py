from database_supabase import registrar_divergencia, listar_guias, listar_dados_excel, listar_fichas_presenca, listar_execucoes
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


def verificar_datas(protocolo: Dict, atendimento: Dict) -> bool:
    """Verifica se as datas do protocolo e atendimento correspondem"""
    try:
        data_protocolo = datetime.strptime(protocolo["dataExec"], "%d/%m/%Y")
        data_execucao = datetime.strptime(atendimento["data_execucao"], "%d/%m/%Y")
        return data_protocolo == data_execucao
    except ValueError as e:
        logging.error(f"Erro ao comparar datas: {e}")
        return False


def verificar_quantidade_atendimentos(
    protocolo: Dict, atendimentos: List[Dict]
) -> bool:
    """Verifica se a quantidade de atendimentos corresponde ao protocolo"""
    try:
        qtd_protocolo = int(protocolo.get("quantidade", 1))
        return len(atendimentos) == qtd_protocolo
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
    Realiza a auditoria cruzando dados entre as tabelas de atendimentos e protocolos,
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

    # Para cada protocolo, verifica se existe correspondência nos atendimentos
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

        # Busca atendimentos correspondentes
        atendimentos = listar_guias(limit=0, paciente_nome=protocolo["nomePaciente"])

        # Filtra atendimentos pelo número da guia
        atendimentos_correspondentes = [
            atend
            for atend in atendimentos["atendimentos"]
            if atend["numero_guia_principal"] == protocolo["idGuia"]
        ]

        # Verifica divergências
        if not atendimentos_correspondentes:
            divergencias_encontradas += 1
            registrar_divergencia(
                numero_guia=protocolo["idGuia"],
                data_execucao=protocolo["dataExec"],
                codigo_ficha="N/A",
                tipo_divergencia="sem_atendimento",
                descricao=f'Protocolo sem atendimento correspondente. Paciente: {protocolo["nomePaciente"]}',
            )
            continue

        # Verifica cada atendimento correspondente
        for atendimento in atendimentos_correspondentes:
            # Verifica assinatura
            if not atendimento["possui_assinatura"]:
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=atendimento["numero_guia_principal"],
                    data_execucao=atendimento["data_execucao"],
                    codigo_ficha=atendimento["codigo_ficha"],
                    tipo_divergencia="sem_assinatura",
                    descricao=f'Atendimento sem assinatura. Paciente: {atendimento["paciente_nome"]}',
                )

            # Verifica código da ficha
            if not atendimento["codigo_ficha"]:
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=atendimento["numero_guia_principal"],
                    data_execucao=atendimento["data_execucao"],
                    codigo_ficha="AUSENTE",
                    tipo_divergencia="sem_codigo_ficha",
                    descricao=f'Atendimento sem código de ficha. Paciente: {atendimento["paciente_nome"]}',
                )

        # Verifica quantidade de atendimentos (mais de um atendimento para o mesmo protocolo)
        if len(atendimentos_correspondentes) > 1:
            divergencias_encontradas += 1
            registrar_divergencia(
                numero_guia=protocolo["idGuia"],
                data_execucao=protocolo["dataExec"],
                codigo_ficha=atendimentos_correspondentes[0]["codigo_ficha"],
                tipo_divergencia="multiplos_atendimentos",
                descricao=f'Protocolo com múltiplos atendimentos ({len(atendimentos_correspondentes)}). Paciente: {protocolo["nomePaciente"]}',
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


def realizar_auditoria_fichas_execucoes(data_inicial: str = None, data_final: str = None):
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
                    data_ficha = datetime.strptime(ficha["data_atendimento"], "%d/%m/%Y")
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
                None
            )

            if not execucao_correspondente:
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=ficha.get("numero_guia", "-"),
                    data_execucao=ficha.get("data_atendimento", ""),
                    codigo_ficha=ficha.get("codigo_ficha", "-"),
                    tipo_divergencia="ficha_sem_execucao",
                    descricao='Ficha de presença sem execução correspondente',
                    paciente_nome=ficha.get("paciente_nome", "Não informado")
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

            if execucao.get("codigo_ficha"):  # Só verifica se tiver código de ficha
                ficha_correspondente = next(
                    (f for f in fichas if f["codigo_ficha"] == execucao["codigo_ficha"]),
                    None
                )

                if not ficha_correspondente:
                    divergencias_encontradas += 1
                    registrar_divergencia(
                        numero_guia=execucao.get("numero_guia", "-"),
                        data_execucao=execucao.get("data_execucao", ""),
                        codigo_ficha=execucao.get("codigo_ficha", "-"),
                        tipo_divergencia="execucao_sem_ficha",
                        descricao='Execução sem ficha de presença correspondente',
                        paciente_nome=execucao.get("paciente_nome", "Não informado")
                    )

        # 3. Verifica fichas sem assinatura
        for ficha in fichas:
            if not ficha.get("possui_assinatura", True):  # True como padrão para evitar falsos positivos
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=ficha.get("numero_guia", "-"),
                    data_execucao=ficha.get("data_atendimento", ""),
                    codigo_ficha=ficha.get("codigo_ficha", "-"),
                    tipo_divergencia="ficha_sem_assinatura",
                    descricao='Ficha de presença sem assinatura do paciente',
                    paciente_nome=ficha.get("paciente_nome", "Não informado")
                )

        # 4. Verifica divergências de data
        for ficha in fichas:
            execucao_correspondente = next(
                (e for e in execucoes if e["codigo_ficha"] == ficha["codigo_ficha"]),
                None
            )

            if execucao_correspondente and ficha["data_atendimento"] != execucao_correspondente["data_execucao"]:
                divergencias_encontradas += 1
                registrar_divergencia(
                    numero_guia=ficha.get("numero_guia", "-"),
                    data_execucao=ficha.get("data_atendimento", ""),
                    codigo_ficha=ficha.get("codigo_ficha", "-"),
                    tipo_divergencia="data_divergente",
                    descricao=f'Data da ficha ({ficha["data_atendimento"]}) diferente da execução ({execucao_correspondente["data_execucao"]})',
                    paciente_nome=ficha.get("paciente_nome", "Não informado")
                )

        logging.info(f"Auditoria concluída. {divergencias_encontradas} divergências encontradas.")
        return {"status": "success", "divergencias_encontradas": divergencias_encontradas}

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
