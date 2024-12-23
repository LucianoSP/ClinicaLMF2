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


def limpar_tabelas():
    """Limpa as tabelas na ordem correta para evitar problemas de foreign key"""
    print("Limpando tabelas...")

    # Ordem de limpeza respeitando foreign keys
    tabelas = [
        "divergencias",
        "execucoes",
        "fichas_presenca",
        "guias",
        "carteirinhas",
        "pacientes",
        "planos_saude",
    ]

    for tabela in tabelas:
        print(f"Limpando tabela {tabela}...")
        supabase.table(tabela).delete().neq(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()


def popular_dados():
    """Popula as tabelas com dados de teste"""
    print("Populando tabelas com dados de teste...")

    # Primeiro criamos os pacientes
    pacientes = [
        {"nome": "João Silva", "carteirinha": "123456"},
        {"nome": "Maria Santos", "carteirinha": "789012"},
        {"nome": "Pedro Oliveira", "carteirinha": "345678"},
        {"nome": "Ana Costa", "carteirinha": "901234"},
        {"nome": "Lucas Ferreira", "carteirinha": "567890"},
        {"nome": "Julia Lima", "carteirinha": "234567"},
    ]

    pacientes_ids = {}
    for paciente in pacientes:
        print(f"Criando paciente {paciente['nome']}...")
        response = supabase.table("pacientes").insert(paciente).execute()
        pacientes_ids[paciente["nome"]] = response.data[0]["id"]

    # Criamos os planos de saúde
    planos_saude = [
        {"id": "550e8400-e29b-41d4-a716-446655440000", "nome": "Plano Exemplo"}
    ]

    for plano in planos_saude:
        print(f"Criando plano de saúde {plano['nome']}...")
        supabase.table("planos_saude").insert(plano).execute()

    # Depois criamos as carteirinhas
    carteirinhas = [
        {
            "numero_carteirinha": "123456",
            "paciente_id": pacientes_ids["João Silva"],
            "plano_saude_id": "550e8400-e29b-41d4-a716-446655440000",
            "data_validade": "2024-12-31",
            "titular": True,
        },
        {
            "numero_carteirinha": "789012",
            "paciente_id": pacientes_ids["Maria Santos"],
            "plano_saude_id": "550e8400-e29b-41d4-a716-446655440000",
            "data_validade": "2024-12-31",
            "titular": True,
        },
        {
            "numero_carteirinha": "345678",
            "paciente_id": pacientes_ids["Pedro Oliveira"],
            "plano_saude_id": "550e8400-e29b-41d4-a716-446655440000",
            "data_validade": "2024-12-31",
            "titular": False,
            "nome_titular": "José Oliveira",
        },
        {
            "numero_carteirinha": "901234",
            "paciente_id": pacientes_ids["Ana Costa"],
            "plano_saude_id": "550e8400-e29b-41d4-a716-446655440000",
            "data_validade": "2024-12-31",
            "titular": True,
        },
        {
            "numero_carteirinha": "567890",
            "paciente_id": pacientes_ids["Lucas Ferreira"],
            "plano_saude_id": "550e8400-e29b-41d4-a716-446655440000",
            "data_validade": "2024-12-31",
            "titular": True,
        },
        {
            "numero_carteirinha": "234567",
            "paciente_id": pacientes_ids["Julia Lima"],
            "plano_saude_id": "550e8400-e29b-41d4-a716-446655440000",
            "data_validade": "2024-12-31",
            "titular": True,
        },
    ]

    for carteirinha in carteirinhas:
        print(f"Criando carteirinha {carteirinha['numero_carteirinha']}...")
        supabase.table("carteirinhas").insert(carteirinha).execute()

    # Criamos as guias
    guias = [
        {
            "numero_guia": "GUIA001/2024",
            "data_emissao": "2024-01-01",
            "data_validade": "2024-12-31",
            "tipo": "sp_sadt",
            "status": "em_andamento",
            "paciente_carteirinha": "123456",
            "paciente_nome": "João Silva",
            "quantidade_autorizada": 4,
            "quantidade_executada": 0,
            "procedimento_codigo": "50000470",
            "procedimento_nome": "CONSULTA AMBULATORIAL",
            "profissional_solicitante": "DR. SILVA",
            "profissional_executante": "DRA. MARIA",
        },
        {
            "numero_guia": "GUIA002/2024",
            "data_emissao": "2024-01-01",
            "data_validade": "2024-12-31",
            "tipo": "sp_sadt",
            "status": "em_andamento",
            "paciente_carteirinha": "789012",
            "paciente_nome": "Maria Santos",
            "quantidade_autorizada": 4,
            "quantidade_executada": 0,
            "procedimento_codigo": "50000470",
            "procedimento_nome": "CONSULTA AMBULATORIAL",
        },
        {
            "numero_guia": "GUIA003/2024",
            "data_emissao": "2024-01-01",
            "data_validade": "2024-12-31",
            "tipo": "sp_sadt",
            "status": "em_andamento",
            "paciente_carteirinha": "345678",
            "paciente_nome": "Pedro Oliveira",
            "quantidade_autorizada": 4,
            "quantidade_executada": 0,
            "procedimento_codigo": "50000470",
            "procedimento_nome": "CONSULTA AMBULATORIAL",
        },
        {
            "numero_guia": "GUIA004/2024",
            "data_emissao": "2024-01-01",
            "data_validade": "2024-12-31",
            "tipo": "sp_sadt",
            "status": "em_andamento",
            "paciente_carteirinha": "901234",
            "paciente_nome": "Ana Costa",
            "quantidade_autorizada": 4,
            "quantidade_executada": 0,
            "procedimento_codigo": "50000470",
            "procedimento_nome": "CONSULTA AMBULATORIAL",
        },
        {
            "numero_guia": "GUIA005/2024",
            "data_emissao": "2023-01-01",
            "data_validade": "2024-01-01",  # Guia vencida
            "tipo": "sp_sadt",
            "status": "cancelada",
            "paciente_carteirinha": "567890",
            "paciente_nome": "Lucas Ferreira",
            "quantidade_autorizada": 4,
            "quantidade_executada": 0,
            "procedimento_codigo": "50000470",
            "procedimento_nome": "CONSULTA AMBULATORIAL",
        },
        {
            "numero_guia": "GUIA006/2024",
            "data_emissao": "2024-01-01",
            "data_validade": "2024-12-31",
            "tipo": "sp_sadt",
            "status": "em_andamento",
            "paciente_carteirinha": "234567",
            "paciente_nome": "Julia Lima",
            "quantidade_autorizada": 4,
            "quantidade_executada": 5,  # Quantidade excedida
            "procedimento_codigo": "50000470",
            "procedimento_nome": "CONSULTA AMBULATORIAL",
        },
    ]

    for guia in guias:
        print(f"Criando guia {guia['numero_guia']}...")
        supabase.table("guias").insert(guia).execute()

    # Criamos as fichas de presença
    fichas = [
        {
            "data_atendimento": "2024-01-10",  # Mesma data da execução
            "paciente_carteirinha": "123456",
            "paciente_nome": "João Silva",
            "numero_guia": "GUIA001/2024",
            "codigo_ficha": "FICHA001/2024",
            "possui_assinatura": True,
            "arquivo_digitalizado": "ficha001.pdf",
        },
        {
            "data_atendimento": None,  # Data de atendimento não preenchida
            "paciente_carteirinha": "789012",
            "paciente_nome": "Maria Santos",
            "numero_guia": "GUIA002/2024",
            "codigo_ficha": "FICHA002/2024",
            "possui_assinatura": False,
            "arquivo_digitalizado": "ficha002.pdf",
        },
        {
            "data_atendimento": "2024-01-14",  # Data diferente da execução (13/01)
            "paciente_carteirinha": "901234",
            "paciente_nome": "Ana Costa",
            "numero_guia": "GUIA004/2024",
            "codigo_ficha": "FICHA004/2024",
            "possui_assinatura": True,
            "arquivo_digitalizado": "ficha004.pdf",
        },
        {
            "data_atendimento": None,  # Outra ficha sem data de atendimento
            "paciente_carteirinha": "567890",
            "paciente_nome": "Lucas Ferreira",
            "numero_guia": "GUIA005/2024",
            "codigo_ficha": "FICHA005/2024",
            "possui_assinatura": True,
            "arquivo_digitalizado": "ficha005.pdf",
        },
        {
            "data_atendimento": "2024-01-15",
            "paciente_carteirinha": "234567",
            "paciente_nome": "Julia Lima",
            "numero_guia": "GUIA006/2024",
            "codigo_ficha": "FICHA006/2024",
            "possui_assinatura": True,
            "arquivo_digitalizado": "ficha006.pdf",
        },
    ]

    for ficha in fichas:
        print(f"Criando ficha {ficha['codigo_ficha']}...")
        supabase.table("fichas_presenca").insert(ficha).execute()

    # Criamos as execuções
    execucoes = [
        {
            "numero_guia": "GUIA001/2024",
            "paciente_nome": "João Silva",
            "data_execucao": "2024-01-10",
            "paciente_carteirinha": "123456",
            "codigo_ficha": "FICHA001/2024",
            "paciente_id": pacientes_ids["João Silva"]
        },
        {
            "numero_guia": "GUIA002/2024",
            "paciente_nome": "Maria Santos",
            "data_execucao": None,  # Data de execução não preenchida
            "paciente_carteirinha": "789012",
            "codigo_ficha": "FICHA002/2024",
            "paciente_id": pacientes_ids["Maria Santos"]
        },
        {
            "numero_guia": "GUIA003/2024",
            "paciente_nome": "Pedro Oliveira",
            "data_execucao": None,  # Outra execução sem data
            "paciente_carteirinha": "345678",
            "paciente_id": pacientes_ids["Pedro Oliveira"]
        },
        {
            "numero_guia": "GUIA004/2024",
            "paciente_nome": "Ana Costa",
            "data_execucao": "2024-01-13",
            "paciente_carteirinha": "901234",
            "codigo_ficha": "FICHA004/2024",
            "paciente_id": pacientes_ids["Ana Costa"]
        },
        {
            "numero_guia": "GUIA005/2024",
            "paciente_nome": "Lucas Ferreira",
            "data_execucao": "2024-01-14",
            "paciente_carteirinha": "567890",
            "codigo_ficha": "FICHA005/2024",
            "paciente_id": pacientes_ids["Lucas Ferreira"]
        },
        {
            "numero_guia": "GUIA006/2024",
            "paciente_nome": "Julia Lima",
            "data_execucao": None,  # Mais uma execução sem data
            "paciente_carteirinha": "234567",
            "codigo_ficha": "FICHA006/2024",
            "paciente_id": pacientes_ids["Julia Lima"]
        }
    ]

    for execucao in execucoes:
        print(f"Criando execução para guia {execucao['numero_guia']}...")
        supabase.table("execucoes").insert(execucao).execute()

    print("Dados populados com sucesso!")


if __name__ == "__main__":
    limpar_tabelas()
    popular_dados()
