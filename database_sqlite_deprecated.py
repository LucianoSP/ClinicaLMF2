import sqlite3
from datetime import datetime
import os
import re
from typing import Dict, List
from math import ceil

# Definir o caminho do banco de dados
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

DATABASE_FILE = os.path.join(DATA_DIR, "clinica_larissa.db")


def init_db():
    """Inicializa o banco de dados com a tabela necessária"""
    try:
        # Garantir que o diretório data exista
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
            print(f"Diretório do banco de dados criado: {DATA_DIR}")

        # Tentar conectar ao banco de dados
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Verifica se a tabela existe
        cursor.execute(
            """
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='execucaos'
        """
        )
        table_exists = cursor.fetchone() is not None

        if not table_exists:
            # Tabela única para os execucaos
            cursor.execute(
                """
            CREATE TABLE IF NOT EXISTS execucaos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_execucao TEXT NOT NULL,
                paciente_carteirinha TEXT NOT NULL,
                paciente_nome TEXT NOT NULL,
                guia_id TEXT NOT NULL,
                codigo_ficha TEXT,
                possui_assinatura BOOLEAN NOT NULL DEFAULT 1
            )
            """
            )
            print("Tabela 'execucaos' criada com sucesso!")
        else:
            # Se a tabela já existe, renomear a coluna codigo_guia para codigo_ficha
            try:
                cursor.execute(
                    """
                ALTER TABLE execucaos RENAME COLUMN codigo_guia TO codigo_ficha
                """
                )
                print("Coluna 'codigo_guia' renomeada para 'codigo_ficha' com sucesso!")
            except sqlite3.OperationalError as e:
                pass  # Ignora erro se a coluna já foi renomeada

        # Criar tabela de divergências
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS divergencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guia_id TEXT NOT NULL,
            data_execucao TEXT NOT NULL,
            codigo_ficha TEXT NOT NULL,
            descricao_divergencia TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        )
        print("Tabela 'divergencias' verificada/criada com sucesso!")

        # Criar tabela para dados do Excel
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS protocolos_excel (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guia_id TEXT NOT NULL,
                paciente_nome TEXT NOT NULL,
                data_execucao TEXT NOT NULL,
                paciente_carteirinha TEXT NOT NULL,
                paciente_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )
        print("Tabela 'protocolos_excel' verificada/criada com sucesso!")

        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Erro no SQLite ao inicializar o banco de dados: {e}")
        return False
    except Exception as e:
        print(f"Erro ao inicializar o banco de dados: {e}")
        return False


def formatar_data(data):
    """Formata uma data para o padrão DD/MM/YYYY"""
    if isinstance(data, str):
        # Se já estiver no formato DD/MM/YYYY, retorna como está
        if re.match(r"^\d{2}/\d{2}/\d{4}$", data):
            return data

        # Tenta converter de YYYY-MM-DD para DD/MM/YYYY
        try:
            if re.match(r"^\d{4}-\d{2}-\d{2}$", data):
                return datetime.strptime(data, "%Y-%m-%d").strftime("%d/%m/%Y")
        except ValueError:
            pass

        # Tenta outros formatos comuns
        formatos = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"]
        for formato in formatos:
            try:
                return datetime.strptime(data, formato).strftime("%d/%m/%Y")
            except ValueError:
                continue

    elif isinstance(data, datetime):
        return data.strftime("%d/%m/%Y")

    raise ValueError(f"Formato de data inválido: {data}")


def validar_formato_data(data_str: str) -> bool:
    """Valida se a data está no formato DD/MM/YYYY"""
    return bool(re.match(r"^\d{2}/\d{2}/\d{4}$", data_str))


def salvar_guia(info: Dict):
    """
    Salva as informações do execucao no banco de dados
    Retorna o ID do registro
    """
    print(f"\nTentando salvar execucao: {info}")

    # Garantir que a data está no formato correto antes de salvar
    try:
        info["data_execucao"] = formatar_data(info["data_execucao"])
        print(f"Data formatada: {info['data_execucao']}")
    except Exception as e:
        print(f"Erro ao formatar data: {e}")
        raise e

    # Validar formato da data
    if not validar_formato_data(info["data_execucao"]):
        raise ValueError(
            f"Data em formato inválido: {info['data_execucao']}. Use o formato DD/MM/YYYY"
        )

    # Renomear codigo_guia para codigo_ficha se necessário
    if "codigo_guia" in info and "codigo_ficha" not in info:
        info["codigo_ficha"] = info.pop("codigo_guia")

    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO execucaos (
                data_execucao,
                paciente_carteirinha,
                paciente_nome,
                guia_id,
                codigo_ficha,
                possui_assinatura
            ) VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                info["data_execucao"],
                info["paciente_carteirinha"],
                info["paciente_nome"],
                info["guia_id"],
                info["codigo_ficha"],
                info.get("possui_assinatura", True),
            ),
        )

        last_id = cursor.lastrowid
        conn.commit()
        print(f"execucao salvo com ID: {last_id}")
        return last_id
    except Exception as e:
        print(f"Erro ao salvar guia: {e}")
        print(f"Dados: {info}")
        raise e
    finally:
        conn.close()


def salvar_dados_excel(registros):
    """Salva os dados do Excel no banco de dados"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        for registro in registros:
            try:
                cursor.execute(
                    """
                    INSERT INTO protocolos_excel (
                        guia_id,
                        paciente_nome,
                        data_execucao,
                        paciente_carteirinha,
                        paciente_id,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
                """,
                    (
                        str(registro["guia_id"]),
                        str(registro["paciente_nome"]),
                        registro["data_execucao"],  # Já formatada como DD/MM/YYYY
                        str(registro["paciente_carteirinha"]),
                        str(registro["paciente_id"]),
                    ),
                )
            except sqlite3.Error as e:
                print(f"Erro ao salvar registro {registro}: {e}")
                continue

        conn.commit()
        conn.close()
        return True

    except sqlite3.Error as e:
        print(f"Erro SQLite ao salvar dados do Excel: {e}")
        return False
    except Exception as e:
        print(f"Erro ao salvar dados do Excel: {e}")
        return False


def listar_guias(limit: int = 100, offset: int = 0, paciente_nome: str = None):
    """Retorna todos os execucaos como uma lista única com suporte a paginação e filtro"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Base query para buscar registros
        query = """
            SELECT 
                id,
                data_execucao,
                paciente_carteirinha,
                paciente_nome,
                guia_id,
                codigo_ficha,
                possui_assinatura
            FROM execucaos
        """
        params = []

        # Adiciona filtro por nome se fornecido e não vazio
        if paciente_nome and isinstance(paciente_nome, str):
            paciente_nome = paciente_nome.strip()
            if len(paciente_nome) >= 2:
                # Dividir o termo de busca em palavras
                palavras = paciente_nome.upper().split()
                conditions = []

                # Criar uma condição para cada palavra
                for palavra in palavras:
                    conditions.append("UPPER(paciente_nome) LIKE ?")
                    params.append(f"%{palavra}%")

                # Combinar todas as condições com AND
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)

        # Adiciona ordenação e paginação
        query += " ORDER BY data_execucao DESC"

        if limit is not None and limit > 0:  # Só adiciona LIMIT se for maior que zero
            query += " LIMIT ? OFFSET ?"
            params.extend([limit, offset])

        # Executar a query
        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Processar resultados
        execucaos = []
        for row in rows:
            execucao = {
                "id": row[0],
                "data_execucao": row[1],
                "paciente_carteirinha": row[2],
                "paciente_nome": row[3],
                "guia_id": row[4],
                "codigo_ficha": row[5],
                "possui_assinatura": bool(row[6]),
            }
            execucaos.append(execucao)

        conn.close()
        return execucaos

    except Exception as e:
        return []


def buscar_guia(guia_id: str):
    """Busca execucaos específicos pelo número da guia"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT 
            id,
            data_execucao,
            paciente_carteirinha,
            paciente_nome,
            guia_id,
            codigo_ficha,
            possui_assinatura
        FROM execucaos
        WHERE guia_id = ?
    """,
        (guia_id,),
    )

    rows = cursor.fetchall()
    execucaos = []

    for row in rows:
        execucaos.append(
            {
                "id": row[0],
                "data_execucao": row[1],
                "paciente_carteirinha": row[2],
                "paciente_nome": row[3],
                "guia_id": row[4],
                "codigo_ficha": row[5],
                "possui_assinatura": bool(row[6]),
            }
        )

    conn.close()
    return execucaos


def limpar_banco():
    """Limpa a tabela do banco de dados"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM execucaos")
    conn.commit()
    conn.close()


def limpar_protocolos_excel():
    """Limpa a tabela de protocolos do Excel"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM protocolos_excel")
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Erro ao limpar protocolos do Excel: {e}")
        return False


def listar_dados_excel(limit: int = 100, offset: int = 0, paciente_nome: str = None):
    """Retorna os dados importados do Excel com suporte a paginação e filtro"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Base da query
        query = """
            SELECT 
                id,
                guia_id,
                paciente_nome,
                data_execucao,
                paciente_carteirinha,
                paciente_id,
                created_at
            FROM protocolos_excel
        """
        params = []

        # Adicionar filtro se paciente_nome for fornecido
        if paciente_nome:
            query += " WHERE LOWER(paciente_nome) LIKE LOWER(?)"
            params.append(f"%{paciente_nome}%")

        # Adicionar ordenação e paginação
        query += " ORDER BY created_at DESC"
        if limit > 0:  # Só adiciona LIMIT se for maior que zero
            query += " LIMIT ? OFFSET ?"
            params.extend([limit, offset])

        # Executar query principal
        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Contar total de registros
        count_query = "SELECT COUNT(*) FROM protocolos_excel"
        if paciente_nome:
            count_query += " WHERE LOWER(paciente_nome) LIKE LOWER(?)"
            cursor.execute(count_query, [f"%{paciente_nome}%"])
        else:
            cursor.execute(count_query)

        total = cursor.fetchone()[0]

        registros = []
        for row in rows:
            registros.append(
                {
                    "id": row[0],
                    "idGuia": row[1],
                    "nomePaciente": row[2],
                    "dataExec": row[3],
                    "carteirinha": row[4],
                    "idPaciente": row[5],
                    "created_at": row[6],
                }
            )

        conn.close()
        return {
            "registros": registros,
            "total": total,
            "total_pages": ceil(total / limit) if limit > 0 else 1,
        }

    except sqlite3.Error as e:
        print(f"Erro SQLite ao listar dados do Excel: {e}")
        return {"registros": [], "total": 0, "total_pages": 1}
    except Exception as e:
        print(f"Erro ao listar dados do Excel: {e}")
        return {"registros": [], "total": 0, "total_pages": 1}


def registrar_divergencia(
    guia_id: str, data_execucao: str, codigo_ficha: str, descricao: str
):
    """Registra uma nova divergência encontrada na auditoria"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
        INSERT INTO divergencias (guia_id, data_execucao, codigo_ficha, descricao_divergencia)
        VALUES (?, ?, ?, ?)
        """,
            (guia_id, data_execucao, codigo_ficha, descricao),
        )

        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Erro ao registrar divergência: {e}")
        return None
    finally:
        conn.close()


def contar_protocolos():
    """Retorna o número total de protocolos na tabela protocolos_excel"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM protocolos_excel")
        total = cursor.fetchone()[0]
        conn.close()
        return total
    except sqlite3.Error as e:
        print(f"Erro ao contar protocolos: {e}")
        return 0


def listar_divergencias(limit: int = 100, offset: int = 0, status: str = None):
    """Lista as divergências encontradas com suporte a paginação e filtro por status"""
    conn = None
    try:
        print(
            f"Iniciando listar_divergencias - limit: {limit}, offset: {offset}, status: {status}"
        )
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        where_clause = "WHERE 1=1"
        params = []

        if status:
            where_clause += " AND status = ?"
            params.append(status)

        # Consulta para contar o total de registros
        count_query = f"SELECT COUNT(*) FROM divergencias {where_clause}"
        print(f"Query de contagem: {count_query}")
        cursor.execute(count_query, params)
        total_registros = cursor.fetchone()[0]
        print(f"Total de registros encontrados: {total_registros}")

        # Consulta principal com paginação
        query = f"""
        SELECT id, guia_id, data_execucao, codigo_ficha, descricao_divergencia, status, created_at
        FROM divergencias
        {where_clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        print(f"Query principal: {query}")
        print(f"Parâmetros: {params}")

        cursor.execute(query, params)
        divergencias = cursor.fetchall()
        print(f"Número de divergências retornadas: {len(divergencias)}")

        # Formatar os resultados
        resultados = []
        for div in divergencias:
            resultados.append(
                {
                    "id": div[0],
                    "guia_id": div[1],
                    "data_execucao": div[2],
                    "codigo_ficha": div[3],
                    "descricao_divergencia": div[4],
                    "status": div[5],
                    "data_registro": div[6],
                }
            )

        response = {
            "divergencias": resultados,
            "total": total_registros,
            "paginas": ceil(total_registros / limit) if limit > 0 else 1,
        }
        print(f"Resposta formatada: {response}")
        return response

    except Exception as e:
        print(f"Erro ao listar divergências: {e}")
        return None
    finally:
        if conn:
            conn.close()


def atualizar_status_divergencia(id: int, novo_status: str):
    """Atualiza o status de uma divergência"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
        UPDATE divergencias
        SET status = ?
        WHERE id = ?
        """,
            (novo_status, id),
        )

        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao atualizar status da divergência: {e}")
        return False
    finally:
        conn.close()
