import mysql.connector
from mysql.connector import Error
from typing import Dict, List, Tuple
import json
from datetime import datetime


class DatabaseAnalyzer:
    def __init__(self, host: str, user: str, password: str, database: str, port: int):
        self.connection_params = {
            "host": host,
            "user": user,
            "password": password,
            "database": database,
            "port": port,
        }
        self.connection = None
        self.tables_info = {}

    def connect(self):
        try:
            self.connection = mysql.connector.connect(**self.connection_params)
            print(
                f"Conectado com sucesso ao banco {self.connection_params['database']}"
            )
        except Error as e:
            print(f"Erro ao conectar ao MySQL: {e}")
            raise

    def get_tables(self) -> List[str]:
        cursor = self.connection.cursor()
        # Modificado para pegar apenas tabelas base, excluindo views
        cursor.execute(
            """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_type = 'BASE TABLE'
        """,
            (self.connection_params["database"],),
        )
        tables = [table[0] for table in cursor.fetchall()]
        cursor.close()
        return tables

    def get_table_structure(self, table_name: str) -> List[Dict]:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(f"DESCRIBE {table_name}")
        columns = cursor.fetchall()
        cursor.close()
        return columns

    def get_foreign_keys(self, table_name: str) -> List[Dict]:
        cursor = self.connection.cursor(dictionary=True)
        query = """
        SELECT 
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
            TABLE_SCHEMA = %s
            AND TABLE_NAME = %s
            AND REFERENCED_TABLE_NAME IS NOT NULL
        """
        cursor.execute(query, (self.connection_params["database"], table_name))
        foreign_keys = cursor.fetchall()
        cursor.close()
        return foreign_keys

    def analyze_database(self):
        self.connect()
        tables = self.get_tables()

        for table in tables:
            print(f"\nAnalisando tabela: {table}")

            structure = self.get_table_structure(table)
            foreign_keys = self.get_foreign_keys(table)

            self.tables_info[table] = {
                "columns": structure,
                "foreign_keys": foreign_keys,
            }

    def generate_mermaid(self) -> str:
        mermaid = ["```mermaid", "erDiagram"]

        # Primeiro, adiciona todas as tabelas
        for table, info in self.tables_info.items():
            table_def = [f"    {table} {{"]

            # Adiciona as colunas
            for column in info["columns"]:
                # Simplifica o tipo de dado para evitar problemas de sintaxe
                field_type = column["Type"].split("(")[0].replace(" ", "_")
                key_type = "string"
                if "int" in field_type.lower():
                    key_type = "number"
                elif "char" in field_type.lower() or "text" in field_type.lower():
                    key_type = "string"
                elif "date" in field_type.lower():
                    key_type = "date"
                elif "decimal" in field_type.lower() or "float" in field_type.lower():
                    key_type = "float"

                key = "PK" if column["Key"] == "PRI" else ""
                if key:
                    table_def.append(f"        {key_type} {column['Field']} PK")
                else:
                    table_def.append(f"        {key_type} {column['Field']}")

            table_def.append("    }")
            mermaid.extend(table_def)

        # Depois, adiciona os relacionamentos
        for table, info in self.tables_info.items():
            for fk in info["foreign_keys"]:
                referenced_table = fk["REFERENCED_TABLE_NAME"]
                # Adicionando espaços antes e depois da relação
                mermaid.append(f"    {table} |o--|| {referenced_table} : references")

        mermaid.append("```")
        mermaid_str = "\n".join(mermaid)

        # Salva o diagrama Mermaid em um arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"db_diagram_{timestamp}.md"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(mermaid_str)

        print(f"\nDiagrama Mermaid gerado: {filename}")
        return mermaid_str

    def generate_report(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report = {
            "database": self.connection_params["database"],
            "analysis_date": timestamp,
            "tables": self.tables_info,
        }

        # Salva o relatório em formato JSON
        filename = f"db_analysis_{timestamp}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=4, ensure_ascii=False)

        print(f"\nRelatório gerado: {filename}")

        # Imprime um resumo das relações encontradas
        print("\nResumo dos relacionamentos encontrados:")
        for table, info in self.tables_info.items():
            if info["foreign_keys"]:
                print(f"\nTabela: {table}")
                for fk in info["foreign_keys"]:
                    print(
                        f"  - Coluna {fk['COLUMN_NAME']} referencia "
                        f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}"
                    )

    def generate_data_dictionary(self) -> str:
        dictionary = ["# Dicionário de Dados\n"]
        
        # Ordena as tabelas alfabeticamente
        sorted_tables = sorted(self.tables_info.keys())
        
        for table in sorted_tables:
            info = self.tables_info[table]
            
            # Cabeçalho da tabela
            dictionary.append(f"## Tabela: {table}\n")
            
            # Descrição das colunas
            dictionary.append("### Colunas\n")
            dictionary.append("| Coluna | Tipo | Chave | Nulo | Default | Extra |")
            dictionary.append("|--------|------|-------|-------|---------|--------|")
            
            for column in info['columns']:
                key = column.get('Key', '')
                key_type = {
                    'PRI': 'Primária',
                    'MUL': 'Múltipla',
                    'UNI': 'Única'
                }.get(key, '')
                
                null = "Sim" if column['Null'] == 'YES' else "Não"
                default = column.get('Default', '') or 'NULL'
                extra = column.get('Extra', '')
                
                dictionary.append(
                    f"| {column['Field']} | {column['Type']} | {key_type} | {null} | {default} | {extra} |"
                )
            
            # Relacionamentos
            if info['foreign_keys']:
                dictionary.append("\n### Relacionamentos\n")
                dictionary.append("| Coluna | Referencia Tabela | Referencia Coluna |")
                dictionary.append("|--------|-------------------|-------------------|")
                
                for fk in info['foreign_keys']:
                    dictionary.append(
                        f"| {fk['COLUMN_NAME']} | {fk['REFERENCED_TABLE_NAME']} | {fk['REFERENCED_COLUMN_NAME']} |"
                    )
            
            dictionary.append("\n---\n")  # Separador entre tabelas
        
        # Salva o dicionário em um arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data_dictionary_{timestamp}.md"
        
        dictionary_str = "\n".join(dictionary)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(dictionary_str)
        
        print(f"\nDicionário de dados gerado: {filename}")
        return dictionary_str

if __name__ == "__main__":
    config = {
        "host": "64.23.148.2",
        "port": 3306,
        "user": "luciano_pacheco",
        "password": "0&)9qB37W1uK",
        "database": "abalarissa_db",
    }

    analyzer = DatabaseAnalyzer(**config)

    try:
        analyzer.analyze_database()
        analyzer.generate_report()
        analyzer.generate_mermaid()
        analyzer.generate_data_dictionary()  # Gerando o dicionário de dados
    except Error as e:
        print(f"Erro durante a análise: {e}")
    finally:
        if analyzer.connection and analyzer.connection.is_connected():
            analyzer.connection.close()
            print("\nConexão com o banco de dados fechada.")
