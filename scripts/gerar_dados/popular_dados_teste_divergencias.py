from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

# Configuração inicial
load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"),
                                 os.getenv("SUPABASE_KEY"))
hoje = datetime.now()


def criar_dados_base():
    """Cria dados básicos necessários"""
    try:
        # Criar dados na ordem correta respeitando as dependências

        # 1. Criar usuário
        usuario = {
            "id": str(uuid.uuid4()),
            "nome": "Admin Teste",
            "email": "admin@teste.com",
            "tipo_usuario": "admin"
        }
        usuario_result = supabase.table("usuarios").insert(usuario).execute()
        usuario_id = usuario_result.data[0]["id"]
        print(f"Usuário criado: {usuario_id}")

        # 2. Criar plano de saúde
        plano = {
            "id": str(uuid.uuid4()),
            "codigo": "PLANO001",
            "nome": "PLANO TESTE"
        }
        plano_result = supabase.table("planos_saude").insert(plano).execute()
        plano_id = plano_result.data[0]["id"]
        print(f"Plano criado: {plano_id}")

        # 3. Criar paciente
        paciente = {
            "id": str(uuid.uuid4()),
            "nome": "Paciente Teste",
            "cpf": "12345678901"
        }
        paciente_result = supabase.table("pacientes").insert(
            paciente).execute()
        paciente_id = paciente_result.data[0]["id"]
        print(f"Paciente criado: {paciente_id}")

        # 4. Criar carteirinha (precisa existir antes da guia)
        carteirinha = {
            "id": str(uuid.uuid4()),
            "paciente_id": paciente_id,
            "plano_saude_id": plano_id,
            "numero_carteirinha": "CART001",
        }
        carteirinha_result = supabase.table("carteirinhas").insert(
            carteirinha).execute()
        print("Carteirinha criada")

        # 5. Criar guia (agora referenciando a carteirinha)
        guia = {
            "id": str(uuid.uuid4()),
            "numero_guia": "GUIA001",
            "data_emissao": hoje.date().isoformat(),
            "tipo": "sessao",
            "status": "em_andamento",
            "paciente_nome": paciente["nome"],
            "paciente_carteirinha":
            carteirinha["numero_carteirinha"],  # Agora é uma foreign key
            "quantidade_autorizada": 12,
            "procedimento_nome": "FISIOTERAPIA"
        }
        guia_result = supabase.table("guias").insert(guia).execute()
        guia_id = guia_result.data[0]["id"]
        print(f"Guia criada: {guia_id}")

        return usuario_id, guia_id, paciente["nome"], carteirinha[
            "numero_carteirinha"]

    except Exception as e:
        print(f"Erro ao criar dados base: {str(e)}")
        raise e


def criar_cenarios_divergencia(usuario_id, guia_id, paciente_nome,
                               carteirinha):
    """Cria cenários que geram divergências"""

    # Cenário 1: Ficha com data diferente da execução
    ficha1 = {
        "id": str(uuid.uuid4()),
        "codigo_ficha": "FICHA001",
        "numero_guia": "GUIA001",
        "paciente_nome": paciente_nome,
        "paciente_carteirinha": carteirinha,
        "data_atendimento": (hoje - timedelta(days=5)).date().isoformat()
    }
    ficha1_result = supabase.table("fichas_presenca").insert(ficha1).execute()

    # Cenário 2: Ficha sem assinatura
    ficha2 = {
        "id": str(uuid.uuid4()),
        "codigo_ficha": "FICHA002",
        "numero_guia": "GUIA001",
        "paciente_nome": paciente_nome,
        "paciente_carteirinha": carteirinha,
        "data_atendimento": hoje.date().isoformat()
    }
    ficha2_result = supabase.table("fichas_presenca").insert(ficha2).execute()

    # Cenário 3: Ficha com duplicidade
    ficha3 = {
        "id": str(uuid.uuid4()),
        "codigo_ficha": "FICHA003",
        "numero_guia": "GUIA001",
        "paciente_nome": paciente_nome,
        "paciente_carteirinha": carteirinha,
        "data_atendimento": hoje.date().isoformat()
    }
    ficha3_result = supabase.table("fichas_presenca").insert(ficha3).execute()

    # Cenário 4: Execução sem ficha
    ficha4 = {
        "id": str(uuid.uuid4()),
        "codigo_ficha": "FICHA004",
        "numero_guia": "GUIA001",
        "paciente_nome": paciente_nome,
        "paciente_carteirinha": carteirinha,
        "data_atendimento": hoje.date().isoformat()
    }
    ficha4_result = supabase.table("fichas_presenca").insert(ficha4).execute()

    # Criar sessões para cada ficha
    for ficha_result in [
            ficha1_result, ficha2_result, ficha3_result, ficha4_result
    ]:
        ficha_id = ficha_result.data[0]["id"]
        for i in range(3):
            sessao = {
                "id": str(uuid.uuid4()),
                "ficha_presenca_id": ficha_id,
                "data_sessao": (hoje - timedelta(days=i)).date().isoformat(),
                "possui_assinatura": ficha_result.data[0]["codigo_ficha"]
                != "FICHA002",
                "tipo_terapia": "FISIOTERAPIA",
                "executado": True,
                "data_execucao": (hoje - timedelta(days=i)).date().isoformat(),
                "executado_por": usuario_id
            }
            sessao_result = supabase.table("sessoes").insert(sessao).execute()

            # Criar execução (exceto para FICHA004 - cenário sem execução)
            if ficha_result.data[0]["codigo_ficha"] != "FICHA004":
                execucao = {
                    "id":
                    str(uuid.uuid4()),
                    "guia_id":
                    guia_id,
                    "sessao_id":
                    sessao_result.data[0]["id"],
                    "data_execucao":
                    (hoje - timedelta(days=i + 1)).date().isoformat()
                    if ficha_result.data[0]["codigo_ficha"] == "FICHA001" else
                    sessao["data_execucao"],
                    "paciente_nome":
                    paciente_nome,
                    "paciente_carteirinha":
                    carteirinha,
                    "numero_guia":
                    "GUIA001",
                    "codigo_ficha":
                    ficha_result.data[0]["codigo_ficha"],
                    "usuario_executante":
                    usuario_id
                }
                supabase.table("execucoes").insert(execucao).execute()

                # Criar duplicidade para FICHA003
                if ficha_result.data[0]["codigo_ficha"] == "FICHA003":
                    execucao["id"] = str(uuid.uuid4())
                    supabase.table("execucoes").insert(execucao).execute()


def limpar_tabelas():
    """Limpa todas as tabelas"""
    tabelas = [
        "divergencias", "execucoes", "sessoes", "fichas_presenca", "guias",
        "carteirinhas", "pacientes", "planos_saude", "usuarios"
    ]
    for tabela in tabelas:
        try:
            # Adiciona condição WHERE para permitir DELETE
            supabase.table(tabela).delete().neq(
                'id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"Tabela {tabela} limpa com sucesso!")
        except Exception as e:
            print(f"Erro ao limpar tabela {tabela}: {e}")
            continue


if __name__ == "__main__":
    limpar_tabelas()
    usuario_id, guia_id, paciente_nome, carteirinha = criar_dados_base()
    criar_cenarios_divergencia(usuario_id, guia_id, paciente_nome, carteirinha)
    print("Dados de teste criados com sucesso!")
