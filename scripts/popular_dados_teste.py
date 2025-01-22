from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

# Carrega variáveis de ambiente
load_dotenv()

# Configurações do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def limpar_protocolos_excel() -> bool:
    """Limpa a tabela de execucoes."""
    try:
        supabase.table("execucoes").delete().execute()
        print("Tabela execucoes limpa com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao limpar tabela execucoes: {e}")
        return False

def limpar_tabelas():
    """Limpa todas as tabelas na ordem correta"""
    print("Limpando tabelas...")
    
    # Ordem de limpeza respeitando foreign keys
    tabelas = [
        "divergencias",
        "execucoes", 
        "sessoes",
        "fichas_presenca",
        "guias",
        "carteirinhas",
        "pacientes",
        "planos_saude",
        "usuarios"
    ]
    
    for tabela in tabelas:
        try:
            print(f"Limpando tabela {tabela}...")
            # Usando o padrão correto para UUID
            supabase.table(tabela).delete().gt(
                "id", "00000000-0000-0000-0000-000000000000"
            ).execute()
            print(f"Tabela {tabela} limpa com sucesso!")
        except Exception as e:
            print(f"Erro ao limpar tabela {tabela}: {e}")
            continue

def criar_dados_teste():
    """Cria dados de teste com todos os cenários possíveis"""
    try:
        hoje = datetime.now()
        
        # 1. Criar usuário administrador
        usuario = {
            "id": str(uuid.uuid4()),  # Gera UUID
            "nome": "Admin Teste",
            "email": "admin@teste.com",
            "tipo_usuario": "admin"
        }
        usuario_result = supabase.table("usuarios").insert(usuario).execute()
        usuario_id = usuario_result.data[0]["id"]
        print(f"Usuário criado: {usuario_id}")

        # 2. Criar plano de saúde
        plano = {
            "id": str(uuid.uuid4()),  # Gera UUID
            "codigo": "UNIMED001",
            "nome": "UNIMED TESTE"
        }
        plano_result = supabase.table("planos_saude").insert(plano).execute()
        plano_id = plano_result.data[0]["id"]
        print(f"Plano criado: {plano_id}")

        # 3. Criar paciente de teste
        paciente = {
            "id": str(uuid.uuid4()),  # Gera UUID
            "nome": "João da Silva",
            "cpf": "12345678901",
            "data_nascimento": "1980-01-01"
        }
        paciente_result = supabase.table("pacientes").insert(paciente).execute()
        paciente_id = paciente_result.data[0]["id"]
        print(f"Paciente criado: {paciente_id}")

        # 4. Criar carteirinha
        carteirinha = {
            "id": str(uuid.uuid4()),  # Gera UUID
            "paciente_id": paciente_id,
            "plano_saude_id": plano_id,
            "numero_carteirinha": "12345678",
            "data_validade": (hoje + timedelta(days=365)).date().isoformat()
        }
        carteirinha_result = supabase.table("carteirinhas").insert(carteirinha).execute()
        print("Carteirinha criada")

        # 5. Criar guia
        guia = {
            "id": str(uuid.uuid4()),  # Gera UUID
            "numero_guia": "GUIA001/2024",
            "data_emissao": hoje.date().isoformat(),
            "data_validade": (hoje + timedelta(days=30)).date().isoformat(),
            "tipo": "sp_sadt",
            "status": "em_andamento",
            "paciente_nome": paciente["nome"],
            "paciente_carteirinha": carteirinha["numero_carteirinha"],
            "quantidade_autorizada": 10,
            "procedimento_nome": "FISIOTERAPIA"
        }
        guia_result = supabase.table("guias").insert(guia).execute()
        guia_id = guia_result.data[0]["id"]
        print(f"Guia criada: {guia_id}")

        # 6. Criar ficha de presença
        ficha = {
            "id": str(uuid.uuid4()),  # Gera UUID
            "codigo_ficha": "FICHA001",
            "numero_guia": guia["numero_guia"],
            "paciente_nome": paciente["nome"],
            "paciente_carteirinha": carteirinha["numero_carteirinha"],
            "arquivo_digitalizado": "ficha001.pdf"
        }
        ficha_result = supabase.table("fichas_presenca").insert(ficha).execute()
        ficha_id = ficha_result.data[0]["id"]
        print(f"Ficha criada: {ficha_id}")

        # 7. Criar sessões com diferentes cenários
        for i in range(5):
            data_sessao = (hoje + timedelta(days=i)).date()
            sessao = {
                "id": str(uuid.uuid4()),  # Gera UUID
                "ficha_presenca_id": ficha_id,
                "data_sessao": data_sessao.isoformat(),
                "possui_assinatura": i < 3,  # primeiras 3 com assinatura
                "tipo_terapia": "FISIOTERAPIA",
                "executado": i < 4,  # primeiras 4 executadas
                "data_execucao": data_sessao.isoformat() if i < 4 else None
            }
            sessao_result = supabase.table("sessoes").insert(sessao).execute()
            sessao_id = sessao_result.data[0]["id"]
            
            # 8. Criar execução para sessões executadas
            if sessao["executado"]:
                execucao = {
                    "id": str(uuid.uuid4()),  # Gera UUID
                    "guia_id": guia_id,
                    "sessao_id": sessao_id,
                    "data_execucao": sessao["data_execucao"],
                    "usuario_executante": usuario_id
                }
                supabase.table("execucoes").insert(execucao).execute()
            
            print(f"Sessão {i+1} criada")

        print("Dados de teste criados com sucesso!")
        
    except Exception as e:
        print(f"Erro ao criar dados de teste: {str(e)}")
        raise e

if __name__ == "__main__":
    limpar_tabelas()
    criar_dados_teste()
