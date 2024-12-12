import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Cria o cliente do Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# Função auxiliar para testar a conexão
def test_connection():
    try:
        # Tenta fazer uma query simples
        response = supabase.table("protocolos_excel").select("*").limit(1).execute()
        print("Conexão com Supabase estabelecida com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao conectar com Supabase: {e}")
        return False
