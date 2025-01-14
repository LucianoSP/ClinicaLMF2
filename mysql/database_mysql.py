import mysql.connector
from mysql.connector import Error
from typing import Dict, List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv
import traceback  # Added for detailed error tracking

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    "host": "64.23.148.2",
    "port": 3306,
    "user": "luciano_pacheco",
    "password": "0&)9qB37W1uK",
    "database": "abalarissa_db",
}

def get_mysql_connection():
    """Create a connection to MySQL database"""
    try:
        print("Attempting to connect to MySQL database...")
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("Successfully connected to MySQL database")
            return connection
        else:
            print("Failed to connect to MySQL database")
            return None
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return None

def fetch_schedule_data(
    limit: int = 100,
    offset: int = 0,
    paciente_nome: Optional[str] = None,
    data_inicial: Optional[str] = None,
    data_final: Optional[str] = None
) -> Dict:
    """
    Fetch data from ps_schedule table with pagination and filters
    """
    try:
        print(f"\nFetching schedule data with parameters:")
        print(f"limit: {limit}, offset: {offset}")
        print(f"paciente_nome: {paciente_nome}")
        print(f"data_inicial: {data_inicial}")
        print(f"data_final: {data_final}")

        connection = get_mysql_connection()
        if not connection:
            print("No database connection available")
            return {"registros": [], "total": 0, "total_pages": 1}

        cursor = connection.cursor(dictionary=True)

        # Base query
        query = """
            SELECT 
                ps.schedule_id,
                ps.schedule_date_start,
                ps.schedule_date_end,
                ps.schedule_pacient_id,
                ps.schedule_pagamento_id,
                ps.schedule_room_id,
                ps.schedule_qtd_sessions,
                ps.schedule_status,
                ps.schedule_room_rent_value,
                ps.schedule_fixed,
                ps.schedule_especialidade_id,
                ps.schedule_local_id,
                ps.schedule_saldo_sessoes,
                ps.schedule_elegibilidade,
                ps.schedule_falta_do_profissional,
                ps.schedule_parent_id,
                ps.schedule_registration_date,
                ps.schedule_lastupdate,
                ps.parent_id,
                ps.schedule_codigo_faturamento,
                c.client_nome as paciente_nome,
                c.client_numero_carteirinha as carteirinha
            FROM ps_schedule ps
            LEFT JOIN ps_clients c ON ps.schedule_pacient_id = c.client_id
            WHERE 1=1
        """
        params = []

        # Add filters
        if paciente_nome:
            query += " AND LOWER(c.client_nome) LIKE LOWER(%s)"
            params.append(f"%{paciente_nome}%")

        if data_inicial:
            query += " AND DATE(ps.schedule_date_start) >= STR_TO_DATE(%s, '%d/%m/%Y')"
            params.append(data_inicial)

        if data_final:
            query += " AND DATE(ps.schedule_date_start) <= STR_TO_DATE(%s, '%d/%m/%Y')"
            params.append(data_final)

        # Count total records
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        print(f"\nExecuting count query: {count_query}")
        print(f"With parameters: {params}")
        
        cursor.execute(count_query, params)
        total = cursor.fetchone()["total"]
        print(f"Total records found: {total}")

        # Add pagination
        query += " ORDER BY ps.schedule_date_start DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        # Execute main query
        print(f"\nExecuting main query: {query}")
        print(f"With parameters: {params}")
        
        cursor.execute(query, params)
        registros = cursor.fetchall()
        print(f"Records fetched: {len(registros)}")

        # Format dates and decimals
        for registro in registros:
            for key, value in registro.items():
                if isinstance(value, datetime):
                    registro[key] = value.strftime("%d/%m/%Y %H:%M:%S")
                elif isinstance(value, float):
                    registro[key] = float(value)

        cursor.close()
        connection.close()
        print("Database connection closed")

        return {
            "registros": registros,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1
        }

    except Error as e:
        print(f"MySQL Error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return {"registros": [], "total": 0, "total_pages": 1}
    except Exception as e:
        print(f"General Error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return {"registros": [], "total": 0, "total_pages": 1}
