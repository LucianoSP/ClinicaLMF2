import os
import mysql.connector
from dotenv import load_dotenv
from supabase import create_client, Client
import time
from datetime import datetime
from typing import List, Dict, Any
from decimal import Decimal

# Configurações
BATCH_SIZE = 100  # Número de registros a serem importados por vez
TOTAL_LIMIT = 500  # Limite total de registros a serem importados (None para todos)

# Configurações MySQL
MYSQL_CONFIG = {
    "host": "64.23.148.2",
    "user": "luciano_pacheco",
    "password": "0&)9qB37W1uK",
    "database": "abalarissa_db",
}


def connect_mysql():
    """Estabelece conexão com o MySQL"""
    try:
        return mysql.connector.connect(**MYSQL_CONFIG)
    except mysql.connector.Error as err:
        print(f"Erro ao conectar ao MySQL: {err}")
        raise


def connect_supabase() -> Client:
    """Estabelece conexão com o Supabase"""
    try:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError(
                "SUPABASE_URL e SUPABASE_KEY devem estar definidos no ambiente"
            )
        return create_client(url, key)
    except Exception as e:
        print(f"Erro ao conectar ao Supabase: {e}")
        raise


def fetch_mysql_data(mysql_conn, offset: int = 0) -> List[Dict[str, Any]]:
    """Busca dados do MySQL com paginação"""
    cursor = mysql_conn.cursor(dictionary=True)

    query = """
    SELECT 
        schedule_id as mysql_id,
        schedule_date_start as data_inicio,
        schedule_date_end as data_fim,
        schedule_pacient_id as mysql_paciente_id,
        schedule_pagamento_id as pagamento_id,
        schedule_room_id as sala_id,
        schedule_qtd_sessions as qtd_sessoes,
        schedule_status as status,
        schedule_room_rent_value as valor_sala,
        schedule_fixed as fixo,
        schedule_especialidade_id as especialidade_id,
        schedule_local_id as local_id,
        schedule_saldo_sessoes as saldo_sessoes,
        schedule_elegibilidade as elegibilidade,
        schedule_falta_do_profissional as falta_profissional,
        schedule_parent_id as agendamento_pai_id,
        parent_id,
        schedule_codigo_faturamento as codigo_faturamento,
        schedule_registration_date as data_registro,
        schedule_lastupdate as ultima_atualizacao
    FROM ps_schedule
    ORDER BY schedule_id
    LIMIT %s OFFSET %s
    """

    cursor.execute(query, (BATCH_SIZE, offset))
    data = cursor.fetchall()
    cursor.close()
    return data


def get_paciente_id_mapping(supabase: Client) -> Dict[int, str]:
    """Busca o mapeamento entre IDs do MySQL e UUIDs do Supabase"""
    try:
        # Busca todos os pacientes que têm o mysql_id definido
        response = supabase.table('pacientes').select('id, mysql_id').execute()
        
        # Cria um dicionário de mysql_id -> uuid
        mapping = {
            record['mysql_id']: record['id'] 
            for record in response.data 
            if 'mysql_id' in record
        }
        
        return mapping
    except Exception as e:
        print(f"Erro ao buscar mapeamento de pacientes: {e}")
        return {}


def decimal_to_float(obj):
    """Converte objetos Decimal para float"""
    if isinstance(obj, Decimal):
        return float(obj)
    return obj


def convert_to_boolean(value):
    """Converte valores em português para boolean"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['sim', 'yes', 'true', '1']
    return bool(value)


def transform_data(records: List[Dict[str, Any]], paciente_mapping: Dict[int, str]) -> List[Dict[str, Any]]:
    """Transforma os dados do MySQL para o formato do Supabase"""
    transformed = []
    
    for record in records:
        # Cria uma cópia do registro para não modificar o original
        transformed_record = {}
        
        # Converte todos os valores do registro
        for key, value in record.items():
            # Converte o ID do paciente se existir no mapeamento
            if key == 'mysql_paciente_id' and value in paciente_mapping:
                transformed_record['paciente_id'] = paciente_mapping[value]
                transformed_record['mysql_paciente_id'] = value
            # Converte campos booleanos
            elif key in ['fixo', 'falta_profissional']:
                transformed_record[key] = convert_to_boolean(value)
            # Converte Decimal para float
            elif isinstance(value, Decimal):
                transformed_record[key] = float(value)
            # Converte datetime para ISO format
            elif isinstance(value, datetime):
                transformed_record[key] = value.isoformat()
            # Mantém outros valores como estão
            else:
                transformed_record[key] = value
        
        transformed.append(transformed_record)
    
    return transformed


def import_data():
    """Função principal de importação"""
    mysql_conn = connect_mysql()
    supabase = connect_supabase()
    
    try:
        # Busca o mapeamento de IDs dos pacientes
        print("\nBuscando mapeamento de IDs dos pacientes...")
        paciente_mapping = get_paciente_id_mapping(supabase)
        
        if not paciente_mapping:
            print("Aviso: Nenhum mapeamento de pacientes encontrado!")
        
        offset = 0
        total_imported = 0
        
        while True:
            # Verifica se atingiu o limite total
            if TOTAL_LIMIT and total_imported >= TOTAL_LIMIT:
                print(f"\nLimite total de {TOTAL_LIMIT} registros atingido.")
                break
            
            print(f"\nBuscando registros do MySQL (offset: {offset})...")
            records = fetch_mysql_data(mysql_conn, offset)
            
            if not records:
                print("\nNenhum registro adicional encontrado.")
                break
            
            # Transforma os dados
            transformed_records = transform_data(records, paciente_mapping)
            
            # Importa para o Supabase
            print(f"Importando {len(transformed_records)} registros para o Supabase...")
            result = supabase.table("agendamentos").insert(transformed_records).execute()
            
            total_imported += len(transformed_records)
            print(f"Total importado até agora: {total_imported}")
            
            # Incrementa o offset para a próxima iteração
            offset += BATCH_SIZE
            
            # Pequena pausa para não sobrecarregar as APIs
            time.sleep(1)
            
    except Exception as e:
        print(f"Erro durante a importação: {e}")
        raise
    finally:
        mysql_conn.close()
        print(f"\nImportação finalizada. Total de registros importados: {total_imported}")


if __name__ == "__main__":
    load_dotenv()
    import_data()
