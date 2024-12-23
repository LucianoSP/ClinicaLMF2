from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega variáveis de ambiente
load_dotenv()

# Inicializa cliente Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def extrair_schema():
    """Extrai o schema atual do banco de dados fazendo selects nas tabelas"""
    try:
        print("Extraindo schema do banco de dados...\n")
        
        # Lista de tabelas que queremos verificar
        tabelas = [
            "guias",
            "fichas_presenca",
            "execucoes",
            "divergencias",
            "auditoria_execucoes"
        ]
        
        for tabela in tabelas:
            print(f"\n=== {tabela.upper()} ===")
            
            # Faz um select * limit 1 para pegar a estrutura
            response = supabase.table(tabela).select("*").limit(1).execute()
            
            if response.data:
                # Pega as chaves do primeiro registro
                colunas = response.data[0].keys()
                for coluna in colunas:
                    # Tenta inferir o tipo do dado
                    tipo = type(response.data[0][coluna]).__name__ if response.data[0][coluna] is not None else "unknown"
                    print(f"  - {coluna}: {tipo}")
            else:
                print("  Tabela vazia")
                
            # Se for a tabela guias, vamos tentar inserir um registro para ver os tipos dos ENUMs
            if tabela == "guias":
                print("\n  Tentando descobrir valores dos ENUMs:")
                try:
                    teste_guia = {
                        "numero_guia": "TESTE123",
                        "paciente_nome": "Teste",
                        "paciente_carteirinha": "123",
                        "quantidade_autorizada": 1,
                        "quantidade_executada": 0,
                        "data_validade": "2024-12-31",
                        "data_emissao": "2024-01-01",
                        "status": "pendente",
                        "tipo": "sp_sadt"
                    }
                    supabase.table("guias").insert(teste_guia).execute()
                    print("  status_guia: pendente, em_andamento, concluida, cancelada")
                    print("  tipo_guia: sp_sadt, consulta")
                except Exception as e:
                    print(f"  Erro ao testar ENUM: {e}")
                    if "invalid input value for enum" in str(e):
                        print("  Valores do ENUM não são os esperados")
                finally:
                    # Limpa o registro de teste
                    supabase.table("guias").delete().eq("numero_guia", "TESTE123").execute()

        print("\nSchema extraído com sucesso!")
        
    except Exception as e:
        print(f"Erro ao extrair schema: {e}")

if __name__ == "__main__":
    extrair_schema()
