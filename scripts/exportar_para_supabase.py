import sqlite3
import pandas as pd
import os
from datetime import datetime
import logging

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("migracao_supabase.log"), logging.StreamHandler()],
)

# Configurações
DATABASE_FILE = "clinica_larissa.db"
EXPORT_DIR = "dados_supabase"


def criar_diretorio_export():
    """Cria o diretório de exportação se não existir"""
    if not os.path.exists(EXPORT_DIR):
        os.makedirs(EXPORT_DIR)
        logging.info(f"Diretório {EXPORT_DIR} criado")


def converter_data(data_str):
    """Converte string de data para formato do Supabase"""
    try:
        if pd.isna(data_str):
            return None
        # Tenta converter do formato DD/MM/YYYY
        data = datetime.strptime(str(data_str).strip(), "%d/%m/%Y")
        return data.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError as e:
        logging.warning(f"Erro ao converter data '{data_str}': {e}")
        return None


def exportar_protocolos_excel(conn):
    """Exporta dados da tabela protocolos_excel"""
    logging.info("Exportando protocolos_excel...")

    query = """
    SELECT 
        idGuia as guia_id,
        nomePaciente as paciente_nome,
        dataExec as data_execucao,
        carteirinha as paciente_carteirinha,
        idPaciente as paciente_id,
        created_at
    FROM protocolos_excel
    """

    df = pd.read_sql_query(query, conn)

    # Converter datas
    df["data_execucao"] = df["data_execucao"].apply(converter_data)

    # Garantir que não há valores nulos em campos obrigatórios
    df = df.dropna(
        subset=[
            "guia_id",
            "paciente_nome",
            "data_execucao",
            "paciente_carteirinha",
            "paciente_id",
        ]
    )

    # Exportar para CSV
    csv_path = os.path.join(EXPORT_DIR, "protocolos_excel.csv")
    df.to_csv(csv_path, index=False)
    logging.info(f"Exportados {len(df)} registros de protocolos_excel para {csv_path}")

    return len(df)


def exportar_atendimentos(conn):
    """Exporta dados da tabela atendimentos"""
    logging.info("Exportando atendimentos...")

    query = """
    SELECT 
        data_execucao as data_execucao,
        paciente_carteirinhaas paciente_carteirinha,
        paciente_nomeas paciente_nome,
        guia_idas guia_id,
        codigo_ficha,
        possui_assinatura
    FROM atendimentos
    """

    df = pd.read_sql_query(query, conn)

    # Converter datas
    df["data_execucao"] = df["data_execucao"].apply(converter_data)

    # Converter possui_assinatura para boolean
    df["possui_assinatura"] = df["possui_assinatura"].astype(bool)

    # Garantir que não há valores nulos em campos obrigatórios
    df = df.dropna(
        subset=["data_execucao", "paciente_carteirinha", "paciente_nome", "guia_id"]
    )

    # Exportar para CSV
    csv_path = os.path.join(EXPORT_DIR, "atendimentos.csv")
    df.to_csv(csv_path, index=False)
    logging.info(f"Exportados {len(df)} registros de atendimentos para {csv_path}")

    return len(df)


def exportar_divergencias(conn):
    """Exporta dados da tabela divergencias"""
    logging.info("Exportando divergencias...")

    query = """
    SELECT 
        numero_guia as guia_id,
        data_exec as data_execucao,
        codigo_ficha,
        descricao_divergencia,
        status,
        data_registro as created_at
    FROM divergencias
    """

    df = pd.read_sql_query(query, conn)

    # Converter datas
    df["data_execucao"] = df["data_execucao"].apply(converter_data)
    df["created_at"] = pd.to_datetime(df["created_at"]).dt.strftime("%Y-%m-%d %H:%M:%S")

    # Garantir que não há valores nulos em campos obrigatórios
    df = df.dropna(
        subset=["guia_id", "data_execucao", "codigo_ficha", "descricao_divergencia"]
    )

    # Padronizar status
    df["status"] = df["status"].fillna("Pendente")

    # Exportar para CSV
    csv_path = os.path.join(EXPORT_DIR, "divergencias.csv")
    df.to_csv(csv_path, index=False)
    logging.info(f"Exportados {len(df)} registros de divergencias para {csv_path}")

    return len(df)


def main():
    """Função principal de exportação"""
    try:
        # Criar diretório de exportação
        criar_diretorio_export()

        # Conectar ao banco SQLite
        logging.info(f"Conectando ao banco de dados {DATABASE_FILE}")
        conn = sqlite3.connect(DATABASE_FILE)

        # Exportar cada tabela
        total_protocolos = exportar_protocolos_excel(conn)
        total_atendimentos = exportar_atendimentos(conn)
        total_divergencias = exportar_divergencias(conn)

        # Fechar conexão
        conn.close()

        # Relatório final
        logging.info("\nRelatório de Exportação:")
        logging.info(f"Protocolos Excel: {total_protocolos} registros")
        logging.info(f"Atendimentos: {total_atendimentos} registros")
        logging.info(f"Divergências: {total_divergencias} registros")
        logging.info(f"\nArquivos CSV gerados no diretório: {EXPORT_DIR}")

    except Exception as e:
        logging.error(f"Erro durante a exportação: {e}")
        raise


if __name__ == "__main__":
    main()
