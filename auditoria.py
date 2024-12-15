from database_supabase import registrar_divergencia, listar_guias, listar_dados_excel
from datetime import datetime
from typing import Dict, List
import logging

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
