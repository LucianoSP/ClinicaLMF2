import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)



# Função auxiliar para testar a conexão
def test_connection():
    if not supabase:
        print("Supabase não configurado")
        return False

    try:
        # Tenta fazer uma query simples
        response = supabase.table("protocolos_excel").select("*").limit(
            1).execute()
        print("Conexão com Supabase estabelecida com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao conectar com Supabase: {e}")
        return False
